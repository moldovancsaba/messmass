# {messmass} v3 -- MongoDB & Mongoose Schema Specification

Purpose: Define the exact database schemas and indexes for the {messmass}
v3 Activity Intelligence platform.

This document is intended for backend developers implementing the system
with:

-   Next.js
-   MongoDB
-   Mongoose
-   Vercel

The schemas below are designed to be **backwards compatible** with the
existing {messmass} v2 system.

------------------------------------------------------------------------

# 1. Entity Schema

Represents any organisational object.

Examples: - organisation (Root) - team - department - product - partner

## MongoDB Structure

-   \_id
-   name
-   type
-   parentEntityId
-   metadata
-   createdAt
-   updatedAt

## Mongoose Schema

``` javascript
import mongoose from "mongoose";

const EntitySchema = new mongoose.Schema(
{
    name: { type: String, required: true },
    type: { type: String, required: true },
    parentEntityId: { type: mongoose.Schema.Types.ObjectId, ref: "Entity", default: null },
    metadata: { type: Object, default: {} }
},
{ timestamps: true }
);

export default mongoose.models.Entity || mongoose.model("Entity", EntitySchema);
```

## Indexes

-   name
-   type
-   parentEntityId

``` javascript
EntitySchema.index({ name: 1 });
EntitySchema.index({ type: 1 });
EntitySchema.index({ parentEntityId: 1 }); // Essential for Organization -> Partner queries
```

------------------------------------------------------------------------

# 2. EntityRelationship Schema

Represents permanent relationships between entities.

Example:

Real Madrid → La Liga (member)

## Structure

-   sourceEntityId
-   targetEntityId
-   relationshipType
-   metadata

## Mongoose

``` javascript
const EntityRelationshipSchema = new mongoose.Schema(
{
    sourceEntityId: { type: mongoose.Schema.Types.ObjectId, ref: "Entity", required: true },
    targetEntityId: { type: mongoose.Schema.Types.ObjectId, ref: "Entity", required: true },
    relationshipType: { type: String, required: true },
    metadata: { type: Object, default: {} }
},
{ timestamps: true }
);

export default mongoose.models.EntityRelationship ||
mongoose.model("EntityRelationship", EntityRelationshipSchema);
```

## Indexes

-   sourceEntityId
-   targetEntityId
-   relationshipType

------------------------------------------------------------------------

# 3. Activity Schema

Represents any event, campaign, or initiative.

Examples: - sports match - marketing campaign - conference - internal
meeting

## Structure

-   name
-   type
-   parentActivityId
-   ownerEntityId
-   startDate
-   endDate
-   metadata

## Mongoose

``` javascript
const ActivitySchema = new mongoose.Schema(
{
    name: { type: String, required: true },
    type: { type: String, required: true },
    parentActivityId: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", default: null },
    ownerEntityId: { type: mongoose.Schema.Types.ObjectId, ref: "Entity", default: null },
    startDate: { type: Date },
    endDate: { type: Date },
    metadata: { type: Object, default: {} }
},
{ timestamps: true }
);

export default mongoose.models.Activity ||
mongoose.model("Activity", ActivitySchema);
```

## Indexes

-   type
-   ownerEntityId
-   startDate

------------------------------------------------------------------------

# 4. ActivityParticipant Schema

Defines which entities participate in an activity.

Examples:

Barcelona → home\
Real Madrid → visitor

## Structure

-   activityId
-   entityId
-   role
-   metadata

## Mongoose

``` javascript
const ActivityParticipantSchema = new mongoose.Schema(
{
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", required: true },
    entityId: { type: mongoose.Schema.Types.ObjectId, ref: "Entity", required: true },
    role: { type: String, required: true },
    metadata: { type: Object, default: {} }
},
{ timestamps: true }
);

export default mongoose.models.ActivityParticipant ||
mongoose.model("ActivityParticipant", ActivityParticipantSchema);
```

## Indexes

-   activityId
-   entityId
-   role

------------------------------------------------------------------------

# 5. MetricDefinition Schema

Defines measurable metrics.

Examples:

Attendance\
Ad Spend\
Leads Generated

## Structure

-   name
-   scopeType
-   dataType
-   description
-   metadata

## Mongoose

``` javascript
const MetricDefinitionSchema = new mongoose.Schema(
{
    name: { type: String, required: true },
    scopeType: { type: String, enum: ["activity", "entity"], required: true },
    dataType: { type: String, enum: ["number", "string", "boolean", "date"], required: true },
    description: { type: String },
    metadata: { type: Object, default: {} }
},
{ timestamps: true }
);

export default mongoose.models.MetricDefinition ||
mongoose.model("MetricDefinition", MetricDefinitionSchema);
```

------------------------------------------------------------------------

# 6. MetricValue Schema

Stores captured metric values.

## Structure

-   metricId
-   activityId
-   entityId
-   value
-   recordedAt

## Mongoose

``` javascript
const MetricValueSchema = new mongoose.Schema(
{
    metricId: { type: mongoose.Schema.Types.ObjectId, ref: "MetricDefinition", required: true },
    activityId: { type: mongoose.Schema.Types.ObjectId, ref: "Activity", default: null },
    entityId: { type: mongoose.Schema.Types.ObjectId, ref: "Entity", default: null },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    recordedAt: { type: Date, default: Date.now }
},
{ timestamps: true }
);

export default mongoose.models.MetricValue ||
mongoose.model("MetricValue", MetricValueSchema);
```

## Indexes

-   metricId
-   activityId
-   entityId

------------------------------------------------------------------------

# 7. RBAC Schemas

## Role

``` javascript
const RoleSchema = new mongoose.Schema({
name: String,
permissions: [String]
});
```

## User

``` javascript
const UserSchema = new mongoose.Schema({
email: String,
passwordHash: String,
roleId: { type: mongoose.Schema.Types.ObjectId, ref: "Role" }
});
```

------------------------------------------------------------------------

# 8. Recommended MongoDB Index Strategy

Critical indexes:

Entities

-   parentEntityId
-   type

Activities

-   ownerEntityId
-   startDate

Participants

-   activityId
-   entityId

Metrics

-   metricId
-   activityId

------------------------------------------------------------------------

# 9. Example Query -- League Report

Find all activities involving teams belonging to a league.

Steps:

1.  Find entities belonging to league
2.  Find participants referencing those entities
3.  Fetch activities
4.  Aggregate metrics

------------------------------------------------------------------------

# 10. Production Deployment Notes

-   All schemas must support versioning
-   Never remove legacy collections until migration complete
-   Enable MongoDB backups
-   Use feature flags for Activity Engine rollout

------------------------------------------------------------------------

End of specification.
