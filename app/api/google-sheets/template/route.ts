import { NextRequest, NextResponse } from 'next/server';
import { buildGoogleSheetsTemplate } from '@/lib/googleSheets/template';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const context = url.searchParams.get('context') || 'events';
  const csv = buildGoogleSheetsTemplate(context);

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="messmass-${context}-template.csv"`,
    },
  });
}
