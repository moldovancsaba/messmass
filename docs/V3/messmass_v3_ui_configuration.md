# {messmass} v3 -- UI Configuration & Industry Templates

Purpose: Allow {messmass} to support multiple industries using
configurable UI labels and modules.

------------------------------------------------------------------------

# 1. Configurable Labels

UI labels should be configurable per workspace.

Examples

Entity → Team (Sports template) Entity → Product (Marketing template)
Entity → Department (Corporate template)

Activity → Match Activity → Campaign Activity → Event

------------------------------------------------------------------------

# 2. Industry Templates

Templates define default configuration.

Sports Template

Entities League Team Stadium

Activities Match Tournament Conference

Metrics Attendance Security Incidents TV Audience

------------------------------------------------------------------------

Marketing Template

Entities Company Product Line Product

Activities Campaign Launch Event Promotion

Metrics Ad Spend Leads Generated Conversion Rate

------------------------------------------------------------------------

Corporate Template

Entities Company Department Team

Activities Meeting Workshop Initiative

Metrics Participants Budget ROI

------------------------------------------------------------------------

# 3. Feature Flags

Feature flags allow progressive rollout.

Examples

activity_engine_enabled new_reporting_engine dynamic_metrics

------------------------------------------------------------------------

# 4. Role-Based UI

The UI must adapt based on role.

Admin

Full access

Manager

Create activities Manage entities

Analyst

View reports Enter metrics

Viewer

Read-only access

------------------------------------------------------------------------

End of UI configuration document.
