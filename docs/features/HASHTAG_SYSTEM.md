# MessMass Unified Hashtag System Documentation
Status: Active
Last Updated: 2026-01-11T22:28:38.000Z
Canonical: Yes
Owner: Product

**Version:** 11.25.1  
**Last Updated:** 2026-01-11T22:28:38.000Z (UTC)  
**Status:** Production

## 🔒 MANDATORY: Use UnifiedHashtagInput - Do NOT Create Custom Hashtag Components

**Reference Implementation:** `components/UnifiedHashtagInput.tsx` (lines 1-298)

### Rule: UnifiedHashtagInput is THE Standard

**ALL hashtag inputs MUST use UnifiedHashtagInput. Custom hashtag components are PROHIBITED.**

**Real Examples in Codebase:**
- ✅ `app/admin/projects/ProjectsPageClient.tsx` line 939: Project creation form
- ✅ `app/admin/projects/ProjectsPageClient.tsx` line 1004: Project editing form
- ✅ `app/admin/partners/page.tsx` line 341: Partner form

### Exact Pattern to Copy

```tsx
// ✅ CORRECT: From ProjectsPageClient.tsx line 939
import UnifiedHashtagInput from '@/components/UnifiedHashtagInput';

<UnifiedHashtagInput
  generalHashtags={newProjectData.hashtags}
  onGeneralChange={(hashtags) => 
    setNewProjectData(prev => ({ ...prev, hashtags }))
  }
  categorizedHashtags={newProjectData.categorizedHashtags}
  onCategorizedChange={(categorizedHashtags) => 
    setNewProjectData(prev => ({ ...prev, categorizedHashtags }))
  }
  placeholder="Search or add hashtags..."
/>
```

### For Display Only: ColoredHashtagBubble

**Reference:** `components/ColoredHashtagBubble.tsx` (lines 1-156)

```tsx
// ✅ For displaying hashtags
import ColoredHashtagBubble from '@/components/ColoredHashtagBubble';

<ColoredHashtagBubble 
  hashtag="summer" 
  interactive={true}
  onClick={(hashtag) => handleClick(hashtag)}
/>
```

**Real Example:** `app/admin/projects/ProjectsPageClient.tsx` lines 755-768

### Consequences

| Violation | Result |
|-----------|--------|
| Custom hashtag input | ❌ Rejection |
| Not using UnifiedHashtagInput | ❌ Rejection |
| Custom hashtag display | ❌ Rejection |

---

## 🎯 Overview

The MessMass project now features a **completely unified hashtag system** that provides consistent functionality, appearance, and behavior across the entire application. Every hashtag interaction uses the same components, API patterns, and design language.

## 🏗️ System Architecture

### Core Components

#### 1. **ColoredHashtagBubble** - The Universal Display Component
**Location**: `components/ColoredHashtagBubble.tsx`

**Features**:
- ✅ **Category-aware colors** (supports both plain and category-prefixed hashtags)
- ✅ **Interactive mode** (clickable with hover effects)
- ✅ **Removable mode** (built-in (×) button with consistent styling)
- ✅ **Category prefix display** (e.g., "period:summer")
- ✅ **Smart tooltips** (shows category, color source, and interaction hints)
- ✅ **Consistent styling** (same beautiful design everywhere)
- ✅ **Performance optimized** (cached color lookups)

**Usage Examples**:
```jsx
// Basic hashtag display
<ColoredHashtagBubble hashtag="summer" />

// Interactive hashtag (clickable)
<ColoredHashtagBubble 
  hashtag="summer" 
  interactive={true}
  onClick={(hashtag) => navigateTo(`/hashtag/${hashtag}`)}
/>

// Removable hashtag
<ColoredHashtagBubble 
  hashtag="summer" 
  removable={true}
  onRemove={(hashtag) => removeHashtag(hashtag)}
/>

// Category-prefixed hashtag
<ColoredHashtagBubble 
  hashtag="period:summer"
  showCategoryPrefix={true}
  removable={true}
  onRemove={removeHashtag}
/>
```

#### 2. **UnifiedHashtagInput** - The Universal Input Component
**Location**: `components/UnifiedHashtagInput.tsx`

**Features**:
- ✅ **Predictive search** (3+ character autocomplete with debouncing)
- ✅ **Category-aware input** (supports both general and categorized hashtags)
- ✅ **Smart suggestions** (shows existing vs new hashtags)
- ✅ **Keyboard navigation** (arrow keys, enter, escape)
- ✅ **Visual feedback** (category colors, loading states)
- ✅ **API integration** (validation and creation)
- ✅ **Consistent remove buttons** (uses unified ColoredHashtagBubble)

**Usage**:
```jsx
<UnifiedHashtagInput
  generalHashtags={project.hashtags || []}
  onGeneralChange={(hashtags) => setProject({...project, hashtags})}
  categorizedHashtags={project.categorizedHashtags || {}}
  onCategorizedChange={(categorized) => setProject({...project, categorizedHashtags: categorized})}
  categories={hashtagCategories}
  placeholder="Search or add hashtags..."
/>
```

#### 3. **useHashtags** - The Universal API Hook
**Location**: `hooks/useHashtags.ts`

**Features**:
- ✅ **Centralized API calls** (search, validation, colors, categories)
- ✅ **Caching system** (avoids repeated requests)
- ✅ **Consistent error handling**
- ✅ **Performance optimized** (debounced searches)

**Usage**:
```jsx
const {
  searchHashtags,
  getSuggestions,
  validateHashtag,
  hashtagColors,
  categories,
  getHashtagColor,
  getCategoryColor
} = useHashtags();
```

