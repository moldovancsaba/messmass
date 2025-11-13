'use client';

import React, { useState, useEffect } from 'react';
import ColoredCard from './ColoredCard';
import { evaluateFormula } from '@/lib/formulaEngine';
import ColoredHashtagBubble from './ColoredHashtagBubble';
import UnifiedHashtagInput from './UnifiedHashtagInput';
import ImageUploadField from './ImageUploadField';
import ImageUploader from './ImageUploader';
import TextareaField from './TextareaField';
import ReportContentManager from './ReportContentManager';
import BuilderMode from './BuilderMode';
import { 
  mergeHashtagSystems, 
  getAllHashtagRepresentations,
  expandHashtagsWithCategories 
} from '@/lib/hashtagCategoryUtils';
import { apiPut } from '@/lib/apiClient';

// WHAT: Variable config type loaded from /api/variables-config to control Editor UI visibility.
// WHY: Admin decides which variables appear in clicker vs. manual; we respect flags at render-time.
interface VariableWithFlags {
  name: string;
  label: string;
  type: 'count' | 'numeric' | 'currency' | 'percentage' | 'boolean' | 'date' | 'text' | 'textarea' | 'texthyper' | 'textmedia';
  category: string;
  derived?: boolean;
  flags: { visibleInClicker: boolean; editableInManual: boolean };
  isCustom?: boolean;
  clickerOrder?: number;
  manualOrder?: number;
  linkedContentAsset?: string; // Content Library slug for media variables
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
    // WHAT: Allow any additional field (string or number) for dynamic variables
    // WHY: Partner report text (reportText*) and images (reportImage*) store strings
    // HOW: Index signature allows flexible stats structure managed by variables_metadata
    [key: string]: number | string | undefined;
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
  const [editMode, setEditMode] = useState<'clicker' | 'manual' | 'builder'>('clicker'); // Edit mode: clicker, manual, or builder

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
          console.log('✅ Loaded variables:', data.variables.length, 'variables');
          console.log('Sample variable names:', data.variables.slice(0, 5).map((v: any) => v.name));
          setVarsConfig(data.variables);
        } else {
          console.warn('⚠️ Failed to load variables:', data);
        }
      } catch (e) {
        console.error('❌ Failed to load variables-config', e);
      } finally {
        setVarsLoading(false);
      }
    })();
    return () => { mounted = false };
  }, []);

  // WHAT: Auto-save function with CSRF token support
  // WHY: Persist stats changes to database immediately after user action
  // HOW: Use apiPut() which automatically includes CSRF token in request headers
  const saveProject = async (
    updatedStats?: typeof project.stats, 
    updatedHashtags?: string[], 
    updatedCategorizedHashtags?: { [categoryName: string]: string[] }
  ) => {
    setSaveStatus('saving');
    try {
      // WHAT: Use apiPut() instead of raw fetch() for CSRF token handling
      // WHY: Production middleware requires X-CSRF-Token header for all PUT requests
      const result = await apiPut('/api/projects', {
        projectId: project._id,
        eventName: project.eventName,
        eventDate: project.eventDate,
        hashtags: updatedHashtags !== undefined ? updatedHashtags : hashtags,
        categorizedHashtags: updatedCategorizedHashtags !== undefined ? updatedCategorizedHashtags : categorizedHashtags,
        stats: updatedStats || project.stats
      });

      // WHAT: Handle successful save response
      // WHY: Provide user feedback that changes were persisted
      if (result.success) {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        console.error('Save failed:', result.error || 'Unknown error');
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch (error) {
      // WHAT: Handle network or CSRF token errors
      // WHY: Show error state to user if save fails
      console.error('Failed to save project:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // WHAT: Increment/Decrement functions for click-to-increment cards
  // WHY: Only works with numeric stats, not text/image fields
  // HOW: Ensure currentValue is number before arithmetic operations
  const incrementStat = (key: keyof typeof project.stats) => {
    const rawValue = project.stats[key];
    const currentValue = typeof rawValue === 'number' ? rawValue : 0;
    const newStats = {
      ...project.stats,
      [key]: currentValue + 1
    };
    setProject(prev => ({ ...prev, stats: newStats }));
    saveProject(newStats);
  };

  const decrementStat = (key: keyof typeof project.stats) => {
    const rawValue = project.stats[key];
    const currentValue = typeof rawValue === 'number' ? rawValue : 0;
    if (currentValue > 0) {
      const newStats = {
        ...project.stats,
        [key]: currentValue - 1
      };
      setProject(prev => ({ ...prev, stats: newStats }));
      saveProject(newStats);
    }
  };

  // WHAT: Dynamic accessors for variables - handle both 'female' and 'stats.female' formats
  // WHY: Variables in database use stats. prefix for Single Reference System
  // HOW: Strip 'stats.' prefix when accessing project.stats object
  const normalizeKey = (key: string): string => {
    // WHAT: Remove 'stats.' prefix if present
    // WHY: MongoDB stores as { stats: { female: 120 } }, not { stats: { stats.female: 120 } }
    return key.startsWith('stats.') ? key.slice(6) : key;
  };
  
  const getStat = (key: string): number => {
    const normalized = normalizeKey(key);
    const raw = (project.stats as any)[normalized];
    return typeof raw === 'number' ? raw : 0;
  };
  
  const setStat = (key: string, value: number) => {
    const normalized = normalizeKey(key);
    const newStats: any = { ...project.stats, [normalized]: Math.max(0, value) };
    setProject(prev => ({ ...prev, stats: newStats }));
    saveProject(newStats);
  };
  
  // WHAT: Save text field (for reportText* variables)
  // WHY: Partner report text notes need to be persisted as strings
  // HOW: Store text directly in project.stats without type coercion
  const saveTextField = (key: string, value: string) => {
    const normalized = normalizeKey(key);
    const newStats: any = { ...project.stats, [normalized]: value };
    setProject(prev => ({ ...prev, stats: newStats }));
    saveProject(newStats);
  };
  
  // WHAT: Save image URL (for reportImage* variables)
  // WHY: Uploaded images return ImgBB URLs that need to be stored
  // HOW: Store URL string in project.stats
  const saveImageUrl = (key: string, url: string) => {
    const normalized = normalizeKey(key);
    const newStats: any = { ...project.stats, [normalized]: url };
    setProject(prev => ({ ...prev, stats: newStats }));
    saveProject(newStats);
  };
  
  // WHAT: Get text or image URL from stats
  // WHY: Text and image fields store strings, not numbers
  // HOW: Return empty string if undefined
  const getTextField = (key: string): string => {
    const normalized = normalizeKey(key);
    const raw = (project.stats as any)[normalized];
    return typeof raw === 'string' ? raw : '';
  };
  
  const incrementDynamic = (key: string) => setStat(key, getStat(key) + 1);
  const decrementDynamic = (key: string) => setStat(key, Math.max(0, getStat(key) - 1));

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
  const [groups, setGroups] = useState<{ groupOrder: number; chartId?: string; titleOverride?: string; variables: string[]; visibleInClicker?: boolean; visibleInManual?: boolean }[]>([])
  const [charts, setCharts] = useState<any[]>([])

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/variables-groups', { cache: 'no-store' })
        const data = await res.json()
        if (data?.success && Array.isArray(data.groups)) {
          console.log('✅ Loaded groups:', data.groups.length, 'groups');
          if (data.groups.length > 0) {
            console.log('Sample group variables:', data.groups[0].variables?.slice(0, 5));
          }
          // WHAT: Store all groups (filtering happens in render based on edit mode)
          // WHY: Groups have visibleInClicker and visibleInManual flags
          setGroups(data.groups)
        } else {
          console.warn('⚠️ No groups found or failed to load');
        }
      } catch (e) {
        console.error('❌ Failed to load groups:', e);
      }
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
          className="btn btn-small btn-danger stat-decrement"
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
      <div className="admin-header">
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
              {/* Mode Toggle Button - cycles through 3 modes */}
              <button
                onClick={() => {
                  if (editMode === 'clicker') setEditMode('manual');
                  else if (editMode === 'manual') setEditMode('builder');
                  else setEditMode('clicker');
                }}
                className={`btn btn-small ${
                  editMode === 'clicker' ? 'btn-primary' :
                  editMode === 'manual' ? 'btn-success' :
                  'btn-warning'
                } btn-full mt-2`}
              >
                {editMode === 'clicker' && '🖱️ Clicker'}
                {editMode === 'manual' && '✏️ Manual'}
                {editMode === 'builder' && '🏗️ Builder'}
              </button>
              
              {/* Save Button - visible for Manual & Builder modes */}
              {(editMode === 'manual' || editMode === 'builder') && (
                <button
                  onClick={() => {
                    // Manual save trigger (stats already saved via auto-save on blur)
                    saveProject(project.stats);
                  }}
                  disabled={saveStatus === 'saving'}
                  className="btn btn-small btn-primary btn-full mt-2"
                >
                  {saveStatus === 'saving' ? '💾 Saving...' : '💾 Save'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="content-grid">
        {/* WHAT: Switch rendering based on edit mode */}
        {/* WHY: Builder mode shows report template layout, Clicker/Manual show variable groups */}
        {editMode === 'builder' ? (
          <BuilderMode 
            projectId={project._id as string} 
            stats={project.stats as any}
            onSave={(newStats) => {
              setProject(prev => ({ ...prev, stats: newStats as any }));
              saveProject(newStats as any);
            }}
          />
        ) : (
          // Clicker & Manual modes: Groups-driven rendering
          <>
        {groups
          .filter(g => {
            // WHAT: Filter groups by visibility flags based on current edit mode
            // WHY: Admin controls which groups appear in clicker vs manual mode
            // HOW: Check visibleInClicker for clicker mode, visibleInManual for manual mode
            // Default to true if flags are undefined (backward compatibility)
            if (editMode === 'clicker') {
              return g.visibleInClicker !== false;
            } else {
              return g.visibleInManual !== false;
            }
          })
          .sort((a,b)=>a.groupOrder-b.groupOrder)
          .map((g, idx) => {
          const chart = chartById(g.chartId)
          const kpi = computeKpiValue(chart)
          const title = g.chartId && chart ? chart.title : (g.titleOverride || undefined)
          
          // WHAT: Flexible variable lookup - handle both 'female' and 'stats.female' formats
          // WHY: Groups may have old names (female) but varsConfig has new names (stats.female)
          // HOW: Try exact match first, then try with stats. prefix, then try without prefix
          const items = g.variables
            .map(name => {
              // Try exact match
              let found = varsConfig.find(v => v.name === name);
              if (found) return found;
              
              // Try adding stats. prefix
              found = varsConfig.find(v => v.name === `stats.${name}`);
              if (found) return found;
              
              // Try removing stats. prefix
              const withoutStats = name.startsWith('stats.') ? name.slice(6) : null;
              if (withoutStats) {
                found = varsConfig.find(v => v.name === withoutStats);
                if (found) return found;
              }
              
              return null;
            })
            .filter((v): v is VariableWithFlags => !!v && !v.derived && !!v.flags)
          const filtered = editMode === 'clicker'
            ? items.filter(v => v.flags?.visibleInClicker)
            : items.filter(v => v.flags?.editableInManual)
          // WHAT: Hide group block if no variables are visible in current mode
          // WHY: Prevents empty "Success Manager" or other titled blocks from appearing
          if (filtered.length === 0) return null
          return (
            <ColoredCard key={idx}>
              {title && (
                <h2 className="section-title">
                  {title} {kpi !== 'NA' ? <span className="value-pill" style={{ marginLeft: 8 }}>{kpi}</span> : null}
                </h2>
              )}
              <div className="stats-cards-row">
                {filtered.map(v => {
                  // WHAT: Normalize variable key (strip stats. prefix)
                  // WHY: Variables are stored as stats.female but MongoDB structure is { stats: { female: 120 } }
                  const normalizedName = normalizeKey(v.name);
                  const isRemoteFans = normalizedName === 'remoteFans' || v.name === 'remoteFans';
                  
                  // WHAT: Render based on variable type (new type system)
                  // WHY: Each type has specific UI requirements
                  
                  // WHAT: textarea - Multi-line text content
                  if (v.type === 'textarea') {
                    return (
                      <TextareaField
                        key={v.name}
                        label={v.label}
                        value={getTextField(v.name)}
                        onSave={(text) => saveTextField(v.name, text)}
                        rows={4}
                      />
                    );
                  }
                  
                  // WHAT: textmedia - Image upload to ImgBB
                  if (v.type === 'textmedia') {
                    return (
                      <ImageUploader
                        key={v.name}
                        label={v.label}
                        value={getTextField(v.name)}
                        onChange={(url) => saveImageUrl(v.name, url || '')}
                        maxSizeMB={10}
                      />
                    );
                  }
                  
                  // WHAT: texthyper - URL, email, phone (single line with validation hint)
                  if (v.type === 'texthyper') {
                    return (
                      <div key={v.name} className="form-group">
                        <label className="form-label-block">{v.label}</label>
                        <input
                          type="text"
                          className="form-input"
                          value={getTextField(v.name)}
                          onChange={(e) => saveTextField(v.name, e.target.value)}
                          placeholder="URL, email, phone, or social handle"
                        />
                      </div>
                    );
                  }
                  
                  // WHAT: text - Single line text (title, name, short notes)
                  if (v.type === 'text') {
                    return (
                      <div key={v.name} className="form-group">
                        <label className="form-label-block">{v.label}</label>
                        <input
                          type="text"
                          className="form-input"
                          value={getTextField(v.name)}
                          onChange={(e) => saveTextField(v.name, e.target.value)}
                        />
                      </div>
                    );
                  }
                  
                  return editMode === 'clicker' ? (
                    isRemoteFans ? (
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
                      <StatCard key={v.name} label={v.label} value={getStat(v.name)} statKey={normalizedName as keyof typeof project.stats} />
                    )
                  ) : (
                    isRemoteFans ? (
                      <ManualInputCard key={v.name} label={v.label} value={(project.stats as any).remoteFans ?? (project.stats.indoor + project.stats.outdoor)} statKey={"remoteFans" as keyof typeof project.stats} />
                    ) : (
                      <ManualInputCard key={v.name} label={v.label} value={getStat(v.name)} statKey={normalizedName as keyof typeof project.stats} />
                    )
                  );
                })}
              </div>
            </ColoredCard>
          )
        })}
        {groups.length === 0 && (
          <ColoredCard>
            <h2 className="section-title">No groups configured</h2>
            <p style={{ color: '#6b7280' }}>Go to Admin → KYC Variables to configure variable groups.</p>
            {varsConfig.length > 0 && (
              <p style={{ color: '#10b981', marginTop: '1rem' }}>✅ {varsConfig.length} variables loaded from database</p>
            )}
            {varsConfig.length === 0 && varsLoading && (
              <p style={{ color: '#f59e0b', marginTop: '1rem' }}>⏳ Loading variables...</p>
            )}
          </ColoredCard>
        )}
        
        {/* REMOVED LEGACY SECTIONS */}
        {/* Legacy sections (Images, Fans, Gender, Age, Merch, Success Manager, Hashtags) removed */}
        {/* All variables are now rendered through the groups-driven system configured at /admin/variables */}
        
        {/* Custom Variables Section (supports newly added variables) */}
        {(() => {
          const customVars = varsConfig.filter(v => v.isCustom && (v.type === 'count' || v.type === 'numeric') && !!v.flags)
          if (customVars.length === 0) return null
          const showAny = editMode === 'clicker'
            ? customVars.some(v => v.flags?.visibleInClicker)
            : customVars.some(v => v.flags?.editableInManual)
          if (!showAny) return null
          return (
            <ColoredCard>
              <h2 className="section-title">🧩 Custom Variables</h2>
              <div className="stats-cards-row">
                {editMode === 'clicker' ? (
                  <>
                    {customVars.filter(v => v.flags?.visibleInClicker).map(v => (
                      <StatCard key={v.name} label={v.label} value={getStat(v.name)} onIncrement={() => incrementDynamic(v.name)} onDecrement={() => decrementDynamic(v.name)} />
                    ))}
                  </>
                ) : (
                  <>
                    {customVars.filter(v => v.flags?.editableInManual).map(v => (
                      <ManualInputDynamic key={v.name} label={v.label} keyName={v.name} />
                    ))}
                  </>
                )}
              </div>
            </ColoredCard>
          )
        })()}
        
        {/* Hashtag Management Section - REMOVED per user request */}
        {/* Hashtags are now managed elsewhere in the system */}
        {/* Bitly Links Management Section - MOVED to Edit Project modal in admin/projects */}

        {/* Report Content Manager (Images + Texts) - VISIBLE IN CLICKER & MANUAL MODES */}
        {/* WHAT: Upload images and texts that auto-generate chart blocks for reports */}
        {/* WHY: Content uploaded here becomes immediately available in Visualization editor */}
        {(editMode === 'clicker' || editMode === 'manual') && (
          <ColoredCard>
            <h2 className="section-title">📦 Report Content</h2>
            {/* WHAT: Centralized management for reportImageN / reportTextN slots
                WHY: Bulk upload images to ImgBB and bulk add/edit texts with stable slot references
                HOW: Uses existing /api/upload-image endpoint and EditorDashboard.saveProject */}
            <ReportContentManager
              stats={project.stats as any}
              onCommit={(newStats) => {
                setProject(prev => ({ ...prev, stats: newStats as any }));
                saveProject(newStats as any);
              }}
            />
          </ColoredCard>
        )}
        </>
        )}
      </div>
    </div>
  );
}
