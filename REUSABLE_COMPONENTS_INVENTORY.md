# MessMass Reusable Components & Styling System Inventory

**Version**: 9.1.0  
**Last Updated**: 2025-11-01T15:42:00.000Z (UTC)  
**Purpose**: Complete catalog of all reusable components, modules, styling systems, and utilities

---

## 🎨 Design System Foundation

### Core Design Tokens (`app/styles/theme.css`)
**What**: Centralized design token system with 200+ variables  
**Usage**: `var(--mm-[category]-[variant])`

#### Color System
- **Primary Palette**: `--mm-color-primary-50` through `--mm-color-primary-900` (Blue - TailAdmin inspired)
- **Secondary Palette**: `--mm-color-secondary-50` through `--mm-color-secondary-900` (Green - Success/Growth)
- **Grayscale**: `--mm-gray-50` through `--mm-gray-900`
- **Semantic Colors**: 
  - Success: `--mm-success`, `--mm-success-light`
  - Warning: `--mm-warning`, `--mm-warning-light`
  - Error: `--mm-error`, `--mm-error-light`
  - Info: `--mm-info`, `--mm-info-light`
- **Chart Colors**: 10 distinct colors (`--mm-chart-blue`, `--mm-chart-green`, etc.)

#### Typography
- **Font Families**: 
  - `--mm-font-family-inter` (Default)
  - `--mm-font-family-roboto`
  - `--mm-font-family-poppins`
  - `--font-mono` (Code/monospace)
- **Font Sizes**: `--mm-font-size-xs` (12px) through `--mm-font-size-4xl` (36px)
- **Font Weights**: `--mm-font-weight-normal` (400) through `--mm-font-weight-bold` (700)
- **Line Heights**: `--mm-line-height-sm/md/lg`
- **Letter Spacing**: `--mm-letter-spacing-tight/normal/wide`

#### Spacing (8px Grid System)
- **Scale**: `--mm-space-0` through `--mm-space-24` (0px to 96px)
- **Base Unit**: 8px (`--mm-space-2`)

#### Border Radius
- **Scale**: `--mm-radius-none` through `--mm-radius-2xl`
- **Common**: `--mm-radius-sm` (4px), `--mm-radius-md` (8px), `--mm-radius-lg` (12px)

#### Shadows
- **Modern Shadows**: `--mm-shadow-xs` through `--mm-shadow-2xl`
- **Elevation System**: 6 levels for depth hierarchy

#### Z-Index Layers
- **Stacking Context**: `--z-base` (0) through `--z-tooltip` (9999)
- **Modal System**: `--z-modal` (1000), `--z-modal-backdrop` (999)

#### Transitions
- **Durations**: `--transition-fast` (150ms), `--transition-base` (200ms), `--transition-slow` (300ms)
- **Easings**: `--ease-in-out`, `--ease-out`, `--ease-in`

---

## 🧩 Component Library

### 1. Modal System (`components/modals/`)
**Mandatory Usage**: All modals MUST use FormModal or BaseModal

#### FormModal (Primary)
**File**: `components/modals/FormModal.tsx`  
**CSS**: `components/modals/FormModal.module.css`  
**Usage**: Forms, edit dialogs, create workflows
```tsx
import FormModal from '@/components/modals/FormModal';
<FormModal
  isOpen={isOpen}
  onClose={onClose}
  title="Edit Variable"
  onSubmit={handleSubmit}
>
  <form>...</form>
</FormModal>
```
**Features**: Auto header, footer with Cancel/Save, keyboard shortcuts (ESC/Enter), focus trap

#### BaseModal (Secondary)
**File**: `components/modals/BaseModal.tsx`  
**CSS**: `components/modals/BaseModal.module.css`  
**Usage**: Custom layouts, non-form content
```tsx
import BaseModal from '@/components/modals/BaseModal';
<BaseModal isOpen={isOpen} onClose={onClose}>
  <div className={styles.header}>Title</div>
  <div className={styles.body}>Content</div>
</BaseModal>
```

#### ConfirmDialog
**File**: `components/modals/ConfirmDialog.tsx`  
**CSS**: `components/modals/ConfirmDialog.module.css`  
**Usage**: Destructive action confirmations
```tsx
import ConfirmDialog from '@/components/modals/ConfirmDialog';
<ConfirmDialog
  isOpen={isOpen}
  onClose={onClose}
  onConfirm={handleDelete}
  title="Delete Variable?"
  message="This action cannot be undone."
  confirmText="Delete"
  confirmStyle="danger"
/>
```

