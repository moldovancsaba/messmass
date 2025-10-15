# Analytics Platform Phase 2: Insights Engine — Implementation Plan

**Version**: 6.1.0  
**Created**: 2025-01-21T17:00:00.000Z (UTC)  
**Status**: Planning → Ready for Implementation  
**Estimated Effort**: 12-16 hours across 3-4 focused sessions

---

## 🎯 Objective

Transform MessMass from a reporting platform into an **intelligent analytics service** that automatically generates actionable insights, detects anomalies, predicts trends, and provides benchmarking.

---

## 📋 Phase 1 Status: ✅ COMPLETE

### Delivered:
- ✅ TypeScript types (`lib/analytics-aggregates.types.ts` - 335 lines)
- ✅ Aggregation service (`lib/analytics-aggregator.ts` - 754 lines)
- ✅ Aggregates API (`/api/analytics/aggregates/route.ts` - 168 lines)
- ✅ Partner Analytics API (`/api/analytics/aggregates/partners/route.ts` - 115 lines)
- ✅ Daily Aggregation Cron Job (`/api/cron/analytics-aggregation/route.ts` - 217 lines)
- ✅ MongoDB Indexes Documentation (`ANALYTICS_INDEXES.md` - 531 lines)

**Total Phase 1**: ~2,120 lines of production code

**Performance**: Aggregation system and APIs ready to achieve < 500ms query target

---

## 📦 Phase 2 Breakdown

Phase 2 consists of **6 major components** that build the Insights Engine:

### 1. **Insights Engine Service** (`lib/analytics-insights.ts`)
### 2. **Anomaly Detection Module** (`lib/analytics-anomaly.ts`)
### 3. **Trend Analysis Module** (`lib/analytics-trends.ts`)
### 4. **Benchmarking Module** (`lib/analytics-benchmarking.ts`)
### 5. **Predictive Models Module** (`lib/analytics-predictions.ts`)
### 6. **Insights API** (`/api/analytics/insights/route.ts` + sub-routes)

---

## 🔬 Component 1: Insights Engine Service

**File**: `lib/analytics-insights.ts`  
**Estimated Lines**: ~400  
**Estimated Time**: 2-3 hours

### Purpose
Rule-based engine that orchestrates all insight generation. Analyzes aggregated data and produces human-readable insights.

### Key Functions

#### `generateInsights(eventId: string): Promise<Insight[]>`
Generate all insights for a specific event.

**Algorithm**:
1. Fetch event data and aggregates
2. Run anomaly detection on key metrics
3. Run trend analysis on historical data
4. Run benchmarking comparisons
5. Format results as structured insights

**Output**:
```typescript
interface Insight {
  id: string;
  type: 'anomaly' | 'trend' | 'benchmark' | 'prediction' | 'recommendation';
  severity: 'info' | 'warning' | 'critical';
  metric: string;                    // e.g., 'attendance', 'engagement'
  title: string;                     // "Attendance 23% below average"
  description: string;               // Full explanation
  value: number;
  change: number;                    // Percentage change
  confidence: number;                // 0-100
  actionable: boolean;               // Can user act on this?
  recommendation?: string;           // Suggested action
  relatedEvents?: string[];          // Similar events
  createdAt: string;
}
```

#### `generatePartnerInsights(partnerId: string): Promise<Insight[]>`
Generate partner-level insights.

#### `scheduleInsightGeneration(): Promise<void>`
Background job to pre-generate insights for all recent events.

### Dependencies
- Aggregated data from Phase 1
- Anomaly detection module
- Trend analysis module
- Benchmarking module

### Testing
- Unit tests for insight generation logic
- Integration tests with real production data
- Edge case: events with missing data
- Edge case: partners with < 3 events

---

## 📊 Component 2: Anomaly Detection Module

**File**: `lib/analytics-anomaly.ts`  
**Estimated Lines**: ~350  
**Estimated Time**: 2-3 hours

### Purpose
Statistical algorithms to detect unusual patterns in metrics.

### Key Functions

#### `detectAnomalies(metric: string, data: TimeSeriesDataPoint[], options): Anomaly[]`
Detect outliers using multiple statistical methods.

**Algorithms**:

**1. Z-Score Method** (Standard Deviations)
```typescript
// Identify points > 2 standard deviations from mean
const mean = calculateMean(data);
const stdDev = calculateStdDev(data);
const zScore = (value - mean) / stdDev;
const isAnomaly = Math.abs(zScore) > 2;
```

**2. IQR Method** (Interquartile Range)
```typescript
// Identify points outside 1.5 * IQR
const q1 = percentile(data, 25);
const q3 = percentile(data, 75);
const iqr = q3 - q1;
const lowerBound = q1 - 1.5 * iqr;
const upperBound = q3 + 1.5 * iqr;
const isAnomaly = value < lowerBound || value > upperBound;
```

