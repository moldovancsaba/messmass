// tests/project-partner-ref.test.ts
// WHAT: lib/projectPartnerRef.ts finds the partner an event document links to: partner1Id / partner2Id (what projects
//     store), else the legacy partner1 / partner2 field, as an ObjectId, a 24-hex string or a populated { _id } object.

import { ObjectId } from 'mongodb';
import { projectPartnerId, toPartnerObjectId } from '@/lib/projectPartnerRef';

const a = new ObjectId();
const b = new ObjectId();

describe('toPartnerObjectId', () => {
  test('accepts an ObjectId, a valid hex string and a populated object', () => {
    expect(String(toPartnerObjectId(a))).toBe(String(a));
    expect(String(toPartnerObjectId(String(a)))).toBe(String(a));
    expect(String(toPartnerObjectId({ _id: a, name: 'x' }))).toBe(String(a));
    expect(String(toPartnerObjectId({ _id: String(a) }))).toBe(String(a));
  });

  test('rejects everything else', () => {
    for (const value of [undefined, null, '', 'not-an-id', 12, {}, { _id: 'nope' }]) {
      expect(toPartnerObjectId(value)).toBeNull();
    }
  });
});

describe('projectPartnerId', () => {
  test('home reads partner1Id, visitor reads partner2Id', () => {
    const project = { partner1Id: a, partner2Id: b };
    expect(String(projectPartnerId(project))).toBe(String(a));
    expect(String(projectPartnerId(project, 'home'))).toBe(String(a));
    expect(String(projectPartnerId(project, 'visitor'))).toBe(String(b));
  });

  test('the legacy fields are the fallback only', () => {
    expect(String(projectPartnerId({ partner1: a }))).toBe(String(a));
    expect(String(projectPartnerId({ partner2: b }, 'visitor'))).toBe(String(b));
    expect(String(projectPartnerId({ partner1Id: a, partner1: b }))).toBe(String(a));
    expect(String(projectPartnerId({ partner1Id: 'broken', partner1: b }))).toBe(String(b));
  });

  test('a side that is not set, or no project, is null', () => {
    expect(projectPartnerId({})).toBeNull();
    expect(projectPartnerId({ partner1Id: a }, 'visitor')).toBeNull();
    expect(projectPartnerId(null)).toBeNull();
    expect(projectPartnerId(undefined)).toBeNull();
  });
});
