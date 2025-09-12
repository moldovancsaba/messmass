// lib/chartConfigTypes.ts - Chart configuration types and schemas
// This module defines all TypeScript interfaces and validation schemas for the Chart Algorithm Manager

/**
 * Chart configuration element for PieChart (always 2 elements), HorizontalBar (always 5 elements), or KPI (1 element)
 * Each element represents a segment/bar with its label, formula, and color
 * For KPI charts, only one element is used with the main calculation formula
 */
export interface ChartElement {
  id: string; // Unique identifier for this element
  label: string; // Display label (e.g., "Female", "CPM", "Jersey")
  formula: string; // Mathematical formula using variables (e.g., "[FEMALE]", "[INDOOR] + [OUTDOOR]")
  color: string; // Hex color code (e.g., "#ff6b9d")
  description?: string; // Optional description for documentation
}

/**
 * Complete chart configuration document structure for MongoDB
 * Supports PieChart (2 elements), HorizontalBar (5 elements), and KPI (1 element) types
 */
export interface ChartConfiguration {
  _id?: string; // MongoDB ObjectId (optional for new documents)
  chartId: string; // Unique identifier for the chart (e.g., "gender-distribution", "merchandise-sales")
  title: string; // Display title (e.g., "Gender Distribution", "Merchandise Sales")
  type: 'pie' | 'bar' | 'kpi'; // Chart type: pie (2 elements), bar (5 elements), kpi (1 element)
  order: number; // Display order in admin grid (1, 2, 3, etc.)
  isActive: boolean; // Whether this chart is currently enabled/visible
  elements: ChartElement[]; // Array of chart elements (2 for pie, 5 for bar, 1 for kpi)
  
  // Metadata fields with ISO 8601 millisecond precision
  createdAt: string; // ISO 8601: "2025-08-18T10:18:40.123Z"
  updatedAt: string; // ISO 8601: "2025-08-18T10:18:40.123Z"
  createdBy?: string; // Admin user ID who created this configuration
  lastModifiedBy?: string; // Admin user ID who last modified this configuration
  
  // Optional configuration properties
  emoji?: string; // Chart center emoji for pie charts (e.g., "👥", "📍", "🌐")
  subtitle?: string; // Optional subtitle/description
  showTotal?: boolean; // Whether to show total value above bars
  totalLabel?: string; // Custom label for total (e.g., "possible merch sales", "Advertisement Value")
}

/**
 * Available variables that can be used in formulas
 * Each variable corresponds to a field in the ProjectStats interface
 */
export interface AvailableVariable {
  name: string; // Variable name (e.g., "INDOOR", "FEMALE")
  displayName: string; // Human-readable name (e.g., "Indoor Fans", "Female Attendees")
  category: string; // Category for organization (e.g., "Demographics", "Location", "Images")
  description: string; // Detailed description
  exampleUsage: string; // Example formula using this variable
}

/**
 * All 42 available variables from ProjectStats interface
 * Used for formula validation and variable picker UI
 */
