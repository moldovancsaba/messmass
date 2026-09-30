// tests/partner-editor-save.test.tsx
// WHAT: Pins how the partner editor saves and when it is read-only: every save
//     goes through the save queue to the right route (PUT /api/partners for the
//     default report, PUT /api/partners/edit/<id>?variant=<slug> for a custom
//     variant); a refused save stays visible and on this device until the
//     server confirms it; a 401 re-loads the partner and resumes, or turns the
//     editor read-only with the unsaved changes kept; and an editor the server
//     says cannot save (canSave: false) takes no input, says so at the top, and
//     becomes editable again in place once a load says it can.
// WHY: 2026-09-27: an event editor's saves were refused for hours behind a
//     status that flashed "Save Error" and went back to "Ready"; the partner
//     editor had the same code. Owner decision D1: an unprotected partner
//     editor gets no save grant (its slug is the public report slug), so a
//     caller without an admin session or the partner-edit password sees it
//     read-only (D2).
// HOW: Same setup as tests/editor-dashboard-save.test.tsx. This repo's jest runs
//     in node without a DOM: first paints are rendered with
//     renderToStaticMarkup (state initialisers run -- that is where drafts are
//     restored -- effects do not), and the mounted tests use react-dom/client on
//     a minimal DOM stand-in with a mocked fetch. window.localStorage is a
//     Map-backed stand-in. Children that pull in Mantine or the network are
//     stubs that print what the editor hands them (value, checked, disabled);
//     the Report Content stub has one button that commits a report text, and
//     one text box that, like the real ones, commits only when it loses focus.

import React, { act } from 'react';
import fs from 'fs';
import path from 'path';
import { renderToStaticMarkup } from 'react-dom/server';

jest.mock('@/lib/apiClient', () => ({
  __esModule: true,
  ensureCsrfToken: jest.fn(async () => 'csrf-test-token'),
}));

// The report text the Report Content stub commits when its button is pressed.
const mockReportEdit = { text: 'Typed caption' };

jest.mock('@/components/ColoredCard', () => ({
  __esModule: true,
  default: ({ children }: { children?: React.ReactNode }) => require('react').createElement('section', null, children),
}));
jest.mock('@/components/ColoredHashtagBubble', () => ({
  __esModule: true,
  default: ({ hashtag }: { hashtag: string }) => require('react').createElement('span', { 'data-hashtag': hashtag }, hashtag),
}));
jest.mock('@/components/ReportContentManager', () => ({
  __esModule: true,
  default: ({ stats, onCommit }: { stats: Record<string, unknown>; onCommit: (next: Record<string, unknown>) => void }) => {
    const R = require('react');
    return R.createElement(
      'div',
      { 'data-report-content': '', 'data-text1': String(stats.reportText1 ?? '') },
      R.createElement(
        'button',
        { type: 'button', 'data-set-text': '', onClick: () => onCommit({ ...stats, reportText1: mockReportEdit.text }) },
        'Set text'
      ),
      // Like the real text slots: uncontrolled, recorded only when it loses focus.
      R.createElement('textarea', {
        'data-text2-field': '',
        defaultValue: String(stats.reportText2 ?? ''),
        onBlur: (e: { currentTarget: { value: string } }) => onCommit({ ...stats, reportText2: e.currentTarget.value }),
      })
    );
  },
}));
jest.mock('@/components/UnifiedTextInput', () => ({
  __esModule: true,
  // Like the real field: what is typed is recorded (onSave) when it loses focus.
  default: ({ value, disabled, onSave }: { value: string; disabled?: boolean; onSave: (v: string) => void }) =>
    require('react').createElement('input', {
      'data-logo-url': '',
      value,
      disabled,
      readOnly: true,
      onBlur: (e: { currentTarget: { value: string } }) => {
        if (e.currentTarget.value !== value) onSave(e.currentTarget.value);
      },
    }),
}));
jest.mock('@/components/ImageUploader', () => ({
  __esModule: true,
  default: ({ disabled }: { disabled?: boolean }) =>
    require('react').createElement('input', { type: 'file', 'data-logo-upload': '', disabled }),
}));
jest.mock('@/components/UnifiedCheckboxField', () => ({
  __esModule: true,
  default: ({ id, checked, disabled, onChange }: { id: string; checked: boolean; disabled?: boolean; onChange: (c: boolean) => void }) =>
    require('react').createElement('input', {
      type: 'checkbox',
      id,
      'data-flag': id,
      checked,
      disabled,
      readOnly: true,
      onClick: () => onChange(!checked),
    }),
}));

// The edit page's own dependencies (only the mounted page tests render it).
jest.mock('@/hooks/useReportStyle', () => ({ __esModule: true, useReportStyle: () => ({ loading: false }) }));
jest.mock('@/components/PagePasswordLogin', () => ({
  __esModule: true,
  clearAuthentication: jest.fn(),
  // Stands in for the password form: one button that reports a successful unlock.
  default: ({ onSuccess }: { onSuccess: (isAdmin: boolean) => void }) =>
    require('react').createElement('button', { type: 'button', 'data-unlock': '', onClick: () => onSuccess(false) }, 'Unlock'),
}));

import PartnerEditorDashboard, { partnerDraftScope, partnerSaveRequest } from '@/components/PartnerEditorDashboard';
import PartnerEditClient from '@/app/partner-edit/[slug]/PartnerEditClient';
import { EDITOR_DRAFT_KEY_PREFIX, type AccessCheckResult, type StoredDraft } from '@/lib/editorSaveQueue';

