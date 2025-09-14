# MessMass Architecture Documentation

## Project Overview

MessMass is a project management system built with Next.js, TypeScript, and MongoDB, designed to help users organize and track projects with advanced hashtag categorization capabilities.

## Version History

- **Version 2.2.0** - Hashtag Categories System ✅ **COMPLETED**
- **Version 2.3.0** - Shareables Component Library (In Progress)

---

## Hashtag Categories System (Version 2.2.0)

### Overview

The hashtag categories system allows users to organize hashtags into categories and filter projects using both traditional hashtags and category-prefixed hashtags (e.g., "country:hungary", "period:summer"). This enables better organization and more precise filtering capabilities.

### Key Features

- **Category-Prefixed Hashtags**: Support for hashtags in the format "category:hashtag"
- **Dual Format Support**: Hashtags work both as plain hashtags and category-prefixed hashtags
- **Visual Category Indicators**: UI components display category colors and prefixes
- **Advanced Filtering**: Search supports both traditional and categorized hashtag filtering
- **Backward Compatibility**: Existing plain hashtags continue to work without changes

### Architecture Components

#### 1. Data Model

**Hashtag Categories Collection** (`hashtag_categories`)
```typescript
interface HashtagCategory {
  _id: ObjectId;
  name: string;        // Category name (e.g., "country", "period")
  color: string;       // Hex color code for visual distinction
  createdAt: Date;
  updatedAt: Date;
}
```

**Projects Collection Extension**
```typescript
interface Project {
  // ... existing fields
  hashtags: string[];  // Traditional hashtags
  categorizedHashtags: {
    [categoryName: string]: string[];  // Category-specific hashtags
  };
}
```

**Hashtags Collection Enhancement**
```typescript
interface HashtagDoc {
  _id: string;         // Hashtag text (e.g., "summer" or "period:summer")
  count: number;       // Usage count across all projects
  projects: ObjectId[]; // Projects using this hashtag
}
```

#### 2. Utility Functions (`lib/hashtagCategoryUtils.ts`)

**Core Functions:**

- `expandHashtagsWithCategories()`: Converts categorized hashtags to "category:hashtag" format
- `parseHashtagQuery()`: Parses "category:hashtag" into category and hashtag components
- `matchHashtagInProject()`: Checks if a hashtag exists in traditional or categorized fields

**Example Usage:**
```typescript
// Expand categorized hashtags for display
const expandedTags = expandHashtagsWithCategories(
  ["summer", "travel"], 
  { country: ["hungary"], period: ["summer"] }
);
// Returns: ["summer", "travel", "country:hungary", "period:summer"]

// Parse category-prefixed hashtag
const parsed = parseHashtagQuery("country:hungary");
// Returns: { category: "country", hashtag: "hungary" }
```

#### 3. API Endpoints

**Hashtag Categories Management**
- `GET /api/admin/hashtag-categories` - List all categories
- `POST /api/admin/hashtag-categories` - Create new category
- `PUT /api/admin/hashtag-categories/[id]` - Update category
- `DELETE /api/admin/hashtag-categories/[id]` - Delete category

**Enhanced Project APIs**
- `POST /api/projects` - Create project with categorized hashtags
- `PUT /api/projects/[id]` - Update project with categorized hashtags
- Both endpoints automatically store both plain and category-prefixed versions

**Enhanced Filtering API**
- `POST /api/hashtags/filter` - Filter projects by hashtags (admin)
- `GET /api/hashtags/filter-by-slug/[slug]` - Public filter endpoint supporting both filter slugs and direct hashtag queries
- `GET /api/hashtags/slugs` - Get available hashtags for filtering
- Supports mixed queries: `["summer", "country:hungary"]`
- Uses MongoDB `$or` queries to search both traditional and categorized hashtags
- **Note**: Individual hashtag statistics pages (`/hashtag/[hashtag]`) have been consolidated into the filter system

#### 4. UI Components

**ColoredHashtagBubble Component**
- Displays hashtags with category colors
- Shows category prefixes visually (e.g., "period:" in lighter text)
- Includes tooltips with full category context

**UnifiedHashtagInput Component**
- Enhanced to support category-prefixed hashtag input
- Visual distinction between plain and categorized hashtags
- Autocomplete supports both formats

**Project Forms**
- Category-specific hashtag input sections
- Proper loading and display of categorized hashtags during editing
- Validation to prevent hashtag duplication across categories

#### 5. Filtering Logic

The system supports sophisticated filtering with both traditional and categorized hashtags:

**Query Types:**
1. **Plain hashtag**: "summer" - searches in all categories + traditional hashtags
2. **Category-prefixed**: "period:summer" - searches only in specified category
3. **Mixed queries**: `["summer", "country:hungary"]` - combines both approaches

**MongoDB Query Structure:**
```javascript
{
  $and: [
    {
      $or: [
        { hashtags: { $in: ["summer"] } },
        { "categorizedHashtags.country": { $in: ["summer"] } },
        { "categorizedHashtags.period": { $in: ["summer"] } }
        // ... other categories
      ]
    },
    {
      $or: [
        { "categorizedHashtags.country": { $in: ["hungary"] } }
      ]
    }
  ]
}
```

### Implementation Details

#### Database Strategy

