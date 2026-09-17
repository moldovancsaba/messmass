// lib/activationBuilder.ts
// WHAT: Reusable sponsor-linked activation templates and participation
//     capture -- messmass#228, Phase A.
// WHY: The issue's own scope is "activation templates" + "data capture
//     model" + "linkage from activation outcomes to partner/project
//     reporting" -- that linkage is exactly what messmass#227's
//     fan_identity_links already provides (linkType: 'activation'). Building
//     a second, parallel linking mechanism here would duplicate #227's
//     schema for no reason; every participation recorded here also writes a
//     fan_identity_link, so #227's identity graph and #228's activation data
//     stay one story, not two.
// HOW: A template declares its own data-capture shape (dataFields) rather
//     than assuming one; a participation's `responses` are checked against
//     that shape at write time so what's captured actually matches what the
//     operator declared they'd capture. No participation is recorded without
//     a fanIdentityId, which itself cannot exist without consent (#227) --
//     so zero/first-party capture here is consent-gated by construction.

import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';
import config from '@/lib/config';
import { addFanIdentityLink, getFanIdentity } from '@/lib/fanIdentity';

export type ActivationFieldType = 'text' | 'select' | 'boolean' | 'number';

export interface ActivationDataField {
  key: string;
  label: string;
  type: ActivationFieldType;
  required: boolean;
  options?: string[]; // for type === 'select'
}

export type ActivationTemplateStatus = 'draft' | 'active' | 'archived';

export interface ActivationTemplate {
  _id: ObjectId;
  name: string;
  description?: string;
  /** Attributable to a sponsor/partner scope -- the issue's own constraint. */
  partnerId?: string;
  dataFields: ActivationDataField[];
  status: ActivationTemplateStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivationParticipation {
  _id: ObjectId;
  templateId: ObjectId;
  fanIdentityId: ObjectId;
  responses: Record<string, unknown>;
  occurredAt: string;
  createdAt: string;
}

async function getDb() {
  const client = await clientPromise;
  return client.db(config.dbName);
}
function templatesCollection() {
  return getDb().then((db) => db.collection<ActivationTemplate>('activation_templates'));
}
function participationsCollection() {
  return getDb().then((db) => db.collection<ActivationParticipation>('activation_participations'));
}

export class InvalidResponsesError extends Error {
  constructor(public readonly issues: string[]) {
    super(`Responses do not match the template's data fields: ${issues.join('; ')}`);
    this.name = 'InvalidResponsesError';
  }
}

export async function createActivationTemplate(input: {
  name: string;
  description?: string;
  partnerId?: string;
  dataFields: ActivationDataField[];
  createdBy: string;
}): Promise<ActivationTemplate> {
  const collection = await templatesCollection();
  const now = new Date().toISOString();
  const doc: Omit<ActivationTemplate, '_id'> = {
    name: input.name,
    description: input.description,
    partnerId: input.partnerId,
    dataFields: input.dataFields,
    status: 'draft',
    createdBy: input.createdBy,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(doc as ActivationTemplate);
  return { ...doc, _id: result.insertedId } as ActivationTemplate;
}

export async function listActivationTemplates(): Promise<ActivationTemplate[]> {
  const collection = await templatesCollection();
  return collection.find({}).sort({ createdAt: -1 }).toArray();
}

export async function getActivationTemplate(id: string): Promise<ActivationTemplate | null> {
  if (!ObjectId.isValid(id)) return null;
  const collection = await templatesCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}

/** Every required field must be present; every present field must match its declared type. Pure -- no DB access. */
export function validateResponses(dataFields: ActivationDataField[], responses: Record<string, unknown>): string[] {
  const issues: string[] = [];
  for (const field of dataFields) {
    const value = responses[field.key];
    const present = value !== undefined && value !== null && value !== '';
    if (field.required && !present) {
      issues.push(`${field.key} is required`);
      continue;
    }
    if (!present) continue;

    if (field.type === 'boolean' && typeof value !== 'boolean') issues.push(`${field.key} must be a boolean`);
    if (field.type === 'number' && typeof value !== 'number') issues.push(`${field.key} must be a number`);
    if (field.type === 'text' && typeof value !== 'string') issues.push(`${field.key} must be a string`);
    if (field.type === 'select') {
      if (typeof value !== 'string') issues.push(`${field.key} must be a string`);
      else if (field.options && !field.options.includes(value)) issues.push(`${field.key} must be one of: ${field.options.join(', ')}`);
    }
  }
  return issues;
}

/**
 * WHAT: Record one fan's participation and link it into #227's identity graph.
 * WHY: This is the write that actually connects "activation outcome" to
 *     "sponsor-relevant audience insight" -- without the fan_identity_link,
 *     the participation would be data with nowhere to aggregate from.
 */
export async function recordParticipation(
  templateId: string,
  fanIdentityId: string,
  responses: Record<string, unknown>,
  occurredAt: string
): Promise<ActivationParticipation | { error: 'template_not_found' | 'identity_not_found' | 'invalid_responses'; issues?: string[] }> {
  const template = await getActivationTemplate(templateId);
  if (!template) return { error: 'template_not_found' };

  const identity = await getFanIdentity(fanIdentityId);
  if (!identity) return { error: 'identity_not_found' };

  const issues = validateResponses(template.dataFields, responses);
  if (issues.length > 0) return { error: 'invalid_responses', issues };

  const collection = await participationsCollection();
  const doc: Omit<ActivationParticipation, '_id'> = {
    templateId: template._id,
    fanIdentityId: identity._id,
    responses,
    occurredAt,
    createdAt: new Date().toISOString(),
  };
  const result = await collection.insertOne(doc as ActivationParticipation);
  const participation = { ...doc, _id: result.insertedId } as ActivationParticipation;

  await addFanIdentityLink(fanIdentityId, {
    linkType: 'activation',
    sourceRef: { collection: 'activation_participations', id: participation._id.toString() },
    occurredAt,
  });

  return participation;
}

export async function listParticipations(templateId: string): Promise<ActivationParticipation[]> {
  if (!ObjectId.isValid(templateId)) return [];
  const collection = await participationsCollection();
  return collection.find({ templateId: new ObjectId(templateId) }).sort({ occurredAt: -1 }).toArray();
}

/** Minimal operator analytics: participation count and per-field fill rate -- the issue's "data-yield performance" check. */
export async function getActivationYield(templateId: string): Promise<{
  participationCount: number;
  fieldFillRates: Record<string, number>; // 0-1, fraction of participations with a non-empty value for that field
} | null> {
  const template = await getActivationTemplate(templateId);
  if (!template) return null;
  const participations = await listParticipations(templateId);

  const fieldFillRates: Record<string, number> = {};
  for (const field of template.dataFields) {
    const filled = participations.filter((p) => {
      const v = p.responses[field.key];
      return v !== undefined && v !== null && v !== '';
    }).length;
    fieldFillRates[field.key] = participations.length === 0 ? 0 : filled / participations.length;
  }

  return { participationCount: participations.length, fieldFillRates };
}