**Examples in Production**:
- `app/admin/variables/page.tsx` - Create/Edit Variable modal
- `app/admin/partners/page.tsx` - Partner management modals
- `app/admin/hashtags/page.tsx` - Category modals
- `app/admin/kyc/page.tsx` - KYC variable modals

---

### 2. Card System

#### ColoredCard (Standard)
**File**: `components/ColoredCard.tsx`  
**CSS**: `components/ColoredCard.module.css`  
**Mandatory**: Only allowed card component  
**Usage**: All cards, info boxes, data displays
```tsx
import ColoredCard from '@/components/ColoredCard';
<ColoredCard
  title="Partner Name"
  accentColor="var(--mm-primary)"
  actions={<button>Edit</button>}
>
  <p>Card content</p>
</ColoredCard>
```
**Features**: Accent border, consistent padding, action slot, hover states

**Examples**:
- `app/admin/partners/page.tsx` - 15+ partner cards
- `app/admin/variables/page.tsx` - 92 variable cards
- `app/admin/hashtags/page.tsx` - Category cards

---

### 3. Hashtag System

#### UnifiedHashtagInput (Mandatory)
**File**: `components/UnifiedHashtagInput.tsx`  
**Usage**: ALL hashtag input fields
```tsx
import UnifiedHashtagInput from '@/components/UnifiedHashtagInput';
<UnifiedHashtagInput
  hashtags={hashtags}
  categorizedHashtags={categorizedHashtags}
  onChange={(plain, categorized) => { ... }}
  categoryColors={categoryColors}
/>
```
**Features**: Category support, autocomplete, color inheritance, validation

#### ColoredHashtagBubble (Display)
**File**: `components/ColoredHashtagBubble.tsx`  
**CSS**: `components/ColoredHashtagBubble.module.css`  
**Usage**: Display hashtags with categories
```tsx
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';
<ColoredHashtagBubble
  hashtag="country:hungary"
  color="#3b82f6"
  onRemove={() => {}}
  interactive={true}
/>
```

**Examples**:
- `app/admin/projects/ProjectsPageClient.tsx` (lines 450-480)
- `app/admin/filter/page.tsx` (lines 120-150)
- `app/edit/[slug]/page.tsx` (lines 300-330)

---

### 4. Admin UI Components

#### AdminHero / UnifiedAdminHero
**Files**: `components/AdminHero.tsx`, `components/UnifiedAdminHero.tsx`  
**CSS**: `components/AdminHero.module.css`  
**Usage**: Page headers with search/actions
```tsx
import AdminHero from '@/components/AdminHero';
<AdminHero
  title="📊 Project Management"
  searchPlaceholder="Search projects..."
  onSearchChange={handleSearch}
  actions={<button>Add Project</button>}
/>
```
**Features**: Consistent styling, search integration, action slot, breadcrumbs

#### AdminLayout
**File**: `components/AdminLayout.tsx`  
**CSS**: `components/AdminLayout.module.css`  
**Usage**: Wrap all admin pages
```tsx
import AdminLayout from '@/components/AdminLayout';
export default function Page() {
  return (
    <AdminLayout>
      <AdminHero title="Page Title" />
      {/* content */}
    </AdminLayout>
  );
}
```

#### Sidebar
**File**: `components/Sidebar.tsx`  
**CSS**: `components/Sidebar.module.css`  
**Usage**: Admin navigation (automatic in AdminLayout)

---

### 5. Selector Components

#### PartnerSelector
**File**: `components/PartnerSelector.tsx`  
**CSS**: `components/PartnerSelector.module.css`  
**Usage**: Partner selection with predictive search
```tsx
import PartnerSelector from '@/components/PartnerSelector';
<PartnerSelector
  selectedPartner={partner}
  onSelect={setPartner}
  placeholder="Select partner..."
  allowCreation={true}
/>
```
**Features**: Predictive search, logo display, creation mode, keyboard navigation

#### ProjectSelector
**File**: `components/ProjectSelector.tsx`  
**CSS**: `components/ProjectSelector.module.css`  
**Usage**: Project dropdowns
```tsx
import ProjectSelector from '@/components/ProjectSelector';
<ProjectSelector
  selectedProjectId={projectId}
  onSelect={setProjectId}
/>
```

---

### 6. Chart Components (`components/charts/`)

#### Chart Types
- **KPICard**: Single metric display
- **PieChart**: Percentage breakdowns
- **VerticalBarChart**: Comparisons
- **ImageChart**: Image displays
- **TextChart**: Text content
- **ChartBase**: Shared functionality

