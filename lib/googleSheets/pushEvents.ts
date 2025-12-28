// lib/googleSheets/pushEvents.ts
// WHAT: Push events from MessMass to Google Sheets (v12.0.0)
// WHY: Sync database data to sheet (MessMass → Sheet direction)
// HOW: Fetch events, map to rows, write/update in sheet

import { Db, ObjectId } from 'mongodb';
import { writeSheetRows, findRowByUuid, appendSheetRows, readSheetRows } from './client';
import { eventsToRows, updateRowFormulas } from './rowMapper';
import { generateDynamicColumnMap } from './dynamicMapping';
import type { IndexBasedColumnMap } from './dynamicMapping';
import type { GoogleSheetConfig, PushSummary, PushDbAccess, PushOptions, PushSummaryWithPreview } from './types';

/**
 * WHAT: Push all partner events to Google Sheet
 * WHY: Main entry point for partner-level sync (MessMass → Sheet)
 * HOW: Fetch events from database, map to rows, write to sheet
 * 
 * @param sheetId - Google Sheet ID
 * @param sheetName - Sheet tab name
 * @param db - Database access abstraction
 * @param options - Push options
 * @returns Summary of push operation
 */
export async function pushEventsToSheet(
  sheetId: string,
  sheetName: string,
  db: PushDbAccess,
  options: PushOptions
): Promise<PushSummaryWithPreview> {
  const summary: PushSummaryWithPreview = {
    success: true,
    totalEvents: 0,
    rowsCreated: 0,
    rowsUpdated: 0,
    errors: [],
    preview: []
  };
  
  try {
    // WHAT: Generate column mapping from actual sheet headers
    // WHY: Row 1 is the source of truth - headers show exact field names
    let columnMap: IndexBasedColumnMap = {};
    try {
      const headerRowOnly = await readSheetRows(
        sheetId,
        sheetName,
        (options.config.headerRow || 1)
      );
      
      if (headerRowOnly.length > 0 && Array.isArray(headerRowOnly[0])) {
        // WHAT: Generate dynamic mapping from actual sheet headers
        // WHY: Automatically adapt to any column order in the sheet
        console.log('📋 Generating dynamic column mapping from sheet headers...');
        columnMap = generateDynamicColumnMap(headerRowOnly[0] as string[]);
      }
    } catch (error) {
      console.warn('⚠️ Could not generate dynamic mapping, using default:', error instanceof Error ? error.message : 'Unknown error');
    }
    
    // WHAT: Fetch events via abstraction
    // WHY: Decouple from direct DB access
    const wrappedEvents = await db.getEvents();
    const events = wrappedEvents.map(e => e.data);
    
    summary.totalEvents = events.length;
    
    if (events.length === 0) {
      console.log('📭 No events found for partner - nothing to push');
      return summary;
    }
    
    console.log(`📤 Pushing ${events.length} events to sheet (Dry Run: ${options.dryRun})`);
    
    // WHAT: Convert events to row arrays
    // WHY: Transform database format to sheet format
    const rows = eventsToRows(events, columnMap);
    
    // WHAT: Process each event/row
    // WHY: Create or update in sheet
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const row = rows[i];
      
      try {
        if (event.googleSheetUuid) {
          // WHAT: Event has UUID - find and update existing row
          // WHY: Sync changes to existing sheet row
          let rowNumber: number | null = null;
          
          if (!options.dryRun) {
            rowNumber = await findRowByUuid(
              sheetId,
              sheetName,
              event.googleSheetUuid
            );
          } else {
            // Mock row number for dry run
            rowNumber = 100 + i; 
          }
          
          if (rowNumber) {
            // WHAT: Update existing row
            // WHY: Row found in sheet
            const updatedRow = updateRowFormulas(row, rowNumber);
            
            if (!options.dryRun) {
              await writeSheetRows(
                sheetId,
                sheetName,
                rowNumber,
                [updatedRow]
              );
            }
            
            summary.rowsUpdated++;
            summary.preview?.push({
              action: 'update',
              eventName: event.eventName,
              rowNumber: rowNumber,
              data: updatedRow
            });
            
            if (!options.dryRun) {
              console.log(`✏️ Updated row ${rowNumber}: ${event.eventName}`);
            }
          } else {
            // WHAT: UUID exists but row not found in sheet
            // WHY: Row may have been deleted - append as new
            console.warn(`⚠️ UUID ${event.googleSheetUuid.slice(0,8)}... not found in sheet - appending as new row`);
            
            if (!options.dryRun) {
              await appendSheetRows(
                sheetId,
                sheetName,
                [row]
              );
            }
            
            summary.rowsCreated++;
            summary.preview?.push({
              action: 'create',
              eventName: event.eventName,
              data: row
            });
            
            if (!options.dryRun) {
              console.log(`✨ Appended new row: ${event.eventName}`);
            }
          }
        } else {
          // WHAT: Event has no UUID - append as new row
          // WHY: First time pushing this event to sheet
          
          if (!options.dryRun) {
            await appendSheetRows(
              sheetId,
              sheetName,
              [row]
            );
          }
          
          // WHAT: Update event in database with generated UUID
          // WHY: Track row identity for future pushes
          const uuid = row[0]; // Column A contains UUID
          
          // Use db abstraction to update event
          await db.updateEventWithUuid(
            event._id.toString(), 
            String(uuid), 
            options.dryRun ? 0 : 0 // Row number not easily available from append, but that's ok
          );
          
          summary.rowsCreated++;
          summary.preview?.push({
            action: 'create',
            eventName: event.eventName,
            data: row
          });
          
          if (!options.dryRun) {
            console.log(`✨ Appended new row: ${event.eventName} (UUID: ${String(uuid).slice(0,8)}...)`);
          }
        }
      } catch (error) {
        summary.errors.push({
          eventId: event._id.toString(),
          error: error instanceof Error ? error.message : 'Unknown error during push'
        });
        console.error(`❌ Error pushing event ${event.eventName}:`, error);
      }
    }
    
    // WHAT: Update partner sync metadata
    // WHY: Track last push time and statistics
    await db.updatePartnerSyncStats({
      lastPushAt: new Date().toISOString(),
      pushCount: 1, // This is an increment in the implementation
      eventsCreated: summary.rowsCreated,
      eventsUpdated: summary.rowsUpdated
    });
    
    console.log(`\n📊 Push Summary:`);
    console.log(`   Created: ${summary.rowsCreated}`);
    console.log(`   Updated: ${summary.rowsUpdated}`);
    console.log(`   Errors: ${summary.errors.length}`);
    
    return summary;
  } catch (error) {
    console.error('❌ Push operation failed:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    await db.updatePartnerError(errorMsg);
    
    summary.success = false;
    summary.errors.push({ eventId: 'general', error: errorMsg });
    return summary;
  }
}

