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
  if (partner.cameraPartnerId) return partner.cameraPartnerId as string;
  let cameraOrgId: string | undefined;
  if (partner.organizationId instanceof ObjectId) {
    cameraOrgId = await ensureCameraOrganization(db, partner.organizationId);
  }
  const created = await cameraClient.upsertPartner({
    name: partner.name,
    messmassPartnerId: String(partner._id),
    organizationId: cameraOrgId,
    logoUrl: partner.logoUrl,
  });
  await db.collection('partners').updateOne({ _id: partner._id }, { $set: { cameraPartnerId: created.partnerId } });
  return created.partnerId;
}

export async function provisionCameraEventForProject(db: Db, project: Record<string, unknown>): Promise<{ provisioned: boolean; reason?: string; cameraEventId?: string }> {
  if (!cameraConfigured()) return { provisioned: false, reason: 'camera_not_configured' };
  const projectId = project._id as ObjectId;
  const partnerRef = (project.partner1Id as ObjectId | string | undefined) || (project.partnerId as ObjectId | string | undefined);
  if (!partnerRef) return { provisioned: false, reason: 'no_partner' };
  const partnerObjId = partnerRef instanceof ObjectId ? partnerRef : (ObjectId.isValid(String(partnerRef)) ? new ObjectId(String(partnerRef)) : null);
  if (!partnerObjId) return { provisioned: false, reason: 'invalid_partner' };

  const cameraPartnerId = await ensureCameraPartner(db, partnerObjId);
  if (!cameraPartnerId) return { provisioned: false, reason: 'partner_unresolved' };

  const event = await cameraClient.provisionEvent({
    messmassEventId: String(projectId),
    partnerId: cameraPartnerId,
    eventName: String(project.eventName || 'Untitled event'),
    eventDate: project.eventDate ? String(project.eventDate) : undefined,
  });
  await db.collection('projects').updateOne(
    { _id: projectId },
    { $set: { 'externalRefs.camera': { eventId: event.eventId, mongoId: event.mongoId, provisionedAt: new Date().toISOString() } } },
  );
  return { provisioned: true, cameraEventId: event.eventId };
}

/** Ops: link messmass partners to existing camera partners by name (no creation). */
export async function linkExistingPartners(db: Db): Promise<{ linked: number; scanned: number }> {
  if (!cameraConfigured()) return { linked: 0, scanned: 0 };
  const partners = await db.collection('partners').find({ cameraPartnerId: { $exists: false } }).toArray();
  let linked = 0;
  for (const p of partners) {
    try {
      const found = await cameraClient.findPartners({ name: p.name });
      if (found.length) {
        await cameraClient.upsertPartner({ name: p.name, messmassPartnerId: String(p._id) });
        await db.collection('partners').updateOne({ _id: p._id }, { $set: { cameraPartnerId: found[0].partnerId } });
        linked++;
      }
    } catch {
      // skip one bad partner, keep going
    }
  }
  return { linked, scanned: partners.length };
}

/** Ops: backfill camera events for projects that have a partner but no camera link. */
export async function provisionMissingEvents(db: Db, limit = 100): Promise<{ provisioned: number; scanned: number }> {
  if (!cameraConfigured()) return { provisioned: 0, scanned: 0 };
  const projects = await db.collection('projects')
    .find({ 'externalRefs.camera': { $exists: false }, $or: [{ partner1Id: { $exists: true } }, { partnerId: { $exists: true } }] })
    .limit(limit).toArray();
  let provisioned = 0;
  for (const project of projects) {
    try {
      const r = await provisionCameraEventForProject(db, project);
      if (r.provisioned) provisioned++;
    } catch {
      // skip one, keep going
    }
  }
  return { provisioned, scanned: projects.length };
}