**Usage**:
```tsx
import { KPICard, PieChart, VerticalBarChart } from '@/components/charts';
```

#### DynamicChart (Wrapper)
**File**: `components/DynamicChart.tsx`  
**CSS**: `components/DynamicChart.module.css`  
**Usage**: Automatically renders chart based on config
```tsx
import DynamicChart from '@/components/DynamicChart';
<DynamicChart result={chartResult} />
```

---

### 7. Form Components

#### ImageUploadField
**File**: `components/ImageUploadField.tsx`  
**CSS**: `components/ImageUploadField.module.css`  
**Usage**: Image uploads with preview
```tsx
import ImageUploadField from '@/components/ImageUploadField';
<ImageUploadField
  currentImageUrl={imageUrl}
  onImageChange={setImageUrl}
  label="Upload Logo"
/>
```

#### TextareaField
**File**: `components/TextareaField.tsx`  
**CSS**: `components/TextareaField.module.css`  
**Usage**: Multi-line text inputs
```tsx
import TextareaField from '@/components/TextareaField';
<TextareaField
  value={text}
  onChange={setText}
  label="Description"
  rows={5}
/>
```

---

### 8. Notification System

#### NotificationPanel
**File**: `components/NotificationPanel.tsx`  
**CSS**: `components/NotificationPanel.module.css`  
**Usage**: Real-time notifications (automatic in admin layout)
**Features**: Grouping (5-min window), read/archive, activity types (create/edit/edit-stats)

---

### 9. Analytics Components (`components/analytics/`)

#### MetricCard
**File**: `components/analytics/MetricCard.tsx`  
**CSS**: `components/analytics/MetricCard.module.css`  
**Usage**: KPI displays with trends
```tsx
import MetricCard from '@/components/analytics/MetricCard';
<MetricCard
  title="Total Fans"
  value={2531}
  change="+12%"
  trend="up"
/>
```

#### InsightCard
**File**: `components/analytics/InsightCard.tsx`  
**CSS**: `components/analytics/InsightCard.module.css`  
**Usage**: AI-generated insights
```tsx
import InsightCard from '@/components/analytics/InsightCard';
<InsightCard insight={insightData} />
```

#### LineChart
**File**: `components/analytics/LineChart.tsx`  
**Usage**: Trend visualizations

---

## 📐 CSS Module Patterns

### Standard Structure
```css
/* Component.module.css */

/* WHAT: Component container */
/* WHY: Establishes layout context */
.container {
  padding: var(--mm-space-6);
  background: var(--mm-white);
  border-radius: var(--mm-radius-lg);
}

/* WHAT: Modal header section */
.header {
  padding: var(--mm-space-6);
  border-bottom: 1px solid var(--mm-gray-200);
}

/* WHAT: Modal body section */
.body {
  padding: var(--mm-space-6);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .container {
    padding: var(--mm-space-4);
  }
}
```

### Required Patterns
1. **No inline styles** - Use CSS modules exclusively
2. **Design tokens only** - No hardcoded colors/spacing
3. **Mobile responsive** - All components must work on mobile
4. **Semantic class names** - `.header`, `.body`, `.footer`, not `.div1`

---

## 🛠️ Utility Libraries (`lib/`)

### API & Data
- **`mongodb.ts`**: Database connection singleton
- **`api/response.ts`**: Standardized API responses (success, error, paginated)
- **`api/caching.ts`**: Response caching utilities
- **`cors.ts`**: CORS configuration
- **`csrf.ts`**: CSRF token generation/validation
- **`rateLimit.ts`**: API rate limiting (token bucket algorithm)

### Authentication & Security
- **`auth.ts`**: Session management, cookie handling
- **`pagePassword.ts`**: Page-level password protection
- **`logger.ts`**: Centralized logging with redaction

### Formulas & Calculations
- **`formulaEngine.ts`**: Variable substitution, formula evaluation
- **`chartCalculator.ts`**: Chart metric calculations
- **`analyticsCalculator.ts`**: CPM-based analytics
- **`projectStatsUtils.ts`**: Stats aggregation

### Data Processing
- **`dataValidator.ts`**: Data quality checks, consistency warnings
- **`hashtagCategoryUtils.ts`**: 25+ hashtag utility functions
- **`chartPartnerUtils.ts`**: Partner-specific chart helpers

### Analytics & Insights
- **`anomalyDetection.ts`**: Statistical outlier detection (Z-score, IQR)
- **`trendAnalysis.ts`**: Trend fitting, forecasting, seasonality
- **`benchmarkEngine.ts`**: Percentile ranking, performance rating
- **`insightsEngine.ts`**: AI insight generation (rule-based)

