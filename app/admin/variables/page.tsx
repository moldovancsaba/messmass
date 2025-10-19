'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { buildReferenceToken } from '@/lib/variableRefs';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
import variablesStyles from './Variables.module.css';
import { apiPost, apiDelete } from '@/lib/apiClient';

interface VariableFlags {
  visibleInClicker: boolean;
  editableInManual: boolean;
}

interface Variable {
  name: string;
  label: string;
  type: 'numeric' | 'percentage' | 'currency' | 'count' | 'text';
  category: string;
  description?: string;
  derived?: boolean;
  formula?: string;
  defaultValue?: number;
  icon?: string;
  flags: VariableFlags;
  clickerOrder?: number;
  manualOrder?: number;
  isCustom?: boolean;
}

// Module-scope mock variables for fallback usage in UI (avoids recreating per render)
const MOCK_VARIABLES: Omit<Variable, 'flags' | 'derived' | 'formula' | 'isCustom'>[] = [
  // Image-related variables
  { name: 'remoteImages', label: 'Remote Images', type: 'count', category: 'Images', icon: '📸', description: 'Images taken from remote locations' },
  { name: 'hostessImages', label: 'Hostess Images', type: 'count', category: 'Images', icon: '👥', description: 'Images featuring hostesses' },
  { name: 'selfies', label: 'Selfies', type: 'count', category: 'Images', icon: '🤳', description: 'Self-taken photographs' },
  
  // Location variables
  { name: 'remoteFans', label: 'Remote Fans', type: 'count', category: 'Location', icon: '🛰️', description: 'Indoor + Outdoor (aggregated)' },
  { name: 'stadium', label: 'Location', type: 'count', category: 'Location', icon: '🏟️', description: 'On-site (stadium) attendees' },
  
  // Demographics
  { name: 'female', label: 'Female', type: 'count', category: 'Demographics', icon: '👩', description: 'Female attendees' },
  { name: 'male', label: 'Male', type: 'count', category: 'Demographics', icon: '👨', description: 'Male attendees' },
  { name: 'genAlpha', label: 'Gen Alpha', type: 'count', category: 'Demographics', icon: '👶', description: 'Generation Alpha (2010+)' },
  { name: 'genYZ', label: 'Gen Y/Z', type: 'count', category: 'Demographics', icon: '🧑', description: 'Generation Y and Z (1981-2009)' },
  { name: 'genX', label: 'Gen X', type: 'count', category: 'Demographics', icon: '👤', description: 'Generation X (1965-1980)' },
  { name: 'boomer', label: 'Boomers', type: 'count', category: 'Demographics', icon: '👴', description: 'Baby Boomers (1946-1964)' },
  
  // Merchandise
  { name: 'merched', label: 'People with Merch', type: 'count', category: 'Merchandise', icon: '🛍️', description: 'Fans wearing merch (formerly "Merched")' },
  { name: 'jersey', label: 'Jerseys', type: 'count', category: 'Merchandise', icon: '👕', description: 'Jersey sales' },
  { name: 'scarf', label: 'Scarves', type: 'count', category: 'Merchandise', icon: '🧣', description: 'Scarf sales' },
  { name: 'flags', label: 'Flags', type: 'count', category: 'Merchandise', icon: '🏴', description: 'Flag sales' },
  { name: 'baseballCap', label: 'Baseball Caps', type: 'count', category: 'Merchandise', icon: '🧢', description: 'Baseball cap sales' },
  { name: 'other', label: 'Other Items', type: 'count', category: 'Merchandise', icon: '📦', description: 'Other merchandise' },
  
  // Success Manager (Engagement & Event)
  { name: 'approvedImages', label: 'Approved Images', type: 'count', category: 'Success Manager', icon: '✅', description: 'Approved images' },
  { name: 'rejectedImages', label: 'Rejected Images', type: 'count', category: 'Success Manager', icon: '❌', description: 'Rejected images' },
  { name: 'visitQrCode', label: 'QR Code Visits', type: 'count', category: 'Success Manager', icon: '📱', description: 'QR code scans' },
  { name: 'visitShortUrl', label: 'Short URL Visits', type: 'count', category: 'Success Manager', icon: '🔗', description: 'Short URL clicks' },
  { name: 'visitWeb', label: 'Web Visits', type: 'count', category: 'Success Manager', icon: '🌐', description: 'Direct website visits' },
  { name: 'socialVisit', label: 'Social Visit (Total)', type: 'count', category: 'Success Manager', icon: '📣', description: 'Sum of Facebook, Instagram, YouTube, TikTok, X, Trustpilot' },
  { name: 'eventValuePropositionVisited', label: 'Value Prop Visited', type: 'count', category: 'Success Manager', icon: '✉️', description: 'eDM page visits' },
  { name: 'eventValuePropositionPurchases', label: 'Value Prop Purchases', type: 'count', category: 'Success Manager', icon: '🛒', description: 'eDM purchases' },
  { name: 'eventAttendees', label: 'Event Attendees', type: 'count', category: 'Success Manager', icon: '👥', description: 'Total event attendees' },
  { name: 'eventResultHome', label: 'Event Result Home', type: 'count', category: 'Success Manager', icon: '🏠', description: 'Home team result' },
  { name: 'eventResultVisitor', label: 'Event Result Visitor', type: 'count', category: 'Success Manager', icon: '🧳', description: 'Visitor team result' },
];

