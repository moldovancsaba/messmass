import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateBrandEmvEur,
  DEFAULT_EMV_CPM_EUR,
  DEFAULT_EMV_IMPRESSIONS_PER_APPEARANCE,
  INTERACTIVE_REPORT_CHART_ALGORITHMS,
} from '../lib/interactiveReportEmv';
import { evaluateFormula } from '../lib/formulaEngine';

test('calculateBrandEmvEur computes empirical EMV and supports custom parameters', () => {
  assert.equal(calculateBrandEmvEur(0), 0);
  assert.equal(calculateBrandEmvEur(-10), 0);
  const expected = Math.round(((1739 * DEFAULT_EMV_IMPRESSIONS_PER_APPEARANCE * DEFAULT_EMV_CPM_EUR) / 1000) * 100) / 100;
  assert.equal(calculateBrandEmvEur(1739), expected);
  assert.equal(calculateBrandEmvEur(1000, { impressionsPerAppearance: 5, cpmEur: 30 }), 150);
});

test('all INTERACTIVE_REPORT_CHART_ALGORITHMS evaluate cleanly via formulaEngine', () => {
  const sampleStats: Record<string, number> = {
    fanmassBrandAppearances: 1000,
    fanmassOptInPhotos: 80,
    fanmassPhotoResultsReceived: 100,
    approvedImages: 90,
    rejectedImages: 10,
    camera_consents_accepted: 75,
    camera_images_taken: 100,
    camera_journeys_completed: 60,
    camera_journey_opens: 80,
    fanmassSmilingCount: 55,
    fanmassDemographicPeopleMeasured: 110,
    fanmassGenderMaleCount: 60,
    fanmassGenderFemaleCount: 50,
    fanmassAgeGenAlphaCount: 5,
    fanmassAgeGenZCount: 30,
    fanmassAgeMillennialCount: 40,
    fanmassAgeGenXCount: 20,
    fanmassAgeBoomerCount: 15,
    fanmassClubAppearances: 400,
    fanmassBrandTypesDetected: 12,
    fanmassClubTypesDetected: 6,
    fanmassPeopleDetections: 140,
    fanmassMerchandiseJerseyCount: 30,
    fanmassMerchandiseScarfCount: 15,
    fanmassMerchandiseCapCount: 20,
    fanmassMerchandiseFlagCount: 5,
    fanmassMerchandiseKitCount: 10,
    fanmassModerationPhotosReviewed: 100,
    fanmassModerationFlaggedPhotos: 2,
  };

  for (const chart of INTERACTIVE_REPORT_CHART_ALGORITHMS) {
    for (const el of chart.elements) {
      const numericParams = el.parameters
        ? Object.fromEntries(Object.entries(el.parameters).map(([k, v]) => [k, v.value]))
        : undefined;
      const value = evaluateFormula(el.formula, sampleStats as any, numericParams);
      assert.equal(typeof value, 'number', `${chart.chartId}/${el.id} did not evaluate to a number`);
      assert.ok(Number.isFinite(value as number), `${chart.chartId}/${el.id} evaluated to non-finite`);
    }
  }

  const emvChart = INTERACTIVE_REPORT_CHART_ALGORITHMS.find((c) => c.chartId === 'brand-earned-media-value');
  assert.ok(emvChart);
  const emvParams = Object.fromEntries(
    Object.entries(emvChart.elements[0].parameters || {}).map(([k, v]) => [k, v.value]),
  );
  const emvVal = evaluateFormula(
    emvChart.elements[0].formula,
    sampleStats as any,
    emvParams,
  );
  assert.equal(emvVal, calculateBrandEmvEur(1000));
});
