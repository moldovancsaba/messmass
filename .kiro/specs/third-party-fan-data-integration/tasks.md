# Implementation Plan

## Overview

This implementation plan breaks down the Fanmass integration feature into discrete, incremental tasks. Each task builds on previous work and includes references to specific requirements from the requirements document.

**Implementation Strategy:**
1. Start with write endpoint (highest value)
2. Add audit logging (compliance)
3. Enhance notifications (visibility)
4. Build webhook system (automation)
5. Add admin UI (management)

**Context Documents:**
- Requirements: `.kiro/specs/third-party-fan-data-integration/requirements.md`
- Design: `.kiro/specs/third-party-fan-data-integration/design.md`
- API Research: `.kiro/specs/third-party-fan-data-integration/api-research-findings.md`

---

## Tasks

- [x] 1. Extend user model with write permissions
  - Add `apiWriteEnabled`, `apiWriteCount`, `lastAPIWriteAt` fields to UserDoc interface
  - Create database migration to add fields to existing users (default: false, 0, null)
  - Add `toggleAPIWriteAccess()` function to `lib/users.ts`
  - Add `updateAPIWriteUsage()` function to `lib/users.ts`
  - _Requirements: 4.2_

- [x] 1.1 Write unit tests for user write permission functions
  - Test `toggleAPIWriteAccess()` enables/disables write access
  - Test `updateAPIWriteUsage()` increments counter and updates timestamp
  - _Requirements: 4.2, 4.5_

- [x] 2. Create write authentication middleware
  - Implement `requireAPIWriteAuth()` function in `lib/apiAuth.ts`
  - Check `apiKeyEnabled` AND `apiWriteEnabled` flags
  - Return 403 with `WRITE_ACCESS_DISABLED` error code if write not enabled
  - Call `updateAPIWriteUsage()` on successful auth
  - _Requirements: 2.1, 4.2_

- [x] 2.1 Write property test for write authentication
  - **Property 6: Write authentication**
  - **Validates: Requirements 2.1**
  - Generate random users with various permission combinations
  - Verify only users with both flags enabled can write

- [x] 2.2 Write unit tests for write authentication edge cases
  - Test user with apiKeyEnabled=true but apiWriteEnabled=false returns 403
  - Test user with apiKeyEnabled=false returns 401
  - Test missing token returns 401
  - _Requirements: 2.1_

- [x] 3. Create stats validation utility
  - Create `lib/statsValidator.ts` with `validateStatsUpdate()` function
  - Validate all numeric values are non-negative integers
  - Validate field names match known KYC variables
  - Return detailed validation errors with field names
  - _Requirements: 2.3, 8.4_

- [x] 3.1 Write property test for stats validation
  - **Property 8: Invalid data rejection**
  - **Validates: Requirements 2.3**
  - Generate random stats with negative numbers
  - Verify all are rejected with validation errors

- [x] 3.2 Write property test for non-negative validation
  - **Property 37: Non-negative integer validation**
  - **Validates: Requirements 8.4**
  - Generate stats with negative values for each field
  - Verify rejection with specific error code

- [x] 4. Create audit logging system
  - Create `lib/auditLog.ts` with audit log functions
  - Implement `createAuditLog()` function
  - Implement `getAuditLogs()` function with filtering and pagination
  - Create `api_audit_logs` collection with indexes
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 4.1 Write property test for audit log creation
  - **Property 39: Audit log creation**
  - **Validates: Requirements 9.1**
  - Generate random stats updates
  - Verify audit log exists with all required fields

- [x] 4.2 Write property test for audit log before/after values
  - **Property 40: Audit log before/after values**
  - **Validates: Requirements 9.2**
  - Generate random stats changes
  - Verify audit log contains both before and after values

- [x] 4.3 Write property test for audit log filtering
  - **Property 41: Audit log filtering**
  - **Validates: Requirements 9.3**
  - Generate random audit logs
  - Apply various filters and verify results match

- [x] 4.4 Write property test for audit log pagination
  - **Property 43: Audit log pagination**
  - **Validates: Requirements 9.5**
  - Generate 100+ audit logs
  - Verify page 2 returns entries 51-100

- [x] 5. Implement stats injection endpoint
  - Create `app/api/public/events/[id]/stats/route.ts`
  - Implement POST handler with `requireAPIWriteAuth()`
  - Validate event ID and request body
  - Merge stats with existing event stats
  - Recalculate derived metrics using `addDerivedMetrics()`
  - Update event in database with new stats and timestamp
  - Create audit log entry
  - Return success response with updated fields list
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 8.1, 8.2, 8.3, 8.5_