**3. Moving Average Method**
```typescript
// Compare to rolling 7-day average
const movingAvg = calculateMovingAverage(data, 7);
const deviation = Math.abs((value - movingAvg) / movingAvg);
const isAnomaly = deviation > 0.25; // 25% threshold
```

**Output**:
```typescript
interface Anomaly {
  date: string;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;              // Percentage
  severity: 'low' | 'medium' | 'high';
  method: 'z-score' | 'iqr' | 'moving-avg';
  confidence: number;             // 0-100
}
```

#### `detectSeasonalAnomalies(data, seasonality): Anomaly[]`
Detect anomalies accounting for seasonal patterns (e.g., weekends vs. weekdays).

### Use Cases
- "Attendance was 45% lower than expected"
- "Engagement spike detected - 3.2x normal"
- "Unusual merchandise sales pattern"

### Testing
- Synthetic data with known anomalies
- Real production data validation
- Performance: < 100ms for 365 data points

---

## 📈 Component 3: Trend Analysis Module

**File**: `lib/analytics-trends.ts`  
**Estimated Lines**: ~300  
**Estimated Time**: 2 hours

### Purpose
Detect and quantify trends in time-series data.

### Key Functions

#### `analyzeTrend(data: TimeSeriesDataPoint[]): TrendAnalysis`
Calculate trend direction and strength.

**Algorithm: Simple Linear Regression**
```typescript
// y = mx + b (line of best fit)
// m = slope (trend direction/strength)
// r² = coefficient of determination (how well line fits)

interface TrendAnalysis {
  direction: 'increasing' | 'decreasing' | 'stable';
  strength: 'weak' | 'moderate' | 'strong';
  slope: number;                  // Rate of change
  rSquared: number;               // Goodness of fit (0-1)
  changePercent: number;          // % change from start to end
  projection: {                   // Future projection
    value30days: number;
    value90days: number;
    confidence: number;
  };
}
```

**Implementation**:
```typescript
function linearRegression(data: TimeSeriesDataPoint[]): { slope: number; intercept: number; rSquared: number } {
  const n = data.length;
  const xMean = data.reduce((sum, _, i) => sum + i, 0) / n;
  const yMean = data.reduce((sum, d) => sum + d.value, 0) / n;
  
  let numerator = 0;
  let denominator = 0;
  
  for (let i = 0; i < n; i++) {
    const xDiff = i - xMean;
    const yDiff = data[i].value - yMean;
    numerator += xDiff * yDiff;
    denominator += xDiff * xDiff;
  }
  
  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;
  
  // Calculate R²
  const predictions = data.map((_, i) => slope * i + intercept);
  const ssRes = data.reduce((sum, d, i) => sum + Math.pow(d.value - predictions[i], 2), 0);
  const ssTot = data.reduce((sum, d) => sum + Math.pow(d.value - yMean, 2), 0);
  const rSquared = 1 - (ssRes / ssTot);
  
  return { slope, intercept, rSquared };
}
```

#### `detectTrendChange(data): TrendChangePoint[]`
Identify points where trend shifts direction.

### Use Cases
- "Attendance increasing 5% month-over-month"
- "Engagement declining - down 12% in last quarter"
- "Stable merchandise performance"

### Testing
- Known linear, exponential, and polynomial trends
- Noisy data with underlying trends
- Edge case: < 5 data points

---

## 🏆 Component 4: Benchmarking Module

**File**: `lib/analytics-benchmarking.ts`  
**Estimated Lines**: ~400  
**Estimated Time**: 3 hours

### Purpose
Compare events against historical averages, peers, and best performers.

### Key Functions

#### `calculatePercentiles(eventId: string, metric: string): PercentileRanking`
Calculate where event ranks among all events.

**Algorithm**:
```typescript
// For a given metric (e.g., attendance):
// 1. Get all events with that metric
// 2. Sort by metric value
// 3. Calculate percentile position
// percentile = (rank / total) * 100

interface PercentileRanking {
  metric: string;
  value: number;
  percentile: number;           // 0-100 (higher = better)
  rank: number;                 // 1-indexed rank
  total: number;                // Total events compared
  category: 'top_10' | 'top_25' | 'average' | 'below_average';
}
```

#### `findSimilarEvents(eventId: string, limit: number): SimilarEvent[]`
Find events with similar characteristics.

