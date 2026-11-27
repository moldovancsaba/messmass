# KYC Variables Catalog & Formula Calculation Architecture
Status: Active
Last Updated: 2026-11-20T16:00:00.000Z
Canonical: Yes
Owner: Architecture / Calculations
Version: 12.7.0

## 1. Ground Truth & Invariants

This architecture governs the end-to-end data pipeline from KYC and AI metric ingestion through formula evaluation to report rendering, in strict adherence to:
- **`INV-001` (Multi-Tenant Isolation)**: Metrics and variables are strictly partitioned by `organizationId`, `partnerId`, and `eventId`.
- **`INV-004` (Zero-Trace KYC & Biometrics Separation)**: Raw biometric embeddings, facial crops, and PII are never persisted in attendee analytics collections (`v3_metric_values` or `projects.stats`).
- Level 0 Schemas: [`Architecture/schemas/messmass/kyc-variables.json`](file:///Users/Shared/Projects/planetbrain/Architecture/schemas/messmass/kyc-variables.json)

## 2. KYC Variable Catalog vs. Static Content Slots

To prevent database catalog pollution while maintaining clean variable autocomplete:

### Dynamic Analytics Variables (`variables_metadata` collection)
Statically registered statistical metrics populated via Clicker inputs, ticketing data, or Fanmass AI deliveries:
- Fan Attendance: `female`, `male`, `totalFans`, `eventAttendees`
- Demographics: `genAlpha`, `genYZ`, `genX`, `boomer`
- Merchandise: `merched`, `jersey`, `scarf`, `flags`, `baseballCap`, `other`
- Digital CTA / Pop-up: `ventCtaPopup`, `uniqueUsers`, `marketingOptin`
- Location / Stadium: `indoor`, `outdoor`, `stadiumFans`, `remoteFans`

### Static Layout Slots (`lib/contentSlots.ts`)
Static code-level slots defined without polluting MongoDB collections:
- Text slots: `reportText1` through `reportText100` (mapped to `[TEXT_1]`..`[TEXT_20]` legacy tokens).
- Image slots: `reportImage1` through `reportImage100` (mapped to `[IMAGE_1]`..`[IMAGE_20]` legacy tokens).

## 3. Two-Stage Formula Evaluation

```
                      Raw Formula / Slot Input
                                 │
                 ┌───────────────▼───────────────┐
                 │ Stage 1: Content Slot Router  │
                 └───────────────┬───────────────┘
                                 │
           ┌─────────────────────┴─────────────────────┐
           ▼                                           ▼
[Content Slot / Markdown / String]         [Numeric Mathematical Formula]
Resolved via lib/contentSlots.ts           Evaluated via lib/formulaEngine.ts AST
No AST crash on strings or quotes          Strict arithmetic (+, -, *, /)
```

## 4. Single Canonical Engine: `ReportCalculator`

`lib/report-calculator.ts` is the single source of truth for both:
1. **Live Report Generation**: Used by `/report/[slug]`, `/partner-report/`, `/organization-report/`, and exports.
2. **Admin Previews**: Unified via `ReportCalculator.calculateSingleChart(chart, stats)`.
