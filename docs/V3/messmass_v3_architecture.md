# {messmass} v3 -- Activity Intelligence Platform

Implementation & Migration Documentation

Author: System Architecture Proposal\
Purpose: Provide full documentation for the Dev Agent to implement the
next version of {messmass} safely.

------------------------------------------------------------------------

# 1. Objective

{messmass} must evolve from a **sports event reporting system** into a
**general activity intelligence platform** capable of supporting
multiple industries including:

-   Sports leagues and teams
-   Marketing campaigns
-   Corporate activities
-   Product tracking
-   Conferences and exhibitions

This upgrade must:

-   Preserve **all existing data**
-   Preserve **existing reports**
-   Maintain **backwards compatibility**
-   Allow **gradual migration**
-   Avoid any disruption for existing clients

------------------------------------------------------------------------

# 2. Design Principles

## Backwards Compatibility

Existing collections must remain operational:

-   Partner
-   Event
-   KYCVariables
-   Reports

These will be **mapped into the new abstraction layer**, not replaced.

------------------------------------------------------------------------

## Domain Abstraction

The new architecture must support multiple domains.

  Concept        Sports         Marketing      Corporate
  -------------- -------------- -------------- --------------
  Organisation   League/Federation Company      Organisation
  Entity         Team           Product        Department
  Activity       Match          Campaign       Event
  Participant    Team           Product        Department

------------------------------------------------------------------------

# 3. System Architecture

The system will be composed of five layers.

1.  Entity Graph
2.  Activity Graph
3.  Metrics Layer
4.  Access Control
5.  Reporting Engine

Data Flow:

User → Activity Creation → Participants → Metrics → Reporting

------------------------------------------------------------------------

# 4. Core Data Model

Represents any organisational unit in the hierarchy.

Examples: - organisation (Root) - team - department - product - partner

Structure:

-   id
-   name
-   type
-   parentEntityId
-   metadata
-   createdAt

Example:

UEFA (organisation)

Real Madrid (team)\
parentEntityId: UEFA

------------------------------------------------------------------------

## EntityRelationship

Defines permanent relationships between entities.

Structure:

-   id
-   sourceEntityId
-   targetEntityId
-   relationshipType

Examples:

Real Madrid → La Liga (member)

iPhone → Apple (product_of)

------------------------------------------------------------------------

Represents any trackable event or initiative.

Examples: - sports match - marketing campaign - product launch -
conference - internal meeting

An Activity is owned by exactly one Entity (Organization or Partner).
If owned by a Partner, the Partner's parent Organization remains the
ultimate governing body for reporting.

-   id
-   name
-   type
-   parentActivityId
-   ownerEntityId
-   startDate
-   endDate
-   metadata

Example:

Barcelona vs Real Madrid\
type: match

iPhone Launch Campaign\
type: marketing_campaign

------------------------------------------------------------------------

## ActivityParticipant

Defines the entities involved in an activity.

Structure:

-   id
-   activityId
-   entityId
-   role

Example sports match:

Barcelona → home\
Real Madrid → visitor

Example marketing campaign:

Apple → organiser\
iPhone → promoted_product

------------------------------------------------------------------------

## MetricDefinition

Defines measurable indicators.

Structure:

-   id
-   name
-   scopeType (activity or entity)
-   dataType
-   description

Examples:

Attendance\
Ad Spend\
Leads Generated

------------------------------------------------------------------------

## MetricValue

Stores captured metrics.

Structure:

-   id
-   metricId
-   activityId
-   entityId
-   value
-   recordedAt

------------------------------------------------------------------------

# 5. Reporting Model

Reports aggregate data across:

-   Entities
-   Activities
-   Participants
-   Metrics

Examples:

## League Report

League → Teams → Matches → Metrics

## Campaign Report

Campaign → Sub‑activities → Metrics

## Company Report

Company → Departments → Activities → Metrics

------------------------------------------------------------------------

# 6. Role Based Access Control (RBAC)

The system must support user-based permissions.

Entities:

User\
Role\
Permission

Example roles:

-   Admin
-   Organisation Manager
-   Analyst
-   Viewer

Example permissions:

-   create_activity
-   edit_metrics
-   view_reports
-   manage_entities

------------------------------------------------------------------------

