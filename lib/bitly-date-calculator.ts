// lib/bitly-date-calculator.ts
// WHAT: Smart date range calculator for Bitly links shared across multiple events
// WHY: Same Bitly link can be used for different events - need temporal data separation
// ALGORITHM: First event gets all history, last gets ongoing, no data loss, overlap handling

/**
 * WHAT: Event information for date range calculation
 * WHY: Need eventDate and creation time for chronological ordering
 */
export interface EventDateInfo {
  projectId: string;
  eventDate: string;     // ISO 8601 date: "2025-07-01"
  createdAt: string;     // ISO 8601 timestamp: "2025-06-01T10:00:00.000Z"
}

/**
 * WHAT: Computed date range for filtering Bitly data
 * WHY: Each event gets a specific time slice of Bitly analytics
 * 
 * NOTE: null means infinity
 * - startDate: null = from beginning of time
 * - endDate: null = ongoing (no end)
 */
export interface DateRange {
  startDate: string | null;  // null = -∞ (from beginning)
  endDate: string | null;    // null = +∞ (ongoing)
}

/**
 * WHAT: Add days to an ISO date string
 * WHY: Need to calculate eventDate + 2 days for buffer
 * 
 * @param isoDate - ISO 8601 date string "YYYY-MM-DD"
 * @param days - Number of days to add (can be negative)
 * @returns New ISO date string
 */
function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().split('T')[0]; // Extract YYYY-MM-DD
}

/**
 * WHAT: Calculate days between two ISO date strings
 * WHY: Need to detect overlaps (events < 3 days apart)
 * 
 * @returns Number of days between dates (can be negative if date2 < date1)
 */
