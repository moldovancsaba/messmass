/**
 * Analytics Aggregator Service
 * 
 * WHAT: Processes raw project data into pre-aggregated metrics for fast querying
 * WHY: Query performance target < 500ms - pre-computing metrics avoids expensive joins/calculations
 * 
 * USAGE:
 * - Called by daily cron job to update aggregates
 * - Can be triggered manually for specific date ranges/partners
 * - Supports incremental updates (only process new/changed data)
 * 
 * Version: 6.1.0
 * Created: 2025-01-21T17:00:00.000Z
 */

import { MongoClient, Db, Collection, ObjectId } from 'mongodb';
import { 
  TimeAggregatedMetrics, 
  PartnerAnalytics, 
  EventComparison,
  TimeBucket,
  AggregationOptions,
  AggregationResult
} from './analytics-aggregates.types';
import clientPromise from './mongodb';

/**
 * Get start and end dates for a time bucket
 */
function getTimeBucket(date: Date, bucket: TimeBucket): { start: Date; end: Date; year: number; month?: number; week?: number; day?: number } {
  const start = new Date(date);
  const end = new Date(date);
  
  switch (bucket) {
    case 'daily':
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return {
        start,
        end,
        year: start.getFullYear(),
        month: start.getMonth() + 1,
        day: start.getDate()
      };
      
    case 'weekly':
      // Week starts on Monday
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Sunday
      start.setDate(start.getDate() - diff);
      start.setHours(0, 0, 0, 0);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      
      // Calculate week number
      const firstDayOfYear = new Date(start.getFullYear(), 0, 1);
      const pastDaysOfYear = (start.getTime() - firstDayOfYear.getTime()) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      
      return {
        start,
        end,
        year: start.getFullYear(),
        month: start.getMonth() + 1,
        week: weekNumber
      };
      
    case 'monthly':
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(end.getMonth() + 1);
      end.setDate(0); // Last day of month
      end.setHours(23, 59, 59, 999);
      return {
        start,
        end,
        year: start.getFullYear(),
        month: start.getMonth() + 1
      };
      
    case 'yearly':
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
      return {
        start,
        end,
        year: start.getFullYear()
      };
  }
}

/**
 * Calculate engagement rate (images per attendee)
 */
function calculateEngagementRate(images: number, attendees: number): number {
  if (attendees === 0) return 0;
  return Math.round((images / attendees) * 100) / 100;
}

/**
 * Calculate Core Fan Team metric: (merched fans / total fans) × attendees
 */
function calculateFanTeamMetric(merchedFans: number, totalFans: number, attendees: number): number {
  if (totalFans === 0) return 0;
  const rate = merchedFans / totalFans;
  return Math.round(rate * attendees);
}

/**
 * Aggregate metrics for a specific time bucket
 * 
 * ALGORITHM:
 * 1. Query projects within date range
 * 2. Sum all metrics
 * 3. Calculate averages, percentages, KPIs
 * 4. Store in analytics_aggregates collection
 */
