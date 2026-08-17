'use client';

// components/fanmass/SettingsTab.tsx
// WHAT: Settings tab content for /admin/fanmass — edit fanmass's 16
//     allowlisted operational settings (lib/fanmassSettingsAllowlist.ts) and
//     rotate its API key, sourced from sections.settings on the
//     fanmass_dashboard_snapshot the parent tab shell already polls.
// WHY "queued", never "saved": fanmass has no hot-reload (config.py reads
//     settings.json once at process start) — every change here only takes
//     effect after fanmass's own worker/API process is restarted. This tab
//     must never imply otherwise, so success renders as a persistent banner,
//     not a toast, and never optimistically updates the displayed values —
//     they only change once a fresh snapshot (post-restart) reflects them.
// WHY only 2 of 3 defense-in-depth layers visible here: this UI's allowlist
//     (lib/fanmassSettingsAllowlist.ts) is layer 1 — a usability guarantee,
//     not a security boundary by itself. Layer 2 (the admin enqueue route's
//     findDisallowedSettingsKeys) and layer 3 (fanmass's config.py
//     SETTINGS_WRITABLE_KEYS) are what actually make an out-of-allowlist or
//     credential write impossible even if this UI has a bug.
// WHY settings.rotateApiKey is its own command type, not a payload marker:
//     the already-built admin enqueue route (app/api/admin/fanmass/commands)
//     and fanmass's own dispatcher (fanmass#80/#81) both treat
//     'settings.rotateApiKey' as a distinct KNOWN_COMMAND_TYPE from
//     'settings.update' — this follows the real, already-wired contract.

import React, { useEffect, useState } from 'react';
import { Badge, Button, NumberInput, Stack, Group, Switch, Text, Textarea, TextInput } from '@mantine/core';
import { useGdsConfirm } from '@sovereignsquad/gds-core/client';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import { apiPost } from '@/lib/apiClient';
import { FANMASS_SETTINGS_ALLOWLIST, type FanmassSettingsField, type FanmassSettingsValues } from '@/lib/fanmassSettingsAllowlist';
import styles from './SettingsTab.module.css';

type FieldKind = 'text' | 'textarea' | 'number' | 'boolean';

const FIELD_META: Record<FanmassSettingsField, { label: string; kind: FieldKind; min?: number; max?: number; step?: number }> = {
  vlmProvider: { label: 'VLM provider', kind: 'text' },
  vlmModel: { label: 'VLM model', kind: 'text' },
  ollamaBaseUrl: { label: 'Ollama base URL', kind: 'text' },
  ollamaTimeoutSeconds: { label: 'Ollama timeout (seconds)', kind: 'number', min: 1 },
  semanticModelId: { label: 'Semantic model ID', kind: 'text' },
  semanticModelRepo: { label: 'Semantic model repo', kind: 'text' },
  semanticModelFile: { label: 'Semantic model file', kind: 'text' },
  yoloConfidence: { label: 'YOLO confidence', kind: 'number', min: 0, max: 1, step: 0.01 },
  defaultPrompt: { label: 'Default prompt', kind: 'textarea' },
  batchUploadChunkSize: { label: 'Batch upload chunk size', kind: 'number', min: 1 },
  maxUploadBytes: { label: 'Max upload bytes', kind: 'number', min: 1 },
  cameraPollMinutes: { label: 'Camera poll interval (minutes)', kind: 'number', min: 1 },
  messmassPushMinutes: { label: 'Messmass push interval (minutes)', kind: 'number', min: 1 },
  gdrivePollMinutes: { label: 'Google Drive poll interval (minutes)', kind: 'number', min: 1 },
  cameraBackfill: { label: 'Camera backfill', kind: 'boolean' },
  gdriveBackfill: { label: 'Google Drive backfill', kind: 'boolean' },
};

interface SettingsTabProps {
  settings: FanmassSettingsValues | undefined;
}

