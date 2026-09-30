'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import EditorDashboard from '../../../components/EditorDashboard';
import PagePasswordLogin, { clearAuthentication } from '@/components/PagePasswordLogin';
import { useReportStyle } from '@/hooks/useReportStyle';
import { createResponseOrder, type AccessCheckResult, type ResponseOrder } from '@/lib/editorSaveQueue';
import styles from '@/app/styles/editor-states.module.css';

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  styleIdEnhanced?: string; // Reference to page_styles_enhanced collection
  partner1?: { _id: string; name: string; emoji: string; logoUrl?: string; clickerSetId?: string };
  partner2?: { _id: string; name: string; emoji: string; logoUrl?: string; clickerSetId?: string };
  // WHAT: Flexible stats object to support all variables including new ones
  // WHY: Variables are dynamic and managed in database (variables_metadata)
  // HOW: Use index signature to allow any numeric stat field
  stats: {
    // Core required fields
    remoteImages: number;
    hostessImages: number;
    selfies: number;
    indoor: number;
    outdoor: number;
    stadium: number;
    female: number;
    male: number;
    genAlpha: number;
    genYZ: number;
    genX: number;
    boomer: number;
    merched: number;
    jersey: number;
    scarf: number;
    flags: number;
    baseballCap: number;
    other: number;
    // All other stats are optional and dynamic
    [key: string]: number | undefined;
  };
  createdAt: string;
  updatedAt: string;
}

// 'read-only': loaded, but the server said this caller cannot save (canSave: false).
// 'link-required': 403 EDIT_LINK_REQUIRED -- opened by event id, not the edit link.
// 'superseded': a newer load answered first; this answer was dropped.
type LoadResult = 'ok' | 'read-only' | 'password-required' | 'link-required' | 'error' | 'superseded';

interface LoadedProject {
  project: Project;
  fetchStartedAt: number;
  canSave?: boolean;
}

