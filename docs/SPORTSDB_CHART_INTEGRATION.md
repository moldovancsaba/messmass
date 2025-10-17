# TheSportsDB Chart System Integration

**Version**: 6.10.2  
**Last Updated**: 2025-01-16T16:45:00.000Z  
**Status**: Production-Ready

## Overview

The MessMass chart system now integrates with TheSportsDB enriched partner data to provide **capacity-based benchmarks**, **venue utilization metrics**, and **partner-specific analytics**.

This enhancement enables sports-specific insights impossible with base event data alone.

---

## Architecture

### Data Flow

```
Partner (MongoDB) 
  ↓ (contains sportsDb field)
TheSportsDB Enrichment
  ↓ (venueCapacity, leagueName, etc.)
Chart Utilities (chartPartnerUtils.ts)
  ↓ (calculate metrics, generate configs)
Chart Calculator (chartCalculator.ts)
  ↓ (evaluate formulas with context)
Chart Components
  ↓ (render visualizations)
User Interface
```

### Key Components

| Component | Purpose | Location |
|-----------|---------|----------|
| **chartPartnerUtils.ts** | Partner-aware chart generation | `/lib/chartPartnerUtils.ts` |
| **chartCalculator.ts** | Formula evaluation engine | `/lib/chartCalculator.ts` |
| **chartConfigTypes.ts** | Type definitions | `/lib/chartConfigTypes.ts` |
| **Partner API** | Data retrieval | `/app/api/partners/*` |
| **SportsDB API** | External enrichment | `/app/api/sports-db/*` |

---

## Core Features

### 1. **Capacity Utilization Metrics**

Calculate how much of a venue's capacity was filled by an event.

**Example Calculation**:
```typescript
import { calculateCapacityUtilization } from '@/lib/chartPartnerUtils';

const utilization = calculateCapacityUtilization(
  45000, // attendees
  60000  // venue capacity
);
// Returns: 75 (75% capacity filled)
```

**Use Cases**:
- Stadium fill rate tracking
- Event performance benchmarking
- Venue selection optimization

### 2. **Partner-Specific Charts**

Auto-generate charts tailored to partner's venue data.

**Available Chart Types**:

#### A. **Capacity Utilization KPI**
- **Type**: KPI (single value)
- **Metric**: `(attendees / capacity) × 100`
- **Visual**: Large percentage with color coding
- **Use**: Quick venue fill assessment

#### B. **Engagement vs Capacity Pie**
- **Type**: Pie chart (2 segments)
- **Segments**: 
  - Engaged Fans (total fans)
  - Untapped Capacity (capacity - fans)
- **Use**: Visualize growth potential

#### C. **Merchandise Potential Bar**
- **Type**: Horizontal bar (5 bars)
- **Bars**: Current sales + projections at 25%, 50%, 75%, 100% capacity
- **Use**: Revenue opportunity analysis

### 3. **Capacity Benchmarking**

Categorize performance relative to venue size.

```typescript
import { categorizeCapacityFill, getCapacityCategoryEmoji } from '@/lib/chartPartnerUtils';

const category = categorizeCapacityFill(58000, 60000);
// Returns: 'excellent'

const emoji = getCapacityCategoryEmoji(category);
// Returns: '🔥'
```

**Categories**:
- **Sold Out** (≥98%): 🎉
- **Excellent** (90-97%): 🔥
- **Good** (75-89%): ✅
- **Average** (50-74%): ⚠️
- **Poor** (<50%): 📉
- **Unknown**: ❓

---

## Usage Examples

### Generate Partner Charts

```typescript
import { generatePartnerCharts } from '@/lib/chartPartnerUtils';
import type { PartnerResponse } from '@/lib/partner.types';

// Fetch partner with SportsDB data
const partner: PartnerResponse = await fetch('/api/partners?partnerId=...').then(r => r.json());

// Generate all partner-specific charts
const charts = generatePartnerCharts(partner);

// Result: Array of ChartConfiguration objects
// - capacity-utilization-{partnerId}
// - engagement-capacity-{partnerId}
// - merch-potential-capacity-{partnerId}
```

### Create Individual Charts

```typescript
import { 
  createCapacityUtilizationChart,
  createEngagementVsCapacityChart,
  createMerchPotentialVsCapacityChart 
} from '@/lib/chartPartnerUtils';

// KPI Chart
const kpiChart = createCapacityUtilizationChart(
  partner._id,
  partner.name,
  partner.sportsDb?.venueCapacity
);

// Pie Chart
const pieChart = createEngagementVsCapacityChart(
  partner._id,
  partner.name,
  partner.sportsDb?.venueCapacity
);

// Bar Chart
const barChart = createMerchPotentialVsCapacityChart(
  partner._id,
  partner.name,
  partner.sportsDb?.venueCapacity
);
```

### Extract Partner Enrichment

