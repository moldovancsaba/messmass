# Requirements Document

## Introduction

This specification defines the requirements for enabling Fanmass (third-party fan identification service) to integrate with the MessMass platform for bidirectional data exchange. The system will allow Fanmass to retrieve event information from MessMass, receive notifications when events are updated, process images to identify fans, and inject enriched fan data back into MessMass to enhance the KYC (Know Your Customer) statistics system.

**Integration Flow:**
1. MessMass provides event information to Fanmass via existing Public API (`GET /api/public/events/[id]`)
2. MessMass notifies Fanmass when event information is updated via new webhook system
3. Fanmass processes event images and identifies fans with detailed demographics
4. Fanmass injects enriched fan data back into MessMass via new data injection API (`POST /api/public/events/[id]/stats`)
5. MessMass stores the enriched data in the KYC system for analytics

**Existing Infrastructure (Reuse):**
- ✅ Bearer token authentication (`lib/apiAuth.ts`)
- ✅ User management with `apiKeyEnabled` flag (`lib/users.ts`)
- ✅ Rate limiting (1000 req/min for authenticated users)
- ✅ CORS support and logging
- ✅ Public API read endpoints (`/api/public/events`, `/api/public/partners`)

**New Components (Build):**
- 📝 Write endpoint for stats injection (`POST /api/public/events/[id]/stats`)
- 📝 Write permission checking (extend existing auth or add `apiWriteEnabled` flag)
- 📝 Webhook system (configuration, delivery, signatures, retries)
- 📝 Audit logging for external data modifications
- 📝 Enhanced notifications for API activity

## Glossary

- **MessMass Platform**: The event analytics platform that tracks fan engagement statistics and provides event data
- **Fanmass Service**: External fan identification service that receives event data from MessMass, processes images, and returns enriched fan information
- **Fan Identification**: The process of analyzing event photos to identify individual fans and extract demographic information
- **KYC System**: Know Your Customer system - the variable management system in MessMass that tracks 96+ statistical variables about fans, demographics, and engagement
- **Clicker**: The rapid data entry interface for manually updating KYC statistics
- **API User**: User account in MessMass with API access enabled, used for authenticating third-party service requests via Bearer token
- **Webhook**: HTTP callback mechanism for real-time event notifications
- **Data Injection**: The process of third-party services writing enriched data back into MessMass

## Requirements

### Requirement 1

**User Story:** As Fanmass service, I want to retrieve event information via API, so that I can process event images and identify fans.

#### Acceptance Criteria

1. WHEN Fanmass authenticates with a valid API user Bearer token THEN the MessMass system SHALL provide access to event data endpoints
2. WHEN Fanmass requests event details THEN the MessMass system SHALL return complete event information including event name, date, partner information, image URLs, and current statistics
3. WHEN Fanmass requests partner information THEN the MessMass system SHALL return partner details including name, emoji, hashtags, and associated events
4. WHEN Fanmass makes multiple requests THEN the MessMass system SHALL enforce rate limiting of 1000 requests per minute per API user
5. WHEN Fanmass requests data THEN the MessMass system SHALL return responses in JSON format with ISO 8601 timestamps

### Requirement 2

**User Story:** As Fanmass service, I want to inject enriched fan data back into MessMass, so that MessMass can store the identified fan information in its KYC system.

#### Acceptance Criteria

1. WHEN Fanmass submits fan data with a valid API user Bearer token THEN the MessMass system SHALL validate the token and authorize the write request
2. WHEN Fanmass submits fan data for a specific event THEN the MessMass system SHALL update the event's KYC statistics with the provided data
3. WHEN Fanmass submits invalid data THEN the MessMass system SHALL reject the request and return detailed validation errors
4. WHEN Fanmass submits data for non-existent events THEN the MessMass system SHALL return a 404 error with appropriate error message
5. WHEN fan data is successfully injected THEN the MessMass system SHALL update the event's updatedAt timestamp and trigger analytics recalculation

### Requirement 3

**User Story:** As a MessMass administrator, I want to receive notifications when Fanmass injects data, so that I can monitor the integration and data quality.

#### Acceptance Criteria

1. WHEN Fanmass successfully injects data THEN the MessMass system SHALL create a notification record with service name, event name, and timestamp
2. WHEN Fanmass injection fails THEN the MessMass system SHALL create an error notification with failure reason
3. WHEN multiple data injections occur THEN the MessMass system SHALL group notifications by time period
4. WHEN an administrator views notifications THEN the MessMass system SHALL display Fanmass integration activity separately from manual edits
5. WHEN a notification is created THEN the MessMass system SHALL include metadata about which KYC statistics were modified

### Requirement 4

**User Story:** As a MessMass administrator, I want to use the existing user management system to control Fanmass API access, so that I can leverage the current authentication infrastructure.

#### Acceptance Criteria

1. WHEN an administrator creates an API user for Fanmass THEN the MessMass system SHALL use the existing user management system with API access enabled
2. WHEN an API user is created THEN the MessMass system SHALL generate a cryptographically secure password token using the existing mechanism
3. WHEN an administrator views API users THEN the MessMass system SHALL display user email, name, API enabled status, creation date, and last login date
4. WHEN an administrator disables API access for a user THEN the MessMass system SHALL immediately reject future API requests from that user
5. WHEN an API user authenticates THEN the MessMass system SHALL use the existing Bearer token authentication mechanism