<<<<<<< HEAD
- [x] 5.1 Write property test for stats update round-trip
=======
- [ ] 5.1 Write property test for stats update round-trip
>>>>>>> origin/main
  - **Property 7: Stats update round-trip**
  - **Validates: Requirements 2.2**
  - Generate random valid stats
  - Write then read event
  - Verify values match

<<<<<<< HEAD
- [x] 5.2 Write property test for demographic variables
=======
- [ ] 5.2 Write property test for demographic variables
>>>>>>> origin/main
  - **Property 34: Demographic variables acceptance**
  - **Validates: Requirements 8.1**
  - Generate random demographic stats
  - Verify all are accepted and persisted

<<<<<<< HEAD
- [x] 5.3 Write property test for merchandise variables
=======
- [ ] 5.3 Write property test for merchandise variables
>>>>>>> origin/main
  - **Property 35: Merchandise variables acceptance**
  - **Validates: Requirements 8.2**
  - Generate random merchandise stats
  - Verify all are accepted and persisted

<<<<<<< HEAD
- [x] 5.4 Write property test for fan count variables
=======
- [ ] 5.4 Write property test for fan count variables
>>>>>>> origin/main
  - **Property 36: Fan count variables acceptance**
  - **Validates: Requirements 8.3**
  - Generate random fan count stats
  - Verify all are accepted and persisted

<<<<<<< HEAD
- [x] 5.5 Write property test for derived metrics recalculation
=======
- [ ] 5.5 Write property test for derived metrics recalculation
>>>>>>> origin/main
  - **Property 38: Derived metrics recalculation**
  - **Validates: Requirements 8.5**
  - Generate random base stats
  - Update event
  - Verify totalFans, totalImages calculated correctly

<<<<<<< HEAD
- [x] 5.6 Write property test for timestamp update
=======
- [ ] 5.6 Write property test for timestamp update
>>>>>>> origin/main
  - **Property 10: Timestamp and recalculation on update**
  - **Validates: Requirements 2.5**
  - Record timestamp before update
  - Perform update
  - Verify timestamp is newer

<<<<<<< HEAD
- [x] 5.7 Write unit tests for stats endpoint error cases
=======
- [ ] 5.7 Write unit tests for stats endpoint error cases
>>>>>>> origin/main
  - Test invalid event ID returns 400
  - Test non-existent event returns 404
  - Test invalid stats data returns 400 with details
  - Test missing write permission returns 403
  - _Requirements: 2.3, 2.4_

<<<<<<< HEAD
- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Extend notification system for API activity
=======
- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [-] 7. Extend notification system for API activity
>>>>>>> origin/main
  - Add `api_stats_update` notification type to `lib/notificationUtils.ts`
  - Modify `createNotification()` to accept API user info
  - Add `modifiedFields` array to notification document
  - Update notification display to show API activity separately
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

<<<<<<< HEAD
- [x] 7.1 Write property test for notification creation
=======
- [ ] 7.1 Write property test for notification creation
>>>>>>> origin/main
  - **Property 11: Notification creation on success**
  - **Validates: Requirements 3.1**
  - Generate random stats updates
  - Verify notification exists with correct fields

<<<<<<< HEAD
- [x] 7.2 Write property test for error notification
=======
- [ ] 7.2 Write property test for error notification
>>>>>>> origin/main
  - **Property 12: Error notification creation**
  - **Validates: Requirements 3.2**
  - Generate invalid stats updates
  - Verify error notification exists

<<<<<<< HEAD
- [x] 7.3 Write property test for notification metadata
=======
- [ ] 7.3 Write property test for notification metadata
>>>>>>> origin/main
  - **Property 15: Notification metadata completeness**
  - **Validates: Requirements 3.5**
  - Generate random stats updates
  - Verify notification contains modified fields list

- [x] 8. Create webhook data models and utilities
  - Create `lib/webhooks.ts` with webhook types and interfaces
  - Implement `createWebhook()` function
  - Implement `getWebhooks()` function
  - Implement `updateWebhook()` function
  - Implement `deleteWebhook()` function
  - Implement `disableWebhook()` function
  - Create `webhooks` collection with indexes
  - _Requirements: 6.1, 6.2, 6.4, 6.5_

- [x] 8.1 Write unit tests for webhook CRUD operations
  - Test webhook creation with valid URL
  - Test webhook creation rejects non-HTTPS URL
  - Test webhook update
  - Test webhook disable preserves configuration
  - _Requirements: 6.1, 6.5_

