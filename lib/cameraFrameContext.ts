// lib/cameraFrameContext.ts
// WHAT: Everything camera needs to build the default frame of one event, already resolved: the event, the
//     home and visitor teams with their logos, the partner, which report template applies and the effective
//     report style (colours and font), including the system default when no style is selected.
// WHY: camera renders a frame for every event (camera#231) and must not re-implement messmass's resolution
//     chain or guess the fallback, which messmass applies in the browser (hooks/useReportStyle.ts).
// HOW: Same chain as app/api/report-config/[identifier]/route.ts: template = event, then the event's partner,
//     then the default template, then none; style = event.styleIdEnhanced, then partner.styleId, then
//     template.styleId, then DEFAULT_STYLE. One deliberate difference: the partner is found through
//     partner1Id (what projects actually store), because report-config reads the legacy `partner1` field,
//     which no project writes any more (see messmass issue for that gap). Takes a Db so it is unit-tested
//     with a small fake.

import { ObjectId, type Db } from 'mongodb';
import { DEFAULT_STYLE } from '@/lib/reportStyleTypes';
import { DEFAULT_FONTS } from '@/lib/fontTypes';

export interface CameraFrameTeam {
  id: string;
  name: string;
  shortName: string | null;
  logoUrl: string | null;
}

export interface CameraFrameContext {
  event: { id: string; name: string; date: string | null; homeTeam: CameraFrameTeam | null; visitorTeam: CameraFrameTeam | null };
  partner: { id: string; name: string; logoUrl: string | null } | null;
  template: { id: string | null; name: string; resolvedFrom: 'project' | 'partner' | 'default' | 'hardcoded' };
  style: {
    id: string | null;
    name: string;
    resolvedFrom: 'project' | 'partner' | 'template' | 'system-default';
    fontFamily: string;
    fontSource: 'google' | 'custom' | 'system';
    /** Path on this app's origin for a custom font (e.g. /fonts/ASRoma-Regular.woff), else null. */
    fontFile: string | null;
    /** Colours are #RRGGBBAA. */
    headingColor: string;
    heroBackground: string;
    /**
     * The colours camera's guest pages (login, selfie, photo) are drawn with, from the same style: what the report page shows
     * behind and on its cards. Each falls back to the system default style when the style does not set it.
     */
    page: CameraPageStyle;
  };
}

/** The part of a report style a page around a photo needs; colours are #RRGGBBAA, `cardRadius` a CSS length. */
export interface CameraPageStyle {
  /** Page background (the style's `pageBackground`, else its hero background, as the report page does). */
  pageBackground: string;
  /** Text on the page background. */
  textColor: string;
  /** Card background and border (the report's chart cards). */
  cardBackground: string;
  cardBorder: string;
  /** Primary button: the report's export button. */
  buttonBackground: string;
  buttonText: string;
  /** Accent, links. */
  accentColor: string;
  linkColor: string;
  cardRadius: string;
}

type Doc = Record<string, any>;

function toObjectId(value: unknown): ObjectId | null {
  if (value instanceof ObjectId) return value;
  if (value && typeof value === 'object' && '_id' in (value as Doc)) return toObjectId((value as Doc)._id);
  return typeof value === 'string' && ObjectId.isValid(value) ? new ObjectId(value) : null;
}

const text = (value: unknown): string | null => (typeof value === 'string' && value.trim() ? value.trim() : null);

function team(partner: Doc | null): CameraFrameTeam | null {
  if (!partner || !text(partner.name)) return null;
  return {
    id: String(partner._id),
    name: partner.name.trim(),
    shortName: text(partner.sportsDb?.strTeamShort) ?? text(partner.footballData?.shortName),
    logoUrl: text(partner.logoUrl),
  };
}

async function findPartner(db: Db, ref: unknown): Promise<Doc | null> {
  const id = toObjectId(ref);
  return id ? ((await db.collection('partners').findOne({ _id: id })) as Doc | null) : null;
}

async function findById(db: Db, collection: string, ref: unknown): Promise<Doc | null> {
  const id = toObjectId(ref);
  return id ? ((await db.collection(collection).findOne({ _id: id })) as Doc | null) : null;
}

async function resolveFont(db: Db, name: string): Promise<{ fontSource: 'google' | 'custom' | 'system'; fontFile: string | null }> {
  const wanted = name.trim().toLowerCase();
  const stored = (await db.collection('available_fonts').find({}).toArray()) as Doc[];
  const known = [...stored, ...DEFAULT_FONTS].find((font) => String(font.name).trim().toLowerCase() === wanted);
  if (!known) return { fontSource: 'system', fontFile: null };
  const fontSource = known.category === 'custom' || known.category === 'google' ? known.category : 'system';
  return { fontSource, fontFile: fontSource === 'custom' ? text(known.fontFile) : null };
}