**Similarity Algorithm**:
```typescript
// Euclidean distance in normalized feature space
// Features: attendance, engagement, merchandise rate, date proximity
// Weight: 0.4 attendance, 0.3 engagement, 0.2 merch, 0.1 date

function calculateSimilarity(event1, event2): number {
  const features1 = normalizeFeatures(event1);
  const features2 = normalizeFeatures(event2);
  
  const distance = Math.sqrt(
    weights.reduce((sum, weight, i) => 
      sum + weight * Math.pow(features1[i] - features2[i], 2), 0
    )
  );
  
  return 1 - (distance / maxDistance); // 0-1 similarity score
}
```

#### `benchmarkAgainstPartner(eventId: string, partnerId: string): Benchmark`
Compare event to partner's historical average.

### Use Cases
- "This event ranked in top 10% for attendance"
- "Similar events had 15% higher engagement"
- "Above partner average by 8%"

### Testing
- Percentile calculation accuracy
- Similarity scoring validation
- Performance: < 200ms for full benchmark

---

## 🔮 Component 5: Predictive Models Module

**File**: `lib/analytics-predictions.ts`  
**Estimated Lines**: ~350  
**Estimated Time**: 2-3 hours

### Purpose
Predict future attendance and engagement based on historical patterns.

### Key Functions

#### `predictAttendance(eventDetails, historicalData): Prediction`
Predict attendance for an upcoming event.

**Algorithm: Multiple Linear Regression**
```typescript
// attendance = β₀ + β₁(dayOfWeek) + β₂(month) + β₃(opponent) + β₄(weather) + ε

interface Prediction {
  metric: string;
  predictedValue: number;
  confidenceInterval: {
    lower: number;               // 95% confidence lower bound
    upper: number;               // 95% confidence upper bound
  };
  confidence: number;            // 0-100
  factors: PredictionFactor[];  // Influential factors
  modelAccuracy: number;         // Historical R² or RMSE
}

interface PredictionFactor {
  name: string;
  impact: number;                // Percentage impact
  direction: 'positive' | 'negative';
}
```

**Factors Considered**:
1. **Day of Week**: Weekends typically have higher attendance
2. **Month/Season**: Seasonal patterns
3. **Partner Historical Average**: Club's typical draw
4. **Recent Trend**: Momentum factor
5. **Time Since Last Event**: Fatigue factor

**Implementation** (Simplified):
```typescript
function predictAttendance(features): Prediction {
  // Coefficients learned from historical data
  const coefficients = {
    intercept: 5000,
    dayOfWeek: [0, 100, 150, 200, 250, 800, 900], // Sun-Sat
    monthFactor: [0.9, 0.9, 1.0, 1.0, 1.1, 1.1, 0.8, 0.8, 1.0, 1.1, 1.0, 1.0],
    partnerAvgWeight: 0.6,
    trendWeight: 0.2
  };
  
  let predicted = coefficients.intercept;
  predicted += coefficients.dayOfWeek[features.dayOfWeek];
  predicted *= coefficients.monthFactor[features.month];
  predicted += coefficients.partnerAvgWeight * features.partnerAvg;
  predicted += coefficients.trendWeight * features.recentTrend;
  
  const stdError = calculateStdError(historicalPredictions);
  const confidenceInterval = {
    lower: predicted - 1.96 * stdError,
    upper: predicted + 1.96 * stdError
  };
  
  return { predictedValue: predicted, confidenceInterval, ... };
}
```

#### `predictEngagement(eventDetails, historicalData): Prediction`
Predict images/attendee engagement rate.

### Use Cases
- "Expected attendance: 8,200 ± 1,500 (95% confidence)"
- "Predicted 15% higher than average due to weekend timing"
- "Weather forecast may reduce attendance by 20%"

### Testing
- Train on 80% of data, test on 20%
- Measure accuracy with RMSE and MAE
- Target: Within 15% of actual for 70% of events

---

## 🚀 Component 6: Insights API

**Files**:
- `/api/analytics/insights/route.ts` - Main insights endpoint
- `/api/analytics/insights/[eventId]/route.ts` - Event-specific insights
- `/api/analytics/insights/partners/[partnerId]/route.ts` - Partner insights

**Estimated Lines**: ~300 total  
**Estimated Time**: 2 hours

### Endpoints

#### `GET /api/analytics/insights`
Get global insights (anomalies, trends across all events).

**Query Parameters**:
- `type`: Filter by insight type
- `severity`: Filter by severity
- `limit`: Number of insights
- `since`: Date filter

**Response**:
```typescript
{
  insights: Insight[];
  metadata: {
    totalInsights: number;
    anomalies: number;
    trends: number;
    benchmarks: number;
    generatedAt: string;
  };
}
```

#### `GET /api/analytics/insights/[eventId]`
Get all insights for a specific event.

#### `GET /api/analytics/insights/partners/[partnerId]`
Get partner-level insights.

#### `POST /api/analytics/insights/regenerate`
Manually trigger insight generation.

