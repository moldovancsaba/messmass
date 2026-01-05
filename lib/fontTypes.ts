/* WHAT: TypeScript types for Font Management system
 * WHY: Centralized font configuration stored in MongoDB
 * HOW: Fonts stored in 'available_fonts' collection, referenced by name */

/**
 * Available Font - Font configuration stored in MongoDB
 * WHAT: Defines a font that can be selected in Style Editor
 * WHY: Dynamic font management without code changes
 * HOW: Stored in 'available_fonts' collection
 */
export interface AvailableFont {
  _id?: string;
  name: string;                    // Display name (e.g., "Inter", "AS Roma", "Aquatic")
  fontFamily: string;              // CSS font-family value (e.g., '"Inter", sans-serif')
  category: 'google' | 'custom' | 'system'; // Font source category
  isActive: boolean;               // Whether font is available for selection
  displayOrder: number;            // Order in dropdown (lower = first)
  description?: string;            // Optional description
  fontFile?: string;               // Path to font file for custom fonts (e.g., '/fonts/Aquatic-Regular.woff')
  createdAt: string;               // ISO 8601 timestamp
  updatedAt: string;               // ISO 8601 timestamp
}

/**
 * Font Field Definition - Metadata for font form fields
 * WHAT: Defines how fonts are displayed in UI
 * WHY: Consistent font selection UI across all components
 */
export interface FontFieldDefinition {
  key: string;                      // Font name (unique identifier)
  label: string;                    // Display label
  fontFamily: string;               // CSS font-family value
  category: 'google' | 'custom' | 'system';
  displayOrder: number;
}

/**
 * Default font values
 * WHAT: System default fonts when no fonts in database
 * WHY: Fallback to ensure system always has fonts available
 */
export const DEFAULT_FONTS: Omit<AvailableFont, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'Inter',
    fontFamily: 'var(--font-inter)',
    category: 'google',
    isActive: true,
    displayOrder: 1,
    description: 'Google Font - Modern sans-serif'
  },
  {
    name: 'Roboto',
    fontFamily: 'var(--font-roboto)',
    category: 'google',
    isActive: true,
    displayOrder: 2,
    description: 'Google Font - Clean and readable'
  },
  {
    name: 'Poppins',
    fontFamily: 'var(--font-poppins)',
    category: 'google',
    isActive: true,
    displayOrder: 3,
    description: 'Google Font - Geometric sans-serif'
  },
  {
    name: 'Montserrat',
    fontFamily: 'var(--font-montserrat)',
    category: 'google',
    isActive: true,
    displayOrder: 4,
    description: 'Google Font - Urban sans-serif'
  },
  {
    name: 'AS Roma',
    fontFamily: '"AS Roma", sans-serif',
    category: 'custom',
    isActive: true,
    displayOrder: 5,
    description: 'Custom font - AS Roma branding',
    fontFile: '/fonts/ASRoma-Regular.woff'
  },
  {
    name: 'Aquatic',
    fontFamily: '"Aquatic", sans-serif',
    category: 'custom',
    isActive: true,
    displayOrder: 6,
    description: 'Custom font - Aquatic branding',
    fontFile: '/fonts/Aquatic-Regular.woff'
  },
  {
    name: 'System Default',
    fontFamily: 'system-ui',
    category: 'system',
    isActive: true,
    displayOrder: 7,
    description: 'System default font stack'
  }
];

/**
 * Validate font name
 * WHAT: Check if font name is valid
 * WHY: Prevent invalid font selections
 */
export function isValidFontName(name: string): boolean {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 50;
}

/**
 * Validate font family CSS value
 * WHAT: Check if font-family value is valid CSS
 * WHY: Prevent invalid CSS from breaking styles
 */
export function isValidFontFamily(fontFamily: string): boolean {
  return typeof fontFamily === 'string' && fontFamily.trim().length > 0;
}

