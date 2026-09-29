// tests/builder-and-report-text-commits.test.tsx
// WHAT: Builder-mode chart inputs and Report Content text slots save only what
//     the operator changed in them.
// WHY: Leaving a Builder input saved a value whenever the stat was not a
//     number, also when nothing was typed: for a nested [fanmass.x] token that
//     queued a flat 'fanmass.x': 0, which PUT /api/projects refuses, and every
//     later save of the device was held behind it; for a stat this editor's
//     copy lacked, it wrote 0 over the stored value. A report text slot that
//     had been typed into kept showing its own older text after another device
//     changed that slot, and tapping into it and out again wrote the older text
//     back over the newer one.
// HOW: The real components mounted with react-dom/client on a DOM stand-in
//     (tests/helpers/fakeDom.ts), driven by focus, typing and blur events.

import React, { act } from 'react';
import { FakeDocument, FakeNode, byTag, dispatch } from './helpers/fakeDom';

jest.mock('@/lib/apiClient', () => ({ __esModule: true, apiPost: jest.fn(async () => ({ success: true })) }));
jest.mock('@/lib/imgbbClientUpload', () => ({ __esModule: true, uploadImageToImgbb: jest.fn() }));
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt }: { src: string; alt: string }) => require('react').createElement('img', { src, alt }),
}));
jest.mock('@/components/MaterialIcon', () => ({ __esModule: true, default: () => null }));

import ChartBuilderKPI from '@/components/ChartBuilderKPI';
import ChartBuilderBar from '@/components/ChartBuilderBar';
import ChartBuilderValueChain from '@/components/ChartBuilderValueChain';
import ReportContentManager from '@/components/ReportContentManager';

const g = globalThis as unknown as Record<string, unknown>;
let doc: FakeDocument;
let unmount: (() => Promise<void>) | null = null;
const saved: Record<string, unknown> = {};

beforeAll(() => {
  for (const key of ['document', 'window', 'IS_REACT_ACT_ENVIRONMENT']) saved[key] = g[key];
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
  const win = { document: doc, HTMLIFrameElement: class {}, addEventListener() {}, removeEventListener() {} };
  doc.defaultView = win;
  g.window = win;
  g.document = doc;
});

afterEach(async () => {
  if (unmount) await unmount();
  unmount = null;
});

async function mount(element: React.ReactElement) {
  const { createRoot } = require('react-dom/client') as typeof import('react-dom/client');
  const container = doc.createElement('div');
  doc.body.appendChild(container);
  const root = createRoot(container as unknown as HTMLElement);
  await act(async () => root.render(element));
  unmount = async () => {
    await act(async () => root.unmount());
  };
  const rerender = async (next: React.ReactElement) => {
    await act(async () => root.render(next));
  };
  return { container, rerender };
}

async function focus(field: FakeNode) {
  doc.activeElement = field;
  await act(async () => dispatch(field, 'focusin'));
}
async function type(field: FakeNode, text: string) {
  field.value = text;
  await act(async () => dispatch(field, 'input'));
}
async function leave(field: FakeNode) {
  doc.activeElement = null;
  await act(async () => dispatch(field, 'focusout'));
}
const inputFor = (root: FakeNode, key: string) =>
  byTag(root, 'input').find((i) => i.getAttribute('aria-label') === `Value for ${key}` || i.getAttribute('aria-label') === key) as FakeNode;

