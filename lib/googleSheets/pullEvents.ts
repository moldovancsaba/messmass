// lib/googleSheets/pullEvents.ts
// WHAT: Pull events from Google Sheets to MessMass (v12.0.0)
// WHY: Sync sheet data to database (Sheet → MessMass direction)
// HOW: Read rows, map to events, create/update in database

import { Db, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { readSheetRows, updateSheetRow, findRowByUuid } from './client';
import { rowsToEvents } from './rowMapper';
import { getPartnerNames, type DetectedEventType } from './eventTypeDetector';
import { SHEET_COLUMN_MAP, DEFAULT_SHEET_CONFIG } from './columnMap';
import type { GoogleSheetConfig, PullSummary } from './types';

/**
 * WHAT: Pull all events from Google Sheet to MessMass
 * WHY: Main entry point for partner-level sync (Sheet → MessMass)
 * HOW: Read sheet, map rows to events, create/update in database
 * 
 * @param db - MongoDB database instance
 * @param partnerId - Partner ID (ObjectId or string)
 * @param sheetConfig - Google Sheet configuration
 * @returns Summary of sync operation
 */
export async function pullEventsFromSheet(
  db: Db,
  partnerId: string | ObjectId,
  sheetConfig: GoogleSheetConfig
): Promise<PullSummary> {
  const summary: PullSummary = {
    totalRows: 0,
    eventsCreated: 0,
    eventsUpdated: 0,
    errors: []
  };
  
  try {
    // WHAT: Read all data rows from sheet
    // WHY: Get latest sheet data for sync
    const rows = await readSheetRows(
      sheetConfig.sheetId,
      sheetConfig.sheetName,
      sheetConfig.dataStartRow
    );
    
    summary.totalRows = rows.length;
    
    if (rows.length === 0) {
      console.log('📭 Sheet is empty - no events to pull');
      return summary;
    }
    
    console.log(`📖 Read ${rows.length} rows from sheet`);
    
    // WHAT: Convert rows to event objects
    // WHY: Transform sheet format to database format
    const { events, errors } = rowsToEvents(rows, sheetConfig.columnMap);
    summary.errors = errors;
    
    if (events.length === 0) {
      console.log('⚠️ No valid events found in sheet');
      return summary;
    }
    
    console.log(`✅ Parsed ${events.length} valid events`);
    
    // WHAT: Look up partner IDs for partner names
    // WHY: Link events to partners in database
    const partnersCollection = db.collection('partners');
    
    // WHAT: Process each event
    // WHY: Create or update in database
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const rowIndex = i + sheetConfig.dataStartRow;
      
      try {
        // WHAT: Get or create UUID for this event
        // WHY: Track row identity across syncs
        let uuid = event.googleSheetUuid;
        
        if (!uuid) {
          // WHAT: Generate new UUID for new row
          // WHY: First time syncing this event
          uuid = uuidv4();
          event.googleSheetUuid = uuid;
          
          // WHAT: Write UUID back to sheet column A
          // WHY: Enable future updates (row matching)
          try {
            const row = rows[i];
            row[0] = uuid; // Column A (index 0)
            await updateSheetRow(
              sheetConfig.sheetId,
              sheetConfig.sheetName,
              rowIndex,
              row
            );
          } catch (error) {
            console.warn(`Failed to write UUID to sheet row ${rowIndex}:`, error);
          }
        }
        
        // WHAT: Check if event already exists (by UUID)
        // WHY: Determine create vs update
        const projectsCollection = db.collection('projects');
        const existing = await projectsCollection.findOne({ googleSheetUuid: uuid });
        
        if (existing) {
          // WHAT: Update existing event
          // WHY: Sync latest sheet data
          await projectsCollection.updateOne(
            { _id: existing._id },
            {
              $set: {
                eventName: event.eventName,
                eventDate: event.eventDate,
                stats: event.stats,
                googleSheetModifiedAt: event.googleSheetModifiedAt,
                googleSheetSource: 'sheet',
                updatedAt: new Date().toISOString()
              }
            }
          );
          
          summary.eventsUpdated++;
          console.log(`✏️ Updated event: ${event.eventName} (UUID: ${uuid.slice(0,8)}...)`);
        } else {
          // WHAT: Create new event
          // WHY: First time seeing this UUID
          const newEvent = {
            eventName: event.eventName,
            eventDate: event.eventDate,
            stats: event.stats,
            googleSheetUuid: uuid,
            isSyncedFromSheet: true,
            googleSheetModifiedAt: event.googleSheetModifiedAt,
            googleSheetSyncedAt: new Date().toISOString(),
            googleSheetSource: 'sheet',
            partnerId: new ObjectId(partnerId),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          await projectsCollection.insertOne(newEvent);
          
          summary.eventsCreated++;
          console.log(`✨ Created event: ${event.eventName} (UUID: ${uuid.slice(0,8)}...)`);
        }
      } catch (error) {
        summary.errors.push({
          row: rowIndex,
          error: error instanceof Error ? error.message : 'Unknown error during sync'
        });
        console.error(`❌ Error syncing row ${rowIndex}:`, error);
      }
    }
    
    // WHAT: Update partner sync metadata
    // WHY: Track last sync time and statistics
    await partnersCollection.updateOne(
      { _id: new ObjectId(partnerId) },
      {
        $set: {
          'googleSheetConfig.lastSyncAt': new Date().toISOString(),
          'googleSheetConfig.lastSyncStatus': summary.errors.length > 0 ? 'partial_success' : 'success',
          'googleSheetStats.lastPullAt': new Date().toISOString(),
          'googleSheetStats.eventsCreated': summary.eventsCreated,
          'googleSheetStats.eventsUpdated': summary.eventsUpdated,
          'googleSheetStats.totalEvents': summary.eventsCreated + summary.eventsUpdated
        },
        $inc: {
          'googleSheetStats.pullCount': 1
        }
      }
    );
    
    console.log(`\n📊 Pull Summary:`);
    console.log(`   Created: ${summary.eventsCreated}`);
    console.log(`   Updated: ${summary.eventsUpdated}`);
    console.log(`   Errors: ${summary.errors.length}`);
    
    return summary;
  } catch (error) {
    console.error('❌ Pull operation failed:', error);
    throw error;
  }
}

/**
 * WHAT: Pull single event by UUID
 * WHY: Support event-level sync (Phase 3)
 * HOW: Find row by UUID, update single event
 * 
 * @param db - MongoDB database instance
 * @param eventId - Event ID (ObjectId or string)
 * @param sheetConfig - Google Sheet configuration
 * @returns True if successful
 */
export async function pullSingleEvent(
  db: Db,
  eventId: string | ObjectId,
  sheetConfig: GoogleSheetConfig
): Promise<boolean> {
  try {
    // WHAT: Find event in database
    // WHY: Get UUID for sheet lookup
    const projectsCollection = db.collection('projects');
    const event = await projectsCollection.findOne({ _id: new ObjectId(eventId) });
    
    if (!event || !event.googleSheetUuid) {
      throw new Error('Event not found or not synced from sheet');
    }
    
    // WHAT: Find row in sheet by UUID
    // WHY: Locate specific event data
    const rowNumber = await findRowByUuid(
      sheetConfig.sheetId,
      sheetConfig.sheetName,
      event.googleSheetUuid
    );
    
    if (!rowNumber) {
      throw new Error('Event UUID not found in sheet');
    }
    
    // WHAT: Read single row data
    // WHY: Get latest data for this event only
    const rows = await readSheetRows(
      sheetConfig.sheetId,
      sheetConfig.sheetName,
      rowNumber
    );
    
    if (rows.length === 0) {
      throw new Error('Failed to read event row from sheet');
    }
    
    // WHAT: Convert row to event
    // WHY: Transform sheet format to database format
    const { events, errors } = rowsToEvents([rows[0]], sheetConfig.columnMap);
    
    if (errors.length > 0) {
      throw new Error(`Invalid row data: ${errors[0].error}`);
    }
    
    if (events.length === 0) {
      throw new Error('No valid event data in row');
    }
    
    // WHAT: Update event in database
    // WHY: Apply latest sheet data
    const updated = events[0];
    await projectsCollection.updateOne(
      { _id: new ObjectId(eventId) },
      {
        $set: {
          eventName: updated.eventName,
          eventDate: updated.eventDate,
          stats: updated.stats,
          googleSheetModifiedAt: updated.googleSheetModifiedAt,
          googleSheetSource: 'sheet',
          updatedAt: new Date().toISOString()
        }
      }
    );
    
    console.log(`✅ Pulled single event: ${updated.eventName}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to pull single event:', error);
    throw error;
  }
}
