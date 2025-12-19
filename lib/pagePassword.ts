// lib/pagePassword.ts - Page-specific password generation and management

import { randomBytes } from 'crypto';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';

/**
 * Page password types and interfaces for MessMass authentication system
 */

export type PageType = 'event-report' | 'partner-report' | 'edit' | 'partner-edit' | 'filter' | 'hashtag';

export interface PagePassword {
  _id?: string;
  pageId: string;           // Project slug, edit slug, or filter hash
  pageType: PageType;       // Type of page (stats, edit, filter)
  password: string;         // Generated MD5-style password
  createdAt: string;        // When password was generated
  expiresAt?: string;       // Optional expiration (null = never expires)
  usageCount: number;       // How many times password has been used
  lastUsedAt?: string;      // When password was last used
}

export interface ShareableLink {
  url: string;
  password: string;
  pageType: PageType;
  expiresAt?: string;
}

/**
 * Generate a secure MD5-style password
 * Creates a password that looks like an MD5 hash but is randomly generated
 * 
 * @returns 32-character hexadecimal string (like MD5 hash)
 */
export function generateMD5StylePassword(): string {
  // WHAT: Produce a 32-character lowercase hex string that "looks like" an MD5 hash.
  // WHY: Consumers expect an MD5-style token for page/admin one-time passwords.
  // Strategic choice: Use Node's crypto.randomBytes(16) -> 32 hex chars. This avoids Web Crypto
  // on the server and is sufficient since we only need a random token, not an MD5 digest of input.
  return randomBytes(16).toString('hex');
}

/**
 * Generate or retrieve password for a specific page
 * 
 * @param pageId - Unique identifier for the page (slug, etc.)
 * @param pageType - Type of page (stats, edit, filter)
 * @param regenerate - Force regeneration of existing password
 * @returns Promise<PagePassword>
 */