export async function aggregateTimeBucket(
  bucket: TimeBucket,
  date: Date,
  options: AggregationOptions = {}
): Promise<AggregationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  
  try {
    const client = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB || 'messmass');
    const projectsCollection = db.collection('projects');
    const aggregatesCollection: Collection<TimeAggregatedMetrics> = db.collection('analytics_aggregates');
    
    // Get time bucket boundaries
    const { start, end, year, month, week, day } = getTimeBucket(date, bucket);
    
    // Build query for projects in this time bucket
    const query: any = {
      eventDate: {
        $gte: start.toISOString().split('T')[0],
        $lte: end.toISOString().split('T')[0]
      }
    };
    
    // Apply optional filters
    if (options.partnerId) {
      query.partnerId = options.partnerId;
    }
    if (options.hashtag) {
      query.$or = [
        { hashtags: options.hashtag },
        { [`categorizedHashtags.${options.hashtag}`]: { $exists: true } }
      ];
    }
    
    // Fetch projects
    const projects = await projectsCollection.find(query).toArray();
    recordsProcessed = projects.length;
    
    if (projects.length === 0) {
      // No events in this bucket - optionally delete existing aggregate
      const deleteResult = await aggregatesCollection.deleteOne({
        bucket,
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
        partnerId: options.partnerId || { $exists: false },
        hashtag: options.hashtag || { $exists: false }
      });
      
      return {
        success: true,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: deleteResult.deletedCount || 0,
        durationMs: Date.now() - startTime,
        errors: []
      };
    }
    
    // Calculate aggregated metrics
    const eventIds = projects.map(p => p._id.toString());
    
    let totalAttendees = 0;
    let totalImages = 0;
    let totalFans = 0;
    let totalMerchedFans = 0;
    let totalBitlyClicks = 0;
    
    let totalFemale = 0;
    let totalMale = 0;
    let totalGenAlpha = 0;
    let totalGenYZ = 0;
    let totalGenX = 0;
    let totalBoomer = 0;
    
    let totalIndoor = 0;
    let totalOutdoor = 0;
    let totalStadium = 0;
    
    let minAttendees = Infinity;
    let maxAttendees = 0;
    
    for (const project of projects) {
      const stats = project.stats || {};
      
      // Attendance (Success Manager metric)
      const attendees = stats.eventAttendees || 0;
      totalAttendees += attendees;
      if (attendees < minAttendees) minAttendees = attendees;
      if (attendees > maxAttendees) maxAttendees = attendees;
      
      // Images
      const remoteImages = stats.remoteImages || 0;
      const hostessImages = stats.hostessImages || 0;
      const selfies = stats.selfies || 0;
      totalImages += (remoteImages + hostessImages + selfies);
      
      // Fans
      const remoteFans = stats.remoteFans || 0;
      const stadiumFans = stats.stadium || 0;
      totalFans += (remoteFans + stadiumFans);
      
      // Merchandise
      const merched = stats.merched || 0;
      totalMerchedFans += merched;
      
      // Demographics
      totalFemale += (stats.female || 0);
      totalMale += (stats.male || 0);
      totalGenAlpha += (stats.genAlpha || 0);
      totalGenYZ += (stats.genYZ || 0);
      totalGenX += (stats.genX || 0);
      totalBoomer += (stats.boomer || 0);
      
      // Location
      totalIndoor += (stats.indoor || 0);
      totalOutdoor += (stats.outdoor || 0);
      totalStadium += (stats.stadium || 0);
      
      // Bitly clicks (would need to aggregate from bitly_project_links collection)
      // For now, placeholder - implement full Bitly aggregation separately
      totalBitlyClicks += 0; // TODO: Implement Bitly click aggregation
    }
    
    const eventCount = projects.length;
    
    // Calculate averages and percentages
    const avgAttendees = eventCount > 0 ? Math.round(totalAttendees / eventCount) : 0;
    const avgImages = eventCount > 0 ? Math.round(totalImages / eventCount) : 0;
    const avgFans = eventCount > 0 ? Math.round(totalFans / eventCount) : 0;
    const avgMerchedFans = eventCount > 0 ? Math.round(totalMerchedFans / eventCount) : 0;
    const avgBitlyClicks = eventCount > 0 ? Math.round(totalBitlyClicks / eventCount) : 0;
    
    const merchandiseRate = totalFans > 0 ? Math.round((totalMerchedFans / totalFans) * 10000) / 100 : 0;
    
    const totalGender = totalFemale + totalMale;
    const femalePercent = totalGender > 0 ? Math.round((totalFemale / totalGender) * 10000) / 100 : 0;
    const malePercent = totalGender > 0 ? Math.round((totalMale / totalGender) * 10000) / 100 : 0;
    
    const avgEngagementRate = calculateEngagementRate(totalImages, totalAttendees);
    const avgFanTeamMetric = calculateFanTeamMetric(totalMerchedFans, totalFans, totalAttendees);
    
    // Get partner name if filtering by partner
    let partnerName: string | undefined;
    if (options.partnerId) {
      const partnersCollection = db.collection('partners');
      const partner = await partnersCollection.findOne({ _id: new ObjectId(options.partnerId) });
      partnerName = partner?.name;
    }
    
    // Create aggregate document
    const aggregate: Omit<TimeAggregatedMetrics, '_id'> = {
      bucket,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString(),
      year,
      month,
      week,
      day,
      
      partnerId: options.partnerId,
      partnerName,
      hashtag: options.hashtag,
      
      eventCount,
      eventIds,
      
      totalAttendees,
      avgAttendees,
      minAttendees: minAttendees === Infinity ? 0 : minAttendees,
      maxAttendees,
      
      totalImages,
      avgImages,
      
      totalFans,
      avgFans,
      
      totalMerchedFans,
      avgMerchedFans,
      merchandiseRate,
      
      totalBitlyClicks,
      avgBitlyClicks,
      
      totalFemale,
      totalMale,
      femalePercent,
      malePercent,
      
      totalGenAlpha,
      totalGenYZ,
      totalGenX,
      totalBoomer,
      
      totalIndoor,
      totalOutdoor,
      totalStadium,
      
      avgEngagementRate,
      avgFanTeamMetric,
      
      lastAggregatedAt: new Date().toISOString(),
      aggregatedEventCount: eventCount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Upsert (update if exists, insert if not)
    const filter: any = {
      bucket,
      periodStart: start.toISOString(),
      periodEnd: end.toISOString()
    };
    
    if (options.partnerId) filter.partnerId = options.partnerId;
    else filter.partnerId = { $exists: false };
    
    if (options.hashtag) filter.hashtag = options.hashtag;
    else filter.hashtag = { $exists: false };
    
    const result = await aggregatesCollection.updateOne(
      filter,
      {
        $set: {
          ...aggregate,
          updatedAt: new Date().toISOString()
        },
        $setOnInsert: {
          createdAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    
    if (result.upsertedCount > 0) recordsCreated = 1;
    if (result.modifiedCount > 0) recordsUpdated = 1;
    
    return {
      success: true,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      durationMs: Date.now() - startTime,
      errors
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);
    console.error(`Aggregation error for ${bucket} bucket:`, error);
    
    return {
      success: false,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      durationMs: Date.now() - startTime,
      errors
    };
  }
}

/**
 * Aggregate partner analytics across all events
 * 
 * ALGORITHM:
 * 1. Query all events for a partner
 * 2. Calculate totals, averages, bests
 * 3. Calculate trends (compare recent vs previous period)
 * 4. Store in partner_analytics collection
 */
export async function aggregatePartnerAnalytics(partnerId: string): Promise<AggregationResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  let recordsProcessed = 0;
  let recordsCreated = 0;
  let recordsUpdated = 0;
  
  try {
    const client = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB || 'messmass');
    const projectsCollection = db.collection('projects');
    const partnersCollection = db.collection('partners');
    const analyticsCollection: Collection<PartnerAnalytics> = db.collection('partner_analytics');
    
    // Get partner details
    const partner = await partnersCollection.findOne({ _id: new ObjectId(partnerId) });
    if (!partner) {
      throw new Error(`Partner not found: ${partnerId}`);
    }
    
    // Get all events for this partner (ordered by date)
    const projects = await projectsCollection
      .find({ partnerId })
      .sort({ eventDate: 1 })
      .toArray();
    
    recordsProcessed = projects.length;
    
    if (projects.length === 0) {
      // No events - delete analytics if exists
      await analyticsCollection.deleteOne({ partnerId });
      return {
        success: true,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        durationMs: Date.now() - startTime,
        errors: []
      };
    }
    
    // Calculate aggregates
    let totalAttendees = 0;
    let totalImages = 0;
    let totalFans = 0;
    let totalMerchedFans = 0;
    let totalBitlyClicks = 0;
    
    let bestEventAttendance = 0;
    let bestEventId = '';
    let bestEventName = '';
    let bestEventDate = '';
    
    const hashtagCounts = new Map<string, { count: number; totalAttendees: number }>();
    
    for (const project of projects) {
      const stats = project.stats || {};
      const attendees = stats.eventAttendees || 0;
      
      totalAttendees += attendees;
      
      // Track best event
      if (attendees > bestEventAttendance) {
        bestEventAttendance = attendees;
        bestEventId = project._id.toString();
        bestEventName = project.eventName;
        bestEventDate = project.eventDate;
      }
      
      // Images
      totalImages += (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0);
      
      // Fans
      totalFans += (stats.remoteFans || 0) + (stats.stadium || 0);
      
      // Merchandise
      totalMerchedFans += (stats.merched || 0);
      
      // Hashtag tracking
      const hashtags = project.hashtags || [];
      for (const tag of hashtags) {
        const current = hashtagCounts.get(tag) || { count: 0, totalAttendees: 0 };
        hashtagCounts.set(tag, {
          count: current.count + 1,
          totalAttendees: current.totalAttendees + attendees
        });
      }
    }
    
    const totalEvents = projects.length;
    const avgAttendeesPerEvent = Math.round(totalAttendees / totalEvents);
    const avgImagesPerEvent = Math.round(totalImages / totalEvents);
    const avgFansPerEvent = Math.round(totalFans / totalEvents);
    const avgMerchandiseRate = totalFans > 0 ? Math.round((totalMerchedFans / totalFans) * 10000) / 100 : 0;
    const avgBitlyClicksPerEvent = Math.round(totalBitlyClicks / totalEvents);
    
    // Calculate trends (compare last 3 months vs previous 3 months)
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const recentProjects = projects.filter(p => new Date(p.eventDate) >= threeMonthsAgo);
    const previousProjects = projects.filter(p => {
      const date = new Date(p.eventDate);
      return date >= sixMonthsAgo && date < threeMonthsAgo;
    });
    
    let attendanceTrend: PartnerAnalytics['attendanceTrend'] = 'insufficient_data';
    let attendanceTrendPercent = 0;
    let engagementTrend: PartnerAnalytics['engagementTrend'] = 'insufficient_data';
    let engagementTrendPercent = 0;
    
    if (recentProjects.length >= 2 && previousProjects.length >= 2) {
      const recentAvgAttendance = recentProjects.reduce((sum, p) => sum + (p.stats?.eventAttendees || 0), 0) / recentProjects.length;
      const previousAvgAttendance = previousProjects.reduce((sum, p) => sum + (p.stats?.eventAttendees || 0), 0) / previousProjects.length;
      
      if (previousAvgAttendance > 0) {
        attendanceTrendPercent = Math.round(((recentAvgAttendance - previousAvgAttendance) / previousAvgAttendance) * 10000) / 100;
        if (attendanceTrendPercent > 5) attendanceTrend = 'increasing';
        else if (attendanceTrendPercent < -5) attendanceTrend = 'decreasing';
        else attendanceTrend = 'stable';
      }
      
      const recentAvgImages = recentProjects.reduce((sum, p) => {
        const stats = p.stats || {};
        return sum + (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0);
      }, 0) / recentProjects.length;
      
      const previousAvgImages = previousProjects.reduce((sum, p) => {
        const stats = p.stats || {};
        return sum + (stats.remoteImages || 0) + (stats.hostessImages || 0) + (stats.selfies || 0);
      }, 0) / previousProjects.length;
      
      if (previousAvgImages > 0) {
        engagementTrendPercent = Math.round(((recentAvgImages - previousAvgImages) / previousAvgImages) * 10000) / 100;
        if (engagementTrendPercent > 5) engagementTrend = 'increasing';
        else if (engagementTrendPercent < -5) engagementTrend = 'decreasing';
        else engagementTrend = 'stable';
      }
    }
    
    // Top hashtags
    const topHashtags = Array.from(hashtagCounts.entries())
      .map(([hashtag, data]) => ({
        hashtag,
        eventCount: data.count,
        avgAttendance: Math.round(data.totalAttendees / data.count)
      }))
      .sort((a, b) => b.eventCount - a.eventCount)
      .slice(0, 10);
    
    // Create partner analytics document
    const analytics: Omit<PartnerAnalytics, '_id'> = {
      partnerId,
      partnerName: partner.name,
      partnerEmoji: partner.emoji,
      
      totalEvents,
      firstEventDate: projects[0].eventDate,
      lastEventDate: projects[projects.length - 1].eventDate,
      
      totalAttendees,
      avgAttendeesPerEvent,
      bestEventAttendance,
      bestEventId,
      bestEventName,
      bestEventDate,
      
      totalImages,
      avgImagesPerEvent,
      
      totalFans,
      avgFansPerEvent,
      
      totalMerchedFans,
      avgMerchandiseRate,
      
      totalBitlyClicks,
      avgBitlyClicksPerEvent,
      
      attendanceTrend,
      attendanceTrendPercent,
      engagementTrend,
      engagementTrendPercent,
      
      topHashtags,
      
      lastAggregatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    // Upsert
    const result = await analyticsCollection.updateOne(
      { partnerId },
      {
        $set: {
          ...analytics,
          updatedAt: new Date().toISOString()
        },
        $setOnInsert: {
          createdAt: new Date().toISOString()
        }
      },
      { upsert: true }
    );
    
    if (result.upsertedCount > 0) recordsCreated = 1;
    if (result.modifiedCount > 0) recordsUpdated = 1;
    
    return {
      success: true,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      durationMs: Date.now() - startTime,
      errors
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    errors.push(errorMessage);
    console.error(`Partner aggregation error for ${partnerId}:`, error);
    
    return {
      success: false,
      recordsProcessed,
      recordsCreated,
      recordsUpdated,
      durationMs: Date.now() - startTime,
      errors
    };
  }
}

/**
 * Run full aggregation for all time buckets and partners
 * 
 * USAGE: Called by daily cron job or manual trigger
 * 
 * ALGORITHM:
 * 1. Get date range of all events
 * 2. Aggregate daily buckets for each day
 * 3. Aggregate weekly buckets
 * 4. Aggregate monthly buckets
 * 5. Aggregate yearly buckets
 * 6. Aggregate partner analytics for each partner
 */
export async function runFullAggregation(options: AggregationOptions = {}): Promise<AggregationResult> {
  const startTime = Date.now();
  let totalProcessed = 0;
  let totalCreated = 0;
  let totalUpdated = 0;
  const allErrors: string[] = [];
  
  try {
    const client = await clientPromise;
    const db: Db = client.db(process.env.MONGODB_DB || 'messmass');
    const projectsCollection = db.collection('projects');
    
    // Get date range from options or from all projects
    let startDate: Date;
    let endDate: Date;
    
    if (options.startDate && options.endDate) {
      startDate = new Date(options.startDate);
      endDate = new Date(options.endDate);
    } else {
      // Get min and max event dates
      const minProject = await projectsCollection.findOne({}, { sort: { eventDate: 1 } });
      const maxProject = await projectsCollection.findOne({}, { sort: { eventDate: -1 } });
      
      if (!minProject || !maxProject) {
        return {
          success: true,
          recordsProcessed: 0,
          recordsCreated: 0,
          recordsUpdated: 0,
          durationMs: Date.now() - startTime,
          errors: ['No projects found']
        };
      }
      
      startDate = new Date(minProject.eventDate);
      endDate = new Date(maxProject.eventDate);
    }
    
    console.log(`Running full aggregation from ${startDate.toISOString()} to ${endDate.toISOString()}`);
    
    // Aggregate daily buckets
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const result = await aggregateTimeBucket('daily', new Date(currentDate), options);
      totalProcessed += result.recordsProcessed;
      totalCreated += result.recordsCreated;
      totalUpdated += result.recordsUpdated;
      allErrors.push(...result.errors);
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Aggregate monthly buckets
    const monthlyDate = new Date(startDate);
    monthlyDate.setDate(1); // Start of month
    while (monthlyDate <= endDate) {
      const result = await aggregateTimeBucket('monthly', new Date(monthlyDate), options);
      allErrors.push(...result.errors);
      
      monthlyDate.setMonth(monthlyDate.getMonth() + 1);
    }
    
    // Aggregate yearly buckets
    const yearlyDate = new Date(startDate);
    yearlyDate.setMonth(0, 1); // Start of year
    while (yearlyDate <= endDate) {
      const result = await aggregateTimeBucket('yearly', new Date(yearlyDate), options);
      allErrors.push(...result.errors);
      
      yearlyDate.setFullYear(yearlyDate.getFullYear() + 1);
    }
    
    // Aggregate partner analytics
    if (!options.partnerId) {
      const partnersCollection = db.collection('partners');
      const partners = await partnersCollection.find({}).toArray();
      
      for (const partner of partners) {
        const result = await aggregatePartnerAnalytics(partner._id.toString());
        allErrors.push(...result.errors);
      }
    } else {
      const result = await aggregatePartnerAnalytics(options.partnerId);
      allErrors.push(...result.errors);
    }
    
    return {
      success: allErrors.length === 0,
      recordsProcessed: totalProcessed,
      recordsCreated: totalCreated,
      recordsUpdated: totalUpdated,
      durationMs: Date.now() - startTime,
      errors: allErrors
    };
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Full aggregation error:', error);
    
    return {
      success: false,
      recordsProcessed: totalProcessed,
      recordsCreated: totalCreated,
      recordsUpdated: totalUpdated,
      durationMs: Date.now() - startTime,
      errors: [errorMessage, ...allErrors]
    };
  }
}
