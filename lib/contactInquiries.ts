// lib/contactInquiries.ts
// WHAT: Persist and list contact form submissions for admin review
// WHY: Replace email-only flow with DB-backed inquiries visible in admin

import { getDb } from './db';
import type { ObjectId } from 'mongodb';

const COLLECTION = 'contact_inquiries';

export interface ContactInquiry {
  _id: string;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

/** MongoDB document shape for contact_inquiries collection */
interface ContactInquiryDoc {
  _id: ObjectId;
  name: string;
  email: string;
  message: string;
  createdAt: string;
}

export async function createContactInquiry(params: {
  name: string;
  email: string;
  message: string;
}): Promise<{ id: string }> {
  const db = await getDb();
  const col = db.collection(COLLECTION);
  const now = new Date().toISOString();
  const doc = {
    name: params.name,
    email: params.email,
    message: params.message,
    createdAt: now,
  };
  const result = await col.insertOne(doc);
  return { id: String((result as any).insertedId) };
}

export async function listContactInquiries(): Promise<ContactInquiry[]> {
  const db = await getDb();
  const col = db.collection<ContactInquiryDoc>(COLLECTION);
  const docs = await col.find({}).sort({ createdAt: -1 }).toArray();
  return docs.map((d) => ({
    _id: String(d._id),
    name: d.name,
    email: d.email,
    message: d.message,
    createdAt: d.createdAt,
  }));
}
