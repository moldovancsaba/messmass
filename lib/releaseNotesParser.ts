import fs from 'node:fs';
import path from 'node:path';

export type ReleaseItemType = 'new' | 'fix' | 'changed' | 'security' | 'doc';
export type ReleaseCategoryFilter = 'all' | ReleaseItemType;

export interface ReleaseItem {
  type: ReleaseItemType;
  scope?: string;
  summary: string;
}

export interface ReleaseNoteSection {
  version: string;
  date: string;
  formattedDate: string;
  relativeAge: string;
  title: string;
  items: ReleaseItem[];
  counts: Record<ReleaseItemType, number>;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatReleaseDate(isoDate: string): string {
  const clean = isoDate.slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(clean);
  if (!m) return isoDate || 'Recent';
  const year = m[1];
  const monthIdx = parseInt(m[2], 10) - 1;
  const day = parseInt(m[3], 10);
  if (monthIdx < 0 || monthIdx > 11 || Number.isNaN(day)) return clean;
  return `${MONTH_NAMES[monthIdx]} ${day}, ${year}`;
}

export function computeRelativeAge(isoDate: string, now: Date = new Date()): string {
  const clean = isoDate.slice(0, 10);
  const target = new Date(`${clean}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) return 'Recent';
  const diffDays = Math.floor((now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 14) return '1 week ago';
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 60) return '1 month ago';
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  const years = Math.floor(diffDays / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

function sanitizeSummaryText(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\b[a-z0-9.-]+\.mongodb\.net\b/gi, 'MongoDB Atlas');
}

function classifyLead(lead: string, body: string): { type: ReleaseItemType; scope?: string } {
  const m = /^([A-Za-z\s,]+?)(?:\s*\(([^)]+)\))?$/.exec(lead.trim());
  const verb = (m ? m[1] : lead).trim().toLowerCase();
  const scope = m?.[2]?.trim();
  const combined = `${verb} ${scope ?? ''} ${body.slice(0, 80)}`.toLowerCase();

  if (combined.includes('security') || combined.includes('privacy') || combined.includes('erasure') || combined.includes('csrf') || combined.includes('auth')) {
    if (verb.startsWith('fix')) return { type: 'fix', scope };
    if (verb.includes('security') || verb.includes('privacy')) return { type: 'security', scope };
  }
  if (verb.startsWith('add') || verb.startsWith('new') || verb.startsWith('feat')) {
    return { type: 'new', scope };
  }
  if (verb.startsWith('fix') || verb.startsWith('resolv') || verb.startsWith('recover')) {
    return { type: 'fix', scope };
  }
  if (verb.startsWith('guide') || verb.startsWith('doc') || verb.startsWith('clarif') || verb.startsWith('verif') || verb.startsWith('checked')) {
    return { type: 'doc', scope };
  }
  return { type: 'changed', scope };
}

export function parseReleaseNotesMarkdown(markdown: string, now: Date = new Date()): ReleaseNoteSection[] {
  const lines = markdown.split(/\r?\n/);
  const sections: ReleaseNoteSection[] = [];
  let current: ReleaseNoteSection | null = null;

  const headingRegex = /^##\s+(?:\[?([^\]—\s]+)\]?)\s*—\s*(\d{4}-\d{2}-\d{2}[^\s—]*)\s*(?:—\s*(.+))?$/;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const hMatch = headingRegex.exec(line);
    if (hMatch) {
      if (current && current.items.length > 0) {
        sections.push(current);
      }
      const rawVersion = hMatch[1].trim();
      const rawDate = hMatch[2].trim();
      const rawTitle = (hMatch[3] || rawVersion).trim();
      current = {
        version: rawVersion,
        date: rawDate.slice(0, 10),
        formattedDate: formatReleaseDate(rawDate),
        relativeAge: computeRelativeAge(rawDate, now),
        title: rawTitle,
        items: [],
        counts: { new: 0, fix: 0, changed: 0, security: 0, doc: 0 },
      };
      continue;
    }

    if (!current || !line.startsWith('- ')) continue;

    const bulletBody = line.slice(2).trim();
    const boldMatch = /^\*\*([^*]+?):\*\*\s*(.+)$/.exec(bulletBody) || /^\*\*([^*]+?)\*\*:\s*(.+)$/.exec(bulletBody);
    if (boldMatch) {
      const { type, scope } = classifyLead(boldMatch[1], boldMatch[2]);
      current.items.push({
        type,
        ...(scope ? { scope } : {}),
        summary: sanitizeSummaryText(boldMatch[2]),
      });
      current.counts[type] += 1;
    } else if (bulletBody.length > 0) {
      current.items.push({
        type: 'changed',
        summary: sanitizeSummaryText(bulletBody),
      });
      current.counts.changed += 1;
    }
  }

  if (current && current.items.length > 0) {
    sections.push(current);
  }

  return sections;
}

export function getReleaseNotes(limit = 40): ReleaseNoteSection[] {
  try {
    const filePath = path.join(process.cwd(), 'docs', 'operations', 'operations-release-notes.md');
    const content = fs.readFileSync(filePath, 'utf8');
    return parseReleaseNotesMarkdown(content).slice(0, limit);
  } catch {
    return [];
  }
}