### Requirement 5

**User Story:** As Fanmass service, I want to receive webhook notifications when MessMass events are created or updated, so that I can automatically process new or changed events without polling.

#### Acceptance Criteria

1. WHEN a new event is created in MessMass THEN the MessMass system SHALL send webhook notification to the registered Fanmass webhook URL
2. WHEN an event is updated in MessMass THEN the MessMass system SHALL send webhook notification to the registered Fanmass webhook URL
3. WHEN a webhook notification is sent THEN the MessMass system SHALL include event ID, event name, event date, partner information, image URLs, and webhook signature
4. WHEN a webhook delivery fails THEN the MessMass system SHALL retry up to 3 times with exponential backoff
5. WHEN a webhook is delivered THEN the MessMass system SHALL log the delivery status, response code, and response time

### Requirement 6

**User Story:** As a MessMass administrator, I want to configure the Fanmass webhook endpoint, so that Fanmass can receive real-time event notifications.

#### Acceptance Criteria

1. WHEN an administrator registers the Fanmass webhook THEN the MessMass system SHALL validate the URL format and require HTTPS protocol
2. WHEN an administrator registers the webhook THEN the MessMass system SHALL allow specifying which event types trigger notifications (create, update)
3. WHEN an administrator tests the webhook THEN the MessMass system SHALL send a test payload and display the response
4. WHEN an administrator views the webhook configuration THEN the MessMass system SHALL display URL, event types, status (active/disabled), and delivery statistics
5. WHEN an administrator disables the webhook THEN the MessMass system SHALL stop sending notifications but preserve the configuration

### Requirement 7

**User Story:** As Fanmass service, I want to validate webhook signatures, so that I can verify notifications are genuinely from MessMass and not spoofed.

#### Acceptance Criteria

1. WHEN MessMass sends a webhook notification THEN the MessMass system SHALL include an HMAC-SHA256 signature in the X-MessMass-Signature header
2. WHEN the webhook is registered THEN the MessMass system SHALL generate a unique webhook secret for signature generation
3. WHEN Fanmass receives a webhook THEN the MessMass system SHALL provide documentation for signature verification
4. WHEN a webhook includes a timestamp THEN the MessMass system SHALL include the timestamp in the payload for replay attack prevention
5. WHEN a webhook signature is computed THEN the MessMass system SHALL use the webhook secret and payload body for HMAC-SHA256 generation

### Requirement 8

**User Story:** As Fanmass service, I want to submit detailed fan demographics and identification data, so that MessMass can store the enriched analytics in its KYC system.

#### Acceptance Criteria

1. WHEN Fanmass submits fan data THEN the MessMass system SHALL accept updates to demographic variables (male, female, genAlpha, genYZ, genX, boomer)
2. WHEN Fanmass submits fan data THEN the MessMass system SHALL accept updates to merchandise variables (merched, jersey, scarf, flags, baseballCap)
3. WHEN Fanmass submits fan data THEN the MessMass system SHALL accept updates to fan count variables (remoteFans, stadium, indoor, outdoor)
4. WHEN Fanmass submits fan data THEN the MessMass system SHALL validate that numeric values are non-negative integers
5. WHEN Fanmass submits fan data THEN the MessMass system SHALL automatically recalculate derived metrics (totalFans, totalImages, conversionRates)

### Requirement 9

**User Story:** As a MessMass administrator, I want to audit all Fanmass data injections, so that I can track data provenance and troubleshoot issues.

#### Acceptance Criteria

1. WHEN Fanmass injects data THEN the MessMass system SHALL create an audit log entry with service name, API user email, timestamp, and modified fields
2. WHEN an administrator views audit logs THEN the MessMass system SHALL display before and after values for all modified KYC statistics
3. WHEN an administrator filters audit logs THEN the MessMass system SHALL support filtering by event, date range, and modified fields
4. WHEN an audit log is created THEN the MessMass system SHALL include the IP address and user agent of the Fanmass service
5. WHEN audit logs are queried THEN the MessMass system SHALL support pagination with 50 entries per page

### Requirement 10

**User Story:** As a Fanmass developer, I want comprehensive API documentation, so that I can integrate with MessMass efficiently and correctly.

#### Acceptance Criteria

1. WHEN a Fanmass developer accesses API documentation THEN the MessMass system SHALL provide OpenAPI 3.0 specification for all integration endpoints
2. WHEN a Fanmass developer reads documentation THEN the MessMass system SHALL include code examples in JavaScript, Python, and cURL
3. WHEN a Fanmass developer views endpoint documentation THEN the MessMass system SHALL include request/response schemas, authentication requirements, and error codes
4. WHEN a Fanmass developer needs webhook documentation THEN the MessMass system SHALL provide payload examples and signature verification code
5. WHEN API changes are made THEN the MessMass system SHALL maintain versioned documentation with migration guides
