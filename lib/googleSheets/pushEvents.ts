// lib/googleSheets/pushEvents.ts
// WHAT: Push events from MessMass to Google Sheets (v12.0.0)
// WHY: Sync database data to sheet (MessMass → Sheet direction)
// HOW: Fetch events, map to rows, write/update in sheet

import { Db, ObjectId } from 'mongodb';
import { writeSheetRows, findRowByUuid, appendSheetRows } from './client';
import { eventsToRows, updateRowFormulas } from './rowMapper';
import { SHEET_COLUMN_MAP } from './columnMap';
import type { GoogleSheetConfig, PushSummary } from './types';

/**
 * WHAT: Push all partner events to Google Sheet
 * WHY: Main entry point for partner-level sync (MessMass → Sheet)
 * HOW: Fetch events from database, map to rows, write to sheet
 * 
 * @param db - MongoDB database instance
 * @param partnerId - Partner ID (ObjectId or string)
 * @param sheetConfig - Google Sheet configuration
 * @returns Summary of push operation
 */
export async function pushEventsToSheet(
  db: Db,
  partnerId: string | ObjectId,
  sheetConfig: GoogleSheetConfig
): Promise<PushSummary> {
  const summary: PushSummary = {
    totalEvents: 0,
    rowsCreated: 0,
    rowsUpdated: 0,
    errors: []
  };
  
  try {
    // WHAT: Fetch all events for this partner
    // WHY: Get latest MessMass data to push
    const projectsCollection = db.collection('projects');
    const events = await projectsCollection.find({
      partnerId: new ObjectId(partnerId)
    }).toArray();
    
    summary.totalEvents = events.length;
    
    if (events.length === 0) {
      console.log('📭 No events found for partner - nothing to push');
      return summary;
    }
    
    console.log(`📤 Pushing ${events.length} events to sheet`);
    
    // WHAT: Convert events to row arrays
    // WHY: Transform database format to sheet format
    const rows = eventsToRows(events, sheetConfig.columnMap);
    
    // WHAT: Process each event/row
    // WHY: Create or update in sheet
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const row = rows[i];
      
      try {
        if (event.googleSheetUuid) {
          // WHAT: Event has UUID - find and update existing row
          // WHY: Sync changes to existing sheet row
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
            
            summary.rowsUpdated++;
            console.log(`✏️ Updated row ${rowNumber}: ${event.eventName}`);
          } else {
            // WHAT: UUID exists but row not found in sheet
            // WHY: Row may have been deleted - append as new
            console.warn(`⚠️ UUID ${event.googleSheetUuid.slice(0,8)}... not found in sheet - appending as new row`);
            await appendSheetRows(
              sheetConfig.sheetId,
              sheetConfig.sheetName,
              [row]
            );
            
            summary.rowsCreated++;
            console.log(`✨ Appended new row: ${event.eventName}`);
          }
        } else {
          // WHAT: Event has no UUID - append as new row
          // WHY: First time pushing this event to sheet
          await appendSheetRows(
            sheetConfig.sheetId,
            sheetConfig.sheetName,
            [row]
          );
          
          // WHAT: Update event in database with generated UUID
          // WHY: Track row identity for future pushes
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
          
          summary.rowsCreated++;
          console.log(`✨ Appended new row: ${event.eventName} (UUID: ${uuid.toString().slice(0,8)}...)`);
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
    const partnersCollection = db.collection('partners');
    await partnersCollection.updateOne(
      { _id: new ObjectId(partnerId) },
      {
        $set: {
          'googleSheetConfig.lastSyncAt': new Date().toISOString(),
          'googleSheetConfig.lastSyncStatus': summary.errors.length > 0 ? 'partial_success' : 'success',
          'googleSheetStats.lastPushAt': new Date().toISOString()
        },
        $inc: {
          'googleSheetStats.pushCount': 1
        }
      }
    );
    
    console.log(`\n📊 Push Summary:`);
    console.log(`   Created: ${summary.rowsCreated}`);
    console.log(`   Updated: ${summary.rowsUpdated}`);
    console.log(`   Errors: ${summary.errors.length}`);
    
    return summary;
  } catch (error) {
    console.error('❌ Push operation failed:', error);
    throw error;
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
    const rows = eventsToRows([event], sheetConfig.columnMap);
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
      const newRows = eventsToRows(newEvents, sheetConfig.columnMap);
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
