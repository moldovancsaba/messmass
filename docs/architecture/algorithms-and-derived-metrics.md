# Algorithms, AI Analytics & Derived Metrics
Status: Active
Last Updated: 2026-11-20T16:00:00.000Z
Canonical: Yes
Owner: Architecture / Data Science
Version: 12.6.0

## 1. AI Analytics Pipeline (Fanmass Integration)

Fanmass processes photos from Camera events and local Google Drive folders through an isolated computer vision pipeline:

```
Camera Event / Drive Image
           │
           ├─► YOLOv8: Face detection, person bounding boxes, head counts
           ├─► InsightFace / DeepFace: Demographic inference (age brackets, gender probability)
           ├─► Merchandise Classifier: Jersey, scarf, baseball cap, and flag detection
           ├─► Apple Vision Feature Prints: 768-dimensional scene embeddings + cosine similarity clustering
           └─► Text-Read OCR: Strict whole-word brand and club proof
```

### Result Delivery Contract (`fanmass.messmass.photo-analysis.v2`)
Fanmass delivers exact single-photo analysis results to Messmass via:
`POST /api/integrations/fanmass/events/{messmassEventId}/photos/{cameraPhotoId}`
Level 0 Contract: [`Architecture/schemas/fanmass/photo-analysis-v2.json`](file:///Users/Shared/Projects/planetbrain/Architecture/schemas/fanmass/photo-analysis-v2.json).

## 2. Messmass Derived Metrics (`ensureDerivedMetrics`)

When project or organization stats are evaluated, `lib/dataValidator.ts` guarantees derived metrics are computed consistently:

- **Total Fans**: `totalFans = male + female` (falls back to `eventAttendees` or `remoteFans + stadiumFans`).
- **Demographic Totals**:
  - `totalUnder40 = genAlpha + genYZ`
  - `totalOver40 = genX + boomer`
- **Total Images**: `totalImages = remoteImages + hostessImages + selfies`
- **Conversion Rates**:
  - `conversionRate = (uniqueUsers / eventAttendees) * 100`
  - `popupCtr = (ventCtaPopup / uniqueUsers) * 100`
  - `marketingOptinPct = (marketingOptin / uniqueUsers) * 100`
- **Earned Media Value (EMV)**: Computed dynamically via parameterized formulas:
  `([fanmassBrandAppearances] * [PARAM:impressionsPerAppearance] * [PARAM:cpmEur]) / 1000`
