"use client";

import React, { useEffect, useMemo, useState } from "react";
import AdminHero from "@/components/AdminHero";
import ColoredCard from "@/components/ColoredCard";

// WHAT: KYC Variables Admin Page
// WHY: Centralized catalog of all variables (manual/system/derived) powering analytics and clicker
// - Lists variable name, label, type, source, description, flags
// - Allows editing meta (label/category for registry, full meta for custom)
// - Single source to add variables that later appear in Clicker Manager groups

interface VariableFlags {
  visibleInClicker: boolean;
  editableInManual: boolean;
}

interface Variable {
  name: string;
  label: string;
  type: "numeric" | "percentage" | "currency" | "count" | "text";
  category: string;
  description?: string;
  derived?: boolean;
  formula?: string;
  flags: VariableFlags;
  isCustom?: boolean;
}

function computeSource(v: Variable): "manual" | "system" | "derived" | "text" {
  if (v.derived) return "derived";
  if (v.type === "text") return "text";
  const cat = (v.category || "").toLowerCase();
  if (cat.startsWith("bitly")) return "system";
  // Future: partners, predictions, analytics could also map to system
  return "manual";
}

export default function KycVariablesPage() {
  const [variables, setVariables] = useState<Variable[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeVar, setActiveVar] = useState<Variable | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  // WHAT: Source filters and tags (categories) filter
  // WHY: Allow narrowing KYC list by data origin and grouping tags
  const [sourceFilter, setSourceFilter] = useState<{ manual: boolean; system: boolean; derived: boolean; text: boolean }>({ manual: true, system: true, derived: true, text: true });
  const [flagFilter, setFlagFilter] = useState<{ clicker: boolean; manual: boolean }>({ clicker: false, manual: false });
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/variables-config", { cache: "no-store" });
      const data = await res.json();
      if (data?.success) {
        const vars: Variable[] = (data.variables || []).map((v: any) => ({
          name: v.name,
          label: v.label,
          type: v.type || "count",
          category: v.category,
          description: v.derived && v.formula ? v.formula : v.description || undefined,
          derived: !!v.derived,
          formula: v.formula,
          flags: v.flags || { visibleInClicker: false, editableInManual: false },
          isCustom: !!v.isCustom,
        }));
        setVariables(vars);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const categories = useMemo(() => Array.from(new Set(variables.map(v => v.category))).sort(), [variables]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return variables.filter((v) => {
      // Text search
      const matchesText = !q || v.name.toLowerCase().includes(q) || v.label.toLowerCase().includes(q) || (v.category || "").toLowerCase().includes(q) || (v.description || "").toLowerCase().includes(q);
      if (!matchesText) return false;
      // Source filter
      const src = computeSource(v);
      if (!sourceFilter[src]) return false;
      // Flags filter (if enabled)
      if (flagFilter.clicker && !v.flags?.visibleInClicker) return false;
      if (flagFilter.manual && !v.flags?.editableInManual) return false;
      // Category tags filter (if any selected)
      if (selectedCategories.size > 0 && !selectedCategories.has(v.category)) return false;
      return true;
    });
  }, [variables, search, sourceFilter, flagFilter, selectedCategories]);

  return (
    <div className="page-container">
      <AdminHero
        title="🔐 KYC Variables"
        subtitle="Catalog of all variables (manual, system, derived) powering analytics and clicker"
        backLink="/admin"
        showSearch
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search variables..."
        actionButtons={[
          { label: "New Variable", onClick: () => setCreateOpen(true), variant: "primary" },
          { label: "↔️ Open Clicker Manager", onClick: () => { window.location.href = "/admin/variables"; }, variant: "secondary" },
          { label: "⬇️ Export CSV", onClick: () => exportCSV(filtered), variant: "secondary" },
          { label: "⬇️ Export JSON", onClick: () => exportJSON(filtered), variant: "secondary" },
        ]}
        badges={[
          { text: "KYC", variant: "primary" },
          { text: `${filtered.length} Variables`, variant: "success" },
        ]}
      />

      {loading && (
        <ColoredCard accentColor="#6366f1" hoverable={false} className="text-center">
          <div className="text-4xl mb-4">📊</div>
          <div>Loading KYC variables...</div>
        </ColoredCard>
      )}

      {!loading && (
        <>
          {/* WHAT: Filters row (sources, flags, tags) */}
          {/* WHY: Quick narrowing by data origin and usage */}
          <ColoredCard accentColor="#10b981" hoverable={false}>
            <div className="grid gap-3 grid-1fr-1fr-1fr">
              <div>
                <label className="form-label">Source</label>
                <div className="flex flex-wrap gap-3">
                  {(["manual","system","derived","text"] as const).map(k => (
                    <label key={k} className="flex items-center gap-2">
                      <input type="checkbox" checked={sourceFilter[k]} onChange={(e) => setSourceFilter(prev => ({ ...prev, [k]: e.target.checked }))} />
                      <span className="text-sm capitalize">{k}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Flags</label>
                <div className="flex flex-wrap gap-3">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={flagFilter.clicker} onChange={(e) => setFlagFilter(prev => ({ ...prev, clicker: e.target.checked }))} />
                    <span className="text-sm">clicker</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={flagFilter.manual} onChange={(e) => setFlagFilter(prev => ({ ...prev, manual: e.target.checked }))} />
                    <span className="text-sm">manual</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="form-label">Tags (Categories)</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => {
                    const active = selectedCategories.has(cat);
                    return (
                      <button key={cat} className={`badge ${active ? 'badge-primary' : 'badge-secondary'}`} onClick={() => {
                        setSelectedCategories(prev => {
                          const next = new Set(prev);
                          if (next.has(cat)) next.delete(cat); else next.add(cat);
                          return next;
                        })
                      }}>{cat}</button>
                    )
                  })}
                  {categories.length === 0 && (
                    <span className="text-sm text-gray-600">No categories</span>
                  )}
                  {selectedCategories.size > 0 && (
                    <button className="btn btn-small btn-secondary" onClick={() => setSelectedCategories(new Set())}>Clear</button>
                  )}
                </div>
              </div>
            </div>
          </ColoredCard>

          <div className="grid gap-3 mt-3">
            {filtered.map((v) => {
            const source = computeSource(v);
            const typeBadge = v.type.toUpperCase();
            const tags = [v.category, source, v.derived ? "derived" : undefined].filter(Boolean) as string[];
            return (
              <ColoredCard key={v.name} accentColor="#3b82f6" hoverable={false}>
                {/* WHAT: KYC variable row */}
                {/* WHY: One-line overview with actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="mt-0 mb-0">{v.label}</h3>
                      <code className="variable-ref">{v.name}</code>
                      <span className="badge badge-info">{typeBadge}</span>
                      <span className="badge badge-secondary">{source}</span>
                      {v.flags?.visibleInClicker && (
                        <span className="badge badge-success">clicker</span>
                      )}
                      {v.flags?.editableInManual && (
                        <span className="badge badge-warning">manual</span>
                      )}
                    </div>
                    {v.description && (
                      <p className="text-gray-600 mt-1 mb-0">{v.description}</p>
                    )}
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {tags.map(t => (
                          <span key={t} className="badge badge-secondary">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button className="btn btn-small btn-primary" onClick={() => setActiveVar(v)}>✏️ Edit</button>
                  </div>
                </div>
              </ColoredCard>
            );
          })}
        </div>
        </>
      )}

      {activeVar && (
        <div className="modal-overlay" onClick={() => setActiveVar(null)}>
          <div className="modal-content max-w-620" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Variable</h3>
            <EditVariableMeta variable={activeVar} onClose={() => { setActiveVar(null); load(); }} />
          </div>
        </div>
      )}

      {createOpen && (
        <div className="modal-overlay" onClick={() => setCreateOpen(false)}>
          <div className="modal-content max-w-640" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">➕ New Variable</h3>
            <CreateVariableForm onClose={() => setCreateOpen(false)} onCreated={async () => { setCreateOpen(false); await load(); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function downloadBlob(content: string | Blob, filename: string, type: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function exportJSON(rows: Variable[]) {
  const ts = new Date().toISOString();
  downloadBlob(JSON.stringify(rows, null, 2), `kyc-variables-${ts}.json`, 'application/json');
}

function exportCSV(rows: Variable[]) {
  const headers = ['name','label','type','source','category','visibleInClicker','editableInManual','derived','description'];
  const csv = [headers.join(',')].concat(
    rows.map(v => {
      const src = computeSource(v);
      const values = [
        v.name,
        v.label,
        v.type,
        src,
        v.category,
        String(!!v.flags?.visibleInClicker),
        String(!!v.flags?.editableInManual),
        String(!!v.derived),
        (v.description || '').replace(/\n/g, ' ').replace(/"/g, '""')
      ];
      return values.map(x => /[,\n\"]/.test(String(x)) ? `"${String(x).replace(/\"/g, '""')}"` : String(x)).join(',');
    })
  ).join('\n');
  const ts = new Date().toISOString();
  downloadBlob(csv, `kyc-variables-${ts}.csv`, 'text/csv');
}

function CreateVariableForm({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({
    name: '',
    label: '',
    type: 'count' as Variable['type'],
    category: '',
    description: '',
    visibleInClicker: true,
    editableInManual: true,
    saving: false,
    error: '' as string | null,
  });

  return (
    <div>
      <div className="grid gap-3 grid-1fr-1fr">
        <div>
          <label className="form-label-block">Name (camelCase)</label>
          <input className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. vipGuests" />
        </div>
        <div>
          <label className="form-label-block">Label</label>
          <input className="form-input" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="e.g. VIP Guests" />
        </div>
        <div>
          <label className="form-label-block">Type</label>
          <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as Variable['type'] })}>
            <option value="count">count</option>
            <option value="numeric">numeric</option>
            <option value="currency">currency</option>
            <option value="percentage">percentage</option>
            <option value="boolean">boolean</option>
            <option value="date">date</option>
            <option value="text">text</option>
          </select>
        </div>
        <div>
          <label className="form-label-block">Category</label>
          <input className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="e.g. Event" />
        </div>
        <div className="grid-col-span-2">
          <label className="form-label-block">Description (optional)</label>
          <textarea className="form-input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What does this track?" />
        </div>
        <div className="flex gap-4 items-center grid-col-span-2">
          <label className="flex gap-2 items-center">
            <input type="checkbox" checked={form.visibleInClicker} onChange={(e) => setForm({ ...form, visibleInClicker: e.target.checked })} />
            Visible in Clicker
          </label>
          <label className="flex gap-2 items-center">
            <input type="checkbox" checked={form.editableInManual} onChange={(e) => setForm({ ...form, editableInManual: e.target.checked })} />
            Editable in Manual
          </label>
        </div>
      </div>
      {form.error && <div className="text-error mt-2">{form.error}</div>}
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-small btn-secondary" onClick={onClose} disabled={form.saving}>Cancel</button>
        <button className="btn btn-small btn-primary" disabled={form.saving} onClick={async () => {
          if (!form.name || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(form.name)) { setForm({ ...form, error: 'Provide a valid camelCase name' }); return; }
          if (!form.label || !form.category) { setForm({ ...form, error: 'Label and Category are required' }); return; }
          try {
            setForm(prev => ({ ...prev, saving: true, error: '' }));
            const res = await fetch('/api/variables-config', {
              method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
                name: form.name,
                label: form.label,
                type: form.type,
                category: form.category,
                description: form.description || undefined,
                flags: { visibleInClicker: form.visibleInClicker, editableInManual: form.editableInManual },
              })
            });
            const data = await res.json();
            if (!res.ok || !data?.success) throw new Error(data?.error || 'Failed to create variable');
            onCreated();
          } catch (e: any) {
            setForm(prev => ({ ...prev, saving: false, error: e?.message || 'Failed to create variable' }));
          }
        }}>{form.saving ? 'Saving…' : 'Create'}</button>
      </div>
    </div>
  );
}

function EditVariableMeta({ variable, onClose }: { variable: Variable; onClose: () => void }) {
  const [label, setLabel] = useState(variable.label);
  const [category, setCategory] = useState(variable.category);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canRename = !!variable.isCustom;
  const [name, setName] = useState(variable.name);

  return (
    <div>
      <div className="grid gap-3 grid-1fr-1fr">
        <div>
          <label className="form-label">Name{!canRename && " (registry)"}</label>
          <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} disabled={!canRename} />
          {!canRename && (
            <div className="text-xs text-gray-600 mt-1">Built-in variables cannot be renamed here to avoid breaking stored data.</div>
          )}
        </div>
        <div>
          <label className="form-label">Label</label>
          <input className="form-input" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Category</label>
          <input className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} />
        </div>
        <div>
          <label className="form-label">Type</label>
          <input className="form-input" value={variable.type} disabled />
        </div>
      </div>
      {error && <div className="text-error text-xs mt-2">{error}</div>}
      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-small btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
        <button
          className="btn btn-small btn-primary"
          disabled={saving}
          onClick={async () => {
            try {
              setSaving(true); setError(null);
              const res = await fetch("/api/variables-config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  name: canRename ? name : variable.name,
                  label,
                  type: variable.type,
                  category,
                  description: variable.description,
                  derived: !!variable.derived,
                  formula: variable.formula,
                }),
              });
              const data = await res.json();
              if (!res.ok || !data?.success) throw new Error(data?.error || "Failed to save");
              onClose();
            } catch (e: any) {
              setError(e?.message || "Failed to save");
            } finally {
              setSaving(false);
            }
          }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}