# Messmass v3 -- Security Model

Purpose: Protect data and ensure secure multi-organisation usage.

------------------------------------------------------------------------

# 1. Authentication

Authentication via:

JWT tokens Session authentication

------------------------------------------------------------------------

# 2. Authorisation

RBAC enforced on API routes.

Example permissions:

create_entity create_activity record_metric view_reports

------------------------------------------------------------------------

# 3. Organisation Isolation

Each entity belongs to a workspace.

Users can only access entities belonging to their organisation.

------------------------------------------------------------------------

# 4. Data Protection

Sensitive fields encrypted when required.

Passwords stored using bcrypt hashing.

------------------------------------------------------------------------

# 5. Audit Logs

All critical actions logged.

Examples:

entity creation activity updates metric modifications

------------------------------------------------------------------------

End of Security Model.
