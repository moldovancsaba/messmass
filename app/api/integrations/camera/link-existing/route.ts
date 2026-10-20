import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';
import { getDb, handleRouteError, jsonSuccess, requireFanmassIntegrationAuth } from '@/lib/fanmassIntegration';
import { provisionCameraEventForProject } from '@/lib/cameraProvision';

export const maxDuration = 60;

// POST /api/integrations/camera/link-existing
// Explicitly attach a verified existing Camera event to its Messmass source
// project, preserving the Camera event and all existing submissions.
export async function POST(request: NextRequest) {
  const authError = requireFanmassIntegrationAuth(request);
  if (authError) return authError;
  try {
    const body = await request.json().catch(() => ({}));
    const messmassEventId = String(body.messmassEventId || '').trim();
    const cameraEventId = String(body.cameraEventId || '').trim();
    const replaceMessmassEventId = body.replaceMessmassEventId ? String(body.replaceMessmassEventId).trim() : undefined;
    if (!ObjectId.isValid(messmassEventId) || !cameraEventId || cameraEventId.length > 128) {
      throw Object.assign(new Error('A valid Messmass event id and Camera event id are required.'), { status: 422, code: 'INVALID_EVENT_LINK' });
    }
    if (replaceMessmassEventId && !ObjectId.isValid(replaceMessmassEventId)) {
      throw Object.assign(new Error('replaceMessmassEventId must be a valid Messmass event id.'), { status: 422, code: 'INVALID_PREVIOUS_EVENT_ID' });
    }

    const db = await getDb();
    const project = await db.collection('projects').findOne({ _id: new ObjectId(messmassEventId) });
    if (!project) throw Object.assign(new Error('Messmass event was not found.'), { status: 404, code: 'EVENT_NOT_FOUND' });

    const existingLink = project.externalRefs?.camera?.eventId;
    if (existingLink && String(existingLink) !== cameraEventId) {
      throw Object.assign(new Error('This Messmass event is already linked to a different Camera event.'), { status: 409, code: 'CAMERA_EVENT_LINK_CONFLICT' });
    }
    if (replaceMessmassEventId) {
      const previousProject = await db.collection('projects').findOne({ _id: new ObjectId(replaceMessmassEventId) });
      if (previousProject) {
        throw Object.assign(new Error('The previous Messmass event still exists; its Camera link cannot be replaced.'), { status: 409, code: 'PREVIOUS_EVENT_STILL_EXISTS' });
      }
    }

    const result = await provisionCameraEventForProject(db, project, { cameraEventId, replaceMessmassEventId });
    if (!result.provisioned) {
      throw Object.assign(new Error(`Camera event link was not completed: ${result.reason || 'unknown'}.`), { status: 409, code: 'CAMERA_EVENT_LINK_FAILED' });
    }
    return jsonSuccess({ messmassEventId, cameraEventId: result.cameraEventId, linked: true });
  } catch (err) {
    return handleRouteError(err);
  }
}
