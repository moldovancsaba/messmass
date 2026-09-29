'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import PartnerEditorDashboard from '@/components/PartnerEditorDashboard';
import PagePasswordLogin, { clearAuthentication } from '@/components/PagePasswordLogin';
import { useReportStyle } from '@/hooks/useReportStyle';
import { createResponseOrder, type AccessCheckResult, type ResponseOrder } from '@/lib/editorSaveQueue';
import styles from '@/app/styles/editor-states.module.css';

interface Partner {
  _id: string;
  name: string;
  viewSlug?: string;
  emoji: string;
  showEmoji?: boolean;
  logoUrl?: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  styleId?: string;
  reportTemplateId?: string;
  clickerSetId?: string;
  showEventsList?: boolean;
  showEventsListTitle?: boolean;
  showEventsListDetails?: boolean;
  showOnlyTeam1Events?: boolean;
  createdAt: string;
  updatedAt: string;
  stats: {
    [key: string]: string | undefined;
  };
}

interface PartnerEditClientProps {
  slug: string;
  variantSlug?: string | null;
}

// 'read-only': loaded, but the server said this caller cannot save (canSave: false).
// 'superseded': a newer load answered first; this answer was dropped.
type LoadResult = 'ok' | 'read-only' | 'password-required' | 'error' | 'superseded';

interface LoadedPartner {
  partner: Partner;
  fetchStartedAt: number;
  canSave?: boolean;
}

