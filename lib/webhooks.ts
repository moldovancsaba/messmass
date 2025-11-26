// lib/webhooks.ts
// WHAT: Webhook management and delivery system
// WHY: Allow external services to receive real-time notifications of MessMass events
// HOW: Store webhook configurations, deliver payloads with retry logic, track statistics

import { ObjectId } from 'mongodb';
import { getDb } from './db';
import crypto from 'crypto';

/**
 * Webhook document interface
 */
export interface WebhookDoc {
  _id?: ObjectId;
  url: string; // HTTPS only
  secret: string; // For HMAC-SHA256 signature
  eventTypes: string[]; // ['event.created', 'event.updated']
  active: boolean;
  description?: string;
  
  // Delivery statistics
  totalDeliveries: number;
  successfulDeliveries: number;
  failedDeliveries: number;
  consecutiveFailures: number; // Auto-disable after 10
  lastDeliveryAt?: string;
  lastDeliveryStatus?: 'success' | 'failed';
  lastDeliveryError?: string;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
}

/**
 * Webhook payload interface
 */
export interface WebhookPayload {
  event: 'event.created' | 'event.updated';
  timestamp: string;
  data: {
    id: string;
    eventName: string;
    eventDate: string;
    viewSlug: string;
    [key: string]: any;
  };
}

/**
 * Webhook delivery log interface
 */
export interface WebhookDeliveryLog {
  _id?: ObjectId;
  webhookId: ObjectId;
  webhookUrl: string;
  payload: WebhookPayload;
  attempt: number;
  status: 'success' | 'failed';
  statusCode?: number;
  responseBody?: string;
  error?: string;
  deliveredAt: string;
}

/**
 * createWebhook
 * WHAT: Create a new webhook configuration
 * WHY: Allow admins to register webhooks for event notifications
 * 
 * @param params - Webhook configuration
 * @returns Created webhook document
 */
export async function createWebhook(params: {
  url: string;
  eventTypes: string[];
  description?: string;
}): Promise<WebhookDoc> {
  // Validate HTTPS URL
  if (!params.url.startsWith('https://')) {
    throw new Error('Webhook URL must use HTTPS');
  }
  
  const db = await getDb();
  const collection = db.collection<WebhookDoc>('webhooks');
  
  // Generate unique secret for signature
  const secret = crypto.randomBytes(32).toString('hex');
  
  const webhook: WebhookDoc = {
    url: params.url,
    secret,
    eventTypes: params.eventTypes,
    active: true,
    description: params.description,
    totalDeliveries: 0,
    successfulDeliveries: 0,
    failedDeliveries: 0,
    consecutiveFailures: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  const result = await collection.insertOne(webhook);
  webhook._id = result.insertedId;
  
  return webhook;
}

/**
 * getWebhooks
 * WHAT: Query webhooks with optional filtering
 * WHY: Admin UI needs to list and manage webhooks
 * 
 * @param params - Query parameters
 * @returns Array of webhook documents
 */
export async function getWebhooks(params?: {
  active?: boolean;
  eventType?: string;
}): Promise<WebhookDoc[]> {
  const db = await getDb();
  const collection = db.collection<WebhookDoc>('webhooks');
  
  const filter: any = {};
  
  if (params?.active !== undefined) {
    filter.active = params.active;
  }
  
  if (params?.eventType) {
    filter.eventTypes = params.eventType;
  }
  
  return await collection.find(filter).sort({ createdAt: -1 }).toArray();
}

/**
 * getWebhookById
 * WHAT: Get a single webhook by ID
 * WHY: Need to retrieve webhook for updates and delivery
 * 
 * @param id - Webhook ID
 * @returns Webhook document or null
 */
export async function getWebhookById(id: string): Promise<WebhookDoc | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  
  const db = await getDb();
  const collection = db.collection<WebhookDoc>('webhooks');
  
  return await collection.findOne({ _id: new ObjectId(id) });
}

/**
 * updateWebhook
 * WHAT: Update webhook configuration
 * WHY: Allow admins to modify webhook settings
 * 
 * @param id - Webhook ID
 * @param updates - Fields to update
 * @returns Updated webhook document or null
 */
