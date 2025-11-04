// lib/users.ts
// MongoDB-backed user storage and helpers for admin authentication
// WHAT: Provides CRUD helpers for Users collection (email+password admin model)
// WHY: Centralizes user logic, maximizes reuse, and keeps API routes concise

import { ObjectId } from 'mongodb'
import getDb from './db'

export type UserRole = 'admin' | 'super-admin'

export interface UserDoc {
  _id?: ObjectId
  email: string
  name: string
  role: UserRole
  password: string // Note: per project requirements, we store generated plaintext-like token (MD5-style)
  lastLogin?: string // ISO 8601 with milliseconds (optional for backward compatibility)
  // API Access fields (v10.5.1+)
  apiKeyEnabled?: boolean // Enable/disable API access for this user (default: false)
  apiUsageCount?: number // Track API calls made with this user's key
  lastAPICallAt?: string // ISO 8601 with milliseconds - last successful API request
  createdAt: string // ISO 8601 with milliseconds
  updatedAt: string // ISO 8601 with milliseconds
}

/**
 * getUsersCollection
 * Returns the MongoDB collection handle for users, ensuring indexes exist.
 */
export async function getUsersCollection() {
  const db = await getDb()
  const col = db.collection<UserDoc>('users')
  // Ensure unique index on email for consistency
  try {
    await col.createIndex({ email: 1 }, { unique: true })
  } catch {
    // ignore if exists
  }
  return col
}

/**
 * findUserByEmail
 * Finds a user by lowercased email.
 */
export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const col = await getUsersCollection()
  return col.findOne({ email: email.toLowerCase() })
}

/**
 * findUserById
 * Finds a user by ObjectId string.
 */
export async function findUserById(id: string): Promise<UserDoc | null> {
  const col = await getUsersCollection()
  if (!ObjectId.isValid(id)) return null
  return col.findOne({ _id: new ObjectId(id) })
}

/**
 * createUser
 * Creates a new user with provided email, name, role, password.
 * The password should be generated via the MD5-style generator used for page passwords.
 */
export async function createUser(user: Omit<UserDoc, '_id'>): Promise<UserDoc> {
  const col = await getUsersCollection()
  const now = new Date().toISOString()
  const doc: Omit<UserDoc, '_id'> = {
    ...user,
    email: user.email.toLowerCase(),
    createdAt: user.createdAt || now,
    updatedAt: user.updatedAt || now,
  }
  const res = await col.insertOne(doc)
  return { _id: res.insertedId, ...doc }
}

/**
 * updateUserPassword
 * Regenerates/sets a user's password and updates updatedAt timestamp.
 */
export async function updateUserPassword(id: string, password: string): Promise<UserDoc | null> {
  const col = await getUsersCollection()
  if (!ObjectId.isValid(id)) return null
  const now = new Date().toISOString()
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { password, updatedAt: now } })
  return findUserById(id)
}

/**
 * deleteUser
 * Deletes a user by id.
 */
export async function deleteUser(id: string): Promise<boolean> {
  const col = await getUsersCollection()
  if (!ObjectId.isValid(id)) return false
  const res = await col.deleteOne({ _id: new ObjectId(id) })
  return res.deletedCount === 1
}

/**
 * updateUserLastLogin
 * Updates the lastLogin timestamp for a user.
 */
export async function updateUserLastLogin(id: string): Promise<void> {
  const col = await getUsersCollection()
  if (!ObjectId.isValid(id)) return
  const now = new Date().toISOString()
  await col.updateOne({ _id: new ObjectId(id) }, { $set: { lastLogin: now } })
}

/**
 * listUsers
 * Lists users for admin UI.
 */
export async function listUsers(): Promise<UserDoc[]> {
  const col = await getUsersCollection()
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray()
  return docs
}

/**
 * findUserByPassword
 * WHAT: Finds a user by their password token (used as API key)
 * WHY: Enables Bearer token authentication for public API endpoints
 * 
 * SECURITY NOTE: This is a temporary design pattern for v1 Unified Access Management.
 * Password serves dual purpose: login credential + API key when apiKeyEnabled=true.
 * 
 * ROADMAP: In v2, migrate to dedicated hashed API keys stored separately from login passwords.
 * This will enable:
 *   - Separate key rotation without affecting login
 *   - Multiple keys per user with scopes
 *   - Granular revocation
 * 
 * Current implementation prioritizes:
 *   - Immediate user attribution (know exactly who called what)
 *   - Zero new storage concepts (reuse existing password field)
 *   - Fast delivery with audit trail
 */
export async function findUserByPassword(password: string): Promise<UserDoc | null> {
  const col = await getUsersCollection()
  // WHAT: Query by password field (acts as API key)
  // WHY: Bearer token in Authorization header is the user's password
  return col.findOne({ password })
}

/**
 * updateAPIUsage
 * WHAT: Increments API usage counter and updates lastAPICallAt timestamp
 * WHY: Track API activity for audit trail and usage analytics
 */
export async function updateAPIUsage(id: string): Promise<void> {
  const col = await getUsersCollection()
  if (!ObjectId.isValid(id)) return
  
  const now = new Date().toISOString()
  
  // WHAT: Atomic increment of usage counter + timestamp update
  // WHY: Prevents race conditions in concurrent API calls
  await col.updateOne(
    { _id: new ObjectId(id) },
    { 
      $inc: { apiUsageCount: 1 },
      $set: { lastAPICallAt: now, updatedAt: now }
    }
  )
}

/**
 * toggleAPIAccess
 * WHAT: Enable or disable API access for a user
 * WHY: Admin control over who can use Bearer token authentication
 */
export async function toggleAPIAccess(id: string, enabled: boolean): Promise<UserDoc | null> {
  const col = await getUsersCollection()
  if (!ObjectId.isValid(id)) return null
  
  const now = new Date().toISOString()
  
  await col.updateOne(
    { _id: new ObjectId(id) },
    { $set: { apiKeyEnabled: enabled, updatedAt: now } }
  )
  
  return findUserById(id)
}

