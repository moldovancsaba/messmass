// tests/variable-merge-camera-namespace.test.ts
// WHAT: The camera_ names (lib/cameraPhotoStats.ts) are never proposed as merge candidates, never offered in the merge autocomplete and refused by the
//     merge itself (as the canonical name and as a legacy name), while the detection of real duplicates keeps working.
// WHY: The merge console folds casing and sorts word tokens, so a name such as cameraGenderFemale would have the same signature as camera_gender_female; an operator
//     could also pick a camera_ name by hand. An approved merge copies or sums into the canonical name and removes the legacy key from every event, which
//     camera would overwrite again on its next push. Fakes only: no database is opened.

import {
  applyMerges,
  computeMergeCandidates,
  isReservedVariable,
  listVariables,
  tokens,
} from '@/lib/variableMerge';

type Doc = Record<string, any>;

// A database with the collections the merge code reads; every other collection is empty. Writes are recorded.
function fakeDb(projects: Doc[]) {
  const writes: string[] = [];
  const collection = (name: string) => ({
    find: () => ({
      toArray: async () => (name === 'projects' ? projects : []),
    }),
    findOne: async () => null,
    insertOne: async () => { writes.push(`${name}.insertOne`); },
    insertMany: async () => { writes.push(`${name}.insertMany`); },
    updateOne: async () => { writes.push(`${name}.updateOne`); },
    replaceOne: async () => { writes.push(`${name}.replaceOne`); },
    deleteOne: async () => { writes.push(`${name}.deleteOne`); },
  });
  return { db: { collection } as never, writes };
}

const events: Doc[] = [
  { _id: 'e1', stats: { female: 5, Female: 5, scarf: 2, genAlpha: 1, camera_gender_female: 7, camera_merch_scarf: 3, camera_age_kid: 4, cameraGenderFemale: 7 } },
  { _id: 'e2', stats: { female: 6, Female: 6, camera_gender_female: 8 } },
];

describe('the camera_ namespace is reserved', () => {
  test('what is reserved: the prefix and nothing that merely contains it', () => {
    expect(isReservedVariable('camera_gender_female')).toBe(true);
    expect(isReservedVariable('camera_')).toBe(true);
    for (const name of ['female', 'cameraGenderFemale', 'Camera_x', 'x_camera_y', 'fanmassGenderFemalePct', '']) expect(isReservedVariable(name)).toBe(false);
  });

  test('the word-order signature does collide with a differently written name, which is why the exclusion is needed', () => {
    expect(tokens('camera_gender_female')).toBe(tokens('cameraGenderFemale'));
    expect(tokens('camera_gender_female')).not.toBe(tokens('female'));
  });

  test('no candidate names a camera_ variable, but real duplicates are still found', async () => {
    const candidates = await computeMergeCandidates(fakeDb(events).db);
    const named = candidates.flatMap((c) => [c.canonical, ...c.legacy]);
    expect(named.filter((n) => n.startsWith('camera_'))).toEqual([]);
    // female / Female is still a casing duplicate.
    expect(candidates.some((c) => [c.canonical, ...c.legacy].sort().join('|') === ['Female', 'female'].sort().join('|'))).toBe(true);
    // And camera_gender_female / cameraGenderFemale is not proposed (only the camera_ one is reserved, so no pair is left).
    expect(candidates.some((c) => [c.canonical, ...c.legacy].includes('cameraGenderFemale'))).toBe(false);
  });

  test('the merge autocomplete does not list camera_ names', async () => {
    const names = (await listVariables(fakeDb(events).db)).map((v) => v.name);
    expect(names).toContain('female');
    expect(names.filter((n) => n.startsWith('camera_'))).toEqual([]);
  });

  test('a merge that names a camera_ variable, either way round, is refused before anything is read or written', async () => {
    const { db, writes } = fakeDb(events);
    const refuse = (canonical: string, legacy: string[]) =>
      expect(applyMerges(db, [{ canonical, legacy, rule: 'copy' }], { dryRun: false, actor: 'test' })).rejects.toThrow('reserved_variable_cannot_be_merged');
    await refuse('female', ['camera_gender_female']);
    await refuse('camera_gender_female', ['female']);
    await refuse('camera_a', ['camera_b']);
    await refuse('scarf', ['x', 'camera_merch_scarf']);
    expect(writes).toEqual([]);
    // A dry run is refused the same way.
    await expect(applyMerges(db, [{ canonical: 'female', legacy: ['camera_gender_female'], rule: 'sum' }], { dryRun: true })).rejects.toThrow('camera_gender_female');
  });

  test('a merge of ordinary names still runs (dry run reports the events it would touch)', async () => {
    const { db, writes } = fakeDb(events);
    const result = await applyMerges(db, [{ canonical: 'female', legacy: ['Female'], rule: 'copy' }], { dryRun: true });
    expect(result.changes[0]).toMatchObject({ canonical: 'female', legacy: ['Female'] });
    expect(writes).toEqual([]);
  });
});
