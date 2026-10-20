/**
 * messmass -> camera provisioning engine. messmass is the source of truth; these
 * helpers mirror an organisation/partner/event into camera and stamp the camera
 * ids back onto the messmass records (shared identity). Called (fire-and-forget)
 * when a messmass event is created, and available as ops backfill/link helpers.
 */
import { ObjectId, type Db } from 'mongodb';
import { cameraClient, cameraConfigured } from './cameraClient';

export async function ensureCameraOrganization(db: Db, organizationId: ObjectId): Promise<string | undefined> {
  const org = await db.collection('organizations').findOne({ _id: organizationId });
  if (!org) return undefined;
  if (org.cameraOrganizationId) return org.cameraOrganizationId as string;
  const created = await cameraClient.upsertOrganization(org.name, String(org._id));
  await db.collection('organizations').updateOne({ _id: org._id }, { $set: { cameraOrganizationId: created.organizationId } });
  return created.organizationId;
}

export async function ensureCameraPartner(db: Db, partnerId: ObjectId): Promise<string | null> {
  const partner = await db.collection('partners').findOne({ _id: partnerId });
  if (!partner) return null;
  const messmassPartnerId = String(partner._id);
  if (partner.cameraPartnerId) {
    // A stale cameraPartnerId can point at a same-name partner belonging to a
    // different Messmass record. Reuse it only when the shared id confirms it.
    const linked = await cameraClient.findPartners({ messmassPartnerId });
    const exactLink = linked.find((item) => item.partnerId === partner.cameraPartnerId) || linked[0];
    if (exactLink) {
      if (exactLink.partnerId !== partner.cameraPartnerId) {
        await db.collection('partners').updateOne({ _id: partner._id }, { $set: { cameraPartnerId: exactLink.partnerId } });
      }
      return exactLink.partnerId;
    }
  }
  let cameraOrgId: string | undefined;
  if (partner.organizationId instanceof ObjectId) {
    cameraOrgId = await ensureCameraOrganization(db, partner.organizationId);
  }
  const created = await cameraClient.upsertPartner({
    name: partner.name,
    messmassPartnerId,
    organizationId: cameraOrgId,
    logoUrl: partner.logoUrl,
  });
  await db.collection('partners').updateOne({ _id: partner._id }, { $set: { cameraPartnerId: created.partnerId } });
  return created.partnerId;
}

export async function provisionCameraEventForProject(
  db: Db,
  project: Record<string, unknown>,
  options: { cameraEventId?: string; replaceMessmassEventId?: string } = {},
): Promise<{ provisioned: boolean; reason?: string; cameraEventId?: string }> {
  if (!cameraConfigured()) return { provisioned: false, reason: 'camera_not_configured' };
  const projectId = project._id as ObjectId;
  // partner2Id is a valid event relationship when the first partner is absent;
  // partnerIds also covers the newer multi-partner project shape.
  const refs = [
    project.partner1Id,
    project.partnerId,
    project.partner2Id,
    ...(Array.isArray(project.partnerIds) ? project.partnerIds : []),
  ].filter((value) => value !== undefined && value !== null && String(value).trim() !== '');
  if (!refs.length) return { provisioned: false, reason: 'no_partner' };

  let cameraPartnerId: string | null = null;
  let hadValidPartnerId = false;
  for (const ref of refs) {
    const partnerObjectId = ref instanceof ObjectId
      ? ref
      : (ObjectId.isValid(String(ref)) ? new ObjectId(String(ref)) : null);
    if (!partnerObjectId) continue;
    hadValidPartnerId = true;
    const partner = await db.collection('partners').findOne({ _id: partnerObjectId });
    if (!partner) continue;
    cameraPartnerId = await ensureCameraPartner(db, partnerObjectId);
    if (cameraPartnerId) break;
  }
  if (!cameraPartnerId) return { provisioned: false, reason: hadValidPartnerId ? 'partner_unresolved' : 'invalid_partner' };

  const eventName = typeof project.eventName === 'string' && project.eventName.length
    ? project.eventName
    : (typeof project.name === 'string' && project.name.length ? project.name : 'Untitled event');
  const eventDate = project.eventDate instanceof Date
    ? project.eventDate.toISOString()
    : (typeof project.eventDate === 'string' && project.eventDate.length ? project.eventDate : null);
  const event = await cameraClient.provisionEvent({
    messmassEventId: String(projectId),
    partnerId: cameraPartnerId,
    eventName,
    eventDate,
    cameraEventId: options.cameraEventId,
    replaceMessmassEventId: options.replaceMessmassEventId,
  });
  await db.collection('projects').updateOne(
    { _id: projectId },
    { $set: { 'externalRefs.camera': { eventId: event.eventId, mongoId: event.mongoId, provisionedAt: new Date().toISOString() } } },
  );
  return { provisioned: true, cameraEventId: event.eventId };
}

