# 🧩 Components Reference

**Version:** 6.0.0  
**Last Updated:** 2025-01-21T11:14:00.000Z (UTC)  
**Status:** Production

Quick reference for reusable React components in MessMass v6.0.0.

---

## Core Reusable Components

### PartnerSelector

**File**: `components/PartnerSelector.tsx`  
**Purpose**: Predictive search selector for partners with chip display

**Props**:
```typescript
{
  value: Partner | null;
  onChange: (partner: Partner | null) => void;
  partners: Partner[];
  placeholder?: string;
  label?: string;
}
```

**Usage**: See [PARTNERS_SYSTEM_GUIDE.md](PARTNERS_SYSTEM_GUIDE.md#partnerselector-component)

---

### ProjectSelector

**File**: `components/ProjectSelector.tsx`  
**Purpose**: Searchable project selector with chip display

**Props**:
```typescript
{
  value: Project | null;
  onChange: (project: Project | null) => void;
  projects: Project[];
  placeholder?: string;
  label?: string;
}
```

**Usage**: Similar to PartnerSelector pattern

---

### BitlyLinksSelector

**File**: `components/BitlyLinksSelector.tsx`  
**Purpose**: Multi-select searchable Bitly link picker with chips

**Props**:
```typescript
{
  selected: string[]; // Array of Bitly link IDs
  onChange: (ids: string[]) => void;
  links: BitlyLink[];
  placeholder?: string;
}
```

**Usage**: See [PARTNERS_SYSTEM_GUIDE.md](PARTNERS_SYSTEM_GUIDE.md#ui-components)

---

### UnifiedHashtagInput

**File**: `components/UnifiedHashtagInput.tsx`  
**Purpose**: Complete hashtag management (traditional + categorized)

**Props**:
```typescript
{
  generalHashtags: string[];
  onGeneralChange: (hashtags: string[]) => void;
  categorizedHashtags: { [category: string]: string[] };
  onCategorizedChange: (categorized: object) => void;
  categories: HashtagCategory[];
  placeholder?: string;
}
```

**Usage**: See [HASHTAG_SYSTEM.md](HASHTAG_SYSTEM.md#unifiedhashtaginput)

---

### ColoredHashtagBubble

**File**: `components/ColoredHashtagBubble.tsx`  
**Purpose**: Universal hashtag display with category colors

**Props**:
```typescript
{
  hashtag: string;
  interactive?: boolean;
  onClick?: (hashtag: string) => void;
  removable?: boolean;
  onRemove?: (hashtag: string) => void;
  showCategoryPrefix?: boolean;
}
```

**Usage**: See [HASHTAG_SYSTEM.md](HASHTAG_SYSTEM.md#coloredh ashtagbubble)

---

### AdminHero

**File**: `components/AdminHero.tsx`  
**Purpose**: Standardized admin page header with search and actions

**Props**:
```typescript
{
  title: string;
  subtitle?: string;
  badges?: { text: string; variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' }[];
  backLink?: string;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void; // Use to prevent Enter-submit
  searchPlaceholder?: string;
  actionButtons?: Array<{ label: string; onClick: () => void; variant?: 'primary'|'secondary'|'success'|'danger'|'info'; icon?: string; disabled?: boolean; title?: string }>;
}
```

**Usage**: All admin pages (`/admin/projects`, `/admin/partners`, `/admin/bitly`, `/admin/hashtags`)  
**Search UX Standard**:
- Debounce with `useDebouncedValue(value, 300)` from `hooks/useDebouncedValue.ts`
- Prevent Enter key default: pass `onSearchKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}`
- Avoid full-page loaders during search; use `isSearching` state for inline updates
- Use `fetch(..., { cache: 'no-store' })` for search requests

---

### ColoredCard

**File**: `components/ColoredCard.tsx`  
**Purpose**: Styled card component for dashboard items

**Props**:
```typescript
{
  title: string;
  icon: string; // Emoji
  color: string; // Hex color
  onClick?: () => void;
  children?: ReactNode;
}
```

**Usage**: Admin dashboard navigation cards

---

## Component Patterns

### Predictive Search Pattern

All selector components follow this pattern:

1. **Chip Display**: Selected item shown as removable chip
2. **Search Input**: Opens dropdown on focus/type
3. **Filtered Results**: Live search with keyboard navigation
4. **Selection**: Click or Enter to select
5. **Clear**: Click × on chip to deselect

**Example**: `PartnerSelector`, `ProjectSelector`, `BitlyLinksSelector`

---

### Hashtag Management Pattern

Unified system for consistent hashtag UX:

1. **Display**: `ColoredHashtagBubble` with category colors
2. **Input**: `UnifiedHashtagInput` for adding/editing
3. **API**: `useHashtags` hook for data operations

**See**: [HASHTAG_SYSTEM.md](HASHTAG_SYSTEM.md) for complete details

---

## Design System Alignment

All components follow MessMass design system:

- **Colors**: CSS variables from `app/styles/theme.css`
- **Typography**: Consistent font sizes and weights
- **Spacing**: 8px grid system
- **Shadows**: Layered shadows for depth
- **Transitions**: 200ms ease for hover/focus states

**See**: [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) for complete guidelines

---

## Code Examples

### Partner Selector in Form

```typescript
import PartnerSelector from '@/components/PartnerSelector';

function MyForm() {
  const [partner, setPartner] = useState<Partner | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  
  useEffect(() => {
    fetch('/api/partners?limit=1000')
      .then(res => res.json())
      .then(data => setPartners(data.partners));
  }, []);
  
  return (
    <PartnerSelector
      value={partner}
      onChange={setPartner}
      partners={partners}
      label="Select Partner"
      placeholder="Search partners..."
    />
  );
}
```

### Multiple Hashtag Inputs

```typescript
import UnifiedHashtagInput from '@/components/UnifiedHashtagInput';

function EventForm({ event, setEvent, categories }) {
  return (
    <UnifiedHashtagInput
      generalHashtags={event.hashtags || []}
      onGeneralChange={(tags) => setEvent({...event, hashtags: tags})}
      categorizedHashtags={event.categorizedHashtags || {}}
      onCategorizedChange={(cat) => setEvent({...event, categorizedHashtags: cat})}
      categories={categories}
    />
  );
}
```

---

## Testing Components

All components support:
- **TypeScript**: Full type safety
- **Keyboard Navigation**: Arrow keys, Enter, Escape
- **Accessibility**: ARIA labels and roles
- **Responsive**: Mobile-friendly designs

---

**For Detailed Documentation**:
- Partners: [PARTNERS_SYSTEM_GUIDE.md](PARTNERS_SYSTEM_GUIDE.md)
- Hashtags: [HASHTAG_SYSTEM.md](HASHTAG_SYSTEM.md)
- Quick Add: [QUICK_ADD_GUIDE.md](QUICK_ADD_GUIDE.md)
- User Guide: [USER_GUIDE.md](USER_GUIDE.md)

---

**MessMass Components Reference Version 6.0.0**  
**Last Updated: 2025-01-21T11:14:00.000Z (UTC)**  
**© 2025 MessMass Platform**
