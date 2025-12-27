// lib/googleSheets/eventTypeDetector.ts
// WHAT: Event type detection from Google Sheet rows (v12.0.0)
// WHY: Determine event structure based on which partner/title columns are filled
// HOW: Rule-based logic using Partner1, Partner2, and EventTitle columns

export type EventType = 'two-partner' | 'single-partner' | 'standalone';

export interface DetectedEventType {
  type: EventType;
  eventName: string;
  partner1Name?: string;
  partner2Name?: string;
  isHomeGame?: boolean; // Partner1 is home team
}

/**
 * WHAT: Detect event type from sheet row data
 * WHY: Different event types have different naming and partner relationships
 * HOW: Check which columns (B, C, D) are filled and apply rules
 * 
 * RULES:
 * - Partner1 (B) + Partner2 (C) = Two-partner event ("P1 vs P2")
 * - Partner1 (B) + EventTitle (D) = Single partner event (use title)
 * - EventTitle (D) only = Standalone event (no partner)
 * - None filled = Invalid (error)
 * 
 * @param row - Array of cell values from sheet row
 * @returns Detected event type with generated event name
 * @throws Error if row structure is invalid
 */
export function detectEventType(row: unknown[]): DetectedEventType {
  // WHAT: Extract partner and title columns (B=1, C=2, D=3)
  // WHY: These determine event type and naming
  const partner1Name = normalizeValue(row[1]); // Column B
  const partner2Name = normalizeValue(row[2]); // Column C
  const eventTitle = normalizeValue(row[3]);   // Column D
  const eventNameAuto = normalizeValue(row[4]); // Column E (fallback)
  
  // WHAT: Rule 1 - Two-partner event (e.g., "FC Barcelona vs Real Madrid")
  // WHY: Both partners present indicates a match/game between two teams
  if (partner1Name && partner2Name) {
    return {
      type: 'two-partner',
      eventName: `${partner1Name} vs ${partner2Name}`,
      partner1Name,
      partner2Name,
      isHomeGame: true // Partner1 is always home team
    };
  }
  
  // WHAT: Rule 2 - Single partner event (e.g., "FC Barcelona - Fan Fest 2025")
  // WHY: One partner + custom title indicates partner-hosted event
  if (partner1Name && eventTitle) {
    return {
      type: 'single-partner',
      eventName: eventTitle, // Use custom title as event name
      partner1Name,
      isHomeGame: true
    };
  }
  
  // WHAT: Rule 3 - Standalone event (e.g., "Summer Festival")
  // WHY: Only title filled indicates non-partner event
  if (eventTitle) {
    return {
      type: 'standalone',
      eventName: eventTitle
    };
  }

  // WHAT: Rule 4 - Fallback to Auto-Event Name (Column E)
  // WHY: Setup/Push writes to Col E but leaves B/C/D empty. Pull needs to handle this.
  if (eventNameAuto) {
    return {
      type: 'standalone',
      eventName: eventNameAuto
    };
  }
  
  // WHAT: Rule 5 - Invalid row (no identifying information)
  // WHY: Cannot create event without name or partners
  throw new Error(
    'Invalid sheet row: At least one of Partner1, Partner2, or Event Title is required. ' +
    `Got: Partner1="${partner1Name}", Partner2="${partner2Name}", EventTitle="${eventTitle}"`
  );
}

/**
 * WHAT: Normalize cell value to string or undefined
 * WHY: Handle empty strings, null, undefined consistently
 * HOW: Convert to string, trim, return undefined if empty
 */
function normalizeValue(value: unknown): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  
  const str = String(value).trim();
  return str.length > 0 ? str : undefined;
}

/**
 * WHAT: Validate row has required event date
 * WHY: Event date is mandatory for all event types
 * HOW: Check column F exists and is valid date format
 * 
 * @param row - Array of cell values from sheet row
 * @returns True if valid date present
 */
export function hasValidEventDate(row: unknown[]): boolean {
  const eventDate = normalizeValue(row[5]); // Column F (0-based index 5)
  
  if (!eventDate) {
    return false;
  }
  
  // WHAT: Check if date is in YYYY-MM-DD format
  // WHY: Consistent date format required for MongoDB
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(eventDate)) {
    return false;
  }
  
  // WHAT: Verify date is parseable
  // WHY: Prevent invalid dates like "2025-13-45"
  const parsed = new Date(eventDate);
  return !isNaN(parsed.getTime());
}

/**
 * WHAT: Get partner names from detected event type
 * WHY: Helper for looking up partner IDs in database
 * HOW: Return array of partner names (1 or 2 depending on type)
 * 
 * @param detected - Detected event type
 * @returns Array of partner names (empty for standalone)
 */
export function getPartnerNames(detected: DetectedEventType): string[] {
  const names: string[] = [];
  
  if (detected.partner1Name) {
    names.push(detected.partner1Name);
  }
  
  if (detected.partner2Name) {
    names.push(detected.partner2Name);
  }
  
  return names;
}

/**
 * WHAT: Format event name for display
 * WHY: Consistent naming across sync operations
 * HOW: Use detected event name with proper formatting
 * 
 * @param detected - Detected event type
 * @returns Formatted event name
 */
export function formatEventName(detected: DetectedEventType): string {
  return detected.eventName;
}
