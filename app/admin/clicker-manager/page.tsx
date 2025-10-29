'use client';

import React, { useEffect, useState } from 'react';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
import { apiPost } from '@/lib/apiClient';

// WHAT: Clicker Manager - Configure variable groups for Editor clicker UI
// WHY: Admin control over which variables appear in clicker and their grouping/order
// HOW: Manage variablesGroups collection via /api/variables-groups

interface VariableGroup {
  _id?: string;
  groupOrder: number;
  chartId?: string;
  titleOverride?: string;
  variables: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface Variable {
  name: string;
  label: string;
  type: string;
  category: string;
  flags: { visibleInClicker: boolean; editableInManual: boolean };
}

export default function ClickerManagerPage() {
  const [groups, setGroups] = useState<VariableGroup[]>([]);
  const [variables, setVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingGroup, setEditingGroup] = useState<VariableGroup | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load variable groups
      const groupsRes = await fetch('/api/variables-groups', { cache: 'no-store' });
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
    loadData();
  }, []);

  const seedDefaults = async () => {
    try {
      setSaving(true);
      const data = await apiPost('/api/variables-groups', { seedDefault: true });
      if (data?.success) {
        await loadData();
      }
    } catch (e) {
      console.error('❌ Failed to seed defaults:', e);
    } finally {
      setSaving(false);
    }
  };

  const deleteGroup = async (groupOrder: number) => {
    if (!confirm(`Delete group ${groupOrder}?`)) return;
    try {
      setSaving(true);
      // Note: Current API doesn't support deleting individual groups, only all
      // For now, we'll just reload - in production you'd want a DELETE endpoint with groupOrder
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const deleteAllGroups = async () => {
    if (!confirm('Delete ALL variable groups? This will reset the clicker layout.')) return;
    try {
      setSaving(true);
      await fetch('/api/variables-groups', { method: 'DELETE' });
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-container">
      <AdminHero
        title="↔️ Clicker Manager"
        subtitle="Configure variable groups and ordering for Editor clicker UI"
        backLink="/admin"
        actionButtons={[
          { label: '➕ New Group', onClick: () => setCreateOpen(true), variant: 'primary' },
          { label: '🌱 Seed Defaults', onClick: seedDefaults, variant: 'secondary', disabled: saving },
          { label: '🗑️ Delete All', onClick: deleteAllGroups, variant: 'danger', disabled: saving },
        ]}
        badges={[
          { text: 'Clicker Configuration', variant: 'primary' },
          { text: `${groups.length} Groups`, variant: 'success' },
        ]}
      />

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
            The clicker layout is empty. Click "Seed Defaults" to create the standard layout.
          </p>
          <button className="btn btn-primary" onClick={seedDefaults} disabled={saving}>
            🌱 Seed Default Groups
          </button>
        </ColoredCard>
      )}

      {!loading && groups.length > 0 && (
        <div className="grid gap-3">
          {groups.map((group) => {
            const groupVars = group.variables
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
                      <span className="badge badge-info">{group.variables.length} variables</span>
                      {group.chartId && (
                        <span className="badge badge-success">📊 {group.chartId}</span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      {groupVars.map((v) => (
                        <div key={v.name} className="badge badge-secondary">
                          {v.label}
                        </div>
                      ))}
                      {group.variables.length > groupVars.length && (
                        <div className="badge badge-warning">
                          {group.variables.length - groupVars.length} missing
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => setEditingGroup(group)}
                    >
                      ✏️ Edit
                    </button>
                  </div>
                </div>
              </ColoredCard>
            );
          })}
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="modal-overlay" onClick={() => setEditingGroup(null)}>
          <div className="modal-content max-w-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Group {editingGroup.groupOrder}</h3>
            <GroupForm
              group={editingGroup}
              variables={variables}
              onClose={() => setEditingGroup(null)}
              onSaved={async () => {
                setEditingGroup(null);
                await loadData();
              }}
            />
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-content max-w-800" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">➕ New Group</h3>
            <GroupForm
              group={{
                groupOrder: Math.max(0, ...groups.map((g) => g.groupOrder)) + 1,
                variables: [],
              }}
              variables={variables}
              onClose={() => setCreateOpen(false)}
              onSaved={async () => {
                setCreateOpen(false);
                await loadData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function GroupForm({
  group,
  variables,
  onClose,
  onSaved,
}: {
  group: VariableGroup;
  variables: Variable[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    groupOrder: group.groupOrder,
    chartId: group.chartId || '',
    titleOverride: group.titleOverride || '',
    variables: group.variables || [],
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
    if (form.variables.length === 0) {
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
          variables: form.variables,
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
        <div>
          <label className="form-label-block">Chart ID (optional)</label>
          <input
            className="form-input"
            value={form.chartId}
            onChange={(e) => setForm({ ...form, chartId: e.target.value })}
            placeholder="e.g. all-images-taken"
          />
        </div>
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

      <div className="mt-4">
        <label className="form-label-block" style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Variables in Group ({form.variables.length})</label>
        <div className="grid gap-2 mt-2" style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
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
                className="flex items-center justify-between gap-3 p-3 bg-white rounded border border-gray-300"
                style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-sm font-mono text-gray-500" style={{ minWidth: '32px' }}>#{index + 1}</span>
                  <div className="flex-1">
                    <span className="font-medium text-gray-900 block">{varDef?.label || varName}</span>
                    <code className="variable-ref text-xs text-gray-600" style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#f3f4f6', marginTop: '4px', display: 'inline-block' }}>{varName}</code>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => moveUp(index)}
                    disabled={index === 0}
                    style={{ minWidth: '36px', opacity: index === 0 ? 0.5 : 1 }}
                  >
                    ↑
                  </button>
                  <button
                    className="btn btn-small btn-secondary"
                    onClick={() => moveDown(index)}
                    disabled={index === form.variables.length - 1}
                    style={{ minWidth: '36px', opacity: index === form.variables.length - 1 ? 0.5 : 1 }}
                  >
                    ↓
                  </button>
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => removeVariable(varName)}
                    style={{ minWidth: '36px' }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-4">
        <label className="form-label-block" style={{ marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Add Variables</label>
        <input
          type="text"
          className="form-input mb-3"
          placeholder="Search variables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: '10px 12px', fontSize: '14px' }}
        />
        <div className="grid gap-2 max-h-300 overflow-y-auto" style={{ backgroundColor: '#f9fafb', padding: '12px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          {availableVars.map((v) => (
            <button
              key={v.name}
              className="flex items-center justify-between gap-3 p-3 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-400 text-left transition-colors"
              onClick={() => addVariable(v.name)}
              style={{ boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}
            >
              <div className="flex-1">
                <span className="font-medium text-gray-900 block">{v.label}</span>
                <code className="variable-ref text-xs text-gray-600" style={{ fontSize: '11px', padding: '2px 6px', backgroundColor: '#f3f4f6' }}>{v.name}</code>
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
