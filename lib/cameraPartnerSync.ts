// lib/cameraPartnerSync.ts
// WHAT: Receives partner data pushed FROM camera (the reverse of
//     lib/cameraProvision.ts, which pushes messmass partners TO camera).
// WHY: Partners created directly in camera's own admin UI have no messmass
//     equivalent unless something links them. This mirrors camera's own
//     upsertPartner() hybrid-match logic (lib/messmass/provision.ts on the
//     camera side) so both directions behave the same way: link an existing
//     partner by camera id, else by case-insensitive name, else create one.
// LOOP SAFETY: this never calls back into lib/cameraProvision.ts/cameraClient.ts
//     to push the result back to camera -- that's what prevents ping-pong.
//     Partners synced messmass->camera already carry `source: 'messmass'` on
//     camera's side, and camera only pushes back partners where
//     `source !== 'messmass'`, so a messmass-sourced partner can never round-trip.

import getDb from './db';
import { generateUniquePartnerViewSlug } from './partnerIdentifier';
import { syncPartnerToV3Entity } from './v3/syncEngine';

function ci(name: string) {
  return { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
}

function nowIso(): string {
  return new Date().toISOString();
}

async function ensureCameraPartnerIdIndex(db: Awaited<ReturnType<typeof getDb>>) {
  try {
    await db.collection('partners').createIndex({ cameraPartnerId: 1 }, { sparse: true });
  } catch {
    // ignore if exists
  }
}

export async function upsertPartnerFromCamera(input: {
  cameraPartnerId: string;
  name: string;
  logoUrl?: string;
}): Promise<{ id: string; name: string; created: boolean; linked: boolean }> {
  const db = await getDb();
  await ensureCameraPartnerIdIndex(db);
  const name = String(input.name || '').trim();
  const now = nowIso();

  const alreadyLinked = await db.collection('partners').findOne({ cameraPartnerId: input.cameraPartnerId });
  const partner = alreadyLinked || (name ? await db.collection('partners').findOne({ name: ci(name) }) : null);

  if (partner) {
    const set: Record<string, unknown> = { updatedAt: now, cameraPartnerId: input.cameraPartnerId };
    if (alreadyLinked) {
      // WHAT: This partner was linked on a previous call -- keep propagating edits.
      // WHY: The first link (matched by name) intentionally leaves name/logo alone
      //   below, since a name match alone doesn't mean "camera owns this field."
      //   Once linked by id, camera IS the source for its own edits, so sync them.
      if (name) set.name = name;
      if (input.logoUrl) set.logoUrl = input.logoUrl;
    } else if (input.logoUrl && !partner.logoUrl) {
      set.logoUrl = input.logoUrl;
    }
    await db.collection('partners').updateOne({ _id: partner._id }, { $set: set });
    return { id: String(partner._id), name: (set.name as string) || partner.name, created: false, linked: true };
  }

  const viewSlug = await generateUniquePartnerViewSlug(db);
  const partnerData: Record<string, unknown> = {
    name,
    emoji: '📷', // messmass requires an emoji; camera-sourced partners get a default
    hashtags: [],
    categorizedHashtags: {},
    logoUrl: input.logoUrl || undefined,
    viewSlug,
    source: 'camera',
    cameraPartnerId: input.cameraPartnerId,
    createdAt: now,
    updatedAt: now,
  };
  const result = await db.collection('partners').insertOne(partnerData);
  syncPartnerToV3Entity({ ...partnerData, _id: result.insertedId } as any).catch(() => {});
  return { id: String(result.insertedId), name, created: true, linked: false };
}