### External APIs
- **`bitly.ts`**: Bitly API integration
- **`sportsDbApi.ts`**: TheSportsDB integration
- **`footballDataApi.ts`**: Football-Data.org integration
- **`imgbbApi.ts`**: Image hosting

### Export & Formatting
- **`export/pdf.ts`**: PDF generation with html2canvas
- **`performanceUtils.ts`**: Performance monitoring utilities

---

## 🎯 Utility CSS Classes (`app/styles/utilities.css`)

### Layout Utilities
```css
.flex-row { display: flex; flex-direction: row; }
.flex-col { display: flex; flex-direction: column; }
.flex-center { display: flex; align-items: center; justify-content: center; }
.flex-between { display: flex; justify-content: space-between; }
.flex-wrap { flex-wrap: wrap; }
.gap-2 { gap: var(--mm-space-2); }
.gap-4 { gap: var(--mm-space-4); }
```

### Text Utilities
```css
.text-center { text-align: center; }
.text-bold { font-weight: var(--mm-font-weight-bold); }
.text-muted { color: var(--mm-gray-500); }
.text-sm { font-size: var(--mm-font-size-sm); }
.text-fade-end { /* Text overflow with gradient fade-out (last 5%) */ }
```

### Spacing Utilities
```css
.p-4 { padding: var(--mm-space-4); }
.p-6 { padding: var(--mm-space-6); }
.mt-4 { margin-top: var(--mm-space-4); }
.mb-6 { margin-bottom: var(--mm-space-6); }
```

### Background & Border
```css
.bg-white { background: var(--mm-white); }
.bg-gray-50 { background: var(--mm-gray-50); }
.border-gray { border: 1px solid var(--mm-gray-200); }
.rounded-md { border-radius: var(--mm-radius-md); }
```

---

## 🔄 Hooks & Context

### Custom Hooks (`hooks/`)
- **`usePageStyle.ts`**: Dynamic page styling (fetches PageStyleEnhanced, injects CSS)
- **`useHashtags.ts`**: Centralized hashtag API operations
- **`useAuth.ts`**: Authentication state management

### React Context
Located in `lib/shareables/auth/`:
- **AuthProvider**: Session management context
- **AuthContext**: Authentication state sharing

---

## 📦 Type Definitions (`lib/types/`)

### Core Types
- **`api.ts`**: API request/response types
- **`hashtags.ts`**: Hashtag and category types
- **`chartConfigTypes.ts`**: Chart configuration schemas

---

## 🎨 Page-Level CSS Modules

### Admin Pages
- `app/admin/admin.module.css` - Admin layout styles
- `app/admin/projects/Projects.module.css` - Project management
- `app/admin/partners/PartnerManager.module.css` - Partner management
- `app/admin/bitly/bitly.module.css` - Bitly integration
- `app/admin/visualization/Visualization.module.css` - Chart management

### Public Pages
- `app/stats/[slug]/stats.module.css` - Stats page
- `app/edit/[slug]/page.module.css` - Editor page
- `app/filter/[slug]/page.module.css` - Filter page

---

## 🚫 Prohibited Patterns

### ❌ DO NOT:
1. Create custom modal components (use FormModal/BaseModal)
2. Create custom card components (use ColoredCard)
3. Use inline styles (`style={{}}` prop)
4. Hardcode colors (`color: #3b82f6` instead of `var(--mm-primary)`)
5. Hardcode spacing (`padding: 20px` instead of `var(--mm-space-5)`)
6. Create custom hashtag inputs (use UnifiedHashtagInput)
7. Duplicate CSS classes across files

### ✅ MUST DO:
1. Search existing implementations first (see CODING_STANDARDS.md)
2. Use design tokens exclusively
3. Follow established patterns (FormModal lines 1-245, etc.)
4. Run verification: `grep -r "style={{" app/` (should return 0 results)
5. Add WHAT/WHY comments to all code
6. Ensure mobile responsiveness

---

## 📖 Reference Documentation

For implementation details, see:
- **CODING_STANDARDS.md** - Mandatory "Search Before Implementation" section
- **MODAL_SYSTEM.md** - FormModal/BaseModal patterns
- **CARD_SYSTEM.md** - ColoredCard usage
- **HASHTAG_SYSTEM.md** - UnifiedHashtagInput guide
- **DESIGN_SYSTEM.md** - Complete token catalog
- **ARCHITECTURE.md** - Reference file catalog with line numbers

---

*Version: 9.2.1 | Last Updated: 2025-11-02T00:21:00.000Z (UTC)*
