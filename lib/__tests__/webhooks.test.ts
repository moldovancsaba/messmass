// lib/__tests__/webhooks.test.ts
// WHAT: Unit tests for webhook management
// WHY: Ensure webhook CRUD operations work correctly

import {
  createWebhook,
  getWebhooks,
  getWebhookById,
  updateWebhook,
  deleteWebhook,
  disableWebhook
} from '../webhooks';

// Mock MongoDB
jest.mock('../mongodb', () => ({
  getDb: jest.fn()
}));

// Mock crypto for consistent secret generation
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => ({
    toString: jest.fn(() => 'mock-secret-hex-string')
  }))
}));

describe('webhooks', () => {
  let mockCollection: any;
  let mockDb: any;
  
  beforeEach(() => {
    mockCollection = {
      insertOne: jest.fn().mockResolvedValue({ insertedId: 'mock-webhook-id' }),
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn().mockResolvedValue(null),
      findOneAndUpdate: jest.fn().mockResolvedValue(null),
      deleteOne: jest.fn().mockResolvedValue({ deletedCount: 0 }),
      sort: jest.fn().mockReturnThis(),
      toArray: jest.fn().mockResolvedValue([]),
      createIndex: jest.fn().mockResolvedValue('index-created')
    };
    
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };
    
    const { getDb } = require('../mongodb');
    (getDb as jest.Mock).mockResolvedValue(mockDb);
  });

  describe('createWebhook', () => {
    it('should create webhook with valid HTTPS URL', async () => {
      const params = {
        url: 'https://example.com/webhook',
        eventTypes: ['event.created', 'event.updated'],
        description: 'Test webhook'
      };

      const webhook = await createWebhook(params);

      expect(mockCollection.insertOne).toHaveBeenCalledTimes(1);
      const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
      
      expect(insertedDoc.url).toBe(params.url);
      expect(insertedDoc.eventTypes).toEqual(params.eventTypes);
      expect(insertedDoc.description).toBe(params.description);
      expect(insertedDoc.active).toBe(true);
      expect(insertedDoc.secret).toBe('mock-secret-hex-string');
      expect(insertedDoc.totalDeliveries).toBe(0);
      expect(insertedDoc.successfulDeliveries).toBe(0);
      expect(insertedDoc.failedDeliveries).toBe(0);
      expect(insertedDoc.consecutiveFailures).toBe(0);
      expect(insertedDoc.createdAt).toBeDefined();
      expect(insertedDoc.updatedAt).toBeDefined();
    });

    it('should reject non-HTTPS URL', async () => {
      const params = {
        url: 'http://example.com/webhook',
        eventTypes: ['event.created']
      };

      await expect(createWebhook(params)).rejects.toThrow('Webhook URL must use HTTPS');
      expect(mockCollection.insertOne).not.toHaveBeenCalled();
    });

    it('should create webhook without description', async () => {
      const params = {
        url: 'https://example.com/webhook',
        eventTypes: ['event.created']
      };

      await createWebhook(params);

      const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
      expect(insertedDoc.description).toBeUndefined();
    });

    it('should generate unique secret for each webhook', async () => {
      const params = {
        url: 'https://example.com/webhook',
        eventTypes: ['event.created']
      };

      await createWebhook(params);

      const insertedDoc = mockCollection.insertOne.mock.calls[0][0];
      expect(insertedDoc.secret).toBeDefined();
      expect(typeof insertedDoc.secret).toBe('string');
      expect(insertedDoc.secret.length).toBeGreaterThan(0);
    });
  });

  describe('getWebhooks', () => {
    it('should return all webhooks without filters', async () => {
      const mockWebhooks = [
        { _id: '1', url: 'https://example.com/1', active: true },
        { _id: '2', url: 'https://example.com/2', active: false }
      ];
      
      mockCollection.toArray.mockResolvedValue(mockWebhooks);

      const webhooks = await getWebhooks();

      expect(webhooks).toEqual(mockWebhooks);
      expect(mockCollection.find).toHaveBeenCalledWith({});
      expect(mockCollection.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });

    it('should filter by active status', async () => {
      mockCollection.toArray.mockResolvedValue([]);

      await getWebhooks({ active: true });

      expect(mockCollection.find).toHaveBeenCalledWith({ active: true });
    });

    it('should filter by event type', async () => {
      mockCollection.toArray.mockResolvedValue([]);

      await getWebhooks({ eventType: 'event.created' });

      expect(mockCollection.find).toHaveBeenCalledWith({ eventTypes: 'event.created' });
    });

    it('should combine multiple filters', async () => {
      mockCollection.toArray.mockResolvedValue([]);

      await getWebhooks({ active: true, eventType: 'event.updated' });

      expect(mockCollection.find).toHaveBeenCalledWith({
        active: true,
        eventTypes: 'event.updated'
      });
    });
  });

  describe('getWebhookById', () => {
    it('should return webhook by valid ID', async () => {
      const mockWebhook = {
        _id: '507f1f77bcf86cd799439011',
        url: 'https://example.com/webhook',
        active: true
      };
      
      mockCollection.findOne.mockResolvedValue(mockWebhook);

      const webhook = await getWebhookById('507f1f77bcf86cd799439011');

      expect(webhook).toEqual(mockWebhook);
      expect(mockCollection.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: expect.any(Object) })
      );
    });

    it('should return null for invalid ID', async () => {
      const webhook = await getWebhookById('invalid-id');

      expect(webhook).toBeNull();
      expect(mockCollection.findOne).not.toHaveBeenCalled();
    });

    it('should return null when webhook not found', async () => {
      mockCollection.findOne.mockResolvedValue(null);

      const webhook = await getWebhookById('507f1f77bcf86cd799439011');

      expect(webhook).toBeNull();
    });
  });

  describe('updateWebhook', () => {
    it('should update webhook with valid data', async () => {
      const mockUpdatedWebhook = {
        _id: '507f1f77bcf86cd799439011',
        url: 'https://example.com/new-webhook',
        active: true,
        updatedAt: new Date().toISOString()
      };
      
      mockCollection.findOneAndUpdate.mockResolvedValue(mockUpdatedWebhook);

      const updates = {
        url: 'https://example.com/new-webhook',
        description: 'Updated description'
      };

      const webhook = await updateWebhook('507f1f77bcf86cd799439011', updates);

      expect(webhook).toEqual(mockUpdatedWebhook);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ _id: expect.any(Object) }),
        expect.objectContaining({
          $set: expect.objectContaining({
            url: updates.url,
            description: updates.description,
            updatedAt: expect.any(String)
          })
        }),
        { returnDocument: 'after' }
      );
    });

    it('should reject non-HTTPS URL in update', async () => {
      const updates = {
        url: 'http://example.com/webhook'
      };

      await expect(updateWebhook('507f1f77bcf86cd799439011', updates))
        .rejects.toThrow('Webhook URL must use HTTPS');
      
      expect(mockCollection.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should return null for invalid ID', async () => {
      const webhook = await updateWebhook('invalid-id', { active: false });

      expect(webhook).toBeNull();
      expect(mockCollection.findOneAndUpdate).not.toHaveBeenCalled();
    });

    it('should update active status', async () => {
      mockCollection.findOneAndUpdate.mockResolvedValue({
        _id: '507f1f77bcf86cd799439011',
        active: false
      });

      await updateWebhook('507f1f77bcf86cd799439011', { active: false });

      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $set: expect.objectContaining({ active: false })
        }),
        expect.any(Object)
      );
    });
  });

  describe('deleteWebhook', () => {
    it('should delete webhook by valid ID', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

      const result = await deleteWebhook('507f1f77bcf86cd799439011');

      expect(result).toBe(true);
      expect(mockCollection.deleteOne).toHaveBeenCalledWith(
        expect.objectContaining({ _id: expect.any(Object) })
      );
    });

    it('should return false for invalid ID', async () => {
      const result = await deleteWebhook('invalid-id');

      expect(result).toBe(false);
      expect(mockCollection.deleteOne).not.toHaveBeenCalled();
    });

    it('should return false when webhook not found', async () => {
      mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

      const result = await deleteWebhook('507f1f77bcf86cd799439011');

      expect(result).toBe(false);
    });
  });

  describe('disableWebhook', () => {
    it('should disable webhook by setting active to false', async () => {
      const mockDisabledWebhook = {
        _id: '507f1f77bcf86cd799439011',
        url: 'https://example.com/webhook',
        active: false,
        updatedAt: new Date().toISOString()
      };
      
      mockCollection.findOneAndUpdate.mockResolvedValue(mockDisabledWebhook);

      const webhook = await disableWebhook('507f1f77bcf86cd799439011');

      expect(webhook).toEqual(mockDisabledWebhook);
      expect(mockCollection.findOneAndUpdate).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          $set: expect.objectContaining({ active: false })
        }),
        expect.any(Object)
      );
    });

    it('should preserve webhook configuration when disabling', async () => {
      const mockWebhook = {
        _id: '507f1f77bcf86cd799439011',
        url: 'https://example.com/webhook',
        eventTypes: ['event.created'],
        description: 'Test webhook',
        active: false
      };
      
      mockCollection.findOneAndUpdate.mockResolvedValue(mockWebhook);

      const webhook = await disableWebhook('507f1f77bcf86cd799439011');

      expect(webhook?.url).toBe(mockWebhook.url);
      expect(webhook?.eventTypes).toEqual(mockWebhook.eventTypes);
      expect(webhook?.description).toBe(mockWebhook.description);
    });
  });
});
