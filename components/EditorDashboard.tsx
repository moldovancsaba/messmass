'use client';

import React, { useState, useEffect } from 'react';
import { evaluateFormula } from '@/lib/formulaEngine';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import UnifiedHashtagInput from './UnifiedHashtagInput';
import { 
  mergeHashtagSystems, 
  getAllHashtagRepresentations,
  expandHashtagsWithCategories 
} from '@/lib/hashtagCategoryUtils';

// WHAT: Variable config type loaded from /api/variables-config to control Editor UI visibility.
// WHY: Admin decides which variables appear in clicker vs. manual; we respect flags at render-time.
interface VariableWithFlags {
  name: string;
  label: string;
  type: 'count' | 'numeric' | 'currency' | 'percentage' | 'text';
  category: string;
  derived?: boolean;
  flags: { visibleInClicker: boolean; editableInManual: boolean };
  isCustom?: boolean;
  clickerOrder?: number;
  manualOrder?: number;
}

interface Project {
  _id: string;
  eventName: string;
  eventDate: string;
  hashtags?: string[];
  categorizedHashtags?: { [categoryName: string]: string[] };
  stats: {
    remoteImages: number;
    hostessImages: number;
    selfies: number;
    indoor: number;
    outdoor: number;
    stadium: number;
    female: number;
    male: number;
    genAlpha: number;
    genYZ: number;
    genX: number;
    boomer: number;
    merched: number;
    jersey: number;
    scarf: number;
    flags: number;
    baseballCap: number;
    other: number;
    // Derived/extended fields (new)
    remoteFans?: number; // New aggregated fans count (indoor + outdoor)
    socialVisit?: number; // New aggregated social visits (sum of individual socials)
    // Success Manager fields
    approvedImages?: number;
    rejectedImages?: number;
    visitQrCode?: number;
    visitShortUrl?: number;
    visitWeb?: number;
    visitFacebook?: number;
    visitInstagram?: number;
    visitYoutube?: number;
    visitTiktok?: number;
    visitX?: number;
    visitTrustpilot?: number;
    eventAttendees?: number;
    eventTicketPurchases?: number;
    eventResultHome?: number;
    eventResultVisitor?: number;
    eventValuePropositionVisited?: number;
    eventValuePropositionPurchases?: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface EditorDashboardProps {
  project: Project;
}

export default function EditorDashboard({ project: initialProject }: EditorDashboardProps) {
  const [project, setProject] = useState<Project>(initialProject);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [hashtags, setHashtags] = useState<string[]>(initialProject.hashtags || []);
  const [categorizedHashtags, setCategorizedHashtags] = useState<{ [categoryName: string]: string[] }>(initialProject.categorizedHashtags || {});
  const [editMode, setEditMode] = useState<'clicker' | 'manual'>('clicker'); // New state for edit mode

  // Variables-config flags fetched from API
  const [varsConfig, setVarsConfig] = useState<VariableWithFlags[]>([]);
  const [varsLoading, setVarsLoading] = useState<boolean>(false);

  // Update project when initialProject changes
  useEffect(() => {
    setProject(initialProject);
    setHashtags(initialProject.hashtags || []);
    setCategorizedHashtags(initialProject.categorizedHashtags || {});
  }, [initialProject]);

  // Load variables-config (flags and custom variables)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setVarsLoading(true);
        const res = await fetch('/api/variables-config', { cache: 'no-store' });
        const data = await res.json();
        if (mounted && data?.success && Array.isArray(data.variables)) {
          setVarsConfig(data.variables);
        }
      } catch (e) {
        console.error('Failed to load variables-config', e);
      } finally {
        setVarsLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  // Auto-save function
  const saveProject = async (
    updatedStats?: typeof project.stats, 
    updatedHashtags?: string[], 
    updatedCategorizedHashtags?: { [categoryName: string]: string[] }
  ) => {
    setSaveStatus('saving');
    try {
      const response = await fetch('/api/projects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: project._id,
          eventName: project.eventName,
          eventDate: project.eventDate,
          hashtags: updatedHashtags !== undefined ? updatedHashtags : hashtags,
          categorizedHashtags: updatedCategorizedHashtags !== undefined ? updatedCategorizedHashtags : categorizedHashtags,
          stats: updatedStats || project.stats
        })
      });

      if (response.ok) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      console.error('Failed to save project:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Increment/Decrement functions for click-to-increment cards
  const incrementStat = (key: keyof typeof project.stats) => {
    const currentValue = project.stats[key] ?? 0;
    const newStats = {
      ...project.stats,
      [key]: currentValue + 1
    };
    setProject(prev => ({ ...prev, stats: newStats }));
    saveProject(newStats);
  };

  const decrementStat = (key: keyof typeof project.stats) => {
    const currentValue = project.stats[key] ?? 0;
    if (currentValue > 0) {
      const newStats = {
        ...project.stats,
        [key]: currentValue - 1
      };
      setProject(prev => ({ ...prev, stats: newStats }));
      saveProject(newStats);
    }
  };

  // Dynamic accessors for custom variables (and safe access for known ones)
  const getStat = (key: string): number => {
    const raw = (project.stats as any)[key]
    return typeof raw === 'number' ? raw : 0
  }
  const setStat = (key: string, value: number) => {
    const newStats: any = { ...project.stats, [key]: Math.max(0, value) }
    setProject(prev => ({ ...prev, stats: newStats }))
    saveProject(newStats)
  }
  const incrementDynamic = (key: string) => setStat(key, getStat(key) + 1)
  const decrementDynamic = (key: string) => setStat(key, Math.max(0, getStat(key) - 1))

  // Success Manager input field update (on blur/leave)
  const updateSuccessManagerField = (field: keyof typeof project.stats, value: number) => {
    const newStats = {
      ...project.stats,
      [field]: Math.max(0, value)
    };
    setProject(prev => ({ ...prev, stats: newStats }));
    saveProject(newStats);
  };

  // Hashtag management functions
  const handleGeneralHashtagsChange = (newHashtags: string[]) => {
    setHashtags(newHashtags);
    setProject(prev => ({ ...prev, hashtags: newHashtags }));
    saveProject(undefined, newHashtags, undefined);
  };

  const handleCategorizedHashtagsChange = (newCategorizedHashtags: { [categoryName: string]: string[] }) => {
    setCategorizedHashtags(newCategorizedHashtags);
    setProject(prev => ({ ...prev, categorizedHashtags: newCategorizedHashtags }));
    saveProject(undefined, undefined, newCategorizedHashtags);
  };

  // Calculate totals
  const totalImages = project.stats.remoteImages + project.stats.hostessImages + project.stats.selfies;
  // Groups
  const [groups, setGroups] = useState<{ groupOrder: number; chartId?: string; titleOverride?: string; variables: string[] }[]>([])
  const [charts, setCharts] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/variables-groups', { cache: 'no-store' })
        const data = await res.json()
        if (data?.success && Array.isArray(data.groups)) setGroups(data.groups)
      } catch {}
      try {
        const res2 = await fetch('/api/chart-config', { cache: 'no-store' })
        const data2 = await res2.json()
        if (data2?.success && Array.isArray(data2.configurations)) setCharts(data2.configurations)
      } catch {}
    })()
  }, [])
  const remoteFansCalc = (project.stats.remoteFans ?? (project.stats.indoor + project.stats.outdoor));
  const totalFans = remoteFansCalc + project.stats.stadium;
  const totalGender = project.stats.female + project.stats.male;
  const totalUnder40 = project.stats.genAlpha + project.stats.genYZ;
  const totalOver40 = project.stats.genX + project.stats.boomer;
  const totalAge = totalUnder40 + totalOver40;
  const totalMerch = project.stats.merched + project.stats.jersey + project.stats.scarf + project.stats.flags + project.stats.baseballCap + project.stats.other;

  // Manual input field update (on blur/leave)
  const updateManualField = (field: keyof typeof project.stats, value: number) => {
    const newStats = {
      ...project.stats,
      [field]: Math.max(0, value)
    };
    setProject(prev => ({ ...prev, stats: newStats }));
    saveProject(newStats);
  };

  // Clickable stat card component (for clicker mode)
  // What: Supports optional custom increment/decrement handlers.
  // Why: Remote Fans needs to increment from a derived value (indoor+outdoor) when undefined.
  const StatCard = ({ label, value, statKey, isCalculated = false, onIncrement, onDecrement }: { 
    label: string; 
    value: number; 
    statKey?: keyof typeof project.stats;
    isCalculated?: boolean;
    onIncrement?: () => void;
    onDecrement?: () => void;
  }) => (
    <div
      className={`stat-card stat-card-accent ${isCalculated ? 'stat-card-readonly' : 'stat-card-clickable'}`}
      onClick={!isCalculated ? (onIncrement ? onIncrement : (statKey ? () => incrementStat(statKey) : undefined)) : undefined}
    >
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      
      {/* Decrement button for clickable stats */}
      {!isCalculated && (statKey || onDecrement) && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onDecrement) onDecrement();
            else if (statKey) decrementStat(statKey);
          }}
          disabled={value === 0}
          className="btn btn-sm btn-danger stat-decrement"
        >
          -1
        </button>
      )}
    </div>
  );

  // Manual input card component (for manual mode)
  const ManualInputCard = ({ label, value, statKey }: { 
    label: string; 
    value: number; 
    statKey: keyof typeof project.stats;
  }) => {
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => {
      setTempValue(value);
    }, [value]);

    const handleBlur = () => {
      const newValue = Math.max(0, parseInt(tempValue.toString()) || 0);
      if (newValue !== value) {
        updateManualField(statKey, newValue);
      }
    };

    return (
      <div className="input-card flex-row gap-4">
        <input
          type="number"
          value={tempValue}
          onChange={(e) => {
            const newValue = Math.max(0, parseInt(e.target.value) || 0);
            setTempValue(newValue);
          }}
          onBlur={handleBlur}
          className="form-input w-120"
          min="0"
        />
        <div className="form-label flex-1">{label}</div>
      </div>
    );
  };

  // Manual input for dynamic/custom stats
  const ManualInputDynamic = ({ label, keyName }: { label: string; keyName: string }) => {
    const val = getStat(keyName)
    const [tempValue, setTempValue] = useState<number>(val)

    useEffect(() => { setTempValue(val) }, [keyName, val])

    const handleBlur = () => {
      const newValue = Math.max(0, parseInt(tempValue.toString()) || 0)
      if (newValue !== val) {
        setStat(keyName, newValue)
      }
    }

    return (
      <div className="input-card flex-row gap-4">
        <input
          type="number"
          value={tempValue}
          onChange={(e) => {
            const newValue = Math.max(0, parseInt(e.target.value) || 0)
            setTempValue(newValue)
          }}
          onBlur={handleBlur}
          className="form-input w-120"
          min="0"
        />
        <div className="form-label flex-1">{label}</div>
      </div>
    )
  }

  // Success Manager input card component
  const SuccessManagerCard = ({ label, value, statKey }: { 
    label: string; 
    value: number; 
    statKey: keyof typeof project.stats;
  }) => {
    const [tempValue, setTempValue] = useState(value);

    useEffect(() => {
      setTempValue(value);
    }, [value]);

    const handleBlur = () => {
      const newValue = Math.max(0, parseInt(tempValue.toString()) || 0);
      if (newValue !== value) {
        updateSuccessManagerField(statKey, newValue);
      }
    };

    return (
      <div className="input-card flex-row gap-4">
        <input
          type="number"
          value={tempValue}
          onChange={(e) => {
            const newValue = Math.max(0, parseInt(tempValue.toString()) || 0);
            setTempValue(newValue);
          }}
          onBlur={handleBlur}
          className="form-input w-120"
          min="0"
        />
        <div className="form-label flex-1">{label}</div>
      </div>
    );
  };

  // Helper: should show variable in clicker/manual by name
  const canShowInClicker = (name: string) => !!varsConfig.find(v => v.name === name)?.flags?.visibleInClicker
  const canShowInManual = (name: string) => !!varsConfig.find(v => v.name === name)?.flags?.editableInManual

  // Get all hashtag representations for display
  const allHashtagRepresentations = getAllHashtagRepresentations({ hashtags, categorizedHashtags });
  const totalHashtagCount = allHashtagRepresentations.length;

  const chartById = (id?: string) => charts.find((c: any) => c.chartId === id)
  const computeKpiValue = (cfg: any): number | 'NA' => {
    if (!cfg || cfg.type !== 'kpi' || !cfg.elements?.[0]) return 'NA'
    const formula = cfg.elements[0].formula as string
    return evaluateFormula(formula, project.stats as any)
  }

  // If groups exist, render from groups (both modes)
  const hasGroups = groups && groups.length > 0

  return (
    <div className="admin-container">
      {/* Header with same styling as stats page */}
      <div className="glass-card admin-header">
        <div className="admin-header-content">
          <div className="admin-branding">
            <h1 className="admin-title">{project.eventName}</h1>
            <p className="admin-subtitle">Record Stats - {new Date(project.eventDate).toLocaleDateString()}</p>
            
            {/* Beautiful hashtag display - showing all hashtags including categorized ones */}
            {allHashtagRepresentations.length > 0 && (
              <div className="centered-pill-row mt-2">
                {allHashtagRepresentations.map((hashtagDisplay, index) => (
                  <ColoredHashtagBubble 
                    key={index}
                    hashtag={hashtagDisplay}
                    customStyle={{
                      fontSize: '1.125rem',
                      fontWeight: '600'
                    }}
                    showCategoryPrefix={true}
                  />
                ))}
              </div>
            )}
          </div>
          <div className="admin-user-info">
            <div className="admin-badge p-3">
              <p className="admin-role">📅 {new Date(project.eventDate).toLocaleDateString()}</p>
              <p className="admin-level">🎯 Editor Mode</p>
              <p className="admin-status">
                {saveStatus === 'saving' && '💾 Saving...'}
                {saveStatus === 'saved' && '✅ Saved'}
                {saveStatus === 'error' && '❌ Save Error'}
                {saveStatus === 'idle' && '📝 Ready'}
              </p>
              {/* Mode Toggle Button */}
              <button
                onClick={() => setEditMode(editMode === 'clicker' ? 'manual' : 'clicker')}
                className={`btn btn-sm ${editMode === 'clicker' ? 'btn-primary' : 'btn-success'} btn-full mt-2`}
              >
                {editMode === 'clicker' ? '🖱️ Clicker' : '✏️ Manual'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="content-surface content-grid">
        {hasGroups && (
          <>
            {groups.sort((a,b)=>a.groupOrder-b.groupOrder).map((g, idx) => {
              const chart = chartById(g.chartId)
              const kpi = computeKpiValue(chart)
              const title = g.chartId && chart ? chart.title : (g.titleOverride || undefined)
              const items = g.variables
                .map(name => varsConfig.find(v => v.name === name))
                .filter((v): v is VariableWithFlags => !!v && !v.derived && v.type !== 'text')
              const filtered = editMode === 'clicker'
                ? items.filter(v => v.flags.visibleInClicker)
                : items.filter(v => v.flags.editableInManual)
              if (filtered.length === 0 && !title) return null
              return (
                <div key={idx} className="glass-card section-card">
                  {title && (
                    <h2 className="section-title">
                      {title} {kpi !== 'NA' ? <span className="value-pill" style={{ marginLeft: 8 }}>{kpi}</span> : null}
                    </h2>
                  )}
                  <div className="stats-cards-row">
                    {filtered.map(v => (
                      editMode === 'clicker' ? (
                        v.name === 'remoteFans' ? (
                          <StatCard key={v.name}
                            label={v.label}
                            value={(project.stats as any).remoteFans ?? (project.stats.indoor + project.stats.outdoor)}
                            onIncrement={() => {
                              const current = (project.stats.remoteFans ?? (project.stats.indoor + project.stats.outdoor));
                              const newStats = { ...project.stats, remoteFans: current + 1 };
                              setProject(prev => ({ ...prev, stats: newStats }));
                              saveProject(newStats);
                            }}
                            onDecrement={() => {
                              const current = (project.stats.remoteFans ?? (project.stats.indoor + project.stats.outdoor));
                              const next = Math.max(0, current - 1);
                              const newStats = { ...project.stats, remoteFans: next };
                              setProject(prev => ({ ...prev, stats: newStats }));
                              saveProject(newStats);
                            }}
                          />
                        ) : (
                          <StatCard key={v.name} label={v.label} value={getStat(v.name)} statKey={v.name as keyof typeof project.stats} />
                        )
                      ) : (
                        v.name === 'remoteFans' ? (
                          <ManualInputCard key={v.name} label={v.label} value={(project.stats as any).remoteFans ?? (project.stats.indoor + project.stats.outdoor)} statKey={"remoteFans" as keyof typeof project.stats} />
                        ) : (
                          <ManualInputCard key={v.name} label={v.label} value={getStat(v.name)} statKey={v.name as keyof typeof project.stats} />
                        )
                      )
                    ))}
                  </div>
                </div>
              )
            })}
          </>
        )}
        {!hasGroups && (
          <>
        {/* Hashtag Management Section - Only show in manual mode */}
        {/* Images Section */}
        <div className="glass-card section-card">
          <h2 className="section-title">📸 Images ({totalImages})</h2>
          <div className="stats-cards-row">
            {editMode === 'clicker' ? (
              <>
                {(() => {
                  const items = varsConfig
                    .filter(v => v.category === 'Images' && v.flags?.visibleInClicker && !v.derived && v.type !== 'text')
                    .sort((a, b) => ((a.clickerOrder ?? 0) - (b.clickerOrder ?? 0)) || a.label.localeCompare(b.label))
                  return items.map(v => (
                    <StatCard key={v.name} label={v.label} value={getStat(v.name)} statKey={v.name as keyof typeof project.stats} />
                  ))
                })()}
              </>
) : (
              <>
                {(() => {
                  const items = varsConfig
                    .filter(v => v.category === 'Images' && v.flags?.editableInManual && !v.derived && v.type !== 'text')
                    .sort((a, b) => ((a.manualOrder ?? Number.MAX_SAFE_INTEGER) - (b.manualOrder ?? Number.MAX_SAFE_INTEGER)) || a.label.localeCompare(b.label))
                  return items.map(v => (
                    <ManualInputDynamic key={v.name} label={v.label} keyName={v.name} />
                  ))
                })()}
              </>
            )}
          </div>
        </div>

        {/* Fans Section */}
        <div className="glass-card section-card">
          <h2 className="section-title">👥 Fans ({totalFans})</h2>
          <div className="stats-cards-row">
            {editMode === 'clicker' ? (
              <>
                {(() => {
                  const items = varsConfig
                    .filter(v => v.category === 'Fans' && v.flags?.visibleInClicker && !v.derived && v.type !== 'text')
                    .sort((a, b) => ((a.clickerOrder ?? 0) - (b.clickerOrder ?? 0)) || a.label.localeCompare(b.label))
                  return items.map(v => {
                    if (v.name === 'remoteFans') {
                      return (
                        <StatCard key={v.name}
                          label={v.label}
                          value={remoteFansCalc}
                          onIncrement={() => {
                            const current = (project.stats.remoteFans ?? (project.stats.indoor + project.stats.outdoor));
                            const newStats = { ...project.stats, remoteFans: current + 1 };
                            setProject(prev => ({ ...prev, stats: newStats }));
                            saveProject(newStats);
                          }}
                          onDecrement={() => {
                            const current = (project.stats.remoteFans ?? (project.stats.indoor + project.stats.outdoor));
                            const next = Math.max(0, current - 1);
                            const newStats = { ...project.stats, remoteFans: next };
                            setProject(prev => ({ ...prev, stats: newStats }));
                            saveProject(newStats);
                          }}
                        />
                      )
                    }
                    return (
                      <StatCard key={v.name} label={v.label} value={getStat(v.name)} statKey={v.name as keyof typeof project.stats} />
                    )
                  })
                })()}
                {/* Derived total shown if any base is shown */}
                {(() => {
                  const anyShown = varsConfig.some(v => v.category === 'Fans' && v.flags?.visibleInClicker && !v.derived && v.type !== 'text')
                  return anyShown ? <StatCard label="Total Fans" value={totalFans} isCalculated={true} /> : null
                })()}
              </>
) : (
              <>
                {(() => {
                  const items = varsConfig
                    .filter(v => v.category === 'Fans' && v.flags?.editableInManual && !v.derived && v.type !== 'text')
                    .sort((a, b) => ((a.manualOrder ?? Number.MAX_SAFE_INTEGER) - (b.manualOrder ?? Number.MAX_SAFE_INTEGER)) || a.label.localeCompare(b.label))
                  return items.map(v => {
                    if (v.name === 'remoteFans') {
                      return (
                        <ManualInputCard key={v.name} label={v.label} value={(project.stats as any).remoteFans ?? remoteFansCalc} statKey={"remoteFans" as keyof typeof project.stats} />
                      )
                    }
                    if (v.name === 'stadium') {
                      return (
                        <ManualInputCard key={v.name} label={v.label} value={project.stats.stadium} statKey={"stadium" as keyof typeof project.stats} />
                      )
                    }
                    return <ManualInputDynamic key={v.name} label={v.label} keyName={v.name} />
                  })
                })()}
                {(() => {
                  const anyShown = varsConfig.some(v => v.category === 'Fans' && v.flags?.editableInManual && !v.derived && v.type !== 'text')
                  return anyShown ? (
                    <div className="calc-row">
                      <div className="value-pill">{totalFans}</div>
                      <div className="form-label flex-1">Total Fans (calculated)</div>
                    </div>
                  ) : null
                })()}
              </>
            )}
          </div>
        </div>

        {/* Gender Section */}
        <div className="glass-card section-card">
          <h2 className="section-title">⚧️ Gender ({totalGender})</h2>
          <div className="stats-cards-row">
            {editMode === 'clicker' ? (
              <>
                {(() => {
                  const items = varsConfig
                    .filter(v => v.category === 'Demographics' && v.flags?.visibleInClicker && !v.derived && v.type !== 'text' && (v.name === 'female' || v.name === 'male'))
                    .sort((a, b) => ((a.clickerOrder ?? 0) - (b.clickerOrder ?? 0)) || a.label.localeCompare(b.label))
                  return items.map(v => (
                    <StatCard key={v.name} label={v.label} value={getStat(v.name)} statKey={v.name as keyof typeof project.stats} />
                  ))
                })()}
                {(() => {
                  const anyShown = varsConfig.some(v => (v.name === 'female' || v.name === 'male') && v.category === 'Demographics' && v.flags?.visibleInClicker)
                  return anyShown ? <StatCard label="Total Gender" value={totalGender} isCalculated={true} /> : null
                })()}
              </>
) : (
              <>
                {(() => {
                  const items = varsConfig
                    .filter(v => v.category === 'Demographics' && (v.name === 'female' || v.name === 'male') && v.flags?.editableInManual && !v.derived && v.type !== 'text')
                    .sort((a, b) => ((a.manualOrder ?? Number.MAX_SAFE_INTEGER) - (b.manualOrder ?? Number.MAX_SAFE_INTEGER)) || a.label.localeCompare(b.label))
                  return items.map(v => (
                    <ManualInputCard key={v.name} label={v.label} value={getStat(v.name)} statKey={v.name as keyof typeof project.stats} />
                  ))
                })()}
                {(() => {
                const any = varsConfig.some(v => (v.name === 'female' || v.name === 'male') && v.flags?.editableInManual)
                return any ? (
                  <div className="calc-row">
                    <div className="value-pill">{totalGender}</div>
                    <div className="form-label flex-1">Total Gender (calculated)</div>
                  </div>
                ) : null
                })()}
              </>
            )}
          </div>
        </div>

        {/* Age Section */}
        <div className="glass-card section-card">
          <h2 className="section-title">🎂 Age ({totalAge})</h2>
          <div className="age-grid">
            {editMode === 'clicker' ? (
              <>
                {(() => {
                  const items = varsConfig
                    .filter(v => v.category === 'Demographics' && v.flags?.visibleInClicker && !v.derived && v.type !== 'text' && (v.name === 'genAlpha' || v.name === 'genYZ' || v.name === 'genX' || v.name === 'boomer'))
                    .sort((a, b) => ((a.clickerOrder ?? 0) - (b.clickerOrder ?? 0)) || a.label.localeCompare(b.label))
                  return items.map(v => (
                    <StatCard key={v.name} label={v.label} value={getStat(v.name)} statKey={v.name as keyof typeof project.stats} />
                  ))
                })()}
                {/* Totals */}
                {(() => {
                  const anyUnder = varsConfig.some(v => (v.name === 'genAlpha' || v.name === 'genYZ') && v.flags?.visibleInClicker)
                  const anyOver = varsConfig.some(v => (v.name === 'genX' || v.name === 'boomer') && v.flags?.visibleInClicker)
                  return (
                    <>
                      {anyUnder && <StatCard label="Total Under 40" value={totalUnder40} isCalculated={true} />}
                      {anyOver && <StatCard label="Total Over 40" value={totalOver40} isCalculated={true} />}
                    </>
                  )
                })()}
              </>
) : (
              <>
                {(() => {
                  const items = varsConfig
                    .filter(v => v.category === 'Demographics' && (v.name === 'genAlpha' || v.name === 'genYZ' || v.name === 'genX' || v.name === 'boomer') && v.flags?.editableInManual && !v.derived && v.type !== 'text')
                    .sort((a, b) => ((a.manualOrder ?? Number.MAX_SAFE_INTEGER) - (b.manualOrder ?? Number.MAX_SAFE_INTEGER)) || a.label.localeCompare(b.label))
                  return items.map(v => (
                    <ManualInputCard key={v.name} label={v.label} value={getStat(v.name)} statKey={v.name as keyof typeof project.stats} />
                  ))
                })()}
                {/* Totals remain */}
                <div className="calc-row">
                  <div className="value-pill">{totalUnder40}</div>
                  <div className="form-label flex-1">Total Under 40 (calculated)</div>
                </div>
                <div className="calc-row">
                  <div className="value-pill">{totalOver40}</div>
                  <div className="form-label flex-1">Total Over 40 (calculated)</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Merch Section */}
        <div className="glass-card section-card">
          <h2 className="section-title">🛍️ Merch ({totalMerch})</h2>
          <div className="merch-cards-grid mb-4">
            {editMode === 'clicker' ? (
              <>
                {(() => {
                  const items = varsConfig
                    .filter(v => v.category === 'Merchandise' && v.flags?.visibleInClicker && !v.derived && v.type !== 'text' && (['merched','jersey','scarf'].includes(v.name)))
                    .sort((a, b) => ((a.clickerOrder ?? 0) - (b.clickerOrder ?? 0)) || a.label.localeCompare(b.label))
                  return items.map(v => (
                    <StatCard key={v.name} label={v.label} value={getStat(v.name)} statKey={v.name as keyof typeof project.stats} />
                  ))
                })()}
              </>
) : (
              <>
                {(() => {
                  const items = varsConfig
                    .filter(v => v.category === 'Merchandise' && v.flags?.editableInManual && !v.derived && v.type !== 'text')
                    .sort((a, b) => ((a.manualOrder ?? Number.MAX_SAFE_INTEGER) - (b.manualOrder ?? Number.MAX_SAFE_INTEGER)) || a.label.localeCompare(b.label))
                  return items.map(v => (
                    <ManualInputCard key={v.name} label={v.label} value={getStat(v.name)} statKey={v.name as keyof typeof project.stats} />
                  ))
                })()}
              </>
            )}
          </div>
          <div className="merch-cards-grid">
            {editMode === 'clicker' ? (
              <>
                {(() => {
                  const items = varsConfig
                    .filter(v => v.category === 'Merchandise' && v.flags?.visibleInClicker && !v.derived && v.type !== 'text' && (['flags','baseballCap','other'].includes(v.name)))
                    .sort((a, b) => ((a.clickerOrder ?? 0) - (b.clickerOrder ?? 0)) || a.label.localeCompare(b.label))
                  return items.map(v => (
                    <StatCard key={v.name} label={v.label} value={getStat(v.name)} statKey={v.name as keyof typeof project.stats} />
                  ))
                })()}
              </>
) : (
              <>
                {(() => {
                  const items = varsConfig
                    .filter(v => v.category === 'Merchandise' && v.flags?.editableInManual && !v.derived && v.type !== 'text')
                    .sort((a, b) => ((a.manualOrder ?? Number.MAX_SAFE_INTEGER) - (b.manualOrder ?? Number.MAX_SAFE_INTEGER)) || a.label.localeCompare(b.label))
                  return items.map(v => (
                    <ManualInputCard key={v.name} label={v.label} value={getStat(v.name)} statKey={v.name as keyof typeof project.stats} />
                  ))
                })()}
              </>
            )}
          </div>
        </div>

        {/* Success Manager Section - Only show in manual mode */}
        {editMode === 'manual' && (
          <div className="glass-card section-card">
            <h2 className="section-title">📈 Success Manager</h2>
          
          {/* Image Management */}
          <div className="mb-6">
            <h4 className="section-subtitle">Image Management</h4>
            <div className="style-grid">
              {canShowInManual('approvedImages') && <SuccessManagerCard label="Approved Images" value={project.stats.approvedImages || 0} statKey="approvedImages" />}
              {canShowInManual('rejectedImages') && <SuccessManagerCard label="Rejected Images" value={project.stats.rejectedImages || 0} statKey="rejectedImages" />}
            </div>
          </div>

          {/* Visit Tracking */}
          <div className="mb-6">
            <h4 className="section-subtitle">Visit Tracking</h4>
            <div className="style-grid">
              {canShowInManual('visitQrCode') && <SuccessManagerCard label="QR Code Visits" value={project.stats.visitQrCode || 0} statKey="visitQrCode" />}
              {canShowInManual('visitShortUrl') && <SuccessManagerCard label="Short URL Visits" value={project.stats.visitShortUrl || 0} statKey="visitShortUrl" />}
              {canShowInManual('visitWeb') && <SuccessManagerCard label="Web Visits" value={project.stats.visitWeb || 0} statKey="visitWeb" />}
            </div>
          </div>

          {/* eDM (Value Proposition) */}
          <div className="mb-6">
            <h4 className="section-subtitle">eDM</h4>
            <div className="style-grid">
              {canShowInManual('eventValuePropositionVisited') && <SuccessManagerCard label="Value Prop Visited" value={project.stats.eventValuePropositionVisited || 0} statKey="eventValuePropositionVisited" />}
              {canShowInManual('eventValuePropositionPurchases') && <SuccessManagerCard label="Value Prop Purchases" value={project.stats.eventValuePropositionPurchases || 0} statKey="eventValuePropositionPurchases" />}
            </div>
          </div>

          {/* Social Visit (aggregated) */}
          <div className="mb-6">
            <h4 className="section-subtitle">Social Visit</h4>
            <div className="style-grid">
              {canShowInManual('socialVisit') && (() => {
                const sumSocial = (project.stats.visitFacebook || 0) + (project.stats.visitInstagram || 0) + (project.stats.visitYoutube || 0) + (project.stats.visitTiktok || 0) + (project.stats.visitX || 0) + (project.stats.visitTrustpilot || 0);
                const socialVal = project.stats.socialVisit ?? sumSocial;
                return (
                  <SuccessManagerCard label="Total Social Visit" value={socialVal} statKey={"socialVisit" as keyof typeof project.stats} />
                );
              })()}
            </div>
          </div>

          {/* Event Performance */}
          <div className="mb-6">
            <h4 className="section-subtitle">Event Performance</h4>
            <div className="style-grid">
              {canShowInManual('eventAttendees') && <SuccessManagerCard label="Event Attendees" value={project.stats.eventAttendees || 0} statKey="eventAttendees" />}
              {canShowInManual('eventResultHome') && <SuccessManagerCard label="Event Result Home" value={project.stats.eventResultHome || 0} statKey="eventResultHome" />}
              {canShowInManual('eventResultVisitor') && <SuccessManagerCard label="Event Result Visitor" value={project.stats.eventResultVisitor || 0} statKey="eventResultVisitor" />}
            </div>
          </div>
          </div>
        )}
        
        {/* Custom Variables Section (supports newly added variables) */}
        {(() => {
          const customVars = varsConfig.filter(v => v.isCustom && (v.type === 'count' || v.type === 'numeric'))
          if (customVars.length === 0) return null
          const showAny = editMode === 'clicker'
            ? customVars.some(v => v.flags.visibleInClicker)
            : customVars.some(v => v.flags.editableInManual)
          if (!showAny) return null
          return (
            <div className="glass-card section-card">
              <h2 className="section-title">🧩 Custom Variables</h2>
              <div className="stats-cards-row">
                {editMode === 'clicker' ? (
                  <>
                    {customVars.filter(v => v.flags.visibleInClicker).map(v => (
                      <StatCard key={v.name} label={v.label} value={getStat(v.name)} onIncrement={() => incrementDynamic(v.name)} onDecrement={() => decrementDynamic(v.name)} />
                    ))}
                  </>
                ) : (
                  <>
                    {customVars.filter(v => v.flags.editableInManual).map(v => (
                      <ManualInputDynamic key={v.name} label={v.label} keyName={v.name} />
                    ))}
                  </>
                )}
              </div>
            </div>
          )
        })()}
        
        {/* Hashtag Management Section - Move to bottom and only show in manual mode */}
          <div className="glass-card section-card">
            <h2 className="section-title">🏷️ Hashtags ({totalHashtagCount})</h2>
            
            <div className="mb-4">
              <UnifiedHashtagInput
                generalHashtags={hashtags}
                onGeneralChange={handleGeneralHashtagsChange}
                categorizedHashtags={categorizedHashtags}
                onCategorizedChange={handleCategorizedHashtagsChange}
                placeholder="Add hashtags to categorize this project..."
              />
            </div>
            
            {totalHashtagCount === 0 && (
              <div className="empty-state">
                <p className="empty-state-text">💡 Add hashtags to categorize your project and enable aggregated statistics!</p>
              </div>
            )}
          </div>
          </>
        )}
      </div>
    </div>
  );
}
