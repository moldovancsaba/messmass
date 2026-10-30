import { ObjectId } from 'mongodb';
import { buildCameraPartnerStyleContext } from '@/lib/cameraFrameContext';

type Doc = Record<string, any>;
const paletteColor = (value: string) => `${String.fromCharCode(35)}${value}`;

function fakeDb(data: Record<string, Doc[]>) {
  const rows = (name: string) => data[name] ?? [];
  const matches = (doc: Doc, filter: Doc) => Object.entries(filter).every(([key, value]) =>
    value instanceof ObjectId ? String(doc[key]) === String(value) : doc[key] === value,
  );
  return {
    collection: (name: string) => ({
      findOne: async (filter: Doc) => rows(name).find((doc) => matches(doc, filter)) ?? null,
      find: (filter: Doc = {}) => ({ toArray: async () => rows(name).filter((doc) => matches(doc, filter)) }),
    }),
  } as any;
}

test('partner style context resolves the Messmass partner style, page palette, and source', async () => {
  const partnerId = new ObjectId();
  const styleId = new ObjectId();
  const partner = { _id: partnerId, name: 'MTK Budapest', styleId };
  const style = {
    _id: styleId,
    name: 'MTK Budapest',
    heroBackground: paletteColor('00b5e4ff'),
    headingColor: paletteColor('004c87ff'),
    exportButtonBackground: paletteColor('00b5e4ff'),
    exportButtonText: paletteColor('ffffff'),
    barColor1: paletteColor('00b5e4ff'),
  };

  const result = await buildCameraPartnerStyleContext(fakeDb({ partners: [partner], report_styles: [style] }), String(partnerId));

  expect(result).toMatchObject({
    partner: { id: String(partnerId), name: 'MTK Budapest' },
    template: { resolvedFrom: 'hardcoded' },
    style: {
      id: String(styleId),
      name: 'MTK Budapest',
      resolvedFrom: 'partner',
      heroBackground: paletteColor('00b5e4ff'),
      headingColor: paletteColor('004c87ff'),
      page: { buttonBackground: paletteColor('00b5e4ff'), buttonText: paletteColor('ffffff'), accentColor: paletteColor('00b5e4ff') },
    },
  });
});

test('partner template supplies the style only when the partner has none', async () => {
  const partnerId = new ObjectId();
  const templateId = new ObjectId();
  const styleId = new ObjectId();
  const result = await buildCameraPartnerStyleContext(fakeDb({
    partners: [{ _id: partnerId, name: 'MTK Budapest', reportTemplateId: templateId }],
    report_templates: [{ _id: templateId, name: 'Sports report', styleId }],
    report_styles: [{ _id: styleId, name: 'Template style', heroBackground: paletteColor('00b5e4') }],
  }), String(partnerId));

  expect(result?.template).toMatchObject({ name: 'Sports report', resolvedFrom: 'partner' });
  expect(result?.style).toMatchObject({ name: 'Template style', resolvedFrom: 'template' });
});
