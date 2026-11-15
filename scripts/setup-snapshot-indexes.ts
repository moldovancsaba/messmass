import clientPromise from "../lib/mongodb";
import config from "../lib/config";

export async function setupSnapshotIndexes() {
  console.log("Connecting to MongoDB for snapshot index initialization...");
  const client = await clientPromise;
  const db = client.db(config.dbName);
  const collection = db.collection("report_snapshots");

  // Drop unpartitioned legacy index if present (INV-001 tenant violation)
  try {
    await collection.dropIndex("scopeType_1_scopeIdentifier_1_sportFilter_1");
    console.log("Dropped unpartitioned legacy index scopeType_1_scopeIdentifier_1_sportFilter_1.");
  } catch (err: any) {
    // Ignore if does not exist
  }

  console.log("Ensuring compound index on (organizationId, scopeType, scopeIdentifier, sportFilter)...");
  try {
    await collection.createIndex(
      {
        organizationId: 1,
        scopeType: 1,
        scopeIdentifier: 1,
        sportFilter: 1,
      },
      {
        unique: true,
        name: "idx_report_snapshots_compound_scope",
        background: true,
      }
    );
  } catch (err: any) {
    console.log("Compound index creation notice:", err.message);
  }

  console.log("Ensuring TTL index on expiresAt...");
  try {
    await collection.createIndex(
      { expiresAt: 1 },
      {
        expireAfterSeconds: 0,
        background: true,
      }
    );
  } catch (err: any) {
    console.log("TTL index creation notice:", err.message);
  }

  console.log("Ensuring identifier lookup index...");
  try {
    await collection.createIndex(
      {
        organizationId: 1,
        scopeType: 1,
        identifier: 1,
      },
      {
        name: "idx_report_snapshots_identifier",
        background: true,
      }
    );
  } catch (err: any) {
    console.log("Identifier index creation notice:", err.message);
  }

  const indexes = await collection.indexes();
  console.log("Active report_snapshots indexes:", indexes.map((idx: any) => idx.name));
  return indexes;
}

if (require.main === module) {
  setupSnapshotIndexes()
    .then(() => {
      console.log("Successfully initialized report_snapshots indexes.");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Failed to initialize report_snapshots indexes:", err);
      process.exit(1);
    });
}
