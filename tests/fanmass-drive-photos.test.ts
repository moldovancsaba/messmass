// tests/fanmass-drive-photos.test.ts
// WHAT: The drive photos Fanmass placed in an event are stored only with their placement confidence and recorded opt-in.

import { DRIVE_PHOTOS_CONTRACT, parseDrivePhotos } from '@/lib/fanmassDrivePhotos';
import { readDriveSummary } from '@/lib/hashtagReport/measured';
import { driveFacet } from './helpers/driveFacet';

const EVENT = '6af1d928b09e9a526e9d50df';
const photo = (over: Record<string, unknown> = {}) => ({
  photoId: 'Basketball/0014c5b3-f46b-4acc-8fc3-2891501d750a.jpg',
  assignment: { confidence: 0.9, method: 'between_reads' },
  optIn: { received: true, basis: 'local_drive_policy' },
  analysis: { people: 2, genders: { male: 1, female: 1 }, ageGroups: {}, emotions: { happy: 2 }, brands: ['Veolia'], clubs: ['DVTK'] },
  ...over,
});
const body = (photos: unknown[]) => ({ contractVersion: DRIVE_PHOTOS_CONTRACT, messmassEventId: EVENT, photos });

describe('parseDrivePhotos', () => {
  it('keeps a valid photo with its sport, placement and analysis', () => {
    const { photos } = parseDrivePhotos(body([photo()]), EVENT);
    expect(photos[0]).toMatchObject({ sport: 'Basketball', assignment: { confidence: 0.9, method: 'between_reads' }, analysis: { people: 2, brands: ['Veolia'] } });
  });

  it('accepts a request that only removes photos that left the event', () => {
    const parsed = parseDrivePhotos({ ...body([]), remove: ['Football/a.jpg', 'Football/a.jpg'] }, EVENT);
    expect(parsed.photos).toEqual([]);
    expect(parsed.remove).toEqual(['Football/a.jpg']);
  });

  it('keeps the photo hashtags lowercase, without # and once each', () => {
    const { photos } = parseDrivePhotos(body([photo({ hashtags: ['#TippmixReport2026', 'happy', 'happy', 'ferencvarositc'] })]), EVENT);
    expect(photos[0].hashtags).toEqual(['tippmixreport2026', 'happy', 'ferencvarositc']);
    expect(parseDrivePhotos(body([photo()]), EVENT).photos[0].hashtags).toEqual([]);
  });

  it('accepts library photos that sit in no event, and refuses an event id on them', () => {
    expect(parseDrivePhotos({ ...body([photo()]), messmassEventId: null }, null).messmassEventId).toBeNull();
    expect(() => parseDrivePhotos(body([photo()]), null)).toThrow();
  });

  it('counts a library photo as a drive photo but not as placed', () => {
    const sum = readDriveSummary(driveFacet([{ eventId: null, assignment: { confidence: 0 }, optIn: { received: true }, analysis: null }, { eventId: 'e1', assignment: { confidence: 1 }, optIn: { received: true }, analysis: null }])).drive;
    expect(sum).toMatchObject({ photos: 2, placed: 1, placedOverHalf: 1, withOptIn: 2 });
  });

  it('accepts the library file names as they are: spaces, brackets and accents', () => {
    const ids = ['Football/83d53f77-eaa4-4e6c-917a-af1a9e94f9d1 (1).jpg', 'Ice Hockey/ÁRPÁD_Ö.jpg', 'Football/A\u0301.jpg'.normalize('NFD')];
    expect(parseDrivePhotos(body(ids.map((photoId) => photo({ photoId }))), EVENT).photos.map((p) => p.photoId)).toEqual(ids);
  });

  it('accepts a photo Fanmass has not analysed yet', () => {
    expect(parseDrivePhotos(body([photo({ analysis: null })]), EVENT).photos[0].analysis).toBeNull();
  });

  it.each([
    ['another event in the body', { ...body([photo()]), messmassEventId: 'x' }],
    ['no opt-in', body([photo({ optIn: undefined })])],
    ['a confidence above 1', body([photo({ assignment: { confidence: 1.5, method: 'x' } })])],
    ['a path instead of <sport>/<file>', body([photo({ photoId: '../etc/passwd' })])],
    ['nothing to place or remove', body([])],
    ['a removal that is not a photo id', { ...body([]), remove: ['../x'] }],
    ['a hashtag with spaces or accents', body([photo({ hashtags: ['ferencvárosi tc'] })])],
  ])('refuses %s', (_label, input) => {
    expect(() => parseDrivePhotos(input, EVENT)).toThrow();
  });
});