export default function PartnerEditClient({ slug, variantSlug }: PartnerEditClientProps) {
  // The password grant is keyed to the address the editor was opened with.
  const pageId = variantSlug ? `${slug}::variant=${variantSlug}` : slug;

  // WHAT: The server answered 401 PAGE_PASSWORD_REQUIRED.
  // WHY: Before the editor has loaded, this shows the full-page prompt. Once it
  //     has loaded, the same prompt takes its place on screen while the editor
  //     stays mounted (hidden), so its unsaved changes survive the unlock.
  const [needsPassword, setNeedsPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<LoadedPartner | null>(null);
  const partner = loaded?.partner ?? null;
  const hasPartnerRef = useRef(false);
  // The element around the editor, and whether the editor on screen can save
  // (the canSave of the last load applied).
  const editorShellRef = useRef<HTMLDivElement | null>(null);
  const editorCanSaveRef = useRef(false);
  // Editors waiting for the password prompt to be passed (see requestAccess).
  const accessWaitersRef = useRef<Array<(result: AccessCheckResult) => void>>([]);
  // WHAT: Numbers every load; an answer older than one already applied is dropped.
  // WHY: Loads overlap (tab focus, access re-check after a refused save) and
  //     answer in either order. Applying an older copy last would hand the
  //     editor data it already moved past.
  const orderRef = useRef<ResponseOrder | null>(null);
  if (orderRef.current === null) orderRef.current = createResponseOrder();

  // WHAT: Record the field being edited, before the editor turns read-only or
  //     is hidden behind the password prompt.
  // WHY: Report texts and the logo URL are recorded when their field loses
  //     focus. Turning the editor read-only removes or disables that field, and
  //     the blur the browser fires while React updates the page is not handled
  //     (React ignores events while it commits), so the text on screen was not
  //     recorded: not in the draft, not in the count the read-only notice gives.
  // HOW: Blur the focused element inside the editor first, while React still
  //     handles the blur; the editor records the value like any other change
  //     (draft, then save queue), and the notice counts it.
  const commitFocusedField = useCallback(() => {
    const shell = editorShellRef.current;
    const focused = typeof document === 'undefined' ? null : (document.activeElement as HTMLElement | null);
    if (shell && focused && focused !== shell && shell.contains(focused)) focused.blur();
  }, []);

  const loadPartnerForEditing = useCallback(async (): Promise<LoadResult> => {
    const order = orderRef.current as ResponseOrder;
    const ticket = order.next();
    if (!slug) {
      setError('Invalid edit link - missing partner identifier');
      setLoading(false);
      return 'error';
    }

    const fetchStartedAt = Date.now();
    try {
      const query = variantSlug ? `?variant=${encodeURIComponent(variantSlug)}` : '';
      const response = await fetch(`/api/partners/edit/${slug}${query}`, { cache: 'no-store' });
      const data = await response.json().catch(() => null);

      if (response.status === 401 && data?.code === 'PAGE_PASSWORD_REQUIRED') {
        if (!order.accept(ticket)) return 'superseded';
        clearAuthentication(pageId, 'partner-edit');
        if (hasPartnerRef.current) commitFocusedField();
        setNeedsPassword(true);
        setLoading(false);
        return 'password-required';
      }

      if (response.ok && data?.success) {
        if (!order.accept(ticket)) return 'superseded';
        hasPartnerRef.current = true;
        // canSave: the server's own answer to "may this caller save?" (absent
        // from older responses; the editor then assumes yes).
        const canSave = typeof data.canSave === 'boolean' ? data.canSave : undefined;
        // An editor that could save is about to turn read-only.
        if (canSave === false && editorCanSaveRef.current) commitFocusedField();
        editorCanSaveRef.current = canSave !== false;
        setLoaded({ partner: data.partner, fetchStartedAt, canSave });
        setError(null);
        setLoading(false);
        return canSave === false ? 'read-only' : 'ok';
      }

      // A failed RE-fetch must not swap a working editor for the error card:
      // that would unmount it and drop its unsaved changes.
      if (!hasPartnerRef.current) setError(data?.error || 'Partner not found');
      setLoading(false);
      return 'error';
    } catch {
      if (!hasPartnerRef.current) setError('Failed to load partner for editing');
      setLoading(false);
      return 'error';
    }
  }, [slug, variantSlug, pageId, commitFocusedField]);

  // WHAT: Re-establish save access after the editor's save got a 401.
  // WHY: Loading the partner again renews a partner-edit password grant (the
  //     server re-issues the one the caller holds). If the server asks for the
  //     password instead, the prompt takes the editor's place and this resolves
  //     once it is passed, with what the load after the unlock says.
  // RETURNS: 'granted' when saving may be retried; 'blocked' when the server
  //     says this caller cannot save (the editor turns read-only and keeps its
  //     unsaved changes); 'retry' when access could not be checked.
  const requestAccess = useCallback(async (): Promise<AccessCheckResult> => {
    const result = await loadPartnerForEditing();
    switch (result) {
      case 'ok':
        return 'granted';
      case 'password-required':
        return new Promise<AccessCheckResult>((resolve) => {
          accessWaitersRef.current.push(resolve);
        });
      case 'read-only':
        return 'blocked';
      default:
        return 'retry';
    }
  }, [loadPartnerForEditing]);

  // WHAT: Apply the partner's report style to the editor page.
  // NOTE: Its loading flag no longer gates the editor. The style fetch starts
  //     after the editor's first render, so waiting on it swapped a mounted
  //     editor for the loading card and back -- a remount, which drops unsaved
  //     changes held only in the editor's state.
  useReportStyle({
    styleId: partner?.styleId ? String(partner.styleId) : null,
    enabled: !!partner
  });

  useEffect(() => {
    // Ask the server, not sessionStorage (F-013). The sessionStorage flag
    // is empty on every first visit, so a partner with NO password
    // configured showed a gate that could not be passed. A protected page
    // answers 401 PAGE_PASSWORD_REQUIRED, and that is what raises the gate
    // now.
    loadPartnerForEditing();
  }, [loadPartnerForEditing]);

  // WHAT: Re-load when the tab becomes visible again.
  // WHY: Keeps the partner in sync, renews a password grant, and a load that
  //     says this caller may save resumes an editor whose saves were paused
  //     on a 401. The editor keeps its unsaved changes over the loaded copy.
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && !needsPassword) {
        loadPartnerForEditing();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [needsPassword, loadPartnerForEditing]);

  // WHAT: Unlocked. Over a loaded editor: load the partner again, then answer
  //     the editors waiting on the prompt with what that load says (the
  //     server's canSave, not the unlock's). Before anything loaded: load.
  const handleLoginSuccess = useCallback(() => {
    setNeedsPassword(false);
    const waiters = accessWaitersRef.current;
    accessWaitersRef.current = [];
    if (hasPartnerRef.current) {
      void requestAccess().then((result) => waiters.forEach((resolve) => resolve(result)));
      return;
    }
    loadPartnerForEditing();
  }, [loadPartnerForEditing, requestAccess]);

  if (!partner && needsPassword) {
    return (
      <PagePasswordLogin
        pageId={pageId}
        pageType="partner-edit"
        onSuccess={handleLoginSuccess}
      />
    );
  }

  if (!partner && loading) {
    return (
      <div className={styles.centerContainer}>
        <div className={styles.stateCard}>
          <div className="spinner"></div>
          <p className={styles.stateMessage}>Loading partner editor...</p>
        </div>
      </div>
    );
  }

  if (!partner && error) {
    return (
      <div className={styles.centerContainerColumn}>
        <div className={styles.errorCard}>
          <h1 className={styles.errorHeading}>❌ Access Error</h1>
          <p className={styles.errorTextPrimary}>{error}</p>
          <p className={styles.errorTextSecondary}>
            The partner editing link you&apos;re trying to access might not exist or may have been removed.
          </p>
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

  /* PASSWORD MID-SESSION: The editor stays mounted but hidden (display: none,
     so out of the tab order and the accessibility tree) and the same full-page
     prompt as on first load takes its place. Unmounting it would drop its
     unsaved changes. Keyed by partner and variant: each keeps its own drafts. */
  if (loaded) {
    return (
      <>
        <div className="page-bg-gray" hidden={needsPassword} ref={editorShellRef}>
          <PartnerEditorDashboard
            key={`${loaded.partner._id}|${variantSlug ?? ''}`}
            partner={loaded.partner}
            variantSlug={variantSlug}
            fetchStartedAt={loaded.fetchStartedAt}
            canSave={loaded.canSave}
            onRequestAccess={requestAccess}
          />
        </div>
        {needsPassword && (
          <PagePasswordLogin
            pageId={pageId}
            pageType="partner-edit"
            onSuccess={handleLoginSuccess}
            description="Enter the editor password to continue saving. Your unsaved changes are kept."
          />
        )}
      </>
    );
  }

  return null;
}
