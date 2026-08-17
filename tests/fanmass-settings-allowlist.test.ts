// tests/fanmass-settings-allowlist.test.ts
// WHAT: The server-side revalidation layer for settings.update payloads.
// WHY: This is the second of three defense-in-depth layers (client UI,
//     this check, fanmass's own config.py allowlist) — it must reject
//     anything off-list on its own, never trusting the caller.

import { FANMASS_SETTINGS_ALLOWLIST, findDisallowedSettingsKeys, isFanmassSettingsField } from '@/lib/fanmassSettingsAllowlist';

describe('findDisallowedSettingsKeys', () => {
  it('accepts a payload of only allowlisted keys', () => {
    expect(findDisallowedSettingsKeys({ yoloConfidence: 0.5, cameraBackfill: true })).toEqual([]);
  });

  it('rejects a credential-shaped key even mixed with allowed keys', () => {
    const disallowed = findDisallowedSettingsKeys({ yoloConfidence: 0.5, mongoUri: 'mongodb://evil' });
    expect(disallowed).toContain('mongoUri');
  });

  it('rejects apiKey specifically — it is never allowlisted', () => {
    expect(findDisallowedSettingsKeys({ apiKey: 'attacker-supplied' })).toEqual(['apiKey']);
  });

  it('accepts the bare rotateApiKey marker with no other keys', () => {
    expect(findDisallowedSettingsKeys({ rotateApiKey: true })).toEqual([]);
  });

  it('does not let rotateApiKey smuggle an extra key past validation', () => {
    const disallowed = findDisallowedSettingsKeys({ rotateApiKey: true, mongoUri: 'x' });
    expect(disallowed).toContain('mongoUri');
  });

  it('every allowlisted field passes isFanmassSettingsField', () => {
    for (const field of FANMASS_SETTINGS_ALLOWLIST) {
      expect(isFanmassSettingsField(field)).toBe(true);
    }
  });

  it('a representative set of credential fields are all rejected', () => {
    const credentials = [
      'mongoUri', 'apiKey', 'messmassApiKey', 'messmassCallbackSecret', 'cameraApiKey',
      'gdriveServiceAccountKeyJson', 'gdriveOauthClientSecret', 'ssoClientSecret',
    ];
    for (const field of credentials) {
      expect(isFanmassSettingsField(field)).toBe(false);
    }
  });
});
