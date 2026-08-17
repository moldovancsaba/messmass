// lib/fanmassSettingsAllowlist.ts
// WHAT: The complete set of Fanmass settings fields remotely writable via the
//     settings.update command, plus the shape of their read-only echo in a
//     dashboard snapshot.
// WHY: This is a cross-repo security contract — this list, the fanmass-repo
//     "Settings write-back" issue's SETTINGS_WRITABLE_KEYS constant
//     (config.py), and this module's own server-side revalidation in the
//     admin enqueue route must all agree on exactly this field set. Adding
//     or removing a field here without updating both is a real security
//     regression, not a convenience edit — do not do it as a side effect of
//     unrelated work. `apiKey` is deliberately absent: it is reachable only
//     via the rotateApiKey action marker, never as a text field.

export type FanmassSettingsField =
  | 'vlmProvider'
  | 'vlmModel'
  | 'ollamaBaseUrl'
  | 'ollamaTimeoutSeconds'
  | 'semanticModelId'
  | 'semanticModelRepo'
  | 'semanticModelFile'
  | 'yoloConfidence'
  | 'defaultPrompt'
  | 'batchUploadChunkSize'
  | 'maxUploadBytes'
  | 'cameraPollMinutes'
  | 'messmassPushMinutes'
  | 'gdrivePollMinutes'
  | 'cameraBackfill'
  | 'gdriveBackfill';

export const FANMASS_SETTINGS_ALLOWLIST: FanmassSettingsField[] = [
  'vlmProvider', 'vlmModel', 'ollamaBaseUrl', 'ollamaTimeoutSeconds',
  'semanticModelId', 'semanticModelRepo', 'semanticModelFile',
  'yoloConfidence', 'defaultPrompt', 'batchUploadChunkSize',
  'maxUploadBytes', 'cameraPollMinutes', 'messmassPushMinutes',
  'gdrivePollMinutes', 'cameraBackfill', 'gdriveBackfill',
];

export type FanmassSettingsValues = Partial<Record<FanmassSettingsField, string | number | boolean>>;

// The one non-field action. Never a key on FanmassSettingsValues; never
// carries key material — value is always `true`.
export type RotateApiKeyPayload = { rotateApiKey: true };

export function isFanmassSettingsField(key: string): key is FanmassSettingsField {
  return (FANMASS_SETTINGS_ALLOWLIST as string[]).includes(key);
}

// WHAT: Validate a settings.update payload against the allowlist.
// WHY: Server-side revalidation layer (defense-in-depth alongside the
//     Settings tab's own client-side gate and fanmass's config.py
//     allowlist) — the admin enqueue route must not trust the caller.
// Returns the disallowed key names, or an empty array if every key is
// allowlisted (or the payload is the rotateApiKey marker).
export function findDisallowedSettingsKeys(payload: Record<string, unknown>): string[] {
  if (payload && payload.rotateApiKey === true && Object.keys(payload).length === 1) {
    return [];
  }
  return Object.keys(payload).filter((key) => !isFanmassSettingsField(key));
}