export async function updateWebhook(
  id: string,
  updates: {
    url?: string;
    eventTypes?: string[];
    description?: string;
    active?: boolean;
  }
): Promise<WebhookDoc | null> {
  if (!ObjectId.isValid(id)) {
    return null;
  }
  
  // Validate HTTPS URL if provided
  if (updates.url && !updates.url.startsWith('https://')) {
    throw new Error('Webhook URL must use HTTPS');
  }
  
  const db = await getDb();
  const collection = db.collection<WebhookDoc>('webhooks');
  
  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(id) },
    {
      $set: {
        ...updates,
        updatedAt: new Date().toISOString()
      }
    },
    { returnDocument: 'after' }
  );
  
  return result || null;
}

/**
 * deleteWebhook
 * WHAT: Delete a webhook
 * WHY: Allow admins to remove webhooks
 * 
 * @param id - Webhook ID
 * @returns True if deleted, false otherwise
 */
export async function deleteWebhook(id: string): Promise<boolean> {
  if (!ObjectId.isValid(id)) {
    return false;
  }
  
  const db = await getDb();
  const collection = db.collection<WebhookDoc>('webhooks');
  
  const result = await collection.deleteOne({ _id: new ObjectId(id) });
  return result.deletedCount > 0;
}

/**
 * disableWebhook
 * WHAT: Disable a webhook without deleting it
 * WHY: Preserve configuration while stopping deliveries
 * 
 * @param id - Webhook ID
 * @returns Updated webhook or null
 */
export async function disableWebhook(id: string): Promise<WebhookDoc | null> {
  return await updateWebhook(id, { active: false });
}

/**
 * generateWebhookSignature
 * WHAT: Generate HMAC-SHA256 signature for webhook payload
 * WHY: Allow webhook receivers to verify authenticity of requests
 * 
 * @param payload - Webhook payload object
 * @param secret - Webhook secret key
 * @returns HMAC-SHA256 signature as hex string
 */
export function generateWebhookSignature(payload: WebhookPayload, secret: string): string {
  const payloadString = JSON.stringify(payload);
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payloadString);
  return hmac.digest('hex');
}

/**
 * createWebhookIndexes
 * WHAT: Create database indexes for webhook collection
 * WHY: Optimize query performance
 * 
 * @returns Promise that resolves when indexes are created
 */
export async function createWebhookIndexes(): Promise<void> {
  const db = await getDb();
  const collection = db.collection('webhooks');
  
  await collection.createIndex({ active: 1, eventTypes: 1 });
  await collection.createIndex({ createdAt: -1 });
}


/**
 * deliverWebhook
 * WHAT: Deliver webhook payload to registered URL with retry logic
 * WHY: Ensure reliable delivery even with temporary failures
 * 
 * @param webhook - Webhook configuration
 * @param payload - Payload to deliver
 * @returns Promise with delivery result
 */
