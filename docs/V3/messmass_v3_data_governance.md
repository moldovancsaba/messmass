# {messmass} v3 -- Data Governance & Data Modeling Rules

Purpose: Ensure consistent data structures across organisations using
{messmass}.

This prevents reporting inconsistencies and data fragmentation when
multiple teams create entities, activities and metrics.

------------------------------------------------------------------------

# 1. Entity Naming Rules

Entities must follow structured naming.

Format:

Organisation Department Team Product Partner

Examples:

Correct Real Madrid Apple Marketing Department UEFA Champions League

Incorrect Team1 Dept A Test Entity

------------------------------------------------------------------------

# 2. Entity Hierarchy Rules

Entities must follow hierarchical logic.

Example Sports:

Organisation League Team

Example Corporate:

Company Department Team

Example Marketing:

Company Product Line Product

Hierarchy depth is unlimited but recommended max = 5 levels.

------------------------------------------------------------------------

# 3. Activity Naming Standards

Activities should follow:

Activity Type + Descriptor

Examples

Match: Barcelona vs Real Madrid Campaign: iPhone 16 Launch Campaign
Event: Annual Marketing Conference

------------------------------------------------------------------------

# 4. Metric Naming Standards

Metric names must be:

Singular Descriptive Measurable

Examples

Attendance Revenue Leads Generated Social Engagement

Avoid

Score1 MetricX DataPoint

------------------------------------------------------------------------

# 5. Metric Data Types

Allowed types

Number String Boolean Date

Numbers must include unit description in metadata.

Example

Revenue (USD) Attendance (People)

------------------------------------------------------------------------

# 6. Role Definitions for Activity Participants

Standard roles

Home Visitor Organizer Sponsor Participant Speaker Attendee

Custom roles allowed but must be documented.

------------------------------------------------------------------------

# 7. Organisation Ownership

Each entity must have a clear owner organisation.

Ownership ensures access control and reporting responsibility.

------------------------------------------------------------------------

# 8. Data Retention Policy

Recommended retention:

Operational metrics: 5 years Historical reporting: unlimited Logs: 12
months

------------------------------------------------------------------------

# 9. Data Quality Rules

Required validations

Activity must have at least one participant. Metric values must match
defined data type. Entities cannot create circular parent relationships.

------------------------------------------------------------------------

End of Data Governance document.
