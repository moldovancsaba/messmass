import { CHART_COLOR } from '@/lib/theme/chartPalette';
import type { ChartConfiguration } from '@/lib/chartConfigTypes';

export const DEFAULT_EMV_IMPRESSIONS_PER_APPEARANCE = 4.6;
export const DEFAULT_EMV_CPM_EUR = 22;

export interface EmvCalculationOptions {
  impressionsPerAppearance?: number;
  cpmEur?: number;
}

/**
 * Compute Earned Media Value (EUR) from authentic brand appearances.
 * Formula: (brandAppearances * impressionsPerAppearance * cpmEur) / 1000
 */
export function calculateBrandEmvEur(
  brandAppearances: number,
  options: EmvCalculationOptions = {},
): number {
  if (!Number.isFinite(brandAppearances) || brandAppearances <= 0) return 0;
  const impressions =
    typeof options.impressionsPerAppearance === 'number' && Number.isFinite(options.impressionsPerAppearance)
      ? options.impressionsPerAppearance
      : DEFAULT_EMV_IMPRESSIONS_PER_APPEARANCE;
  const cpm =
    typeof options.cpmEur === 'number' && Number.isFinite(options.cpmEur)
      ? options.cpmEur
      : DEFAULT_EMV_CPM_EUR;
  return Math.round(((brandAppearances * impressions * cpm) / 1000) * 100) / 100;
}

export type InteractiveChartAlgorithmSeed = Omit<ChartConfiguration, '_id' | 'createdAt' | 'updatedAt' | 'createdBy'> & {
  emoji?: string;
};

/**
 * Canonical chart algorithm definitions for Interactive / Fanmass report metrics
 * so every interactive calculation is visible, inspectable, and tunable in /admin/charts.
 */
