'use client';

// components/fanmass/EntityCurationTab.tsx
// WHAT: Entity Curation tab content for /admin/fanmass — confirm/reject
//     unconfirmed poster clusters, and rename/reclassify/merge the confirmed
//     entity catalog, sourced from sections.entityCuration on the
//     fanmass_dashboard_snapshot the parent tab shell already polls.
// WHY two sections, not one list: the real fanmass#80 dispatcher exposes two
//     unrelated concepts under this tab's umbrella — entity.confirm_cluster/
//     entity.reject_cluster act on face CLUSTERS (services/face_clustering.py,
//     integer clusterId, "is this a real poster subject?"), while
//     entity.rename/entity.merge act on the confirmed entity CATALOG
//     (services/entity_registry.py, string entityId, "what is this thing
//     called and merged with"). Collapsing them into one list would misname
//     what each action does.
// WHY no Delete action: entity_registry.py has delete_entity(), but fanmass's
//     command dispatcher (fanmass#80's _dispatch_command) was never wired to
//     call it — only rename/merge/confirm_cluster/reject_cluster are
//     supported. Adding an entity.delete command here would silently sit
//     "unrecognized, left pending forever" on the fanmass side, which is
//     exactly the kind of false promise this whole plan's honesty
//     requirement forbids. Add the button when fanmass#80 grows a delete
//     handler, not before.
// WHY no logo image: build_catalog()'s logoUrl is a fanmass-local path
//     (/api/entities/{id}/logo) on a host messmass's browser can never reach
//     (fanmass has no public URL) — rendering it would just be a broken
//     <img>. A "Has logo" badge stands in for it instead.
// WHY not UnifiedAdminPage/UnifiedListView: per messmass#341 Section 3, both
//     are explicitly marked "planned for migration" and are the older of two
//     competing patterns in this codebase. This tab instead follows the
//     same lean AnalyticsSectionCard + Mantine-table shape already used by
//     the sibling Run Control tab (messmass#340) for the same page — one
//     pattern across all four fanmass tabs, not two.

import React, { useState } from 'react';
import { Badge, Button, Modal, Select, Stack, Group, Table, Text, TextInput } from '@mantine/core';
import { useGdsConfirm } from '@sovereignsquad/gds-core/client';
import AnalyticsSectionCard from '@/components/analytics/AnalyticsSectionCard';
import { apiPost } from '@/lib/apiClient';
import styles from './EntityCurationTab.module.css';

// Matches services/entity_registry.py's KINDS tuple exactly (camelCase
// nationalTeam, not national_team).
const KINDS = ['club', 'federation', 'league', 'nationalTeam', 'brand', 'sponsor', 'unclassified'] as const;

interface PosterCluster {
  clusterId: number;
  imageCount: number;
  userConfirmed: boolean;
  userRejected: boolean;
}

interface CatalogEntity {
  entityId: string;
  name: string;
  kind: string;
  count: number;
  hasLogo: boolean;
}

export interface EntityCurationSection {
  faceClusters?: { posterClusters?: PosterCluster[] };
  entities?: { rows?: CatalogEntity[] };
}

interface EntityCurationTabProps {
  batchId: string;
  entityCuration: EntityCurationSection | undefined;
}

