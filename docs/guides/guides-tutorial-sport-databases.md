# Tutorial: Sport databases
Status: Active
Last Updated: 2026-07-20T00:00:00.000Z
Canonical: Yes
Owner: Documentation

> Audience: Operators and technical implementers · Prerequisites: Admin sign-in, at least one partner created · Related: [Partners](guides-tutorial-partners.md), [Events](guides-tutorial-events.md), [Bitly integration](guides-tutorial-bitly.md)

## What it is & why it matters

messmass can enrich your **partners** (clubs, teams, venues) with authoritative sports data pulled from three external providers, and it can use their **fixtures** to pre-create events for you. All three are inbound only — messmass reads from them and writes the result onto your own records; it never pushes data back out.

Enrichment fills in the things that make a partner and its reports look complete:

- **Hashtags** (country, league, sport) generated from official metadata.
- **Crests / logos** hosted on your own image store.
- **Venue capacity** and city.
- **League / competition** membership.

Fixture data goes one step further: a scheduled match between two teams can become a draft event in messmass, so operators do not have to key in "Team A x Team B" by hand.

The three providers overlap deliberately. Pick based on the sport and what you need:

| Provider | Library | Best for |
|----------|---------|----------|
| **Football-Data.org** | `lib/footballDataApi.ts` | Top-flight European football: official team IDs, competitions, crests, and fixture-driven event creation |
| **API-Football / API-Sports** | `lib/api-football.ts` | Multi-sport coverage (soccer, basketball, handball, hockey, volleyball) and venue capacity, via batch enrichment |
| **TheSportsDB** | `lib/sportsDbApi.ts` | The broadest catalogue and interactive team/venue lookup straight from the partner UI; a good fallback and for one-off searches |

### Which one should I use?

- **You run a Premier League / La Liga / Serie A / Bundesliga / Ligue 1 club and want events created from the schedule.** Use **Football-Data.org**. It gives you official team IDs and competitions, and its fixtures can drive draft event and draft partner creation.
- **Your partner plays basketball, handball, ice hockey or volleyball, or you want venue capacity across many sports.** Use **API-Football / API-Sports**. It searches five sports and stores venue capacity, city and logo.
- **You just need to find a team quickly, grab a crest, or cover a club the other two miss.** Use **TheSportsDB**. Its search and lookup are wired into the partner UI for interactive use, and it has the widest catalogue.

Nothing stops you using more than one: each provider writes into a different part of the partner record, so they coexist. A common pattern is Football-Data.org for fixtures and hashtags on major football clubs, with TheSportsDB filling gaps for smaller clubs.

## Before you start

1. **Sign in as an admin.** Every sport-data route is admin-only.
2. **Provide the API keys you intend to use** as environment variables (names only — never paste key values):
   - Football-Data.org: `FOOTBALL_DATA_API_TOKEN` (optional: `FOOTBALL_DATA_BASE_URL`).
   - API-Football / API-Sports: `API_FOOTBALL_KEY`.
   - TheSportsDB: `SPORTSDB_API_KEY` (optional: `SPORTSDB_BASE_URL`; a limited free-tier key is used if none is set).
3. **Create the partners you want to enrich** first. See [Partners](guides-tutorial-partners.md).
4. **Mind the free-tier rate limits.** Each client throttles itself, but the limits are real. Enrichment therefore runs in small, spaced batches.

| Provider | Free-tier limit | How the client copes |
|----------|-----------------|----------------------|
| Football-Data.org | ~10 requests / minute | Spaces requests ~6.5s apart; retries once on 429 |
| TheSportsDB | 3 requests / minute | Queues and waits for the window to reset; caches results |
| API-Football | ~100 requests / day per sport | 24-hour cooldown between enrichment runs; 5 partners per run |

## Step by step

### A. Football-Data.org — link a partner and sync fixtures

**Link a partner to an official team.** Send the team's Football-Data ID to link it:

- `POST /api/partners/link-football-data` with body `{ partnerId, footballDataTeamId }`.

This fetches the team from Football-Data.org, generates country/league/sport hashtags and merges them into the partner, uploads the crest to your image store and stores it as the partner's `logoUrl` (if one is not set), and records a `footballData` block (team id, name, short name, three-letter abbreviation, crest, competitions, last-synced timestamp) on the partner.

**Sync fixtures.** Refresh the fixture cache with:

- `POST /api/football-data/sync` with an optional body `{ competitionIds, status, dateFrom, dateTo }`. If you send no `competitionIds`, it syncs a default set of major competitions (Premier League, La Liga, Serie A, Bundesliga, Ligue 1, Brasileirão, Champions League). It imports fixtures into a local cache, then matches them to partners by team ID.