```typescript
import { extractPartnerEnrichment } from '@/lib/chartPartnerUtils';

const enrichment = extractPartnerEnrichment(partner);

// enrichment: {
//   venueCapacity: 99354,
//   venueName: "Camp Nou",
//   leagueName: "La Liga",
//   country: "Spain",
//   badge: "https://...",
//   teamId: "133604"
// }
```

### Get Chart Recommendations

```typescript
import { getPartnerChartRecommendations } from '@/lib/chartPartnerUtils';

const recommendations = getPartnerChartRecommendations(partner);

// recommendations: [
//   {
//     chartId: 'capacity-utilization',
//     title: 'Venue Capacity Utilization',
//     reason: 'Partner has venue capacity data (99,354 seats)',
//     requiresData: ['eventAttendees'],
//     confidence: 'high'
//   },
//   ...
// ]
```

---

## Formula Integration

### Capacity Token

Partner-aware formulas can use the `[CAPACITY]` token:

```typescript
import { injectPartnerVariables } from '@/lib/chartPartnerUtils';

const formula = '([SEYUATTENDEES] / [CAPACITY]) * 100';
const enrichment = { venueCapacity: 60000, ... };

const enrichedFormula = injectPartnerVariables(formula, enrichment);
// Result: '([SEYUATTENDEES] / 60000) * 100'
```

### Available Tokens

| Token | Replaced With | Example |
|-------|---------------|---------|
| `[CAPACITY]` | Venue capacity | `60000` |
| `[SEYUATTENDEES]` | Event attendees | (from stats) |
| `[SEYUTOTALFANS]` | Total fans | (computed) |

### Chart Configuration Example

```json
{
  "chartId": "capacity-utilization-xyz",
  "title": "FC Barcelona Venue Utilization",
  "type": "kpi",
  "order": 100,
  "isActive": true,
  "emoji": "🏟️",
  "subtitle": "Capacity: 99,354 seats",
  "elements": [
    {
      "id": "capacity-utilization",
      "label": "Capacity Filled",
      "formula": "([SEYUATTENDEES] / 99354) * 100",
      "color": "#10b981",
      "description": "Percentage of venue capacity filled"
    }
  ]
}
```

---

## Integration Workflow

### Step 1: Enrich Partner with SportsDB

```bash
# Run bulk enrichment script
node scripts/enrich-partners-sportsdb.js --dry-run

# Verify matches, then run live
node scripts/enrich-partners-sportsdb.js
```

**Result**: Partners now have `sportsDb` field with capacity data.

### Step 2: Generate Partner Charts

```typescript
// In your admin or event pages
import { generatePartnerCharts } from '@/lib/chartPartnerUtils';

const partnerCharts = generatePartnerCharts(partner);
```

### Step 3: Calculate Chart Values

```typescript
import { calculateChart } from '@/lib/chartCalculator';

const results = partnerCharts.map(config => 
  calculateChart(config, projectStats)
);
```

### Step 4: Render Charts

```tsx
import { KPICard, PieChart, VerticalBarChart } from '@/components/charts';

{results.map(result => {
  if (result.type === 'kpi') {
    return <KPICard key={result.chartId} data={result} />;
  }
  if (result.type === 'pie') {
    return <PieChart key={result.chartId} data={result} />;
  }
  if (result.type === 'bar') {
    return <VerticalBarChart key={result.chartId} data={result} />;
  }
})}
```

---

## Real-World Examples

### Example 1: FC Barcelona Event

**Partner Data**:
```json
{
  "name": "FC Barcelona",
  "sportsDb": {
    "venueCapacity": 99354,
    "venueName": "Camp Nou",
    "leagueName": "La Liga"
  }
}
```

**Event Stats**:
```json
{
  "eventAttendees": 85000,
  "totalFans": 12500,
  "merched": 3200
}
```

**Generated Charts**:

1. **Capacity Utilization KPI**: `85.6%` 🔥 (Excellent)
2. **Engagement vs Capacity Pie**:
   - Engaged Fans: 12,500 (12.6%)
   - Untapped: 86,854 (87.4%)
3. **Merch Potential Bar**:
   - Current: €80,000
   - At 25% fill: €93,288
   - At 50% fill: €186,576
   - At 75% fill: €279,864
   - At 100% fill: €373,152

### Example 2: Small Venue Event

**Partner Data**:
```json
{
  "name": "Local Stadium",
  "sportsDb": {
    "venueCapacity": 15000
  }
}
```

**Event Stats**:
```json
{
  "eventAttendees": 14700
}
```

**Capacity Utilization**: `98%` 🎉 (Sold Out)

---

## Performance Considerations

### Caching Strategy

Partner charts should be cached when:
- Partner data doesn't change frequently
- Capacity data is static

```typescript
// Cache partner enrichment
const enrichmentCache = new Map<string, PartnerEnrichment>();

function getCachedEnrichment(partnerId: string, partner: PartnerResponse) {
  if (!enrichmentCache.has(partnerId)) {
    enrichmentCache.set(partnerId, extractPartnerEnrichment(partner));
  }
  return enrichmentCache.get(partnerId);
}
```

