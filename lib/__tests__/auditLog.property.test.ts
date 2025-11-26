// lib/__tests__/auditLog.property.test.ts
// WHAT: Property-based tests for audit logging
// WHY: Verify audit logs work correctly across all possible inputs

import fc from 'fast-check';
import {
  createAuditLog,
  getAuditLogs,
  type CreateAuditLogParams,
  type GetAuditLogsParams
} from '../auditLog';
import type { NextRequest } from 'next/server';

// Mock MongoDB
jest.mock('../mongodb', () => ({
  getDb: jest.fn()
}));

describe('auditLog - Property Tests', () => {
  let mockCollection: any;
  let mockDb: any;
  
  beforeEach(() => {
    mockCollection = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-id' }),
      countDocuments: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([])
    };
    
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };
    
    const { getDb } = require('../mongodb');
    (getDb as jest.Mock).mockResolvedValue(mockDb);
  });

  /**
   * Property 39: Audit log creation
   * Feature: third-party-fan-data-integration, Property 39: Audit log creation
   * Validates: Requirements 9.1
   * 
   * For any stats update, an audit log should be created with all required fields
   */
  test('Property 39: Audit log creation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventId: fc.hexaString({ minLength: 24, maxLength: 24 }),
          userId: fc.hexaString({ minLength: 24, maxLength: 24 }),
          userEmail: fc.emailAddress(),
          changes: fc.array(
            fc.record({
              field: fc.string({ minLength: 1, maxLength: 20 }),
              before: fc.nat(),
              after: fc.nat()
            }),
            { minLength: 1, maxLength: 10 }
          ),
          source: fc.option(fc.string(), { nil: undefined })
        }),
        async ({ eventId, userId, userEmail, changes, source }) => {
          const mockRequest = {
            headers: {
              get: jest.fn((name: string) => {
                if (name === 'x-forwarded-for') return '192.168.1.1';
                if (name === 'user-agent') return 'TestAgent/1.0';
                return null;
              })
            }
          } as unknown as NextRequest;

          const params: CreateAuditLogParams = {
            eventId,
            userId,
            userEmail,
            action: 'stats_update',
            changes,
            metadata: source ? { source } : undefined,
            request: mockRequest
          };

          await createAuditLog(params);

          expect(mockCollection.insertOne).toHaveBeenCalled();
          const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
          
          // Verify all required fields exist
          expect(insertedDoc.action).toBe('stats_update');
          expect(insertedDoc.userEmail).toBe(userEmail);
          expect(insertedDoc.timestamp).toBeDefined();
          expect(insertedDoc.ipAddress).toBeDefined();
          expect(insertedDoc.userAgent).toBeDefined();
          expect(insertedDoc.changes).toEqual(changes);
          
          // Reset mock for next iteration
          mockCollection.insertOne.mockClear();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 40: Audit log before/after values
   * Feature: third-party-fan-data-integration, Property 40: Audit log before/after values
   * Validates: Requirements 9.2
   * 
   * For any audit log, it should contain both before and after values for all changes
   */
  test('Property 40: Audit log before/after values', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            field: fc.string({ minLength: 1, maxLength: 20 }),
            before: fc.nat({ max: 1000 }),
            after: fc.nat({ max: 1000 })
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (changes) => {
          const mockRequest = {
            headers: {
              get: jest.fn(() => null)
            }
          } as unknown as NextRequest;

          const params: CreateAuditLogParams = {
            eventId: '507f1f77bcf86cd799439011',
            userId: '507f1f77bcf86cd799439012',
            userEmail: 'test@example.com',
            action: 'stats_update',
            changes,
            request: mockRequest
          };

          await createAuditLog(params);

          const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
          
          // Verify all changes have before and after values
          expect(insertedDoc.changes).toHaveLength(changes.length);
          for (let i = 0; i < changes.length; i++) {
            expect(insertedDoc.changes[i]).toHaveProperty('field');
            expect(insertedDoc.changes[i]).toHaveProperty('before');
            expect(insertedDoc.changes[i]).toHaveProperty('after');
            expect(insertedDoc.changes[i].field).toBe(changes[i].field);
            expect(insertedDoc.changes[i].before).toBe(changes[i].before);
            expect(insertedDoc.changes[i].after).toBe(changes[i].after);
          }
          
          mockCollection.insertOne.mockClear();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property 41: Audit log filtering
   * Feature: third-party-fan-data-integration, Property 41: Audit log filtering
   * Validates: Requirements 9.3
   * 
   * For any filter parameters, only matching logs should be returned
   */
  test('Property 41: Audit log filtering by eventId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 24, maxLength: 24 }),
        async (eventId) => {
          const params: GetAuditLogsParams = {
            eventId
          };

          await getAuditLogs(params);

          // Verify filter was applied
          expect(mockCollection.find).toHaveBeenCalledWith(
            expect.objectContaining({
              eventId: expect.any(Object)
            })
          );
          
          mockCollection.find.mockClear();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 41: Audit log filtering by userId
   */
  test('Property 41: Audit log filtering by userId', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.hexaString({ minLength: 24, maxLength: 24 }),
        async (userId) => {
          const params: GetAuditLogsParams = {
            userId
          };

          await getAuditLogs(params);

          expect(mockCollection.find).toHaveBeenCalledWith(
            expect.objectContaining({
              userId: expect.any(Object)
            })
          );
          
          mockCollection.find.mockClear();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 41: Audit log filtering by date range
   */
  test('Property 41: Audit log filtering by date range', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        fc.date({ min: new Date('2024-01-01'), max: new Date('2024-12-31') }),
        async (date1, date2) => {
          const startDate = date1 < date2 ? date1.toISOString() : date2.toISOString();
          const endDate = date1 < date2 ? date2.toISOString() : date1.toISOString();
          
          const params: GetAuditLogsParams = {
            startDate,
            endDate
          };

          await getAuditLogs(params);

          expect(mockCollection.find).toHaveBeenCalledWith(
            expect.objectContaining({
              timestamp: expect.objectContaining({
                $gte: startDate,
                $lte: endDate
              })
            })
          );
          
          mockCollection.find.mockClear();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property 43: Audit log pagination
   * Feature: third-party-fan-data-integration, Property 43: Audit log pagination
   * Validates: Requirements 9.5
   * 
   * For any pagination parameters, correct skip and limit should be applied
   */
  test('Property 43: Audit log pagination', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.nat({ max: 1000 }), // offset
        fc.integer({ min: 1, max: 100 }), // limit
        async (offset, limit) => {
          const params: GetAuditLogsParams = {
            offset,
            limit
          };

          await getAuditLogs(params);

          expect(mockCollection.skip).toHaveBeenCalledWith(offset);
          expect(mockCollection.limit).toHaveBeenCalledWith(limit);
          
          mockCollection.skip.mockClear();
          mockCollection.limit.mockClear();
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Audit logs are sorted by timestamp descending
   * 
   * For any query, results should be sorted by timestamp (newest first)
   */
  test('Property: Audit logs sorted by timestamp descending', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          eventId: fc.option(fc.hexaString({ minLength: 24, maxLength: 24 }), { nil: undefined }),
          userId: fc.option(fc.hexaString({ minLength: 24, maxLength: 24 }), { nil: undefined }),
          limit: fc.option(fc.integer({ min: 1, max: 100 }), { nil: undefined }),
          offset: fc.option(fc.nat({ max: 1000 }), { nil: undefined })
        }),
        async (params) => {
          await getAuditLogs(params);

          expect(mockCollection.sort).toHaveBeenCalledWith({ timestamp: -1 });
          
          mockCollection.sort.mockClear();
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Default pagination is applied when not specified
   */
  test('Property: Default pagination (50 per page, offset 0)', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constant({}),
        async () => {
          await getAuditLogs();

          expect(mockCollection.skip).toHaveBeenCalledWith(0);
          expect(mockCollection.limit).toHaveBeenCalledWith(50);
          
          mockCollection.skip.mockClear();
          mockCollection.limit.mockClear();
        }
      ),
      { numRuns: 10 }
    );
  });
});
