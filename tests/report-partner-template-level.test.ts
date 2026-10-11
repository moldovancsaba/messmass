// tests/report-partner-template-level.test.ts
// WHAT: The partner level of the report template and style resolution (messmass#430). An event's partner is its
//     partner1Id (what projects store), else the legacy partner1 field (older documents and /admin/project-partners).
// WHY: app/api/report-config and lib/report-resolver read only the legacy field, so an event stored the current way
//     skipped the partner level and showed the default template and theme.
// HOW: the real GET handler and the real ReportResolver run against a small in-memory fake of the few Mongo calls
//     they issue (findOne by _id, viewSlug or isDefault; find with $in).

import { NextRequest } from 'next/server';
import { ObjectId } from 'mongodb';

type Doc = Record<string, any>;

const data: Record<string, Doc[]> = {};

const same = (a: unknown, b: unknown) => String(a) === String(b);
function matches(doc: Doc, filter: Doc): boolean {
  return Object.entries(filter).every(([key, want]) => {
    if (want && typeof want === 'object' && !(want instanceof ObjectId) && Array.isArray((want as Doc).$in)) {
      return (want as Doc).$in.some((candidate: unknown) => same(doc[key], candidate));
    }
    return same(doc[key], want) && (doc[key] !== undefined || want === undefined);
  });
}
const fakeDb = {
  collection: (name: string) => ({
    findOne: async (filter: Doc) => (data[name] ?? []).find((doc) => matches(doc, filter)) ?? null,
    find: (filter: Doc = {}) => ({ toArray: async () => (data[name] ?? []).filter((doc) => matches(doc, filter)) }),
  }),
};

jest.mock('@/lib/db', () => ({ __esModule: true, getDb: async () => fakeDb, default: async () => fakeDb }));

import { GET } from '@/app/api/report-config/[identifier]/route';
import { ReportResolver } from '@/lib/report-resolver';

const oid = () => new ObjectId();
const partnerA = oid();
const partnerB = oid();
const styleP = oid(); // partner A's style
const styleEvent = oid();
const tplPartnerA = oid();
const tplPartnerB = oid();
const tplDefault = oid();
const tplEvent = oid();
const reportPartnerA = oid();
const reportDefault = oid();

beforeEach(() => {
  data.partners = [
    { _id: partnerA, name: 'Partner A', reportTemplateId: tplPartnerA, styleId: styleP, reportId: reportPartnerA },
    { _id: partnerB, name: 'Partner B', reportTemplateId: tplPartnerB },
  ];
  data.report_templates = [
    { _id: tplPartnerA, name: 'Template of A', dataBlocks: [], isDefault: false },
    { _id: tplPartnerB, name: 'Template of B', dataBlocks: [], isDefault: false },
    { _id: tplDefault, name: 'Default template', dataBlocks: [], isDefault: true },
    { _id: tplEvent, name: 'Template of the event', dataBlocks: [], isDefault: false },
  ];
  data.data_blocks = [];
  data.reports = [
    { _id: reportPartnerA, name: 'Report of A', type: 'event', isDefault: false },
    { _id: reportDefault, name: 'Default report', type: 'event', isDefault: true },
  ];
  data.projects = [];
});

function addProject(over: Doc = {}): Doc {
  const project = { _id: oid(), eventName: 'Derby', ...over };
  data.projects.push(project);
  return project;
}

async function configFor(project: Doc) {
  const id = String(project._id);
  const res = await GET(new NextRequest(`http://localhost/api/report-config/${id}?type=project`), {
    params: Promise.resolve({ identifier: id }),
  });
  return res.json();
}

describe('GET /api/report-config/[identifier]?type=project, partner level', () => {
  test('an event stored the current way (partner1Id as ObjectId) takes its partner template and style', async () => {
    const body = await configFor(addProject({ partner1Id: partnerA }));
    expect(body.resolvedFrom).toBe('partner');
    expect(body.source).toBe('Partner A');
    expect(body.template.name).toBe('Template of A');
    expect(String(body.template.styleId)).toBe(String(styleP));
  });

  test('partner1Id stored as a string works too', async () => {
    const body = await configFor(addProject({ partner1Id: String(partnerA) }));
    expect(body.resolvedFrom).toBe('partner');
    expect(body.template.name).toBe('Template of A');
  });

  test('an older document that only has the legacy partner1 (ObjectId) still resolves', async () => {
    const body = await configFor(addProject({ partner1: partnerA }));
    expect(body.resolvedFrom).toBe('partner');
    expect(body.template.name).toBe('Template of A');
  });

  test('a legacy partner1 stored as a populated { _id } object still resolves', async () => {
    const body = await configFor(addProject({ partner1: { _id: partnerA, name: 'Partner A' } }));
    expect(body.resolvedFrom).toBe('partner');
    expect(body.template.name).toBe('Template of A');
  });

  test('when both fields are present and differ, partner1Id wins', async () => {
    const body = await configFor(addProject({ partner1Id: partnerA, partner1: partnerB }));
    expect(body.template.name).toBe('Template of A');
  });

  test('the visitor (partner2Id) never supplies the template', async () => {
    const body = await configFor(addProject({ partner2Id: partnerA }));
    expect(body.resolvedFrom).toBe('default');
    expect(body.template.name).toBe('Default template');
  });

  test('the event\'s own template wins over its partner\'s, and the event style wins over the partner style', async () => {
    const own = await configFor(addProject({ partner1Id: partnerA, reportTemplateId: tplEvent }));
    expect(own.resolvedFrom).toBe('project');
    expect(own.template.name).toBe('Template of the event');

    const styled = await configFor(addProject({ partner1Id: partnerA, styleIdEnhanced: styleEvent }));
    expect(styled.resolvedFrom).toBe('partner');
    expect(String(styled.template.styleId)).toBe(String(styleEvent));
  });

  test('a partner without a template, and an event without a partner, fall to the default template', async () => {
    const noTemplate = oid();
    data.partners.push({ _id: noTemplate, name: 'No template' });
    expect((await configFor(addProject({ partner1Id: noTemplate }))).resolvedFrom).toBe('default');
    expect((await configFor(addProject())).resolvedFrom).toBe('default');
  });
});

describe('ReportResolver.resolveForProject, partner level', () => {
  const resolver = () => new ReportResolver(fakeDb);

  test('an event stored the current way (partner1Id) takes its partner report', async () => {
    const project = addProject({ partner1Id: partnerA });
    const resolved = await resolver().resolveForProject(project as any);
    expect(resolved.resolvedFrom).toBe('partner');
    expect(resolved.report.name).toBe('Report of A');
  });

  test('a project id (string) is looked up and resolved the same way', async () => {
    const project = addProject({ partner1Id: partnerA });
    const resolved = await resolver().resolveForProject(String(project._id));
    expect(resolved.resolvedFrom).toBe('partner');
  });

  test('the legacy partner1 (ObjectId or populated object) still resolves', async () => {
    expect((await resolver().resolveForProject(addProject({ partner1: partnerA }) as any)).resolvedFrom).toBe('partner');
    expect((await resolver().resolveForProject(addProject({ partner1: { _id: partnerA } }) as any)).resolvedFrom).toBe('partner');
  });

  test('without a partner the system default report applies', async () => {
    const resolved = await resolver().resolveForProject(addProject() as any);
    expect(resolved.resolvedFrom).toBe('default');
    expect(resolved.report.name).toBe('Default report');
  });
});
