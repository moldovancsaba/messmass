// tests/editor-dashboard-save.test.tsx
// WHAT: Pins what the event editor shows and restores on load when this device
//     holds unsaved changes, that every event write goes through the queue, and
//     that an editor the server says cannot save is read-only -- and editable
//     again, in place, once it can.
// WHY: 2026-09-27: an operator's saves were refused for hours; the numbers lived
//     only in React state and a reload lost them, and the only sign was a
//     "Save Error" flash nobody noticed. The editor now keeps unsaved data in
//     localStorage and puts it back on the next load -- but only where that
//     cannot overwrite a value someone else saved since (the restore rule in
//     lib/editorSaveQueue.ts) -- and an editor that cannot save takes no input
//     and says so at the top of the page.
// HOW: This repo's jest runs in node without a DOM. First paints are rendered
//     with renderToStaticMarkup: state initialisers run (that is where drafts
//     are restored), effects do not (no network). The read-only switch needs
//     a mounted editor that re-renders with new props and runs its effects, so
//     those tests mount it with react-dom/client on a minimal DOM stand-in
//     (see "Mounted editor") and a mocked fetch. window.localStorage is a
//     Map-backed stand-in. Children that pull in Mantine or the network are
//     replaced by stubs; ReportContentManager's stub prints the stats it gets,
//     which is how the restored numbers become visible, and has one report
//     text box that, like the real ones, commits only when it loses focus (as
//     does the Manual-mode number field's stub). A read-only editor renders
//     EditorReportContentView (real, no stub) in its place.
//     Saves are checked by the PUT bodies the mocked fetch receives: only the
//     values changed on the page (statsChanges), with tabId and clientSeq.

import React, { act } from 'react';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  ensureCsrfToken: jest.fn(async () => 'csrf-test-token'),
}));

jest.mock('@/components/ColoredCard', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => require('react').createElement('section', null, children),
}));
jest.mock('@/components/ColoredHashtagBubble', () => ({
  __esModule: true,
  default: ({ hashtag }: { hashtag: string }) => require('react').createElement('span', { 'data-hashtag': hashtag }, hashtag),
}));
// Lets a test commit through the Report Content stub the way a child editor
// does: the stats of its render with some keys changed.
const mockReportCommit: { current: ((changes: Record<string, unknown>) => void) | null } = { current: null };
jest.mock('@/components/ReportContentManager', () => ({
  __esModule: true,
  default: ({ stats, onCommit }: { stats: Record<string, unknown>; onCommit: (next: Record<string, unknown>) => void }) => {
    const R = require('react');
    mockReportCommit.current = (changes: Record<string, unknown>) => onCommit({ ...stats, ...changes });
    return R.createElement(
      'div',
      { 'data-report-content': '' },
      R.createElement('output', { 'data-female': String(stats.female), 'data-male': String(stats.male) }),
      // Like the real text slots: uncontrolled, recorded only when it loses focus.
      R.createElement('textarea', {
        'data-text2-field': '',
        defaultValue: String(stats.reportText2 ?? ''),
        onBlur: (e: { currentTarget: { value: string } }) => onCommit({ ...stats, reportText2: e.currentTarget.value }),
      })
    );
  },
}));
jest.mock('@/components/UnifiedHashtagInput', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/ImageUploadField', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/ImageUploader', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/TextareaField', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/BuilderMode', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/UnifiedTextInput', () => ({ __esModule: true, default: () => null }));
jest.mock('@/components/UnifiedNumberInput', () => ({
  __esModule: true,
  // Like the real field: what is typed is recorded (onSave) when it loses focus.
  default: ({ value, disabled, onSave }: { value: number; disabled?: boolean; onSave: (v: number) => void }) =>
    require('react').createElement('input', {
      'data-number-input': '',
      value: String(value),
      disabled,
      readOnly: true,
      onBlur: (e: { currentTarget: { value: string } }) => {
        if (e.currentTarget.value !== String(value)) onSave(Number(e.currentTarget.value));
      },
    }),
}));

// The edit page's own dependencies (only the mounted page tests render it).
const EDIT_SLUG = '3f1c2b4a-5d6e-4f70-8a91-b2c3d4e5f607';
jest.mock('next/navigation', () => ({ __esModule: true, useParams: () => ({ slug: EDIT_SLUG }) }));
jest.mock('@/hooks/useReportStyle', () => ({ __esModule: true, useReportStyle: () => ({ loading: false }) }));
jest.mock('@/components/PagePasswordLogin', () => ({
  __esModule: true,
  clearAuthentication: jest.fn(),
  // Stands in for the password form: one button that reports a successful unlock.
  default: ({ onSuccess }: { onSuccess: (isAdmin: boolean) => void }) =>
    require('react').createElement('button', { type: 'button', 'data-unlock': '', onClick: () => onSuccess(false) }, 'Unlock'),
}));

import EditorDashboard, {
  EditorReadOnlyNotice,
  mergeEditorSavePayloads,
  statsChangesBetween,
  type EditorSaveRequestBody,
  type KeptDrafts,
} from '@/components/EditorDashboard';
import EditPage from '@/app/edit/[slug]/page';
import {
  EDITOR_DRAFT_KEY_PREFIX,
  type AccessCheckResult,
  type SaveQueueSnapshot,
  type StoredDraft,
} from '@/lib/editorSaveQueue';

type Props = React.ComponentProps<typeof EditorDashboard>;
type ServerProject = Props['project'];

const PROJECT_ID = '66f6a0000000000000000001';

function serverProject(stats: Record<string, number | string>, hashtags: string[] = ['pzpn']): ServerProject {
  const base = {
    remoteImages: 0, hostessImages: 0, selfies: 0, indoor: 0, outdoor: 0, stadium: 0,
    female: 0, male: 0, genAlpha: 0, genYZ: 0, genX: 0, boomer: 0,
    merched: 0, jersey: 0, scarf: 0, flags: 0, baseballCap: 0, other: 0,
  };
  return {
    _id: PROJECT_ID,
    eventName: 'PZPN x Bosnia and Herzegovina',
    eventDate: '2026-09-27',
    hashtags,
    categorizedHashtags: {},
    stats: { ...base, ...stats },
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-27T08:00:00.000Z',
  };
}

// The stored field layout: one field per stat (`stats:<key>`), one per hashtag list.
function fieldsOf(project: ServerProject): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    hashtags: project.hashtags ?? [],
    categorizedHashtags: project.categorizedHashtags ?? {},
  };
  for (const [key, value] of Object.entries(project.stats)) fields[`stats:${key}`] = value;
  return fields;
}

function storedDraft(base: ServerProject, local: ServerProject, editedAt: number, tabId = 'earlier-tab'): StoredDraft {
  return { v: 1, scope: PROJECT_ID, tabId, editedAt, base: fieldsOf(base), fields: fieldsOf(local) };
}

function memoryStorage(entries: Record<string, string> = {}) {
  const map = new Map(Object.entries(entries));
  return {
    get length() {
      return map.size;
    },
    key: (index: number) => Array.from(map.keys())[index] ?? null,
    getItem: (key: string) => (map.has(key) ? map.get(key)! : null),
    setItem: (key: string, value: string) => void map.set(key, String(value)),
    removeItem: (key: string) => void map.delete(key),
  };
}

const withDrafts = (...drafts: StoredDraft[]) =>
  memoryStorage(Object.fromEntries(drafts.map((d) => [`${EDITOR_DRAFT_KEY_PREFIX}${d.scope}:${d.tabId}`, JSON.stringify(d)])));

const g = globalThis as unknown as { window?: unknown };

function render(project: ServerProject, storage: unknown, extra: Partial<Props> = {}): string {
  g.window = { localStorage: storage };
  return renderToStaticMarkup(<EditorDashboard project={project} {...extra} />);
}

