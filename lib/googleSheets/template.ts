import { FIELD_DEFINITIONS } from './dynamicMapping';
import { v4 as uuidv4 } from 'uuid';

type TemplateColumn = {
  field: string;
  sample: string | number | (() => string | number);
};

const EVENT_TEMPLATE_COLUMNS: TemplateColumn[] = [
  { field: 'googleSheetUuid', sample: () => `template-${uuidv4().split('-')[0]}` },
  { field: 'partner1Name', sample: 'Home Legends' },
  { field: 'partner2Name', sample: 'Away Warriors' },
  { field: 'eventTitle', sample: 'Champions Exhibition' },
  { field: 'eventDate', sample: '2026-02-04T20:00:00.000Z' },
  { field: 'eventAttendees', sample: 1_620 },
  { field: 'stats.totalFans', sample: 1_200 },
  { field: 'stats.female', sample: 610 },
  { field: 'stats.male', sample: 590 },
  { field: 'stats.remoteImages', sample: 45 },
  { field: 'stats.hostessImages', sample: 30 },
  { field: 'stats.visitQrCode', sample: 240 },
  { field: 'stats.socialVisit', sample: 480 },
  { field: 'stats.bitlyClicksFromFacebook', sample: 175 },
  { field: 'stats.bitlyClicksFromInstagram', sample: 112 },
];

const TEMPLATE_CONTEXTS: Record<string, TemplateColumn[]> = {
  events: EVENT_TEMPLATE_COLUMNS,
};

function headerForField(field: string): string {
  const definitionEntry = Object.values(FIELD_DEFINITIONS).find(
    (definition) => definition.field === field
  );

  if (definitionEntry) {
    return definitionEntry.field.startsWith('stats.')
      ? definitionEntry.field.replace('stats.', '')
      : definitionEntry.field;
  }
  return field;
}

function formatValue(value: string | number | (() => string | number)): string {
  const resolved = typeof value === 'function' ? value() : value;

  if (resolved === null || resolved === undefined) {
    return '';
  }

  return String(resolved);
}

export function buildGoogleSheetsTemplate(context: string = 'events'): string {
  const columns = TEMPLATE_CONTEXTS[context] || EVENT_TEMPLATE_COLUMNS;

  const headers = columns.map((column) => headerForField(column.field));
  const sampleRow = columns.map((column) => formatValue(column.sample));

  return `${headers.join(',')}\n${sampleRow.join(',')}\n`;
}