export default function EditPage() {
  const params = useParams();
  const slug = params?.slug as string;

  // WHAT: The server answered 401 PAGE_PASSWORD_REQUIRED.
  // WHY: Before the editor has loaded, this shows the full-page prompt. Once it
  //     has loaded, the same full-page prompt replaces it on screen while the
  //     editor stays mounted (hidden), so its unsaved changes survive while the
  //     operator unlocks.
  const [needsPassword, setNeedsPassword] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // 'link-required' has its own instruction; the "might not exist" line would contradict it.
  const [errorKind, setErrorKind] = useState<'link-required' | 'other'>('other');
  const [loaded, setLoaded] = useState<LoadedProject | null>(null);
  const project = loaded?.project ?? null;
  const hasProjectRef = useRef(false);
  // The copy most recently handed to the editor, and the load that produced it.
  const loadedRef = useRef<{ copy: LoadedProject; ticket: number } | null>(null);
  // The element around the editor (see commitFocusedField).
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  // Editors waiting for the password prompt to be passed (see requestAccess).
  const accessWaitersRef = useRef<Array<(result: AccessCheckResult) => void>>([]);
  // WHAT: Numbers every load; an answer older than one already applied is dropped.
  // WHY: Loads overlap (tab focus, access re-check after a refused save, a
  //     reload after a sheet pull) and answer in either order. Applying an
  //     older copy last would hand the editor data it already moved past, and
  //     its next save would write that older data back.
  const orderRef = useRef<ResponseOrder | null>(null);
  if (orderRef.current === null) orderRef.current = createResponseOrder();

  // WHAT: Record the field being edited, before the editor turns read-only or
  //     is hidden behind the password prompt.
  // WHY: Manual numbers, texts and report texts are recorded when their field
  //     loses focus. Turning the editor read-only disables that field (or, for
  //     Report Content, hides it), and the blur the browser may fire while
  //     React updates the page is not handled (React ignores events while it
  //     commits), so the value on screen was not recorded: not in the draft,
  //     not in the count the read-only notice gives. Same as the partner
  //     editor's page (PartnerEditClient).
  // HOW: Blur the focused element inside the editor first, while React still
  //     handles the blur; the editor records the value like any other change
  //     (draft, then save queue), and the notice counts it.
  const commitFocusedField = useCallback(() => {
    const shell = editorShellRef.current;
    const focused = typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null);
    if (shell && focused && focused !== shell && shell.contains(focused)) focused.blur();
  }, []);

  const loadProjectForEditing = useCallback(async (): Promise<{ result: LoadResult; ticket: number }> => {
    const order = orderRef.current as ResponseOrder;
    const ticket = order.next();
    if (!slug) {
      console.error('❌ No slug provided to edit page');
      setError('Invalid edit link - missing project identifier');
      setErrorKind('other');
      setLoading(false);
      return { result: 'error', ticket };
    }

    const fetchStartedAt = Date.now();
    try {
      const response = await fetch(`/api/projects/edit/${slug}`, { cache: 'no-store' });
      const data = await response.json().catch(() => null);

      // The server enforces the edit password now; its grant can expire while
      // this tab's sessionStorage flag survives. Re-prompt rather than error.
      if (response.status === 401 && data?.code === 'PAGE_PASSWORD_REQUIRED') {
        if (!order.accept(ticket)) return { result: 'superseded', ticket };
        clearAuthentication(slug, 'edit');
        if (hasProjectRef.current) commitFocusedField();
        setNeedsPassword(true);
        setLoading(false);
        return { result: 'password-required', ticket };
      }

      // Opened by the event id instead of the edit link: this address never
      // carries save access. Before the editor loads, the error card shows the
      // server's instruction. Over a loaded editor (a signed-in session that
      // ended, a grant that expired), the editor turns read-only and its notice
      // says what to do -- the server will not take this caller's saves.
      if (response.status === 403 && data?.code === 'EDIT_LINK_REQUIRED') {
        if (!order.accept(ticket)) return { result: 'superseded', ticket };
        const current = loadedRef.current;
        if (!hasProjectRef.current) {
          setError(data?.error || 'Open the event edit link to edit this event.');
          setErrorKind('link-required');
        } else if (current && current.copy.canSave !== false) {
          commitFocusedField();
          const copy: LoadedProject = { ...current.copy, canSave: false };
          loadedRef.current = { copy, ticket: current.ticket };
          setLoaded(copy);
        }
        setLoading(false);
        return { result: 'link-required', ticket };
      }

      if (response.ok && data?.success) {
        if (!order.accept(ticket)) return { result: 'superseded', ticket };
        hasProjectRef.current = true;
        // canSave: the server's own answer to "may this caller save?" (absent
        // from older responses; the editor then assumes yes).
        const canSave = typeof data.canSave === 'boolean' ? data.canSave : undefined;
        // An editor on screen that could save is about to turn read-only.
        const shown = loadedRef.current;
        if (canSave === false && shown && shown.copy.canSave !== false) commitFocusedField();
        const copy: LoadedProject = { project: data.project, fetchStartedAt, canSave };
        loadedRef.current = { copy, ticket };
        setLoaded(copy);
        setError(null);
        setLoading(false);
        return { result: canSave === false ? 'read-only' : 'ok', ticket };
      }

      console.error('❌ API returned error:', data?.error || response.status);
      // A failed RE-fetch must not swap a working editor for the error card:
      // that would unmount it and drop its unsaved changes.
      if (!hasProjectRef.current) {
        setError(data?.error || 'Project not found');
        setErrorKind('other');
      }
      setLoading(false);
      return { result: 'error', ticket };
    } catch (err) {
      console.error('🔥 Exception in loadProjectForEditing:', err);
      if (!hasProjectRef.current) {
        setError('Failed to load project for editing');
        setErrorKind('other');
      }
      setLoading(false);
      return { result: 'error', ticket };
    }
  }, [slug, commitFocusedField]);

  // WHAT: Re-establish save access after the editor's save got a 401.
  // WHY: Saves are authorised separately from this page's load. Loading the
  //     project again lets the server re-issue this page's access grant; if it
  //     asks for the password instead, the prompt replaces the editor on screen
  //     and this resolves once it is passed, with what the load after the
  //     unlock says (see handleLoginSuccess). The editor keeps its data
  //     throughout (the load never overwrites unsaved local stats) and resumes
  //     saving.
  // RETURNS: 'granted' when saving may be retried; 'blocked' when this page
  //     cannot save whatever it retries (opened by event id, or the server
  //     says this caller may not save) -- the editor then tells the operator to
  //     open the event edit link; 'retry' when access could not be checked, or
  //     a newer load answered first (the editor tries again later).
  const requestAccess = useCallback(async (): Promise<AccessCheckResult> => {
    const { result } = await loadProjectForEditing();
    switch (result) {
      case 'ok':
        return 'granted';
      case 'password-required':
        return new Promise<AccessCheckResult>((resolve) => {
          accessWaitersRef.current.push(resolve);
        });
      case 'read-only':
      case 'link-required':
        return 'blocked';
      default:
        return 'retry';
    }
  }, [loadProjectForEditing]);

  // WHAT: Load the event again for the editor and hand it the copy (after a
  //     sheet pull). The copy also reaches the editor as a prop; the editor
  //     applies each copy once.
  // RETURNS: the newest copy at least as new as this load, or null when it
  //     could not be loaded.
  const reloadProject = useCallback(async (): Promise<LoadedProject | null> => {
    const { result, ticket } = await loadProjectForEditing();
    const latest = loadedRef.current;
    if (result === 'ok' || result === 'read-only') return latest?.copy ?? null;
    if (result === 'superseded' && latest && latest.ticket > ticket) return latest.copy;
    return null;
  }, [loadProjectForEditing]);

  // WHAT: Apply report style colors to edit page
  // WHY: Edit pages should use same 26-color system as reports
  // HOW: useReportStyle fetches and injects CSS variables when project has styleId
  const { loading: styleLoading } = useReportStyle({ 
    styleId: project?.styleIdEnhanced ? String(project.styleIdEnhanced) : null,
    enabled: !!project // Only fetch after project is loaded
  });

  // Load on mount.
  useEffect(() => {
    // Ask the server, not sessionStorage. This used to read a
    // sessionStorage flag and render the password prompt whenever it was
    // absent -- which is always, on a first visit -- so an event with NO
    // password configured showed a gate that could not be passed (F-013).
    // loadProjectForEditing already handles the 401
    // PAGE_PASSWORD_REQUIRED that a genuinely protected page returns, and
    // that is now what raises the gate.
    loadProjectForEditing();
  }, [loadProjectForEditing]);

  // WHAT: Auto-reload when page becomes visible (e.g., returning from another tab)
  // WHY: Ensures project data and page style are synced without manual refresh.
  //     Each load also renews this page's 12-hour save grant (the server
  //     re-issues it), and a successful load resumes an editor whose saves were
  //     paused on a 401. EditorDashboard keeps its unsaved local stats over a
  //     re-fetched copy.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !needsPassword) {
        loadProjectForEditing();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [needsPassword, loadProjectForEditing]);

  // Handle successful login
  // WHAT: Unlocked over a loaded editor: load the event again, then answer the
  //     editors waiting on the prompt with what that load says.
  // WHY: The password grant only covers saving when it was entered on the
  //     event's edit link, so whether this caller may now save is the
  //     server's answer (canSave), not the unlock's. The load hands it to the
  //     editor, which becomes editable in place, or stays read-only and says
  //     what to do. Waiting for the load before answering keeps the editor's
  //     saves paused until then, so no save races the load. The editor keeps
  //     its unsaved changes over the loaded copy (EditorDashboard
  //     applyServerCopy).
  const handleLoginSuccess = useCallback(() => {
    setNeedsPassword(false);
    const waiters = accessWaitersRef.current;
    accessWaitersRef.current = [];
    if (hasProjectRef.current) {
      void requestAccess().then((result) => waiters.forEach((resolve) => resolve(result)));
      return;
    }
    // Load data after successful authentication
    loadProjectForEditing();
  }, [loadProjectForEditing, requestAccess]);

  // Show login form if the server asked for the password before anything loaded
  if (!project && needsPassword) {
    return (
      <PagePasswordLogin
        pageId={slug}
        pageType="edit"
        onSuccess={handleLoginSuccess}
      />
    );
  }

  /* What: Loading state while fetching project data
     Why: Show user-friendly loading indicator with context */
  if (!project && loading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.stateCard}>
          <div className="spinner"></div>
          <p className={styles.stateMessage}>Loading project editor...</p>
        </div>
      </div>
    );
  }

  /* What: Error state with flat TailAdmin V2 design
     Why: Modern, clean error card without glass-morphism effects */
  if (!project && error) {
    return (
      <div className={styles.centerContainerColumn}>
        <div className={styles.errorCard}>
          <h1 className={styles.errorHeading}>❌ Access Error</h1>
          <p className={styles.errorTextPrimary}>{error}</p>
          {errorKind !== 'link-required' && (
            <p className={styles.errorTextSecondary}>
              The editing link you&apos;re trying to access might not exist or may have been removed.
            </p>
          )}
          <button 
            onClick={() => window.close()}
            className={styles.closeButton}
          >
            ✕ Close Editor
          </button>
        </div>
      </div>
    );
  }

  /* WHAT: Main editor container using CSS variables from useReportStyle
     WHY: Report style system injects CSS variables automatically
     FEATURES:
     - Uses --heroBackground, --textColor, --fontFamily from injected styles
     - Falls back to page-bg-gray class if no custom style
     - Full viewport height for immersive editing experience
     - Proper integration with EditorDashboard component
     PASSWORD MID-SESSION: The editor stays mounted but hidden (display: none,
     so out of the tab order and the accessibility tree) and the same full-page
     prompt as on first load takes its place. Unmounting it would drop its
     unsaved changes; a prompt layered over it left the editor reachable by
     keyboard and screen reader behind the prompt. */
  if (loaded) {
    return (
      <>
        <div className="page-bg-gray" hidden={needsPassword} ref={editorShellRef}>
          <EditorDashboard
            project={loaded.project}
            fetchStartedAt={loaded.fetchStartedAt}
            canSave={loaded.canSave}
            onRequestAccess={requestAccess}
            onReload={reloadProject}
          />
        </div>
        {needsPassword && (
          <PagePasswordLogin
            pageId={slug}
            pageType="edit"
            onSuccess={handleLoginSuccess}
            description="Enter the editor password to continue saving. Your unsaved changes are kept."
          />
        )}
      </>
    );
  }

  return null;
}
