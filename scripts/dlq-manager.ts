import clientPromise from "../lib/mongodb";

async function main() {
  const args = process.argv.slice(2);
  const isRedrive = args.includes("--redrive");

  const client = await clientPromise;
  const db = client.db();
  const dlqCol = db.collection("szrt_vision_dlq");

  if (!isRedrive) {
    const total = await dlqCol.countDocuments();
    const errorAgg = await dlqCol.aggregate([
      { $group: { _id: "$errorCode", count: { $sum: 1 } } }
    ]).toArray();
    const sportAgg = await dlqCol.aggregate([
      { $group: { _id: "$sport", count: { $sum: 1 } } }
    ]).toArray();

    console.log("\n=== SZRT VISION DEAD-LETTER QUEUE (DLQ) STATS ===");
    console.log(`Total Quarantined Items: ${total}`);
    console.log("\nBreakdown by Error Code:");
    if (errorAgg.length === 0) console.log("  (No quarantined items)");
    for (const item of errorAgg) {
      console.log(`  ${item._id || "UNKNOWN"}: ${item.count}`);
    }
    console.log("\nBreakdown by Sport:");
    for (const item of sportAgg) {
      console.log(`  ${item._id || "N/A"}: ${item.count}`);
    }
    console.log("==================================================\n");
  } else {
    const eventIdArg = args.find((a) => a.startsWith("--eventId="));
    const eventId = eventIdArg ? eventIdArg.split("=")[1] : null;
    const filter: Record<string, any> = {};
    if (eventId) filter.eventId = eventId;

    const count = await dlqCol.countDocuments(filter);
    console.log(`Re-driving ${count} items from DLQ for eventId=${eventId || "ALL"}...`);
    const res = await dlqCol.updateMany(filter, {
      $inc: { retryCount: 1 },
      $set: { lastRedriveAt: new Date().toISOString() }
    });
    console.log(`Updated ${res.modifiedCount} records. Ready for worker reprocessing.\n`);
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("DLQ Manager error:", err);
  process.exit(1);
});
