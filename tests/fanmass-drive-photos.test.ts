// tests/fanmass-drive-photos.test.ts
// WHAT: The drive photos Fanmass placed in an event are stored only with their placement confidence and recorded opt-in.

import { DRIVE_PHOTOS_CONTRACT, parseDrivePhotos } from '@/lib/fanmassDrivePhotos';

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
  ])('refuses %s', (_label, input) => {
    expect(() => parseDrivePhotos(input, EVENT)).toThrow();
  });
});
