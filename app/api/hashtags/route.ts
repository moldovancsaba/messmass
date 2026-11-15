import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { cachedResponse, generateETag, checkIfNoneMatch, notModifiedResponse, CACHE_PRESETS } from '@/lib/api/caching';
import { error as logError } from '@/lib/logger';
import { requireAdmin, requireEditorAccess } from '@/lib/apiGuards';
import { compactHashtag } from '@/lib/photoHashtags';

// Use centralized Mongo client and config

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const limitParam = searchParams.get('limit');
    const offsetParam = searchParams.get('offset');
    const DEFAULT_LIMIT = 20;
    const MAX_LIMIT = 100;
    const limit = Math.min(Math.max(Number(limitParam) || DEFAULT_LIMIT, 1), MAX_LIMIT);
    const offset = Math.max(Number(offsetParam) || 0, 0);
    
    const client = await clientPromise;
    const db = client.db(config.dbName);

    // Pipeline to extract and count hashtags from both formats, then sort
    const pipeline: any[] = [
      {
        $project: {
          allTags: {
            $setUnion: [
              { $ifNull: ["$hashtags", []] },
              // With photos=1 (the admin filter) the hashtags Fanmass wrote onto the event's photos count for the event too;
              // the event editor's suggestions stay typed hashtags only
              ...(searchParams.get('photos') === '1' ? [{ $ifNull: ["$fanmassHashtags", []] }] : []),
              {
                $reduce: {
                  input: { $objectToArray: { $ifNull: ["$categorizedHashtags", {}] } },
                  initialValue: [],
                  in: { $concatArrays: ["$$value", { $ifNull: ["$$this.v", []] }] }
                }
              }
            ]
          }
        }
      },
      { $unwind: "$allTags" },
      { $group: { _id: "$allTags", count: { $sum: 1 } } },
    ];

    if (search) {
      pipeline.push({ $match: { _id: { $regex: new RegExp(search, 'i') } } });
    }

    // `photos=1` (the admin hashtag filter) also lists the hashtags Fanmass wrote onto photos (emotion, brand, sport,
    // event, club, people), each with its event count and photo count, so a photo-only hashtag can be filtered too.
    // The event editor's suggestions do not ask for them: photo hashtags are not typed onto events.
    if (searchParams.get('photos') === '1') {
      // Photos counted once per hashtag identity (an underscore is spelling only: lib/photoHashtags.ts compactHashtag)
      const compactSearch = search ? [{ $match: { _id: { $regex: new RegExp(search.replace(/_/g, ''), 'i') } } }] : [];
      const photoTags = (collection: string, match: Record<string, unknown>) => db.collection(collection).aggregate([
        { $match: { ...match, 'hashtags.0': { $exists: true } } },
        { $project: { tags: { $setUnion: [{ $map: { input: '$hashtags', in: { $replaceAll: { input: { $toLower: '$$this' }, find: '_', replacement: '' } } } }, []] } } },
        { $unwind: '$tags' },
        { $group: { _id: '$tags', count: { $sum: 1 } } },
        ...compactSearch,
      ]).toArray();
      const [events, drive, camera] = await Promise.all([
        db.collection('projects').aggregate(pipeline).toArray(),
        photoTags('fanmass_event_drive_photos', {}),
        photoTags('fanmass_camera_photo_analyses', { tombstone: { $ne: true }, status: 'completed' }),
      ]);
      // One row per hashtag identity, shown in its typed spelling when people typed it
      const merged = new Map<string, { hashtag: string; count: number; photos: number }>();
      for (const row of events) {
        const key = compactHashtag(String(row._id));
        const item = merged.get(key);
        if (item) item.count += row.count;
        else merged.set(key, { hashtag: String(row._id), count: row.count, photos: 0 });
      }
      for (const row of [...drive, ...camera]) {
        const key = String(row._id);
        const item = merged.get(key) ?? { hashtag: key, count: 0, photos: 0 };
        item.photos += row.count;
        merged.set(key, item);
      }
      const all = [...merged.values()].sort((x, y) => (y.count + y.photos) - (x.count + x.photos) || x.hashtag.localeCompare(y.hashtag));
      const page = all.slice(offset, offset + limit);
      return NextResponse.json({
        success: true,
        hashtags: page,
        pagination: { mode: 'aggregation', limit, offset, nextOffset: offset + page.length < all.length ? offset + page.length : null, totalMatched: all.length },
      });
    }

    pipeline.push({ $sort: { count: -1, _id: 1 } });

    // Count total matched for search pagination summary
    const totalMatchedAgg = await db.collection('projects').aggregate([...pipeline, { $count: "total" }]).toArray();
    const totalMatched = totalMatchedAgg[0]?.total || 0;

    // Page slice
    pipeline.push({ $skip: offset });
    pipeline.push({ $limit: limit });

    const results = await db.collection('projects').aggregate(pipeline).toArray();

    // WHAT: Return items with counts to support admin Multi-Hashtag Filter UI without loading all slugs.
    // WHY: Smaller payload and server-side pagination improves responsiveness.
    const items = results.map((r: any) => ({ hashtag: r._id as string, count: r.count as number }));

    // WHAT: Apply caching with ETag for frequently updated hashtag list
    // WHY: Reduces database aggregation load for repeated queries
    const responseData = {
      success: true,
      hashtags: items,
      pagination: {
        mode: 'aggregation',
        limit,
        offset,
        nextOffset: offset + results.length < totalMatched ? offset + results.length : null,
        totalMatched
      }
    };
    
    const etag = generateETag(items);
    
    // Check if client has fresh data
    if (checkIfNoneMatch(request, etag)) {
      return notModifiedResponse(etag) as any;
    }
    
    return cachedResponse(
      responseData,
      {
        ...CACHE_PRESETS.DYNAMIC,
        etag
      }
    ) as any;
    
  } catch (error) {
    logError('Hashtags API error', { context: 'hashtags' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hashtags' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // This route had no guard at all: an anonymous caller with a CSRF token
    // from the public /api/csrf-token endpoint could create hashtags.
    // Not requireAdmin: UnifiedHashtagInput creates a hashtag from inside
    // EditorDashboard, which an event operator opens with a page password.
    // DELETE below is admin-only -- it is reached only from /admin/hashtags
    // and its cascade mode removes the tag from every project.
    const denied = await requireEditorAccess();
    if (denied) return denied;

    const { hashtag } = await request.json();
    
    if (!hashtag || typeof hashtag !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Valid hashtag is required' },
        { status: 400 }
      );
    }
    
    // Clean hashtag (remove # if present, lowercase, trim)
    const cleanedHashtag = hashtag.replace(/^#/, '').toLowerCase().trim();
    
    if (!cleanedHashtag) {
      return NextResponse.json(
        { success: false, error: 'Hashtag cannot be empty' },
        { status: 400 }
      );
    }
    
    // Validate hashtag format (alphanumeric and underscores only)
    if (!/^[a-z0-9_]+$/.test(cleanedHashtag)) {
      return NextResponse.json(
        { success: false, error: 'Hashtag can only contain letters, numbers, and underscores' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      hashtag: cleanedHashtag
    });
    
  } catch (error) {
    logError('Hashtag validation error', { context: 'hashtags' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to validate hashtag' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Authentication, which this route had none of (F-003 follow-up).
    // Verified live before the fix: an anonymous caller who fetched a CSRF
    // token from the public /api/csrf-token endpoint reached this handler and
    // wrote to the database.
    const denied = await requireAdmin();
    if (denied) return denied;

    const { searchParams } = new URL(request.url);
    const rawHashtag = searchParams.get('hashtag');
    const mode = (searchParams.get('mode') || '').toLowerCase(); // 'cascade' to remove everywhere

    if (!rawHashtag) {
      return NextResponse.json(
        { success: false, error: 'Hashtag parameter is required' },
        { status: 400 }
      );
    }

    // Normalize incoming value: strip leading '#', lower-case
    const hashtag = rawHashtag.replace(/^#/, '').toLowerCase().trim();

    const client = await clientPromise;
    const db = client.db(config.dbName);

    // If not cascade mode, only verify that the hashtag is unused
    if (mode !== 'cascade') {
      // Check if hashtag is still being used in either format
      const projectsUsingHashtagOld = await db.collection('projects').countDocuments({
        hashtags: hashtag
      });

      const projectsUsingHashtagCategorized = await db.collection('projects').countDocuments({
        $expr: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $objectToArray: { $ifNull: ["$categorizedHashtags", {}] } },
                  cond: { $in: [hashtag, "$$this.v"] }
                }
              }
            },
            0
          ]
        }
      });

      const projectsUsingHashtag = projectsUsingHashtagOld + projectsUsingHashtagCategorized;

      if (projectsUsingHashtag > 0) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete hashtag that is still in use' },
          { status: 400 }
        );
      }

      // Also check partners
      const partnersUsingHashtagOld = await db.collection('partners').countDocuments({ hashtags: hashtag });
      const partnersUsingHashtagCategorized = await db.collection('partners').countDocuments({
        $expr: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $objectToArray: { $ifNull: ["$categorizedHashtags", {}] } },
                  cond: { $in: [hashtag, "$$this.v"] }
                }
              }
            },
            0
          ]
        }
      });

      const partnersUsingHashtag = partnersUsingHashtagOld + partnersUsingHashtagCategorized;
      if (partnersUsingHashtag > 0) {
        return NextResponse.json(
          { success: false, error: 'Cannot delete hashtag that is still in use by partners' },
          { status: 400 }
        );
      }

      return NextResponse.json({ success: true, message: 'Hashtag cleanup verified' });
    }

    // CASCADE MODE — remove hashtag from everywhere (projects, partners, configs, counts)
    const nowIso = new Date().toISOString();

    // 1) Projects: pull from traditional array
    const projPullResult = await db.collection('projects').updateMany(
      { hashtags: hashtag },
      ({ $pull: { hashtags: hashtag }, $set: { updatedAt: nowIso } } as any)
    );

    // 1b) Projects: remove from all categorized arrays via aggregation pipeline update
    const projCategorizedFilter = {
      $expr: {
        $gt: [
          {
            $size: {
              $filter: {
                input: { $objectToArray: { $ifNull: ["$categorizedHashtags", {}] } },
                cond: { $in: [hashtag, "$$this.v"] }
              }
            }
          },
          0
        ]
      }
    } as any;

    const projCategorizedResult = await db.collection('projects').updateMany(
      projCategorizedFilter,
      [
        {
          $set: {
            categorizedHashtags: {
              $arrayToObject: {
                $map: {
                  input: { $objectToArray: { $ifNull: ["$categorizedHashtags", {}] } },
                  as: "kv",
                  in: {
                    k: "$$kv.k",
                    v: {
                      $filter: {
                        input: "$$kv.v",
                        as: "tag",
                        cond: { $ne: ["$$tag", hashtag] }
                      }
                    }
                  }
                }
              }
            },
            updatedAt: nowIso
          }
        }
      ]
    );

    // 2) Partners: same operations
    const partnerPullResult = await db.collection('partners').updateMany(
      { hashtags: hashtag },
      ({ $pull: { hashtags: hashtag }, $set: { updatedAt: nowIso } } as any)
    );

    const partnerCategorizedResult = await db.collection('partners').updateMany(
      {
        $expr: {
          $gt: [
            {
              $size: {
                $filter: {
                  input: { $objectToArray: { $ifNull: ["$categorizedHashtags", {}] } },
                  cond: { $in: [hashtag, "$$this.v"] }
                }
              }
            },
            0
          ]
        }
      },
      [
        {
          $set: {
            categorizedHashtags: {
              $arrayToObject: {
                $map: {
                  input: { $objectToArray: { $ifNull: ["$categorizedHashtags", {}] } },
                  as: "kv",
                  in: {
                    k: "$$kv.k",
                    v: {
                      $filter: {
                        input: "$$kv.v",
                        as: "tag",
                        cond: { $ne: ["$$tag", hashtag] }
                      }
                    }
                  }
                }
              }
            },
            updatedAt: nowIso
          }
        }
      ]
    );

    // 3) Delete individual color config if exists
    const colorDeleteResult = await db.collection('hashtag_colors').deleteOne({ name: hashtag });

    // 4) Clean counts/aux collections
    // 4a) Remove any hashtag count docs for this tag (plain and any category-prefixed forms)
    const countsDeleteResult = await db.collection('hashtags').deleteMany({
      $or: [
        { hashtag: hashtag },
        { hashtag: { $regex: new RegExp(`^[^:]+:${hashtag}$`, 'i') } }
      ]
    });

    // 4b) Remove any stored slugs for this hashtag (plain and category-prefixed)
    const slugDeleteResult = await db.collection('hashtag_slugs').deleteMany({
      $or: [
        { hashtag: hashtag },
        { hashtag: { $regex: new RegExp(`^[^:]+:${hashtag}$`, 'i') } }
      ]
    });

    return NextResponse.json({
      success: true,
      message: `Removed hashtag "${hashtag}" from projects, partners, configs and counts`,
      result: {
        projects: {
          pulledGeneral: projPullResult.modifiedCount,
          cleanedCategorized: projCategorizedResult.modifiedCount
        },
        partners: {
          pulledGeneral: partnerPullResult.modifiedCount,
          cleanedCategorized: partnerCategorizedResult.modifiedCount
        },
        deleted: {
          hashtagColors: colorDeleteResult.deletedCount,
          hashtagsCountDocs: countsDeleteResult.deletedCount,
          hashtagSlugs: slugDeleteResult.deletedCount
        }
      }
    });

  } catch (error) {
    logError('Hashtag cleanup error', { context: 'hashtags' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { success: false, error: 'Failed to cleanup hashtag' },
      { status: 500 }
    );
  }
}