### Legacy Component Updates

#### 4. **SimpleHashtagInput** - Updated to Use Unified System
- ✅ Now uses `ColoredHashtagBubble` with built-in remove functionality
- ✅ Consistent styling and behavior
- ✅ Same (×) button design everywhere

#### 5. **HashtagMultiSelect** - Enhanced with Unified Components
- ✅ Interactive hashtag bubbles
- ✅ Consistent remove functionality
- ✅ Same visual design language

## 🎨 Design Consistency

### Visual Elements
- **Hashtag Bubbles**: Same rounded design, padding, and typography everywhere
- **Remove Buttons**: Consistent red circular (×) buttons with hover effects
- **Category Colors**: Applied uniformly across all components
- **Hover Effects**: Same smooth transitions and shadow effects
- **Typography**: Consistent font weights and sizes

### Color System
- **Category Colors**: Pulled from hashtag categories API
- **Individual Hashtag Colors**: Custom colors from hashtag-colors API
- **Default Color**: `#667eea` (MessMass brand color)
- **Remove Buttons**: `#ef4444` with `#dc2626` hover state

### Interactive States
- **Hover**: `translateY(-1px)` + `box-shadow` for clickable elements
- **Loading**: Consistent spinner/loading indicators
- **Disabled**: Consistent opacity and cursor styles

## 📍 Implementation Status

### ✅ Completed Components

1. **ColoredHashtagBubble** - Fully unified with all features
2. **UnifiedHashtagInput** - Complete rewrite with all features
3. **useHashtags** - New centralized hook
4. **SimpleHashtagInput** - Refactored to use unified components
5. **HashtagMultiSelect** - Updated to use unified bubbles
6. **ProjectsPageClient** - Interactive hashtag displays

### 🔄 Components Using Unified System

- ✅ Admin projects table (interactive hashtags)
- ✅ Project creation/editing forms
- ✅ Hashtag filtering interfaces
- ✅ Multi-hashtag selection components
- ✅ Simple hashtag inputs

## 🚀 Benefits Achieved

### For Users
- **Consistent Experience**: Same behavior everywhere
- **Visual Clarity**: Category colors and prefixes help organization
- **Intuitive Interactions**: Click to navigate, (×) to remove
- **Fast Performance**: Cached data and debounced searches

### For Developers
- **Single Source of Truth**: All hashtag logic centralized
- **Easy Maintenance**: Changes in one place update everywhere
- **Reusable Components**: Drop-in components for any hashtag need
- **Type Safety**: Full TypeScript support

### Technical Improvements
- **Performance**: Caching eliminates redundant API calls
- **Consistency**: Same API patterns across all components
- **Scalability**: Easy to add new hashtag features
- **Reliability**: Centralized error handling and validation

## 📚 Usage Guidelines

### When to Use Each Component

#### ColoredHashtagBubble
- **Display-only hashtags**: Use basic mode
- **Clickable hashtags**: Use `interactive={true}`
- **Editable lists**: Use `removable={true}`
- **Category hashtags**: Use `showCategoryPrefix={true}`

#### UnifiedHashtagInput
- **Full hashtag management**: Use for complete input/editing
- **Category-aware input**: Automatically handles categories
- **Forms and modals**: Primary choice for hashtag input

#### useHashtags Hook
- **Custom implementations**: When building new hashtag features
- **Data access**: For accessing colors, categories, or suggestions
- **API integration**: Consistent patterns for all hashtag operations

## 🔧 Migration Guide

### From Old Components

**Old Pattern**:
```jsx
// Old inconsistent approach
<div className="hashtag-wrapper">
  <span className="hashtag">{hashtag}</span>
  <button onClick={removeHashtag} className="remove-btn">×</button>
</div>
```

**New Pattern**:
```jsx
// New unified approach
<ColoredHashtagBubble 
  hashtag={hashtag}
  removable={true}
  onRemove={removeHashtag}
/>
```

### API Integration

**Old Pattern**:
```jsx
// Old manual API calls
const [suggestions, setSuggestions] = useState([]);
const fetchSuggestions = async (query) => {
  // Manual fetch logic...
};
```

**New Pattern**:
```jsx
// New unified hook
const { getSuggestions } = useHashtags();
const suggestions = await getSuggestions(query, existingHashtags);
```

## 🎯 Testing Checklist

- ✅ All hashtag displays use ColoredHashtagBubble
- ✅ All remove buttons have the same design
- ✅ Category colors are applied consistently
- ✅ Interactive hashtags have consistent hover effects
- ✅ Predictive search works with debouncing
- ✅ API calls use consistent patterns
- ✅ Error handling is uniform across components
- ✅ Performance is optimized with caching
- ✅ TypeScript types are consistent

## 🔮 Future Enhancements

The unified system makes it easy to add new features:

1. **Bulk Operations**: Select multiple hashtags across components
2. **Drag & Drop**: Move hashtags between categories
3. **Advanced Filtering**: Complex query builders
4. **Hashtag Analytics**: Usage statistics and insights
5. **Team Collaboration**: Shared hashtag libraries

---

## 🏆 Summary

The MessMass hashtag system is now **completely unified** with:

- **Same beautiful design everywhere** 🎨
- **Consistent remove (×) buttons** ❌  
- **Predictive search throughout** 🔍
- **Unified API integration** 🔌
- **Category-aware functionality** 🏷️
- **Performance optimizations** ⚡
- **Developer-friendly architecture** 👨‍💻

**Every hashtag interaction in the application now provides the same high-quality experience!** 🎉

*Last Updated: January 29, 2025*
*Status: ✅ Complete - All hashtag functionality is now unified*