beforeEach(() => {
  // The formula engine logs every evaluation of the derived totals.
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterEach(() => {
  delete g.window;
  jest.restoreAllMocks();
});

describe('EditorDashboard first paint with unsaved data on this device', () => {
  const loaded = serverProject({ female: 0, male: 0 });
  const typedOffline = serverProject({ female: 412, male: 388 }, ['pzpn', 'bosnia']);

  it('shows the server copy and no notice when there is no draft', () => {
    const html = render(loaded, memoryStorage());
    expect(html).toContain('data-female="0"');
    expect(html).not.toContain('Restored unsaved changes');
    expect(html).not.toContain('were not restored');
  });

  it('restores refused saves when the server still holds the copy they were made on', () => {
    const html = render(loaded, withDrafts(storedDraft(loaded, typedOffline, Date.UTC(2026, 8, 27, 14, 5))));
    expect(html).toContain('data-female="412"');
    expect(html).toContain('data-male="388"');
    expect(html).toContain('data-hashtag="bosnia"');
    expect(html).toContain('Restored unsaved changes from this device');
  });

  it('merges a draft with values someone else saved to other fields', () => {
    const adminEdited = serverProject({ female: 0, male: 0, stadium: 900 });
    const draftOnlyFemale = serverProject({ female: 412, male: 0 });
    const html = render(adminEdited, withDrafts(storedDraft(loaded, draftOnlyFemale, 1)));
    expect(html).toContain('data-female="412"');
    expect(html).toContain('Restored unsaved changes from this device');
  });

  it('does not apply a draft over a value changed on the server since; it asks, and restores the rest', () => {
    const adminReentered = serverProject({ female: 400, male: 380 });
    const html = render(adminReentered, withDrafts(storedDraft(loaded, typedOffline, 1)));
    // Both counters were changed on the server too: the saved values stay.
    expect(html).toContain('data-female="400"');
    expect(html).toContain('data-male="380"');
    expect(html).toContain('2 unsaved values from this device were not restored');
    // Every held-back value is named with both sides.
    expect(html).toContain('female: this device 412, saved 400');
    expect(html).toContain('male: this device 388, saved 380');
    expect(html).toContain('Keep saved values discards these 2 values.');
    expect(html).toContain('Keep saved values');
    expect(html).toContain('Use this device&#x27;s values');
    // The hashtag the draft added was not touched on the server: it is restored.
    expect(html).toContain('data-hashtag="bosnia"');
    expect(html).toContain('Restored unsaved changes from this device');
  });

  it('holds back only the conflicting value when the other unsaved values are safe', () => {
    const typed = serverProject({ female: 412, male: 388, jersey: 97 });
    const adminFixedFemale = serverProject({ female: 400 });
    const html = render(adminFixedFemale, withDrafts(storedDraft(loaded, typed, 1)));
    expect(html).toContain('data-female="400"');
    expect(html).toContain('data-male="388"');
    expect(html).toContain('1 unsaved value from this device was not restored');
    expect(html).toContain('female: this device 412, saved 400');
    expect(html).not.toMatch(/\bmale: this device/);
    expect(html).toContain('Keep saved values discards this value.');
    expect(html).toContain('Restored unsaved changes from this device');
  });

  it("does not report this device's own lost-answer save as someone else's change", () => {
    // female 0 -> 411 reached the server but its answer was lost; 412 and male
    // 388 were still waiting when the tab died.
    const draft = { ...storedDraft(loaded, typedOffline, 1), sent: { 'stats:female': [411] } };
    const html = render(serverProject({ female: 411, male: 0 }), withDrafts(draft));
    expect(html).toContain('data-female="412"');
    expect(html).toContain('data-male="388"');
    expect(html).not.toContain('not restored');
  });

  it('still renders the server copy when storage is unavailable', () => {
    const blocked = {
      get length(): number {
        throw new Error('SecurityError');
      },
      key: () => {
        throw new Error('SecurityError');
      },
      getItem: () => {
        throw new Error('SecurityError');
      },
      setItem: () => {
        throw new Error('SecurityError');
      },
      removeItem: () => {
        throw new Error('SecurityError');
      },
    };
    const html = render(loaded, blocked);
    expect(html).toContain('data-female="0"');
  });

  it('says up front when the server reports this caller cannot save', () => {
    const notice = 'You can view this event but not save changes.';
    expect(render(loaded, memoryStorage(), { canSave: false })).toContain(notice);
    expect(render(loaded, memoryStorage(), { canSave: true })).not.toContain(notice);
    expect(render(loaded, memoryStorage())).not.toContain(notice);
  });
});

describe('EditorDashboard read-only (the server says this caller cannot save)', () => {
  const loaded = serverProject({ female: 0, male: 0 });
  const typedOffline = serverProject({ female: 412, male: 388 });

  it('disables every input and puts the notice first, above the header', () => {
    const html = render(loaded, memoryStorage(), { canSave: false });
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
    expect(html).toContain(
      'You can view this event but not save changes.</strong> Open the event edit link or sign in to edit.'
    );
    // The notice is an alert and comes before the header and every input.
    const notice = html.indexOf('role="alert"');
    expect(notice).toBeGreaterThan(-1);
    expect(notice).toBeLessThan(html.indexOf('admin-header'));
    expect(notice).toBeLessThan(html.indexOf('<fieldset'));
    // The status line does not say "Ready".
    expect(html).toContain('🔒 Read-only');
    expect(html).not.toContain('📝 Ready');

    const writable = render(loaded, memoryStorage(), { canSave: true });
    expect(writable).toMatch(/<fieldset(?![^>]*disabled)[^>]*>/);
    expect(writable).not.toContain('role="alert"');
    expect(writable).toContain('📝 Ready');
  });

  const storageDump = (storage: ReturnType<typeof memoryStorage>) =>
    JSON.stringify(Array.from({ length: storage.length }, (_, i) => storage.getItem(storage.key(i)!)));

  it('shows the stored values and leaves unsaved drafts on this device untouched', () => {
    const saved = serverProject({ female: 0, male: 0, reportText1: 'Saved caption' });
    const typed = serverProject({ female: 412, male: 388, reportText1: 'Typed offline caption' });
    const storage = withDrafts(storedDraft(saved, typed, Date.UTC(2026, 8, 27, 14, 5)));
    const before = storageDump(storage);
    const html = render(saved, storage, { canSave: false });
    // Not restored: values that cannot be saved would read as the event's values.
    expect(html).toContain('Saved caption');
    expect(html).not.toContain('Typed offline caption');
    expect(html).not.toContain('Restored unsaved changes');
    expect(html).not.toContain('not restored');
    expect(html).toContain('are kept and restored once you can edit.');
    expect(storageDump(storage)).toBe(before);
  });

  it('does not mention drafts whose values the server already holds', () => {
    // The tab closed right after its last save went out: the server stored it,
    // but the answer never arrived, so the draft stayed on this device.
    const storage = withDrafts(storedDraft(loaded, typedOffline, Date.UTC(2026, 8, 27, 14, 5)));
    const before = storageDump(storage);
    const html = render(typedOffline, storage, { canSave: false });
    expect(html).toContain('You can view this event but not save changes.');
    expect(html).not.toContain('Unsaved changes from this device');
    expect(html).not.toContain('unsaved');
    expect(storageDump(storage)).toBe(before);
  });

  it('names the values changed on the server since as a choice, not as restored', () => {
    const edited = Date.UTC(2026, 8, 27, 14, 5);
    // female was also changed on the server since; male was not.
    const onlyFemaleChanged = render(serverProject({ female: 400, male: 0 }), withDrafts(storedDraft(loaded, typedOffline, edited)), {
      canSave: false,
    });
    expect(onlyFemaleChanged).toContain(
      'are kept and restored once you can edit. 1 value was also changed on the server since; you choose which to keep then.'
    );
    // Both were: nothing would be put back as it is.
    const bothChanged = render(serverProject({ female: 400, male: 380 }), withDrafts(storedDraft(loaded, typedOffline, edited)), {
      canSave: false,
    });
    expect(bothChanged).toContain(
      'are kept. 2 values were also changed on the server since; you choose which to keep once you can edit.'
    );
    expect(bothChanged).not.toContain('restored once you can edit');
  });

  it('shows every stored report image and text, with no controls, in place of Report Content', () => {
    const stored = serverProject({
      female: 0,
      reportImage1: 'https://i.ibb.co/abc/first.jpg',
      reportImage3: 'https://i.ibb.co/abc/third.jpg',
      reportText2: 'Line one\nLine two',
      reportText10: 'Tenth',
    });
    const html = render(stored, memoryStorage(), { canSave: false });
    const view = html.slice(html.indexOf('📦 Report Content'));
    expect(view).toContain('Images (2)');
    expect(view).toContain('reportImage1');
    expect(view).toContain('reportImage3');
    expect(view).toContain('first.jpg');
    expect(view).toContain('Texts (2)');
    // In slot order; the texts are shown without first opening a tab.
    expect(view.indexOf('reportText2')).toBeLessThan(view.indexOf('reportText10'));
    expect(view).toContain('Line one\nLine two');
    expect(view).toContain('Tenth');
    expect(view).not.toMatch(/<(button|input|textarea|select)\b/);
    expect(view).not.toContain('data-female'); // not the editing component

    const empty = render(serverProject({ female: 0 }), memoryStorage(), { canSave: false });
    expect(empty).toContain('No images.');
    expect(empty).toContain('No texts.');

    // An editor that can save keeps the editing component.
    expect(render(stored, memoryStorage(), { canSave: true })).toContain('data-female="0"');
  });
});

describe('EditorReadOnlyNotice', () => {
  // A queue stand-in: the notice only reads its snapshot.
  const queueWith = (pendingCount: number, state: SaveQueueSnapshot['state'] = 'needs-access') => {
    const snapshot: SaveQueueSnapshot = {
      state,
      pendingCount,
      lastError: null,
      lastSavedAt: null,
      nextRetryAt: null,
      failedAttempts: pendingCount > 0 ? 1 : 0,
      rejectedCount: 0,
    };
    return {
      enqueue() {},
      unconfirmed: () => null,
      flush() {},
      resume() {},
      retryRejected() {},
      hold: () => () => {},
      dispose() {},
      getSnapshot: () => snapshot,
      subscribe: () => () => {},
    };
  };
  const notice = (pending: number, draftStored = true, kept: KeptDrafts | null = null) =>
    renderToStaticMarkup(
      <EditorReadOnlyNotice queue={queueWith(pending)} draftStored={draftStored} kept={kept} onRetryNow={() => {}} />
    );

  it('says what is wrong and what to do, as an alert', () => {
    const html = notice(0);
    expect(html).toContain('role="alert"');
    expect(html).toContain('You can view this event but not save changes.');
    expect(html).toContain('Open the event edit link or sign in to edit.');
    expect(html).not.toContain('unsaved');
    expect(html).not.toContain('Retry now');
  });

  it('counts the unsaved changes kept from before access was lost, with Retry now', () => {
    expect(notice(1)).toContain('1 unsaved change is kept on this device and saved once you can edit.');
    const html = notice(3);
    expect(html).toContain('3 unsaved changes are kept on this device and saved once you can edit.');
    expect(html).toContain('Retry now');
  });

  it('says when the unsaved changes exist only on this page', () => {
    expect(notice(2, false)).toContain('2 unsaved changes are only on this page - do not close or reload it.');
  });

  it('describes the drafts a read-only load kept: restored, or waiting for a choice', () => {
    const editedAt = Date.UTC(2026, 8, 27, 14, 5);
    expect(notice(0, true, { editedAt, restores: true, heldBack: 0 })).toMatch(
      /Unsaved changes from this device \(last edit [^)]+\) are kept and restored once you can edit\.<\/p>/
    );
    expect(notice(0, true, { editedAt, restores: true, heldBack: 1 })).toContain(
      'are kept and restored once you can edit. 1 value was also changed on the server since; you choose which to keep then.'
    );
    const heldOnly = notice(0, true, { editedAt, restores: false, heldBack: 3 });
    expect(heldOnly).toContain('are kept. 3 values were also changed on the server since; you choose which to keep once you can edit.');
    expect(heldOnly).not.toContain('restored');
  });
});

describe('event editor save payloads', () => {
  it('a change names only the stats it changed; a removed stat is null', () => {
    expect(
      statsChangesBetween(
        { female: 1, male: 2, reportText1: 'a', reportImage1: 'https://i.ibb.co/x.jpg' },
        { female: 2, male: 2, reportText1: 'a', stadium: 900 }
      )
    ).toEqual({ female: 2, stadium: 900, reportImage1: null });
    expect(statsChangesBetween({ female: 1 }, { female: 1 })).toEqual({});
  });

  it('merging two payloads keeps every stat either names, the newer value winning', () => {
    const older = { projectId: PROJECT_ID, statsChanges: { female: 1, jersey: 4 }, hashtags: ['pzpn'] };
    const newer = { projectId: PROJECT_ID, statsChanges: { female: 2, male: 1 } };
    expect(mergeEditorSavePayloads(older, newer)).toEqual({
      projectId: PROJECT_ID,
      statsChanges: { female: 2, jersey: 4, male: 1 },
      hashtags: ['pzpn'],
    });
    // A newer hashtag list replaces the older one; a list neither names stays out.
    expect(mergeEditorSavePayloads(older, { ...newer, hashtags: ['pzpn', 'bosnia'] })).toEqual({
      projectId: PROJECT_ID,
      statsChanges: { female: 2, jersey: 4, male: 1 },
      hashtags: ['pzpn', 'bosnia'],
    });
    expect(mergeEditorSavePayloads(newer, newer)).not.toHaveProperty('categorizedHashtags');
  });
});

// ---------------------------------------------------------------------------
// Mounted editor
// WHAT: A minimal DOM stand-in, enough for react-dom/client to mount the
//     editor, re-render it with new props, run its effects and deliver clicks.
// WHY: The read-only switch happens between renders of one mounted editor
//     (the page hands it each new load), and the kept-draft restore runs in an
//     effect -- neither is visible to renderToStaticMarkup. The repo has no
//     jsdom; this is the smallest thing that lets those be tested for real.
// LIMITS: No layout, no form semantics: a disabled fieldset is checked by its
//     attribute, not by the browser refusing clicks inside it. Focus is only
//     what focus() and blur() do (see FakeNode.blur).

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const DOCUMENT_NODE = 9;

type Listener = { type: string; fn: (event: unknown) => void; capture: boolean };

class FakeNode {
  nodeType: number;
  nodeName: string;
  tagName?: string;
  namespaceURI: string | null = 'http://www.w3.org/1999/xhtml';
  childNodes: FakeNode[] = [];
  parentNode: FakeNode | null = null;
  ownerDocument: FakeDocument | null;
  nodeValue: string | null = null;
  style: Record<string, string> = {};
  listeners: Listener[] = [];
  private attributes = new Map<string, string>();
  // React writes form state (value, checked, ...) as plain properties.
  [key: string]: unknown;

  constructor(nodeType: number, name: string, ownerDocument: FakeDocument | null) {
    this.nodeType = nodeType;
    this.nodeName = name.toUpperCase();
    if (nodeType === ELEMENT_NODE) this.tagName = this.nodeName;
    this.ownerDocument = ownerDocument;
  }
  get firstChild(): FakeNode | null {
    return this.childNodes[0] ?? null;
  }
  get lastChild(): FakeNode | null {
    return this.childNodes[this.childNodes.length - 1] ?? null;
  }
  get nextSibling(): FakeNode | null {
    const siblings = this.parentNode?.childNodes ?? [];
    return siblings[siblings.indexOf(this) + 1] ?? null;
  }
  appendChild(child: FakeNode): FakeNode {
    child.parentNode?.removeChild(child);
    this.childNodes.push(child);
    child.parentNode = this;
    return child;
  }
  insertBefore(child: FakeNode, before: FakeNode | null): FakeNode {
    if (!before) return this.appendChild(child);
    child.parentNode?.removeChild(child);
    this.childNodes.splice(this.childNodes.indexOf(before), 0, child);
    child.parentNode = this;
    return child;
  }
  removeChild(child: FakeNode): FakeNode {
    this.childNodes = this.childNodes.filter((node) => node !== child);
    child.parentNode = null;
    return child;
  }
  setAttribute(name: string, value: unknown) {
    this.attributes.set(name, String(value));
  }
  getAttribute(name: string): string | null {
    return this.attributes.has(name) ? (this.attributes.get(name) as string) : null;
  }
  hasAttribute(name: string): boolean {
    return this.attributes.has(name);
  }
  removeAttribute(name: string) {
    this.attributes.delete(name);
  }
  addEventListener(type: string, fn: (event: unknown) => void, options?: boolean | { capture?: boolean }) {
    this.listeners.push({ type, fn, capture: typeof options === 'boolean' ? options : Boolean(options?.capture) });
  }
  removeEventListener(type: string, fn: (event: unknown) => void) {
    this.listeners = this.listeners.filter((l) => l.type !== type || l.fn !== fn);
  }
  contains(other: FakeNode | null): boolean {
    for (let node = other; node; node = node.parentNode) if (node === this) return true;
    return false;
  }
  focus() {
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }
  // Moves focus away and delivers the focusout React listens for (onBlur),
  // through the ancestors' listeners, as the browser does when a page script
  // calls blur(). Closing or hiding the tab does not blur anything here, as in
  // the browser: only the editor's own blur() records the field.
  blur() {
    const doc = this.ownerDocument;
    if (!doc || doc.activeElement !== this) return;
    doc.activeElement = null;
    const event = {
      type: 'focusout',
      target: this,
      relatedTarget: null,
      bubbles: true,
      cancelable: false,
      timeStamp: Date.now(),
      defaultPrevented: false,
      preventDefault() {},
      stopPropagation() {},
    };
    for (let node: FakeNode | null = this; node; node = node.parentNode) {
      for (const listener of node.listeners.filter((l) => l.type === 'focusout' && !l.capture)) listener.fn(event);
    }
  }
  get textContent(): string {
    if (this.nodeType === TEXT_NODE) return this.nodeValue ?? '';
    return this.childNodes.map((child) => child.textContent).join('');
  }
  set textContent(text: string) {
    if (this.nodeType === TEXT_NODE) {
      this.nodeValue = text;
      return;
    }
    for (const child of this.childNodes) child.parentNode = null;
    this.childNodes = [];
    if (text) this.appendChild((this.ownerDocument as FakeDocument).createTextNode(text));
  }
}

class FakeDocument extends FakeNode {
  documentElement: FakeNode;
  body: FakeNode;
  activeElement: FakeNode | null = null;
  visibilityState = 'visible';
  hidden = false;
  defaultView: Record<string, unknown>;
  constructor() {
    super(DOCUMENT_NODE, '#document', null);
    this.documentElement = this.createElement('html');
    this.body = this.createElement('body');
    this.documentElement.appendChild(this.body);
    this.appendChild(this.documentElement);
    this.defaultView = {};
  }
  createElement(tag: string): FakeNode {
    return new FakeNode(ELEMENT_NODE, tag, this);
  }
  createTextNode(text: string): FakeNode {
    const node = new FakeNode(TEXT_NODE, '#text', this);
    node.nodeValue = text;
    return node;
  }
}

function descendants(node: FakeNode, out: FakeNode[] = []): FakeNode[] {
  for (const child of node.childNodes) {
    if (child.nodeType === ELEMENT_NODE) out.push(child);
    descendants(child, out);
  }
  return out;
}

const byTag = (root: FakeNode, tag: string) => descendants(root).filter((n) => n.nodeName === tag.toUpperCase());
const byClass = (root: FakeNode, name: string) =>
  descendants(root).filter((n) => (n.getAttribute('class') ?? '').split(/\s+/).includes(name));
const buttonLabelled = (root: FakeNode, label: string) =>
  byTag(root, 'button').find((b) => b.textContent.includes(label)) ?? null;
// The manual Save button reads "Save" or "Saving..." (see EditorSaveButton).
const saveButton = (root: FakeNode) => byTag(root, 'button').find((b) => b.textContent.startsWith('💾')) ?? null;
// The Report Content stub prints the stats it gets. It is mounted once the
// editor could save, and hidden (kept mounted) while it is read-only after
// that; a read-only editor shows EditorReportContentView next to it.
const shownFemale = (root: FakeNode) => byTag(root, 'output')[0]?.getAttribute('data-female');
const withAttr = (root: FakeNode, attr: string) => descendants(root).filter((n) => n.hasAttribute(attr));
const text2Field = (root: FakeNode) => withAttr(root, 'data-text2-field')[0];
const numberField = (root: FakeNode) => withAttr(root, 'data-number-input')[0];
const contentEditorHidden = (root: FakeNode) =>
  (withAttr(root, 'data-report-content')[0]?.parentNode as FakeNode | undefined)?.hasAttribute('hidden');
const statusLine = (root: FakeNode) => byClass(root, 'admin-status')[0]?.textContent ?? '';
// Focuses a field and types into it without committing (commits happen on blur).
const typeInto = (field: FakeNode | undefined, text: string) => {
  if (!field) throw new Error('no field to type into');
  field.focus();
  field.value = text;
  return field;
};
// The female count on its clicker card, or in its Manual-mode input.
const femaleOnCard = (root: FakeNode) => {
  const card = byClass(root, 'stat-value')[0];
  if (card) return card.textContent;
  const input = byTag(root, 'input').find((i) => i.hasAttribute('data-number-input'));
  return input === undefined ? undefined : String(input.value);
};
const reportContentCard = (root: FakeNode) =>
  byTag(root, 'section').find((s) => s.textContent.includes('📦 Report Content')) ?? null;
const noticeOf = (root: FakeNode) => descendants(root).find((n) => n.getAttribute('role') === 'alert') ?? null;
const fieldsetDisabled = (root: FakeNode) => byTag(root, 'fieldset')[0].hasAttribute('disabled');

// The event's clicker variables, as /api/variables-config and
// /api/variables-groups describe them. Female comes first: the helpers above
// read the first card and the first Manual-mode field.
const FEMALE_VARIABLE = {
  name: 'stats.female',
  label: 'Female',
  type: 'count',
  category: 'Gender',
  flags: { visibleInClicker: true, editableInManual: true },
};
const MALE_VARIABLE = { ...FEMALE_VARIABLE, name: 'stats.male', label: 'Male' };

interface FakeApi {
  fetch: jest.Mock;
  /** Bodies of every PUT /api/projects, in order. */
  saves: EditorSaveRequestBody[];
  /** What the next PUT /api/projects answers. */
  saveReply: { status: number; body: unknown };
  /** While set, PUT /api/projects answers only once this settles (a save in flight). */
  saveGate: Promise<void> | null;
  /** What the next GET /api/projects/edit/<slug> (the edit page's load) answers. */
  loadReply: { status: number; body: unknown };
}

function fakeApi(): FakeApi {
  const api: FakeApi = {
    fetch: jest.fn(),
    saves: [],
    saveReply: { status: 200, body: { success: true } },
    saveGate: null,
    loadReply: { status: 404, body: { success: false, error: 'Project not found' } },
  };
  const reply = (status: number, body: unknown) => ({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    // A fresh object per response, as JSON parsing gives: the editor tells
    // loads apart by object identity.
    json: async () => JSON.parse(JSON.stringify(body)),
  });
  api.fetch.mockImplementation(async (url: string, init?: { method?: string; body?: string }) => {
    if (url === '/api/projects' && init?.method === 'PUT') {
      api.saves.push(JSON.parse(init.body as string));
      const answer = api.saveReply;
      if (api.saveGate) await api.saveGate;
      return reply(answer.status, answer.body);
    }
    if (url === `/api/projects/edit/${EDIT_SLUG}`) return reply(api.loadReply.status, api.loadReply.body);
    if (url.startsWith('/api/variables-config')) {
      return reply(200, { success: true, variables: [FEMALE_VARIABLE, MALE_VARIABLE] });
    }
    if (url.startsWith('/api/variables-groups')) {
      return reply(200, { success: true, groups: [{ groupOrder: 1, variables: ['female', 'male'] }] });
    }
    if (url.startsWith('/api/chart-config')) return reply(200, { success: true, configurations: [] });
    return reply(404, { success: false });
  });
  return api;
}

// Lets fetches, zero-delay timers and the effects they trigger run, inside act.
async function settle() {
  await act(async () => {
    for (let i = 0; i < 5; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

describe('EditorDashboard mounted', () => {
  const g = globalThis as unknown as Record<string, unknown>;
  const saved: Record<string, unknown> = {};
  let doc: FakeDocument;
  let api: FakeApi;
  let windowListeners: Listener[];
  let unmountCurrent: (() => Promise<void>) | null = null;

  beforeAll(() => {
    for (const key of ['document', 'fetch', 'IS_REACT_ACT_ENVIRONMENT']) saved[key] = g[key];
    g.IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete g[key];
      else g[key] = value;
    }
  });

  beforeEach(() => {
    doc = new FakeDocument();
    api = fakeApi();
    windowListeners = [];
    const win: Record<string, unknown> = {
      document: doc,
      HTMLIFrameElement: class {},
      localStorage: memoryStorage(),
      addEventListener: (type: string, fn: (event: unknown) => void) => windowListeners.push({ type, fn, capture: false }),
      removeEventListener: (type: string, fn: (event: unknown) => void) => {
        windowListeners = windowListeners.filter((l) => l.type !== type || l.fn !== fn);
      },
    };
    doc.defaultView = win;
    g.window = win;
    g.document = doc;
    g.fetch = api.fetch;
  });

  afterEach(async () => {
    if (unmountCurrent) await unmountCurrent();
    unmountCurrent = null;
  });

  const storage = () => (g.window as { localStorage: ReturnType<typeof memoryStorage> }).localStorage;
  const storedDrafts = () => {
    const s = storage();
    return Array.from({ length: s.length }, (_, i) => s.key(i) as string).filter((k) => k.startsWith(EDITOR_DRAFT_KEY_PREFIX));
  };
  const draftField = (field: string) => {
    const [key] = storedDrafts();
    return key ? JSON.parse(storage().getItem(key) as string).fields[field] : undefined;
  };

  // The tab is hidden: the editor sends what is waiting at once (as it does
  // before a mobile browser may discard the tab), instead of after the debounce.
  async function sendWaiting() {
    doc.hidden = true;
    doc.visibilityState = 'hidden';
    for (const listener of doc.listeners.filter((l) => l.type === 'visibilitychange')) {
      await act(async () => listener.fn({ type: 'visibilitychange' }));
    }
    doc.hidden = false;
    doc.visibilityState = 'visible';
    await settle();
  }

  // Closing or reloading the tab: did the editor ask to confirm? With anything
  // unsaved it also sends what is waiting at once, so this can send a save.
  async function leaveAsks(): Promise<boolean> {
    let asked = false;
    await act(async () => {
      for (const listener of windowListeners.filter((l) => l.type === 'beforeunload')) {
        listener.fn({ type: 'beforeunload', preventDefault: () => (asked = true), returnValue: undefined });
      }
    });
    await settle();
    return asked;
  }

  // The tab is closed where beforeunload does not fire (a mobile tab swiped
  // away), or put into the back/forward cache.
  async function pageHide() {
    await act(async () => {
      for (const listener of windowListeners.filter((l) => l.type === 'pagehide')) listener.fn({ type: 'pagehide' });
    });
    await settle();
  }

  // Mounts an element on a fresh container; click() delivers a click the way
  // the browser would reach React (through the root's delegated listener).
  async function mount(element: React.ReactElement) {
    // Required here, after the DOM stand-in exists: react-dom reads it on load.
    const { createRoot } = require('react-dom/client') as typeof import('react-dom/client');
    const container = doc.createElement('div');
    doc.body.appendChild(container);
    const root = createRoot(container as unknown as HTMLElement);
    await act(async () => {
      root.render(element);
    });
    await settle();
    unmountCurrent = async () => {
      await act(async () => root.unmount());
      await settle();
    };
    const click = async (target: FakeNode | null) => {
      if (!target) throw new Error('nothing to click');
      const onClick = container.listeners.find((l) => l.type === 'click' && !l.capture);
      await act(async () => {
        onClick?.fn({
          type: 'click',
          target,
          bubbles: true,
          cancelable: true,
          timeStamp: Date.now(),
          defaultPrevented: false,
          preventDefault() {},
          stopPropagation() {},
        });
      });
      await settle();
    };
    return { container, root, click };
  }

  // Mounts the editor as the edit page does, and re-renders it with each new
  // load the way the page hands one over (a new copy, a later fetchStartedAt).
  async function mountEditor(project: ServerProject, props: Partial<Props>) {
    let fetchStartedAt = Date.now();
    const mounted = await mount(<EditorDashboard project={project} fetchStartedAt={fetchStartedAt} {...props} />);
    const reload = async (copy: ServerProject, next: Partial<Props>) => {
      fetchStartedAt += 1;
      await act(async () => {
        mounted.root.render(<EditorDashboard project={copy} fetchStartedAt={fetchStartedAt} {...props} {...next} />);
      });
      await settle();
    };
    return { ...mounted, reload };
  }

  // Mounts the whole edit page; refocus() is the tab coming back into view,
  // which re-loads the event.
  async function mountPage() {
    const mounted = await mount(<EditPage />);
    const refocus = async () => {
      for (const listener of doc.listeners.filter((l) => l.type === 'visibilitychange')) {
        await act(async () => listener.fn({ type: 'visibilitychange' }));
      }
      await settle();
    };
    return { ...mounted, refocus };
  }

  const card = (root: FakeNode) => byClass(root, 'stat-card')[0];

  it('loads read-only: inputs disabled, notice first; becomes editable in place when a load says canSave', async () => {
    const loaded = serverProject({ female: 0, male: 0 });
    const editor = await mountEditor(loaded, { canSave: false });
    const { container } = editor;

    // Read-only: disabled fieldset, notice above everything, card not clickable.
    expect(fieldsetDisabled(container)).toBe(true);
    const page = container.firstChild as FakeNode;
    expect(page.firstChild?.getAttribute('role')).toBe('alert');
    expect(noticeOf(container)?.textContent).toContain('You can view this event but not save changes.');
    expect(card(container).getAttribute('class')).toContain('stat-card-readonly');
    await editor.click(card(container));
    expect(femaleOnCard(container)).toBe('0');
    expect(api.saves).toHaveLength(0);
    // Report Content is the view with no controls, not the editing component.
    expect(shownFemale(container)).toBeUndefined();
    expect(reportContentCard(container)?.textContent).toContain('No texts.');

    // Manual mode: the number inputs and the Save button are disabled too.
    await editor.click(buttonLabelled(container, 'Clicker'));
    expect(byTag(container, 'input').filter((i) => i.hasAttribute('data-number-input'))[0].hasAttribute('disabled')).toBe(true);
    expect(saveButton(container)?.hasAttribute('disabled')).toBe(true);

    // A re-fetch answers canSave: true (edit link opened, or signed in elsewhere).
    await editor.reload({ ...loaded }, { canSave: true });
    expect(fieldsetDisabled(container)).toBe(false);
    expect(noticeOf(container)).toBeNull();
    expect(saveButton(container)?.hasAttribute('disabled')).toBe(false);
    expect(byTag(container, 'input').filter((i) => i.hasAttribute('data-number-input'))[0].hasAttribute('disabled')).toBe(false);

    // And it takes input again.
    await editor.click(buttonLabelled(container, 'Manual'));
    await editor.click(buttonLabelled(container, 'Builder'));
    expect(card(container).getAttribute('class')).toContain('stat-card-clickable');
    await editor.click(card(container));
    expect(shownFemale(container)).toBe('1');
  });

  it('keeps the unsaved changes when a refused save turns the editor read-only, and saves them once access returns', async () => {
    const loaded = serverProject({ female: 0, male: 0 });
    let answerAccessCheck: (result: AccessCheckResult) => void = () => {};
    const onRequestAccess = jest.fn(
      () => new Promise<AccessCheckResult>((resolve) => {
        answerAccessCheck = resolve;
      })
    );
    const editor = await mountEditor(loaded, { canSave: true, onRequestAccess });
    const { container } = editor;

    await editor.click(card(container));
    await editor.click(card(container));
    expect(shownFemale(container)).toBe('2');

    // The save is refused (the grant is gone). The editor asks the page to
    // re-check access; the page re-loads and the server says canSave: false.
    api.saveReply = { status: 401, body: { success: false, code: 'EDIT_ACCESS_REQUIRED', error: 'Edit access expired or missing.' } };
    await editor.click(buttonLabelled(container, 'Clicker'));
    await editor.click(saveButton(container));
    expect(api.saves).toHaveLength(1);
    expect(onRequestAccess).toHaveBeenCalledTimes(1);
    await editor.reload({ ...loaded }, { canSave: false });
    await act(async () => answerAccessCheck('blocked'));
    await settle();

    // Read-only, with the notice saying the two changes are kept; nothing discarded.
    expect(fieldsetDisabled(container)).toBe(true);
    expect(saveButton(container)?.hasAttribute('disabled')).toBe(true);
    const notice = noticeOf(container) as FakeNode;
    expect(notice.textContent).toContain('2 unsaved changes are kept on this device and saved once you can edit.');
    expect(buttonLabelled(notice, 'Retry now')).not.toBeNull();
    expect(femaleOnCard(container)).toBe('2');
    const [draftKey] = storedDrafts();
    expect(JSON.parse(storage().getItem(draftKey) as string).fields['stats:female']).toBe(2);
    // The bottom save banner (and its Retry now) would repeat the notice.
    expect(byTag(container, 'button').filter((b) => b.textContent.includes('Retry now'))).toHaveLength(1);

    // Access returns (a later load says canSave: true): editable, and the kept
    // changes are sent and confirmed.
    api.saveReply = { status: 200, body: { success: true } };
    await editor.reload({ ...loaded }, { canSave: true });
    expect(fieldsetDisabled(container)).toBe(false);
    expect(noticeOf(container)).toBeNull();
    expect(api.saves).toHaveLength(2);
    // The refused request, sent again unchanged -- two taps, as a count -- and
    // under the same tabId and clientSeq: had the first copy been stored after
    // all, the server would turn this one away instead of counting twice.
    expect(api.saves.map((s) => s.statsIncrements)).toEqual([{ female: 2 }, { female: 2 }]);
    expect(api.saves.map((s) => s.statsChanges)).toEqual([{}, {}]);
    expect(api.saves[1].tabId).toBe(api.saves[0].tabId);
    expect(api.saves[1].clientSeq).toBe(api.saves[0].clientSeq);
    expect(storedDrafts()).toHaveLength(0);
  });

  it('restores the drafts a read-only load kept, once the editor can save', async () => {
    const loaded = serverProject({ female: 0, male: 0 });
    const typedOffline = serverProject({ female: 412, male: 388 }, ['pzpn', 'bosnia']);
    const earlier = storedDraft(loaded, typedOffline, Date.UTC(2026, 8, 27, 14, 5));
    storage().setItem(`${EDITOR_DRAFT_KEY_PREFIX}${earlier.scope}:${earlier.tabId}`, JSON.stringify(earlier));

    const editor = await mountEditor(loaded, { canSave: false });
    const { container } = editor;
    expect(femaleOnCard(container)).toBe('0');
    expect(noticeOf(container)?.textContent).toContain('are kept and restored once you can edit.');
    expect(storedDrafts()).toEqual([`${EDITOR_DRAFT_KEY_PREFIX}${PROJECT_ID}:earlier-tab`]);

    await editor.reload({ ...loaded }, { canSave: true });
    expect(fieldsetDisabled(container)).toBe(false);
    expect(shownFemale(container)).toBe('412');
    expect(container.textContent).toContain('Restored unsaved changes from this device');
    // Taken over by this tab's own draft, which the save queue now sends.
    const drafts = storedDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).not.toContain('earlier-tab');
    expect(JSON.parse(storage().getItem(drafts[0]) as string).fields['stats:female']).toBe(412);

    await unmountCurrent?.(); // unmounting sends what is waiting
    unmountCurrent = null;
    // Exactly the restored values: nothing else of the server copy goes back.
    expect(api.saves).toHaveLength(1);
    expect(api.saves[0]).toEqual({
      projectId: PROJECT_ID,
      statsChanges: { female: 412, male: 388 },
      hashtags: ['pzpn', 'bosnia'],
      tabId: expect.any(String),
      clientSeq: 1,
    });
  });

  it('leaves drafts the server already holds out of the notice, and removes them once the editor can save', async () => {
    const loaded = serverProject({ female: 0, male: 0 });
    const typed = serverProject({ female: 412, male: 388 });
    // The last save of that tab reached the server; its answer did not.
    const earlier = storedDraft(loaded, typed, Date.UTC(2026, 8, 27, 14, 5));
    const earlierKey = `${EDITOR_DRAFT_KEY_PREFIX}${earlier.scope}:${earlier.tabId}`;
    storage().setItem(earlierKey, JSON.stringify(earlier));

    const editor = await mountEditor(typed, { canSave: false });
    const { container } = editor;
    expect(noticeOf(container)?.textContent).toContain('You can view this event but not save changes.');
    expect(noticeOf(container)?.textContent).not.toContain('Unsaved changes from this device');
    expect(storedDrafts()).toEqual([earlierKey]); // untouched while read-only

    await editor.reload({ ...typed }, { canSave: true });
    expect(fieldsetDisabled(container)).toBe(false);
    expect(container.textContent).not.toContain('Restored unsaved changes');
    expect(storedDrafts()).toHaveLength(0);
    expect(api.saves).toHaveLength(0);
  });

  it('re-measures the kept drafts against each read-only re-fetch', async () => {
    const loaded = serverProject({ female: 0, male: 0 });
    const typed = serverProject({ female: 412, male: 388 });
    const earlier = storedDraft(loaded, typed, Date.UTC(2026, 8, 27, 14, 5));
    storage().setItem(`${EDITOR_DRAFT_KEY_PREFIX}${earlier.scope}:${earlier.tabId}`, JSON.stringify(earlier));

    const editor = await mountEditor(loaded, { canSave: false });
    const { container } = editor;
    expect(noticeOf(container)?.textContent).toContain('are kept and restored once you can edit.');

    // Someone changed female since: that value now waits for a choice.
    await editor.reload(serverProject({ female: 400, male: 0 }), { canSave: false });
    expect(noticeOf(container)?.textContent).toContain(
      'are kept and restored once you can edit. 1 value was also changed on the server since; you choose which to keep then.'
    );

    // The server now holds the draft's values (its save landed after all).
    await editor.reload({ ...typed }, { canSave: false });
    expect(noticeOf(container)?.textContent).not.toContain('Unsaved changes from this device');
    expect(storedDrafts()).toHaveLength(1); // still untouched while read-only
  });

  it('shows the stored report texts while read-only, and the editing component again once it can save', async () => {
    const loaded = serverProject({ female: 0, male: 0, reportText1: 'Saved caption' });
    const editor = await mountEditor(loaded, { canSave: false });
    const { container } = editor;
    const view = reportContentCard(container) as FakeNode;
    expect(view.textContent).toContain('reportText1');
    expect(view.textContent).toContain('Saved caption');
    for (const tag of ['button', 'input', 'textarea', 'select']) expect(byTag(view, tag)).toHaveLength(0);

    await editor.reload({ ...loaded }, { canSave: true });
    expect(reportContentCard(container)?.textContent).not.toContain('Saved caption');
    expect(shownFemale(container)).toBe('0');
  });

  describe('field-level saves', () => {
    it('sends only the values changed here: two changes go out as one request naming both', async () => {
      const loaded = serverProject({ female: 0, male: 0, stadium: 900, reportText1: 'Saved caption' });
      const editor = await mountEditor(loaded, { canSave: true });
      const { container } = editor;
      const [femaleCard, maleCard] = byClass(container, 'stat-card');

      await editor.click(femaleCard);
      await editor.click(maleCard);
      await editor.click(femaleCard);
      expect(api.saves).toHaveLength(0); // still in the debounce
      await sendWaiting();

      // One request, both counters as counts of the taps made here, nothing
      // else: no whole stats, no hashtag list, no name or date.
      expect(api.saves).toHaveLength(1);
      expect(api.saves[0]).toEqual({
        projectId: PROJECT_ID,
        statsChanges: {},
        statsIncrements: { female: 2, male: 1 },
        tabId: expect.stringMatching(/^[A-Za-z0-9_-]{8,64}$/),
        clientSeq: 1,
      });
      expect(statusLine(container)).toBe('✅ Saved');
      expect(storedDrafts()).toHaveLength(0);

      await editor.click(maleCard);
      await sendWaiting();
      expect(api.saves[1]).toEqual({
        projectId: PROJECT_ID,
        statsChanges: {},
        statsIncrements: { male: 1 },
        tabId: api.saves[0].tabId,
        clientSeq: 2,
      });
    });

    it('counts on from what the server holds: taps from another device are kept, not overwritten', async () => {
      // Gates A and B both count female from 100. This tab (A) taps 3 times
      // while B's 20 taps are stored; a re-fetch shows B's count with A's taps
      // on top, and what A sends adds its taps to whatever the server holds.
      const editor = await mountEditor(serverProject({ female: 100, male: 0 }), { canSave: true });
      const { container } = editor;
      const femaleCard = byClass(container, 'stat-card')[0];

      await editor.click(femaleCard);
      await editor.click(femaleCard);
      await editor.click(femaleCard);
      expect(femaleOnCard(container)).toBe('103');
      await editor.reload(serverProject({ female: 120, male: 0 }), { canSave: true });
      expect(femaleOnCard(container)).toBe('123');

      await sendWaiting();
      expect(api.saves).toHaveLength(1);
      expect(api.saves[0].statsIncrements).toEqual({ female: 3 });
      expect(api.saves[0].statsChanges).toEqual({});
    });

    it('a tap on a stat with no stored number is saved as the value shown; later taps count on', async () => {
      const neverCounted = serverProject({});
      delete (neverCounted.stats as Record<string, unknown>).female;
      const editor = await mountEditor(neverCounted, { canSave: true });
      const { container } = editor;
      const femaleCard = byClass(container, 'stat-card')[0];

      await editor.click(femaleCard);
      await sendWaiting();
      await editor.click(femaleCard);
      await sendWaiting();

      expect(api.saves.map((s) => [s.statsChanges, s.statsIncrements])).toEqual([
        [{ female: 1 }, undefined],
        [{}, { female: 1 }],
      ]);
    });

    it('never queues a value the server cannot store, so later changes keep saving', async () => {
      // Builder mode used to hand over nested [fanmass.x] tokens as flat keys;
      // PUT refuses a dotted key, and every later change was held behind it.
      const editor = await mountEditor(serverProject({ female: 0, male: 0 }), { canSave: true });
      const { container } = editor;
      const report = withAttr(container, 'data-report-content')[0];
      expect(report).toBeDefined();

      await act(async () => mockReportCommit.current?.({ 'fanmass.peopleCount': 0, reportText2: 'kept' }));
      await settle();
      await editor.click(byClass(container, 'stat-card')[0]);
      await sendWaiting();

      expect(api.saves).toHaveLength(1);
      expect(api.saves[0].statsChanges).toEqual({ reportText2: 'kept' });
      expect(api.saves[0].statsIncrements).toEqual({ female: 1 });
      expect(JSON.stringify(api.saves)).not.toContain('fanmass.peopleCount');
      expect(storedDrafts()).toHaveLength(0);
    });

    it('a draft holding a value the server cannot store restores the rest and never sends that value', async () => {
      // Written by an editor before it filtered Builder mode's nested tokens.
      const loaded = serverProject({ female: 0, male: 0 });
      const earlier = storedDraft(loaded, serverProject({ female: 5, male: 0 }), Date.UTC(2026, 8, 27, 14, 5));
      earlier.fields['stats:fanmass.peopleCount'] = 0;
      storage().setItem(`${EDITOR_DRAFT_KEY_PREFIX}${earlier.scope}:${earlier.tabId}`, JSON.stringify(earlier));

      const editor = await mountEditor(loaded, { canSave: true });
      expect(shownFemale(editor.container)).toBe('5');
      await sendWaiting();

      expect(api.saves).toHaveLength(1);
      expect(api.saves[0].statsChanges).toEqual({ female: 5 });
      expect(JSON.stringify(api.saves)).not.toContain('fanmass.peopleCount');
      expect(storedDrafts()).toHaveLength(0);
    });

    it('a save the server refuses for good is kept apart and shown; later changes are saved on their own', async () => {
      const editor = await mountEditor(serverProject({ female: 0, male: 0 }), { canSave: true });
      const { container } = editor;
      const [femaleCard, maleCard] = byClass(container, 'stat-card');

      api.saveReply = { status: 413, body: { success: false, error: 'Request body too large' } };
      await editor.click(femaleCard);
      await sendWaiting();
      expect(statusLine(container)).toBe('❌ Not saved - refused by the server (1 change)');
      expect(container.textContent).toContain('Not saved (1 change). Request body too large.');
      expect(container.textContent).toContain('not sent again until you press Retry now');

      api.saveReply = { status: 200, body: { success: true } };
      await editor.click(maleCard);
      await sendWaiting();
      expect(api.saves.map((s) => s.statsIncrements)).toEqual([{ female: 1 }, { male: 1 }]);
      expect(statusLine(container)).toBe('❌ Not saved - refused by the server (1 change)');

      // Retry now sends the refused one again -- as a new request.
      await editor.click(buttonLabelled(container, 'Retry now'));
      expect(api.saves.map((s) => s.statsIncrements)).toEqual([{ female: 1 }, { male: 1 }, { female: 1 }]);
      expect(api.saves[2].clientSeq).toBeGreaterThan(api.saves[1].clientSeq);
      expect(statusLine(container)).toBe('✅ Saved');
      expect(storedDrafts()).toHaveLength(0);
    });

    it('never sends back a value it did not change -- not even one a re-fetch brought in while a save was out', async () => {
      const editor = await mountEditor(serverProject({ female: 0, male: 0, stadium: 0 }), { canSave: true });
      const { container } = editor;
      const femaleCard = byClass(container, 'stat-card')[0];

      let land: () => void = () => {};
      api.saveGate = new Promise<void>((resolve) => {
        land = resolve;
      });
      await editor.click(femaleCard);
      await sendWaiting();
      expect(api.saves).toHaveLength(1); // out, not answered yet

      // The tab comes back into view and re-loads before the save lands:
      // fanmass has stored the stadium count meanwhile.
      await editor.reload(serverProject({ female: 0, male: 0, stadium: 900 }), { canSave: true });
      expect(femaleOnCard(container)).toBe('1'); // the value on its way stays on screen

      api.saveGate = null;
      await act(async () => land());
      await settle();
      expect(statusLine(container)).toBe('✅ Saved');

      // The confirmed save moved the base for female only; for stadium it still
      // holds the server's 900. Another change is waiting when the next
      // re-load says fanmass moved stadium on again: taken, because this tab
      // never changed it (a base moved back to the payload's time would call
      // 900 a change of this tab's and keep it over 950).
      await editor.click(femaleCard);
      await editor.reload(serverProject({ female: 1, male: 0, stadium: 950 }), {
        canSave: true,
        fetchStartedAt: Date.now() + 1000, // left after the confirmed save
      });
      expect(draftField('stats:stadium')).toBe(950);
      expect(femaleOnCard(container)).toBe('2');

      await sendWaiting();
      expect(api.saves.map((s) => s.statsIncrements)).toEqual([{ female: 1 }, { female: 1 }]);
      expect(api.saves.map((s) => s.statsChanges)).toEqual([{}, {}]);
    });

    it('keeps and saves a value set back while its save was out, over a re-fetch that changed it', async () => {
      // A typed value (Manual mode) is the operator's latest word on it.
      const editor = await mountEditor(serverProject({ female: 0, male: 0 }), { canSave: true });
      const { container } = editor;
      await editor.click(buttonLabelled(container, 'Clicker')); // to Manual mode
      const enter = async (text: string) => {
        const field = typeInto(numberField(container), text);
        await act(async () => field.blur());
        await settle();
      };

      let land: () => void = () => {};
      api.saveGate = new Promise<void>((resolve) => {
        land = resolve;
      });
      await enter('1');
      await sendWaiting(); // female 1 is out
      await enter('0'); // and back to 0, waiting

      // A re-fetch says someone else stored female 5 meanwhile. 0 is what the
      // operator recorded last, so 0 stays on screen -- and is what is saved.
      await editor.reload(serverProject({ female: 5, male: 0 }), { canSave: true });
      expect(femaleOnCard(container)).toBe('0');

      api.saveGate = null;
      await act(async () => land());
      await settle();
      await sendWaiting();
      expect(api.saves.map((s) => s.statsChanges)).toEqual([{ female: 1 }, { female: 0 }]);
      expect(femaleOnCard(container)).toBe('0');
      expect(storedDrafts()).toHaveLength(0);
    });

    it('taps and untaps while a save is out change nothing of what another device counted meanwhile', async () => {
      const editor = await mountEditor(serverProject({ female: 0, male: 0 }), { canSave: true });
      const { container } = editor;

      let land: () => void = () => {};
      api.saveGate = new Promise<void>((resolve) => {
        land = resolve;
      });
      await editor.click(byClass(container, 'stat-card')[0]);
      await sendWaiting(); // +1 is out
      await editor.click(byClass(container, 'stat-decrement')[0]); // -1, waiting

      // Another device stored 5 meanwhile: this tab's taps add up to nothing.
      await editor.reload(serverProject({ female: 5, male: 0 }), { canSave: true });
      expect(femaleOnCard(container)).toBe('5');

      api.saveGate = null;
      await act(async () => land());
      await settle();
      await sendWaiting();
      expect(api.saves.map((s) => s.statsIncrements)).toEqual([{ female: 1 }, { female: -1 }]);
      expect(femaleOnCard(container)).toBe('5');
      expect(storedDrafts()).toHaveLength(0);
    });

    it('counts a { stale: true } answer as saved: nothing stays pending, the draft is dropped, nothing is retried', async () => {
      const editor = await mountEditor(serverProject({ female: 0, male: 0 }), { canSave: true });
      const { container } = editor;
      api.saveReply = { status: 200, body: { success: true, stale: true } };

      await editor.click(byClass(container, 'stat-card')[0]);
      expect(storedDrafts()).toHaveLength(1);
      await sendWaiting();

      expect(api.saves).toHaveLength(1);
      expect(statusLine(container)).toBe('✅ Saved');
      expect(storedDrafts()).toHaveLength(0);
      expect(await leaveAsks()).toBe(false);
      expect(api.saves).toHaveLength(1);
    });

    it('a draft restored on load saves only its own values, not the server copy it was merged into', async () => {
      const loaded = serverProject({ female: 0, male: 0 });
      const earlier = storedDraft(loaded, serverProject({ female: 412, male: 0 }), Date.UTC(2026, 8, 27, 14, 5));
      storage().setItem(`${EDITOR_DRAFT_KEY_PREFIX}${earlier.scope}:${earlier.tabId}`, JSON.stringify(earlier));

      // An admin stored the stadium count since the draft was made.
      const editor = await mountEditor(serverProject({ female: 0, male: 0, stadium: 900 }), { canSave: true });
      expect(shownFemale(editor.container)).toBe('412');
      expect(editor.container.textContent).toContain('Restored unsaved changes from this device');

      await sendWaiting();
      expect(api.saves).toHaveLength(1);
      expect(api.saves[0].statsChanges).toEqual({ female: 412 });
      expect(api.saves[0]).not.toHaveProperty('hashtags');
      expect(storedDrafts()).toHaveLength(0);
    });

    it('"Use this device\'s values" saves exactly the held-back values, with the restored ones', async () => {
      const loaded = serverProject({ female: 0, male: 0 });
      const earlier = storedDraft(loaded, serverProject({ female: 412, male: 388 }), Date.UTC(2026, 8, 27, 14, 5));
      storage().setItem(`${EDITOR_DRAFT_KEY_PREFIX}${earlier.scope}:${earlier.tabId}`, JSON.stringify(earlier));

      // Since the draft: an admin set female to 400 (a conflict) and stored stadium.
      const editor = await mountEditor(serverProject({ female: 400, male: 0, stadium: 900 }), { canSave: true });
      const { container } = editor;
      expect(container.textContent).toContain('1 unsaved value from this device was not restored');
      expect(femaleOnCard(container)).toBe('400');

      await editor.click(buttonLabelled(container, 'Use this device'));
      expect(femaleOnCard(container)).toBe('412');
      await sendWaiting();
      expect(api.saves).toHaveLength(1);
      expect(api.saves[0].statsChanges).toEqual({ male: 388, female: 412 });
      expect(storedDrafts()).toHaveLength(0);
    });
  });

  describe('leaving or hiding the page', () => {
    it('records the number being typed when the tab is closed or reloaded, so the leave warning fires for it', async () => {
      const editor = await mountEditor(serverProject({ female: 0, male: 0 }), { canSave: true });
      const { container } = editor;
      await editor.click(buttonLabelled(container, 'Clicker')); // to Manual mode
      typeInto(numberField(container), '7');

      // Nothing was recorded yet (numbers record on blur); closing records it
      // first, then asks, and sends it at once.
      expect(await leaveAsks()).toBe(true);
      expect(api.saves.map((s) => s.statsChanges)).toEqual([{ female: 7 }]);
      expect(femaleOnCard(container)).toBe('7');
      expect(await leaveAsks()).toBe(false);
    });

    it('records the report text being typed when the tab goes without a warning (pagehide), or is hidden', async () => {
      const editor = await mountEditor(serverProject({ female: 0, male: 0 }), { canSave: true });
      const { container } = editor;

      api.saveReply = { status: 500, body: { success: false, error: 'Database unavailable' } };
      typeInto(text2Field(container), 'Typed before the tab closed');
      await pageHide();
      // Kept on this device, and sent at once.
      expect(draftField('stats:reportText2')).toBe('Typed before the tab closed');
      expect(api.saves.map((s) => s.statsChanges)).toEqual([{ reportText2: 'Typed before the tab closed' }]);

      api.saveReply = { status: 200, body: { success: true } };
      typeInto(text2Field(container), 'Typed before the tab was hidden');
      await sendWaiting();
      // The failed save first, unchanged, then the newer text: in order, and
      // both sent the moment the tab was hidden.
      expect(api.saves.slice(1).map((s) => s.statsChanges)).toEqual([
        { reportText2: 'Typed before the tab closed' },
        { reportText2: 'Typed before the tab was hidden' },
      ]);
      expect(storedDrafts()).toHaveLength(0);
    });
  });

  describe('edit page', () => {
    const loaded = serverProject({ female: 0, male: 0 });
    const loadAnswer = (canSave: boolean) => ({ status: 200, body: { success: true, project: loaded, canSave } });

    it('makes a read-only editor editable in place once the password is entered', async () => {
      api.loadReply = loadAnswer(false);
      const page = await mountPage();
      const { container } = page;
      expect(fieldsetDisabled(container)).toBe(true);
      expect(noticeOf(container)).not.toBeNull();

      // A password was set meanwhile: the next load (tab refocus) asks for it,
      // and the prompt takes the editor's place.
      api.loadReply = { status: 401, body: { success: false, code: 'PAGE_PASSWORD_REQUIRED' } };
      await page.refocus();
      const shell = byClass(container, 'page-bg-gray')[0];
      expect(shell.hasAttribute('hidden')).toBe(true);

      // Entered on the edit link, so the load after the unlock says canSave.
      api.loadReply = loadAnswer(true);
      await page.click(descendants(container).find((n) => n.hasAttribute('data-unlock')) ?? null);
      expect(shell.hasAttribute('hidden')).toBe(false);
      expect(fieldsetDisabled(container)).toBe(false);
      expect(noticeOf(container)).toBeNull();
    });

    it('turns a loaded editor read-only when a re-fetch answers EDIT_LINK_REQUIRED, and back when a load allows saving', async () => {
      api.loadReply = loadAnswer(true);
      const page = await mountPage();
      const { container } = page;
      expect(fieldsetDisabled(container)).toBe(false);

      api.loadReply = {
        status: 403,
        body: { success: false, code: 'EDIT_LINK_REQUIRED', error: 'This link uses the event ID. Open the event edit link instead, or sign in.' },
      };
      await page.refocus();
      expect(fieldsetDisabled(container)).toBe(true);
      expect(noticeOf(container)?.textContent).toContain('You can view this event but not save changes.');

      api.loadReply = loadAnswer(true);
      await page.refocus();
      expect(fieldsetDisabled(container)).toBe(false);
      expect(noticeOf(container)).toBeNull();
    });

    it('turning read-only mid-session records the report text being typed first; Report Content stays mounted, hidden', async () => {
      api.loadReply = loadAnswer(true);
      const page = await mountPage();
      const { container } = page;

      // A count is recorded and waiting; report text 2 is being typed (not yet
      // recorded: text boxes record on blur) when a re-load (tab refocus)
      // says this caller can no longer save.
      await page.click(byClass(container, 'stat-card')[0]);
      const field = typeInto(text2Field(container), 'Typed in slot 2');
      api.loadReply = loadAnswer(false);
      await page.refocus();

      expect(fieldsetDisabled(container)).toBe(true);
      // Recorded before the switch: in the draft, counted by the notice, shown.
      expect(draftField('stats:reportText2')).toBe('Typed in slot 2');
      expect(noticeOf(container)?.textContent).toContain('2 unsaved changes are kept on this device and saved once you can edit.');
      expect(reportContentCard(container)?.textContent).toContain('Typed in slot 2');
      // The Report Content editor is hidden, not unmounted: what is typed in it stays.
      expect(contentEditorHidden(container)).toBe(true);
      expect(text2Field(container)).toBe(field);

      // Refused while read-only; sent again once a load says it can save.
      api.saveReply = { status: 401, body: { success: false, code: 'EDIT_ACCESS_REQUIRED', error: 'Edit access expired or missing.' } };
      await sendWaiting();
      expect(api.saves).toHaveLength(1);
      api.saveReply = { status: 200, body: { success: true } };
      api.loadReply = loadAnswer(true);
      await page.refocus();
      expect(fieldsetDisabled(container)).toBe(false);
      expect(contentEditorHidden(container)).toBe(false);
      expect(text2Field(container)).toBe(field);
      expect(api.saves.map((s) => [s.statsChanges, s.statsIncrements])).toEqual([
        [{ reportText2: 'Typed in slot 2' }, { female: 1 }],
        [{ reportText2: 'Typed in slot 2' }, { female: 1 }],
      ]);
      expect(storedDrafts()).toHaveLength(0);
    });

    it('records the number being typed before the password prompt hides the editor', async () => {
      api.loadReply = loadAnswer(true);
      const page = await mountPage();
      const { container } = page;
      await page.click(buttonLabelled(container, 'Clicker')); // to Manual mode
      typeInto(numberField(container), '12');

      api.loadReply = { status: 401, body: { success: false, code: 'PAGE_PASSWORD_REQUIRED' } };
      await page.refocus();
      expect(byClass(container, 'page-bg-gray')[0].hasAttribute('hidden')).toBe(true);
      expect(draftField('stats:female')).toBe(12);
    });

    it('records the field being typed when a re-fetch answers EDIT_LINK_REQUIRED', async () => {
      api.loadReply = loadAnswer(true);
      const page = await mountPage();
      const { container } = page;
      typeInto(text2Field(container), 'Typed before the link check');

      api.loadReply = { status: 403, body: { success: false, code: 'EDIT_LINK_REQUIRED', error: 'Open the event edit link.' } };
      await page.refocus();
      expect(fieldsetDisabled(container)).toBe(true);
      expect(draftField('stats:reportText2')).toBe('Typed before the link check');
      expect(noticeOf(container)?.textContent).toContain('1 unsaved change is kept on this device');
    });
  });
});

describe('EditorDashboard event writes', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'components/EditorDashboard.tsx'), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('sends every PUT /api/projects through the save queue', () => {
    // Stats, hashtags and child-editor commits all feed one queue, so no save
    // can overtake or be dropped against another. A second direct writer to
    // this route would reintroduce both.
    expect(code.match(/['"`]\/api\/projects['"`]/g)).toHaveLength(1);
    expect(code).toMatch(/return sendJsonForSave\('\/api\/projects', body\);/);
    expect(code).not.toMatch(/\bapiPut\b/);
  });

  it('merges what waits in the queue instead of replacing it', () => {
    // Payloads name only what changed; the default (replace) would drop the
    // older change.
    expect(code).toMatch(/createSaveQueue<EditorSavePayload>\(\{\s*coalesce: mergeEditorSavePayloads,/);
  });

  it('records what each save sends before the request leaves', () => {
    const send = code.slice(code.indexOf('send: (payload, attempt) =>'), code.indexOf("sendJsonForSave('/api/projects'"));
    expect(send.length).toBeGreaterThan(0);
    expect(send).toMatch(/addSentValues\(/);
    expect(send).toMatch(/persistDraft\(\)/);
  });

  it('declares no components inside EditorDashboard (they would remount every input on each change)', () => {
    // A component type created during render is a new type on every render:
    // React replaces its DOM, and a Manual-mode input loses focus when the
    // previous field's blur saves.
    const body = code.slice(code.indexOf('export default function EditorDashboard'));
    expect(body).not.toMatch(/\n\s+const [A-Z]\w*\s*=\s*\(/);
  });

  it('waits for its own saves before a sheet push or pull, and holds saves during a pull', () => {
    const pull = code.slice(code.indexOf('const handleSheetPull'), code.indexOf('const handleSheetPush'));
    expect(pull).toMatch(/whenAllSaved\(queue\)/);
    expect(pull).toMatch(/queue\.hold\(\)/);
    expect(pull).toMatch(/applyServerCopy\(/);
    expect(pull).not.toMatch(/Refresh the page/);
    const push = code.slice(code.indexOf('const handleSheetPush'), code.indexOf('const recordLocalChange'));
    expect(push.indexOf('whenAllSaved(queue)')).toBeGreaterThan(-1);
    expect(push.indexOf('whenAllSaved(queue)')).toBeLessThan(push.indexOf('/google-sheet/push'));
  });
});

describe('edit page', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'app/edit/[slug]/page.tsx'), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('drops a load answer older than one already applied', () => {
    expect(code).toMatch(/createResponseOrder\(\)/);
    // Every answer that changes what is shown (password prompt, link-required
    // read-only switch, loaded copy) is checked before it applies.
    expect(code.match(/if \(!order\.accept\(ticket\)\) return \{ result: 'superseded', ticket \};/g)).toHaveLength(3);
  });

  it('shows the mid-session password prompt as the page, not as a modal over the editor', () => {
    expect(code).not.toMatch(/accessOverlay/);
    expect(code).toMatch(/<div className="page-bg-gray" hidden=\{needsPassword\} ref=\{editorShellRef\}>/);
  });

  it('does not tell someone who opened the event id that the link may not exist', () => {
    expect(code).toMatch(/errorKind !== 'link-required' && \(/);
  });
});
