// app/api/brand-assets/route.ts
// WHAT: Unified Brand Asset & Logo Management API for {messmass}.
// WHY: Single source of truth for original brand logos across all reports.
//      When an official logo is uploaded or updated here, all reports reflect it automatically.

import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { ObjectId } from 'mongodb';
import { requireSession } from '@/lib/apiGuards';
import { CHART_COLOR } from '@/lib/theme/chartPalette';

export const dynamic = 'force-dynamic';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * GET /api/brand-assets
 * Returns all registered brand assets, augmented with any brands discovered by Fanmass Vision.
 */
export async function GET() {
  const authError = await requireSession();
  if (authError) return authError;

  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);

    // 1. Fetch all registered brand assets
    const registeredAssets = await db
      .collection('brand_assets')
      .find({})
      .sort({ name: 1 })
      .toArray();

    // 2. Discover brands from Vision progress (to show newly detected brands needing logos)
    const visionDoc =
      (await db.collection('szrt_vision_progress').findOne({ _id: 'szrt_progress' as any })) ||
      (await client.db('messmass').collection('szrt_vision_progress').findOne({ _id: 'szrt_progress' as any }));

    const discoveredBrands: string[] = [];
    if (visionDoc?.aggregates?.topBrands) {
      for (const b of visionDoc.aggregates.topBrands) {
        if (b.brand && !discoveredBrands.includes(b.brand)) {
          discoveredBrands.push(b.brand);
        }
      }
    }

    // Map registered by slug
    const registeredSlugMap = new Map<string, any>();
    for (const asset of registeredAssets) {
      registeredSlugMap.set(asset.canonicalSlug, asset);
      if (asset.aliases && Array.isArray(asset.aliases)) {
        for (const alias of asset.aliases) {
          registeredSlugMap.set(slugify(alias), asset);
        }
      }
    }

    // Merge discovered brands that don't have an asset yet
    const unconfigured: any[] = [];
    for (const brand of discoveredBrands) {
      const slug = slugify(brand);
      if (!registeredSlugMap.has(slug)) {
        unconfigured.push({
          name: brand,
          canonicalSlug: slug,
          aliases: [brand.toLowerCase()],
          logoUrl: '',
          darkLogoUrl: '',
          isDiscovered: true,
        });
      }
    }

    return NextResponse.json({
      success: true,
      assets: registeredAssets,
      unconfigured,
      totalRegistered: registeredAssets.length,
      totalDiscovered: discoveredBrands.length,
    });
  } catch (err: any) {
    console.error('Failed to fetch brand assets:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/brand-assets
 * Create or update a brand asset with its official logo URL.
 */
export async function POST(request: NextRequest) {
  const authError = await requireSession();
  if (authError) return authError;

  try {
    const client = await clientPromise;
    const db = client.db(config.dbName);

    const contentType = request.headers.get('content-type') || '';
    let name = '';
    let logoUrl = '';
    let darkLogoUrl = '';
    let category = '';
    let accentColor = '';
    let aliases: string[] = [];

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      name = (formData.get('name') as string) || '';
      logoUrl = (formData.get('logoUrl') as string) || '';
      darkLogoUrl = (formData.get('darkLogoUrl') as string) || '';
      category = (formData.get('category') as string) || '';
      accentColor = (formData.get('accentColor') as string) || '';
      const rawAliases = (formData.get('aliases') as string) || '';
      aliases = rawAliases ? rawAliases.split(',').map((s) => s.trim().toLowerCase()) : [];

      const file = formData.get('file') as File | null;
      if (file && file.size > 0) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const fileName = (file.name || '').toLowerCase();
        const isSvg =
          fileName.endsWith('.svg') ||
          (file.type && file.type.includes('svg')) ||
          buffer.subarray(0, 500).toString('utf8').includes('<svg');

        // 1. Try Cloudflare R2 storage (standard CDN storage for {messmass})
        try {
          const { storeMedia } = await import('@/lib/mediaStorage');
          const stored = await storeMedia(buffer, { folder: 'brand-logos' });
          if (stored?.url) {
            logoUrl = stored.url;
          }
        } catch (r2Err) {
          console.warn('R2 storage attempt skipped/failed:', r2Err);
        }

        // 2. If R2 didn't yield a URL:
        if (!logoUrl) {
          if (isSvg) {
            // Official SVG vector: embed as clean base64 data URI so it remains 100% self-contained, razor-sharp, and permanent
            logoUrl = `data:image/svg+xml;base64,${buffer.toString('base64')}`;
          } else {
            // Raster image (PNG, WEBP, JPG): mirror to ImgBB if key configured
            const apiKey = process.env.IMGBB_API_KEY || process.env.NEXT_PUBLIC_IMGBB_API_KEY;
            if (apiKey) {
              try {
                const imgbbForm = new URLSearchParams();
                imgbbForm.append('key', apiKey);
                imgbbForm.append('image', buffer.toString('base64'));
                imgbbForm.append('name', `brand-logo-${slugify(name)}`);

                const uploadRes = await fetch('https://api.imgbb.com/1/upload', {
                  method: 'POST',
                  body: imgbbForm,
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                });
                const uploadJson = await uploadRes.json();
                if (uploadJson.success && uploadJson.data?.url) {
                  logoUrl = uploadJson.data.url;
                }
              } catch (imgbbErr) {
                console.warn('ImgBB upload skipped/failed:', imgbbErr);
              }
            }

            if (!logoUrl) {
              const mime = file.type || 'image/png';
              logoUrl = `data:${mime};base64,${buffer.toString('base64')}`;
            }
          }
        }
      }
    } else {
      const body = await request.json();

      // ACTION 1: Merge duplicate brands into a canonical target brand
      if (body.action === 'merge') {
        const targetBrand = (body.targetBrand || '').trim();
        const sourceBrands: string[] = Array.isArray(body.sourceBrands)
          ? body.sourceBrands.map((s: string) => s.trim()).filter(Boolean)
          : [];

        if (!targetBrand || sourceBrands.length === 0) {
          return NextResponse.json(
            { success: false, error: 'targetBrand and at least one sourceBrand are required' },
            { status: 400 }
          );
        }

        const targetSlug = slugify(targetBrand);

        // 1. Fetch or create target brand asset
        let targetAsset = await db.collection('brand_assets').findOne({ canonicalSlug: targetSlug });
        const existingAliases: string[] = targetAsset?.aliases || [targetBrand.toLowerCase()];

        // 2. Add source brand names and their aliases to target's aliases
        for (const src of sourceBrands) {
          const sLower = src.toLowerCase();
          if (!existingAliases.includes(sLower)) {
            existingAliases.push(sLower);
          }
          // Save persistent alias mapping so Vision worker automatically remaps it
          await db.collection('brand_canonical_mappings').replaceOne(
            { alias: sLower },
            { alias: sLower, canonical: targetBrand, updatedAt: new Date().toISOString() },
            { upsert: true }
          );
        }

        // Upsert target brand asset with combined aliases
        await db.collection('brand_assets').updateOne(
          { canonicalSlug: targetSlug },
          {
            $set: {
              name: targetBrand,
              canonicalSlug: targetSlug,
              aliases: existingAliases,
              updatedAt: new Date().toISOString(),
            },
            $setOnInsert: {
              logoUrl: targetAsset?.logoUrl || '',
              darkLogoUrl: targetAsset?.darkLogoUrl || '',
              category: 'sponsor',
              accentColor: CHART_COLOR.blueDark,
            },
          },
          { upsert: true }
        );

        // 3. Remove standalone brand_assets for merged source brands
        const sourceSlugs = sourceBrands.map((s) => slugify(s));
        await db.collection('brand_assets').deleteMany({
          canonicalSlug: { $in: sourceSlugs.filter((s) => s !== targetSlug) },
        });

        // 4. Update image analyses in szrt_vision_analysis
        for (const src of sourceBrands) {
          if (src === targetBrand) continue;
          await db.collection('szrt_vision_analysis').updateMany(
            { brands: src },
            { $addToSet: { brands: targetBrand } }
          );
          await db.collection('szrt_vision_analysis').updateMany(
            { brands: src },
            { $pull: { brands: src } as any }
          );
        }

        // 5. Update szrt_vision_progress aggregates
        const progressDoc = await db.collection('szrt_vision_progress').findOne({ _id: 'szrt_progress' as any });
        if (progressDoc?.aggregates?.topBrands) {
          const brandMap = new Map<string, number>();
          for (const b of progressDoc.aggregates.topBrands) {
            const bName = sourceBrands.includes(b.brand) ? targetBrand : b.brand;
            brandMap.set(bName, (brandMap.get(bName) || 0) + (b.count || 0));
          }
          const updatedTopBrands = Array.from(brandMap.entries())
            .map(([brand, count]) => ({ brand, count }))
            .sort((a, b) => b.count - a.count);

          await db.collection('szrt_vision_progress').updateOne(
            { _id: 'szrt_progress' as any },
            {
              $set: {
                'aggregates.topBrands': updatedTopBrands,
                lastUpdated: new Date().toISOString(),
              },
            }
          );
        }

        return NextResponse.json({
          success: true,
          message: `Successfully merged ${sourceBrands.length} brand(s) into ${targetBrand}. All past sightings and future vision detections are unified.`,
          targetBrand,
          aliases: existingAliases,
        });
      }

      // ACTION 2: Move a brand entry to Clubs (Sports Club / Jersey Reclassification)
      if (body.action === 'move-to-club') {
        const brandName = (body.brandName || '').trim();
        const clubName = (body.clubName || brandName).trim();

        if (!brandName) {
          return NextResponse.json({ success: false, error: 'brandName is required' }, { status: 400 });
        }

        // 1. Record in reclassified_clubs so vision worker diverts future sightings to clubs
        await db.collection('reclassified_clubs').replaceOne(
          { name: brandName.toLowerCase() },
          {
            name: brandName.toLowerCase(),
            clubName,
            originalBrand: brandName,
            reclassifiedAt: new Date().toISOString(),
          },
          { upsert: true }
        );

        // 2. Reclassify in szrt_vision_analysis: pull from brands and add to clubs
        const updateRes = await db.collection('szrt_vision_analysis').updateMany(
          { brands: brandName },
          {
            $addToSet: { clubs: clubName },
            $pull: { brands: brandName },
          }
        );

        // 3. Update szrt_vision_progress aggregates
        const progressDoc = await db.collection('szrt_vision_progress').findOne({ _id: 'szrt_progress' as any });
        if (progressDoc?.aggregates) {
          let movedCount = 0;
          const updatedBrands = (progressDoc.aggregates.topBrands || []).filter((b: any) => {
            if (b.brand === brandName) {
              movedCount = b.count;
              return false;
            }
            return true;
          });

          const clubsMap = new Map<string, number>();
          for (const c of progressDoc.aggregates.topClubs || []) {
            clubsMap.set(c.club, c.count);
          }
          clubsMap.set(clubName, (clubsMap.get(clubName) || 0) + (movedCount || 1));

          const updatedClubs = Array.from(clubsMap.entries())
            .map(([club, count]) => ({ club, count }))
            .sort((a, b) => b.count - a.count);

          await db.collection('szrt_vision_progress').updateOne(
            { _id: 'szrt_progress' as any },
            {
              $set: {
                'aggregates.topBrands': updatedBrands,
                'aggregates.topClubs': updatedClubs,
                lastUpdated: new Date().toISOString(),
              },
            }
          );
        }

        // 4. Remove from brand_assets if present
        await db.collection('brand_assets').deleteOne({ canonicalSlug: slugify(brandName) });

        return NextResponse.json({
          success: true,
          message: `Successfully reclassified '${brandName}' as a Sports Club ('${clubName}'). Sightings moved from brands to clubs.`,
          brandName,
          clubName,
          modifiedImages: updateRes.modifiedCount,
        });
      }

      name = body.name || '';
      logoUrl = body.logoUrl || '';
      darkLogoUrl = body.darkLogoUrl || '';
      category = body.category || 'sponsor';
      accentColor = body.accentColor || '';
      aliases = body.aliases || [];
    }

    if (!name.trim()) {
      return NextResponse.json({ success: false, error: 'Brand name is required' }, { status: 400 });
    }

    const canonicalSlug = slugify(name);
    if (!aliases.includes(name.toLowerCase())) {
      aliases.push(name.toLowerCase());
    }

    const doc = {
      name: name.trim(),
      canonicalSlug,
      aliases,
      logoUrl: logoUrl.trim(),
      darkLogoUrl: darkLogoUrl.trim(),
      category,
      accentColor: accentColor.trim(),
      updatedAt: new Date().toISOString(),
    };

    // Upsert into brand_assets
    const result = await db.collection('brand_assets').replaceOne(
      { canonicalSlug },
      doc,
      { upsert: true }
    );

    // Also mirror to secondary messmass db in cluster if exists
    try {
      await client.db('messmass').collection('brand_assets').replaceOne(
        { canonicalSlug },
        doc,
        { upsert: true }
      );
    } catch {
      // Best effort
    }

    return NextResponse.json({
      success: true,
      asset: { ...doc, _id: result.upsertedId || canonicalSlug },
    });
  } catch (err: any) {
    console.error('Failed to save brand asset:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