/**
 * WHAT: Push single event to sheet
 * WHY: Support event-level sync (Phase 3)
 * HOW: Convert event to row, write to sheet
 * 
 * @param db - MongoDB database instance
 * @param eventId - Event ID (ObjectId or string)
 * @param sheetConfig - Google Sheet configuration
 * @returns True if successful
 */
export async function pushSingleEvent(
  db: Db,
  eventId: string | ObjectId,
  sheetConfig: GoogleSheetConfig
): Promise<boolean> {
  try {
    // WHAT: Find event in database
    // WHY: Get latest data to push
    const projectsCollection = db.collection('projects');
    const event = await projectsCollection.findOne({ _id: new ObjectId(eventId) });
    
    if (!event) {
      throw new Error('Event not found');
    }
    
    // WHAT: Convert event to row array
    // WHY: Transform database format to sheet format
    // WHAT: Generate dynamic column mapping from sheet headers if available
    // WHY: Handle sheets with different column orders
    let columnMap = sheetConfig.columnMap;
    try {
      const headerRowOnly = await readSheetRows(
        sheetConfig.sheetId,
        sheetConfig.sheetName,
        (sheetConfig.headerRow || 1)
      );
      
      if (headerRowOnly.length > 0 && Array.isArray(headerRowOnly[0])) {
        columnMap = generateDynamicColumnMap(headerRowOnly[0] as string[]);
      }
    } catch (error) {
      console.warn('⚠️ Could not generate dynamic mapping for single push, using default');
    }
    
    const rows = eventsToRows([event], columnMap);
    const row = rows[0];
    
    if (event.googleSheetUuid) {
      // WHAT: Event has UUID - find and update existing row
      // WHY: Update existing sheet row
      const rowNumber = await findRowByUuid(
        sheetConfig.sheetId,
        sheetConfig.sheetName,
        event.googleSheetUuid
      );
      
      if (rowNumber) {
        // WHAT: Update existing row
        // WHY: Row found in sheet
        const updatedRow = updateRowFormulas(row, rowNumber);
        await writeSheetRows(
          sheetConfig.sheetId,
          sheetConfig.sheetName,
          rowNumber,
          [updatedRow]
        );
        
        console.log(`✅ Pushed single event to row ${rowNumber}: ${event.eventName}`);
        return true;
      } else {
        throw new Error('Event UUID not found in sheet - cannot update');
      }
    } else {
      // WHAT: Event has no UUID - append as new row
      // WHY: First time pushing this event
      await appendSheetRows(
        sheetConfig.sheetId,
        sheetConfig.sheetName,
        [row]
      );
      
      // WHAT: Update event with generated UUID
      // WHY: Enable future updates
      const uuid = row[0]; // Column A contains UUID
      await projectsCollection.updateOne(
        { _id: event._id },
        {
          $set: {
            googleSheetUuid: uuid,
            isSyncedFromSheet: true,
            googleSheetSource: 'messmass',
            googleSheetSyncedAt: new Date().toISOString()
          }
        }
      );
      
      console.log(`✅ Pushed single event (new row): ${event.eventName}`);
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to push single event:', error);
    throw error;
  }
}

/**
 * WHAT: Bulk push events with UUID tracking
 * WHY: Efficient batch push operation
 * HOW: Group events by new/existing, batch write
 * 
 * @param db - MongoDB database instance
 * @param eventIds - Array of event IDs to push
 * @param sheetConfig - Google Sheet configuration
 * @returns Push summary
 */
export async function pushEventsBatch(
  db: Db,
  eventIds: Array<string | ObjectId>,
  sheetConfig: GoogleSheetConfig
): Promise<PushSummary> {
  const summary: PushSummary = {
    totalEvents: eventIds.length,
    rowsCreated: 0,
    rowsUpdated: 0,
    errors: []
  };
  
  try {
    // WHAT: Generate dynamic column mapping from sheet headers if available
    // WHY: Handle sheets with different column orders
    let columnMap = sheetConfig.columnMap;
    try {
      const headerRowOnly = await readSheetRows(
        sheetConfig.sheetId,
        sheetConfig.sheetName,
        (sheetConfig.headerRow || 1)
      );
      
      if (headerRowOnly.length > 0 && Array.isArray(headerRowOnly[0])) {
        columnMap = generateDynamicColumnMap(headerRowOnly[0] as string[]);
      }
    } catch (error) {
      console.warn('⚠️ Could not generate dynamic mapping for batch push, using default');
    }
    
    // WHAT: Fetch all events
    // WHY: Get data to push
    const projectsCollection = db.collection('projects');
    const events = await projectsCollection.find({
      _id: { $in: eventIds.map(id => new ObjectId(id)) }
    }).toArray();
    
    if (events.length === 0) {
      console.log('📭 No events found - nothing to push');
      return summary;
    }
    
    console.log(`📤 Batch pushing ${events.length} events`);
    
    // WHAT: Separate new events from existing
    // WHY: Optimize batch operations
    const newEvents = events.filter(e => !e.googleSheetUuid);
    const existingEvents = events.filter(e => e.googleSheetUuid);
    
    // WHAT: Append all new events in batch
    // WHY: Single API call for new rows
    if (newEvents.length > 0) {
      const newRows = eventsToRows(newEvents, columnMap);
      await appendSheetRows(
        sheetConfig.sheetId,
        sheetConfig.sheetName,
        newRows
      );
      
      // WHAT: Update events with UUIDs
      // WHY: Track row identity
      for (let i = 0; i < newEvents.length; i++) {
        const uuid = newRows[i][0];
        await projectsCollection.updateOne(
          { _id: newEvents[i]._id },
          {
            $set: {
              googleSheetUuid: uuid,
              isSyncedFromSheet: true,
              googleSheetSource: 'messmass',
              googleSheetSyncedAt: new Date().toISOString()
            }
          }
        );
      }
      
      summary.rowsCreated = newEvents.length;
      console.log(`✨ Appended ${newEvents.length} new rows`);
    }
    
    // WHAT: Update existing events individually
    // WHY: Each has different row number
    for (const event of existingEvents) {
      try {
        const row = eventsToRows([event], sheetConfig.columnMap)[0];
        const rowNumber = await findRowByUuid(
          sheetConfig.sheetId,
          sheetConfig.sheetName,
          event.googleSheetUuid
        );
        
        if (rowNumber) {
          const updatedRow = updateRowFormulas(row, rowNumber);
          await writeSheetRows(
            sheetConfig.sheetId,
            sheetConfig.sheetName,
            rowNumber,
            [updatedRow]
          );
          
          summary.rowsUpdated++;
        }
      } catch (error) {
        summary.errors.push({
          eventId: event._id.toString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    console.log(`✏️ Updated ${summary.rowsUpdated} existing rows`);
    
    return summary;
  } catch (error) {
    console.error('❌ Batch push failed:', error);
    throw error;
  }
}
