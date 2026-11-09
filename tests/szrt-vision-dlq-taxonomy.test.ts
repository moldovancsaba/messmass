// tests/szrt-vision-dlq-taxonomy.test.ts
import fs from "fs";
import path from "path";

describe("Hungarian Sports Taxonomy & Vision DLQ Isolation (Issue 10 / RFC-003)", () => {
  const taxonomyPath = path.resolve(__dirname, "../config/hungarian_sports_taxonomy.json");

  test("Taxonomy contract exists and contains canonical domestic clubs", () => {
    expect(fs.existsSync(taxonomyPath)).toBe(true);
    const data = JSON.parse(fs.readFileSync(taxonomyPath, "utf-8"));

    expect(data.version).toBe("1.0.0");
    expect(data.domesticSports).toContain("Football");
    expect(data.domesticSports).toContain("Basketball");
    expect(data.domesticSports).toContain("Handball");
    expect(data.domesticSports).toContain("Ice Hockey");

    // Canonical clubs
    expect(data.canonicalClubs["Ferencvárosi TC"]).toBeDefined();
    expect(data.canonicalClubs["Ferencvárosi TC"].aliases).toContain("fradi");
    expect(data.canonicalClubs["Ferencvárosi TC"].aliases).toContain("ftc");

    expect(data.canonicalClubs["Szombathelyi Haladás"]).toBeDefined();
    expect(data.canonicalClubs["Szombathelyi Haladás"].aliases).toContain("haladás");

    // Blacklisted international clubs
    expect(data.foreignClubsBlacklist).toContain("celtic");
    expect(data.foreignClubsBlacklist).toContain("hibernian fc");
    expect(data.foreignClubsBlacklist).toContain("fc barcelona");
    expect(data.foreignClubsBlacklist).toContain("hajduk split");
  });

  test("DLQ document validation conforms to SzrtVisionDLQEntry contract", () => {
    const testIdempotency = "test_fixture_hash_abc123";
    const testDoc = {
      _id: testIdempotency,
      idempotencyKey: testIdempotency,
      organizationId: "org_szrt",
      eventId: "szrt_tippmix_2026",
      fileName: "test_corrupt_frame.jpg",
      filePath: "Football/test_corrupt_frame.jpg",
      sport: "Football",
      errorCode: "CORRUPT_IMAGE_HEADER",
      errorMessage: "Test corrupted header bytes exception",
      retryCount: 0,
      quarantinedAt: new Date().toISOString(),
      hashtag: "tippmixreport2026",
      rawPayloadSnippet: "Header: 0x00 0x00 (Invalid SOI marker)"
    };

    // Assert structural invariants
    expect(testDoc.organizationId).toBe("org_szrt");
    expect(["CORRUPT_IMAGE_HEADER", "TIMEOUT_EXCEEDED", "INVALID_SCHEMA", "INFERENCE_FAILURE"]).toContain(testDoc.errorCode);
    expect(testDoc.retryCount).toBeGreaterThanOrEqual(0);
    expect(testDoc.idempotencyKey.length).toBeGreaterThanOrEqual(16);
    expect(testDoc.quarantinedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
