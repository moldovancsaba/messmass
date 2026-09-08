// WHAT: Hashtag / category colour DATA — the palette offered to admins when they create a
//       category or colour a hashtag, and the fallback used when neither the hashtag nor its
//       category has a stored colour.
// WHY: These values are persisted to MongoDB and rendered from there, so they are content,
//      not theme; UI chrome around the bubbles uses theme.css tokens.

/** Fallback bubble colour when no hashtag or category colour is stored. */
export const DEFAULT_HASHTAG_COLOR = '#667eea';

/** Default colour pre-filled in the /admin/categories create form. */
export const CATEGORY_FORM_DEFAULT_COLOR = '#3b82f6';

/** Bubble background when a hashtag resolves to no colour at all (ColoredHashtagBubble). */
export const HASHTAG_BUBBLE_FALLBACK_COLOR = '#3b82f6';

/** Neutral bubble fallback for a hashtag with no resolvable category. */
export const UNCATEGORIZED_HASHTAG_COLOR = '#6b7280';

/**
 * Default category colors palette
 * Provides consistent color options for new categories
 */
export const DEFAULT_CATEGORY_COLORS: string[] = [
  '#667eea',  // Default purple
  '#764ba2',  // Deep purple
  '#f093fb',  // Light pink
  '#f5576c',  // Red-pink
  '#4facfe',  // Light blue
  '#00f2fe',  // Cyan
  '#43e97b',  // Green
  '#38f9d7',  // Mint
  '#ffecd2',  // Light orange
  '#fcb69f',  // Peach
  '#a8edea',  // Light mint
  '#fed6e3',  // Light pink
  '#d299c2',  // Soft purple
  '#fef9d7',  // Light yellow
  '#ebc0fd',  // Lavender
  '#d9a7c7',  // Dusty rose
  '#96c93d',  // Lime green
  '#00b4db'   // Ocean blue
];
