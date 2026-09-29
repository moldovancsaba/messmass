// tests/security/public-api-no-editslug.test.ts
// WHAT: The Bearer-key public API never returns an event's editSlug, and its
//     documentation does not list one.
// WHY: An event editor with no password is open to whoever holds its edit
//     link: GET /api/projects/edit/<editSlug> issues an edit grant, and that
//     grant saves through PUT /api/projects. API keys are read-only
//     (validateAPIKey grants ['read']), so an editSlug in a /api/public/*
//     payload turned read access into write access for every unprotected
//     event (see isBearerSlug in lib/pageAccess.ts).
// HOW: Both event routes run for real against an in-memory database with the
//     API-key check mocked to pass, and every response body is searched for
//     the slug. A source scan keeps any other /api/public/* route from adding
//     the field back, and a docs scan keeps docs/api/api-public.md from
//     promising it to integrators again.

import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import { NextRequest } from 'next/server';

type Doc = Record<string, any>;

const EDIT_SLUG = '2f1c7a4e-8b3d-4c5e-9f6a-1b2c3d4e5f60';
const PARTNER_ID = new ObjectId();
const EVENT_ID = new ObjectId();

function sameId(a: unknown, b: unknown): boolean {
  return a != null && b != null && String(a) === String(b);
}

function setup() {
  const partners: Doc[] = [{ _id: PARTNER_ID, name: 'Partner', emoji: 'x' }];
  const projects: Doc[] = [
    {
      _id: EVENT_ID,
      eventName: 'Event',
      eventDate: '2026-09-27',
      viewSlug: 'b1c2d3e4-f5a6-4b7c-8d9e-0f1a2b3c4d5e',
      editSlug: EDIT_SLUG,
      partnerId: PARTNER_ID,
      hashtags: [],
      stats: { female: 1 },
    },
  ];
  const cursor = (docs: Doc[]) => {
    const chain = {
      sort: () => chain,
      skip: () => chain,
      limit: () => chain,
      toArray: async () => docs,
    };
    return chain;
  };
  const collection = (name: string) => {
    const docs = name === 'projects' ? projects : name === 'partners' ? partners : [];
    return {
      findOne: jest.fn(async (q: Doc) => docs.find((d) => sameId(d._id, q._id)) ?? null),
      find: jest.fn((q: Doc) => cursor(docs.filter((d) => !q.partnerId || sameId(d.partnerId, q.partnerId)))),
      countDocuments: jest.fn(async (q: Doc) => docs.filter((d) => !q.partnerId || sameId(d.partnerId, q.partnerId)).length),
    };
  };
  const db = { collection };

  jest.doMock('@/lib/mongodb', () => ({ __esModule: true, default: Promise.resolve({ db: () => db }) }));
  jest.doMock('@/lib/config', () => ({ __esModule: true, default: { dbName: 'messmass-test' } }));
  // A valid read-only key: the case the finding describes.
  jest.doMock('@/lib/apiAuth', () => ({
    __esModule: true,
    requireAPIAuth: jest.fn(async () => ({ success: true, user: { id: 'api-user', permissions: ['read'] } })),
  }));
  jest.doMock('@/lib/logger', () => ({
    __esModule: true,
    logRequestStart: jest.fn(() => Date.now()),
    logRequestEnd: jest.fn(),
  }));
}

afterEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

describe('Bearer-key public API: no event edit slug', () => {
  it('GET /api/public/events/[id] returns the event without editSlug', async () => {
    setup();
    const { GET } = await import('@/app/api/public/events/[id]/route');
    const res = await GET(new NextRequest(`http://localhost/api/public/events/${EVENT_ID}`), {
      params: Promise.resolve({ id: String(EVENT_ID) }),
    });
    const text = await res.text();

    expect(res.status).toBe(200);
    expect(JSON.parse(text).event.id).toBe(String(EVENT_ID));
    expect(JSON.parse(text).event).not.toHaveProperty('editSlug');
    expect(text).not.toContain(EDIT_SLUG);
  });

  it('GET /api/public/partners/[id]/events lists the events without editSlug', async () => {
    setup();
    const { GET } = await import('@/app/api/public/partners/[id]/events/route');
    const res = await GET(new NextRequest(`http://localhost/api/public/partners/${PARTNER_ID}/events`), {
      params: Promise.resolve({ id: String(PARTNER_ID) }),
    });
    const text = await res.text();

    expect(res.status).toBe(200);
    const events = JSON.parse(text).events as Doc[];
    expect(events).toHaveLength(1);
    expect(events[0]).not.toHaveProperty('editSlug');
    expect(text).not.toContain(EDIT_SLUG);
  });

  it('no /api/public/* route reads editSlug', () => {
    const root = path.join(process.cwd(), 'app/api/public');
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
      }
    };
    walk(root);
    expect(files.length).toBeGreaterThan(0);
    const offenders = files.filter((file) => {
      const code = fs
        .readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      return /\beditSlug\b/.test(code);
    });
    expect(offenders.map((file) => path.relative(process.cwd(), file))).toEqual([]);
  });

  it('the public API documentation does not list editSlug', () => {
    // Integrators build against docs/api/api-public.md and the in-app /api-docs
    // page; a field listed in either is a field someone will build against and
    // then ask to have back.
    for (const doc of ['docs/api/api-public.md', 'app/api-docs/page.tsx']) {
      const text = fs.readFileSync(path.join(process.cwd(), doc), 'utf8');
      expect({ doc, listsEditSlug: /\beditSlug\b/.test(text) }).toEqual({ doc, listsEditSlug: false });
    }
  });
});