export default function EntityCurationTab({ batchId, entityCuration }: EntityCurationTabProps) {
  const { confirm } = useGdsConfirm();
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const [error, setError] = useState('');

  const [editTarget, setEditTarget] = useState<CatalogEntity | null>(null);
  const [editName, setEditName] = useState('');
  const [editKind, setEditKind] = useState<string | null>(null);

  const [mergeTargetId, setMergeTargetId] = useState<string | null>(null);
  const [mergeSourceId, setMergeSourceId] = useState<string | null>(null);

  const clusters = entityCuration?.faceClusters?.posterClusters ?? [];
  const entities = entityCuration?.entities?.rows ?? [];

  async function enqueue(type: string, payload: Record<string, unknown>, key: string) {
    setError('');
    setPending((p) => ({ ...p, [key]: true }));
    try {
      const data = await apiPost<{ success: boolean; error?: { message?: string } }>('/api/admin/fanmass/commands', { type, payload });
      if (!data.success) {
        setError(data.error?.message || 'Failed to enqueue command.');
        setPending((p) => {
          const next = { ...p };
          delete next[key];
          return next;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error. Please try again.');
      setPending((p) => {
        const next = { ...p };
        delete next[key];
        return next;
      });
    }
  }

  async function rejectCluster(clusterId: number) {
    const ok = await confirm({
      title: 'Reject cluster',
      message: `Reject poster cluster #${clusterId}? It will no longer be treated as a display candidate.`,
      danger: true,
    });
    if (!ok) return;
    await enqueue('entity.reject_cluster', { batchId, clusterId }, `cluster:${clusterId}`);
  }

  function openEdit(entity: CatalogEntity) {
    setEditTarget(entity);
    setEditName(entity.name);
    setEditKind(entity.kind);
  }

  async function submitEdit() {
    if (!editTarget) return;
    const name = editName.trim();
    if (!name) {
      setError('Name is required.');
      return;
    }
    await enqueue('entity.rename', { entityId: editTarget.entityId, displayName: name, kind: editKind }, `entity:${editTarget.entityId}`);
    setEditTarget(null);
  }

  async function submitMerge() {
    if (!mergeTargetId || !mergeSourceId) return;
    const source = entities.find((e) => e.entityId === mergeSourceId);
    const target = entities.find((e) => e.entityId === mergeTargetId);
    const ok = await confirm({
      title: 'Merge entities',
      message: `Merge "${source?.name}" into "${target?.name}"? "${source?.name}" will be permanently removed once fanmass applies this — this cannot be undone.`,
      danger: true,
    });
    if (!ok) return;
    await enqueue('entity.merge', { entityId: mergeTargetId, sourceId: mergeSourceId }, `entity:${mergeSourceId}`);
    setMergeTargetId(null);
    setMergeSourceId(null);
  }

  return (
    <Stack gap="md">
      <div aria-live="polite">{error && <Text className={styles.errorText}>{error}</Text>}</div>

      <AnalyticsSectionCard title="Unconfirmed poster clusters" subtitle="Confirm or reject fanmass's automatic display-candidate guesses.">
        {clusters.length === 0 ? (
          <Text className={styles.placeholder}>No poster clusters detected for this batch.</Text>
        ) : (
          <Table>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Cluster</Table.Th>
                <Table.Th>Images</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {clusters.map((c) => {
                const key = `cluster:${c.clusterId}`;
                const isPending = !!pending[key];
                const decided = c.userConfirmed || c.userRejected;
                return (
                  <Table.Tr key={c.clusterId}>
                    <Table.Td>#{c.clusterId}</Table.Td>
                    <Table.Td>{c.imageCount}</Table.Td>
                    <Table.Td>
                      {isPending ? (
                        <Badge color="yellow">Pending…</Badge>
                      ) : c.userConfirmed ? (
                        <Badge color="green">Confirmed</Badge>
                      ) : c.userRejected ? (
                        <Badge color="gray">Rejected</Badge>
                      ) : (
                        <Badge color="blue">Needs review</Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Button
                          size="xs"
                          disabled={isPending || decided}
                          onClick={() => enqueue('entity.confirm_cluster', { batchId, clusterId: c.clusterId }, key)}
                          aria-label={`Confirm cluster ${c.clusterId}`}
                        >
                          Confirm
                        </Button>
                        <Button
                          size="xs"
                          color="red"
                          variant="outline"
                          disabled={isPending || decided}
                          onClick={() => rejectCluster(c.clusterId)}
                          aria-label={`Reject cluster ${c.clusterId}`}
                        >
                          Reject
                        </Button>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </AnalyticsSectionCard>

      <AnalyticsSectionCard title="Entity catalog" subtitle="Rename, reclassify, and merge detected entities.">
        {entities.length === 0 ? (
          <Text className={styles.placeholder}>No entities detected for this batch yet.</Text>
        ) : (
          <>
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Name</Table.Th>
                  <Table.Th>Classification</Table.Th>
                  <Table.Th>Detections</Table.Th>
                  <Table.Th>Logo</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {entities.map((e) => {
                  const key = `entity:${e.entityId}`;
                  const isPending = !!pending[key];
                  return (
                    <Table.Tr key={e.entityId}>
                      <Table.Td>{e.name}</Table.Td>
                      <Table.Td>{e.kind}</Table.Td>
                      <Table.Td>{e.count}</Table.Td>
                      <Table.Td>{e.hasLogo ? <Badge color="green">Has logo</Badge> : <Badge color="gray">No logo</Badge>}</Table.Td>
                      <Table.Td>
                        {isPending ? (
                          <Badge color="yellow">Pending…</Badge>
                        ) : (
                          <Button size="xs" variant="outline" onClick={() => openEdit(e)} aria-label={`Edit ${e.name}`}>
                            Edit
                          </Button>
                        )}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>

            <Group gap="sm" align="flex-end" className={styles.mergeRow}>
              <Select
                label="Keep (merge target)"
                placeholder="Select entity"
                data={entities.map((e) => ({ value: e.entityId, label: e.name }))}
                value={mergeTargetId}
                onChange={setMergeTargetId}
                searchable
              />
              <Select
                label="Merge away (source)"
                placeholder="Select entity"
                data={entities.filter((e) => e.entityId !== mergeTargetId).map((e) => ({ value: e.entityId, label: e.name }))}
                value={mergeSourceId}
                onChange={setMergeSourceId}
                searchable
                disabled={!mergeTargetId}
              />
              <Button
                onClick={submitMerge}
                disabled={!mergeTargetId || !mergeSourceId || !!pending[`entity:${mergeSourceId}`]}
              >
                Merge
              </Button>
            </Group>
          </>
        )}
      </AnalyticsSectionCard>

      <Modal opened={editTarget !== null} onClose={() => setEditTarget(null)} title={`Edit ${editTarget?.name ?? ''}`}>
        <Stack gap="sm">
          <TextInput label="Name" value={editName} onChange={(e) => setEditName(e.currentTarget.value)} required />
          <Select label="Classification" data={[...KINDS]} value={editKind} onChange={setEditKind} />
          <Group justify="flex-end" gap="sm">
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button onClick={submitEdit}>Save</Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}