export const AVAILABLE_VARIABLES: AvailableVariable[] = [
  // Image Statistics
  { name: 'REMOTE_IMAGES', displayName: 'Remote Images', category: 'Images', description: 'Number of images taken remotely', exampleUsage: '[REMOTE_IMAGES] * 2' },
  { name: 'HOSTESS_IMAGES', displayName: 'Hostess Images', category: 'Images', description: 'Number of images taken by hostess', exampleUsage: '[HOSTESS_IMAGES] + [SELFIES]' },
  { name: 'SELFIES', displayName: 'Selfies', category: 'Images', description: 'Number of selfie images', exampleUsage: '[SELFIES] / 2' },
  { name: 'APPROVED_IMAGES', displayName: 'Approved Images', category: 'Images', description: 'Number of approved images', exampleUsage: '[APPROVED_IMAGES] - [REJECTED_IMAGES]' },
  { name: 'REJECTED_IMAGES', displayName: 'Rejected Images', category: 'Images', description: 'Number of rejected images', exampleUsage: '[REJECTED_IMAGES] * 0.5' },
  
  // Location Statistics
  { name: 'INDOOR', displayName: 'Indoor Fans', category: 'Location', description: 'Number of indoor fans', exampleUsage: '[INDOOR] + [OUTDOOR]' },
  { name: 'OUTDOOR', displayName: 'Outdoor Fans', category: 'Location', description: 'Number of outdoor fans', exampleUsage: '[OUTDOOR] * 1.2' },
  { name: 'STADIUM', displayName: 'Stadium Fans', category: 'Location', description: 'Number of stadium fans', exampleUsage: '[STADIUM] / ([REMOTE_FANS] + [STADIUM])' },
  { name: 'REMOTE_FANS', displayName: 'Remote Fans', category: 'Location', description: 'Indoor + Outdoor (aggregated)', exampleUsage: '[REMOTE_FANS] + [STADIUM]' },
  { name: 'TOTAL_FANS', displayName: 'Total Fans', category: 'Location', description: 'Remote Fans (indoor + outdoor) + Stadium', exampleUsage: '[TOTAL_FANS] - [MERCHED]' },
  
  // Demographics
  { name: 'FEMALE', displayName: 'Female Attendees', category: 'Demographics', description: 'Number of female attendees', exampleUsage: '[FEMALE] / ([FEMALE] + [MALE])' },
  { name: 'MALE', displayName: 'Male Attendees', category: 'Demographics', description: 'Number of male attendees', exampleUsage: '[MALE] * 100' },
  { name: 'GEN_ALPHA', displayName: 'Gen Alpha', category: 'Demographics', description: 'Number of Generation Alpha attendees', exampleUsage: '[GEN_ALPHA] + [GEN_YZ]' },
  { name: 'GEN_YZ', displayName: 'Gen Y+Z', category: 'Demographics', description: 'Number of Generation Y+Z attendees', exampleUsage: '[GEN_YZ] * 1.5' },
  { name: 'GEN_X', displayName: 'Gen X', category: 'Demographics', description: 'Number of Generation X attendees', exampleUsage: '[GEN_X] + [BOOMER]' },
  { name: 'BOOMER', displayName: 'Boomer', category: 'Demographics', description: 'Number of Boomer attendees', exampleUsage: '[BOOMER] / 2' },
  
  // Merchandise
  { name: 'MERCHED', displayName: 'Merched Fans', category: 'Merchandise', description: 'Number of fans with merchandise', exampleUsage: '[MERCHED] / ([INDOOR] + [OUTDOOR] + [STADIUM])' },
  { name: 'JERSEY', displayName: 'Jersey Sales', category: 'Merchandise', description: 'Number of jersey merchandise items', exampleUsage: '[JERSEY] * 25' },
  { name: 'SCARF', displayName: 'Scarf Sales', category: 'Merchandise', description: 'Number of scarf merchandise items', exampleUsage: '[SCARF] + [FLAGS]' },
  { name: 'FLAGS', displayName: 'Flag Sales', category: 'Merchandise', description: 'Number of flag merchandise items', exampleUsage: '[FLAGS] * 15' },
  { name: 'BASEBALL_CAP', displayName: 'Baseball Cap Sales', category: 'Merchandise', description: 'Number of baseball cap merchandise items', exampleUsage: '[BASEBALL_CAP] * 20' },
  { name: 'OTHER', displayName: 'Other Merchandise', category: 'Merchandise', description: 'Number of other merchandise items', exampleUsage: '[OTHER] * 10' },
  
  // Visits & Engagement
  { name: 'VISIT_QR_CODE', displayName: 'QR Code Visits', category: 'Engagement', description: 'Number of QR code visits', exampleUsage: '[VISIT_QR_CODE] + [VISIT_SHORT_URL]' },
  { name: 'VISIT_SHORT_URL', displayName: 'Short URL Visits', category: 'Engagement', description: 'Number of short URL visits', exampleUsage: '[VISIT_SHORT_URL] * 2' },
  { name: 'VISIT_WEB', displayName: 'Web Visits', category: 'Engagement', description: 'Number of web visits', exampleUsage: '[VISIT_WEB] + [VISIT_QR_CODE]' },
  { name: 'VISIT_FACEBOOK', displayName: 'Facebook Visits', category: 'Social Media', description: 'Number of Facebook visits', exampleUsage: '[VISIT_FACEBOOK] * 1.5' },
  { name: 'VISIT_INSTAGRAM', displayName: 'Instagram Visits', category: 'Social Media', description: 'Number of Instagram visits', exampleUsage: '[VISIT_INSTAGRAM] + [VISIT_TIKTOK]' },
  { name: 'VISIT_YOUTUBE', displayName: 'YouTube Visits', category: 'Social Media', description: 'Number of YouTube visits', exampleUsage: '[VISIT_YOUTUBE] / 2' },
  { name: 'VISIT_TIKTOK', displayName: 'TikTok Visits', category: 'Social Media', description: 'Number of TikTok visits', exampleUsage: '[VISIT_TIKTOK] * 3' },
  { name: 'VISIT_X', displayName: 'X (Twitter) Visits', category: 'Social Media', description: 'Number of X (Twitter) visits', exampleUsage: '[VISIT_X] + [VISIT_FACEBOOK]' },
  { name: 'VISIT_TRUSTPILOT', displayName: 'Trustpilot Visits', category: 'Engagement', description: 'Number of Trustpilot visits', exampleUsage: '[VISIT_TRUSTPILOT] * 10' },
  { name: 'SOCIAL_VISIT', displayName: 'Social Visit (Total)', category: 'Engagement', description: 'Sum of visits across all social platforms', exampleUsage: '[SOCIAL_VISIT] / [EVENT_ATTENDEES] * 100' },
  
  // Event Metrics
  { name: 'EVENT_ATTENDEES', displayName: 'Event Attendees', category: 'Event', description: 'Total number of event attendees', exampleUsage: '[EVENT_ATTENDEES] * 0.1' },
  { name: 'EVENT_RESULT_HOME', displayName: 'Home Team Result', category: 'Event', description: 'Home team result/score', exampleUsage: '[EVENT_RESULT_HOME] - [EVENT_RESULT_VISITOR]' },
  { name: 'EVENT_RESULT_VISITOR', displayName: 'Visitor Team Result', category: 'Event', description: 'Visitor team result/score', exampleUsage: '[EVENT_RESULT_VISITOR] + [EVENT_RESULT_HOME]' },
  { name: 'EVENT_VALUE_PROPOSITION_VISITED', displayName: 'Value Proposition Visited', category: 'Event', description: 'Number of value proposition page visits', exampleUsage: '[EVENT_VALUE_PROPOSITION_VISITED] * 15' },
  { name: 'EVENT_VALUE_PROPOSITION_PURCHASES', displayName: 'Value Proposition Purchases', category: 'Event', description: 'Number of value proposition purchases', exampleUsage: '[EVENT_VALUE_PROPOSITION_PURCHASES] / [EVENT_VALUE_PROPOSITION_VISITED]' },
  
  // Merchandise Pricing Variables for Sales Calculations
  { name: 'JERSEY_PRICE', displayName: 'Jersey Unit Price', category: 'Merchandise Pricing', description: 'Price per jersey in EUR', exampleUsage: '[JERSEY] * [JERSEY_PRICE]' },
  { name: 'SCARF_PRICE', displayName: 'Scarf Unit Price', category: 'Merchandise Pricing', description: 'Price per scarf in EUR', exampleUsage: '[SCARF] * [SCARF_PRICE]' },
  { name: 'FLAGS_PRICE', displayName: 'Flag Unit Price', category: 'Merchandise Pricing', description: 'Price per flag in EUR', exampleUsage: '[FLAGS] * [FLAGS_PRICE]' },
  { name: 'CAP_PRICE', displayName: 'Baseball Cap Unit Price', category: 'Merchandise Pricing', description: 'Price per baseball cap in EUR', exampleUsage: '[BASEBALL_CAP] * [CAP_PRICE]' },
  { name: 'OTHER_PRICE', displayName: 'Other Merchandise Unit Price', category: 'Merchandise Pricing', description: 'Average price for other merchandise items in EUR', exampleUsage: '[OTHER] * [OTHER_PRICE]' }
];

