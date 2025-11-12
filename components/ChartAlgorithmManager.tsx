'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import UnifiedAdminHeroWithSearch from './UnifiedAdminHeroWithSearch';
import ColoredCard from './ColoredCard';
import FormModal from './modals/FormModal';
import MaterialIcon from './MaterialIcon';
import { getIconForEmoji } from '@/lib/iconMapping';
import { ChartConfiguration, type AvailableVariable } from '@/lib/chartConfigTypes';
import { validateFormula, testFormula, extractVariablesFromFormula } from '@/lib/formulaEngine';
import { calculateChart, formatChartValue } from '@/lib/chartCalculator';
import PredictiveFormattingInput from './PredictiveFormattingInput';
import SaveStatusIndicator, { SaveStatus } from './SaveStatusIndicator';
import styles from './ChartAlgorithmManager.module.css';

/**
 * DYNAMIC VARIABLE SYSTEM - KYC as Single Source of Truth
 * 
 * WHAT: Fetch all 92 variables from KYC /api/variables-config
 * WHY: Chart configurator must show ALL variables, not hardcoded 37
 * HOW: Load on component mount, cache for session
 */

// Props type for the Chart Algorithm Manager component
interface ChartAlgorithmManagerProps {
  user: { name: string; role: string } | null;
}

// Interface for chart configuration form data
interface ChartConfigFormData {
  _id?: string;
  chartId: string;
  title: string;
  type: 'pie' | 'bar' | 'kpi' | 'text' | 'image';
  order: number;
  isActive: boolean;
  elements: {
    id: string;
    label: string;
    formula: string;
    color: string;
    description?: string;
    formatting?: { rounded: boolean; prefix?: string; suffix?: string; }; // WHAT: New flexible formatting
  }[];
  icon?: string; // WHAT: Material Icon name (v10.4.0)
  iconVariant?: 'outlined' | 'rounded'; // WHAT: Icon variant (v10.4.0)
  emoji?: string; // DEPRECATED: Legacy field for backward compatibility
  subtitle?: string;
  showTotal?: boolean;
  totalLabel?: string;
  aspectRatio?: '16:9' | '9:16' | '1:1'; // WHAT: Image aspect ratio (v9.3.0) for automatic grid width calculation
}

// Sample project stats for testing formulas
const SAMPLE_STATS = {
  remoteImages: 10, hostessImages: 25, selfies: 15,
  indoor: 50, outdoor: 30, stadium: 200,
  female: 120, male: 160,
  genAlpha: 20, genYZ: 100, genX: 80, boomer: 80,
  merched: 40, jersey: 15, scarf: 8, flags: 12, baseballCap: 5, other: 3,
  approvedImages: 45, rejectedImages: 5,
  visitQrCode: 30, visitShortUrl: 20, visitWeb: 100,
  visitFacebook: 25, visitInstagram: 40, visitYoutube: 15,
  visitTiktok: 35, visitX: 10, visitTrustpilot: 5,
  eventAttendees: 1000, eventTicketPurchases: 850,
  eventResultHome: 2, eventResultVisitor: 1,
  eventValuePropositionVisited: 75, eventValuePropositionPurchases: 12
};

