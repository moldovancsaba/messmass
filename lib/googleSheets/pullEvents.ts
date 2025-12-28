// lib/googleSheets/pullEvents.ts
// WHAT: Pull events from Google Sheets to MessMass (v12.0.0)
// WHY: Sync sheet data to database (Sheet → MessMass direction)
// HOW: Read rows, map to events, create/update in database

import { Db, ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { readSheetRows, updateSheetRow, findRowByUuid } from './client';
import { rowsToEvents } from './rowMapper';
import { SHEET_COLUMN_MAP, DEFAULT_SHEET_CONFIG } from './columnMap';
import { generateDynamicColumnMap } from './dynamicMapping';
import type { GoogleSheetConfig, PullSummary, SyncDbAccess, PullOptions } from './types';

/**
 * WHAT: Pull all events from Google Sheet to MessMass
 * WHY: Main entry point for partner-level sync (Sheet → MessMass)
 * HOW: Read sheet, map rows to events, create/update in database
 * 
 * @param sheetId - Google Sheet ID
 * @param sheetName - Sheet tab name
 * @param db - Database access abstraction
 * @param options - Pull options
 * @returns Summary of sync operation
 */
export async function pullEventsFromSheet(
  sheetId: string,
  sheetName: string,
  db: SyncDbAccess,
  options: PullOptions
): Promise<PullSummary> {
  const summary: PullSummary = {
    success: true,
    totalRows: 0,
    eventsCreated: 0,
    eventsUpdated: 0,
    errors: [],
    results: []
  };
  
  try {
    console.log('🚀 Starting pull operation...');
    console.log(`   Sheet ID: ${sheetId}`);
    console.log(`   Sheet Name: ${sheetName}`);
    console.log(`   Partner ID: ${options.partnerId}`);
    
    // WHAT: Read header row first to generate dynamic column mapping
    // WHY: Handle sheets with different column orders or offsets
    let headerRowOnly: unknown[][] = [];
    try {
      headerRowOnly = await readSheetRows(
        sheetId,
        sheetName,
        (options.config.headerRow || DEFAULT_SHEET_CONFIG.headerRow)
      );
      console.log(`✅ Header row read: ${headerRowOnly.length} rows, ${headerRowOnly[0]?.length || 0} columns`);
    } catch (headerError) {
      console.warn('⚠️ Failed to read header row, using default column map:', headerError);
    }
    
    let columnMap = options.config.columnMap || SHEET_COLUMN_MAP;
    if (headerRowOnly.length > 0 && Array.isArray(headerRowOnly[0])) {
      // WHAT: Generate dynamic mapping from actual sheet headers
      // WHY: Automatically adapt to any column order in the sheet
      console.log('📋 Generating dynamic column mapping from sheet headers...');
      try {
        columnMap = generateDynamicColumnMap(headerRowOnly[0] as string[]);
        console.log('✅ Dynamic column map generated');
      } catch (mapError) {
        console.warn('⚠️ Failed to generate dynamic map, using default:', mapError);
        columnMap = options.config.columnMap || SHEET_COLUMN_MAP;
      }
    }
    
    // WHAT: Read all data rows from sheet
    // WHY: Get latest sheet data for sync
    console.log(`\n📄 Reading data rows starting from row ${options.config.dataStartRow || DEFAULT_SHEET_CONFIG.dataStartRow}...`);
    let rows: unknown[][] = [];
    try {
      rows = await readSheetRows(
        sheetId,
        sheetName,
        options.config.dataStartRow || DEFAULT_SHEET_CONFIG.dataStartRow
      );
      console.log(`✅ Successfully read ${rows.length} rows from sheet`);
    } catch (readError) {
      console.error('❌ Failed to read data rows:', readError);
      summary.success = false;
      summary.errors.push({ row: 0, error: `Failed to read sheet: ${readError instanceof Error ? readError.message : 'Unknown error'}` });
      return summary;
    }
    
    summary.totalRows = rows.length;
    
    if (rows.length === 0) {
      console.log('📭 Sheet has no data rows - operation complete');
      return summary;
    }
    
    // WHAT: Convert rows to event objects
    // WHY: Transform sheet format to database format
    // Use dynamically generated column map
    console.log(`\n🔄 Converting ${rows.length} sheet rows to event objects...`);
    const { events, errors } = rowsToEvents(rows, columnMap);
    summary.errors = errors;
    
    console.log(`✅ Conversion complete:`);
    console.log(`   Valid events: ${events.length}`);
    console.log(`   Conversion errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.error('⚠️ Conversion errors found:');
      errors.slice(0, 5).forEach(err => {
        console.error(`   Row ${err.row}: ${err.error}`);
      });
      if (errors.length > 5) {
        console.error(`   ... and ${errors.length - 5} more errors`);
      }
    }
    
    if (events.length === 0) {
      console.log('📭 No valid events could be extracted from sheet');
      return summary;
    }
    
    // Pre-process events to ensure UUIDs
    const eventsToProcess = [];
    const uuidsToFetch = [];
    
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const rowIndex = i + (options.config.dataStartRow || DEFAULT_SHEET_CONFIG.dataStartRow);
      
      let uuid = event.googleSheetUuid;
      
      if (!uuid) {
        // Generate new UUID
        uuid = uuidv4();
        event.googleSheetUuid = uuid;
        
        // Write back to sheet
        try {
          await db.updateSheetWithUuid(rowIndex, uuid);
        } catch (error) {
          console.warn(`Failed to write UUID to sheet row ${rowIndex}:`, error);
          // Continue anyway, it will be treated as new
        }
      }
      
      uuidsToFetch.push(uuid);
      eventsToProcess.push({ ...event, rowIndex });
    }
    
    // Batch fetch existing events
    const existingEvents = await db.getEventsByUuids(uuidsToFetch);
    const existingMap = new Map(existingEvents.map(e => [e.uuid, e]));
    
    const toCreate = [];
    const toUpdate = [];
    
    for (const event of eventsToProcess) {
      const existing = existingMap.get(event.googleSheetUuid);
      
      if (existing) {
        toUpdate.push({
          uuid: event.googleSheetUuid,
          data: {
            eventName: event.eventName,
            eventDate: event.eventDate,
            stats: event.stats,
            googleSheetModifiedAt: event.googleSheetModifiedAt,
            googleSheetSource: 'sheet',
            updatedAt: new Date().toISOString()
          }
        });
        summary.eventsUpdated++;
      } else {
        toCreate.push({
          eventName: event.eventName,
          eventDate: event.eventDate,
          stats: event.stats,
          googleSheetUuid: event.googleSheetUuid,
          isSyncedFromSheet: true,
          googleSheetModifiedAt: event.googleSheetModifiedAt,
          googleSheetSyncedAt: new Date().toISOString(),
          googleSheetSource: 'sheet',
          partnerId: new ObjectId(options.partnerId), // Use ObjectId locally but logic handles string
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        summary.eventsCreated++;
      }
    }
    
    // Execute batch operations
    if (toCreate.length > 0) {
      const created = await db.createEvents(toCreate);
      if (summary.results) {
        summary.results.push(...created.map(c => ({ 
          id: c.id, 
          data: c.data, 
          action: 'created' as const 
        })));
      }
    }
    
    if (toUpdate.length > 0) {
      const updated = await db.updateEvents(toUpdate);
      if (summary.results) {
        summary.results.push(...updated.map(u => ({ 
          id: u.id, 
          data: u.data, 
          action: 'updated' as const 
        })));
      }
    }
    
    // Update sync stats
    await db.updatePartnerSyncStats({
      lastPullAt: new Date().toISOString(),
      eventsCreated: summary.eventsCreated,
      eventsUpdated: summary.eventsUpdated,
      totalEvents: summary.eventsCreated + summary.eventsUpdated
    });
    
    console.log(`\n📊 Pull Summary:`);
    console.log(`   Created: ${summary.eventsCreated}`);
    console.log(`   Updated: ${summary.eventsUpdated}`);
    console.log(`   Errors: ${summary.errors.length}`);
    
    return summary;
    
  } catch (error) {
    console.error('❌ Pull operation failed:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await db.updatePartnerError(errorMsg);
    
    summary.success = false;
    summary.errors.push({ row: 0, error: errorMsg });
    return summary;
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
