'use client';

import React, { useEffect, useState } from 'react';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import ColoredCard from '@/components/ColoredCard';
import FormModal from '@/components/modals/FormModal';
import { apiPost, apiPut, apiDelete } from '@/lib/apiClient';
import MaterialIcon from '@/components/MaterialIcon';
import styles from './page.module.css';

// WHAT: Clicker Manager - Configure variable groups for Editor clicker UI
// WHY: Admin control over which variables appear in clicker and their grouping/order
// HOW: Manage variablesGroups collection via /api/variables-groups

interface VariableGroup {
  _id?: string;
  groupOrder: number;
  chartId?: string;
  titleOverride?: string;
  variables?: string[];
  specialType?: 'report-content';
  visibleInClicker?: boolean;
  visibleInManual?: boolean;
  createdAt?: string;
  updatedAt?: string;
  clickerSetId?: string;
}

interface Variable {
  name: string;
  label: string;
  type: string;
  category: string;
  flags: { visibleInClicker: boolean; editableInManual: boolean };
}

interface ClickerSet {
  _id: string;
  name: string;
  isDefault?: boolean;
  usage?: { partnerCount: number };
}

export default function ClickerManagerPage() {
  const [groups, setGroups] = useState<VariableGroup[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingGroup, setEditingGroup] = useState<VariableGroup | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [clickerSets, setClickerSets] = useState<ClickerSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [loadingSets, setLoadingSets] = useState(true);

  const loadClickerSets = async (): Promise<string | null> => {
    setLoadingSets(true);
    let chosenId: string | null = selectedSetId;
    try {
      const res = await fetch('/api/clicker-sets', { cache: 'no-store' });
      const data = await res.json();
      if (data?.success && Array.isArray(data.sets)) {
        setClickerSets(data.sets);
        const currentDefault = data.sets.find((s: ClickerSet) => s.isDefault);
        if (!selectedSetId) {
          chosenId = currentDefault?._id || data.sets[0]?._id || null;
          setSelectedSetId(chosenId);
        } else if (!data.sets.find((s: ClickerSet) => s._id === selectedSetId)) {
          chosenId = currentDefault?._id || data.sets[0]?._id || null;
          setSelectedSetId(chosenId);
        } else {
          chosenId = selectedSetId;
        }
      }
    } catch (e) {
      console.error('❌ Failed to load clicker sets:', e);
    } finally {
      setLoadingSets(false);
    }
    return chosenId;
  };

  const loadData = async (targetSetId?: string | null) => {
    setLoading(true);
    try {
      const activeSetId = targetSetId || selectedSetId;
      // Load variable groups scoped to clicker set
      const groupsUrl = activeSetId ? `/api/variables-groups?clickerSetId=${activeSetId}` : '/api/variables-groups';
      const groupsRes = await fetch(groupsUrl, { cache: 'no-store' });
      const groupsData = await groupsRes.json();
      if (groupsData?.success) {
        setGroups(groupsData.groups || []);
      }

      // Load all variables (for selection)
      const varsRes = await fetch('/api/variables-config', { cache: 'no-store' });
      const varsData = await varsRes.json();
      if (varsData?.success) {
        setVariables(varsData.variables || []);
      }
    } catch (e) {
      console.error('❌ Failed to load clicker manager data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const setId = await loadClickerSets();
      await loadData(setId);
    })();
  }, []);

  const seedDefaults = async () => {
    try {
      setSaving(true);
      const data = await apiPost('/api/variables-groups', { seedDefault: true, clickerSetId: selectedSetId });
      if (data?.success) {
        await loadData(selectedSetId);
      }
    } catch (e) {
      console.error('❌ Failed to seed defaults:', e);
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (groupOrder: number) => {
    if (!confirm(`Delete group ${groupOrder} from this clicker set? This cannot be undone.`)) return;
    try {
      setSaving(true);
      const qs = new URLSearchParams();
      qs.set('groupOrder', String(groupOrder));
      if (selectedSetId) qs.set('clickerSetId', selectedSetId);
      await apiDelete(`/api/variables-groups?${qs.toString()}`);
      await loadData(selectedSetId);
    } finally {
      setSaving(false);
    }
  };

  const deleteAllGroups = async () => {
    if (!confirm('Delete ALL variable groups? This will reset the clicker layout.')) return;
    try {
      setSaving(true);
      const url = selectedSetId ? `/api/variables-groups?clickerSetId=${selectedSetId}` : '/api/variables-groups';
      await apiDelete(url); // scoped delete when set selected
      await loadData(selectedSetId);
    } finally {
      setSaving(false);
    }
  };

  const refreshVariables = async () => {
    try {
      setSaving(true);
      // WHAT: Force invalidate cache and reload
      // WHY: User added variable in KYC but it's not showing due to cache
      await apiPut('/api/variables-config?action=invalidateCache', {});
      await loadData(selectedSetId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="↔️ Clicker Manager"
        subtitle="Configure variable groups and ordering for Editor clicker UI"
        backLink="/admin"
        actionButtons={[
          { label: 'New Group', onClick: () => setCreateOpen(true), variant: 'primary', icon: '➕' },
          { label: 'Add Report Content', onClick: async () => {
              setSaving(true);
              try {
                const maxOrder = Math.max(0, ...groups.map(g => g.groupOrder));
                await apiPost('/api/variables-groups', {
                  group: {
                    groupOrder: maxOrder + 1,
                    titleOverride: '📦 Report Content',
                    specialType: 'report-content',
                    visibleInClicker: true,
                    visibleInManual: true,
                    clickerSetId: selectedSetId || undefined,
                  }
                });
                await loadData(selectedSetId);
              } finally { setSaving(false); }
            }, variant: 'secondary', icon: '📦' },
          { label: 'Refresh Variables', onClick: refreshVariables, variant: 'info', disabled: saving, icon: '🔄' },
          { label: 'Seed Defaults', onClick: seedDefaults, variant: 'secondary', disabled: saving },
          { label: 'Delete All', onClick: deleteAllGroups, variant: 'danger', disabled: saving },
        ]}
      />

      {/* Clicker Set Selector (mirrors report template selector UX) */}
      <ColoredCard accentColor="#3b82f6" hoverable={false}>
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h3 className="mt-0 mb-1">🎮 Clicker Set</h3>
              <p className="text-sm text-gray-600 mb-0">Select which clicker layout to edit (partner-assignable)</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                className="btn btn-small btn-primary"
                disabled={loadingSets}
                onClick={async () => {
                  const name = prompt('Name for new clicker set?');
                  if (!name) return;
                  setSaving(true);
                  try {
                    const clone = confirm('Clone current set layout into the new set?');
                    const res = await apiPost('/api/clicker-sets', { name, cloneFromId: clone ? selectedSetId : undefined });
                    if (res?.success && res.set?._id) {
                      await loadClickerSets();
                      setSelectedSetId(res.set._id);
                      await loadData(res.set._id);
                    }
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                ➕ New Set
              </button>
              <button
                className="btn btn-small btn-secondary"
                disabled={loadingSets || !selectedSetId}
                onClick={async () => {
                  if (!selectedSetId) return;
                  const name = prompt('Rename clicker set to:', clickerSets.find(s => s._id === selectedSetId)?.name || '');
                  if (!name) return;
                  setSaving(true);
                  try {
                    await apiPut('/api/clicker-sets', { clickerSetId: selectedSetId, name });
                    await loadClickerSets();
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                ✏️ Rename
              </button>
              <button
                className="btn btn-small btn-secondary"
                disabled={loadingSets || !selectedSetId}
                onClick={async () => {
                  if (!selectedSetId) return;
                  setSaving(true);
                  try {
                    await apiPut('/api/clicker-sets', { clickerSetId: selectedSetId, isDefault: true });
                    await loadClickerSets();
                  } finally {
                    setSaving(false);
                  }
                }}
              >
                ⭐ Make Default
              </button>
              <button
                className="btn btn-small btn-danger"
                disabled={loadingSets || !selectedSetId || clickerSets.find(s => s._id === selectedSetId)?.isDefault}
              onClick={async () => {
                if (!selectedSetId) return;
                const name = clickerSets.find(s => s._id === selectedSetId)?.name || 'this set';
                if (!confirm(`Delete ${name}? This cannot be undone.`)) return;
                setSaving(true);
                try {
                  await apiDelete(`/api/clicker-sets?clickerSetId=${selectedSetId}`);
                  const newId = await loadClickerSets();
                  setSelectedSetId(newId);
                  await loadData(newId);
                } finally {
                  setSaving(false);
                }
              }}
            >
                🗑️ Delete
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <select
              className="form-input"
              value={selectedSetId || ''}
              onChange={async (e) => {
                const id = e.target.value || null;
                setSelectedSetId(id);
                await loadData(id);
              }}
            >
              {clickerSets.map((set) => (
                <option key={set._id} value={set._id}>
                  {set.isDefault ? '⭐ ' : ''}{set.name} {set.usage?.partnerCount ? `(${set.usage.partnerCount} partners)` : ''}
                </option>
              ))}
            </select>
            {clickerSets.find((s) => s._id === selectedSetId)?.isDefault && (
              <span className="badge badge-success">Default</span>
            )}
          </div>
        </div>
      </ColoredCard>

      {loading && (
        <ColoredCard accentColor="#6366f1" hoverable={false} className="text-center">
          <div className="text-4xl mb-4">↔️</div>
          <div>Loading clicker groups...</div>
        </ColoredCard>
      )}

      {!loading && groups.length === 0 && (
        <ColoredCard accentColor="#f59e0b" hoverable={false} className="text-center">
          <div className="text-4xl mb-4">📋</div>
          <h3 className="mt-0">No Variable Groups Configured</h3>
          <p className="text-gray-600 mb-4">
            The clicker layout is empty. Click &ldquo;Seed Defaults&rdquo; to create the standard layout.
          </p>
          <button className="btn btn-primary" onClick={seedDefaults} disabled={saving}>
            🌱 Seed Default Groups
          </button>
        </ColoredCard>
      )}

      {!loading && groups.length > 0 && (
        <div className="grid gap-3">
          {groups.map((group) => {
            const groupVars = (group.variables || [])
              .map((varName) => variables.find((v) => v.name === varName))
              .filter(Boolean) as Variable[];

            return (
              <ColoredCard key={group.groupOrder} accentColor="#3b82f6" hoverable={false}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="mt-0 mb-0">
                        Group {group.groupOrder}
                        {group.titleOverride && ` - ${group.titleOverride}`}
                      </h3>
                      {group.specialType === 'report-content' ? (
                        <span className="badge badge-purple">📦 Report Content</span>
                      ) : (
                        <span className="badge badge-info">{(group.variables?.length || 0)} variables</span>
                      )}
                      {group.chartId && (
                        <span className="badge badge-success">📊 {group.chartId}</span>
                      )}
                    </div>
                    
                    {/* WHAT: Mode visibility checkboxes */}
                    {/* WHY: Control which groups appear in clicker vs manual mode */}
                    <div className="flex items-center gap-4 mt-2 mb-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={group.visibleInClicker !== false}
                          onChange={async (e) => {
                            setSaving(true);
                            try {
                              await apiPost('/api/variables-groups', {
                                group: {
                                  ...group,
                                  visibleInClicker: e.target.checked,
                                  clickerSetId: selectedSetId || undefined,
                                },
                              });
                              await loadData();
                            } finally {
                              setSaving(false);
                            }
                          }}
                          className="form-checkbox"
                        />
                        <span className="text-sm font-medium">↔️ Clicker</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={group.visibleInManual !== false}
                          onChange={async (e) => {
                            setSaving(true);
                            try {
                              await apiPost('/api/variables-groups', {
                                group: {
                                  ...group,
                                  visibleInManual: e.target.checked,
                                  clickerSetId: selectedSetId || undefined,
                                },
                              });
                              await loadData();
                            } finally {
                              setSaving(false);
                            }
                          }}
                          className="form-checkbox"
                        />
                        <span className="text-sm font-medium">Manual</span>
                      </label>
                    </div>

                    {group.specialType !== 'report-content' && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {groupVars.map((v) => (
                          <div key={v.name} className="badge badge-secondary">
                            {v.label}
                          </div>
                        ))}
                        {(group.variables?.length || 0) > groupVars.length && (
                          <div className="badge badge-warning">
                            {(group.variables?.length || 0) - groupVars.length} missing
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => setEditingGroup(group)}
                    >
                      <MaterialIcon name="edit" variant="outlined" className={styles.iconInline} />
                      Edit
                    </button>
                    <button
                      className="btn btn-small btn-danger"
                      onClick={() => deleteGroup(group.groupOrder)}
                    >
                      <MaterialIcon name="delete" variant="outlined" className={styles.iconInline} />
                      Delete
                    </button>
                  </div>
                </div>
              </ColoredCard>
            );
          })}
        </div>
      )}

      {/* WHAT: Edit Group Modal migrated to unified FormModal
       * WHY: Consistent modal behavior across all admin pages */}
      {editingGroup && (
        <FormModal
          isOpen={!!editingGroup}
          onClose={() => setEditingGroup(null)}
          onSubmit={async () => {
            // GroupForm handles its own submission
          }}
          title={`Edit Group ${editingGroup.groupOrder}`}
          submitText="Save Group"
          size="xl"
          customFooter={<div />} // GroupForm has its own submit button
        >
          <GroupForm
            group={editingGroup}
            variables={variables}
            clickerSetId={selectedSetId}
            onClose={() => setEditingGroup(null)}
            onSaved={async () => {
              setEditingGroup(null);
              await loadData(selectedSetId);
            }}
          />
        </FormModal>
      )}

      {/* WHAT: Create Group Modal migrated to unified FormModal
       * WHY: Consistent modal behavior across all admin pages */}
      {createOpen && (
        <FormModal
          isOpen={createOpen}
          onClose={() => setCreateOpen(false)}
          onSubmit={async () => {
            // GroupForm handles its own submission
          }}
          title="➕ New Group"
          submitText="Save Group"
          size="xl"
          customFooter={<div />} // GroupForm has its own submit button
        >
          <GroupForm
            group={{
              groupOrder: Math.max(0, ...groups.map((g) => g.groupOrder)) + 1,
              variables: [],
              clickerSetId: selectedSetId || undefined,
            }}
            variables={variables}
            clickerSetId={selectedSetId}
            onClose={() => setCreateOpen(false)}
            onSaved={async () => {
              setCreateOpen(false);
              await loadData(selectedSetId);
            }}
          />
        </FormModal>
      )}
    </div>
  );
}

function GroupForm({
  group,
  variables,
  clickerSetId,
  onClose,
  onSaved,
}: {
  group: VariableGroup;
  variables: Variable[];
  clickerSetId: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    groupOrder: group.groupOrder,
    chartId: group.chartId || '',
    titleOverride: group.titleOverride || '',
    specialType: group.specialType as 'report-content' | undefined,
    variables: group.variables || [],
    visibleInClicker: group.visibleInClicker !== false,
    visibleInManual: group.visibleInManual !== false,
    saving: false,
    error: null as string | null,
  });

  const [search, setSearch] = useState('');

  const availableVars = variables.filter(
    (v) =>
      v.flags?.visibleInClicker &&
      !form.variables.includes(v.name) &&
      (v.name.toLowerCase().includes(search.toLowerCase()) ||
        v.label.toLowerCase().includes(search.toLowerCase()))
  );

  const addVariable = (varName: string) => {
    setForm((prev) => ({
      ...prev,
      variables: [...prev.variables, varName],
    }));
  };

  const removeVariable = (varName: string) => {
    setForm((prev) => ({
      ...prev,
      variables: prev.variables.filter((v) => v !== varName),
    }));
  };

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newVars = [...form.variables];
    [newVars[index - 1], newVars[index]] = [newVars[index], newVars[index - 1]];
    setForm((prev) => ({ ...prev, variables: newVars }));
  };

  const moveDown = (index: number) => {
    if (index === form.variables.length - 1) return;
    const newVars = [...form.variables];
    [newVars[index], newVars[index + 1]] = [newVars[index + 1], newVars[index]];
    setForm((prev) => ({ ...prev, variables: newVars }));
  };

  const handleSave = async () => {
    if (!form.specialType && form.variables.length === 0) {
      setForm((prev) => ({ ...prev, error: 'Group must have at least one variable' }));
      return;
    }

    try {
      setForm((prev) => ({ ...prev, saving: true, error: null }));
      const data = await apiPost('/api/variables-groups', {
        group: {
          groupOrder: form.groupOrder,
          chartId: form.chartId || undefined,
          titleOverride: form.titleOverride || undefined,
          specialType: form.specialType,
          variables: form.specialType ? undefined : form.variables,
          visibleInClicker: form.visibleInClicker,
          visibleInManual: form.visibleInManual,
          clickerSetId: clickerSetId || undefined,
        },
      });

      if (!data?.success) throw new Error(data?.error || 'Failed to save group');
      onSaved();
    } catch (e: any) {
      setForm((prev) => ({
        ...prev,
        saving: false,
        error: e?.message || 'Failed to save group',
      }));
    }
  };

  return (
    <div>
      <div className="grid gap-3 grid-1fr-1fr-1fr">
        <div>
          <label className="form-label-block">Group Order</label>
          <input
            type="number"
            className="form-input"
            value={form.groupOrder}
            onChange={(e) =>
              setForm({ ...form, groupOrder: parseInt(e.target.value) || 1 })
            }
            min="1"
          />
        </div>
        {(!form.specialType) && (
          <div>
            <label className="form-label-block">Chart ID (optional)</label>
            <input
              className="form-input"
              value={form.chartId}
              onChange={(e) => setForm({ ...form, chartId: e.target.value })}
              placeholder="e.g. all-images-taken"
            />
          </div>
        )}
        <div>
          <label className="form-label-block">Title Override (optional)</label>
          <input
            className="form-input"
            value={form.titleOverride}
            onChange={(e) => setForm({ ...form, titleOverride: e.target.value })}
            placeholder="e.g. Images"
          />
        </div>
      </div>
      
      {/* WHAT: Mode visibility controls */}
      {/* WHY: Determine which edit modes show this group */}
      <div className="mt-4">
        <label className={`form-label-block ${styles.sectionLabel}`}>Visibility in Edit Modes</label>
        <div className="flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.visibleInClicker}
              onChange={(e) => setForm({ ...form, visibleInClicker: e.target.checked })}
              className="form-checkbox"
            />
            <span className="text-sm font-medium">↔️ Show in Clicker Mode</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.visibleInManual}
              onChange={(e) => setForm({ ...form, visibleInManual: e.target.checked })}
              className="form-checkbox"
            />
            <span className="text-sm font-medium">✏️ Show in Manual Mode</span>
          </label>
        </div>
      </div>

      {!form.specialType && (
      <div className="mt-4">
        <label className={`form-label-block ${styles.sectionLabel}`}>Variables in Group ({form.variables.length})</label>
        <div className={`grid gap-2 mt-2 ${styles.variableListContainer}`}>
          {form.variables.length === 0 && (
            <div className="text-center text-gray-500 py-4 text-sm">
              No variables added yet. Add variables from the list below.
            </div>
          )}
          {form.variables.map((varName, index) => {
            const varDef = variables.find((v) => v.name === varName);
            return (
              <div
                key={varName}
                className={`flex items-center justify-between gap-3 p-3 bg-white rounded border border-gray-300 ${styles.variableItem}`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className={`text-sm font-mono text-gray-500 ${styles.orderNum}`}>#{index + 1}</span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 block">{varDef?.label || varName}</span>
                    <code className={`variable-ref text-xs text-gray-600 ${styles.varCode}`}>{varName}</code>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className={`btn btn-small btn-secondary ${styles.reorderBtn}`}
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                  >
                    ↑
                  </button>
                  <button
                    className={`btn btn-small btn-secondary ${styles.reorderBtn}`}
                    onClick={() => moveDown(index)}
                    disabled={index === form.variables.length - 1}
                  >
                    ↓
                  </button>
                  <button
                    className={`btn btn-small btn-danger ${styles.removeBtn}`}
                    onClick={() => removeVariable(varName)}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {!form.specialType && (
      <div className="mt-4">
        <label className={`form-label-block ${styles.sectionLabel}`}>Add Variables</label>
        <input
          type="text"
          className={`form-input mb-3 ${styles.searchInput}`}
          placeholder="Search variables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className={`grid gap-2 max-h-300 overflow-y-auto ${styles.variableListContainer}`}>
          {availableVars.map((v) => (
            <button
              key={v.name}
              className={`flex items-center justify-between gap-3 p-3 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-400 text-left transition-colors ${styles.variableItem}`}
              onClick={() => addVariable(v.name)}
            >
              <div className="flex-1">
                <span className="font-medium text-gray-900 block">{v.label}</span>
                <code className={`variable-ref text-xs text-gray-600 ${styles.varCode}`}>{v.name}</code>
              </div>
              <span className="text-green-600 font-semibold whitespace-nowrap">+ Add</span>
            </button>
          ))}
          {availableVars.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              {search ? 'No matching variables' : 'All clicker variables added'}
            </div>
          )}
        </div>
      </div>
      )}

      {form.error && <div className="text-error mt-3">{form.error}</div>}

      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-small btn-secondary" onClick={onClose} disabled={form.saving}>
          Cancel
        </button>
        <button
          className="btn btn-small btn-primary"
          onClick={handleSave}
          disabled={form.saving}
        >
          {form.saving ? 'Saving...' : 'Save Group'}
        </button>
      </div>
    </div>
  );
}