type Props = React.ComponentProps<typeof PartnerEditorDashboard>;
type ServerPartner = Props['partner'];

const PARTNER_ID = '66f6b0000000000000000002';
// The partner's viewSlug: the editor link /partner-edit/<slug> and the public
// report link /partner-report/<slug> use the same one.
const PARTNER_SLUG = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const NOTICE = 'You can view this partner but not save changes. Sign in to edit.';
const FLAGS = ['showEventsList', 'showEventsListTitle', 'showEventsListDetails', 'showOnlyTeam1Events'] as const;

function serverPartner(stats: Record<string, string> = {}, extra: Partial<ServerPartner> = {}): ServerPartner {
  return {
    _id: PARTNER_ID,
    name: 'PZPN',
    emoji: '⚽',
    showEmoji: true,
    logoUrl: 'https://i.ibb.co/abc/logo.png',
    hashtags: ['pzpn'],
    categorizedHashtags: {},
    showEventsList: true,
    showEventsListTitle: true,
    showEventsListDetails: true,
    showOnlyTeam1Events: false,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-27T08:00:00.000Z',
    stats,
    ...extra,
  };
}

// The stored field layout: the logo, one field per switch, one per report slot.
function fieldsOf(p: ServerPartner): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  if (p.logoUrl) fields.logoUrl = p.logoUrl;
  for (const flag of FLAGS) if (typeof p[flag] === 'boolean') fields[flag] = p[flag];
  for (const [key, value] of Object.entries(p.stats)) if (value !== undefined) fields[`stats:${key}`] = value;
  return fields;
}