function GroupsManager({ variables }: { variables: Variable[] }) {
  const [groups, setGroups] = useState<{ _id?: string; groupOrder: number; chartId?: string; titleOverride?: string; variables: string[] }[]>([])
  const [charts, setCharts] = useState<{ chartId: string; title: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const availableVariables = variables.filter(v => !v.derived && v.type !== 'text').map(v => ({ name: v.name, label: v.label }))

  const reload = async () => {
    try {
      setLoading(true); setError(null)
      const res = await fetch('/api/variables-groups', { cache: 'no-store' })
      const data = await res.json()
      if (data?.success && Array.isArray(data.groups)) setGroups(data.groups)
      const res2 = await fetch('/api/chart-config', { cache: 'no-store' })
      const data2 = await res2.json()
      if (data2?.success && Array.isArray(data2.configurations)) {
        setCharts(data2.configurations.map((c: any) => ({ chartId: c.chartId, title: c.title })))
      }
    } catch (e: any) {
      setError('Failed to load groups')
    } finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])

  const addGroup = () => {
    const maxOrder = groups.reduce((m, g) => Math.max(m, g.groupOrder), 0)
    setGroups([...groups, { groupOrder: maxOrder + 1, variables: [] }])
  }

  const saveGroup = async (g: any) => {
    try {
      setLoading(true); setError(null)
      // WHAT: Use apiPost() for automatic CSRF token handling
      const data = await apiPost('/api/variables-groups', { group: g })
      if (!data?.success) throw new Error('Save failed')
      await reload()
    } catch (e:any) { setError(e?.message || 'Failed to save') } finally { setLoading(false) }
  }

  const seedDefaults = async () => {
    try { setLoading(true); setError(null)
      // WHAT: Use apiPost() for automatic CSRF token handling
      const data = await apiPost('/api/variables-groups', { seedDefault: true })
      if (!data?.success) throw new Error('Seed failed')
      await reload()
    } catch (e:any) { setError(e?.message || 'Failed to seed') } finally { setLoading(false) }
  }

  const addVarToGroup = (idx: number, name: string) => {
    setGroups(prev => prev.map((g,i) => i===idx ? { ...g, variables: g.variables.includes(name) ? g.variables : [...g.variables, name] } : g))
  }
  const removeVarFromGroup = (idx: number, name: string) => {
    setGroups(prev => prev.map((g,i) => i===idx ? { ...g, variables: g.variables.filter(v => v!==name) } : g))
  }
  const moveVar = (idx:number, name:string, dir:-1|1) => {
    setGroups(prev => prev.map((g,i) => {
      if (i!==idx) return g
      const list = [...g.variables]
      const pos = list.indexOf(name)
      if (pos===-1) return g
      const np = pos+dir
      if (np<0 || np>=list.length) return g
      const tmp = list[np]; list[np]=list[pos]; list[pos]=tmp
      return { ...g, variables: list }
    }))
  }

  return (
    <ColoredCard accentColor="#6366f1" hoverable={false} className="mb-4">
      <h3 className="mt-0 mb-0">Groups</h3>
      <p className="text-gray-600 mt-025 mb-0">Use groups to control the Editor (clicker/manual) layout directly from here.</p>
      <div className="flex gap-2 mt-3">
        <button className="btn btn-small btn-secondary" onClick={seedDefaults} disabled={loading}>Initialize default groups</button>
        <button className="btn btn-small btn-warning" onClick={async () => {
          try { setLoading(true); setError(null)
            // WHAT: Use apiDelete() and apiPost() for automatic CSRF token handling
            await apiDelete('/api/variables-groups')
            await apiPost('/api/variables-groups', { seedDefault: true })
            await reload()
          } catch (e:any) { setError(e?.message || 'Failed to replace groups') } finally { setLoading(false) }
        }} disabled={loading}>Replace with default groups</button>
        <button className="btn btn-small btn-primary" onClick={addGroup} disabled={loading}>Add Group</button>
      </div>
      {error && <div className="text-error text-sm mt-2">{error}</div>}

      <div className="grid gap-3 mt-4">
        {groups.sort((a,b)=>a.groupOrder-b.groupOrder).map((g, idx) => (
          <ColoredCard key={idx} accentColor="#8b5cf6" hoverable={false} className="p-3">
            <div className="grid gap-2 items-center grid-120-1fr-1fr">
              <div>
                <label className="form-label">Group Order</label>
                <input className="form-input" type="number" value={g.groupOrder} onChange={e => setGroups(prev => prev.map((x,i)=> i===idx? { ...x, groupOrder: Number(e.target.value) } : x))} />
              </div>
              <div>
                <label className="form-label">Chart ID (KPI)</label>
                <input list="chartIds" className="form-input" value={g.chartId || ''} onChange={e => setGroups(prev => prev.map((x,i)=> i===idx? { ...x, chartId: e.target.value || undefined } : x))} placeholder="Optional: e.g., all-images-taken" />
                <datalist id="chartIds">
                  {charts.map(c => (<option key={c.chartId} value={c.chartId}>{c.title}</option>))}
                </datalist>
              </div>
              <div>
                <label className="form-label">Title (override)</label>
                <input className="form-input" value={g.titleOverride || ''} onChange={e => setGroups(prev => prev.map((x,i)=> i===idx? { ...x, titleOverride: e.target.value || undefined } : x))} placeholder="Leave blank to hide" />
              </div>
            </div>
            <div className="mt-2">
              <label className="form-label">Variables in this group</label>
              <div className="flex flex-wrap gap-2">
                {g.variables.map(name => (
                  <div key={name} className="badge badge-secondary inline-flex items-center gap-2">
                    <span>{availableVariables.find(v=>v.name===name)?.label || name}</span>
                    <button className="btn btn-small btn-info" onClick={() => moveVar(idx, name, -1)}>↑</button>
                    <button className="btn btn-small btn-info" onClick={() => moveVar(idx, name, +1)}>↓</button>
                    <button className="btn btn-small btn-danger" onClick={() => removeVarFromGroup(idx, name)}>✕</button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-center mt-2">
                <select className="form-select" onChange={e => { const v=e.target.value; if (v) { addVarToGroup(idx, v); e.currentTarget.selectedIndex = 0 } }}>
                  <option value="">Add variable…</option>
                  {availableVariables.filter(v => !g.variables.includes(v.name)).map(v => (
                    <option key={v.name} value={v.name}>{v.label}</option>
                  ))}
                </select>
                <button className="btn btn-small btn-primary" onClick={() => saveGroup(groups[idx])} disabled={loading}>Save Group</button>
              </div>
            </div>
          </ColoredCard>
        ))}
      </div>
    </ColoredCard>
  )
}

function EditVariableForm({ variable, allCategories, onSaved, onCancel }: { variable: Variable; allCategories: string[]; onSaved: (res: { originalName: string; nextVar: Partial<Variable> }) => void; onCancel: () => void }) {
  const [name, setName] = useState(variable.name)
  const [label, setLabel] = useState(variable.label)
  const [category, setCategory] = useState(variable.category)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = Array.from(new Set([...allCategories])).sort()
  const canRename = !!variable.isCustom // To safely support rename across data, restrict to custom vars for now.

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      // WHAT: Persist meta via variables-config using apiPost() with CSRF token
      // WHY: API will treat same-name registry as override (label/category)
      const data = await apiPost('/api/variables-config', {
        name: canRename ? name : variable.name,
        label,
        type: variable.type,
        category,
        description: variable.description,
        derived: !!variable.derived,
        formula: variable.formula,
      })
      if (!data?.success) throw new Error(data?.error || 'Failed to save variable')
      onSaved({ originalName: variable.name, nextVar: { name: canRename ? name : variable.name, label, category } })
    } catch (e: any) {
      setError(e?.message || 'Failed to save variable')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="grid gap-3 grid-1fr-1fr">
        <div>
          <label className="form-label">Name{!canRename && ' (registry)'}</label>
          <input className="form-input" value={name} onChange={e => setName(e.target.value)} disabled={!canRename} />
          {!canRename && (
            <div className="text-xs text-gray-600 mt-1">
              Rename is disabled for built-in variables to avoid breaking stored data. If you want to rename it globally, I can run a DB migration to update all projects.
            </div>
          )}
        </div>
        <div>
          <label className="form-label">Label</label>
          <input className="form-input" value={label} onChange={e => setLabel(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Category</label>
          <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
            {categories.map(c => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
        <div>
          <label className="form-label">Type</label>
          <input className="form-input" value={variable.type} disabled />
        </div>
        <div className="grid-col-span-2">
          <label className="form-label">Reference</label>
          <code className="variable-ref">{buildReferenceToken({ name: canRename ? name : variable.name, category, derived: variable.derived, type: variable.type })}</code>
        </div>
      </div>

      <div className="flex gap-2 justify-end mt-4">
        <button className="btn btn-small btn-secondary" onClick={onCancel} disabled={saving}>Cancel</button>
        <button className="btn btn-small btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
      </div>
      {error && (
        <div className="text-error text-xs mt-2">{error}</div>
      )}
    </div>
  )
}

export default function VariablesPage() {
  const router = useRouter();
  const [variables, setVariables] = useState<Variable[]>([]);
  const [filteredVariables, setFilteredVariables] = useState<Variable[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  // Pagination (UI-only): show first 20, then load more by 20
  const [visibleCount, setVisibleCount] = useState(20);
  // Modal state (must be declared before any early returns to keep hook order stable)
  const [activeVar, setActiveVar] = useState<Variable | null>(null);
  const [reorderOpen, setReorderOpen] = useState(false);

// Variables now come from API

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/variables-config', { cache: 'no-store' });
        const data = await res.json();
        if (data?.success && Array.isArray(data.variables)) {
          // Normalize API variables to UI Variable type
          const vars: Variable[] = data.variables.map((v: any) => ({
            name: v.name,
            label: v.label,
            type: v.type || 'count',
            category: v.category,
            description: v.derived && v.formula ? v.formula : v.description || undefined,
            derived: !!v.derived,
            formula: v.formula,
            icon: v.type === 'text' ? '🏷️' : undefined,
            flags: v.flags || { visibleInClicker: false, editableInManual: false },
            clickerOrder: typeof v.clickerOrder === 'number' ? v.clickerOrder : undefined,
            manualOrder: typeof v.manualOrder === 'number' ? v.manualOrder : undefined,
            isCustom: !!v.isCustom,
          }))
          setVariables(vars);
          setFilteredVariables(vars);
        } else {
          // Fallback to mock with conservative flags
          const fallback = MOCK_VARIABLES.map(v => ({ ...v, flags: { visibleInClicker: v.type !== 'text', editableInManual: true } })) as Variable[];
          setVariables(fallback);
          setFilteredVariables(fallback);
        }
      } catch (e) {
        console.error('Failed to load variables', e);
        const fallback = MOCK_VARIABLES.map(v => ({ ...v, flags: { visibleInClicker: v.type !== 'text', editableInManual: true } })) as Variable[];
        setVariables(fallback);
        setFilteredVariables(fallback);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Filter variables based on search
  useEffect(() => {
    const baseList = variables.filter(v => !v.derived && v.type !== 'text')
    if (!searchTerm) {
      setFilteredVariables(baseList);
    } else {
      const q = searchTerm.toLowerCase();
      const filtered = baseList.filter(variable =>
        variable.name.toLowerCase().includes(q) ||
        variable.label.toLowerCase().includes(q) ||
        variable.category.toLowerCase().includes(q) ||
        (variable.description?.toLowerCase().includes(q) ?? false)
      );
      setFilteredVariables(filtered);
    }
    // Reset visible count on new search
    setVisibleCount(20);
  }, [searchTerm, variables]);

const [createForm, setCreateForm] = useState({
    name: '',
    label: '',
    type: 'count' as Variable['type'],
    category: '',
    description: '',
    visibleInClicker: true,
    editableInManual: true,
    error: '' as string | null,
    saving: false,
  });

  const handleCreateVariable = () => {
    setCreateForm({
      name: '', label: '', type: 'count', category: '', description: '',
      visibleInClicker: true, editableInManual: true, error: '', saving: false
    });
    setShowCreateForm(true);
  };

  const handleEditVariable = (variableName: string) => {
    const v = variables.find(v => v.name === variableName) || null;
    setActiveVar(v);
  };

  const persistFlags = async (name: string, nextFlags: VariableFlags) => {
    try {
      // WHAT: Use apiPost() for automatic CSRF token handling
      const data = await apiPost('/api/variables-config', {
        name,
        flags: nextFlags
      });
      if (!data?.success) {
        throw new Error(data?.error || 'Failed to save flags');
      }
      // Update state in-place
      setVariables(prev => prev.map(v => v.name === name ? { ...v, flags: nextFlags } as Variable : v));
      setFilteredVariables(prev => prev.map(v => v.name === name ? { ...v, flags: nextFlags } as Variable : v));
    } catch (e) {
      console.error('Failed to persist flags', e);
    }
  };

  // Group variables by category
  const variablesByCategory = filteredVariables.reduce((acc, variable) => {
    if (!acc[variable.category]) {
      acc[variable.category] = [];
    }
    acc[variable.category].push(variable);
    return acc;
  }, {} as Record<string, Variable[]>);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'count': return '#3b82f6';
      case 'currency': return '#10b981';
      case 'percentage': return '#f59e0b';
      case 'numeric': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="page-container flex items-center justify-center">
        <ColoredCard accentColor="#6366f1" hoverable={false} className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <div>Loading variables...</div>
        </ColoredCard>
      </div>
    );
  }

  // Simple read-only modal for variable details

  return (
    <div className="page-container">
      <AdminHero
        title="🖱️ Clicker Manager"
        subtitle="Manage Editor groups and ordering for the clicker/manual"
        backLink="/admin"
        showSearch={false}
        actionButtons={[
          {
            label: 'Open KYC Variables',
            icon: '🔐',
            onClick: () => { window.location.href = '/admin/kyc'; },
            variant: 'secondary'
          },
          {
            label: 'Reorder Clicker',
            icon: '↕️',
            onClick: () => setReorderOpen(true),
            variant: 'primary'
          }
        ]}
        badges={[
          { text: 'Clicker', variant: 'primary' },
          { text: 'Groups', variant: 'secondary' }
        ]}
      />
          <GroupsManager variables={variables} />
          {activeVar && (
            <div className="modal-overlay"
                 onClick={() => setActiveVar(null)}>
              <div className="modal-content max-w-620" onClick={(e) => e.stopPropagation()}>
                <h3 className="modal-title">Edit Variable</h3>

                {/* Edit form */}
                <EditVariableForm
                  variable={activeVar}
                  allCategories={Array.from(new Set(variables.map(v => v.category))).sort()}
                  onSaved={(updated) => {
                    // Update both arrays by identity match on name
                    setVariables(prev => prev.map(v => v.name === updated.originalName ? { ...v, ...updated.nextVar } as Variable : v))
                    setFilteredVariables(prev => prev.map(v => v.name === updated.originalName ? { ...v, ...updated.nextVar } as Variable : v))
                    setActiveVar(null)
                  }}
                  onCancel={() => setActiveVar(null)}
                />
              </div>
            </div>
          )}

          {/* Variables list moved to KYC; this page focuses on groups only */}

      {/* Reorder Clicker Modal */}
      {reorderOpen && (
        <div className="modal-overlay"
             onClick={() => setReorderOpen(false)}>
          <div className="modal-content max-w-840" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">⇕️ Reorder Clicker Buttons</h3>
            <p className="text-gray-600 mt-1 mb-4">Drag items to change the order of clickable stats in the Editor clicker. Per-category ordering.</p>
            <ReorderClickerLists
              variables={variables}
              onClose={() => setReorderOpen(false)}
              onSaved={(updated) => {
                setVariables(updated);
                setFilteredVariables(updated);
                setReorderOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Create Variable moved to KYC page */}
      {false && showCreateForm && (
        <div className="modal-overlay"
             onClick={() => setShowCreateForm(false)}>
          <div className="modal-content max-w-640" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">➕ New Variable</h3>
            <p className="text-gray-600 mt-1 mb-4">Create a custom variable on the KYC page.</p>
            <div className="grid gap-3 grid-1fr-1fr">
              <div>
                <label className="form-label-block">Name (camelCase)</label>
                <input
                  className="form-input"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. vipGuests"
                />
              </div>
              <div>
                <label className="form-label-block">Label</label>
                <input
                  className="form-input"
                  value={createForm.label}
                  onChange={(e) => setCreateForm({ ...createForm, label: e.target.value })}
                  placeholder="e.g. VIP Guests"
                />
              </div>
              <div>
                <label className="form-label-block">Type</label>
                <select
                  className="form-select"
                  value={createForm.type}
                  onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as Variable['type'] })}
                >
                  <option value="count">count</option>
                  <option value="numeric">numeric</option>
                  <option value="currency">currency</option>
                  <option value="percentage">percentage</option>
                </select>
              </div>
              <div>
                <label className="form-label-block">Category</label>
                <input
                  className="form-input"
                  value={createForm.category}
                  onChange={(e) => setCreateForm({ ...createForm, category: e.target.value })}
                  placeholder="e.g. Event"
                />
              </div>
              <div className="grid-col-span-2">
                <label className="form-label-block">Description (optional)</label>
                <textarea
                  className="form-input"
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  placeholder="What does this track?"
                  rows={3}
                />
              </div>
              <div className="flex gap-4 items-center grid-col-span-2">
                <label className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={createForm.visibleInClicker}
                    onChange={(e) => setCreateForm({ ...createForm, visibleInClicker: e.target.checked })}
                  />
                  Visible in Clicker
                </label>
                <label className="flex gap-2 items-center">
                  <input
                    type="checkbox"
                    checked={createForm.editableInManual}
                    onChange={(e) => setCreateForm({ ...createForm, editableInManual: e.target.checked })}
                  />
                  Editable in Manual
                </label>
              </div>
            </div>
            {createForm.error && (
              <div className="text-error mt-2">{createForm.error}</div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button className="btn btn-small btn-secondary" onClick={() => setShowCreateForm(false)}>Cancel</button>
              <button
                className="btn btn-small btn-primary"
                onClick={async () => {
                  if (!createForm.name || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(createForm.name)) {
                    setCreateForm({ ...createForm, error: 'Provide a valid camelCase name (letters/numbers/underscore)' })
                    return
                  }
                  if (!createForm.label || !createForm.category) {
                    setCreateForm({ ...createForm, error: 'Label and Category are required' })
                    return
                  }
                  try {
                    setCreateForm(prev => ({ ...prev, saving: true, error: '' }))
                    // WHAT: Use apiPost() for automatic CSRF token handling
                    const data = await apiPost('/api/variables-config', {
                      name: createForm.name,
                      label: createForm.label,
                      type: createForm.type,
                      category: createForm.category,
                      description: createForm.description || undefined,
                      flags: {
                        visibleInClicker: createForm.visibleInClicker,
                        editableInManual: createForm.editableInManual,
                      }
                    })
                    if (!data?.success) throw new Error(data?.error || 'Failed to create variable')
                    // Refresh list
                    const reload = await fetch('/api/variables-config', { cache: 'no-store' })
                    const rdata = await reload.json()
                    if (rdata?.success && Array.isArray(rdata.variables)) {
                      const vars: Variable[] = rdata.variables.map((v: any) => ({
                        name: v.name,
                        label: v.label,
                        type: v.type || 'count',
                        category: v.category,
                        description: v.derived && v.formula ? v.formula : v.description || undefined,
                        derived: !!v.derived,
                        formula: v.formula,
                        icon: v.type === 'text' ? '🏷️' : undefined,
                        flags: v.flags || { visibleInClicker: false, editableInManual: false },
                        isCustom: !!v.isCustom,
                      }))
                      setVariables(vars)
                      setFilteredVariables(vars)
                    }
                    setShowCreateForm(false)
                  } catch (e: any) {
                    setCreateForm(prev => ({ ...prev, error: e?.message || 'Failed to create variable' }))
                  } finally {
                    setCreateForm(prev => ({ ...prev, saving: false }))
                  }
                }}
                disabled={createForm.saving}
              >
                {createForm.saving ? 'Saving…' : 'Create Variable'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Drag-and-drop reorder component for clicker variables grouped by category
function ReorderClickerLists({ variables, onClose, onSaved }: { variables: Variable[]; onClose: () => void; onSaved: (updated: Variable[]) => void }) {
  const [lists, setLists] = React.useState<Record<string, Variable[]>>(() => {
    const cats = ['Images', 'Fans', 'Demographics', 'Merchandise']
    const byCat: Record<string, Variable[]> = {}
    cats.forEach(c => {
      byCat[c] = variables
        .filter(v => v.category === c && v.flags?.visibleInClicker && !v.derived && v.type !== 'text')
        .sort((a, b) => ( (a.clickerOrder ?? 0) - (b.clickerOrder ?? 0) ) || a.label.localeCompare(b.label))
    })
    return byCat
  })

  const dragItem = React.useRef<{ cat: string; name: string } | null>(null)

  const onDragStart = (cat: string, name: string) => {
    dragItem.current = { cat, name }
  }
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  const onDrop = (cat: string, name: string) => {
    const src = dragItem.current
    if (!src) return
    setLists(prev => {
      const list = [...(prev[cat] || [])]
      const fromIdx = list.findIndex(v => v.name === src.name)
      const toIdx = list.findIndex(v => v.name === name)
      if (fromIdx === -1 || toIdx === -1) return prev
      const [moved] = list.splice(fromIdx, 1)
      list.splice(toIdx, 0, moved)
      return { ...prev, [cat]: list }
    })
    dragItem.current = null
  }

  const saveOrder = async () => {
    // Compute updates and persist sequentially
    const updates: { name: string; clickerOrder: number }[] = []
    Object.entries(lists).forEach(([cat, arr]) => {
      arr.forEach((v, idx) => {
        if (v.clickerOrder !== idx) updates.push({ name: v.name, clickerOrder: idx })
      })
    })
    for (const u of updates) {
      try {
        // WHAT: Use apiPost() for automatic CSRF token handling
        await apiPost('/api/variables-config', u)
      } catch {}
    }
    // Refresh variables-config
    try {
      const res = await fetch('/api/variables-config', { cache: 'no-store' })
      const data = await res.json()
      if (data?.success) {
        const updated: Variable[] = data.variables.map((v: any) => ({
          name: v.name,
          label: v.label,
          type: v.type || 'count',
          category: v.category,
          description: v.derived && v.formula ? v.formula : v.description || undefined,
          derived: !!v.derived,
          formula: v.formula,
          icon: v.type === 'text' ? '🏷️' : undefined,
          flags: v.flags || { visibleInClicker: false, editableInManual: false },
          clickerOrder: typeof v.clickerOrder === 'number' ? v.clickerOrder : undefined,
          isCustom: !!v.isCustom,
        }))
        onSaved(updated)
      } else {
        onClose()
      }
    } catch {
      onClose()
    }
  }

  const cats = Object.keys(lists)

  return (
    <div>
      <div className="grid gap-4 grid-auto-260">
        {cats.map(cat => (
          <ColoredCard key={cat} accentColor="#8b5cf6" hoverable={false} className="p-3">
            <h4 className="mt-0 mb-2">{cat}</h4>
            <ul className="list-none p-0 m-0">
              {(lists[cat] || []).map(v => (
                <li key={v.name}
                    draggable
                    onDragStart={() => onDragStart(cat, v.name)}
                    onDragOver={onDragOver}
                    onDrop={() => onDrop(cat, v.name)}
                    className="flex items-center justify-between p-2 border-dashed mb-2 bg-white-60 cursor-grab rounded-8">
                  <span className="inline-flex gap-2 items-center">
                    <span className="opacity-60">⇕️</span>
                    <span>{v.label}</span>
                  </span>
                  <code className="text-xs text-gray-600">[{v.name}]</code>
                </li>
              ))}
            </ul>
          </ColoredCard>
        ))}
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-small btn-secondary" onClick={onClose}>Cancel</button>
        <button className="btn btn-small btn-primary" onClick={saveOrder}>Save order</button>
      </div>
    </div>
  )
}
