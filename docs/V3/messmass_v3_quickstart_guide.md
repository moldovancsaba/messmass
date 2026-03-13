# Messmass V3: Quickstart Guide (Admin)

Welcome to **Messmass V3: Activity Intelligence**. This guide explains how to use the new "General Purpose" structure to manage your organizations, teams, and data.

## 1. The Core Concept: Entities & Activities

In V3, we moved away from the fixed "Partner/Event" model to a flexible hierarchy:

-   **Entities**: These are the "who." Examples: An organization, a league, a team, or a department.
-   **Activities**: These are the "what." Examples: A match, a marketing campaign, or a production project.

### Why the change?
This allows you to group activities under different levels. A "League" entity can own multiple "Team" entities, and each can have its own activities, all rolling up to a single report.

---

## 2. Managing your Data (Automatic Mirroring)

Infrastructure is now in place for **Automated Mirroring**.

- **Admin Edits**: All changes made in the V2 Admin (Projects, Partners, Stats) are immediately mirrored to the V3 engine.
- **Backfill Complete**: All historical data (30,000+ metrics) has been backfilled into the V3 time-series engine.
- **Participant Mapping**: The system automatically understands "Home" and "Away" roles for all projects.

---

## 3. Viewing Reports

### Native Backward Compatibility
You don't need to change your report links! 
If you migrated from V2, your old links like `/report/[secure-id]` will continue to work exactly as before.

### V3 Reports
When you create a new V3 Activity, you can view its report by using its ID in the same URL structure:
`/report/[activity-id]`

The system will automatically:
1.  Lookup the activity.
2.  Find its owner (Team/Partner).
3.  Apply the correct branding (Logo/Emoji) from the Entity metadata.
4.  Render the report using your assigned template.

---

## 4. Key Improvements

-   **Speed**: V3 uses a high-performance aggregation engine for dashboard results.
-   **Accuracy**: Chart height calculations are now deterministic and more precise for dense data.
-   **Rich Metadata**: High-fidelity logos, descriptions, and sports data are now preserved for all Entities.
-   **Security**: Professional-grade rate limiting and input sanitization are active on all new ingestion endpoints.

---

## Need Help?
Contact the engineering team at `moldovancsaba@gmail.com` for technical integration details.