export async function deliverWebhook(
  webhook: WebhookDoc,
  payload: WebhookPayload
): Promise<{
  success: boolean;
  attempts: number;
  lastError?: string;
  statusCode?: number;
}> {
  const db = await getDb();
  const webhooksCollection = db.collection<WebhookDoc>('webhooks');
  const logsCollection = db.collection<WebhookDeliveryLog>('webhook_delivery_logs');
  
  // Generate signature
  const signature = generateWebhookSignature(payload, webhook.secret);
  
  // Retry configuration: 1s, 5s, 15s
  const retryDelays = [0, 1000, 5000, 15000];
  const maxAttempts = 4;
  
  let lastError: string | undefined;
  let lastStatusCode: number | undefined;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // Wait before retry (except first attempt)
    if (attempt > 1) {
      await new Promise(resolve => setTimeout(resolve, retryDelays[attempt - 1]));
    }
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'User-Agent': 'MessMass-Webhook/1.0'
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      const statusCode = response.status;
      const responseBody = await response.text().catch(() => '');
      
      // Log delivery attempt
      await logsCollection.insertOne({
        webhookId: webhook._id!,
        webhookUrl: webhook.url,
        payload,
        attempt,
        status: response.ok ? 'success' : 'failed',
        statusCode,
        responseBody: responseBody.substring(0, 1000), // Limit to 1000 chars
        deliveredAt: new Date().toISOString()
      });
      
      if (response.ok) {
        // Success! Update webhook statistics
        await webhooksCollection.updateOne(
          { _id: webhook._id },
          {
            $inc: {
              totalDeliveries: 1,
              successfulDeliveries: 1
            },
            $set: {
              consecutiveFailures: 0,
              lastDeliveryAt: new Date().toISOString(),
              lastDeliveryStatus: 'success'
            },
            $unset: {
              lastDeliveryError: ''
            }
          }
        );
        
        return {
          success: true,
          attempts: attempt,
          statusCode
        };
      }
      
      lastError = `HTTP ${statusCode}: ${responseBody.substring(0, 200)}`;
      lastStatusCode = statusCode;
      
    } catch (error: any) {
      lastError = error.name === 'AbortError' 
        ? 'Request timeout (10s)' 
        : error.message || 'Unknown error';
      
      // Log failed attempt
      await logsCollection.insertOne({
        webhookId: webhook._id!,
        webhookUrl: webhook.url,
        payload,
        attempt,
        status: 'failed',
        error: lastError,
        deliveredAt: new Date().toISOString()
      });
    }
  }
  
  // All attempts failed
  const consecutiveFailures = (webhook.consecutiveFailures || 0) + 1;
  const shouldDisable = consecutiveFailures >= 10;
  
  await webhooksCollection.updateOne(
    { _id: webhook._id },
    {
      $inc: {
        totalDeliveries: 1,
        failedDeliveries: 1
      },
      $set: {
        consecutiveFailures,
        lastDeliveryAt: new Date().toISOString(),
        lastDeliveryStatus: 'failed',
        lastDeliveryError: lastError,
        ...(shouldDisable ? { active: false } : {})
      }
    }
  );
  
  return {
    success: false,
    attempts: maxAttempts,
    lastError,
    statusCode: lastStatusCode
  };
}

/**
 * triggerWebhooks
 * WHAT: Trigger all active webhooks for a specific event type
 * WHY: Notify external services of MessMass events
 * 
 * @param eventType - Type of event ('event.created' or 'event.updated')
 * @param eventData - Event data to include in payload
 * @returns Promise that resolves when all webhooks are triggered
 */
export async function triggerWebhooks(
  eventType: 'event.created' | 'event.updated',
  eventData: {
    id: string;
    eventName: string;
    eventDate: string;
    viewSlug: string;
    [key: string]: any;
  }
): Promise<void> {
  // Get all active webhooks for this event type
  const webhooks = await getWebhooks({
    active: true,
    eventType
  });
  
  if (webhooks.length === 0) {
    return; // No webhooks to trigger
  }
  
  const payload: WebhookPayload = {
    event: eventType,
    timestamp: new Date().toISOString(),
    data: eventData
  };
  
  // Deliver to all webhooks asynchronously (don't block)
  const deliveryPromises = webhooks.map(webhook => 
    deliverWebhook(webhook, payload).catch(error => {
      console.error(`[Webhook] Failed to deliver to ${webhook.url}:`, error);
    })
  );
  
  // Fire and forget - don't wait for deliveries to complete
  Promise.all(deliveryPromises).catch(error => {
    console.error('[Webhook] Error in webhook delivery:', error);
  });
}

/**
 * createWebhookDeliveryLogIndexes
 * WHAT: Create database indexes for webhook delivery logs
 * WHY: Optimize query performance for delivery history
 * 
 * @returns Promise that resolves when indexes are created
 */
export async function createWebhookDeliveryLogIndexes(): Promise<void> {
  const db = await getDb();
  const collection = db.collection('webhook_delivery_logs');
  
  await collection.createIndex({ webhookId: 1, deliveredAt: -1 });
  await collection.createIndex({ deliveredAt: -1 });
  await collection.createIndex({ status: 1, deliveredAt: -1 });
}