export default function SettingsTab({ settings }: SettingsTabProps) {
  const { confirm } = useGdsConfirm();
  const [lastKnown, setLastKnown] = useState<FanmassSettingsValues | null>(null);
  const [form, setForm] = useState<FanmassSettingsValues>({});
  const [submitting, setSubmitting] = useState(false);
  const [queuedBanner, setQueuedBanner] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Seeded from the snapshot, never from a submitted value — see module header.
  useEffect(() => {
    if (!settings) return;
    setLastKnown(settings);
    setForm(settings);
  }, [settings]);

  if (!settings) {
    return (
      <AnalyticsSectionCard title="Settings" subtitle="Analysis-pipeline defaults and local API key.">
        <Text className={styles.placeholder}>
          Fanmass hasn&apos;t reported its current settings yet. Once it has, they&apos;ll appear here.
        </Text>
      </AnalyticsSectionCard>
    );
  }

  const diff: Partial<FanmassSettingsValues> = {};
  for (const key of FANMASS_SETTINGS_ALLOWLIST) {
    const next = form[key];
    const prev = lastKnown?.[key];
    if (next !== undefined && next !== prev) (diff as Record<string, unknown>)[key] = next;
  }
  const dirtyKeys = new Set(Object.keys(diff));
  const hasChanges = dirtyKeys.size > 0;

  function setField<K extends FanmassSettingsField>(key: K, value: FanmassSettingsValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    if (!hasChanges || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const data = await apiPost<{ success: boolean; error?: { message?: string } }>('/api/admin/fanmass/commands', {
        type: 'settings.update',
        payload: diff,
      });
      if (data.success) {
        setQueuedBanner("Settings change queued — will apply on fanmass's next restart.");
      } else {
        setSubmitError(data.error?.message || 'Failed to queue the settings change.');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function rotateApiKey() {
    if (submitting) return;
    const ok = await confirm({
      title: 'Rotate API key',
      message: "Rotate the fanmass API key? Anything still configured with the old key will stop authenticating once fanmass restarts.",
      danger: true,
    });
    if (!ok) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const data = await apiPost<{ success: boolean; error?: { message?: string } }>('/api/admin/fanmass/commands', {
        type: 'settings.rotateApiKey',
        payload: {},
      });
      if (data.success) {
        setQueuedBanner("API key rotation queued — will apply on fanmass's next restart.");
      } else {
        setSubmitError(data.error?.message || 'Failed to queue the key rotation.');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AnalyticsSectionCard title="Settings" subtitle="Analysis-pipeline defaults and local API key.">
      <Stack gap="md">
        <div aria-live="polite">
          {queuedBanner && <Text className={styles.queuedBanner}>{queuedBanner}</Text>}
          {submitError && <Text className={styles.errorText}>{submitError}</Text>}
        </div>

        <Stack gap="sm">
          {FANMASS_SETTINGS_ALLOWLIST.map((key) => {
            const meta = FIELD_META[key];
            const changed = dirtyKeys.has(key);
            const wrapperClass = changed ? styles.changedField : undefined;
            if (meta.kind === 'text') {
              return (
                <TextInput
                  key={key}
                  className={wrapperClass}
                  label={meta.label}
                  value={(form[key] as string) ?? ''}
                  onChange={(e) => setField(key, e.currentTarget.value)}
                  rightSection={changed ? <Badge size="xs">changed</Badge> : undefined}
                  rightSectionWidth={changed ? 70 : undefined}
                />
              );
            }
            if (meta.kind === 'textarea') {
              return (
                <Textarea
                  key={key}
                  className={wrapperClass}
                  label={meta.label}
                  value={(form[key] as string) ?? ''}
                  onChange={(e) => setField(key, e.currentTarget.value)}
                  autosize
                  minRows={2}
                  maxLength={4000}
                  description={changed ? 'changed' : undefined}
                />
              );
            }
            if (meta.kind === 'number') {
              return (
                <NumberInput
                  key={key}
                  className={wrapperClass}
                  label={meta.label}
                  value={form[key] as number | undefined}
                  onChange={(v) => setField(key, (typeof v === 'number' ? v : Number(v) || 0) as never)}
                  min={meta.min}
                  max={meta.max}
                  step={meta.step}
                  description={changed ? 'changed' : undefined}
                />
              );
            }
            return (
              <Switch
                key={key}
                className={wrapperClass}
                label={meta.label}
                checked={!!form[key]}
                onChange={(e) => setField(key, e.currentTarget.checked as never)}
                description={changed ? 'changed' : undefined}
              />
            );
          })}
        </Stack>

        <Group gap="sm">
          <Button onClick={submit} disabled={!hasChanges || submitting} loading={submitting}>
            {submitting ? 'Queuing…' : 'Save changes'}
          </Button>
          <Button onClick={rotateApiKey} disabled={submitting} color="red" variant="outline">
            Rotate API Key
          </Button>
        </Group>
      </Stack>
    </AnalyticsSectionCard>
  );
}
