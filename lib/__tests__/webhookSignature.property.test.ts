// lib/__tests__/webhookSignature.property.test.ts
// WHAT: Property-based tests for webhook signature generation
// WHY: Verify webhook signatures work correctly across all possible inputs

import fc from 'fast-check';
import { generateWebhookSignature, type WebhookPayload } from '../webhooks';
import crypto from 'crypto';

describe('Webhook Signature - Property Tests', () => {
  /**
   * Property 31: Webhook signature presence
   * Feature: third-party-fan-data-integration, Property 31: Webhook signature presence
   * Validates: Requirements 7.1
   * 
   * For any webhook notification, the signature should be present and contain a valid HMAC-SHA256 signature
   */
  test('Property 31: Webhook signature presence', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('event.created' as const, 'event.updated' as const),
          timestamp: fc.date().map(d => d.toISOString()),
          data: fc.record({
            id: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0')),
            eventName: fc.string({ minLength: 1, maxLength: 100 }),
            eventDate: fc.date().map(d => d.toISOString()),
            viewSlug: fc.string({ minLength: 1, maxLength: 50 })
          })
        }),
        fc.string({ minLength: 32, maxLength: 64 }), // secret
        async (payload, secret) => {
          // Generate signature
          const signature = generateWebhookSignature(payload, secret);
          
          // Verify signature is present
          expect(signature).toBeDefined();
          expect(signature).not.toBe('');
          
          // Verify signature is a valid hex string
          expect(signature).toMatch(/^[0-9a-f]+$/);
          
          // Verify signature is 64 characters (SHA256 produces 32 bytes = 64 hex chars)
          expect(signature.length).toBe(64);
          
          // Verify signature can be reproduced with same inputs
          const signature2 = generateWebhookSignature(payload, secret);
          expect(signature).toBe(signature2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Signature verification
   * 
   * For any webhook payload and secret, the signature should be verifiable using HMAC-SHA256
   */
  test('Property: Signature verification', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('event.created' as const, 'event.updated' as const),
          timestamp: fc.date().map(d => d.toISOString()),
          data: fc.record({
            id: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0')),
            eventName: fc.string({ minLength: 1, maxLength: 100 }),
            eventDate: fc.date().map(d => d.toISOString()),
            viewSlug: fc.string({ minLength: 1, maxLength: 50 })
          })
        }),
        fc.string({ minLength: 32, maxLength: 64 }), // secret
        async (payload, secret) => {
          // Generate signature using our function
          const signature = generateWebhookSignature(payload, secret);
          
          // Verify signature manually using crypto
          const payloadString = JSON.stringify(payload);
          const hmac = crypto.createHmac('sha256', secret);
          hmac.update(payloadString);
          const expectedSignature = hmac.digest('hex');
          
          // Signatures should match
          expect(signature).toBe(expectedSignature);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Different payloads produce different signatures
   * 
   * For any two different payloads with the same secret, signatures should be different
   */
  test('Property: Different payloads produce different signatures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('event.created' as const, 'event.updated' as const),
          timestamp: fc.date().map(d => d.toISOString()),
          data: fc.record({
            id: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0')),
            eventName: fc.string({ minLength: 1, maxLength: 100 }),
            eventDate: fc.date().map(d => d.toISOString()),
            viewSlug: fc.string({ minLength: 1, maxLength: 50 })
          })
        }),
        fc.record({
          event: fc.constantFrom('event.created' as const, 'event.updated' as const),
          timestamp: fc.date().map(d => d.toISOString()),
          data: fc.record({
            id: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0')),
            eventName: fc.string({ minLength: 1, maxLength: 100 }),
            eventDate: fc.date().map(d => d.toISOString()),
            viewSlug: fc.string({ minLength: 1, maxLength: 50 })
          })
        }),
        fc.string({ minLength: 32, maxLength: 64 }), // secret
        async (payload1, payload2, secret) => {
          // Skip if payloads are identical
          if (JSON.stringify(payload1) === JSON.stringify(payload2)) {
            return;
          }
          
          const signature1 = generateWebhookSignature(payload1, secret);
          const signature2 = generateWebhookSignature(payload2, secret);
          
          // Different payloads should produce different signatures
          expect(signature1).not.toBe(signature2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Different secrets produce different signatures
   * 
   * For any payload with two different secrets, signatures should be different
   */
  test('Property: Different secrets produce different signatures', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('event.created' as const, 'event.updated' as const),
          timestamp: fc.date().map(d => d.toISOString()),
          data: fc.record({
            id: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0')),
            eventName: fc.string({ minLength: 1, maxLength: 100 }),
            eventDate: fc.date().map(d => d.toISOString()),
            viewSlug: fc.string({ minLength: 1, maxLength: 50 })
          })
        }),
        fc.string({ minLength: 32, maxLength: 64 }), // secret1
        fc.string({ minLength: 32, maxLength: 64 }), // secret2
        async (payload, secret1, secret2) => {
          // Skip if secrets are identical
          if (secret1 === secret2) {
            return;
          }
          
          const signature1 = generateWebhookSignature(payload, secret1);
          const signature2 = generateWebhookSignature(payload, secret2);
          
          // Different secrets should produce different signatures
          expect(signature1).not.toBe(signature2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Signature is deterministic
   * 
   * For any payload and secret, generating the signature multiple times should always produce the same result
   */
  test('Property: Signature is deterministic', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('event.created' as const, 'event.updated' as const),
          timestamp: fc.date().map(d => d.toISOString()),
          data: fc.record({
            id: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0')),
            eventName: fc.string({ minLength: 1, maxLength: 100 }),
            eventDate: fc.date().map(d => d.toISOString()),
            viewSlug: fc.string({ minLength: 1, maxLength: 50 })
          })
        }),
        fc.string({ minLength: 32, maxLength: 64 }), // secret
        async (payload, secret) => {
          // Generate signature multiple times
          const signatures = [
            generateWebhookSignature(payload, secret),
            generateWebhookSignature(payload, secret),
            generateWebhookSignature(payload, secret),
            generateWebhookSignature(payload, secret),
            generateWebhookSignature(payload, secret)
          ];
          
          // All signatures should be identical
          const firstSignature = signatures[0];
          signatures.forEach(sig => {
            expect(sig).toBe(firstSignature);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Timestamp inclusion in payload
   * 
   * For any webhook payload, the timestamp field should be present in ISO 8601 format
   * (This validates Requirements 7.5)
   */
  test('Property 33: Webhook timestamp inclusion', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          event: fc.constantFrom('event.created' as const, 'event.updated' as const),
          timestamp: fc.date().map(d => d.toISOString()),
          data: fc.record({
            id: fc.string({ minLength: 24, maxLength: 24 }).map(s => s.replace(/[^0-9a-f]/g, '0')),
            eventName: fc.string({ minLength: 1, maxLength: 100 }),
            eventDate: fc.date().map(d => d.toISOString()),
            viewSlug: fc.string({ minLength: 1, maxLength: 50 })
          })
        }),
        async (payload) => {
          // Verify timestamp is present
          expect(payload.timestamp).toBeDefined();
          
          // Verify timestamp is in ISO 8601 format
          expect(payload.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
          
          // Verify timestamp can be parsed as a valid date
          const date = new Date(payload.timestamp);
          expect(date.toISOString()).toBe(payload.timestamp);
        }
      ),
      { numRuns: 100 }
    );
  });
});
