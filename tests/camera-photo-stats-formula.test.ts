// tests/camera-photo-stats-formula.test.ts
// WHAT: A camera_ variable is usable as a token in a report formula: it is found by extractVariablesFromFormula, the formula validates, and evaluateFormula
//     reads its value from the event stats (underscores are allowed in a token).
// WHY: Report templates and charts are built from formulas such as [camera_gender_female]/[camera_people_total]*100. Pure functions; no database.

import { evaluateFormula, extractVariablesFromFormula, validateFormula } from '@/lib/formulaEngine';

const stats = {
  female: 3,
  camera_gender_female: 30,
  camera_gender_male: 50,
  camera_gender_unsure: 20,
  camera_people_total: 100,
  camera_age_kid: 10,
  camera_avg_vetting_seconds: 41.5,
} as never;

describe('camera_ variables in formulas', () => {
  test('the token is found with its underscores', () => {
    expect(extractVariablesFromFormula('[camera_gender_female]/[camera_people_total]*100')).toEqual(['camera_gender_female', 'camera_people_total']);
  });

  test('the formula validates', () => {
    expect(validateFormula('[camera_gender_female]/[camera_people_total]*100').isValid).toBe(true);
    expect(validateFormula('[camera_gender_female]+[camera_gender_male]+[camera_gender_unsure]').isValid).toBe(true);
  });

  test('a share is computed from the two counters', () => {
    expect(evaluateFormula('[camera_gender_female]/[camera_people_total]*100', stats)).toBe(30);
    expect(evaluateFormula('[camera_gender_female]+[camera_gender_male]+[camera_gender_unsure]', stats)).toBe(100);
    expect(evaluateFormula('[camera_avg_vetting_seconds]', stats)).toBe(41.5);
  });

  test('it is its own variable: the existing female is not read for it, and a counter that is missing is 0', () => {
    expect(evaluateFormula('[female]', stats)).toBe(3);
    expect(evaluateFormula('[camera_gender_female]', stats)).toBe(30);
    expect(evaluateFormula('[camera_emotion_happy]', stats)).toBe(0);
  });
});
