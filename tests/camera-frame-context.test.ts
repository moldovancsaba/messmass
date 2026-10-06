// tests/camera-frame-context.test.ts
// WHAT: buildCameraFrameContext (lib/cameraFrameContext.ts) resolves what camera needs for an event's default frame:
//     the teams and logos, the template, and the effective report style and font, with the same precedence as
//     report-config (template: event, partner, default, none; style: event, partner, template, system default).
// HOW: a tiny in-memory fake of the few Mongo calls the module issues (findOne by _id or isDefault, find().toArray()).

import { ObjectId } from 'mongodb';
import { buildCameraFrameContext } from '@/lib/cameraFrameContext';
import { DEFAULT_STYLE } from '@/lib/reportStyleTypes';
import { DEFAULT_REPORT_STYLE_COLORS as PALETTE } from '@/lib/theme/reportStylePalette';

// Stand-in colours taken from the palette (no raw colour literals in tests): none equals the system default heading or hero colour.
const FIXTURE_HEADING = PALETTE.chartValueColor;
const FIXTURE_HERO = PALETTE.chartLabelColor;
const OTHER_HEADING = PALETTE.chartTitleColor;
const OTHER_HERO = PALETTE.exportButtonText;

type Doc = Record<string, any>;

function fakeDb(data: Record<string, Doc[]>) {
  const rows = (name: string) => data[name] ?? [];
  const matches = (doc: Doc, filter: Doc) =>
    Object.entries(filter).every(([key, value]) => (value instanceof ObjectId ? String(doc[key]) === String(value) : doc[key] === value));
  return {
    collection: (name: string) => ({
      findOne: async (filter: Doc) => rows(name).find((doc) => matches(doc, filter)) ?? null,
      find: (filter: Doc = {}) => ({ toArray: async () => rows(name).filter((doc) => matches(doc, filter)) }),
    }),
  } as any;
}

const oid = () => new ObjectId();
const homeId = oid();
const visitorId = oid();
const styleA = oid();
const styleB = oid();
const styleC = oid();
const templateP = oid();
const templateH = oid();
const templateD = oid();

const home = {
  _id: homeId,
  name: ' FC Barcelona ',
  logoUrl: 'https://i.ibb.co/home.png',
  sportsDb: { strTeamShort: 'Barça' },
};
const visitor = { _id: visitorId, name: 'Real Madrid', footballData: { shortName: 'Real' } };

const style = (id: ObjectId, over: Doc = {}) => ({ _id: id, name: `Style ${id}`, fontFamily: 'Inter', headingColor: FIXTURE_HEADING, heroBackground: FIXTURE_HERO, ...over });
const template = (id: ObjectId, over: Doc = {}) => ({ _id: id, name: `Template ${id}`, isDefault: false, ...over });

function project(over: Doc = {}) {
  const _id = oid();
  return { _id, eventName: 'El Clásico', eventDate: '2026-10-12', partner1Id: homeId, partner2Id: visitorId, ...over };
}

test('the teams, their logos and short names come from partner1Id and partner2Id', async () => {
  const p = project();
  const ctx = await buildCameraFrameContext(fakeDb({ projects: [p], partners: [home, visitor] }), String(p._id));
  expect(ctx?.event).toEqual({
    id: String(p._id),
    name: 'El Clásico',
    date: '2026-10-12',
    homeTeam: { id: String(homeId), name: 'FC Barcelona', shortName: 'Barça', logoUrl: 'https://i.ibb.co/home.png' },
    visitorTeam: { id: String(visitorId), name: 'Real Madrid', shortName: 'Real', logoUrl: null },
  });
  expect(ctx?.partner).toEqual({ id: String(homeId), name: 'FC Barcelona', logoUrl: 'https://i.ibb.co/home.png' });
});

test('an event with one team has no visitor, and an event without teams uses its own partner', async () => {
  const oneTeam = project({ partner2Id: undefined });
  const organiser = oid();
  const noTeams = project({ partner1Id: undefined, partner2Id: undefined, partnerId: organiser });
  const db = fakeDb({ projects: [oneTeam, noTeams], partners: [home, { _id: organiser, name: 'Fan Club', logoUrl: 'https://i.ibb.co/fc.png' }] });

  const a = await buildCameraFrameContext(db, String(oneTeam._id));
  expect(a?.event.visitorTeam).toBeNull();
  expect(a?.event.homeTeam?.name).toBe('FC Barcelona');

  const b = await buildCameraFrameContext(db, String(noTeams._id));
  expect(b?.event.homeTeam).toBeNull();
  expect(b?.event.visitorTeam).toBeNull();
  expect(b?.partner).toEqual({ id: String(organiser), name: 'Fan Club', logoUrl: 'https://i.ibb.co/fc.png' });
});

test('the legacy partner1 field still finds the home team', async () => {
  const p = project({ partner1Id: undefined, partner1: homeId });
  const ctx = await buildCameraFrameContext(fakeDb({ projects: [p], partners: [home] }), String(p._id));
  expect(ctx?.event.homeTeam?.name).toBe('FC Barcelona');
});

test('event level: the event template and the event style win', async () => {
  const p = project({ reportTemplateId: templateP, styleIdEnhanced: styleA });
  const db = fakeDb({
    projects: [p],
    partners: [{ ...home, reportTemplateId: templateH, styleId: styleB }],
    report_templates: [template(templateP, { styleId: styleC }), template(templateH)],
    report_styles: [style(styleA, { headingColor: OTHER_HEADING }), style(styleB), style(styleC)],
  });
  const ctx = await buildCameraFrameContext(db, String(p._id));
  expect(ctx?.template).toEqual({ id: String(templateP), name: `Template ${templateP}`, resolvedFrom: 'project' });
  expect(ctx?.style).toMatchObject({ id: String(styleA), resolvedFrom: 'project', headingColor: OTHER_HEADING, heroBackground: FIXTURE_HERO });
});