export default function ChartAlgorithmManager({ user }: ChartAlgorithmManagerProps) {
  const [configurations, setConfigurations] = useState<ChartConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ChartConfigFormData | null>(null);
  
  // WHAT: Server-side pagination state
  // WHY: Consistent pattern with Projects, Hashtags, and Categories pages
  const [totalMatched, setTotalMatched] = useState(0);
  const [nextOffset, setNextOffset] = useState<number | null>(0);
  const PAGE_SIZE = 20;
  
  // WHAT: Search and sort state
  // WHY: Server-side search and sort for performance
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [sortField, setSortField] = useState<'title' | 'type' | 'order'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // WHAT: Dynamic variable state from KYC system
  // WHY: Replace hardcoded AVAILABLE_VARIABLES with live data
  const [availableVariables, setAvailableVariables] = useState<AvailableVariable[]>([]);
  const [variablesLoading, setVariablesLoading] = useState(true);
  
  // Load variables on mount
  useEffect(() => {
    loadVariablesFromKYC();
  }, []);
  
  // WHAT: Debounce search term to avoid excessive API calls
  // WHY: Wait 300ms after user stops typing before triggering search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);
  
  // WHAT: Load first page when search or sort changes
  // WHY: Server-side search/sort requires fresh query
  useEffect(() => {
    if (debouncedTerm || sortField || sortOrder) {
      loadSearch();
    } else {
      loadInitialData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm, sortField, sortOrder]);
  
  // WHAT: Fetch all variables from KYC system
  // WHY: Chart configurator needs access to all 92 variables
  // HOW: Call /api/variables-config once on mount
  const loadVariablesFromKYC = async () => {
    try {
      console.log('📊 Loading variables from KYC...');
      const response = await fetch('/api/variables-config', { cache: 'no-store' });
      const data = await response.json();
      
      if (data.success && Array.isArray(data.variables)) {
        console.log(`✅ Loaded ${data.variables.length} variables from KYC`);
        setAvailableVariables(data.variables);
      } else {
        console.error('❌ Failed to load variables from KYC:', data.error);
        setAvailableVariables([]);
      }
    } catch (error) {
      console.error('❌ Error loading variables from KYC:', error);
      setAvailableVariables([]);
    } finally {
      setVariablesLoading(false);
    }
  };

  // WHAT: Load initial page of charts (first mount only)
  // WHY: Shows full loading screen on initial page load
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setConfigurations([]);

      const params = new URLSearchParams();
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', '0');
      params.set('sortField', sortField);
      params.set('sortOrder', sortOrder);

      const response = await fetch(`/api/chart-config?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Loaded ${data.configurations.length} of ${data.pagination?.totalMatched || 0} chart configurations`);
        setConfigurations(data.configurations || []);
        setTotalMatched(data.pagination?.totalMatched || 0);
        setNextOffset(data.pagination?.nextOffset ?? null);
      } else {
        console.error('❌ Failed to load configurations:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  // WHAT: Load charts during search/sort (no full loading screen)
  // WHY: Prevents white flash reload effect during search
  const loadSearch = async () => {
    try {
      setIsSearching(true);
      setConfigurations([]);

      const params = new URLSearchParams();
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', '0');
      params.set('sortField', sortField);
      params.set('sortOrder', sortOrder);
      
      if (debouncedTerm) {
        params.set('search', debouncedTerm);
      }

      const response = await fetch(`/api/chart-config?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Loaded ${data.configurations.length} of ${data.pagination?.totalMatched || 0} chart configurations (search: "${debouncedTerm}")`);
        setConfigurations(data.configurations || []);
        setTotalMatched(data.pagination?.totalMatched || 0);
        setNextOffset(data.pagination?.nextOffset ?? null);
      } else {
        console.error('❌ Failed to load configurations:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading configurations:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // WHAT: Load more charts (pagination)
  // WHY: "Load 20 more" button functionality
  const loadMore = async () => {
    if (nextOffset === null || loadingMore) return;

    try {
      setLoadingMore(true);

      const params = new URLSearchParams();
      params.set('limit', PAGE_SIZE.toString());
      params.set('offset', nextOffset.toString());
      params.set('sortField', sortField);
      params.set('sortOrder', sortOrder);
      
      if (debouncedTerm) {
        params.set('search', debouncedTerm);
      }

      const response = await fetch(`/api/chart-config?${params.toString()}`);
      const data = await response.json();
      
      if (data.success) {
        setConfigurations(prev => [...prev, ...(data.configurations || [])]);
        setNextOffset(data.pagination?.nextOffset ?? null);
        setTotalMatched(data.pagination?.totalMatched || totalMatched);
      }
    } catch (error) {
      console.error('❌ Failed to load more configurations:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  // WHAT: Update configuration without closing modal (for Update button)
  // WHY: Allow rapid iterative editing with immediate feedback
  const updateConfiguration = async (configData: ChartConfigFormData): Promise<ChartConfigFormData> => {
    const isUpdate = !!configData._id;
    const url = '/api/chart-config';
    const method = isUpdate ? 'PUT' : 'POST';
    
    const body = isUpdate 
      ? { configurationId: configData._id, ...configData }
      : configData;

    console.log(`🔄 Updating chart configuration (modal stays open):`, configData.chartId);
    console.log('📦 aspectRatio BEFORE save:', configData.aspectRatio);
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Chart configuration updated successfully (modal open)`);
      // Reload current view
      if (debouncedTerm || sortField || sortOrder) {
        await loadSearch();
      } else {
        await loadInitialData();
      }
      
      // CRITICAL: Return the updated configuration so Editor can refresh its formData
      console.log('📦 aspectRatio AFTER save (from API):', result.configuration?.aspectRatio);
      return result.configuration;
    } else {
      throw new Error(result.error || 'Failed to update configuration');
    }
  };
  
  // WHAT: Save configuration and close modal (for Save button)
  // WHY: Traditional workflow - save then close
  const saveConfiguration = async (configData: ChartConfigFormData): Promise<void> => {
    const isUpdate = !!configData._id;
    const url = '/api/chart-config';
    const method = isUpdate ? 'PUT' : 'POST';
    
    const body = isUpdate 
      ? { configurationId: configData._id, ...configData }
      : configData;

    console.log(`${isUpdate ? '🔄 Updating' : '💾 Creating'} chart configuration (then close):`, configData.chartId);
    console.log('📦 aspectRatio:', configData.aspectRatio);
    
    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const result = await response.json();
    
    if (result.success) {
      console.log(`✅ Chart configuration ${isUpdate ? 'updated' : 'created'} successfully`);
      // Reload current view
      if (debouncedTerm || sortField || sortOrder) {
        await loadSearch();
      } else {
        await loadInitialData();
      }
      setShowEditor(false); // Close modal
      setEditingConfig(null);
    } else {
      throw new Error(result.error || 'Failed to save configuration');
    }
  };

  const deleteConfiguration = async (configId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete the "${title}" chart configuration?`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting chart configuration:', configId);
      
      const response = await fetch(`/api/chart-config?configurationId=${configId}`, {
        method: 'DELETE'
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Chart configuration deleted successfully');
        // Reload current view
        if (debouncedTerm || sortField || sortOrder) {
          await loadSearch();
        } else {
          await loadInitialData();
        }
      } else {
        alert(`Failed to delete configuration: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error deleting configuration:', error);
      alert('Failed to delete configuration. Please try again.');
    }
  };

  const toggleConfigurationActive = async (config: ChartConfiguration) => {
    try {
      const response = await fetch('/api/chart-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configurationId: config._id,
          isActive: !config.isActive
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Reload current view
        if (debouncedTerm || sortField || sortOrder) {
          await loadSearch();
        } else {
          await loadInitialData();
        }
      }
    } catch (error) {
      console.error('❌ Error toggling configuration:', error);
    }
  };

  const moveConfiguration = async (configId: string, direction: 'up' | 'down') => {
    const currentIndex = configurations.findIndex(c => c._id === configId);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= configurations.length) return;

    // Swap order values
    const currentConfig = configurations[currentIndex];
    const targetConfig = configurations[targetIndex];
    
    try {
      await Promise.all([
        fetch('/api/chart-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            configurationId: currentConfig._id,
            order: targetConfig.order
          })
        }),
        fetch('/api/chart-config', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            configurationId: targetConfig._id,
            order: currentConfig.order
          })
        })
      ]);
      
      // Reload current view
      if (debouncedTerm || sortField || sortOrder) {
        await loadSearch();
      } else {
        await loadInitialData();
      }
    } catch (error) {
      console.error('❌ Error reordering configurations:', error);
    }
  };

  const startEditing = (config?: ChartConfiguration) => {
    if (config) {
      // WHAT: Edit existing configuration - include ALL formatting fields
      // WHY: element.formatting must be editable
      setEditingConfig({
        _id: config._id,
        chartId: config.chartId,
        title: config.title,
        type: config.type,
        order: config.order,
        isActive: config.isActive,
        elements: config.elements,
        icon: config.icon, // v10.4.0: Material Icon name
        iconVariant: config.iconVariant, // v10.4.0: Icon variant
        emoji: config.emoji,
        subtitle: config.subtitle,
        showTotal: config.showTotal,
        totalLabel: config.totalLabel,
        aspectRatio: config.aspectRatio // v9.3.0: Image aspect ratio
      });
    } else {
      // Create new configuration with proper element count based on type
      const nextOrder = Math.max(...configurations.map(c => c.order), 0) + 1;
      setEditingConfig({
        chartId: '',
        title: '',
        type: 'kpi',
        order: nextOrder,
        isActive: true,
        elements: [
          { id: 'element1', label: '', formula: '', color: '#10b981', description: '' }
        ],
        icon: '', // v10.4.0: Material Icon name (default empty)
        iconVariant: 'outlined', // v10.4.0: Icon variant (default outlined)
        emoji: '📊',
        showTotal: false,
        totalLabel: '',
        aspectRatio: '16:9' // WHAT: Default aspect ratio for image charts (v9.3.0); WHY: Ensures new image charts have correct display ratio
      });
    }
    setShowEditor(true);
  };


  const testConfigurationFormula = (formula: string) => {
    // SAFETY: formula might be undefined/null from legacy configs → coerce to string before .trim()
    if (!formula || !String(formula).trim()) return null;
    
    const validation = validateFormula(String(formula));
    if (!validation.isValid) {
      return { error: validation.error, result: null };
    }
    
    const test = testFormula(formula);
    return { error: null, result: test.result };
  };

  // WHAT: Validate all formulas across all chart configurations
  // WHY: Allow admins to check all charts at once for errors/warnings
  const validateAllFormulas = () => {
    let totalFormulas = 0;
    let validFormulas = 0;
    let errorCount = 0;
    let warningCount = 0;
    const errors: string[] = [];

    configurations.forEach(config => {
      config.elements.forEach((element, idx) => {
        totalFormulas++;
        const result = validateFormula(element.formula);
        
        if (result.isValid) {
          validFormulas++;
        } else {
          errorCount++;
          errors.push(`${config.title} - Element ${idx + 1} (${element.label}): ${result.error}`);
        }
        
        // Check for deprecation warnings
        const usedVariables = extractVariablesFromFormula(element.formula);
        usedVariables.forEach(variable => {
          const normalized = variable.replace(/_/g, '');
          if (!normalized.startsWith('SEYU')) {
            warningCount++;
          }
        });
      });
    });

    const summary = `
Validation Complete:
- Total Formulas: ${totalFormulas}
- Valid: ${validFormulas}
- Errors: ${errorCount}
- Warnings: ${warningCount}
${errors.length > 0 ? '\n\nErrors:\n' + errors.join('\n') : '\n✅ All formulas are valid!'}`;

    alert(summary);
  };


  // WHAT: Server-side search/sort means configurations are already filtered
  // WHY: No need for client-side filtering
  
  // WHAT: Toggle sort field and order
  // WHY: Click column header to sort (server-side)
  const handleSort = (field: 'title' | 'type' | 'order') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };
  
  if (loading) {
    return (
      <ColoredCard>
        <div className="loading-spinner">Loading chart configurations...</div>
      </ColoredCard>
    );
  }

  return (
    <div className="chart-algorithm-manager">
      {/* WHAT: UnifiedAdminHeroWithSearch for responsive design
          WHY: Match Events management style with mobile responsiveness */}
      <UnifiedAdminHeroWithSearch 
        title="📊 Chart Algorithm Manager"
        subtitle="Configure chart algorithms, data processing & visualization settings"
        backLink="/admin"
        showSearch
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search charts by title, ID, or type..."
        actionButtons={[
          { label: 'New Chart', onClick: () => startEditing(), variant: 'primary', icon: '➕' },
          { label: 'Refresh Variables', onClick: async () => { 
            await fetch('/api/variables-config?action=invalidateCache', { method: 'PUT' });
            await loadVariablesFromKYC();
          }, variant: 'info', icon: '🔄', disabled: variablesLoading },
          { label: 'Validate All', onClick: () => validateAllFormulas(), variant: 'secondary' },
        ]}
      />


      {/* Chart Configurations List */}
      <div className="projects-table-container">
        <div className="table-overflow-hidden">
          <table className="projects-table table-full-width table-inherit-radius">
            <thead>
              <tr>
                <th onClick={() => handleSort('title')} className="sortable-th">
                  Title
                  {sortField === 'title' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th onClick={() => handleSort('type')} className="sortable-th">
                  Type
                  {sortField === 'type' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th>
                  Status
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configurations.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📊</div>
                    <div className={styles.emptyTitle}>
                      {debouncedTerm ? 'No charts match your search' : 'No Chart Configurations Found'}
                    </div>
                    <div className={styles.emptyDescription}>
                      {debouncedTerm ? 'Try adjusting your search terms' : 'Create your first chart configuration to get started.'}
                    </div>
                  </td>
                </tr>
              ) : (
                configurations.map((config, index) => (
                  <tr key={config._id}>
                    <td>
                      <div className={styles.chartTitleCell}>
                        {/* WHAT: Display Material Icon with fallback to emoji (v10.4.0) */}
                        {(config.icon || config.emoji) && (
                          <span className={styles.chartEmoji}>
                            <MaterialIcon
                              name={config.icon || (config.emoji ? getIconForEmoji(config.emoji) : 'analytics')}
                              variant={(config as any).iconVariant || 'outlined'}
                              style={{ fontSize: '1.5rem' }}
                            />
                          </span>
                        )}
                        <strong>{config.title}</strong>
                        <br />
                        <small className={styles.chartId}>ID: {config.chartId}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`${styles.chartTypeBadge} ${styles[config.type]}`}>
                        {config.type === 'pie' ? '🥧 Pie' : 
                         config.type === 'bar' ? '📊 Bar' : 
                         config.type === 'kpi' ? '📈 KPI' :
                         config.type === 'text' ? '📝 Text' :
                         config.type === 'image' ? '🖼️ Image' : config.type}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`btn btn-small ${config.isActive ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => toggleConfigurationActive(config)}
                      >
                        {config.isActive ? '✅ Active' : '❌ Inactive'}
                      </button>
                    </td>
                    <td className="actions-cell">
                      {/* WHAT: All action buttons vertically stacked using centralized container
                       * WHY: Consistent with all other admin pages - buttons on right, stacked vertically */}
                      <div className="action-buttons-container">
                        <button 
                          className="btn btn-small btn-primary action-button"
                          onClick={() => startEditing(config)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn btn-small btn-danger action-button"
                          onClick={() => deleteConfiguration(config._id!, config.title)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WHAT: Load More button for pagination
          WHY: Matches Projects, Hashtags, and Categories pages */}
      {!loading && !isSearching && nextOffset !== null && configurations.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 'var(--mm-space-6)', marginBottom: 'var(--mm-space-6)' }}>
          <button
            className="btn btn-secondary"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : `Load 20 more (${totalMatched - configurations.length} remaining)`}
          </button>
        </div>
      )}

      {/* WHAT: Pagination stats
          WHY: Show current results vs total matched */}
      {!loading && !isSearching && configurations.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--mm-gray-500)', fontSize: '0.875rem', marginBottom: 'var(--mm-space-4)' }}>
          Showing {configurations.length} of {totalMatched} chart configurations
        </div>
      )}

      {/* Chart Configuration Editor Modal */}
      {showEditor && editingConfig && (
        <ChartConfigurationEditor
          config={editingConfig}
          availableVariables={availableVariables}
          onSave={saveConfiguration}
          onUpdate={updateConfiguration}
          onCancel={() => {
            setShowEditor(false);
            setEditingConfig(null);
          }}
        />
      )}
    </div>
  );
}

// Chart Configuration Editor Component (simplified - full implementation would be larger)
interface ChartConfigurationEditorProps {
  config: ChartConfigFormData;
  availableVariables: AvailableVariable[]; // WHAT: Dynamic variables from KYC
  onSave: (config: ChartConfigFormData) => Promise<void>;
  onUpdate: (config: ChartConfigFormData) => Promise<ChartConfigFormData>; // WHAT: Update without closing, returns fresh data
  onCancel: () => void;
}

function ChartConfigurationEditor({ config, availableVariables, onSave, onUpdate, onCancel }: ChartConfigurationEditorProps) {
  const [formData, setFormData] = useState<ChartConfigFormData>(config);
  const [showVariablePicker, setShowVariablePicker] = useState<{ elementIndex: number } | null>(null);
  const [variableSearchTerm, setVariableSearchTerm] = useState('');
  const [selectedVariableCategory, setSelectedVariableCategory] = useState<string>('All');
  const [formulaValidation, setFormulaValidation] = useState<Record<number, { isValid: boolean; error?: string; result?: number | 'NA' }>>({});
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  
  // WHAT: Formatting defaults from database
  // WHY: Predictive dropdowns need available prefix/suffix options
  const [availablePrefixes, setAvailablePrefixes] = useState<string[]>([]);
  const [availableSuffixes, setAvailableSuffixes] = useState<string[]>([]);
  const [formattingDefaults, setFormattingDefaults] = useState<{ rounded: boolean; prefix: string; suffix: string; visible: boolean } | null>(null);
  
  // Load formatting defaults on mount
  useEffect(() => {
    fetch('/api/chart-formatting-defaults')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAvailablePrefixes(data.availablePrefixes || []);
          setAvailableSuffixes(data.availableSuffixes || []);
          setFormattingDefaults(data.defaults || null);
        }
      })
      .catch(err => console.error('Failed to load formatting defaults:', err));
  }, []);
  
  // WHAT: Get the exact required element count for each chart type
  // WHY: Enforce chart type constraints (text/image have 1 element like KPI)
  // HOW: Switch on chart type and return expected element count
  const getRequiredElementCount = (type: 'pie' | 'bar' | 'kpi' | 'text' | 'image'): number => {
    switch (type) {
      case 'kpi': return 1;
      case 'text': return 1; // Text charts display one text variable
      case 'image': return 1; // Image charts display one image URL
      case 'pie': return 2;
      case 'bar': return 5;
      default: return 1;
    }
  };
  
  // WHAT: Shared validation logic used by both handleSave and handleUpdate
  // WHY: DRY principle - avoid duplicating validation code
  const validateForm = (): boolean => {
    if (!formData.chartId || !formData.title) {
      alert('Please fill in Chart ID and Title');
      return false;
    }
    
    const requiredCount = getRequiredElementCount(formData.type);
    if (formData.elements.length !== requiredCount) {
      alert(`${formData.type.toUpperCase()} charts must have exactly ${requiredCount} element${requiredCount !== 1 ? 's' : ''}`);
      return false;
    }
    
    const missingData = formData.elements.find((element) => !String(element.label || '').trim() || !String(element.formula || '').trim());
    if (missingData) {
      alert('Please fill in all element labels and formulas');
      return false;
    }
    
    const invalidFormula = Object.entries(formulaValidation).find(([_, validation]) => !validation.isValid);
    if (invalidFormula) {
      alert('Please fix all formula errors before saving');
      return false;
    }
    
    return true;
  };
  
  // WHAT: Update without closing modal (rapid iteration)
  // WHY: User wants to save and see status without closing
  const handleUpdate = async () => {
    if (!validateForm()) return;
    
    setSaveStatus('saving');
    try {
      const freshData = await onUpdate(formData); // Get fresh data from API
      setSaveStatus('saved');
      
      // CRITICAL: Update formData with fresh data from database
      if (freshData) {
        console.log('🔄 Refreshing form with data from database');
        setFormData(freshData);
      }
      
      setTimeout(() => setSaveStatus('idle'), 2000);
      // NOTE: Modal stays open for continued editing
    } catch (error) {
      console.error('❌ Update failed:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };
  
  // WHAT: Save and close modal
  // WHY: Traditional workflow - save then exit
  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaveStatus('saving');
    try {
      await onSave(formData);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const updateElement = (index: number, field: keyof ChartConfigFormData['elements'][0], value: string) => {
    const newElements = [...formData.elements];
    newElements[index] = { ...newElements[index], [field]: value };
    setFormData({ ...formData, elements: newElements });
    
    // If updating formula, validate it
    if (field === 'formula') {
      validateFormula(index, value);
    }
  };

  const validateFormula = (elementIndex: number, formula: string) => {
    // SAFETY: formula may be undefined/null → coerce to string before .trim()
    if (!formula || !String(formula).trim()) {
      setFormulaValidation(prev => ({ ...prev, [elementIndex]: { isValid: true } }));
      return;
    }
    
    try {
      const testResult = testConfigurationFormula(formula);
      if (testResult?.error) {
        setFormulaValidation(prev => ({ 
          ...prev, 
          [elementIndex]: { isValid: false, error: testResult.error } 
        }));
      } else {
        setFormulaValidation(prev => ({ 
          ...prev, 
          [elementIndex]: { isValid: true, result: testResult?.result as number | 'NA' | undefined } 
        }));
      }
    } catch (error) {
      setFormulaValidation(prev => ({ 
        ...prev, 
        [elementIndex]: { isValid: false, error: 'Invalid formula syntax' } 
      }));
    }
  };

  // WHAT: Filter variables for picker from KYC data
  // WHY: Variable picker must show all 92 variables from KYC
  // HOW: Use availableVariables state instead of hardcoded AVAILABLE_VARIABLES
  const getFilteredVariablesForPicker = () => {
    let filtered = availableVariables;
    
    if (selectedVariableCategory !== 'All') {
      filtered = filtered.filter(variable => variable.category === selectedVariableCategory);
    }
    
    if (variableSearchTerm) {
      const term = variableSearchTerm.toLowerCase();
      filtered = filtered.filter(variable => 
        variable.name.toLowerCase().includes(term) ||
        (variable.label || variable.displayName || '').toLowerCase().includes(term) ||
        (variable.description || '').toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };
  
  const insertVariable = (variableName: string) => {
    if (showVariablePicker) {
      const { elementIndex } = showVariablePicker;
      const currentFormula = formData.elements[elementIndex].formula;
      const newFormula = currentFormula + `[${variableName}]`;
      updateElement(elementIndex, 'formula', newFormula);
      setShowVariablePicker(null);
      setVariableSearchTerm('');
    }
  };
  
  // WHAT: Dynamic category list from KYC variables
  // WHY: Categories include Bitly, SportsDB, etc. not in hardcoded list
  const variableCategories = ['All', ...Array.from(new Set(availableVariables.map(v => v.category)))];
  
  // Test function for formulas (moved to component scope)
  const testConfigurationFormula = (formula: string) => {
    if (!formula || !String(formula).trim()) return null;
    
    // WHAT: Validate formulas with full database paths like [stats.female]
    // WHY: Support Single Reference System with dotted notation
    // HOW: Match [a-zA-Z0-9_.] pattern (letters, numbers, underscores, dots)
    const variablePattern = /\[([a-zA-Z0-9_.]+)\]/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variablePattern.exec(formula)) !== null) {
      variables.push(match[1]);
    }
    
    // WHAT: Check if all variables exist in KYC system
    // WHY: Prevent invalid formulas from being saved
    // NOTE: PARAM: and MANUAL: tokens are always valid (handled separately)
    const invalidVariables = variables.filter(variable => {
      // Skip special tokens
      if (variable.startsWith('PARAM:') || variable.startsWith('MANUAL:')) return false;
      // Check if variable exists in KYC (dynamic from database)
      return !availableVariables.some(v => v.name === variable);
    });
    
    if (invalidVariables.length > 0) {
      return { error: `Unknown variables: ${invalidVariables.join(', ')}`, result: null };
    }
    
    // Simple test calculation with sample data
    try {
      let testFormula = formula;
      // WHAT: Sample data using full database paths (stats.fieldName)
      // WHY: Match Single Reference System format
      const sampleData: Record<string, number> = {
        'stats.female': 120, 'stats.male': 160, 'stats.remoteFans': 80, 'stats.stadium': 200,
        'stats.genAlpha': 20, 'stats.genYZ': 100, 'stats.genX': 80, 'stats.boomer': 80,
        'stats.jersey': 15, 'stats.scarf': 8, 'stats.flags': 12, 'stats.baseballCap': 5, 'stats.other': 3,
        'stats.remoteImages': 10, 'stats.hostessImages': 25, 'stats.selfies': 15,
        'stats.approvedImages': 45, 'stats.rejectedImages': 5, 'stats.merched': 43,
        'stats.eventAttendees': 280, 'stats.allImages': 50, 'stats.totalFans': 280
      };
      
      // Replace variables with sample values
      variables.forEach(variable => {
        const value = sampleData[variable] || 1;
        // Escape dots in variable name for regex
        const escapedVariable = variable.replace(/\./g, '\\.');
        testFormula = testFormula.replace(new RegExp(`\\[${escapedVariable}\\]`, 'g'), value.toString());
      });
      
      // Evaluate the formula safely
      const result = Function('"use strict"; return (' + testFormula + ')')();
      return { error: null, result: typeof result === 'number' ? Math.round(result * 100) / 100 : 'NA' as 'NA' };
    } catch (error) {
      return { error: 'Invalid formula syntax', result: null };
    }
  };

  return (
    <>
      <FormModal
        isOpen={true}
        onClose={onCancel}
        onSubmit={handleSave}
        onUpdate={handleUpdate}
        saveStatus={saveStatus}
        showStatusIndicator={true}
        title={config._id ? 'Edit Chart Configuration' : 'Create Chart Configuration'}
        submitText="Save"
        updateText="Update"
        size="xl"
      >
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Chart ID</label>
              <input
                type="text"
                className="form-input"
                value={formData.chartId}
                onChange={(e) => setFormData({ ...formData, chartId: e.target.value })}
                placeholder="e.g., gender-distribution"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Title</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Gender Distribution"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Type</label>
              <select
                className="form-input"
                value={formData.type}
                onChange={(e) => {
                  const newType = e.target.value as 'pie' | 'bar' | 'kpi' | 'text' | 'image';
                  const requiredCount = getRequiredElementCount(newType);
                  let newElements = [...formData.elements];
                  
                  // Always adjust to exact required element count
                  if (formData.elements.length !== requiredCount) {
                    const elementColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444'];
                    newElements = [];
                    
                    // Create exactly the required number of elements
                    for (let i = 0; i < requiredCount; i++) {
                      newElements.push({
                        id: `element${i + 1}`,
                        label: i < formData.elements.length ? formData.elements[i].label : '',
                        formula: i < formData.elements.length ? formData.elements[i].formula : '',
                        color: elementColors[i] || '#6b7280',
                        description: i < formData.elements.length ? formData.elements[i].description : ''
                      });
                    }
                  }
                  
                  setFormData({ 
                    ...formData, 
                    type: newType, 
                    elements: newElements
                  });
                  // Clear validation when type changes
                  setFormulaValidation({});
                }}
              >
                <option value="kpi">KPI Chart (1 element)</option>
                <option value="text">📝 Text Chart (1 element)</option>
                <option value="image">🖼️ Image Chart (1 element)</option>
                <option value="pie">Pie Chart (2 elements)</option>
                <option value="bar">Bar Chart (5 elements)</option>
              </select>
            </div>

            {/* WHAT: Image Aspect Ratio Selector (v9.3.0) */}
            {/* WHY: Determines grid width automatically from aspect ratio */}
            {/* HOW: Portrait (1 unit), Square (2 units), Landscape (3 units) */}
            {formData.type === 'image' && (
              <div className="form-group">
                <label className="form-label">Image Aspect Ratio *</label>
                <select
                  className="form-input"
                  value={formData.aspectRatio || '16:9'}
                  onChange={(e) => setFormData({ ...formData, aspectRatio: e.target.value as '16:9' | '9:16' | '1:1' })}
                >
                  <option value="16:9">🖼️ Landscape (16:9) → 3 grid units</option>
                  <option value="9:16">📱 Portrait (9:16) → 1 grid unit</option>
                  <option value="1:1">⬜ Square (1:1) → 2 grid units</option>
                </select>
                <small className="form-help">
                  💡 Aspect ratio determines automatic grid width for consistent row heights
                </small>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Order</label>
              <input
                type="number"
                className="form-input"
                value={formData.order}
                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                min="1"
              />
            </div>

          </div>

          {/* WHAT: Display Settings Section (Title/Emoji/Subtitle Visibility) */}
          {/* WHY: Give admins full control over chart header display elements */}
          {/* HOW: Checkbox toggles + conditional input fields (same pattern as prefix/suffix) */}
          <div className="formatting-section">
            <h4 className="formatting-section-title">👁️ Display Settings</h4>
            <div className="formatting-note">Control visibility of chart header elements</div>
            
            <div className="formatting-group">
              <h5 className="formatting-group-title">Chart Header Elements</h5>
              <div className="formatting-controls">
                {/* ROW 1: Show Title + Input Field */}
                <div className="formatting-row">
                  <label className="formatting-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.title !== undefined && formData.title !== ''}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          title: e.target.checked ? (formData.title || formData.chartId) : '' 
                        });
                      }}
                    />
                    <span>Show Title</span>
                  </label>
                  {formData.title !== undefined && formData.title !== '' && (
                    <input
                      type="text"
                      className="form-input"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      placeholder="e.g., Gender Distribution"
                    />
                  )}
                </div>
                
                {/* ROW 2: Icon Field (v10.4.0 Material Icons - Always Visible) */}
                <div className="form-group">
                  <label className="form-label">Icon (Optional)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    {/* WHAT: Live icon preview */}
                    {/* WHY: Users need to see the icon as they type */}
                    {formData.icon && formData.icon.trim() && (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        minWidth: '48px',
                        height: '48px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '0.5rem',
                        background: '#f9fafb'
                      }}>
                        <MaterialIcon
                          name={formData.icon}
                          variant={formData.iconVariant || 'outlined'}
                          style={{ fontSize: '2rem', color: '#374151' }}
                        />
                      </div>
                    )}
                    <input
                      type="text"
                      className="form-input"
                      value={formData.icon || ''}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="analytics, trending_up, star, lightbulb, etc."
                      style={{ flex: 2 }}
                    />
                    <select
                      className="form-input"
                      value={formData.iconVariant || 'outlined'}
                      onChange={(e) => setFormData({ ...formData, iconVariant: e.target.value as 'outlined' | 'rounded' })}
                      style={{ flex: 1 }}
                    >
                      <option value="outlined">Outlined</option>
                      <option value="rounded">Rounded</option>
                    </select>
                  </div>
                  <small className="form-help">
                    💡 Browse icons: <a href="https://fonts.google.com/icons" target="_blank" rel="noopener noreferrer" style={{ color: '#3b82f6', textDecoration: 'underline' }}>fonts.google.com/icons</a>
                  </small>
                </div>
                
                {/* ROW 3: Show Subtitle + Input Field */}
                <div className="formatting-row">
                  <label className="formatting-checkbox">
                    <input
                      type="checkbox"
                      checked={!!formData.subtitle}
                      onChange={(e) => {
                        setFormData({ 
                          ...formData, 
                          subtitle: e.target.checked ? '' : undefined 
                        });
                      }}
                    />
                    <span>Show Subtitle</span>
                  </label>
                  {formData.subtitle !== undefined && (
                    <input
                      type="text"
                      className="form-input"
                      value={formData.subtitle || ''}
                      onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                      placeholder="e.g., Total fans vs attendees (%)"
                    />
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-2">
                💡 Tip: Subtitle appears below the chart title and is useful for explaining KPI metrics.
              </p>
            </div>
          </div>

          {/* WHAT: Element-Level Formatting Controls (ALL chart types) */}
          {/* WHY: All charts need flexible formatting (prefix/suffix/rounding) */}
          {(formData.type === 'kpi' || formData.type === 'pie' || formData.type === 'bar') && (
            <div className="formatting-section">
              <h4 className="formatting-section-title">🎨 Element Formatting</h4>
              <div className="formatting-note">Configure how numbers are displayed in this chart</div>
              
              <div className="formatting-group">
                <h5 className="formatting-group-title">Default Formatting (applies to all elements)</h5>
                <div className="formatting-controls">
                  {/* ROW 1: Rounded */}
                  <div className="formatting-row">
                    <label className="formatting-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.elements[0]?.formatting?.rounded ?? true}
                        onChange={(e) => {
                          const updatedElements = formData.elements.map(el => ({
                            ...el,
                            formatting: {
                              ...el.formatting,
                              rounded: e.target.checked
                            }
                          }));
                          setFormData({ ...formData, elements: updatedElements });
                        }}
                      />
                      <span>Rounded (whole numbers)</span>
                    </label>
                  </div>
                  
                  {/* ROW 2: Show Prefix + Input Field */}
                  <div className="formatting-row">
                    <label className="formatting-checkbox">
                      <input
                        type="checkbox"
                        checked={!!formData.elements[0]?.formatting?.prefix}
                        onChange={(e) => {
                          const updatedElements = formData.elements.map(el => ({
                            ...el,
                            formatting: {
                              ...el.formatting,
                              rounded: el.formatting?.rounded ?? true,
                              prefix: e.target.checked ? (formattingDefaults?.prefix || '€') : '',
                              suffix: el.formatting?.suffix || ''
                            }
                          }));
                          setFormData({ ...formData, elements: updatedElements });
                        }}
                      />
                      <span>Show Prefix</span>
                    </label>
                    {formData.elements[0]?.formatting?.prefix !== undefined && formData.elements[0]?.formatting?.prefix !== '' && (
                      <PredictiveFormattingInput
                        value={formData.elements[0]?.formatting?.prefix || ''}
                        onChange={(value) => {
                          const updatedElements = formData.elements.map(el => ({
                            ...el,
                            formatting: {
                              ...el.formatting,
                              rounded: el.formatting?.rounded ?? true,
                              prefix: value,
                              suffix: el.formatting?.suffix || ''
                            }
                          }));
                          setFormData({ ...formData, elements: updatedElements });
                        }}
                        options={availablePrefixes}
                        placeholder="Select or type prefix"
                        label=""
                      />
                    )}
                  </div>
                  
                  {/* ROW 3: Show Suffix + Input Field */}
                  <div className="formatting-row">
                    <label className="formatting-checkbox">
                      <input
                        type="checkbox"
                        checked={!!formData.elements[0]?.formatting?.suffix}
                        onChange={(e) => {
                          const updatedElements = formData.elements.map(el => ({
                            ...el,
                            formatting: {
                              ...el.formatting,
                              rounded: el.formatting?.rounded ?? true,
                              prefix: el.formatting?.prefix || '',
                              suffix: e.target.checked ? (formattingDefaults?.suffix || '%') : ''
                            }
                          }));
                          setFormData({ ...formData, elements: updatedElements });
                        }}
                      />
                      <span>Show Suffix</span>
                    </label>
                    {formData.elements[0]?.formatting?.suffix !== undefined && formData.elements[0]?.formatting?.suffix !== '' && (
                      <PredictiveFormattingInput
                        value={formData.elements[0]?.formatting?.suffix || ''}
                        onChange={(value) => {
                          const updatedElements = formData.elements.map(el => ({
                            ...el,
                            formatting: {
                              ...el.formatting,
                              rounded: el.formatting?.rounded ?? true,
                              prefix: el.formatting?.prefix || '',
                              suffix: value
                            }
                          }));
                          setFormData({ ...formData, elements: updatedElements });
                        }}
                        options={availableSuffixes}
                        placeholder="Select or type suffix"
                        label=""
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Elements (Required: {getRequiredElementCount(formData.type)})</label>
            {formData.elements.map((element, index) => {
              const validation = formulaValidation[index];
              return (
                <div key={element.id} className="element-editor">
                  <div className="element-header">
                    <strong>Element {index + 1}</strong>
                    <div className="element-header-info">
                      {formData.type === 'kpi' && <span className="chart-type-info">📈 KPI Value</span>}
                      {formData.type === 'text' && <span className="chart-type-info">📝 Text Content</span>}
                      {formData.type === 'image' && <span className="chart-type-info">🖼️ Image URL</span>}
                      {formData.type === 'pie' && <span className="chart-type-info">🥧 {index === 0 ? 'Segment 1' : 'Segment 2'}</span>}
                      {formData.type === 'bar' && <span className="chart-type-info">📊 Bar {index + 1}</span>}
                    </div>
                  </div>
                  
                  <div className="element-fields">
                    <div className="field-group">
                      <label className="field-label">Label</label>
                      <input
                        type="text"
                        placeholder={`Element ${index + 1} label`}
                        value={element.label}
                        onChange={(e) => updateElement(index, 'label', e.target.value)}
                        className="form-input"
                      />
                    </div>
                    
                    <div className="field-group">
                      <label className="field-label">Formula</label>
                      <div className="formula-field-container">
                        <input
                          type="text"
                          placeholder="e.g., [FEMALE] + [MALE]"
                          value={element.formula}
                          onChange={(e) => updateElement(index, 'formula', e.target.value)}
                          className={`form-input formula-input ${
                            validation && !validation.isValid ? 'formula-error' : 
                            validation && validation.isValid && validation.result !== undefined ? 'formula-valid' : ''
                          }`}
                        />
                        <button
                          type="button"
                  className="btn btn-small btn-secondary variable-picker-btn"
                          onClick={() => setShowVariablePicker({ elementIndex: index })}
                          title="Pick variables"
                        >
                          📚
                        </button>
                      </div>
                      {validation && !validation.isValid && (
                        <div className="formula-error-message">
                          ❌ {validation.error}
                        </div>
                      )}
                      {validation && validation.isValid && validation.result !== undefined && (
                        <div className="formula-success-message">
                          ✅ Test result: {validation.result}
                        </div>
                      )}
                    </div>
                    
                    <div className="field-group">
                      <label className="field-label">Color</label>
                      <input
                        type="color"
                        value={element.color}
                        onChange={(e) => updateElement(index, 'color', e.target.value)}
                        className="color-input"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Show constraint info instead of add/remove buttons */}
            <div className="element-constraint-info">
              <div className="constraint-badge">
                {formData.type === 'kpi' && '📈 KPI charts require exactly 1 element'}
                {formData.type === 'text' && '📝 Text charts require exactly 1 element (use [stats.reportText1-10])'}
                {formData.type === 'image' && '🖼️ Image charts require exactly 1 element (use [stats.reportImage1-10])'}
                {formData.type === 'pie' && '🥧 Pie charts require exactly 2 elements'}
                {formData.type === 'bar' && '📊 Bar charts require exactly 5 elements'}
              </div>
              <div className="constraint-note">
                Element count is automatically managed when you change the chart type.
              </div>
            </div>
          </div>
      </FormModal>
      
      {/* WHAT: Variable Picker Modal - uses inline styles for now
       * WHY: Complex nested modal requiring custom styling
       * TODO: Could be migrated to BaseModal in future if needed */}
      {showVariablePicker && (
        <div className="variable-picker-overlay">
          <div className="variable-picker-modal">
            <div className="variable-picker-header">
              <h4>Select Variable for Element {showVariablePicker.elementIndex + 1}</h4>
              <button 
                className="btn btn-small btn-secondary"
                onClick={() => setShowVariablePicker(null)}
              >
                ✕
              </button>
            </div>
            
            <div className="variable-picker-filters">
              <input
                type="text"
                placeholder="Search variables..."
                value={variableSearchTerm}
                onChange={(e) => setVariableSearchTerm(e.target.value)}
                className="form-input"
              />
              <select
                value={selectedVariableCategory}
                onChange={(e) => setSelectedVariableCategory(e.target.value)}
                className="form-input"
              >
                {variableCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
            
            <div className="variable-picker-list">
              {getFilteredVariablesForPicker().map(variable => (
                <div 
                  key={variable.name} 
                  className="variable-picker-item"
                  onClick={() => insertVariable(variable.name)}
                >
                  <div className="variable-picker-item-header">
                    <strong>[{variable.name}]</strong>
                    <span className="variable-picker-category">{variable.category}</span>
                  </div>
                  <div className="variable-picker-item-name">{variable.displayName}</div>
                  <div className="variable-picker-item-description">{variable.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        /* WHAT: CSS-in-JS styles for ChartAlgorithmManager form and Variable Picker
         * WHY: Component-scoped styles for complex chart editor interface
         * NOTE: Main modal uses FormModal component, only Variable Picker uses inline */
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-label {
          color: #374151;
          font-weight: 500;
          margin-bottom: 0.5rem;
          font-size: 0.875rem;
        }

        .form-input {
          padding: 0.75rem;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background: white;
          color: #1f2937;
          font-size: 0.875rem;
        }

        .form-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .element-editor {
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
          background: rgba(249, 250, 251, 0.8);
        }

        .element-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .element-header strong {
          color: #374151;
          font-weight: 600;
        }

        .element-fields {
          display: grid;
          grid-template-columns: 1fr 2fr 60px;
          gap: 0.5rem;
          align-items: center;
        }

        .formula-input {
          font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
          background: #f8fafc;
          border: 1px solid #cbd5e1;
          color: #1e293b;
        }

        .formula-input:focus {
          background: white;
          border-color: #667eea;
        }

        .color-input {
          width: 50px;
          height: 38px;
          border: 1px solid #d1d5db;
          border-radius: 0.25rem;
          cursor: pointer;
        }




        
        .element-header-info {
          display: flex;
          align-items: center;
        }
        
        .chart-type-info {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }
        
        .element-fields {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
        }
        
        .field-group {
          display: flex;
          flex-direction: column;
        }
        
        .field-label {
          color: #6b7280;
          font-size: 0.75rem;
          font-weight: 500;
          margin-bottom: 0.25rem;
          text-transform: uppercase;
        }
        
        .formula-field-container {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }
        
        .formula-field-container input {
          flex: 1;
        }
        
        .variable-picker-btn {
          padding: 0.5rem;
          min-width: 40px;
        }
        
        .formula-error {
          border-color: #ef4444 !important;
          background: rgba(239, 68, 68, 0.05) !important;
        }
        
        .formula-valid {
          border-color: #10b981 !important;
          background: rgba(16, 185, 129, 0.05) !important;
        }
        
        .formula-error-message {
          color: #ef4444;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        
        .formula-success-message {
          color: #10b981;
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        
        /* WHAT: Formatting Section Styles */
        /* WHY: Make formatting controls visually distinct and easy to use */
        .formatting-section {
          background: rgba(249, 250, 251, 0.8);
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          margin-bottom: 2rem;
        }
        
        .formatting-section-title {
          color: #374151;
          font-size: 1.125rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }
        
        .formatting-group {
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }
        
        .formatting-group:last-child {
          margin-bottom: 0;
        }
        
        .formatting-group-title {
          color: #6b7280;
          font-size: 0.875rem;
          font-weight: 600;
          margin: 0 0 0.75rem 0;
          text-transform: uppercase;
        }
        
        .formatting-controls {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        
        .formatting-checkbox {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          min-width: 200px;
        }
        
        .formatting-checkbox input[type="checkbox"] {
          width: 18px;
          height: 18px;
          cursor: pointer;
        }
        
        .formatting-checkbox span {
          color: #374151;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        /* WHAT: Row-by-row layout for formatting controls */
        /* WHY: Each checkbox with its input field on the same row */
        .formatting-row {
          display: flex;
          align-items: center;
          gap: 1rem;
          margin-bottom: 0.75rem;
          flex-wrap: wrap;
        }
        
        .formatting-row:last-child {
          margin-bottom: 0;
        }
        
        .formatting-input-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .formatting-input-group label {
          color: #6b7280;
          font-size: 0.75rem;
          font-weight: 500;
          min-width: 50px;
        }
        
        .formatting-prefix-input,
        .formatting-suffix-input {
          width: 80px;
          padding: 0.5rem;
          font-size: 0.875rem;
        }
        
        /* WHAT: Emoji input field sizing */
        /* WHY: Emoji fields should be compact (max 2 characters) */
        .emoji-input-field {
          max-width: 100px;
          text-align: center;
        }

        .element-constraint-info {
          background: rgba(59, 130, 246, 0.05);
          border: 1px solid rgba(59, 130, 246, 0.2);
          border-radius: 0.5rem;
          padding: 1rem;
          margin-top: 1rem;
        }
        
        .constraint-badge {
          color: #1e40af;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }
        
        .constraint-note {
          color: #6b7280;
          font-size: 0.875rem;
          font-style: italic;
        }
        
        .variable-picker-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 1rem;
        }
        
        .variable-picker-filters input,
        .variable-picker-filters select {
          flex: 1;
        }
        
        .variable-picker-list {
          flex: 1;
          overflow-y: auto;
          display: grid;
          gap: 0.5rem;
        }
        
        .variable-picker-item {
          padding: 0.75rem;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
        }
        
        .variable-picker-item:hover {
          border-color: #667eea;
          background: rgba(102, 126, 234, 0.05);
        }
        
        .variable-picker-item-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.25rem;
        }
        
        .variable-picker-category {
          background: rgba(107, 114, 128, 0.1);
          color: #6b7280;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          font-size: 0.625rem;
          font-weight: 500;
          text-transform: uppercase;
        }
        
        .variable-picker-item-name {
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.25rem;
        }
        
        .variable-picker-item-description {
          font-size: 0.875rem;
          color: #6b7280;
          line-height: 1.4;
        }
      `}</style>
    </>
  );
}