function daysBetween(isoDate1: string, isoDate2: string): number {
  const date1 = new Date(isoDate1);
  const date2 = new Date(isoDate2);
  const diffMs = date2.getTime() - date1.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * WHAT: Calculate optimal date ranges for multiple events using same Bitly link
 * WHY: Ensures zero data loss and fair distribution of analytics across events
 * 
 * ALGORITHM:
 * 1. Sort events by eventDate (ascending), then createdAt (tiebreaker)
 * 2. FIRST event: Gets all data from -∞ to eventDate + 2 days
 * 3. MIDDLE events: Get data from previous.endDate to eventDate + 2 days
 * 4. LAST event: Gets data from previous.endDate to +∞ (ongoing)
 * 5. OVERLAP HANDLING: If events < 3 days apart, newer starts day after previous
 * 
 * EXAMPLES:
 * 
 * Example 1: Normal spacing (>2 days buffer works)
 * Event A (July 1)    Event B (July 5)    Event C (July 20)
 * A gets: -∞ to July 3 (event + 2)
 * B gets: July 3 to July 7 (event + 2)
 * C gets: July 7 to +∞
 * 
 * Example 2: Overlap (events 1 day apart)
 * Event A (July 1)  Event B (July 2)
 * A gets: -∞ to July 1 (no buffer, too close)
 * B gets: July 2 to +∞
 * 
 * Example 3: Same day (use creation time)
 * Event A (July 1, created 10:00)  Event B (July 1, created 11:00)
 * A gets: -∞ to July 1 (created first, gets all before)
 * B gets: July 2 to +∞ (starts next day)
 * 
 * @param bitlink - The Bitly shortlink being shared (for logging)
 * @param events - Array of events using this link
 * @returns Map of projectId → {startDate, endDate}
 */
export function calculateDateRanges(
  bitlink: string,
  events: EventDateInfo[]
): Map<string, DateRange> {
  // WHAT: Handle edge case - no events
  if (events.length === 0) {
    console.warn(`[Date Calculator] No events provided for bitlink: ${bitlink}`);
    return new Map();
  }

  // WHAT: Handle edge case - single event
  // WHY: Single event gets ALL data (no boundaries needed)
  if (events.length === 1) {
    const event = events[0];
    console.log(`[Date Calculator] Single event for ${bitlink}: ${event.projectId}`);
    return new Map([
      [event.projectId, { startDate: null, endDate: null }]
    ]);
  }

  // WHAT: Sort events chronologically
  // WHY: Need to process in time order to calculate ranges
  // TIEBREAKER: If same eventDate, earlier-created event comes first
  const sorted = [...events].sort((a, b) => {
    // Primary sort: by event date
    if (a.eventDate !== b.eventDate) {
      return a.eventDate.localeCompare(b.eventDate);
    }
    // Tiebreaker: by creation timestamp
    return a.createdAt.localeCompare(b.createdAt);
  });

  console.log(`[Date Calculator] Processing ${sorted.length} events for bitlink: ${bitlink}`);
  sorted.forEach((e, i) => {
    console.log(`  ${i + 1}. ${e.projectId} on ${e.eventDate}`);
  });

  const ranges = new Map<string, DateRange>();

  // WHAT: Process each event to calculate its date range
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const previous = i > 0 ? sorted[i - 1] : null;
    const next = i < sorted.length - 1 ? sorted[i + 1] : null;

    let startDate: string | null;
    let endDate: string | null;

    if (i === 0) {
      // ═══════════════════════════════════════════════════════
      // FIRST EVENT: Gets all historical data
      // ═══════════════════════════════════════════════════════
      startDate = null; // From beginning of time

      // WHAT: Check if next event is too close (< 3 days gap)
      // WHY: Need to prevent overlap with next event
      if (next) {
        const gap = daysBetween(current.eventDate, next.eventDate);
        
        if (gap < 3) {
          // OVERLAP: Events too close - end on event day (no buffer)
          endDate = current.eventDate;
          console.log(`  → First event (OVERLAP with next): -∞ to ${endDate} (${gap} day gap)`);
        } else {
          // NORMAL: Use standard 2-day buffer
          endDate = addDays(current.eventDate, 2);
          console.log(`  → First event (normal): -∞ to ${endDate} (event+2)`);
        }
      } else {
        // WHAT: No next event means this is also the last event
        // WHY: Single event case already handled above, this shouldn't happen
        endDate = addDays(current.eventDate, 2);
        console.log(`  → First event (also last): -∞ to ${endDate}`);
      }
    } 
    else if (i === sorted.length - 1) {
      // ═══════════════════════════════════════════════════════
      // LAST EVENT: Gets all future data (ongoing)
      // ═══════════════════════════════════════════════════════
      
      // WHAT: Start seamlessly from previous event's end
      // WHY: Ensures no gap in data coverage
      startDate = previous!.eventDate === current.eventDate 
        ? addDays(current.eventDate, 1)  // Same day: start next day
        : ranges.get(previous!.projectId)!.endDate!;  // Normal: seamless handoff
      
      endDate = null; // Ongoing (to infinity)
      
      console.log(`  → Last event (ongoing): ${startDate} to +∞`);
    } 
    else {
      // ═══════════════════════════════════════════════════════
      // MIDDLE EVENT: Gets data between previous and next events
      // ═══════════════════════════════════════════════════════
      
      // WHAT: Start seamlessly from previous event's end
      startDate = previous!.eventDate === current.eventDate
        ? addDays(current.eventDate, 1)  // Same day: start next day
        : ranges.get(previous!.projectId)!.endDate!;  // Normal: seamless handoff
      
      // WHAT: Calculate ideal end date (event + 2 days)
      const idealEndDate = addDays(current.eventDate, 2);
      
      // WHAT: Check if next event is too close
      const gap = daysBetween(current.eventDate, next!.eventDate);
      
      if (gap < 3) {
        // OVERLAP: End on event day to avoid collision with next
        endDate = current.eventDate;
        console.log(`  → Middle event (OVERLAP with next): ${startDate} to ${endDate} (${gap} day gap)`);
      } else {
        // NORMAL: Use standard 2-day buffer
        endDate = idealEndDate;
        console.log(`  → Middle event (normal): ${startDate} to ${endDate} (event+2)`);
      }
    }

    // WHAT: Store computed range for this event
    ranges.set(current.projectId, { startDate, endDate });
  }

  console.log(`[Date Calculator] Completed range calculation for ${bitlink}`);
  return ranges;
}

/**
 * WHAT: Check if a given date falls within a date range
 * WHY: Used for filtering Bitly data by event date ranges
 * 
 * @param date - ISO date string to check "YYYY-MM-DD"
 * @param range - Date range with nullable boundaries
 * @returns true if date is within range (inclusive)
 * 
 * EXAMPLES:
 * - isDateInRange("2025-07-05", {null, "2025-07-10"}) = true (before end)
 * - isDateInRange("2025-07-05", {"2025-07-03", "2025-07-10"}) = true (within)
 * - isDateInRange("2025-07-05", {"2025-07-06", null}) = false (before start)
 */
export function isDateInRange(date: string, range: DateRange): boolean {
  // WHAT: Handle start boundary (null = -∞)
  if (range.startDate !== null && date < range.startDate) {
    return false; // Before start
  }
  
  // WHAT: Handle end boundary (null = +∞)
  if (range.endDate !== null && date > range.endDate) {
    return false; // After end
  }
  
  return true; // Within range
}