/**
 * Formula validation result
 * Used to check if a formula is syntactically correct and uses valid variables
 */
export interface FormulaValidationResult {
  isValid: boolean;
  error?: string;
  usedVariables: string[]; // List of variables used in the formula
  evaluatedResult?: number | 'NA'; // Test evaluation result
}

/**
 * Chart calculation result
 * Returned when applying formulas to actual project statistics
 */
export interface ChartCalculationResult {
  chartId: string;
  title: string;
  type: 'pie' | 'bar' | 'kpi';
  emoji?: string; // Chart emoji from configuration
  subtitle?: string; // Chart subtitle from configuration
  totalLabel?: string; // Custom total label from configuration
  elements: {
    id: string;
    label: string;
    value: number | 'NA';
    color: string;
  }[];
  total?: number | 'NA'; // Total value for bar charts
  kpiValue?: number | 'NA'; // Single value for KPI charts
  hasErrors: boolean; // Whether any element had calculation errors
}

/**
 * Default chart configurations that match existing charts
 * Used for migrating current hardcoded charts to the new system
 */
export const DEFAULT_CHART_CONFIGURATIONS: Omit<ChartConfiguration, '_id' | 'createdAt' | 'updatedAt'>[] = [
  // 1. Gender Distribution Pie Chart
  {
    chartId: 'gender-distribution',
    title: 'Gender Distribution',
    type: 'pie',
    order: 1,
    isActive: true,
    emoji: '👥',
    elements: [
      { id: 'female', label: 'Female', formula: '[FEMALE]', color: '#ff6b9d', description: 'Female attendees' },
      { id: 'male', label: 'Male', formula: '[MALE]', color: '#4a90e2', description: 'Male attendees' }
    ]
  },
  
  // 2. Fans Location Pie Chart
  {
    chartId: 'fans-location',
    title: 'Fans Location',
    type: 'pie',
    order: 2,
    isActive: true,
    emoji: '📍',
    elements: [
      { id: 'remote', label: 'Remote', formula: '[REMOTE_FANS]', color: '#3b82f6', description: 'Remote fans (indoor + outdoor)' },
      { id: 'event', label: 'Event', formula: '[STADIUM]', color: '#f59e0b', description: 'Stadium fans' }
    ]
  },
  
  // 3. Age Groups Pie Chart  
  {
    chartId: 'age-groups',
    title: 'Age Groups',
    type: 'pie',
    order: 3,
    isActive: true,
    emoji: '👥',
    elements: [
      { id: 'under-40', label: 'Under 40', formula: '[GEN_ALPHA] + [GEN_YZ]', color: '#06b6d4', description: 'Gen Alpha + Gen Y/Z' },
      { id: 'over-40', label: 'Over 40', formula: '[GEN_X] + [BOOMER]', color: '#f97316', description: 'Gen X + Boomer' }
    ]
  },
  
  // 4. Visitor Sources Pie Chart
  {
    chartId: 'visitor-sources',
    title: 'Visitor Sources',
    type: 'pie',
    order: 4,
    isActive: true,
    emoji: '🌐',
    elements: [
      { id: 'qr-short', label: 'QR + Short URL', formula: '[VISIT_QR_CODE] + [VISIT_SHORT_URL]', color: '#3b82f6', description: 'QR code and short URL visits' },
      { id: 'other', label: 'Other', formula: '[VISIT_WEB]', color: '#f59e0b', description: 'Other web visits' }
    ]
  },
  
  // 5. Merchandise Sales Horizontal Bar Chart
  {
    chartId: 'merchandise-sales',
    title: 'Merchandise Sales',
    type: 'bar',
    order: 5,
    isActive: true,
    showTotal: true,
    totalLabel: 'possible merch sales',
    emoji: '🛍️',
    elements: [
      { id: 'jersey-sales', label: 'Jersey', formula: '[JERSEY] * [JERSEY_PRICE]', color: '#7b68ee', description: 'Jersey sales in EUR' },
      { id: 'scarf-sales', label: 'Scarf', formula: '[SCARF] * [SCARF_PRICE]', color: '#ff6b9d', description: 'Scarf sales in EUR' },
      { id: 'flags-sales', label: 'Flags', formula: '[FLAGS] * [FLAGS_PRICE]', color: '#ffa726', description: 'Flag sales in EUR' },
      { id: 'cap-sales', label: 'Baseball Cap', formula: '[BASEBALL_CAP] * [CAP_PRICE]', color: '#66bb6a', description: 'Baseball cap sales in EUR' },
      { id: 'other-sales', label: 'Other', formula: '[OTHER] * [OTHER_PRICE]', color: '#ef5350', description: 'Other merchandise sales in EUR' }
    ]
  },
  
  // 6. Generated Value Horizontal Bar Chart
  {
    chartId: 'value',
    title: 'Generated Value',
    type: 'bar',
    order: 6,
    isActive: true,
    showTotal: true,
    totalLabel: 'Total Generated Value',
    emoji: '📊',
    subtitle: 'Breakdown of Event-Generated Brand Value',
    elements: [
      { 
        id: 'marketing-optin', 
        label: 'Marketing Opt-in Users', 
        formula: '([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES]) * 4.87', 
        color: '#3b82f6', 
        description: 'Every image corresponds to a GDPR-compliant opt-in fan. Each contact has measurable acquisition cost in digital marketing (€4.87 avg market cost per email opt-in in Europe, 2025)' 
      },
      { 
        id: 'value-prop-emails', 
        label: 'Value Proposition Emails', 
        formula: '([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES]) * 1.07', 
        color: '#10b981', 
        description: 'Every email delivered includes branded fan photo plus sponsor offer. Add-on ad space valued at €1.07 avg CPM email value add per send' 
      },
      { 
        id: 'giant-screen-ads', 
        label: 'Ads on Giant Screen', 
        formula: '([EVENT_ATTENDEES] / 1000) * 6 * 0.2 * ([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES])', 
        color: '#f59e0b', 
        description: 'Fans + brands shown on stadium big screen = in-stadium advertising equivalent. Stadium advertising CPM ≈ €6.00 per 1,000 attendees per 30s slot. 6s exposure = 0.2 of CPM' 
      },
      { 
        id: 'under40-engagement', 
        label: 'Under-40 Engagement', 
        formula: '([GEN_ALPHA] + [GEN_YZ]) * 2.14', 
        color: '#8b5cf6', 
        description: '80% of engaged fans are under 40 - critical target for most brands. Each identified contact carries premium value (€2.14 avg value of youth contact vs older groups)' 
      },
      { 
        id: 'brand-awareness', 
        label: 'Brand Awareness Boost', 
        formula: '200 * 300 * 0.0145', 
        color: '#ef4444', 
        description: 'Organic shares amplify brand presence into social feeds. 200 shared images × 300 avg views = 60,000 impressions. Benchmarked to €14.50 CPM for social organic impressions (2025)' 
      }
    ]
  },
  
  // 7. Engagement Horizontal Bar Chart  
  {
    chartId: 'engagement',
    title: 'Engagement',
    type: 'bar',
    order: 7,
    isActive: true,
    showTotal: true,
    totalLabel: 'Core Fan Team',
    elements: [
      { id: 'engaged', label: 'Engaged', formula: '([REMOTE_FANS] + [STADIUM]) / [EVENT_ATTENDEES] * 100', color: '#8b5cf6', description: 'Fan Engagement %' },
      { id: 'interactive', label: 'Interactive', formula: '([SOCIAL_VISIT] + [EVENT_VALUE_PROPOSITION_VISITED] + [EVENT_VALUE_PROPOSITION_PURCHASES]) / ([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES]) * 100', color: '#f59e0b', description: 'Fan Interaction %' },
      { id: 'front-runners', label: 'Front-runners', formula: '[MERCHED] / ([REMOTE_FANS] + [STADIUM]) * 100', color: '#10b981', description: 'Merched fans %' },
      { id: 'fanaticals', label: 'Fanaticals', formula: '([FLAGS] + [SCARF]) / [MERCHED] * 100', color: '#ef4444', description: 'Flags & scarfs of merched %' },
      { id: 'casuals', label: 'Casuals', formula: '(([REMOTE_FANS] + [STADIUM]) - [MERCHED]) / ([REMOTE_FANS] + [STADIUM]) * 100', color: '#06b6d4', description: 'Non-merched fans %' }
    ]
  },
  
  // 8. Faces per Image KPI Chart
  {
    chartId: 'faces-per-image',
    title: 'Faces per Image',
    type: 'kpi',
    order: 8,
    isActive: true,
    emoji: '👀',
    elements: [
      { 
        id: 'faces-per-image-value', 
        label: 'Average faces per approved image', 
        formula: '([FEMALE] + [MALE]) / [APPROVED_IMAGES]', 
        color: '#10b981', 
        description: 'Calculation from your totals: total faces by gender divided by images to show authentic reach per asset. Target audience: Brand owner, media planners, sponsorship sales. Quantify how many branded faces appear per image on average. Capture the multiplier effect for on-screen brand exposure.' 
      }
    ]
  },
  
  // 9. Image Density KPI Chart
  {
    chartId: 'image-density',
    title: 'Image Density',
    type: 'kpi',
    order: 9,
    isActive: true,
    emoji: '🧮',
    elements: [
      { 
        id: 'image-density-value', 
        label: 'Images per 100 fans', 
        formula: '([REMOTE_IMAGES] + [HOSTESS_IMAGES] + [SELFIES]) / ([FEMALE] + [MALE]) * 100', 
        color: '#3b82f6', 
        description: 'Show how actively fans created content. Help venues and rights holders benchmark activation performance. Derived from your counts - a simple, comparable index across events. Target audience: Event ops, sponsorship sales, client success.' 
      }
    ]
  }
];