Browse the cached fixtures without hitting the external API via `GET /api/football-data/fixtures`.

### B. API-Football / API-Sports — enrich partners across sports

Trigger a batch enrichment run:

- `POST /api/api-football/enrich-partners`.

Each run takes the next **5** partners that have not yet been enriched, searches each supported sport (soccer, basketball, handball, hockey, volleyball) for a matching team, and on the first match stores an `enrichedData.apiFootball` block containing the team ID, sport, country, founded year, logo, and venue details including **capacity**, address and city. To respect the daily quota there is a **24-hour cooldown**: the run can only fire once per day.

Check whether the button should be enabled with:

- `GET /api/api-football/enrich-partners` — returns whether a run is currently allowed, how many partners remain unenriched, and when the next run becomes available.

### C. TheSportsDB — search and look up from the partner UI

TheSportsDB powers interactive lookups when you are working on a partner:

- **Search** a team by name: `GET /api/sports-db/search?type=team&query=<name>`.
- **Look up** full details (including stadium capacity) once you have an ID: `GET /api/sports-db/lookup`.
- **Sync** upcoming fixtures for all partners that have a TheSportsDB team ID, then match them: `POST /api/sports-db/sync`.
- **Browse** the cached fixtures: `GET /api/sports-db/fixtures` (filter by `partnerId`, `teamId`, date range or status).
- **Create a draft event** in one click from a cached fixture: `POST /api/sports-db/fixtures/draft`.

### Endpoint reference

| Provider | Purpose | Endpoint |
|----------|---------|----------|
| Football-Data.org | Link a partner to a team | `POST /api/partners/link-football-data` |
| Football-Data.org | Sync fixtures for competitions | `POST /api/football-data/sync` |
| Football-Data.org | Read cached fixtures | `GET /api/football-data/fixtures` |
| API-Football | Enrich the next batch of partners | `POST /api/api-football/enrich-partners` |
| API-Football | Check enrichment status / cooldown | `GET /api/api-football/enrich-partners` |
| TheSportsDB | Search team by name | `GET /api/sports-db/search?type=team&query=…` |
| TheSportsDB | Look up team / venue / league by ID | `GET /api/sports-db/lookup` |
| TheSportsDB | Sync + match fixtures for all partners | `POST /api/sports-db/sync` |
| TheSportsDB | Read cached fixtures | `GET /api/sports-db/fixtures` |
| TheSportsDB | One-click draft event from a fixture | `POST /api/sports-db/fixtures/draft` |

### Worked example: enrich a basketball club

1. Create the partner (for example "KK Partizan") — see [Partners](guides-tutorial-partners.md).
2. Check the enrichment status with `GET /api/api-football/enrich-partners`; if a run is allowed and the partner is unenriched, it will be picked up.
3. Trigger `POST /api/api-football/enrich-partners`. The run searches soccer first, then basketball, and on the basketball match stores `enrichedData.apiFootball` with the arena's capacity and city.
4. Open the partner and confirm the matched team is correct before relying on the capacity in a report.
5. A day later (after the cooldown), run enrichment again to pick up the next five partners.

## Managing it

- **Fixtures can create events for you.** Cached fixtures are the raw material for automatic event creation. For Football-Data, the importer can create a draft partner for an unknown opponent and a draft event for a fixture whose home team already exists as a partner; a bulk pass can do this across the whole fixture cache. TheSportsDB offers the same idea through its one-click "draft" endpoint.
- **Two feature flags govern automatic creation** (Football-Data path), set as environment variables:
  - `FOOTBALL_DATA_AUTO_CREATE_PROJECTS` — auto-create draft events from fixtures (default on).
  - `FOOTBALL_DATA_AUTO_CREATE_PARTNERS` — auto-create draft partners for opponents not yet in your database (default on).
  - `FOOTBALL_DATA_SYNC_INTERVAL_HOURS` tunes how often scheduled syncs run (default 6).
  Turn a flag off (set it to `false`) if you would rather review and create events manually.
- **Enrichment is additive.** Linking or enriching a partner merges new hashtags with existing ones and only fills a logo if one is not already present — it does not overwrite your curated data wholesale.
- **Re-run to refresh.** Because each provider stamps a last-synced time, you can re-link or re-enrich later to pull fresher metadata.

### What lands on the partner record

Each provider writes to a distinct field so they never collide:

| Provider | Partner field | Notable contents |
|----------|---------------|------------------|
| Football-Data.org | `footballData` | Official team ID, name, abbreviation, crest, competitions, last-synced time; plus merged hashtags and a `logoUrl` |
| API-Football | `enrichedData.apiFootball` | Team ID, sport, country, founded year, logo, and venue name/city/capacity |
| TheSportsDB | Team/venue lookups | Stadium capacity, crest and league metadata surfaced through search and lookup |

### Environment variables at a glance

| Variable | Provider | Purpose |
|----------|----------|---------|
| `FOOTBALL_DATA_API_TOKEN` | Football-Data.org | API access token (required to use it) |
| `FOOTBALL_DATA_BASE_URL` | Football-Data.org | Override the API base URL (optional) |
| `FOOTBALL_DATA_SYNC_INTERVAL_HOURS` | Football-Data.org | Scheduled sync cadence (default 6) |
| `FOOTBALL_DATA_AUTO_CREATE_PROJECTS` | Football-Data.org | Auto-create draft events from fixtures (default on) |
| `FOOTBALL_DATA_AUTO_CREATE_PARTNERS` | Football-Data.org | Auto-create draft partners for unknown opponents (default on) |
| `API_FOOTBALL_KEY` | API-Football / API-Sports | API access key (required to use it) |
| `SPORTSDB_API_KEY` | TheSportsDB | API key (a limited free key is used if unset) |
| `SPORTSDB_BASE_URL` | TheSportsDB | Override the API base URL (optional) |

## Gotchas & good practice

- **Choose the right provider for the sport.** Football-Data.org is football-only and strongest for major European leagues; reach for API-Football when the partner plays basketball, handball, hockey or volleyball, or when you want venue capacity across sports; use TheSportsDB for interactive search and the widest catalogue.
- **Respect the quotas.** The 24-hour cooldown on API-Football enrichment and the 3-per-minute TheSportsDB limit are there for a reason. Batch runs are intentionally small; do not try to force a full backfill in one sitting.
- **Fuzzy name matching can mis-match.** API-Football searches by cleaned partner name and takes the first hit. After an enrichment run, spot-check that the matched team is actually the right club before trusting its crest or capacity.
- **Draft events are drafts.** Auto-created events are pre-populated for planning. Review names, dates and hashtags before you collect data against them or publish a report.
- **Keys are environment-only.** `FOOTBALL_DATA_API_TOKEN`, `API_FOOTBALL_KEY` and `SPORTSDB_API_KEY` must live in the environment, never in the UI or a spreadsheet.

> Note: Coverage differs by plan. A free Football-Data.org plan exposes a limited set of competitions; if a partner's league is not covered, its competitions list may come back empty even though the team links successfully.

### Quick troubleshooting

| Symptom | Likely cause | What to do |
|---------|--------------|------------|
| "not configured" error on a sync/enrich call | The relevant API key env var is unset | Set `FOOTBALL_DATA_API_TOKEN`, `API_FOOTBALL_KEY` or `SPORTSDB_API_KEY` as appropriate |
| Enrichment says "already run today" | 24-hour API-Football cooldown | Wait for the reported next-available time, then re-run |
| A partner got the wrong team's crest/capacity | Fuzzy name match took the wrong hit | Correct it on the partner; re-link with an explicit team ID where possible |
| Fixtures did not appear | Competition not in your synced set or plan | Pass explicit `competitionIds` to the football-data sync, or check plan coverage |
| Search returns nothing on TheSportsDB | Rate limit or spelling | Wait for the 3/min window; try the club's common name |

## How it connects

- **Partners** are the destination for all enrichment — the hashtags, crest, capacity and league all land on the partner record. See [Partners](guides-tutorial-partners.md) and the technical [partners system guide](../features/features-partners-system-guide.md).
- **Events** are what fixtures become. The Sports Match Builder and the draft-creation endpoints both produce events from two partners. See [Events](guides-tutorial-events.md).
- **Bitly and reports** benefit indirectly: richer partner metadata (crest, league, hashtags) flows into the events created from those partners and into their reports. See [Bitly integration](guides-tutorial-bitly.md) and [Reports](guides-tutorial-reports.md).

## Screenshots
_Screenshots to be added._

## Related tutorials

- [Partners](guides-tutorial-partners.md)
- [Events](guides-tutorial-events.md)
- [Bitly integration](guides-tutorial-bitly.md)
- [Google Sheets sync](guides-tutorial-google-sheets.md)
- [Authentication, roles & SSO](guides-tutorial-authentication-sso.md)
