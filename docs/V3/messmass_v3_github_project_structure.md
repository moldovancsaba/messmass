# Messmass v3 GitHub Project Structure

Purpose: Provide a structured delivery plan for development teams.

------------------------------------------------------------------------

# Project Board Structure

Columns:

Backlog Ready In Progress Code Review Testing Done

------------------------------------------------------------------------

# EPIC 1 -- Entity System

Goal: Implement organisational hierarchy.

Issues:

-   Create Entity model
-   Create EntityRelationship model
-   Implement entity CRUD API
-   Implement entity hierarchy queries

------------------------------------------------------------------------

# EPIC 2 -- Activity Engine

Goal: Replace event system with generic activities.

Issues:

-   Activity model
-   Activity CRUD API
-   Activity hierarchy support
-   Activity search API

------------------------------------------------------------------------

# EPIC 3 -- Participants

Goal: Define entities participating in activities.

Issues:

-   ActivityParticipant schema
-   Role system (home/visitor/organiser)
-   Participant assignment API

------------------------------------------------------------------------

# EPIC 4 -- Metrics System

Goal: Replace KYC variables.

Issues:

-   MetricDefinition schema
-   MetricValue schema
-   Metric input API
-   Metric aggregation queries

------------------------------------------------------------------------

# EPIC 5 -- Migration Engine

Goal: Safely convert legacy data.

Issues:

-   Partner → Entity migration script
-   Event → Activity migration script
-   KYC → Metric migration

------------------------------------------------------------------------

# EPIC 6 -- Reporting Upgrade

Goal: Build reporting on new architecture.

Issues:

-   Aggregation pipeline
-   Entity activity reports
-   Activity metric reports
-   Dashboard queries

------------------------------------------------------------------------

# Milestones

Milestone 1 -- Entity Layer

Milestone 2 -- Activity Engine

Milestone 3 -- Metrics Layer

Milestone 4 -- Migration System

Milestone 5 -- Reporting Engine

------------------------------------------------------------------------

# Labels

architecture backend migration reporting api testing