/** Ops: link exact or unlinked same-name partners without stealing another Messmass identity. */
export async function linkExistingPartners(db: Db): Promise<{ linked: number; scanned: number }> {
  if (!cameraConfigured()) return { linked: 0, scanned: 0 };
  const partners = await db.collection('partners').find({ cameraPartnerId: { $exists: false } }).toArray();
  let linked = 0;
  for (const p of partners) {
    try {
      const messmassPartnerId = String(p._id);
      const exact = await cameraClient.findPartners({ messmassPartnerId });
      if (exact.length) {
        await db.collection('partners').updateOne({ _id: p._id }, { $set: { cameraPartnerId: exact[0].partnerId } });
        linked++;
        continue;
      }
      const sameName = await cameraClient.findPartners({ name: p.name });
      if (sameName.some((item) => !item.messmassPartnerId)) {
        const result = await cameraClient.upsertPartner({ name: p.name, messmassPartnerId });
        await db.collection('partners').updateOne({ _id: p._id }, { $set: { cameraPartnerId: result.partnerId } });
        linked++;
      }
    } catch {
      // skip one bad partner, keep going
    }
  }
  return { linked, scanned: partners.length };
}

type ProvisionFailure = { id: string; name: string; error: string };

function failureFor(project: Record<string, unknown>, error: string): ProvisionFailure {
  return { id: String(project._id || ''), name: String(project.eventName || 'Untitled event'), error };
}

/** Backfill Camera mirrors for projects carrying any supported partner reference. */
export async function provisionMissingEvents(
  db: Db,
  limit = 100,
): Promise<{ provisioned: number; scanned: number; failed: number; failures: ProvisionFailure[] }> {
  if (!cameraConfigured()) return { provisioned: 0, scanned: 0, failed: 0, failures: [] };
  const projects = await db.collection('projects')
    .find({
      'externalRefs.camera': { $exists: false },
      $or: [
        { partner1Id: { $exists: true } },
        { partnerId: { $exists: true } },
        { partner2Id: { $exists: true } },
        { 'partnerIds.0': { $exists: true } },
      ],
    })
    .limit(limit).toArray();
  let provisioned = 0;
  const failures: ProvisionFailure[] = [];
  for (const project of projects) {
    try {
      const result = await provisionCameraEventForProject(db, project);
      if (result.provisioned) provisioned++;
      else failures.push(failureFor(project, result.reason || 'unknown'));
    } catch (error) {
      failures.push(failureFor(project, error instanceof Error ? error.message.slice(0, 240) : String(error).slice(0, 240)));
    }
  }
  return { provisioned, scanned: projects.length, failed: failures.length, failures };
}

/** Refresh linked Camera mirrors from Messmass's canonical event and partner fields. */
export async function syncLinkedEvents(
  db: Db,
  limit = 20,
  offset = 0,
): Promise<{ synced: number; scanned: number; failed: number; failures: ProvisionFailure[] }> {
  if (!cameraConfigured()) return { synced: 0, scanned: 0, failed: 0, failures: [] };
  const projects = await db.collection('projects')
    .find({ 'externalRefs.camera.eventId': { $exists: true, $ne: '' } })
    .sort({ _id: 1 })
    .skip(Math.max(0, offset))
    .limit(Math.max(1, Math.min(limit, 20)))
    .toArray();
  let synced = 0;
  const failures: ProvisionFailure[] = [];
  for (const project of projects) {
    try {
      const result = await provisionCameraEventForProject(db, project);
      if (result.provisioned) synced++;
      else failures.push(failureFor(project, result.reason || 'unknown'));
    } catch (error) {
      failures.push(failureFor(project, error instanceof Error ? error.message.slice(0, 240) : String(error).slice(0, 240)));
    }
  }
  return { synced, scanned: projects.length, failed: failures.length, failures };
}
