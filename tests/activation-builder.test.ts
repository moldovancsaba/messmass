// tests/activation-builder.test.ts
// WHAT: validateResponses -- the check that stops a participation's captured
//     data from silently not matching what the operator declared they'd
//     capture.
// WHY: messmass#228. This is the one piece of real logic that doesn't touch
//     a database (see lib/activationBuilder.ts), so it's what's unit-tested
//     directly; recordParticipation's DB-touching path (template lookup,
//     identity lookup, the fan_identity_link write) is exercised by the live
//     verification in the #228 delivery, matching #227's precedent.

import { validateResponses, type ActivationDataField } from '@/lib/activationBuilder';

const FIELDS: ActivationDataField[] = [
  { key: 'favoriteTeam', label: 'Favorite Team', type: 'text', required: true },
  { key: 'wantsNewsletter', label: 'Wants Newsletter', type: 'boolean', required: false },
  { key: 'ticketTier', label: 'Ticket Tier', type: 'select', required: true, options: ['bronze', 'silver', 'gold'] },
  { key: 'age', label: 'Age', type: 'number', required: false },
];

describe('validateResponses', () => {
  it('accepts a fully valid response set', () => {
    expect(validateResponses(FIELDS, { favoriteTeam: 'Real Madrid', ticketTier: 'gold', wantsNewsletter: true, age: 34 })).toEqual([]);
  });

  it('accepts required fields present and optional fields omitted', () => {
    expect(validateResponses(FIELDS, { favoriteTeam: 'Real Madrid', ticketTier: 'silver' })).toEqual([]);
  });

  it('flags a missing required field', () => {
    const issues = validateResponses(FIELDS, { ticketTier: 'gold' });
    expect(issues).toContain('favoriteTeam is required');
  });

  it('flags an empty string as not present for a required field', () => {
    const issues = validateResponses(FIELDS, { favoriteTeam: '', ticketTier: 'gold' });
    expect(issues).toContain('favoriteTeam is required');
  });

  it('flags a select value outside its declared options', () => {
    const issues = validateResponses(FIELDS, { favoriteTeam: 'x', ticketTier: 'platinum' });
    expect(issues.some((i) => i.includes('ticketTier'))).toBe(true);
  });

  it('flags a type mismatch on an optional field', () => {
    const issues = validateResponses(FIELDS, { favoriteTeam: 'x', ticketTier: 'gold', age: 'thirty-four' });
    expect(issues).toContain('age must be a number');
  });

  it('flags a boolean field given a non-boolean value', () => {
    const issues = validateResponses(FIELDS, { favoriteTeam: 'x', ticketTier: 'gold', wantsNewsletter: 'yes' });
    expect(issues).toContain('wantsNewsletter must be a boolean');
  });

  it('reports every issue at once, not just the first', () => {
    const issues = validateResponses(FIELDS, { ticketTier: 'platinum', age: 'old' });
    expect(issues.length).toBeGreaterThanOrEqual(3); // missing favoriteTeam, bad ticketTier, bad age
  });
});
