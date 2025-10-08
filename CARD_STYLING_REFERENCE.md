# Card Styling Reference - ColoredCard System

## 📍 SINGLE SOURCE OF TRUTH

All admin cards MUST use the `ColoredCard` component located at:
- **Component**: `/components/ColoredCard.tsx`
- **Styles**: `/components/ColoredCard.module.css`

## 🎯 ColoredCard Component Code

```tsx
// /components/ColoredCard.tsx
import React from 'react';
import styles from './ColoredCard.module.css';

interface ColoredCardProps {
  accentColor: string;      // Hex color for 4px left border
  className?: string;        // Optional additional classes
  children: React.ReactNode; // Card content
  onClick?: () => void;      // Optional click handler
  hoverable?: boolean;       // Enable hover effects (default: true)
}

export default function ColoredCard({
  accentColor,
  className = '',
  children,
  onClick,
  hoverable = true
}: ColoredCardProps) {
  return (
    <div
      className={`${styles.coloredCard} ${hoverable ? styles.hoverable : ''} ${className}`}
      style={{ borderLeftColor: accentColor }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}
```

## 🎨 ColoredCard CSS

```css
/* /components/ColoredCard.module.css */

.coloredCard {
  background: var(--mm-white);
  border: 1px solid var(--mm-border-color-light);
  border-left: 4px solid; /* Color set via inline style */
  border-radius: var(--mm-radius-lg);
  padding: var(--mm-space-4);
  box-shadow: var(--mm-shadow-sm);
  transition: all 0.2s ease;
}

.coloredCard.hoverable:hover {
  box-shadow: var(--mm-shadow-md);
  transform: translateY(-2px);
  border-color: var(--mm-border-color-default);
  cursor: pointer;
}

@media (max-width: 640px) {
  .coloredCard {
    padding: var(--mm-space-3);
  }
}
```

## ✅ CORRECT USAGE BY PAGE

### 1. Dashboard (`/app/admin/dashboard/page.tsx`)

#### Metric Cards (Top Row)
```tsx
<ColoredCard accentColor="#8b5cf6" hoverable={false}>
  <div className="metric-value">{aggregatedStats.totalProjects}</div>
  <div className="metric-label">Total Projects</div>
</ColoredCard>

<ColoredCard accentColor="#f5576c" hoverable={false}>
  <div className="metric-value">{aggregatedStats.totalImages.toLocaleString()}</div>
  <div className="metric-label">Total Images</div>
</ColoredCard>

<ColoredCard accentColor="#3b82f6" hoverable={false}>
  <div className="metric-value">{aggregatedStats.totalFans.toLocaleString()}</div>
  <div className="metric-label">Total Fans</div>
</ColoredCard>

<ColoredCard accentColor="#10b981" hoverable={false}>
  <div className="metric-value">{aggregatedStats.totalAttendees.toLocaleString()}</div>
  <div className="metric-label">Total Attendees</div>
</ColoredCard>
```

#### Success Metric Boxes
```tsx
<ColoredCard accentColor="#10b981" hoverable={false}>
  <h4 className="success-metric-title success-metric-title-green">📊 Engagement Metrics</h4>
  {/* content */}
</ColoredCard>

<ColoredCard accentColor="#3b82f6" hoverable={false}>
  <h4 className="success-metric-title success-metric-title-blue">👕 Merchandise Distribution</h4>
  {/* content */}
</ColoredCard>

<ColoredCard accentColor="#8b5cf6" hoverable={false}>
  <h4 className="success-metric-title success-metric-title-purple">🎯 Success Indicators</h4>
  {/* content */}
</ColoredCard>
```

### 2. Categories (`/app/admin/categories/page.tsx`)

```tsx
import ColoredCard from '@/components/ColoredCard';

{filteredCategories.map((category) => (
  <ColoredCard 
    key={category._id} 
    accentColor={category.color}
    className={styles.categoryContent}
  >
    <div className={styles.categoryHeader}>
      <h3 className={styles.categoryName}>{category.name}</h3>
      {/* actions */}
    </div>
    <div className={styles.categoryFooter}>
      {/* footer content */}
    </div>
  </ColoredCard>
))}
```

### 3. Hashtags (`/components/HashtagEditor.tsx`)

```tsx
import ColoredCard from '@/components/ColoredCard';

{projectHashtags.map((projectHashtag) => {
  const displayColor = colorRecord?.color || '#667eea';
  
  return (
    <ColoredCard key={projectHashtag.hashtag} accentColor={displayColor}>
      <div className="hashtag-card-header">
        <span className="hashtag-bubble" style={{ backgroundColor: displayColor }}>
          #{projectHashtag.hashtag}
        </span>
      </div>
      {/* actions */}
    </ColoredCard>
  );
})}
```

## ❌ PAGES THAT NEED FIXING

### 1. Filter Page (`/app/admin/filter/page.tsx`)
**Status**: NOT using ColoredCard
**Current**: Uses inline styles from `stats.module.css`
**Needs**: Refactor project cards to use ColoredCard

### 2. Variables Page (`/app/admin/variables/page.tsx`)
**Status**: NOT using ColoredCard  
**Current**: Uses `.admin-card` class directly (line 140, 158)
**Needs**: Refactor variable cards to use ColoredCard

## 🚫 DEPRECATED CSS (Should Not Be Used)

The following CSS classes in `/app/styles/layout.css` are DEPRECATED and should NOT be used directly:

```css
/* DEPRECATED - Use ColoredCard component instead */
.metric-card
.metric-card-purple
.metric-card-pink
.metric-card-blue
.metric-card-green
.success-metric-box
.success-metric-box-green
.success-metric-box-blue
.success-metric-box-purple
```

**Note**: `.metric-value`, `.metric-label`, `.success-metric-title` classes are still valid for CONTENT inside ColoredCard.

## 📊 Current Status

| Page | Using ColoredCard? | Status |
|------|-------------------|--------|
| Dashboard | ✅ YES | Complete |
| Categories | ✅ YES | Complete |
| Hashtags | ✅ YES | Complete |
| Filter | ❌ NO | **Needs Fix** |
| Variables | ❌ NO | **Needs Fix** |

## 🎯 Color Palette

Standard colors used across admin interface:
- Purple: `#8b5cf6` - Projects, Success Indicators
- Pink: `#f5576c` - Images
- Blue: `#3b82f6` - Fans, Merchandise
- Green: `#10b981` - Attendees, Engagement

## ✅ Deployment Checklist

Before considering cards "unified":
1. ✅ Dashboard uses ColoredCard (v5.39.0)
2. ✅ Categories uses ColoredCard (v5.39.0)
3. ✅ Hashtags uses ColoredCard (v5.39.1)
4. ❌ Filter needs ColoredCard refactor
5. ❌ Variables needs ColoredCard refactor
6. ❌ Production deployment pending (still showing v5.20.1 cached)

---

**Last Updated**: 2025-10-08  
**Current Local Version**: v5.39.2  
**Production Version**: v5.20.1 (cached, needs deployment)
