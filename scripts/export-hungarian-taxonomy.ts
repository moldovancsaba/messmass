// scripts/export-hungarian-taxonomy.ts
import fs from "fs";
import path from "path";
import {
  SPORT_FRANCHISES_DIRECTORY,
  VENUES_DIRECTORY,
  SUPPORTER_GROUPS_DIRECTORY,
} from "../lib/brandEntityClustering";

interface ClubEntry {
  canonicalName: string;
  sport: string;
  origin: "Domestic" | "International" | "National Team";
  homeVenue?: string;
  venueWebsite?: string;
  aliases: string[];
}

const domesticClubs: Record<string, ClubEntry> = {};
const foreignClubsSet = new Set<string>([
  "celtic", "celtic fc", "hibernian", "hibernian fc",
  "hajduk", "hajduk split", "hnk hajduk split",
  "barcelona", "fc barcelona", "real madrid", "real madrid cf",
  "boca juniors", "ca boca juniors", "fc bäcker"
]);

for (const [alias, info] of Object.entries(SPORT_FRANCHISES_DIRECTORY)) {
  if (info.origin === "International") {
    foreignClubsSet.add(info.name.toLowerCase());
    foreignClubsSet.add(alias.toLowerCase());
    continue;
  }

  const cName = info.name;
  if (!domesticClubs[cName]) {
    domesticClubs[cName] = {
      canonicalName: cName,
      sport: info.sport,
      origin: info.origin,
      homeVenue: info.homeVenue,
      venueWebsite: info.venueWebsite,
      aliases: [alias],
    };
  } else {
    if (!domesticClubs[cName].aliases.includes(alias)) {
      domesticClubs[cName].aliases.push(alias);
    }
  }
}

const taxonomy = {
  $schema: "https://planet.brain/schemas/messmass/hungarian-sports-taxonomy.json",
  version: "1.0.0",
  exportedAt: new Date().toISOString(),
  domesticSports: ["Basketball", "Football", "Handball", "Ice Hockey", "Multi-Sport"],
  canonicalClubs: domesticClubs,
  venues: VENUES_DIRECTORY,
  supporterGroups: SUPPORTER_GROUPS_DIRECTORY,
  foreignClubsBlacklist: Array.from(foreignClubsSet).sort(),
};

const outputPaths = [
  path.resolve(__dirname, "../config/hungarian_sports_taxonomy.json"),
  path.resolve(__dirname, "../../fanmass/scripts/hungarian_sports_taxonomy.json"),
  path.resolve(__dirname, "../../planetbrain/Architecture/schemas/messmass/hungarian-sports-taxonomy.json"),
];

for (const p of outputPaths) {
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(taxonomy, null, 2), "utf-8");
  console.log("Successfully exported taxonomy to:", p);
}

console.log(`Taxonomy summary: ${Object.keys(domesticClubs).length} domestic clubs, ${Object.keys(VENUES_DIRECTORY).length} venues, ${Object.keys(SUPPORTER_GROUPS_DIRECTORY).length} supporter groups, ${foreignClubsSet.size} foreign blacklist entries.`);
