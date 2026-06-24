#!/usr/bin/env tsx

import { getClient, getDb } from '@/lib/db';
import { classifyInvalidCustomPeriodRecord } from '@/lib/reportVariantPeriodAudit';

type RepairStrategy = 'convert-to-all-time';

function hasFlag(flag: string): boolean {
  return process.argv.includes(flag);
}

function getOptionValue(option: string): string | undefined {
  const index = process.argv.indexOf(option);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const repair = hasFlag('--repair');
  const dryRun = hasFlag('--dry-run') || !repair;
  const strategy = (getOptionValue('--strategy') || 'convert-to-all-time') as RepairStrategy;

  if (repair && strategy !== 'convert-to-all-time') {
    throw new Error(`Unsupported repair strategy: ${strategy}`);
  }

  const db = await getDb();
  const collection = db.collection('report_variants');
  const cursor = collection.find(
    { periodPreset: 'custom' },
    {
      projection: {
        ownerType: 1,
        ownerId: 1,
        name: 1,
        periodPreset: 1,
        customDateRange: 1,
      },
    }
  );

  let scanned = 0;
  let repaired = 0;
  const invalidRows = [];

  for await (const variant of cursor) {
    scanned += 1;
    const invalidRow = classifyInvalidCustomPeriodRecord(variant);
    if (!invalidRow) continue;

    invalidRows.push(invalidRow);

    if (repair) {
      await collection.updateOne(
        { _id: variant._id },
        {
          $set: {
            periodPreset: 'all_time',
            customDateRange: null,
            updatedAt: new Date().toISOString(),
          },
        }
      );
      repaired += 1;
    }
  }

  console.log(`Mode: ${dryRun ? 'dry-run' : 'repair'}`);
  console.log(`Scanned custom variants: ${scanned}`);
  console.log(`Invalid custom variants: ${invalidRows.length}`);
  console.log(`Repaired variants: ${repaired}`);

  if (invalidRows.length > 0) {
    console.table(
      invalidRows.map((row) => ({
        variantId: row.variantId,
        ownerType: row.ownerType,
        ownerId: row.ownerId,
        name: row.name,
        reason: row.reason,
      }))
    );
  }
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'Failed to audit report variant periods');
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      const client = await getClient();
      await client.close();
    } catch (error) {
      if (!process.exitCode) {
        console.error(error instanceof Error ? error.message : 'Failed to close MongoDB connection');
        process.exitCode = 1;
      }
    }
  });
