/**
 * Icon Mapping Utility
 * 
 * WHAT: Central mapping of emoji to Material Icon names for migration and backward compatibility
 * WHY: Single source of truth for icon replacements, ensures consistency across all components
 * HOW: Maps Unicode emoji characters to Material Icon names, provides helper function for conversion
 * 
 * Usage:
 * ```typescript
 * import { getIconForEmoji, EMOJI_TO_ICON_MAP } from '@/lib/iconMapping';
 * 
 * const iconName = getIconForEmoji('📊'); // Returns 'analytics'
 * ```
 * 
 * Version: 10.4.0
 * Created: 2025-11-03T00:30:47.000Z
 */

/**
 * WHAT: Complete mapping of emojis used in MessMass to Material Icon names
 * WHY: Database migration and backward compatibility during transition period
 * HOW: Key = Unicode emoji character, Value = Material Icon name from Google Fonts
 * 
 * Browse icons: https://fonts.google.com/icons
 */
export const EMOJI_TO_ICON_MAP: Record<string, string> = {
  // Charts & Analytics
  '📊': 'analytics',
  '📈': 'trending_up',
  '📉': 'trending_down',
  '🥧': 'donut_small',
  
  // Actions & Operations
  '✨': 'star',
  '✏️': 'draw',
  '🔄': 'sync',
  '📥': 'download',
  '⚡': 'bolt',
  '🔍': 'search',
  
  // Status & Alerts
  '🚨': 'warning',
  '⚠️': 'warning',
  '✅': 'check_circle',
  'ℹ️': 'info',
  '🔔': 'notifications',
  
  // Navigation & Management
  '🍿': 'event',
  '🤝': 'handshake',
  '🏷️': 'label',
  '🌍': 'public',
  '↔️': 'swap_horiz',
  '🔐': 'lock',
  '👁️': 'visibility',
  '🎨': 'palette',
  '🔗': 'link',
  '👥': 'group',
  '🗑️': 'delete',
  '📖': 'menu_book',
  '📍': 'location_on',
  
  // Content Types
  '📝': 'description',
  '🖼️': 'image',
  
  // Insights & Intelligence
  '💡': 'lightbulb',
  '⭐': 'star',
  '🔮': 'psychology', // Prediction
  '🏆': 'emoji_events', // Benchmark
};

/**
 * WHAT: Get Material Icon name for a given emoji
 * WHY: Centralized conversion function for backward compatibility
 * HOW: Looks up emoji in EMOJI_TO_ICON_MAP, returns fallback if not found
 * 
 * @param emoji - Unicode emoji character (e.g., '📊')
 * @returns Material Icon name (e.g., 'analytics') or 'help_outline' as fallback
 */
export function getIconForEmoji(emoji: string): string {
  return EMOJI_TO_ICON_MAP[emoji] || 'help_outline';
}

/**
 * WHAT: Check if an emoji has a corresponding Material Icon mapping
 * WHY: Validation during migration to identify unmapped emojis
 * 
 * @param emoji - Unicode emoji character
 * @returns true if mapping exists, false otherwise
 */
export function hasIconMapping(emoji: string): boolean {
  return emoji in EMOJI_TO_ICON_MAP;
}

/**
 * WHAT: Get all mapped emojis as an array
 * WHY: Useful for migration scripts to know which emojis can be converted
 * 
 * @returns Array of all emoji characters with icon mappings
 */
export function getAllMappedEmojis(): string[] {
  return Object.keys(EMOJI_TO_ICON_MAP);
}