1. **Dual Storage**: Both plain and category-prefixed hashtags are stored in the hashtags collection for efficient filtering
2. **Backward Compatibility**: Existing projects continue to work with traditional hashtags
3. **Incremental Migration**: New projects automatically adopt the dual format

#### Performance Considerations

1. **Indexed Queries**: MongoDB indexes on both `hashtags` and `categorizedHashtags` fields
2. **Efficient Filtering**: Single query handles both traditional and categorized hashtag searches
3. **Client-Side Optimization**: Utility functions minimize redundant processing

#### UI/UX Design

1. **Visual Hierarchy**: Category prefixes are displayed in lighter/smaller text
2. **Color Coding**: Each category has a distinct color for easy identification
3. **Consistent Experience**: Same hashtag works in both traditional and categorized contexts

### Benefits

1. **Enhanced Organization**: Users can organize hashtags by meaningful categories
2. **Precise Filtering**: Category-prefixed searches provide exact matches
3. **Flexible Usage**: Same hashtag can exist in multiple categories without conflict
4. **Backward Compatibility**: No disruption to existing workflows
5. **Future-Proof**: Extensible architecture for additional categorization features

### Migration and Compatibility

- **Zero-Downtime Migration**: Existing projects continue working without changes
- **Gradual Adoption**: Users can adopt categorized hashtags at their own pace
- **Data Integrity**: Validation prevents duplicate hashtags within the same category
- **API Compatibility**: All existing API endpoints maintain backward compatibility

---

## URL Structure and Routing

### Public Pages
- `/stats/[slug]` - Individual project statistics (password protected)
- `/edit/[slug]` - Project editing interface (password protected)
- `/filter/[slug]` - Hashtag filtering and statistics (supports both filter slugs and direct hashtag names)
- `/hashtag/[hashtag]` - Aggregated statistics for a single hashtag (resurfaced; leverages the same style system)

### Admin Pages
- `/admin` - Admin dashboard
- `/admin/projects` - Project management
- `/admin/hashtags` - Hashtag color management
- `/admin/categories` - Hashtag category management
- `/admin/filter` - Advanced hashtag filtering tool
- `/admin/charts` - Chart configuration management
- `/admin/design` - UI design customization
- `/admin/visualization` - Data visualization settings

### API Endpoints
- `/api/projects` - Project CRUD operations
- `/api/hashtags/filter-by-slug/[slug]` - Public hashtag filtering (supports both slugs and direct hashtag queries)
- `/api/hashtags/filter` - Admin hashtag filtering
- `/api/hashtags/slugs` - Available hashtag listing
- `/api/hashtag-categories` - Category management
- `/api/hashtag-colors` - Hashtag color management
- `/api/page-config` - Page styling configuration
- `/api/chart-config` - Chart configuration management

### URL Notes (v2.6.0 → v2.10.0)
- v2.6.0: Hashtag pages were deprecated in favor of the unified filter system
- v2.10.0: `/hashtag/[hashtag]` is available for single-hashtag aggregated stats (shares styling and components with filter/stats pages)
- Redirect behavior may exist for legacy routes, but the hashtag page is supported and styled

---

## Visualization Grid System (Stats/Admin Parity)

- Shared Component: components/UnifiedDataVisualization.tsx is the single source of truth for rendering blocks and charts across Admin Visualization, /stats, /filter, and /hashtag pages.
- Desktop Layout: Each data visualization block uses its configured gridColumns value (1–6) for desktop. This is capped by global desktop units from page-config grid settings to prevent over-allocation.
- Tablet/Mobile Layout: Uses global tabletUnits and mobileUnits from page-config grid settings. Chart spans are clamped at each breakpoint to available units.
- CSS Specificity: Per-block, id-scoped grid classes (udv-grid-[blockId]) are injected to ensure layout cannot be overridden by legacy/global CSS. Important flags are applied where necessary to neutralize conflicts.
- Pixel Constraints Removed: Chart container and legend min/max-width constraints are overridden to ensure unit-based grid math governs layout.
- Data Flow: gridSettings are served by /api/page-config and passed to pages, then forwarded to UnifiedDataVisualization as gridUnits.

## Technology Stack

### Frontend
- **Next.js 15.4.6** - React framework with App Router
- **TypeScript** - Type safety and developer experience
- **Tailwind CSS** - Utility-first styling
- **Lucide React** - Icon library

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database with flexible schema
- **NextAuth.js** - Authentication system

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vercel** - Deployment platform

---

## Future Enhancements

### Planned Features (Version 2.3.0+)
- **Shareables Component Library** - Extract reusable components for other projects
- **Advanced Analytics** - Category-based project analytics and insights
- **Import/Export** - Category-aware project data migration tools
- **Team Collaboration** - Shared category definitions across team projects

### Technical Debt
- Consider MongoDB aggregation pipelines for complex filtering scenarios
- Implement caching layer for frequently accessed hashtag categories
- Add comprehensive error handling for category-related operations

---

## Contributing

When working with the hashtag categories system:

1. **Utility Functions**: Always use `hashtagCategoryUtils.ts` functions for consistency
2. **API Design**: Maintain backward compatibility when modifying hashtag-related endpoints
3. **UI Components**: Follow the established pattern for category color application
4. **Testing**: Manually validate both traditional and categorized hashtag workflows
5. **Documentation**: Update this document when adding new category-related features

---

*Last Updated: 2025-09-14T09:18:50.000Z*
*Version: 4.1.0*
