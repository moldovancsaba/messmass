import { NextRequest, NextResponse } from 'next/server';
import { isBearerSlug, isPageProtected, requirePageAccessDecision, withPageAccessGrant } from '@/lib/pageAccess';
import { getAdminUser } from '@/lib/auth';
import { hasProjectWriteGrant } from '@/lib/apiGuards';
import { findProjectByEditSlug } from '@/lib/slugUtils';
import { error as logError, info as logInfo, debug as logDebug } from '@/lib/logger';

// GET /api/projects/edit/[slug] - Fetch project by edit slug (editor access)
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  try {
    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug is required' },
        { status: 400 }
      );
    }

    logDebug('Finding project by edit slug', { context: 'projects/edit/[slug]', slugPrefix: slug.substring(0, 8) });

    const project = await findProjectByEditSlug(slug);

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      );
    }

    const editSlug = typeof project.editSlug === 'string' && project.editSlug ? project.editSlug : null;
    const openedByEditSlug = editSlug === slug;
    const projectId = String(project._id);

    // WHAT: Enforce the edit page's password server-side (F-001), across every
    //     address of this editor: the URL slug, the editSlug and the _id.
    // WHY: `edit` is the largest protected page type (304 passwords) and the only
    //     one that fronts data entry, so an unauthenticated read here exposes an
    //     event's full stats to anyone holding the URL. Checked after the lookup
    //     so a password on either address protects both: edit shares were keyed
    //     `editSlug || _id`, so an older password can sit on the _id, and a gate
    //     on the URL slug alone treated the editSlug address as having no
    //     password -- and issued a write grant for it below.
    const access = await requirePageAccessDecision('edit', [slug, editSlug ?? '', projectId]);

    // Resolved at most once, and not at all when the gate already answered it:
    // the gate checks for a session before it refuses.
    let signedIn: boolean | null = !access.allowed ? false : access.via === 'admin' ? true : null;
    const isSignedIn = async (): Promise<boolean> => {
      if (signedIn === null) signedIn = Boolean(await getAdminUser());
      return signedIn;
    };

    // WHAT: A project _id opens the editor only for a signed-in user, or for a
    //     caller holding a current grant for one of this editor's addresses.
    // WHY: findProjectByEditSlug also accepts the project's _id, and its
    //     response hands back the editSlug. The _id is public -- GET
    //     /api/projects/stats/[slug] returns it to every report viewer -- and
    //     the editSlug is what issues a write grant, so this address would
    //     have turned a report link into edit access. A password stored on the
    //     _id itself can still be entered here, so that case gets the
    //     password prompt rather than a dead end.
    if (!openedByEditSlug && !(access.allowed && access.via === 'grant') && !(await isSignedIn())) {
      if (!access.allowed && (await isPageProtected('edit', slug))) return access.response;
      return NextResponse.json(
        {
          success: false,
          error: 'This link uses the event ID. Open the event edit link instead, or sign in.',
          code: 'EDIT_LINK_REQUIRED',
        },
        { status: 403 }
      );
    }
    if (!access.allowed) return access.response;

    // WHAT: Which grants to issue with this response.
    // WHY: PUT /api/projects authorises a non-admin save by an edit grant for
    //     this project's editSlug, and until now only a password minted one --
    //     so an editor with no password opened for its operator and then
    //     refused every save. Issue it whenever this load was allowed because
    //     no address of the editor has a password and the caller used the real
    //     edit link (a UUID nobody can derive from the public _id). Renew a
    //     grant the caller already holds, so an editor left open past 12 hours
    //     keeps saving as long as it re-fetches; the gate lists only grants
    //     newer than the current password, so a grant the password was set or
    //     regenerated to cut off is never renewed. Never issue on the admin
    //     path: the session authorises saves already.
    //     A current grant for the event's _id also earns edit:<editSlug>, the
    //     one grant PUT /api/projects accepts. It passed the gate only because
    //     some address of this editor has a password, and it is newer than the
    //     newest of them -- so it came from entering that password on the _id
    //     address (edit shares were keyed `editSlug || _id`). Without this,
    //     that operator loaded the editor and could not save it.
    const grantPageIds =
      access.via === 'grant'
        ? Array.from(new Set([
            ...access.heldPageIds,
            ...(editSlug && access.heldPageIds.includes(projectId) ? [editSlug] : []),
          ]))
        : access.via === 'unprotected' && openedByEditSlug && isBearerSlug(slug)
          ? [slug]
          : [];

    // WHAT: Will PUT /api/projects accept this caller's saves for this event?
    // WHY: The editor must know at load time, not from a refused save -- the
    //     incident was an editor that loaded, took hours of entries, and stored
    //     none. requireProjectWrite passes an admin session or a current grant
    //     for edit:<editSlug> and nothing else; hasProjectWriteGrant is that
    //     rule, and a grant issued in this response counts when it is keyed to
    //     the editSlug. A legacy edit link that equals the public _id loads but
    //     reports false unless the caller is signed in.
    const canSave =
      (editSlug !== null && (grantPageIds.includes(editSlug) || (await hasProjectWriteGrant(editSlug, projectId)))) ||
      (await isSignedIn());

    logInfo('Found project for editing', { context: 'projects/edit/[slug]', eventName: project.eventName });

    // Format project data for editor access (includes all information for editing)
    const proj = project as any;
    const editableProject = {
      _id: project._id,
      eventName: project.eventName,
      eventDate: project.eventDate,
      hashtags: project.hashtags || [], // Include hashtags to prevent data loss
      categorizedHashtags: project.categorizedHashtags || {}, // Include categorized hashtags for editing
      stats: project.stats,
      viewSlug: project.viewSlug,
      editSlug: project.editSlug,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      partner1: proj.partner1 || undefined,
      partner2: proj.partner2 || undefined,
      googleSheetUuid: proj.googleSheetUuid || undefined,
      partnerId: proj.partnerContext?.partnerId?.toString?.() || proj.partner1Id?.toString?.() || proj.partner1?._id || undefined,
    };

    return withPageAccessGrant(
      NextResponse.json({
        success: true,
        project: editableProject,
        canSave,
      }),
      'edit',
      grantPageIds
    );

  } catch (error) {
    logError('Failed to fetch project by edit slug', { context: 'projects/edit/[slug]', slug }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch project'
      },
      { status: 500 }
    );
  }
}
