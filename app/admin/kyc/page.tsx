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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = variables;
    if (!q) return list;
    return list.filter((v) =>
      v.name.toLowerCase().includes(q) ||
      v.label.toLowerCase().includes(q) ||
      (v.category || "").toLowerCase().includes(q) ||
      (v.description || "").toLowerCase().includes(q)
    );
  }, [variables, search]);

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
          { label: "↔️ Open Clicker Manager", onClick: () => { window.location.href = "/admin/variables"; }, variant: "secondary" },
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
        <div className="grid gap-3">
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
      )}

      {/* Edit modal reuses variables-config API; keep UX consistent with Variables page */}
      {activeVar && (
        <div className="modal-overlay" onClick={() => setActiveVar(null)}>
          <div className="modal-content max-w-620" onClick={(e) => e.stopPropagation()}>
            <h3 className="modal-title">Edit Variable</h3>
            <EditVariableMeta variable={activeVar} onClose={() => { setActiveVar(null); load(); }} />
          </div>
        </div>
      )}
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