### Chart Generation

- **Generate once**: Create partner charts when partner is enriched
- **Store in MongoDB**: Save generated charts to `chart_configurations` collection
- **Reuse**: Load from database for each event

### Calculation Performance

- Charts evaluate formulas on-demand
- Batch calculations for multiple charts
- Use `calculateActiveCharts()` to skip inactive charts

---

## Best Practices

### 1. **Validate Capacity Data**

Always check if capacity data exists before using:

```typescript
const enrichment = extractPartnerEnrichment(partner);
if (!enrichment?.venueCapacity) {
  console.warn('No capacity data for partner', partner.name);
  return; // Skip capacity-based charts
}
```

### 2. **Handle Missing Stats**

Capacity charts require `eventAttendees`:

```typescript
if (!projectStats.eventAttendees || projectStats.eventAttendees <= 0) {
  console.warn('Missing eventAttendees for capacity calculation');
  // Show N/A or hide chart
}
```

### 3. **Use Appropriate Chart Types**

- **KPI**: Single percentage (capacity utilization)
- **Pie**: Two-part comparison (engaged vs untapped)
- **Bar**: Multiple scenarios (capacity fill rates)

### 4. **Provide Context**

Always include subtitle with capacity:

```typescript
subtitle: `Capacity: ${venueCapacity.toLocaleString()} seats`
```

### 5. **Color Code Performance**

Use color to indicate performance category:

```typescript
const category = categorizeCapacityFill(attendees, capacity);
const color = category === 'excellent' ? '#10b981' : 
              category === 'good' ? '#3b82f6' : 
              '#f59e0b';
```

---

## Limitations & Future Enhancements

### Current Limitations

1. **TheSportsDB Coverage**: Not all teams/venues have capacity data
2. **Static Capacity**: Doesn't account for renovations or temporary changes
3. **No Historical Trends**: Charts show single-event snapshots

### Planned Enhancements

1. **League Benchmarking**
   - Compare event performance against league averages
   - Require aggregated data from multiple partners

2. **Historical Capacity Trends**
   - Track utilization over time
   - Identify patterns (day of week, season, opponent)

3. **Multi-Venue Events**
   - Support events spanning multiple venues
   - Aggregate capacity calculations

4. **Dynamic Capacity**
   - Support reduced capacity events (COVID, renovations)
   - Allow manual capacity overrides per event

5. **Competitive Analysis**
   - Compare venue performance across partners
   - League-wide capacity rankings

---

## Troubleshooting

### Chart Not Displaying

**Problem**: Partner chart doesn't appear

**Solutions**:
1. Check `isActive` flag in chart configuration
2. Verify partner has `sportsDb.venueCapacity` field
3. Ensure `eventAttendees` > 0 in project stats
4. Check chart is included in active charts filter

### Incorrect Capacity Values

**Problem**: Utilization >100% or negative

**Solutions**:
1. Verify `eventAttendees` is accurate
2. Check capacity data synced recently
3. Use `calculateCapacityUtilization()` which caps at 100%
4. Validate SportsDB data quality

### Formula Errors

**Problem**: "NA" displayed in chart

**Solutions**:
1. Check formula syntax (balanced parentheses, valid tokens)
2. Verify all required stats exist in project
3. Use `injectPartnerVariables()` to replace tokens
4. Test formula with `evaluateFormula()` directly

---

## API Reference

See `lib/chartPartnerUtils.ts` for complete API documentation.

### Key Functions

```typescript
// Extract partner enrichment data
extractPartnerEnrichment(partner?: PartnerResponse): PartnerEnrichment | undefined

// Calculate capacity utilization percentage
calculateCapacityUtilization(attendees: number, capacity?: number): number | undefined

// Generate all partner charts
generatePartnerCharts(partner: PartnerResponse): ChartConfiguration[]

// Create individual chart types
createCapacityUtilizationChart(partnerId, partnerName, capacity): ChartConfiguration
createEngagementVsCapacityChart(partnerId, partnerName, capacity): ChartConfiguration
createMerchPotentialVsCapacityChart(partnerId, partnerName, capacity): ChartConfiguration

// Categorize performance
categorizeCapacityFill(attendees?: number, capacity?: number): CapacityCategory
getCapacityCategoryEmoji(category: CapacityCategory): string

// Get recommendations
getPartnerChartRecommendations(partner: PartnerResponse): ChartRecommendation[]
```

---

## Support & Feedback

For questions or feature requests related to SportsDB chart integration:

1. Review this documentation
2. Check `WARP.md` for project structure
3. Examine `lib/chartPartnerUtils.ts` source code
4. Test with enrichment script: `scripts/enrich-partners-sportsdb.js --dry-run`

---

**Version**: 6.10.2  
**Status**: Production-Ready — Enterprise Event Analytics Platform