test('partner level: found through partner1Id, which is the only partner field projects store', async () => {
  const p = project();
  const db = fakeDb({
    projects: [p],
    partners: [{ ...home, reportTemplateId: templateH, styleId: styleB }],
    report_templates: [template(templateH, { styleId: styleC }), template(templateD, { isDefault: true })],
    report_styles: [style(styleB, { heroBackground: OTHER_HERO }), style(styleC)],
  });
  const ctx = await buildCameraFrameContext(db, String(p._id));
  expect(ctx?.template.resolvedFrom).toBe('partner');
  expect(ctx?.template.id).toBe(String(templateH));
  expect(ctx?.style).toMatchObject({ id: String(styleB), resolvedFrom: 'partner', heroBackground: OTHER_HERO });
});

test('a partner template without a partner style gives its own style', async () => {
  const p = project();
  const db = fakeDb({
    projects: [p],
    partners: [{ ...home, reportTemplateId: templateH }],
    report_templates: [template(templateH, { styleId: styleC })],
    report_styles: [style(styleC)],
  });
  const ctx = await buildCameraFrameContext(db, String(p._id));
  expect(ctx?.style).toMatchObject({ id: String(styleC), resolvedFrom: 'template' });
});

test('default level: no event or partner template, the default template and its style', async () => {
  const p = project();
  const db = fakeDb({
    projects: [p],
    partners: [home],
    report_templates: [template(templateP), template(templateD, { isDefault: true, styleId: styleC })],
    report_styles: [style(styleC)],
  });
  const ctx = await buildCameraFrameContext(db, String(p._id));
  expect(ctx?.template).toEqual({ id: String(templateD), name: `Template ${templateD}`, resolvedFrom: 'default' });
  expect(ctx?.style.resolvedFrom).toBe('template');
});

test('nothing selected anywhere: no template and the system default style, Inter, default colours', async () => {
  const p = project();
  const ctx = await buildCameraFrameContext(fakeDb({ projects: [p], partners: [home] }), String(p._id));
  expect(ctx?.template).toEqual({ id: null, name: 'System Default', resolvedFrom: 'hardcoded' });
  expect(ctx?.style).toEqual({
    id: null,
    name: 'System default',
    resolvedFrom: 'system-default',
    fontFamily: 'Inter',
    fontSource: 'google',
    fontFile: null,
    headingColor: DEFAULT_STYLE.headingColor,
    heroBackground: DEFAULT_STYLE.heroBackground,
  });
});

test('a style id whose document is missing falls back to the system default, as the report page does', async () => {
  const p = project({ styleIdEnhanced: styleA });
  const ctx = await buildCameraFrameContext(fakeDb({ projects: [p], partners: [home] }), String(p._id));
  expect(ctx?.style).toMatchObject({ id: null, resolvedFrom: 'system-default', headingColor: DEFAULT_STYLE.headingColor });
});

test('a style that lacks a colour falls back to the default for that colour only', async () => {
  const p = project({ styleIdEnhanced: styleA });
  const db = fakeDb({ projects: [p], partners: [home], report_styles: [{ _id: styleA, name: 'Old style', fontFamily: 'Inter', heroBackground: OTHER_HERO }] });
  const ctx = await buildCameraFrameContext(db, String(p._id));
  expect(ctx?.style).toMatchObject({ resolvedFrom: 'project', headingColor: DEFAULT_STYLE.headingColor, heroBackground: OTHER_HERO });
});

test('fonts: a custom font gets its file, a stored font wins over the built-in list, an unknown name is a system font', async () => {
  const db = (fontFamily: string, fonts: Doc[] = []) => {
    const p = project({ styleIdEnhanced: styleA });
    return { p, db: fakeDb({ projects: [p], partners: [home], report_styles: [style(styleA, { fontFamily })], available_fonts: fonts }) };
  };

  const roma = db('AS Roma');
  expect((await buildCameraFrameContext(roma.db, String(roma.p._id)))?.style).toMatchObject({ fontSource: 'custom', fontFile: '/fonts/ASRoma-Regular.woff' });

  const stored = db('as roma', [{ name: 'AS Roma', category: 'custom', fontFile: '/fonts/ASRoma-v2.woff' }]);
  expect((await buildCameraFrameContext(stored.db, String(stored.p._id)))?.style).toMatchObject({ fontSource: 'custom', fontFile: '/fonts/ASRoma-v2.woff' });

  const roboto = db('Roboto');
  expect((await buildCameraFrameContext(roboto.db, String(roboto.p._id)))?.style).toMatchObject({ fontSource: 'google', fontFile: null });

  const unknown = db('Comic Neue');
  expect((await buildCameraFrameContext(unknown.db, String(unknown.p._id)))?.style).toMatchObject({ fontFamily: 'Comic Neue', fontSource: 'system', fontFile: null });
});

test('an unknown or malformed event id has no context', async () => {
  const db = fakeDb({ projects: [], partners: [] });
  expect(await buildCameraFrameContext(db, String(oid()))).toBeNull();
  expect(await buildCameraFrameContext(db, 'not-an-id')).toBeNull();
});
