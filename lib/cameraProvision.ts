/**
 * messmass -> camera provisioning engine. messmass is the source of truth; these
 * helpers mirror an organisation/partner/event into camera and stamp the camera
 * ids back onto the messmass records (shared identity). Called (fire-and-forget)
 * when a messmass event is created, and available as ops backfill/link helpers.
 */
import { ObjectId, type Db } from 'mongodb';
import { cameraClient, cameraConfigured } from './cameraClient';
import { createEvent, createPartner } from './fanmassMapping';

function ciName(name: string) {
  return { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
}
function slugifyOrgName(name: string): string {
  return name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'org';
}

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

/** Ensure a messmass organisation exists for `name` (one org per partner). */
async function ensureOrganizationByName(db: Db, name: string, dryRun: boolean): Promise<{ org: { _id: ObjectId | null; name: string }; created: boolean }> {
  const existing = await db.collection('organizations').findOne({ name: ciName(name) });
  if (existing) return { org: { _id: existing._id, name: existing.name }, created: false };
  if (dryRun) return { org: { _id: null, name }, created: true };
  const now = new Date().toISOString();
  let slug = slugifyOrgName(name);
  if (await db.collection('organizations').findOne({ slug })) slug = `${slug}-${new ObjectId().toHexString().slice(-6)}`;
  const doc = { name, slug, metadata: {}, source: 'camera-adopt', createdAt: now, updatedAt: now };
  const res = await db.collection('organizations').insertOne(doc);
  return { org: { _id: res.insertedId, name }, created: true };
}

/**
 * Ops: adopt existing camera partners + events UP into messmass (reverse of the
 * usual master→camera flow, for data that predates the integration). Per camera
 * partner: ensure a messmass organisation (one per partner) + partner (match by
 * name else create, stamped with cameraPartnerId), mirror the org into camera and
 * stamp messmassPartnerId back. Per camera event: create a messmass project and
 * stamp the messmass id back onto the existing camera event (no duplicate).
 * Idempotent; pass dryRun to preview without writing.
 */
export async function adoptCameraPartnersAndEvents(db: Db, opts: { dryRun?: boolean; limit?: number } = {}) {
  if (!cameraConfigured()) return { ok: false, reason: 'camera_not_configured' as const };
  const dryRun = Boolean(opts.dryRun);
  const all = await cameraClient.listAdoptableEvents(false);
  const events = typeof opts.limit === 'number' ? all.slice(0, opts.limit) : all;

  const byPartner = new Map<string, { partnerId: string; partnerName: string; events: typeof events }>();
  for (const e of events) {
    const g = byPartner.get(e.partnerId) || { partnerId: e.partnerId, partnerName: e.partnerName || e.partnerId, events: [] as typeof events };
    g.events.push(e);
    byPartner.set(e.partnerId, g);
  }

  const summary = {
    ok: true as const, dryRun,
    orgsCreated: 0, partnersCreated: 0, eventsCreated: 0, eventsReused: 0, eventsAdopted: 0,
    partners: [] as Array<Record<string, unknown>>, errors: [] as Array<Record<string, unknown>>,
  };

  for (const grp of byPartner.values()) {
    try {
      // Resolve org: reuse the partner's existing org if it has one, else one per partner by name.
      const existingPartner = await db.collection('partners').findOne({ name: ciName(grp.partnerName) });
      let orgId: ObjectId | null = (existingPartner?.organizationId as ObjectId) || null;
      let orgCreated = false;
      if (!orgId) {
        const r = await ensureOrganizationByName(db, grp.partnerName, dryRun);
        orgId = r.org._id;
        orgCreated = r.created;
        if (orgCreated) summary.orgsCreated++;
      }

      // Resolve partner: reuse by name, else create; stamp org + cameraPartnerId.
      let mmPartnerId: ObjectId | null = existingPartner?._id || null;
      let partnerCreated = false;
      if (existingPartner) {
        if (!dryRun) {
          const set: Record<string, unknown> = { updatedAt: new Date().toISOString() };
          if (orgId && !existingPartner.organizationId) set.organizationId = orgId;
          if (!existingPartner.cameraPartnerId) set.cameraPartnerId = grp.partnerId;
          if (Object.keys(set).length > 1) await db.collection('partners').updateOne({ _id: existingPartner._id }, { $set: set });
        }
      } else if (!dryRun) {
        const created = await createPartner({ name: grp.partnerName });
        mmPartnerId = new ObjectId(created.id);
        await db.collection('partners').updateOne({ _id: mmPartnerId }, { $set: { organizationId: orgId, cameraPartnerId: grp.partnerId, source: 'camera-adopt', updatedAt: new Date().toISOString() } });
        partnerCreated = true;
        summary.partnersCreated++;
      } else {
        partnerCreated = true;
        summary.partnersCreated++;
      }

      // Mirror the org into camera + stamp messmass ids back onto the existing camera partner.
      if (!dryRun && mmPartnerId) {
        let cameraOrgId: string | undefined;
        if (orgId) { try { cameraOrgId = await ensureCameraOrganization(db, orgId); } catch { /* non-fatal */ } }
        try {
          await cameraClient.upsertPartner({ name: grp.partnerName, messmassPartnerId: String(mmPartnerId), organizationId: cameraOrgId, cameraPartnerId: grp.partnerId });
        } catch (e) { summary.errors.push({ partner: grp.partnerName, step: 'link_camera_partner', error: String(e) }); }
      }

      const evOut: Array<Record<string, unknown>> = [];
      for (const e of grp.events) {
        const existingProj = await db.collection('projects').findOne({ 'externalRefs.camera.eventId': e.eventId }, { projection: { _id: 1 } });
        if (existingProj) { summary.eventsReused++; evOut.push({ event: e.name, messmassEventId: String(existingProj._id), created: false }); continue; }
        if (dryRun) { summary.eventsCreated++; evOut.push({ event: e.name, messmassEventId: null, created: true }); continue; }
        const proj = await createEvent({ eventName: e.name || 'Untitled event', eventDate: e.eventDate || undefined, partner1Id: mmPartnerId ? String(mmPartnerId) : undefined });
        await db.collection('projects').updateOne(
          { _id: new ObjectId(proj.id) },
          { $set: { 'externalRefs.camera': { eventId: e.eventId, adoptedAt: new Date().toISOString() }, source: 'camera-adopt' } },
        );
        summary.eventsCreated++;
        try {
          const adopted = await cameraClient.provisionEvent({ messmassEventId: proj.id, partnerId: grp.partnerId, eventName: e.name || 'Untitled event', eventDate: e.eventDate || undefined, cameraEventId: e.eventId });
          if (adopted.adopted) summary.eventsAdopted++;
        } catch (er) { summary.errors.push({ event: e.name, step: 'stamp_camera_event', error: String(er) }); }
        evOut.push({ event: e.name, messmassEventId: proj.id, created: true });
      }
      summary.partners.push({ name: grp.partnerName, orgId: orgId ? String(orgId) : '(dry-run new)', orgCreated, partnerCreated, events: evOut });
    } catch (err) {
      summary.errors.push({ partner: grp.partnerName, error: String(err) });
    }
  }
  return summary;
}