export const INTERACTIVE_REPORT_CHART_ALGORITHMS: InteractiveChartAlgorithmSeed[] = [
  {
    chartId: 'brand-earned-media-value',
    title: 'Brand Earned Media Value (EMV)',
    type: 'kpi',
    order: 10,
    isActive: true,
    emoji: '💰',
    elements: [
      {
        id: 'emv-value',
        label: 'Earned Media Value',
        formula: '([fanmassBrandAppearances] * [PARAM:impressionsPerAppearance] * [PARAM:cpmEur]) / 1000',
        color: CHART_COLOR.green,
        description:
          'Empirical calculation of in-stadium authentic brand exposure value: Brand Appearances × Peer Impressions × CPM / 1000.',
        formatting: { rounded: true, prefix: '€', suffix: '' },
        parameters: {
          impressionsPerAppearance: {
            value: DEFAULT_EMV_IMPRESSIONS_PER_APPEARANCE,
            label: 'Peer Impressions / Appearance',
            description: 'Average in-stadium peer impressions per detected brand appearance',
            unit: 'impressions',
          },
          cpmEur: {
            value: DEFAULT_EMV_CPM_EUR,
            label: 'CPM Rate',
            description: 'Cost per 1,000 impressions in EUR',
            unit: 'EUR',
          },
        },
      },
    ],
  },
  {
    chartId: 'fanmass-photo-opt-in-rate',
    title: 'Fanmass Photo Opt-In Rate',
    type: 'kpi',
    order: 11,
    isActive: true,
    emoji: '✅',
    elements: [
      {
        id: 'fanmass-opt-in-rate',
        label: 'Photos with Recorded Opt-In (%)',
        formula: '([fanmassOptInPhotos] / [fanmassPhotoResultsReceived]) * 100',
        color: CHART_COLOR.green,
        description: 'Share of analysed photos carrying a recorded Camera participant opt-in.',
        formatting: { rounded: false, prefix: '', suffix: '%' },
      },
    ],
  },
  {
    chartId: 'fanmass-vetting-approval-rate',
    title: 'Camera Vetting Approval Rate',
    type: 'kpi',
    order: 12,
    isActive: true,
    emoji: '🛡️',
    elements: [
      {
        id: 'vetting-approval-rate',
        label: 'Approved Share of Decided Photos (%)',
        formula: '([approvedImages] / ([approvedImages] + [rejectedImages])) * 100',
        color: CHART_COLOR.blue,
        description: 'Approved photos divided by all photos decided in vetting (approved + rejected).',
        formatting: { rounded: false, prefix: '', suffix: '%' },
      },
    ],
  },
  {
    chartId: 'fanmass-consent-share',
    title: 'Camera Consent Share',
    type: 'kpi',
    order: 13,
    isActive: true,
    emoji: '📝',
    elements: [
      {
        id: 'camera-consent-share',
        label: 'Consents Accepted / Photos Taken (%)',
        formula: '([camera_consents_accepted] / [camera_images_taken]) * 100',
        color: CHART_COLOR.blue,
        description: 'Share of taken Camera photos with an accepted participant consent.',
        formatting: { rounded: false, prefix: '', suffix: '%' },
      },
    ],
  },
  {
    chartId: 'fanmass-journey-completion-rate',
    title: 'Camera Journey Completion Rate',
    type: 'kpi',
    order: 14,
    isActive: true,
    emoji: '🏁',
    elements: [
      {
        id: 'journey-completion-rate',
        label: 'Journeys Completed / Opened (%)',
        formula: '([camera_journeys_completed] / [camera_journey_opens]) * 100',
        color: CHART_COLOR.purple,
        description: 'Share of opened Camera journeys that reached completion.',
        formatting: { rounded: false, prefix: '', suffix: '%' },
      },
    ],
  },
  {
    chartId: 'fanmass-smiling-rate',
    title: 'Fanmass Smiling Rate',
    type: 'kpi',
    order: 15,
    isActive: true,
    emoji: '😊',
    elements: [
      {
        id: 'fanmass-smiling-rate',
        label: 'Smiling Share of Observed People (%)',
        formula: '([fanmassSmilingCount] / [fanmassDemographicPeopleMeasured]) * 100',
        color: CHART_COLOR.yellow,
        description: 'Detected smiling people divided by all people with demographic observations.',
        formatting: { rounded: false, prefix: '', suffix: '%' },
      },
    ],
  },
  {
    chartId: 'fanmass-gender-split',
    title: 'Fanmass AI Gender Split',
    type: 'pie',
    order: 16,
    isActive: true,
    emoji: '👥',
    elements: [
      {
        id: 'fanmass-gender-male',
        label: 'Male',
        formula: '[fanmassGenderMaleCount]',
        color: CHART_COLOR.blue,
        description: 'Photo-level male detections across received Fanmass photo analyses.',
      },
      {
        id: 'fanmass-gender-female',
        label: 'Female',
        formula: '[fanmassGenderFemaleCount]',
        color: CHART_COLOR.pink,
        description: 'Photo-level female detections across received Fanmass photo analyses.',
      },
    ],
  },
  {
    chartId: 'fanmass-age-distribution',
    title: 'Fanmass AI Age Distribution',
    type: 'bar',
    order: 17,
    isActive: true,
    emoji: '🎂',
    elements: [
      {
        id: 'age-gen-alpha',
        label: 'Gen Alpha',
        formula: '[fanmassAgeGenAlphaCount]',
        color: CHART_COLOR.purple,
      },
      {
        id: 'age-gen-z',
        label: 'Gen Z',
        formula: '[fanmassAgeGenZCount]',
        color: CHART_COLOR.blue,
      },
      {
        id: 'age-millennial',
        label: 'Millennials',
        formula: '[fanmassAgeMillennialCount]',
        color: CHART_COLOR.green,
      },
      {
        id: 'age-gen-x',
        label: 'Gen X',
        formula: '[fanmassAgeGenXCount]',
        color: CHART_COLOR.orange,
      },
      {
        id: 'age-boomer',
        label: 'Boomers',
        formula: '[fanmassAgeBoomerCount]',
        color: CHART_COLOR.gray,
      },
    ],
  },
  {
    chartId: 'fanmass-brand-and-club-exposure',
    title: 'Fanmass Brand & Club Exposure',
    type: 'bar',
    order: 18,
    isActive: true,
    emoji: '🏷️',
    elements: [
      {
        id: 'brand-appearances',
        label: 'Brand Appearances',
        formula: '[fanmassBrandAppearances]',
        color: CHART_COLOR.green,
      },
      {
        id: 'club-appearances',
        label: 'Club Appearances',
        formula: '[fanmassClubAppearances]',
        color: CHART_COLOR.blue,
      },
      {
        id: 'distinct-brands',
        label: 'Distinct Brands',
        formula: '[fanmassBrandTypesDetected]',
        color: CHART_COLOR.purple,
      },
      {
        id: 'distinct-clubs',
        label: 'Distinct Clubs',
        formula: '[fanmassClubTypesDetected]',
        color: CHART_COLOR.orange,
      },
      {
        id: 'people-detections',
        label: 'People Detections',
        formula: '[fanmassPeopleDetections]',
        color: CHART_COLOR.yellow,
      },
    ],
  },
  {
    chartId: 'fanmass-merchandise-breakdown',
    title: 'Fanmass Merchandise Detections',
    type: 'bar',
    order: 19,
    isActive: true,
    emoji: '👕',
    elements: [
      {
        id: 'merch-jersey',
        label: 'Jerseys',
        formula: '[fanmassMerchandiseJerseyCount]',
        color: CHART_COLOR.blue,
      },
      {
        id: 'merch-scarf',
        label: 'Scarves',
        formula: '[fanmassMerchandiseScarfCount]',
        color: CHART_COLOR.green,
      },
      {
        id: 'merch-cap',
        label: 'Caps & Hats',
        formula: '[fanmassMerchandiseCapCount]',
        color: CHART_COLOR.orange,
      },
      {
        id: 'merch-flag',
        label: 'Flags',
        formula: '[fanmassMerchandiseFlagCount]',
        color: CHART_COLOR.purple,
      },
      {
        id: 'merch-kit',
        label: 'Kits',
        formula: '[fanmassMerchandiseKitCount]',
        color: CHART_COLOR.pink,
      },
    ],
  },
  {
    chartId: 'fanmass-content-safety',
    title: 'Fanmass Content Safety Pass vs Flagged',
    type: 'pie',
    order: 20,
    isActive: true,
    emoji: '🔒',
    elements: [
      {
        id: 'safety-passed',
        label: 'Passed Content Check',
        formula: '[fanmassModerationPhotosReviewed] - [fanmassModerationFlaggedPhotos]',
        color: CHART_COLOR.green,
      },
      {
        id: 'safety-flagged',
        label: 'Flagged for Review',
        formula: '[fanmassModerationFlaggedPhotos]',
        color: CHART_COLOR.red,
      },
    ],
  },
];