### Implementation Notes
- Cache insights for 24 hours
- Invalidate cache when aggregates update
- Rate limit: 60 requests/minute per admin

---

## 🧪 Testing Strategy

### Unit Tests
- [ ] Anomaly detection with synthetic data
- [ ] Trend analysis with known slopes
- [ ] Benchmarking percentile calculations
- [ ] Prediction model with mock data
- [ ] Insight generation with edge cases

### Integration Tests
- [ ] Full insight generation for real event
- [ ] API endpoint responses
- [ ] Caching behavior
- [ ] Error handling and fallbacks

### Performance Tests
- [ ] Insight generation < 2 seconds per event
- [ ] API response < 500ms
- [ ] Memory usage under load

### Validation Tests
- [ ] Compare predictions to actual outcomes
- [ ] Validate anomaly detection against known outliers
- [ ] Benchmark calculations against manual verification

---

## 📚 Documentation Requirements

### Technical Documentation
- [ ] ANALYTICS_INSIGHTS_GUIDE.md (architecture, algorithms)
- [ ] Update API_REFERENCE.md with insights endpoints
- [ ] Code comments explaining statistical methods

### User Documentation
- [ ] Update USER_GUIDE.md with insights interpretation
- [ ] Create insight types glossary
- [ ] Add troubleshooting section

---

## 🗓️ Implementation Schedule

### **Session 1** (3-4 hours): Anomaly Detection + Trend Analysis
- Build `lib/analytics-anomaly.ts`
- Build `lib/analytics-trends.ts`
- Unit tests for both modules
- **Deliverable**: Statistical analysis modules working

### **Session 2** (3-4 hours): Benchmarking + Predictions
- Build `lib/analytics-benchmarking.ts`
- Build `lib/analytics-predictions.ts`
- Unit tests for both modules
- **Deliverable**: Comparison and forecasting ready

### **Session 3** (3-4 hours): Insights Engine + API
- Build `lib/analytics-insights.ts` (orchestrator)
- Build API endpoints
- Integration tests
- **Deliverable**: Full insights API functional

### **Session 4** (2-3 hours): Testing, Documentation, Deployment
- End-to-end testing with production data
- Performance optimization
- Documentation updates
- Deploy and verify
- **Deliverable**: Phase 2 production-ready

**Total Estimated Time**: 12-16 hours across 4 focused sessions

---

## 🎯 Success Criteria

### Functional Requirements
- ✅ Generate 5-10 insights per event automatically
- ✅ Anomaly detection flags outliers with 90%+ accuracy
- ✅ Trend predictions within 15% margin
- ✅ Benchmarking provides percentile rankings
- ✅ Predictions include confidence intervals

### Performance Requirements
- ✅ Insight generation: < 2 seconds per event
- ✅ API response time: < 500ms
- ✅ Background job: All events processed in < 10 minutes

### Business Requirements
- ✅ Insights are actionable (suggest next steps)
- ✅ Plain-language explanations (non-technical users)
- ✅ Confidence scores for all predictions
- ✅ Prioritization (critical → info)

---

## 🔧 Environment Variables

Add to `.env.local`:

```bash
# Insights Engine Configuration
INSIGHTS_CACHE_DURATION=86400    # Cache insights for 24 hours
INSIGHTS_MIN_CONFIDENCE=70       # Only show insights with 70%+ confidence
PREDICTION_ACCURACY_TARGET=15    # Target 15% prediction accuracy

# Statistical Thresholds
ANOMALY_Z_SCORE_THRESHOLD=2.0    # Z-score threshold for anomalies
ANOMALY_IQR_MULTIPLIER=1.5       # IQR multiplier for outlier detection
TREND_MIN_DATA_POINTS=5          # Minimum data points for trend analysis
BENCHMARK_MIN_EVENTS=10          # Minimum events for benchmarking
```

---

## 📦 Dependencies

**No new npm packages required** - all algorithms implemented in pure TypeScript/JavaScript.

Optional enhancements (future):
- `simple-statistics` - Statistical functions library
- `ml-regression` - Machine learning regression models
- `mathjs` - Advanced mathematical operations

---

## 🚀 Quick Start (For Next Session)

When ready to implement Phase 2:

1. **Read this document** to refresh context
2. **Start with Session 1** (Anomaly + Trends)
3. **Run Phase 1 aggregation** to ensure data exists:
   ```bash
   curl -X POST http://localhost:3000/api/cron/analytics-aggregation
   ```
4. **Test with production data** as you build
5. **Commit frequently** with clear messages

---

*Analytics Platform Phase 2 — Implementation Plan*  
*Version: 6.1.0 | Created: 2025-01-21T17:00:00.000Z (UTC)*  
*Status: Ready for Implementation*
