// lib/__tests__/apiAuth.write-auth.test.ts
// WHAT: Tests for write authentication middleware
// WHY: Validate requireAPIWriteAuth() enforces write permissions correctly
// REQUIRES: Testing framework (Jest/Vitest) + fast-check for property tests

/**
 * NOTE: This test file is ready to run once testing framework is configured.
 * 
 * Property 6: Write authentication
 * Validates: Requirements 2.1
 * 
 * For any user with various permission combinations, verify only users with
 * both apiKeyEnabled=true AND apiWriteEnabled=true can write.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import { NextRequest } from 'next/server';
import { requireAPIWriteAuth } from '../apiAuth';
import { createUser, deleteUser, toggleAPIAccess, toggleAPIWriteAccess } from '../users';

describe('requireAPIWriteAuth - Property Tests', () => {
  /**
   * Property 6: Write authentication
   * 
   * For any user, write access should be granted if and only if:
   * - apiKeyEnabled is true, AND
   * - apiWriteEnabled is true
   * 
   * This property tests all 4 combinations of these flags.
   */
  it('Property 6: should only grant write access when both flags are enabled', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate random permission combinations
        fc.record({
          apiKeyEnabled: fc.boolean(),
          apiWriteEnabled: fc.boolean(),
          email: fc.emailAddress(),
          name: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async (userConfig) => {
          // Feature: third-party-fan-data-integration, Property 6: Write authentication
          // Validates: Requirements 2.1
          
          // Arrange - create test user
          const testUser = await createUser({
            email: userConfig.email,
            name: userConfig.name,
            role: 'admin',
            password: `test-password-${Date.now()}-${Math.random()}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
          
          const userId = testUser._id!.toString();
          
          try {
            // Set permissions according to test case
            await toggleAPIAccess(userId, userConfig.apiKeyEnabled);
            await toggleAPIWriteAccess(userId, userConfig.apiWriteEnabled);
            
            // Create mock request with Bearer token
            const request = new NextRequest('https://test.com/api/test', {
              headers: {
                'Authorization': `Bearer ${testUser.password}`
              }
            });
            
            // Act
            const result = await requireAPIWriteAuth(request);
            
            // Assert - write access granted only when BOTH flags are true
            const shouldHaveAccess = userConfig.apiKeyEnabled && userConfig.apiWriteEnabled;
            
            if (shouldHaveAccess) {
              expect(result.success).toBe(true);
              expect(result.user).toBeDefined();
              expect(result.response).toBeUndefined();
            } else {
              expect(result.success).toBe(false);
              expect(result.response).toBeDefined();
              
              // Check correct error code
              if (!userConfig.apiKeyEnabled) {
                // Should fail at API auth level
                const responseData = await result.response!.json();
                expect(responseData.errorCode).toBe('API_ACCESS_DISABLED');
              } else {
                // Should fail at write auth level
                const responseData = await result.response!.json();
                expect(responseData.errorCode).toBe('WRITE_ACCESS_DISABLED');
              }
            }
          } finally {
            // Cleanup
            await deleteUser(userId);
          }
        }
      ),
      { numRuns: 100 } // Run 100 iterations as specified in design
    );
  });
});

describe('requireAPIWriteAuth - Unit Tests', () => {
  let testUserId: string;
  let testPassword: string;
  
  beforeEach(async () => {
    // Create a test user
    testPassword = `test-password-${Date.now()}`;
    const testUser = await createUser({
      email: `test-write-auth-${Date.now()}@test.com`,
      name: 'Test User',
      role: 'admin',
      password: testPassword,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    testUserId = testUser._id!.toString();
  });
  
  afterEach(async () => {
    // Clean up test user
    await deleteUser(testUserId);
  });
  
  it('should return 403 when apiKeyEnabled=true but apiWriteEnabled=false', async () => {
    // Arrange
    await toggleAPIAccess(testUserId, true);
    await toggleAPIWriteAccess(testUserId, false);
    
    const request = new NextRequest('https://test.com/api/test', {
      headers: {
        'Authorization': `Bearer ${testPassword}`
      }
    });
    
    // Act
    const result = await requireAPIWriteAuth(request);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.response).toBeDefined();
    
    const responseData = await result.response!.json();
    expect(responseData.errorCode).toBe('WRITE_ACCESS_DISABLED');
    expect(result.response!.status).toBe(403);
  });
  
  it('should return 401 when apiKeyEnabled=false', async () => {
    // Arrange
    await toggleAPIAccess(testUserId, false);
    await toggleAPIWriteAccess(testUserId, true);
    
    const request = new NextRequest('https://test.com/api/test', {
      headers: {
        'Authorization': `Bearer ${testPassword}`
      }
    });
    
    // Act
    const result = await requireAPIWriteAuth(request);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.response).toBeDefined();
    
    const responseData = await result.response!.json();
    expect(responseData.errorCode).toBe('API_ACCESS_DISABLED');
    expect(result.response!.status).toBe(401);
  });
  
  it('should return 401 when no Authorization header', async () => {
    // Arrange
    await toggleAPIAccess(testUserId, true);
    await toggleAPIWriteAccess(testUserId, true);
    
    const request = new NextRequest('https://test.com/api/test');
    
    // Act
    const result = await requireAPIWriteAuth(request);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.response).toBeDefined();
    
    const responseData = await result.response!.json();
    expect(responseData.errorCode).toBe('MISSING_TOKEN');
    expect(result.response!.status).toBe(401);
  });
  
  it('should succeed when both apiKeyEnabled and apiWriteEnabled are true', async () => {
    // Arrange
    await toggleAPIAccess(testUserId, true);
    await toggleAPIWriteAccess(testUserId, true);
    
    const request = new NextRequest('https://test.com/api/test', {
      headers: {
        'Authorization': `Bearer ${testPassword}`
      }
    });
    
    // Act
    const result = await requireAPIWriteAuth(request);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.user).toBeDefined();
    expect(result.user?.id).toBe(testUserId);
    expect(result.response).toBeUndefined();
  });
  
  it('should include WWW-Authenticate header in 403 response', async () => {
    // Arrange
    await toggleAPIAccess(testUserId, true);
    await toggleAPIWriteAccess(testUserId, false);
    
    const request = new NextRequest('https://test.com/api/test', {
      headers: {
        'Authorization': `Bearer ${testPassword}`
      }
    });
    
    // Act
    const result = await requireAPIWriteAuth(request);
    
    // Assert
    expect(result.response).toBeDefined();
    expect(result.response!.headers.get('WWW-Authenticate')).toContain('Bearer');
    expect(result.response!.headers.get('WWW-Authenticate')).toContain('insufficient_scope');
  });
});

/**
 * Test Coverage Summary:
 * 
 * Property Tests:
 * ✓ Property 6: All permission combinations (100 iterations)
 * 
 * Unit Tests:
 * ✓ apiKeyEnabled=true, apiWriteEnabled=false → 403
 * ✓ apiKeyEnabled=false → 401
 * ✓ No Authorization header → 401
 * ✓ Both flags true → success
 * ✓ WWW-Authenticate header present
 * 
 * Requirements Validated:
 * - 2.1: Write authentication with dual permission check
 * - 4.2: Permission enforcement
 */
