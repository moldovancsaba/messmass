// lib/__tests__/notificationUtils.property.test.ts
// WHAT: Property-based tests for notification system
// WHY: Verify notifications work correctly for API activity

import fc from 'fast-check';
import { createNotification, type CreateNotificationParams } from '../notificationUtils';
import type { Db } from 'mongodb';

describe('notificationUtils - Property Tests', () => {
  let mockCollection: any;
  let mockDb: Db;
  
  beforeEach(() => {
    mockCollection = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
      findOne: jest.fn().mockResolvedValue(null),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 })
    };
    
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    } as unknown as Db;
  });

  /**
   * Property 11: Notification creation on success
   * Feature: third-party-fan-data-integration, Property 11: Notification creation on success
   * Validates: Requirements 3.1
   * 
   * For any successful stats injection, a notification should exist with correct fields
   */
  test('Property 11: Notification creation on success', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userEmail: fc.emailAddress(),
          projectId: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0')),
          projectName: fc.string({ minLength: 1, maxLength: 100 }),
          modifiedFields: fc.array(
            fc.constantFrom('male', 'female', 'merched', 'remoteFans', 'stadium'),
            { minLength: 1, maxLength: 5 }
          )
        }),
        async ({ userEmail, projectId, projectName, modifiedFields }) => {
          const params: CreateNotificationParams = {
            activityType: 'api_stats_update',
            user: userEmail,
            projectId,
            projectName,
            apiUser: {
              id: '507f1f77bcf86cd799439011',
              email: userEmail
            },
            modifiedFields
          };

          const result = await createNotification(mockDb, params);

          expect(result).toBe(true);
          expect(mockCollection.insertOne).toHaveBeenCalled();
          
          const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
          
          // Verify notification has required fields
          expect(insertedDoc.activityType).toBe('api_stats_update');
          expect(insertedDoc.user).toBe(userEmail);
          expect(insertedDoc.projectId).toBe(projectId);
          expect(insertedDoc.projectName).toBe(projectName);
          expect(insertedDoc.timestamp).toBeDefined();
          expect(insertedDoc.apiUser).toEqual({
            id: '507f1f77bcf86cd799439011',
            email: userEmail
          });
          expect(insertedDoc.modifiedFields).toEqual(modifiedFields);
          
          mockCollection.insertOne.mockClear();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 15: Notification metadata completeness
   * Feature: third-party-fan-data-integration, Property 15: Notification metadata completeness
   * Validates: Requirements 3.5
   * 
   * For any API notification, it should contain the list of modified fields
   */
  test('Property 15: Notification metadata completeness', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.constantFrom('male', 'female', 'genAlpha', 'genYZ', 'genX', 'boomer', 
                         'merched', 'jersey', 'scarf', 'flags', 'baseballCap',
                         'remoteFans', 'stadium', 'indoor', 'outdoor'),
          { minLength: 1, maxLength: 10 }
        ),
        async (modifiedFields) => {
          const params: CreateNotificationParams = {
            activityType: 'api_stats_update',
            user: 'api@example.com',
            projectId: '507f1f77bcf86cd799439011',
            projectName: 'Test Event',
            apiUser: {
              id: '507f1f77bcf86cd799439012',
              email: 'api@example.com'
            },
            modifiedFields
          };

          await createNotification(mockDb, params);

          const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
          
          // Verify modifiedFields array is present and matches input
          expect(insertedDoc.modifiedFields).toBeDefined();
          expect(insertedDoc.modifiedFields).toEqual(modifiedFields);
          expect(insertedDoc.modifiedFields.length).toBe(modifiedFields.length);
          
          mockCollection.insertOne.mockClear();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 14: API activity separation
   * Feature: third-party-fan-data-integration, Property 14: API activity separation
   * Validates: Requirements 3.4
   * 
   * For any notification from API activity, it should have a type tag that allows filtering
   */
  test('Property 14: API activity separation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userEmail: fc.emailAddress(),
          projectId: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0')),
          projectName: fc.string({ minLength: 1, maxLength: 100 })
        }),
        async ({ userEmail, projectId, projectName }) => {
          const params: CreateNotificationParams = {
            activityType: 'api_stats_update',
            user: userEmail,
            projectId,
            projectName,
            apiUser: {
              id: '507f1f77bcf86cd799439011',
              email: userEmail
            },
            modifiedFields: ['male', 'female']
          };

          await createNotification(mockDb, params);

          const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
          
          // Verify notification has distinct type for API activity
          expect(insertedDoc.activityType).toBe('api_stats_update');
          
          // Verify it's different from manual edit types
          expect(insertedDoc.activityType).not.toBe('edit');
          expect(insertedDoc.activityType).not.toBe('edit-stats');
          expect(insertedDoc.activityType).not.toBe('create');
          
          // Verify apiUser field exists (distinguishes from manual edits)
          expect(insertedDoc.apiUser).toBeDefined();
          expect(insertedDoc.apiUser.email).toBe(userEmail);
          
          mockCollection.insertOne.mockClear();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Webhook disabled notifications contain metadata
   * 
   * For any webhook_disabled notification, it should contain webhook metadata
   */
  test('Property: Webhook disabled notifications contain metadata', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          webhookId: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0')),
          reason: fc.string({ minLength: 1, maxLength: 100 })
        }),
        async ({ webhookId, reason }) => {
          const params: CreateNotificationParams = {
            activityType: 'webhook_disabled',
            user: 'system',
            projectId: '507f1f77bcf86cd799439011',
            projectName: 'Webhook Alert',
            metadata: {
              webhookId,
              reason
            }
          };

          await createNotification(mockDb, params);

          const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
          
          // Verify webhook metadata is present
          expect(insertedDoc.metadata).toBeDefined();
          expect(insertedDoc.metadata.webhookId).toBe(webhookId);
          expect(insertedDoc.metadata.reason).toBe(reason);
          
          mockCollection.insertOne.mockClear();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Notification grouping within 5-minute window
   * 
   * For any similar notification within 5 minutes, it should update existing instead of creating new
   */
  test('Property: Notification grouping within 5-minute window', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          userEmail: fc.emailAddress(),
          projectId: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0')),
          projectName: fc.string({ minLength: 1, maxLength: 100 })
        }),
        async ({ userEmail, projectId, projectName }) => {
          // Mock existing notification within 5-minute window
          const existingNotification = {
            _id: 'existing-id',
            activityType: 'api_stats_update',
            user: userEmail,
            projectId,
            projectName: 'Old Name',
            timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString() // 2 minutes ago
          };
          
          mockCollection.findOne.mockResolvedValueOnce(existingNotification);

          const params: CreateNotificationParams = {
            activityType: 'api_stats_update',
            user: userEmail,
            projectId,
            projectName,
            apiUser: {
              id: '507f1f77bcf86cd799439011',
              email: userEmail
            },
            modifiedFields: ['male']
          };

          const result = await createNotification(mockDb, params);

          expect(result).toBe(true);
          
          // Should update existing, not insert new
          expect(mockCollection.updateOne).toHaveBeenCalled();
          expect(mockCollection.insertOne).not.toHaveBeenCalled();
          
          mockCollection.findOne.mockReset();
          mockCollection.updateOne.mockClear();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Required fields validation
   * 
   * For any notification with missing required fields, creation should fail gracefully
   */
  test('Property: Required fields validation', async () => {
    const invalidParams = [
      { activityType: undefined, user: 'test', projectId: '123', projectName: 'Test' },
      { activityType: 'api_stats_update', user: undefined, projectId: '123', projectName: 'Test' },
      { activityType: 'api_stats_update', user: 'test', projectId: undefined, projectName: 'Test' },
      { activityType: 'api_stats_update', user: 'test', projectId: '123', projectName: undefined }
    ];

    for (const params of invalidParams) {
      const result = await createNotification(mockDb, params as any);
      
      // Should return false for invalid params
      expect(result).toBe(false);
      
      // Should not insert anything
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    }
  });
});