export async function buildCameraFrameContext(db: Db, messmassEventId: string): Promise<CameraFrameContext | null> {
  const projectId = toObjectId(messmassEventId);
  if (!projectId) return null;
  const project = (await db.collection('projects').findOne({ _id: projectId })) as Doc | null;
  if (!project) return null;

  const homeRef = project.partner1Id ?? project.partner1;
  const visitorRef = project.partner2Id ?? project.partner2;
  const home = await findPartner(db, homeRef);
  const visitor = await findPartner(db, visitorRef);
  // The partner of the event: the home team, or the organiser of an event without teams.
  const partner = home ?? (await findPartner(db, project.partnerId));

  // Template: event, then its partner, then the default, then none.
  let template: Doc | null = null;
  let templateFrom: CameraFrameContext['template']['resolvedFrom'] = 'hardcoded';
  const candidates: Array<[Doc | null | undefined, CameraFrameContext['template']['resolvedFrom']]> = [
    [project, 'project'],
    [partner, 'partner'],
  ];
  for (const [owner, from] of candidates) {
    const found = owner?.reportTemplateId ? await findById(db, 'report_templates', owner.reportTemplateId) : null;
    if (found) {
      template = found;
      templateFrom = from;
      break;
    }
  }
  if (!template) {
    template = (await db.collection('report_templates').findOne({ isDefault: true })) as Doc | null;
    if (template) templateFrom = 'default';
  }

  // Style: event, then partner, then the template's, then the system default.
  const styleRefs: Array<[unknown, 'project' | 'partner' | 'template']> = [
    [project.styleIdEnhanced, 'project'],
    [partner?.styleId, 'partner'],
    [template?.styleId, 'template'],
  ];
  let style: Doc | null = null;
  let styleFrom: CameraFrameContext['style']['resolvedFrom'] = 'system-default';
  for (const [ref, from] of styleRefs) {
    if (!ref) continue;
    // Same order as the report page: the first style id that is set decides; a missing document means the default.
    style = await findById(db, 'report_styles', ref);
    if (style) styleFrom = from;
    break;
  }

  const fontFamily = text(style?.fontFamily) ?? DEFAULT_STYLE.fontFamily ?? 'Inter';
  const font = await resolveFont(db, fontFamily);

  return {
    event: {
      id: String(project._id),
      name: text(project.eventName) ?? 'Untitled event',
      date: project.eventDate ? String(project.eventDate) : null,
      homeTeam: team(home),
      visitorTeam: team(visitor),
    },
    partner: partner && text(partner.name) ? { id: String(partner._id), name: partner.name.trim(), logoUrl: text(partner.logoUrl) } : null,
    template: {
      id: template ? String(template._id) : null,
      name: template ? (text(template.name) ?? 'Template') : 'System Default',
      resolvedFrom: templateFrom,
    },
    style: {
      id: style ? String(style._id) : null,
      name: style ? (text(style.name) ?? 'Style') : 'System default',
      resolvedFrom: styleFrom,
      fontFamily,
      ...font,
      headingColor: text(style?.headingColor) ?? DEFAULT_STYLE.headingColor,
      heroBackground: text(style?.heroBackground) ?? DEFAULT_STYLE.heroBackground,
      page: pageStyleOf(style),
    },
  };
}

/** The page colours of a style (or of the system default when there is no style), each falling back to the default's. */
export function pageStyleOf(style: Doc | null): CameraPageStyle {
  const heroBackground = text(style?.heroBackground) ?? DEFAULT_STYLE.heroBackground;
  return {
    pageBackground: text(style?.pageBackground) ?? (style ? heroBackground : DEFAULT_STYLE.pageBackground ?? heroBackground),
    textColor: text(style?.textColor) ?? DEFAULT_STYLE.textColor,
    cardBackground: text(style?.chartBackground) ?? DEFAULT_STYLE.chartBackground,
    cardBorder: text(style?.chartBorder) ?? DEFAULT_STYLE.chartBorder,
    buttonBackground: text(style?.exportButtonBackground) ?? DEFAULT_STYLE.exportButtonBackground,
    buttonText: text(style?.exportButtonText) ?? DEFAULT_STYLE.exportButtonText,
    accentColor: text(style?.barColor1) ?? DEFAULT_STYLE.barColor1,
    linkColor: text(style?.textLinkColor) ?? DEFAULT_STYLE.textLinkColor ?? DEFAULT_STYLE.barColor1,
    cardRadius: text(style?.cardBorderRadius) ?? DEFAULT_STYLE.cardBorderRadius ?? '0.75rem',
  };
}
