import { NextRequest, NextResponse } from 'next/server';
import { getReleaseNotes, type ReleaseCategoryFilter } from '@/lib/releaseNotesParser';

export const dynamic = 'force-dynamic';

const VALID_CATEGORIES = new Set<ReleaseCategoryFilter>(['all', 'new', 'fix', 'changed', 'security', 'doc']);

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams;
  const rawCategory = (sp.get('category') || 'all').toLowerCase() as ReleaseCategoryFilter;
  const category: ReleaseCategoryFilter = VALID_CATEGORIES.has(rawCategory) ? rawCategory : 'all';
  const query = (sp.get('q') || '').trim().toLowerCase();
  const limit = Math.min(Math.max(Number(sp.get('limit')) || 40, 1), 100);

  const notes = getReleaseNotes(limit)
    .map((section) => {
      const filteredItems = section.items.filter((item) => {
        if (category !== 'all' && item.type !== category) return false;
        if (!query) return true;
        return (
          item.summary.toLowerCase().includes(query) ||
          (item.scope && item.scope.toLowerCase().includes(query)) ||
          section.title.toLowerCase().includes(query) ||
          section.version.toLowerCase().includes(query)
        );
      });
      return { ...section, items: filteredItems };
    })
    .filter((section) => section.items.length > 0);

  return NextResponse.json({
    success: true,
    category,
    query,
    totalReleases: notes.length,
    notes,
  });
}
