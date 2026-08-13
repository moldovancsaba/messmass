// WHAT: Loads the docs/guides tutorial markdown and renders it to HTML for the in-app
//       user-guide reader (/admin/help/guides).
// WHY: The tutorials are authored as canonical markdown in docs/guides/ (governance +
//      version control); this module makes the SAME files readable online without a
//      second copy. Trusted, first-party content — safe to render as HTML.
import { promises as fs } from 'fs';
import path from 'path';
import { marked } from 'marked';

const GUIDES_DIR = path.join(process.cwd(), 'docs', 'guides');
const TUTORIAL_PREFIX = 'guides-tutorial-';
const INDEX_FILE = 'guides-tutorials-index.md';

// ponytail: slugs are the tutorial filename minus the `guides-tutorial-` prefix and `.md`.
// The strict charset also doubles as path-traversal protection for the [slug] route.
const SLUG_RE = /^[a-z0-9-]+$/;

export type Guide = { title: string; html: string };

// Remove the 4 governance header lines so they don't render as prose.
function stripHeaderMeta(md: string): string {
  return md
    .replace(/^(Status|Last Updated|Canonical|Owner):.*$/gm, '')
    .replace(/\n{3,}/g, '\n\n');
}

// Rewrite in-repo markdown links to the online routes; drop links to docs we don't serve.
function rewriteLinks(md: string): string {
  return md
    .replace(/\]\(guides-tutorials-index\.md\)/g, '](/admin/help/guides)')
    .replace(/\]\(guides-tutorial-([a-z0-9-]+)\.md\)/g, '](/admin/help/guides/$1)')
    // Any remaining *.md link points at a repo doc not served online — keep the text, drop the link.
    .replace(/\[([^\]]+)\]\((?:\.\.\/)?[^)]*\.md\)/g, '$1');
}

function extractTitle(md: string): string {
  const m = md.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : 'Guide';
}

export async function listGuideSlugs(): Promise<string[]> {
  const files = await fs.readdir(GUIDES_DIR);
  return files
    .filter((f) => f.startsWith(TUTORIAL_PREFIX) && f.endsWith('.md'))
    .map((f) => f.slice(TUTORIAL_PREFIX.length, -3))
    .sort();
}

async function renderFile(file: string): Promise<Guide | null> {
  let raw: string;
  try {
    raw = await fs.readFile(path.join(GUIDES_DIR, file), 'utf8');
  } catch {
    return null;
  }
  const html = await marked.parse(rewriteLinks(stripHeaderMeta(raw)));
  return { title: extractTitle(raw), html };
}

export async function getGuide(slug: string): Promise<Guide | null> {
  if (!SLUG_RE.test(slug)) return null;
  return renderFile(`${TUTORIAL_PREFIX}${slug}.md`);
}

export async function getGuidesIndex(): Promise<Guide | null> {
  return renderFile(INDEX_FILE);
}