export async function getOrCreatePagePassword(
  pageId: string, 
  pageType: PageType, 
  regenerate: boolean = false
): Promise<PagePassword> {
  try {
    const client = await clientPromise;
const db = client.db(config.dbName);
    const collection = db.collection('page_passwords');

    // Check if password already exists
    let existingPassword = await collection.findOne({ pageId, pageType });

    if (existingPassword && !regenerate) {
      return {
        _id: existingPassword._id.toString(),
        pageId: existingPassword.pageId,
        pageType: existingPassword.pageType,
        password: existingPassword.password,
        createdAt: existingPassword.createdAt,
        expiresAt: existingPassword.expiresAt,
        usageCount: existingPassword.usageCount,
        lastUsedAt: existingPassword.lastUsedAt
      };
    }

    // Generate new password
    const newPassword: Omit<PagePassword, '_id'> = {
      pageId,
      pageType,
      password: generateMD5StylePassword(),
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    // Update or insert password
    const result = await collection.updateOne(
      { pageId, pageType },
      { $set: newPassword },
      { upsert: true }
    );

    const savedPassword = await collection.findOne({ pageId, pageType });
    
    return {
      _id: savedPassword!._id.toString(),
      pageId: savedPassword!.pageId,
      pageType: savedPassword!.pageType,
      password: savedPassword!.password,
      createdAt: savedPassword!.createdAt,
      expiresAt: savedPassword!.expiresAt,
      usageCount: savedPassword!.usageCount,
      lastUsedAt: savedPassword!.lastUsedAt
    };

  } catch (error) {
    console.error('Failed to generate page password:', error);
    throw new Error('Failed to generate page password');
  }
}

/**
 * Validate page-specific password
 * 
 * @param pageId - Page identifier
 * @param pageType - Type of page
 * @param providedPassword - Password provided by user
 * @returns Promise<boolean>
 */
export async function validatePagePassword(
  pageId: string,
  pageType: PageType,
  providedPassword: string
): Promise<boolean> {
  try {
    const client = await clientPromise;
const db = client.db(config.dbName);
    const collection = db.collection('page_passwords');

    const pagePassword = await collection.findOne({ pageId, pageType });
    
    if (!pagePassword) {
      return false;
    }

    // Check if password matches
    const isValid = pagePassword.password === providedPassword;

    if (isValid) {
      // Update usage statistics
      await collection.updateOne(
        { pageId, pageType },
        { 
          $inc: { usageCount: 1 },
          $set: { lastUsedAt: new Date().toISOString() }
        }
      );
    }

    return isValid;

  } catch (error) {
    console.error('Failed to validate page password:', error);
    return false;
  }
}

/**
 * Check if admin password is valid
 * Uses the existing admin password system
 * 
 * @param providedPassword - Password provided by user
 * @returns boolean
 */
// NOTE: Static admin password via env has been removed.
// Admin session bypass is handled at the API route level (see /api/page-passwords PUT).

/**
 * Validate either admin or page-specific password
 * 
 * @param pageId - Page identifier
 * @param pageType - Type of page
 * @param providedPassword - Password provided by user
 * @returns Promise<{ isValid: boolean, isAdmin: boolean }>
 */
export async function validateAnyPassword(
  pageId: string,
  pageType: PageType,
  providedPassword: string
): Promise<{ isValid: boolean, isAdmin: boolean }> {
  // WHAT: Validate provided password against the page-specific password only.
  // WHY: Legacy static admin password has been removed. Admin access is validated via session
  //      earlier in the API route (admin session bypass). This prevents secret drift and centralizes
  //      admin auth in the DB-backed session system.
  const isPagePasswordValid = await validatePagePassword(pageId, pageType, providedPassword);
  return { isValid: isPagePasswordValid, isAdmin: false };
}

/**
 * Generate shareable link with password for a page
 * 
 * @param pageId - Page identifier
 * @param pageType - Type of page
 * @param baseUrl - Base URL for the application
 * @returns Promise<ShareableLink>
 */
export async function generateShareableLink(
  pageId: string,
  pageType: PageType,
  baseUrl: string = ''
): Promise<ShareableLink> {
  const pagePassword = await getOrCreatePagePassword(pageId, pageType);
  
  let url = baseUrl;
  switch (pageType) {
    case 'event-report':
      // WHAT: Project/event report pages at /report/[slug]
      // WHY: Public shareable event statistics pages
      url += `/report/${pageId}`;
      break;
    case 'partner-report':
      // WHAT: Partner report pages at /partner-report/[slug]
      // WHY: Public shareable partner profile pages with event listings
      url += `/partner-report/${pageId}`;
      break;
    case 'edit':
      url += `/edit/${pageId}`;
      break;
    case 'partner-edit':
      // WHAT: Partner content editing pages at /partner-edit/[slug]
      // WHY: Allow editing partner-level text and image content
      url += `/partner-edit/${pageId}`;
      break;
    case 'filter':
      url += `/filter/${pageId}`;
      break;
  }

  return {
    url,
    password: pagePassword.password,
    pageType,
    expiresAt: pagePassword.expiresAt
  };
}

/**
 * Clean up expired passwords
 * Should be called periodically to maintain database cleanliness
 * 
 * @returns Promise<number> - Number of passwords cleaned up
 */
export async function cleanupExpiredPasswords(): Promise<number> {
  try {
    const client = await clientPromise;
const db = client.db(config.dbName);
    const collection = db.collection('page_passwords');

    const now = new Date().toISOString();
    const result = await collection.deleteMany({
      expiresAt: { $exists: true, $lt: now }
    });

    return result.deletedCount;

  } catch (error) {
    console.error('Failed to cleanup expired passwords:', error);
    return 0;
  }
}

/**
 * Get page password statistics
 * Useful for admin monitoring
 * 
 * @param pageId - Optional page ID to get stats for specific page
 * @returns Promise<object>
 */
export async function getPasswordStats(pageId?: string) {
  try {
    const client = await clientPromise;
const db = client.db(config.dbName);
    const collection = db.collection('page_passwords');

    const filter = pageId ? { pageId } : {};
    
    const total = await collection.countDocuments(filter);
    const used = await collection.countDocuments({ ...filter, usageCount: { $gt: 0 } });
    const neverUsed = total - used;

    const mostUsed = await collection.findOne(
      filter,
      { sort: { usageCount: -1 } }
    );

    return {
      total,
      used,
      neverUsed,
      mostUsed: mostUsed ? {
        pageId: mostUsed.pageId,
        pageType: mostUsed.pageType,
        usageCount: mostUsed.usageCount,
        lastUsedAt: mostUsed.lastUsedAt
      } : null
    };

  } catch (error) {
    console.error('Failed to get password stats:', error);
    return { total: 0, used: 0, neverUsed: 0, mostUsed: null };
  }
}