function storedDraft(base: ServerPartner, local: ServerPartner, editedAt: number, variant: string | null = null): StoredDraft {
  return {
    v: 1,
    scope: partnerDraftScope(PARTNER_ID, variant),
    tabId: 'earlier-tab',
    editedAt,
    base: fieldsOf(base),
    fields: fieldsOf(local),
  };
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

const draftKeyOf = (d: StoredDraft) => `${EDITOR_DRAFT_KEY_PREFIX}${d.scope}:${d.tabId}`;
const withDrafts = (...drafts: StoredDraft[]) =>
  memoryStorage(Object.fromEntries(drafts.map((d) => [draftKeyOf(d), JSON.stringify(d)])));
const storageDump = (storage: ReturnType<typeof memoryStorage>) =>
  JSON.stringify(Array.from({ length: storage.length }, (_, i) => storage.getItem(storage.key(i)!)));

const g = globalThis as unknown as Record<string, unknown>;

function render(partner: ServerPartner, storage: unknown, extra: Partial<Props> = {}): string {
  g.window = { localStorage: storage };
  return renderToStaticMarkup(<PartnerEditorDashboard partner={partner} {...extra} />);
}

afterEach(() => {
  delete g.window;
  jest.restoreAllMocks();
});

describe('partnerSaveRequest', () => {
  const partner = serverPartner({ reportText1: 'Caption', reportText2: 'Second' });
  // What the server is known to hold: the loaded copy.
  const base = fieldsOf(partner);
  const edited = { ...partner, stats: { reportText1: 'New caption', reportText2: 'Second' } };

  it('saves the default report through PUT /api/partners: only the slots changed here, nothing else', () => {
    const { url, body, fields } = partnerSaveRequest(edited, null, base);
    expect(url).toBe('/api/partners');
    // Field-level: reportText2 is not sent, so a newer one saved by another
    // device is not put back. No logo, no switches: an echoed value would put
    // back one changed since (camera sync sets logos, an admin sets the switches).
    expect(body).toEqual({ partnerId: PARTNER_ID, statsChanges: { reportText1: 'New caption' } });
    expect(fields).toEqual({ 'stats:reportText1': 'New caption' });
    // ?variant=default is the default report too.
    expect(partnerSaveRequest(edited, 'default', base).url).toBe('/api/partners');
  });

  it('names a slot that is gone in statsRemoved', () => {
    const cleared = { ...partner, stats: { reportText1: 'Caption' } };
    const { body, fields } = partnerSaveRequest(cleared, null, base);
    expect(body).toEqual({ partnerId: PARTNER_ID, statsChanges: {}, statsRemoved: ['reportText2'] });
    expect(fields).toEqual({ 'stats:reportText2': undefined });
  });

  it('carries the tab and request number for the late-write guard, on both routes', () => {
    const sequence = { tabId: 'tab_7f3a9c21-e4', clientSeq: 4 };
    expect(partnerSaveRequest(edited, null, base, sequence).body).toMatchObject(sequence);
    expect(partnerSaveRequest(edited, 'vip', base, sequence).body).toEqual({
      metadata: { statsChanges: { reportText1: 'New caption' } },
      ...sequence,
    });
  });

  it('sends the logo and each switch only when it differs from what the server holds', () => {
    const changed = { ...partner, logoUrl: 'https://i.ibb.co/new/logo.png', showOnlyTeam1Events: true };
    expect(partnerSaveRequest(changed, null, base).body).toEqual({
      partnerId: PARTNER_ID,
      statsChanges: {},
      logoUrl: 'https://i.ibb.co/new/logo.png',
      showOnlyTeam1Events: true,
    });
  });

  it('sends a removed logo as an empty string on both routes (both skip an absent field)', () => {
    const removed = { ...partner, logoUrl: undefined };
    expect(partnerSaveRequest(removed, null, base).body.logoUrl).toBe('');
    expect(partnerSaveRequest(removed, 'vip', base).body).toEqual({ metadata: { statsChanges: {}, logoUrl: '' } });
    // Loaded without a logo and still without one: nothing is sent, so a logo
    // set elsewhere since stays.
    expect(partnerSaveRequest(removed, null, fieldsOf(removed)).body).not.toHaveProperty('logoUrl');
  });

  it('saves a custom variant through PUT /api/partners/edit/<id>?variant=<slug>, metadata only', () => {
    const { url, body } = partnerSaveRequest(edited, 'vip lounge', base);
    expect(url).toBe(`/api/partners/edit/${PARTNER_ID}?variant=vip%20lounge`);
    // The logo and switches the load showed may be the partner's own (the
    // variant has none of its own): an unchanged one is never written into it.
    expect(body).toEqual({ metadata: { statsChanges: { reportText1: 'New caption' } } });
  });

  it('keeps default and variant drafts under separate keys', () => {
    expect(partnerDraftScope(PARTNER_ID, null)).toBe(`partner-${PARTNER_ID}`);
    expect(partnerDraftScope(PARTNER_ID, 'default')).toBe(`partner-${PARTNER_ID}`);
    expect(partnerDraftScope(PARTNER_ID, 'vip')).toBe(`partner-${PARTNER_ID}-variant-vip`);
  });
});

describe('PartnerEditorDashboard first paint', () => {
  const saved = serverPartner({ reportText1: 'Saved caption' });

  it('canSave false: every control disabled with its value visible, and the notice first, as an alert', () => {
    const html = render(serverPartner({ reportText1: 'Saved caption', reportImage1: 'https://i.ibb.co/abc/first.jpg' }), memoryStorage(), {
      canSave: false,
    });
    expect(html).toMatch(/<fieldset[^>]*disabled=""/);
    expect(html).toContain(
      'You can view this partner but not save changes.</strong> Sign in to edit.'
    );
    const notice = html.indexOf('role="alert"');
    expect(notice).toBeGreaterThan(-1);
    expect(notice).toBeLessThan(html.indexOf('admin-header'));
    expect(notice).toBeLessThan(html.indexOf('<fieldset'));

    // Every control is disabled and still shows its value.
    const tag = (marker: string) => html.match(new RegExp(`<input[^>]*${marker}[^>]*>`))?.[0] ?? '';
    expect(tag('data-logo-url=""')).toContain('disabled=""');
    expect(tag('data-logo-url=""')).toContain('value="https://i.ibb.co/abc/logo.png"');
    expect(tag('data-logo-upload=""')).toContain('disabled=""');
    for (const flag of FLAGS) expect(tag(`data-flag="${flag}"`)).toContain('disabled=""');
    expect(tag('data-flag="showEventsList"')).toContain('checked=""');

    // Report Content: the stored texts and images, with nothing to press.
    expect(html).not.toContain('data-report-content');
    const view = html.slice(html.indexOf('📦 Partner Report Content'), html.indexOf('🏢 Partner Information'));
    expect(view).toContain('Saved caption');
    expect(view).toContain('first.jpg');
    expect(view).not.toMatch(/<(button|input|textarea|select)\b/);

    // The status line does not say "Ready".
    expect(html).toContain('🔒 Read-only');
    expect(html).not.toContain('📝 Ready');
  });

  it('canSave true, or not reported by an older server: editable, no notice', () => {
    for (const extra of [{ canSave: true }, {}] as Array<Partial<Props>>) {
      const html = render(saved, memoryStorage(), extra);
      expect(html).toMatch(/<fieldset(?![^>]*disabled)[^>]*>/);
      expect(html).not.toContain('role="alert"');
      expect(html).not.toContain(NOTICE.slice(0, 30));
      expect(html).toContain('📝 Ready');
      expect(html).toContain('data-text1="Saved caption"');
      expect(html).not.toMatch(/<input[^>]*disabled=""/);
    }
  });

  it('restores an unsaved draft when the server still holds what it was made on', () => {
    const typed = serverPartner({ reportText1: 'Typed offline' });
    const html = render(saved, withDrafts(storedDraft(saved, typed, Date.UTC(2026, 8, 27, 14, 5))));
    expect(html).toContain('data-text1="Typed offline"');
    expect(html).toContain('Restored unsaved changes from this device');
  });

  it('does not restore over a value changed on the server since: it asks', () => {
    const typed = serverPartner({ reportText1: 'Typed offline' });
    const adminEdited = serverPartner({ reportText1: 'Admin caption' });
    const html = render(adminEdited, withDrafts(storedDraft(saved, typed, 1)));
    expect(html).toContain('data-text1="Admin caption"');
    expect(html).toContain('1 unsaved value from this device was not restored');
    expect(html).toContain('reportText1: this device &quot;Typed offline&quot;, saved &quot;Admin caption&quot;');
    expect(html).toContain('Keep saved values');
  });

  it('does not restore a variant draft into the default report, or the other way round', () => {
    const typed = serverPartner({ reportText1: 'Typed offline' });
    const variantDraft = storedDraft(saved, typed, 1, 'vip');
    expect(render(saved, withDrafts(variantDraft))).toContain('data-text1="Saved caption"');
    expect(render(saved, withDrafts(variantDraft), { variantSlug: 'vip' })).toContain('data-text1="Typed offline"');
    const defaultDraft = storedDraft(saved, typed, 1);
    expect(render(saved, withDrafts(defaultDraft), { variantSlug: 'vip' })).toContain('data-text1="Saved caption"');
  });

  it('read-only: leaves the drafts on this device untouched and says they are kept', () => {
    const typed = serverPartner({ reportText1: 'Typed offline' });
    const storage = withDrafts(storedDraft(saved, typed, Date.UTC(2026, 8, 27, 14, 5)));
    const before = storageDump(storage);
    const html = render(saved, storage, { canSave: false });
    expect(html).toContain('Saved caption');
    expect(html).not.toContain('Typed offline');
    expect(html).not.toContain('Restored unsaved changes');
    expect(html).toContain('are kept and restored once you can edit.');
    expect(storageDump(storage)).toBe(before);
  });
});

describe('PartnerEditorDashboard source', () => {
  const src = fs.readFileSync(path.join(process.cwd(), 'components/PartnerEditorDashboard.tsx'), 'utf8');
  const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  it('sends every save through the save queue', () => {
    // One request builder, one sender, called only from the queue's send: a
    // second writer could overtake the queue or be dropped against it.
    expect(code).not.toMatch(/\bapiPut\b/);
    expect(code.match(/sendJsonForSave\(/g)).toHaveLength(1);
    const send = code.slice(code.indexOf('send: (payload, attempt) =>'), code.indexOf('onSaved:'));
    expect(send.length).toBeGreaterThan(0);
    expect(send).toMatch(/return sendJsonForSave\(request\.url, request\.body\);/);
    expect(send).toMatch(/addSentValues\(/);
    expect(send).toMatch(/persistDraft\(\)/);
  });

  it('declares no components inside PartnerEditorDashboard (they would remount every input on each change)', () => {
    const body = code.slice(code.indexOf('export default function PartnerEditorDashboard'));
    expect(body).not.toMatch(/\n\s+const [A-Z]\w*\s*=\s*\(/);
  });
});

// ---------------------------------------------------------------------------
// Mounted editor
// WHAT: A minimal DOM stand-in, enough for react-dom/client to mount the
//     editor, re-render it with new props, run its effects and deliver clicks.
//     The same stand-in as tests/editor-dashboard-save.test.tsx.
// LIMITS: No layout, no focus, no form semantics: a disabled fieldset is
//     checked by its attribute, not by the browser refusing clicks inside it.

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
  // calls blur(). Removing a node does not blur it here: React ignores that
  // blur in the browser anyway (it arrives while React commits).
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
const withAttr = (root: FakeNode, attr: string) => descendants(root).filter((n) => n.hasAttribute(attr));
const buttonsLabelled = (root: FakeNode, label: string) => byTag(root, 'button').filter((b) => b.textContent.includes(label));
const noticeOf = (root: FakeNode) => descendants(root).find((n) => n.getAttribute('role') === 'alert') ?? null;
const fieldsetDisabled = (root: FakeNode) => byTag(root, 'fieldset')[0].hasAttribute('disabled');
const statusLine = (root: FakeNode) => byClass(root, 'admin-status')[0]?.textContent ?? '';
// The Report Content stub is mounted once the editor could save, and hidden
// (kept mounted) while it is read-only after that.
const shownText = (root: FakeNode) => withAttr(root, 'data-report-content')[0]?.getAttribute('data-text1');
const contentEditorHidden = (root: FakeNode) =>
  (withAttr(root, 'data-report-content')[0]?.parentNode as FakeNode | undefined)?.hasAttribute('hidden');
// Focuses a field and types into it without committing (commits happen on blur).
const typeInto = (field: FakeNode | undefined, text: string) => {
  if (!field) throw new Error('no field to type into');
  field.focus();
  field.value = text;
  return field;
};
const text2Field = (root: FakeNode) => withAttr(root, 'data-text2-field')[0];
const logoField = (root: FakeNode) => withAttr(root, 'data-logo-url')[0];
// Every data-entry control the stubs render, and whether each is disabled.
const controlsDisabled = (root: FakeNode) =>
  [...withAttr(root, 'data-logo-url'), ...withAttr(root, 'data-logo-upload'), ...withAttr(root, 'data-flag')].map((n) =>
    n.hasAttribute('disabled')
  );

interface SaveCall {
  url: string;
  body: Record<string, unknown>;
}

interface FakeApi {
  fetch: jest.Mock;
  /** Every PUT, in order. */
  saves: SaveCall[];
  /** Answers for the next PUTs, in order; 200 once they run out. */
  saveReplies: Array<{ status: number; body: unknown }>;
  /** What each GET /api/partners/edit/<slug> (the page's load) answers. */
  loadReply: { status: number; body: unknown };
  /** URLs of every page load, in order. */
  loads: string[];
}

function fakeApi(): FakeApi {
  const api: FakeApi = {
    fetch: jest.fn(),
    saves: [],
    saveReplies: [],
    loadReply: { status: 404, body: { success: false, error: 'Partner not found' } },
    loads: [],
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
    if (init?.method === 'PUT') {
      api.saves.push({ url, body: JSON.parse(init.body as string) });
      const next = api.saveReplies.shift() ?? { status: 200, body: { success: true } };
      return reply(next.status, next.body);
    }
    if (url.startsWith(`/api/partners/edit/${PARTNER_SLUG}`)) {
      api.loads.push(url);
      return reply(api.loadReply.status, api.loadReply.body);
    }
    return reply(404, { success: false });
  });
  return api;
}

const refused = { status: 401, body: { success: false, code: 'EDIT_ACCESS_REQUIRED', error: 'Edit access expired or missing.' } };

// Lets fetches, zero-delay timers and the effects they trigger run, inside act.
async function settle() {
  await act(async () => {
    for (let i = 0; i < 10; i++) await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

// What every partner editor save carries for the server's late-write guard.
const GUARD = { tabId: expect.stringMatching(/^[A-Za-z0-9_-]{8,64}$/), clientSeq: expect.any(Number) };

describe('PartnerEditorDashboard mounted', () => {
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
    mockReportEdit.text = 'Typed caption';
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
  const draftText = () => draftField('stats:reportText1');

  // The operator leaves a field: it loses focus and records what was typed.
  async function leaveField(field: FakeNode) {
    await act(async () => field.blur());
    await settle();
  }

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

  // The tab comes back into view: the page re-loads the partner.
  async function refocus() {
    for (const listener of doc.listeners.filter((l) => l.type === 'visibilitychange')) {
      await act(async () => listener.fn({ type: 'visibilitychange' }));
    }
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
    const click = async (target: FakeNode | null | undefined) => {
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
    const setText = async (text: string) => {
      mockReportEdit.text = text;
      await click(withAttr(container, 'data-set-text')[0]);
    };
    return { container, root, click, setText };
  }

  // Mounts the editor as the page does, and re-renders it with each new load
  // the way the page hands one over (a new copy, a later fetchStartedAt).
  async function mountEditor(partner: ServerPartner, props: Partial<Props>) {
    let fetchStartedAt = Date.now();
    const mounted = await mount(<PartnerEditorDashboard partner={partner} fetchStartedAt={fetchStartedAt} {...props} />);
    const reload = async (copy: ServerPartner, next: Partial<Props>) => {
      fetchStartedAt += 1;
      await act(async () => {
        mounted.root.render(<PartnerEditorDashboard partner={copy} fetchStartedAt={fetchStartedAt} {...props} {...next} />);
      });
      await settle();
    };
    return { ...mounted, reload };
  }

  const loaded = serverPartner({ reportText1: 'Saved caption' });

  it('loads read-only: controls disabled, notice first; editable in place once a load says canSave', async () => {
    const editor = await mountEditor(loaded, { canSave: false });
    const { container } = editor;

    expect(fieldsetDisabled(container)).toBe(true);
    expect(controlsDisabled(container)).toEqual([true, true, true, true, true, true]);
    const page = container.firstChild as FakeNode;
    expect(page.firstChild?.getAttribute('role')).toBe('alert');
    expect(noticeOf(container)?.textContent).toBe(NOTICE);
    expect(shownText(container)).toBeUndefined(); // the view with no controls
    expect(container.textContent).toContain('Saved caption');
    expect(statusLine(container)).toBe('🔒 Read-only');

    // A disabled switch takes no click, and nothing is sent.
    await editor.click(withAttr(container, 'data-flag')[0]);
    await sendWaiting();
    expect(api.saves).toHaveLength(0);
    expect(storedDrafts()).toHaveLength(0);

    // A re-fetch answers canSave: true (signed in elsewhere, or password entered).
    await editor.reload({ ...loaded }, { canSave: true });
    expect(fieldsetDisabled(container)).toBe(false);
    expect(controlsDisabled(container)).toEqual([false, false, false, false, false, false]);
    expect(noticeOf(container)).toBeNull();
    expect(shownText(container)).toBe('Saved caption');
    expect(statusLine(container)).toBe('📝 Ready');

    // And it takes input again.
    await editor.click(withAttr(container, 'data-flag')[0]);
    await sendWaiting();
    expect(api.saves).toHaveLength(1);
    expect(api.saves[0].body.showEventsList).toBe(false);
  });

  it('saves the default report to PUT /api/partners and drops the draft once the server confirms', async () => {
    const editor = await mountEditor(loaded, { canSave: true });
    await editor.setText('New caption');
    expect(shownText(editor.container)).toBe('New caption');
    // Kept on this device before anything is sent.
    expect(draftText()).toBe('New caption');
    expect(api.saves).toHaveLength(0); // still in the debounce

    // Leaving with it unsaved asks first, and sends it at once.
    expect(await leaveAsks()).toBe(true);
    expect(api.saves).toHaveLength(1);
    expect(api.saves[0].url).toBe('/api/partners');
    expect(api.saves[0].body).toMatchObject({ partnerId: PARTNER_ID, statsChanges: { reportText1: 'New caption' } });
    expect(api.saves[0].body).not.toHaveProperty('stats');
    expect(storedDrafts()).toHaveLength(0);
    expect(statusLine(editor.container)).toBe('✅ Saved');
    expect(await leaveAsks()).toBe(false);
    expect(api.saves).toHaveLength(1);
  });

  it('saves a custom variant to PUT /api/partners/edit/<id>?variant=<slug>, under its own draft', async () => {
    const editor = await mountEditor(loaded, { canSave: true, variantSlug: 'vip' });
    await editor.setText('VIP caption');
    expect(storedDrafts()).toEqual([expect.stringContaining(`${partnerDraftScope(PARTNER_ID, 'vip')}:`)]);

    await sendWaiting();
    expect(api.saves).toHaveLength(1);
    expect(api.saves[0].url).toBe(`/api/partners/edit/${PARTNER_ID}?variant=vip`);
    expect(api.saves[0].body).toEqual({
      metadata: expect.objectContaining({ statsChanges: { reportText1: 'VIP caption' } }),
      ...GUARD,
    });
    expect(storedDrafts()).toHaveLength(0);
  });

  it('sends the logo and a switch only when changed here, so a logo set elsewhere after the load survives', async () => {
    // Loaded without a logo; camera sync may set one while the editor is open.
    const noLogo = serverPartner({ reportText1: 'Saved caption' }, { logoUrl: undefined });
    const editor = await mountEditor(noLogo, { canSave: true });
    const { container } = editor;

    await editor.setText('New caption');
    await sendWaiting();
    expect(api.saves[0].body).toEqual({ partnerId: PARTNER_ID, statsChanges: { reportText1: 'New caption' }, ...GUARD });

    await editor.click(withAttr(container, 'data-flag').find((n) => n.getAttribute('data-flag') === 'showOnlyTeam1Events'));
    await sendWaiting();
    // The caption is stored now: only the switch goes.
    expect(api.saves[1].body).toEqual({
      partnerId: PARTNER_ID,
      statsChanges: {},
      showOnlyTeam1Events: true,
      ...GUARD,
    });

    // A logo typed into the URL field, then removed again: each change goes out.
    await leaveField(typeInto(logoField(container), 'https://i.ibb.co/new/logo.png'));
    await sendWaiting();
    expect(api.saves[2].body).toMatchObject({ logoUrl: 'https://i.ibb.co/new/logo.png' });
    expect(api.saves[2].body).not.toHaveProperty('showOnlyTeam1Events');
    await leaveField(typeInto(logoField(container), ''));
    await sendWaiting();
    expect(api.saves[3].body).toEqual({ partnerId: PARTNER_ID, statsChanges: {}, logoUrl: '', ...GUARD });
    expect(storedDrafts()).toHaveLength(0);
  });

  it("a variant save never writes the load's logo or switches into the variant; a removed logo goes as ''", async () => {
    // What the load shows for a variant with no logo of its own and the
    // partner's switches: the partner's logo and values.
    const shown = serverPartner({ reportText1: 'VIP caption' }, { showOnlyTeam1Events: true });
    const editor = await mountEditor(shown, { canSave: true, variantSlug: 'vip' });
    const { container } = editor;

    await editor.setText('VIP caption 2');
    await sendWaiting();
    expect(api.saves[0].body).toEqual({ metadata: { statsChanges: { reportText1: 'VIP caption 2' } }, ...GUARD });

    // Removing the logo fails once; the next change still carries the removal.
    api.saveReplies.push({ status: 500, body: { success: false, error: 'Database unavailable' } });
    await leaveField(typeInto(logoField(container), ''));
    await sendWaiting();
    expect(api.saves[1].body).toEqual({ metadata: { statsChanges: {}, logoUrl: '' }, ...GUARD });
    await editor.setText('VIP caption 3');
    await sendWaiting();
    expect(api.saves[2].body).toEqual({ metadata: { statsChanges: { reportText1: 'VIP caption 3' }, logoUrl: '' }, ...GUARD });
    expect(statusLine(container)).toBe('✅ Saved');
  });

  it('a failed save keeps the draft and shows "Not saved - retrying" with Retry now until a save succeeds', async () => {
    const editor = await mountEditor(loaded, { canSave: true });
    const { container } = editor;
    const serverError = { status: 500, body: { success: false, error: 'Database unavailable' } };
    api.saveReplies.push(serverError, serverError);
    await editor.setText('New caption');
    await sendWaiting();

    expect(api.saves).toHaveLength(1);
    expect(statusLine(container)).toBe('❌ Not saved - retrying (1 change)');
    const banner = byClass(container, 'alert-danger')[0];
    expect(banner.textContent).toContain('Not saved (1 change). Database unavailable. Kept on this device; retrying automatically.');
    expect(buttonsLabelled(banner, 'Retry now')).toHaveLength(1);
    expect(draftText()).toBe('New caption');
    // The editor stays editable: a server error is not an access problem.
    expect(fieldsetDisabled(container)).toBe(false);

    // Leaving asks first and tries once more; that fails too, and the status
    // stays on "Not saved" -- it never falls back to "Ready".
    expect(await leaveAsks()).toBe(true);
    expect(api.saves).toHaveLength(2);
    await settle();
    expect(statusLine(container)).toBe('❌ Not saved - retrying (1 change)');
    expect(draftText()).toBe('New caption');

    await editor.click(buttonsLabelled(container, 'Retry now')[0]);
    expect(api.saves).toHaveLength(3);
    expect(api.saves[2].body.statsChanges).toEqual({ reportText1: 'New caption' });
    // The same payload each time: retried under the same request number.
    expect(new Set(api.saves.map((save) => save.body.clientSeq)).size).toBe(1);
    expect(statusLine(container)).toBe('✅ Saved');
    expect(byClass(container, 'alert-danger')).toHaveLength(0);
    expect(storedDrafts()).toHaveLength(0);
    expect(await leaveAsks()).toBe(false);
  });

  it('401: asks the page for access; read-only keeps the unsaved change and counts it; saved once access returns', async () => {
    let answerAccessCheck: (result: AccessCheckResult) => void = () => {};
    const onRequestAccess = jest.fn(
      () => new Promise<AccessCheckResult>((resolve) => {
        answerAccessCheck = resolve;
      })
    );
    const editor = await mountEditor(loaded, { canSave: true, onRequestAccess });
    const { container } = editor;

    api.saveReplies.push(refused);
    await editor.setText('New caption');
    await sendWaiting();
    expect(api.saves).toHaveLength(1);
    expect(onRequestAccess).toHaveBeenCalledTimes(1);
    expect(statusLine(container)).toBe('🔒 Not saved - access needed (1 change)');

    // The page re-loads the partner and the server says canSave: false.
    await editor.reload({ ...loaded }, { canSave: false });
    await act(async () => answerAccessCheck('blocked'));
    await settle();

    expect(fieldsetDisabled(container)).toBe(true);
    const notice = noticeOf(container) as FakeNode;
    expect(notice.textContent).toBe(`${NOTICE} 1 unsaved change is kept on this device and saved once you can edit.Retry now`);
    // The text stays on screen and in the draft; nothing is discarded.
    expect(container.textContent).toContain('New caption');
    expect(draftText()).toBe('New caption');
    // The bottom save banner (and its Retry now) would repeat the notice.
    expect(buttonsLabelled(container, 'Retry now')).toHaveLength(1);

    // Access returns (a later load says canSave: true): editable, and the kept
    // change is sent and confirmed.
    await editor.reload({ ...loaded }, { canSave: true });
    expect(fieldsetDisabled(container)).toBe(false);
    expect(noticeOf(container)).toBeNull();
    expect(api.saves).toHaveLength(2);
    expect(api.saves[1].body.statsChanges).toEqual({ reportText1: 'New caption' });
    expect(storedDrafts()).toHaveLength(0);
    expect(statusLine(container)).toBe('✅ Saved');
  });

  it('records the logo URL being typed when the tab is closed or reloaded, so the leave warning fires for it', async () => {
    const editor = await mountEditor(loaded, { canSave: true });
    typeInto(logoField(editor.container), 'https://i.ibb.co/new/logo.png');

    // Nothing was recorded yet (the field records on blur); closing records
    // it first, then asks, and sends it at once.
    expect(await leaveAsks()).toBe(true);
    expect(api.saves).toHaveLength(1);
    expect(api.saves[0].body).toMatchObject({ logoUrl: 'https://i.ibb.co/new/logo.png' });
    expect(await leaveAsks()).toBe(false);
  });

  it('records the report text being typed when the tab goes without a warning (pagehide), or is hidden', async () => {
    const editor = await mountEditor(loaded, { canSave: true });
    const { container } = editor;

    api.saveReplies.push({ status: 500, body: { success: false, error: 'Database unavailable' } });
    typeInto(text2Field(container), 'Typed before the tab closed');
    await act(async () => {
      for (const listener of windowListeners.filter((l) => l.type === 'pagehide')) listener.fn({ type: 'pagehide' });
    });
    await settle();
    // Kept on this device, and sent at once.
    expect(draftField('stats:reportText2')).toBe('Typed before the tab closed');
    expect(api.saves).toHaveLength(1);
    expect(api.saves[0].body.statsChanges).toEqual({ reportText2: 'Typed before the tab closed' });

    typeInto(text2Field(container), 'Typed before the tab was hidden');
    await sendWaiting();
    expect(api.saves[1].body.statsChanges).toEqual({ reportText2: 'Typed before the tab was hidden' });
    expect(storedDrafts()).toHaveLength(0);
  });

  it('restores the drafts a read-only load kept, once the editor can save', async () => {
    const typed = serverPartner({ reportText1: 'Typed offline' });
    const earlier = storedDraft(loaded, typed, Date.UTC(2026, 8, 27, 14, 5));
    storage().setItem(draftKeyOf(earlier), JSON.stringify(earlier));

    const editor = await mountEditor(loaded, { canSave: false });
    const { container } = editor;
    expect(noticeOf(container)?.textContent).toContain('are kept and restored once you can edit.');
    expect(storedDrafts()).toEqual([draftKeyOf(earlier)]);

    await editor.reload({ ...loaded }, { canSave: true });
    expect(shownText(container)).toBe('Typed offline');
    expect(container.textContent).toContain('Restored unsaved changes from this device');
    const drafts = storedDrafts();
    expect(drafts).toHaveLength(1);
    expect(drafts[0]).not.toContain('earlier-tab');

    await sendWaiting();
    expect(api.saves.map((s) => s.body.statsChanges)).toEqual([{ reportText1: 'Typed offline' }]);
    expect(storedDrafts()).toHaveLength(0);
  });

  describe('edit page', () => {
    const loadAnswer = (canSave: boolean, partner: ServerPartner = loaded) => ({
      status: 200,
      body: { success: true, partner, canSave },
    });

    async function mountPage(variantSlug: string | null = null) {
      return mount(<PartnerEditClient slug={PARTNER_SLUG} variantSlug={variantSlug} />);
    }

    it('loads read-only for a caller who cannot save, and becomes editable when a re-fetch says canSave', async () => {
      api.loadReply = loadAnswer(false);
      const page = await mountPage();
      const { container } = page;
      expect(api.loads).toEqual([`/api/partners/edit/${PARTNER_SLUG}`]);
      expect(fieldsetDisabled(container)).toBe(true);
      expect(noticeOf(container)?.textContent).toBe(NOTICE);

      api.loadReply = loadAnswer(true);
      await refocus();
      expect(fieldsetDisabled(container)).toBe(false);
      expect(noticeOf(container)).toBeNull();
      expect(controlsDisabled(container).every((d) => !d)).toBe(true);
    });

    it('a refused save re-loads the partner (renewing a password grant) and resumes when the load says canSave', async () => {
      api.loadReply = loadAnswer(true);
      const page = await mountPage();
      api.saveReplies.push(refused);
      await page.setText('New caption');
      await sendWaiting();
      await settle();

      expect(api.loads).toHaveLength(2);
      expect(api.saves.map((s) => s.url)).toEqual(['/api/partners', '/api/partners']);
      expect(api.saves[1].body.statsChanges).toEqual({ reportText1: 'New caption' });
      expect(api.saves[1].body.clientSeq).toBe(api.saves[0].body.clientSeq);
      expect(storedDrafts()).toHaveLength(0);
      expect(fieldsetDisabled(page.container)).toBe(false);
      expect(statusLine(page.container)).toBe('✅ Saved');
    });

    it('a refused save turns the editor read-only when the re-load says it cannot save; the draft stays', async () => {
      api.loadReply = loadAnswer(true);
      const page = await mountPage();
      const { container } = page;
      api.saveReplies.push(refused);
      await page.setText('New caption');
      api.loadReply = loadAnswer(false);
      await sendWaiting();
      await settle();

      expect(api.loads).toHaveLength(2);
      expect(api.saves).toHaveLength(1);
      expect(fieldsetDisabled(container)).toBe(true);
      expect(noticeOf(container)?.textContent).toContain('1 unsaved change is kept on this device and saved once you can edit.');
      expect(container.textContent).toContain('New caption');
      expect(draftText()).toBe('New caption');

      // Signed in elsewhere; back on this tab the re-load says canSave.
      api.loadReply = loadAnswer(true);
      await refocus();
      expect(fieldsetDisabled(container)).toBe(false);
      expect(api.saves).toHaveLength(2);
      expect(storedDrafts()).toHaveLength(0);
    });

    it('turning read-only mid-session records the field being edited first; the Report Content editor stays mounted', async () => {
      api.loadReply = loadAnswer(true);
      const page = await mountPage();
      const { container } = page;

      // Report text 1 is done and waiting; report text 2 is being typed (not
      // yet recorded: text boxes record on blur) when a re-load (tab refocus)
      // answers canSave: false.
      await page.setText('New caption');
      const field = typeInto(text2Field(container), 'Typed in slot 2');
      api.loadReply = loadAnswer(false);
      await refocus();
      // Recorded by the switch itself, before anything else could blur it.
      expect(fieldsetDisabled(container)).toBe(true);
      expect(draftField('stats:reportText2')).toBe('Typed in slot 2');
      // The waiting save goes out and is refused; the re-check still says no.
      api.saveReplies.push(refused);
      await sendWaiting();
      await settle();

      expect(api.saves).toHaveLength(1);
      expect(fieldsetDisabled(container)).toBe(true);
      // Recorded before the switch: in the draft, counted by the notice, shown.
      expect(draftField('stats:reportText2')).toBe('Typed in slot 2');
      expect(draftText()).toBe('New caption');
      expect(noticeOf(container)?.textContent).toContain('2 unsaved changes are kept on this device and saved once you can edit.');
      expect(container.textContent).toContain('Typed in slot 2');
      // The Report Content editor is hidden, not unmounted: what is typed in it stays.
      expect(contentEditorHidden(container)).toBe(true);
      expect(text2Field(container)).toBe(field);

      // Access returns: editable in place, the same fields, and both texts saved.
      api.loadReply = loadAnswer(true);
      await refocus();
      expect(fieldsetDisabled(container)).toBe(false);
      expect(contentEditorHidden(container)).toBe(false);
      expect(text2Field(container)).toBe(field);
      expect(api.saves).toHaveLength(2);
      expect(api.saves[1].body.statsChanges).toEqual({ reportText1: 'New caption', reportText2: 'Typed in slot 2' });
      expect(storedDrafts()).toHaveLength(0);
    });

    it('records the logo URL being typed before the password prompt hides the editor', async () => {
      api.loadReply = loadAnswer(true);
      const page = await mountPage();
      const { container } = page;
      typeInto(logoField(container), 'https://i.ibb.co/new/logo.png');

      api.loadReply = { status: 401, body: { success: false, code: 'PAGE_PASSWORD_REQUIRED' } };
      await refocus();
      expect(byClass(container, 'page-bg-gray')[0].hasAttribute('hidden')).toBe(true);
      expect(draftField('logoUrl')).toBe('https://i.ibb.co/new/logo.png');
    });

    it('a password prompt mid-session keeps the editor mounted, and the unlock makes it editable in place', async () => {
      api.loadReply = loadAnswer(false);
      const page = await mountPage('vip');
      const { container } = page;
      expect(api.loads).toEqual([`/api/partners/edit/${PARTNER_SLUG}?variant=vip`]);
      expect(fieldsetDisabled(container)).toBe(true);

      // A partner-edit password was set meanwhile: the next load asks for it.
      api.loadReply = { status: 401, body: { success: false, code: 'PAGE_PASSWORD_REQUIRED' } };
      await refocus();
      const shell = byClass(container, 'page-bg-gray')[0];
      expect(shell.hasAttribute('hidden')).toBe(true);

      api.loadReply = loadAnswer(true);
      await page.click(withAttr(container, 'data-unlock')[0]);
      expect(shell.hasAttribute('hidden')).toBe(false);
      expect(fieldsetDisabled(container)).toBe(false);
      expect(noticeOf(container)).toBeNull();

      // It saves the variant through the variant route.
      await page.setText('VIP caption');
      await sendWaiting();
      expect(api.saves.map((s) => s.url)).toEqual([`/api/partners/edit/${PARTNER_ID}?variant=vip`]);
    });
  });
});
