# Messmass v3 Architecture Diagrams

These diagrams help developers understand system structure.

------------------------------------------------------------------------

# Entity Hierarchy

``` mermaid
graph TD

Organisation --> TeamA
Organisation --> TeamB
TeamA --> DepartmentA
TeamB --> DepartmentB
```

------------------------------------------------------------------------

# Activity Participation

``` mermaid
graph TD

Activity --> EntityA
Activity --> EntityB

EntityA --> RoleHome
EntityB --> RoleVisitor
```

------------------------------------------------------------------------

# Metrics Flow

``` mermaid
graph TD

Activity --> MetricDefinition
MetricDefinition --> MetricValue
MetricValue --> Reports
```

------------------------------------------------------------------------

# System Architecture

``` mermaid
graph TD

Users --> API
API --> EntityService
API --> ActivityService
API --> MetricsService

EntityService --> MongoDB
ActivityService --> MongoDB
MetricsService --> MongoDB

MongoDB --> ReportingEngine
ReportingEngine --> Dashboard
```

------------------------------------------------------------------------

# Migration Flow

``` mermaid
graph TD

Partner --> Entity
Event --> Activity
EventParticipants --> ActivityParticipant
KYCVariables --> MetricDefinition
```