describe('Builder-mode chart inputs', () => {
  const kpi = (formula: string) => ({ chartId: 'kpi-1', title: 'Fans', elements: [{ formula }] });

  it('focusing and leaving an input without typing saves nothing -- also for a stat the editor has no copy of', async () => {
    const onSave = jest.fn();
    const { container } = await mount(
      <ChartBuilderKPI chart={kpi('[female]+[jersey]')} stats={{ female: 12 }} onSave={onSave} />
    );
    for (const key of ['female', 'jersey']) {
      const field = inputFor(container, key);
      await focus(field);
      await leave(field);
    }
    expect(onSave).not.toHaveBeenCalled();
  });

  it('a nested fanmass token is shown read-only from its nested value and never saved', async () => {
    const onSave = jest.fn();
    const { container } = await mount(
      <ChartBuilderKPI
        chart={kpi('[fanmass.peopleCount]+[female]')}
        stats={{ female: 1, fanmass: { peopleCount: 250 } }}
        onSave={onSave}
      />
    );
    const nested = inputFor(container, 'fanmass.peopleCount');
    expect(nested.value).toBe('250');
    // react-dom sets it as the `readOnly` attribute (a browser lowercases it).
    expect(nested.hasAttribute('readOnly')).toBe(true);
    await focus(nested);
    await type(nested, '9');
    await leave(nested);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('saves a number the operator typed, and nothing when it is the stored number again', async () => {
    const onSave = jest.fn();
    const chart = kpi('[female]');
    const { container, rerender } = await mount(<ChartBuilderBar chart={chart} stats={{ female: 3 }} onSave={onSave} />);
    const field = inputFor(container, 'female');

    await focus(field);
    await type(field, '7');
    await leave(field);
    expect(onSave).toHaveBeenCalledWith('female', 7);

    // The save is stored; typing the same number differently changes nothing.
    await rerender(<ChartBuilderBar chart={chart} stats={{ female: 7 }} onSave={onSave} />);
    onSave.mockClear();
    await focus(field);
    await type(field, '7.0');
    await leave(field);
    expect(onSave).not.toHaveBeenCalled();
  });

  it('a stored value that changes while an input is being typed in does not replace what is typed', async () => {
    const onSave = jest.fn();
    const chart = kpi('[female]');
    const { container, rerender } = await mount(<ChartBuilderKPI chart={chart} stats={{ female: 3 }} onSave={onSave} />);
    const field = inputFor(container, 'female');

    await focus(field);
    await type(field, '8');
    await rerender(<ChartBuilderKPI chart={chart} stats={{ female: 5 }} onSave={onSave} />);
    expect(field.value).toBe('8');
    await leave(field);
    expect(onSave).toHaveBeenCalledWith('female', 8);
  });

  it('a value-chain text is saved only when edited', async () => {
    const onSave = jest.fn();
    const chart = { chartId: 'vc-1', title: 'Chain', elements: [{ formula: '[reportText1]' }] };
    const { container } = await mount(<ChartBuilderValueChain chart={chart} stats={{ reportText1: 'Hello' }} onSave={onSave} />);
    const field = inputFor(container, 'reportText1');

    await focus(field);
    await leave(field);
    expect(onSave).not.toHaveBeenCalled();
    await focus(field);
    await type(field, 'Hello there');
    await leave(field);
    expect(onSave).toHaveBeenCalledWith('reportText1', 'Hello there');
  });
});

describe('Report Content text slots', () => {
  async function mountTexts(stats: Record<string, unknown>, onCommit: jest.Mock) {
    const mounted = await mount(<ReportContentManager stats={stats} onCommit={onCommit} />);
    const textsTab = byTag(mounted.container, 'button').find((b) => b.textContent.includes('Texts')) as FakeNode;
    await act(async () => dispatch(textsTab, 'click'));
    const slot = () => byTag(mounted.container, 'textarea').find((t) => t.getAttribute('placeholder') === null) as FakeNode;
    return { ...mounted, slot };
  }

  it('tapping into a slot and out again saves nothing, even after a newer text arrived for it', async () => {
    const onCommit = jest.fn();
    const { rerender, slot } = await mountTexts({ reportText1: 'Mine, typed earlier' }, onCommit);

    // Another device changed the slot; the re-fetch brings its text.
    await rerender(<ReportContentManager stats={{ reportText1: 'Newer, from another device' }} onCommit={onCommit} />);
    expect(slot().value).toBe('Newer, from another device');

    await focus(slot());
    await leave(slot());
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('saves the slot when the operator changed it', async () => {
    const onCommit = jest.fn();
    const { slot } = await mountTexts({ reportText1: 'Caption' }, onCommit);

    await focus(slot());
    slot().value = 'Caption, edited';
    await leave(slot());
    expect(onCommit).toHaveBeenCalledWith(expect.objectContaining({ reportText1: 'Caption, edited' }));
  });

  it('a newer text arriving while the slot is being edited is not typed over; it shows if nothing was changed', async () => {
    const onCommit = jest.fn();
    const { rerender, slot } = await mountTexts({ reportText1: 'Old' }, onCommit);

    await focus(slot());
    await rerender(<ReportContentManager stats={{ reportText1: 'New' }} onCommit={onCommit} />);
    expect(slot().value).toBe('Old');
    await leave(slot());
    expect(onCommit).not.toHaveBeenCalled();
    expect(slot().value).toBe('New');
  });
});