# 7. Migration Strategy (Safe Deployment)

Migration must occur in stages.

## Phase 1 -- Preparation

Introduce new collections without modifying existing ones:

-   Entity
-   EntityRelationship
-   Activity
-   ActivityParticipant
-   MetricDefinition
-   MetricValue

No existing data touched.

------------------------------------------------------------------------

## Phase 2 -- Data Mapping

Create mapping scripts:

Partner → Entity\
Event → Activity

Populate ActivityParticipant from existing partner relationships.

------------------------------------------------------------------------

## Phase 3 -- Dual Read System

Application reads from:

Legacy collections OR New collections

This ensures existing reports remain operational.

------------------------------------------------------------------------

## Phase 4 -- New Features Only Use New Model

All newly created data must use:

Entity Activity Participants Metrics

Legacy collections become read‑only.

------------------------------------------------------------------------

## Phase 5 -- Full Migration (Optional)

Existing historical data migrated to new system once validated.

------------------------------------------------------------------------

# 8. Deployment Safety Strategy

To prevent risk to client data:

1.  Database backups before each release
2.  Feature flags for new functionality
3.  Staged rollout
4.  Migration scripts tested in staging environment
5.  Audit logging enabled

------------------------------------------------------------------------

# 9. Development Roadmap

Development should follow incremental milestones.

Milestone 1 -- Entity Layer ✅ (Implemented)
Milestone 2 -- Activity Layer ✅ (Implemented)
Milestone 3 -- Metrics Layer ✅ (Implemented)
Milestone 4 -- RBAC System ✅ (Implemented)
Milestone 5 -- Migration Engine ✅ (Implemented)
Milestone 6 -- Reporting Engine Upgrade ✅ (Implemented - v12.1.0)

------------------------------------------------------------------------

# 10. User Stories

## Entity Management

As an admin\
I want to create hierarchical entities\
So organisations can structure their teams or departments.

------------------------------------------------------------------------

## Activity Tracking

As a manager\
I want to create activities\
So I can track events, campaigns or matches.

------------------------------------------------------------------------

## Participant Assignment

As a user\
I want to assign entities to activities with roles\
So relationships between participants are clear.

------------------------------------------------------------------------

## Metrics Recording

As an analyst\
I want to record activity metrics\
So performance can be measured.

------------------------------------------------------------------------

## Reporting

As an executive\
I want aggregated reports across entities and activities\
So I can understand performance.

------------------------------------------------------------------------

# 11. GitHub Issue Breakdown

Epic 1 -- Entity System

Issues: - Create Entity model - Create EntityRelationship model - CRUD
API for entities - Entity hierarchy queries

------------------------------------------------------------------------

Epic 2 -- Activity Engine

Issues: - Activity model - Activity CRUD API - Activity hierarchy
support

------------------------------------------------------------------------

Epic 3 -- Participants

Issues: - Participant model - Role system - Participant API

------------------------------------------------------------------------

Epic 4 -- Metrics

Issues: - MetricDefinition model - MetricValue model - Metric recording
endpoints

------------------------------------------------------------------------

Epic 5 -- Migration

Issues: - Partner → Entity migration - Event → Activity migration -
Participant mapping

------------------------------------------------------------------------

Epic 6 -- Reporting

Issues: - Aggregation pipeline - Report generation API - Dashboard
queries

------------------------------------------------------------------------

# 12. Testing Strategy

Testing must include:

Unit tests\
Integration tests\
Migration validation tests

Critical verification:

-   Historical reports unchanged
-   Existing dashboards operational
-   New activities correctly tracked

------------------------------------------------------------------------

# 13. Deployment Workflow

Each development step must follow:

1.  Code implementation
2.  Automated tests
3.  Commit to GitHub
4.  Deploy to Vercel staging
5.  Migration test
6.  Production deployment

Release notes must include:

New Features\
Bug Fixes\
Known Issues\
Future Roadmap

------------------------------------------------------------------------

# 14. Expected Outcome

{messmass} becomes a **general purpose activity intelligence platform**
capable of tracking:

-   sports leagues
-   marketing campaigns
-   company initiatives
-   product launches
-   conferences

while fully preserving historical data and existing clients.

------------------------------------------------------------------------
