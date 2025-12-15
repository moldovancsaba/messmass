// lib/__tests__/auditLog.test.ts
// WHAT: Unit tests for audit logging system
// WHY: Ensure audit logs are created correctly and queries work as expected

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

describe('auditLog', () => {
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
      toArray: jest.fn().mockResolvedValue([]),
      createIndex: jest.fn().mockResolvedValue('index-created')
    };
    
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };
    
    const { getDb } = require('../mongodb');
    (getDb as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('createAuditLog', () => {
    it('should create audit log with all required fields', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1';
            if (name === 'user-agent') return 'Mozilla/5.0';
            return null;
          })
        }
      } as unknown as NextRequest;

      const params: CreateAuditLogParams = {
        eventId: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        userEmail: 'fanmass@example.com',
        action: 'stats_update',
        changes: [
          { field: 'male', before: 100, after: 150 },
          { field: 'female', before: 80, after: 120 }
        ],
        metadata: { source: 'fanmass', confidence: 0.95 },
        request: mockRequest
      };

      await createAuditLog(params);

      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
      const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
      
      expect(insertedDoc.action).toBe('stats_update');
      expect(insertedDoc.userEmail).toBe('fanmass@example.com');
      expect(insertedDoc.ipAddress).toBe('192.168.1.1');
      expect(insertedDoc.userAgent).toBe('Mozilla/5.0');
      expect(insertedDoc.source).toBe('fanmass');
      expect(insertedDoc.changes).toHaveLength(2);
      expect(insertedDoc.timestamp).toBeDefined();
    });

    it('should handle missing IP address', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null)
        }
      } as unknown as NextRequest;

      const params: CreateAuditLogParams = {
        eventId: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        userEmail: 'fanmass@example.com',
        action: 'stats_update',
        changes: [{ field: 'male', before: 100, after: 150 }],
        request: mockRequest
      };

      await createAuditLog(params);

      const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
      expect(insertedDoc.ipAddress).toBe('unknown');
    });

    it('should handle missing user agent', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn((name: string) => {
            if (name === 'x-forwarded-for') return '192.168.1.1';
            return null;
          })
        }
      } as unknown as NextRequest;

      const params: CreateAuditLogParams = {
        eventId: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        userEmail: 'fanmass@example.com',
        action: 'stats_update',
        changes: [{ field: 'male', before: 100, after: 150 }],
        request: mockRequest
      };

      await createAuditLog(params);

      const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
      expect(insertedDoc.userAgent).toBe('unknown');
    });

    it('should store before and after values for each change', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null)
        }
      } as unknown as NextRequest;

      const params: CreateAuditLogParams = {
        eventId: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        userEmail: 'fanmass@example.com',
        action: 'stats_update',
        changes: [
          { field: 'male', before: 100, after: 150 },
          { field: 'female', before: 80, after: 120 },
          { field: 'remoteFans', before: 500, after: 750 }
        ],
        request: mockRequest
      };

      await createAuditLog(params);

      const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
      expect(insertedDoc.changes).toHaveLength(3);
      expect(insertedDoc.changes[0]).toEqual({ field: 'male', before: 100, after: 150 });
      expect(insertedDoc.changes[1]).toEqual({ field: 'female', before: 80, after: 120 });
      expect(insertedDoc.changes[2]).toEqual({ field: 'remoteFans', before: 500, after: 750 });
    });

    it('should include optional metadata', async () => {
      const mockRequest = {
        headers: {
          get: jest.fn(() => null)
        }
      } as unknown as NextRequest;

      const params: CreateAuditLogParams = {
        eventId: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        userEmail: 'fanmass@example.com',
        action: 'stats_update',
        changes: [{ field: 'male', before: 100, after: 150 }],
        metadata: {
          source: 'fanmass',
          confidence: 0.95,
          processingTime: 123,
          customField: 'custom value'
        },
        request: mockRequest
      };

      await createAuditLog(params);

      const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
      expect(insertedDoc.metadata).toEqual({
        source: 'fanmass',
        confidence: 0.95,
        processingTime: 123,
        customField: 'custom value'
      });
    });
  });

  describe('getAuditLogs', () => {
    it('should return all logs with default pagination', async () => {
      const mockLogs = [
        { _id: '1', action: 'stats_update', timestamp: '2024-01-01T00:00:00Z' },
        { _id: '2', action: 'stats_update', timestamp: '2024-01-02T00:00:00Z' }
      ];
      
      mockCollection.countDocuments.mockResolvedValue(2);
      mockCollection.toArray.mockResolvedValue(mockLogs);

      const result = await getAuditLogs();

      expect(result.total).toBe(2);
      expect(result.logs).toEqual(mockLogs);
      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(mockCollection.sort).toHaveBeenCalledWith({ timestamp: -1 });
      expect(mockCollection.skip).toHaveBeenCalledWith(0);
      expect(mockCollection.limit).toHaveBeenCalledWith(50);
    });

    it('should filter by event ID', async () => {
      mockCollection.countDocuments.mockResolvedValue(1);
      mockCollection.toArray.mockResolvedValue([]);

      const params: GetAuditLogsParams = {
        eventId: '507f1f77bcf86cd799439011'
      };

      await getAuditLogs(params);

      expect(mockCollection.find).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: expect.any(Object)
        })
      );
    });

    it('should filter by user ID', async () => {
      mockCollection.countDocuments.mockResolvedValue(1);
      mockCollection.toArray.mockResolvedValue([]);

      const params: GetAuditLogsParams = {
        userId: '507f1f77bcf86cd799439012'
      };

      await getAuditLogs(params);

      expect(mockCollection.find).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: expect.any(Object)
        })
      );
    });

    it('should filter by date range', async () => {
      mockCollection.countDocuments.mockResolvedValue(1);
      mockCollection.toArray.mockResolvedValue([]);

      const params: GetAuditLogsParams = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z'
      };

      await getAuditLogs(params);

      expect(mockCollection.find).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: {
            $gte: '2024-01-01T00:00:00Z',
            $lte: '2024-01-31T23:59:59Z'
          }
        })
      );
    });

    it('should support custom pagination', async () => {
      mockCollection.countDocuments.mockResolvedValue(100);
      mockCollection.toArray.mockResolvedValue([]);

      const params: GetAuditLogsParams = {
        limit: 25,
        offset: 50
      };

      await getAuditLogs(params);

      expect(mockCollection.skip).toHaveBeenCalledWith(50);
      expect(mockCollection.limit).toHaveBeenCalledWith(25);
    });

    it('should combine multiple filters', async () => {
      mockCollection.countDocuments.mockResolvedValue(1);
      mockCollection.toArray.mockResolvedValue([]);

      const params: GetAuditLogsParams = {
        eventId: '507f1f77bcf86cd799439011',
        userId: '507f1f77bcf86cd799439012',
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-31T23:59:59Z',
        limit: 10,
        offset: 20
      };

      await getAuditLogs(params);

      expect(mockCollection.find).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: expect.any(Object),
          userId: expect.any(Object),
          timestamp: expect.any(Object)
        })
      );
      expect(mockCollection.skip).toHaveBeenCalledWith(20);
      expect(mockCollection.limit).toHaveBeenCalledWith(10);
    });

    it('should return logs sorted by timestamp descending', async () => {
      mockCollection.countDocuments.mockResolvedValue(3);
      mockCollection.toArray.mockResolvedValue([]);

      await getAuditLogs();

      expect(mockCollection.sort).toHaveBeenCalledWith({ timestamp: -1 });
    });
  });
});