- [x] 8.2 Write property test for webhook URL validation
  - **Property 26: Webhook URL validation**
  - **Validates: Requirements 6.1**
  - Generate random non-HTTPS URLs
  - Verify all are rejected

- [x] 8.3 Write property test for webhook disable
  - **Property 30: Webhook disable preserves configuration**
  - **Validates: Requirements 6.5**
  - Create random webhooks
  - Disable them
  - Verify configuration still exists

- [x] 9. Implement webhook signature generation
  - Add `generateWebhookSignature()` function to `lib/webhooks.ts`
  - Use HMAC-SHA256 with webhook secret
  - Generate unique secret for each webhook (32 bytes random)
  - _Requirements: 7.1, 7.2, 7.5_

<<<<<<< HEAD
- [x] 9.1 Write property test for webhook signature
=======
- [ ] 9.1 Write property test for webhook signature
>>>>>>> origin/main
  - **Property 31: Webhook signature presence**
  - **Validates: Requirements 7.1**
  - Generate random webhook payloads
  - Verify signature header is present and valid

- [ ] 9.2 Write property test for webhook secret uniqueness
  - **Property 32: Webhook secret uniqueness**
  - **Validates: Requirements 7.2**
  - Create multiple webhooks
  - Verify all secrets are different

- [ ] 10. Implement webhook delivery service
  - Add `deliverWebhook()` function to `lib/webhooks.ts`
  - Implement retry logic with exponential backoff (1s, 5s, 15s)
  - Add 10 second timeout per attempt
  - Track delivery statistics (success/failure counts)
  - Auto-disable webhook after 10 consecutive failures
  - Create `webhook_delivery_logs` collection
  - _Requirements: 5.3, 5.4, 5.5_

- [ ] 10.1 Write property test for webhook retry logic
  - **Property 24: Webhook retry logic**
  - **Validates: Requirements 5.4**
  - Mock failing webhook endpoint
  - Verify 4 delivery attempts with correct timing

- [ ] 10.2 Write property test for webhook delivery logging
  - **Property 25: Webhook delivery logging**
  - **Validates: Requirements 5.5**
  - Deliver random webhooks
  - Verify log entries exist with all required fields

- [ ] 10.3 Write unit tests for webhook delivery edge cases
  - Test timeout handling
  - Test network error handling
  - Test auto-disable after 10 failures
  - Test successful delivery resets failure counter
  - _Requirements: 5.4_

- [ ] 11. Implement webhook trigger system
  - Add `triggerWebhooks()` function to `lib/webhooks.ts`
  - Query active webhooks matching event type
  - Build webhook payload with event data
  - Call `deliverWebhook()` for each webhook asynchronously
  - _Requirements: 5.1, 5.2, 5.3_

- [ ] 11.1 Write property test for webhook delivery on event creation
  - **Property 21: Webhook delivery on event creation**
  - **Validates: Requirements 5.1**
  - Create webhooks with event.created type
  - Create random events
  - Verify webhooks received notifications

- [ ] 11.2 Write property test for webhook delivery on event update
  - **Property 22: Webhook delivery on event update**
  - **Validates: Requirements 5.2**
  - Create webhooks with event.updated type
  - Update random events
  - Verify webhooks received notifications

- [ ] 11.3 Write property test for webhook payload completeness
  - **Property 23: Webhook payload completeness**
  - **Validates: Requirements 5.3**
  - Generate random events
  - Trigger webhooks
  - Verify payload contains all required fields

- [ ] 12. Integrate webhook triggers into event lifecycle
  - Add webhook trigger to `POST /api/projects` (event creation)
  - Add webhook trigger to `PUT /api/projects` (event update)
  - Ensure triggers are async (don't block response)
  - _Requirements: 5.1, 5.2_

- [ ] 12.1 Write integration test for end-to-end webhook flow
  - Create webhook with test server
  - Create event
  - Verify webhook received notification
  - Verify signature is valid
  - Update event
  - Verify webhook received update
  - _Requirements: 5.1, 5.2, 5.3, 7.1_

- [ ] 13. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Create webhook management API endpoints
  - Create `app/api/admin/webhooks/route.ts`
  - Implement GET handler (list webhooks)
  - Implement POST handler (create webhook)
  - Implement PUT handler (update webhook)
  - Implement DELETE handler (delete webhook)
  - Require admin authentication
  - _Requirements: 6.1, 6.2, 6.4_

- [ ] 14.1 Write unit tests for webhook management endpoints
  - Test create webhook with valid data
  - Test create webhook with invalid URL
  - Test update webhook
  - Test delete webhook
  - Test list webhooks with pagination
  - _Requirements: 6.1, 6.2, 6.4_

- [ ] 15. Create webhook test endpoint
  - Create `app/api/admin/webhooks/test/route.ts`
  - Implement POST handler to send test payload
  - Return webhook response (status, body, timing)
  - Require admin authentication
  - _Requirements: 6.3_

- [ ] 15.1 Write property test for webhook test functionality
  - **Property 28: Webhook test functionality**
  - **Validates: Requirements 6.3**
  - Create random webhooks
  - Test each webhook
  - Verify test payload sent and response returned

- [ ] 16. Create audit log API endpoint
  - Create `app/api/admin/audit-logs/route.ts`
  - Implement GET handler with filtering (event, user, date range)
  - Implement pagination (50 per page)
  - Return audit logs with before/after values
  - Require admin authentication
  - _Requirements: 9.2, 9.3, 9.5_

- [ ] 16.1 Write unit tests for audit log endpoint
  - Test filtering by event ID
  - Test filtering by user ID
  - Test filtering by date range
  - Test pagination
  - Test combined filters
  - _Requirements: 9.3, 9.5_

- [ ] 17. Create admin UI for API user management
  - Add "API Access" section to `app/admin/users/page.tsx`
  - Display API enabled status, write enabled status
  - Display usage counts and last call timestamps
  - Add toggle buttons for enabling/disabling API access and write access
  - _Requirements: 4.2, 4.3_

- [ ] 17.1 Write unit tests for API user management UI
  - Test toggle API access button
  - Test toggle write access button
  - Test display of usage statistics
  - _Requirements: 4.2, 4.3_

- [ ] 18. Create admin UI for webhook management
  - Create `app/admin/webhooks/page.tsx`
  - Display webhooks table with URL, event types, status, delivery stats
  - Add "Create Webhook" button with modal
  - Add "Edit" and "Delete" buttons per webhook
  - Add "Test" button to send test payload
  - Add "Enable/Disable" toggle
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 18.1 Write unit tests for webhook management UI
  - Test create webhook form
  - Test edit webhook form
  - Test delete webhook confirmation
  - Test webhook test button
  - Test enable/disable toggle
  - _Requirements: 6.1, 6.2, 6.3, 6.5_

- [ ] 19. Create admin UI for audit log viewing
  - Create `app/admin/audit-logs/page.tsx`
  - Display audit logs table with event, user, timestamp, changes
  - Add filters for event, user, date range
  - Add pagination controls
  - Display before/after values in expandable rows
  - _Requirements: 9.2, 9.3, 9.5_

- [ ] 19.1 Write unit tests for audit log UI
  - Test filtering controls
  - Test pagination
  - Test expandable rows for before/after values
  - _Requirements: 9.3, 9.5_

- [ ] 20. Create API documentation
  - Create OpenAPI 3.0 specification for all integration endpoints
  - Document request/response schemas
  - Document authentication requirements
  - Document error codes
  - Add code examples (JavaScript, Python, cURL)
  - Document webhook payload schema
  - Document webhook signature verification
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 21. Create admin documentation
  - Write user guide for creating API users
  - Write user guide for enabling write access
  - Write user guide for configuring webhooks
  - Write user guide for viewing audit logs
  - Write troubleshooting guide for common issues
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [ ] 22. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 23. Manual testing and validation
  - Create API user via admin UI
  - Enable API access and write access
  - Test read endpoints with Postman
  - Test write endpoint with valid data
  - Test write endpoint with invalid data
  - Verify audit logs in admin UI
  - Verify notifications in admin UI
  - Register webhook
  - Test webhook delivery
  - Verify webhook signature
  - Test webhook retry on failure
  - Test webhook auto-disable
  - _Requirements: All_

---

## Summary

**Total Tasks:** 51 tasks (23 main + 28 test tasks, all required)
**Estimated Complexity:** High
**Estimated Duration:** 4-5 weeks for full implementation with comprehensive testing

**Priority Order:**
1. Tasks 1-6: Write endpoint and core functionality (Week 1)
2. Tasks 7-13: Webhook system (Week 2)
3. Tasks 14-16: Admin APIs (Week 3)
4. Tasks 17-23: Admin UI and documentation (Week 4)

**Dependencies:**
- Tasks 2-6 depend on Task 1 (user model extension)
- Tasks 10-13 depend on Tasks 8-9 (webhook infrastructure)
- Tasks 14-16 depend on completed backend (Tasks 1-13)
- Tasks 17-19 depend on API endpoints (Tasks 14-16)
