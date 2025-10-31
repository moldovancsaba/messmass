'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import ColoredCard from './ColoredCard';
import AdminHero from './AdminHero';
import { ChartConfiguration, type AvailableVariable } from '@/lib/chartConfigTypes';
import { validateFormula, testFormula, extractVariablesFromFormula } from '@/lib/formulaEngine';
import { calculateChart, formatChartValue } from '@/lib/chartCalculator';
import PredictiveFormattingInput from './PredictiveFormattingInput';
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
  type: 'pie' | 'bar' | 'kpi' | 'text' | 'image' | 'value'; // WHAT: Added 'value' type
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
  // VALUE TYPE ONLY: Dual formatting configs
  kpiFormatting?: { rounded: boolean; prefix?: string; suffix?: string; };
  barFormatting?: { rounded: boolean; prefix?: string; suffix?: string; };
  emoji?: string;
  subtitle?: string;
  showTotal?: boolean;
  totalLabel?: string;
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
  const [showEditor, setShowEditor] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ChartConfigFormData | null>(null);
  
  /* WHAT: Search and sort state
     WHY: Match Events management functionality */
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'title' | 'type' | 'status'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // WHAT: Dynamic variable state from KYC system
  // WHY: Replace hardcoded AVAILABLE_VARIABLES with live data
  const [availableVariables, setAvailableVariables] = useState<AvailableVariable[]>([]);
  const [variablesLoading, setVariablesLoading] = useState(true);
  
  // Load configurations AND variables on mount
  useEffect(() => {
    loadConfigurations();
    loadVariablesFromKYC();
  }, []);
  
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

  const loadConfigurations = async () => {
    try {
      console.log('🔄 Loading chart configurations...');
      const response = await fetch('/api/chart-config');
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Chart configurations loaded:', data.configurations.length);
        setConfigurations(data.configurations.sort((a: ChartConfiguration, b: ChartConfiguration) => a.order - b.order));
      } else {
        console.error('❌ Failed to load configurations:', data.error);
      }
    } catch (error) {
      console.error('❌ Error loading configurations:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (configData: ChartConfigFormData) => {
    try {
      const isUpdate = !!configData._id;
      const url = '/api/chart-config';
      const method = isUpdate ? 'PUT' : 'POST';
      
      const body = isUpdate 
        ? { configurationId: configData._id, ...configData }
        : configData;

      console.log(`${isUpdate ? '🔄 Updating' : '💾 Creating'} chart configuration:`, configData.chartId);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();
      
      if (result.success) {
        console.log(`✅ Chart configuration ${isUpdate ? 'updated' : 'created'} successfully`);
        await loadConfigurations(); // Reload the list
        setShowEditor(false);
        setEditingConfig(null);
      } else {
        alert(`Failed to ${isUpdate ? 'update' : 'create'} configuration: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error saving configuration:', error);
      alert('Failed to save configuration. Please try again.');
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
        await loadConfigurations(); // Reload the list
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
        await loadConfigurations();
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
      
      await loadConfigurations();
    } catch (error) {
      console.error('❌ Error reordering configurations:', error);
    }
  };

  const startEditing = (config?: ChartConfiguration) => {
    if (config) {
      // Edit existing configuration
      setEditingConfig({
        _id: config._id,
        chartId: config.chartId,
        title: config.title,
        type: config.type,
        order: config.order,
        isActive: config.isActive,
        elements: config.elements,
        emoji: config.emoji,
        subtitle: config.subtitle,
        showTotal: config.showTotal,
        totalLabel: config.totalLabel
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
        emoji: '📊',
        showTotal: false,
        totalLabel: ''
      });
    }
    setShowEditor(true);
  };


  const testConfigurationFormula = (formula: string) => {
    if (!formula.trim()) return null;
    
    const validation = validateFormula(formula);
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


  /* WHAT: Filter and sort configurations
     WHY: Implement search and sort like Events management */
  const filteredAndSortedConfigurations = useMemo(() => {
    let filtered = configurations;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(config => 
        config.title.toLowerCase().includes(term) ||
        config.chartId.toLowerCase().includes(term) ||
        config.type.toLowerCase().includes(term)
      );
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let comparison = 0;
      
      if (sortField === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortField === 'type') {
        comparison = a.type.localeCompare(b.type);
      } else if (sortField === 'status') {
        comparison = (a.isActive ? 1 : 0) - (b.isActive ? 1 : 0);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return sorted;
  }, [configurations, searchTerm, sortField, sortOrder]);
  
  /* WHAT: Toggle sort field and order
     WHY: Click column header to sort */
  const handleSort = (field: 'title' | 'type' | 'status') => {
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
      {/* WHAT: AdminHero with search and New Chart button
          WHY: Match Events management style */}
      <AdminHero 
        title="Chart Algorithm Manager"
        subtitle="Configure chart algorithms, data processing & visualization settings"
        badges={[
          { text: `${configurations.length} Total`, variant: 'primary' },
          { text: `${configurations.filter(c => c.isActive).length} Active`, variant: 'success' },
          ...(user ? [{ text: user.name, variant: 'secondary' as const }] : [])
        ]}
        backLink="/admin"
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search charts by title, ID, or type..."
        actionButtons={[
          { label: 'New Chart', onClick: () => startEditing(), variant: 'primary' as const },
          { label: 'Validate All', onClick: () => validateAllFormulas(), variant: 'secondary' as const },
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
                <th onClick={() => handleSort('status')} className="sortable-th">
                  Status
                  {sortField === 'status' && (
                    <span className="sort-indicator">
                      {sortOrder === 'asc' ? '▲' : '▼'}
                    </span>
                  )}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedConfigurations.length === 0 ? (
                <tr>
                  <td colSpan={4} className={styles.emptyState}>
                    <div className={styles.emptyIcon}>📊</div>
                    <div className={styles.emptyTitle}>
                      {searchTerm ? 'No charts match your search' : 'No Chart Configurations Found'}
                    </div>
                    <div className={styles.emptyDescription}>
                      {searchTerm ? 'Try adjusting your search terms' : 'Create your first chart configuration to get started.'}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedConfigurations.map((config, index) => (
                  <tr key={config._id}>
                    <td>
                      <div className={styles.chartTitleCell}>
                        {config.emoji && <span className={styles.chartEmoji}>{config.emoji}</span>}
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

      {/* Chart Configuration Editor Modal */}
      {showEditor && editingConfig && (
        <ChartConfigurationEditor
          config={editingConfig}
          availableVariables={availableVariables}
          onSave={saveConfiguration}
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
  onSave: (config: ChartConfigFormData) => void;
  onCancel: () => void;
}

function ChartConfigurationEditor({ config, availableVariables, onSave, onCancel }: ChartConfigurationEditorProps) {
  const [formData, setFormData] = useState<ChartConfigFormData>(config);
  const [showVariablePicker, setShowVariablePicker] = useState<{ elementIndex: number } | null>(null);
  const [variableSearchTerm, setVariableSearchTerm] = useState('');
  const [selectedVariableCategory, setSelectedVariableCategory] = useState<string>('All');
  const [formulaValidation, setFormulaValidation] = useState<Record<number, { isValid: boolean; error?: string; result?: number | 'NA' }>>({});
  
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
  const getRequiredElementCount = (type: 'pie' | 'bar' | 'kpi' | 'text' | 'image' | 'value'): number => {
    switch (type) {
      case 'kpi': return 1;
      case 'text': return 1; // Text charts display one text variable
      case 'image': return 1; // Image charts display one image URL
      case 'pie': return 2;
      case 'bar': return 5;
      case 'value': return 5; // VALUE charts have 5 bars like BAR type
      default: return 1;
    }
  };
  
  const handleSave = () => {
    // Enhanced validation
    if (!formData.chartId || !formData.title) {
      alert('Please fill in Chart ID and Title');
      return;
    }
    
    // Validate element count matches requirements
    const requiredCount = getRequiredElementCount(formData.type);
    if (formData.elements.length !== requiredCount) {
      alert(`${formData.type.toUpperCase()} charts must have exactly ${requiredCount} element${requiredCount !== 1 ? 's' : ''}`);
      return;
    }
    
    // Validate that all elements have labels and formulas
    const missingData = formData.elements.find((element, index) => !element.label.trim() || !element.formula.trim());
    if (missingData) {
      alert('Please fill in all element labels and formulas');
      return;
    }
    
    // WHAT: Validate VALUE type has both formatting configs
    // WHY: VALUE charts require dual formatting (kpi + bar)
    if (formData.type === 'value') {
      if (!formData.kpiFormatting || !formData.barFormatting) {
        alert('VALUE type charts require both KPI and Bar formatting configurations');
        return;
      }
    }
    
    // Validate formulas
    const invalidFormula = Object.entries(formulaValidation).find(([_, validation]) => !validation.isValid);
    if (invalidFormula) {
      alert('Please fix all formula errors before saving');
      return;
    }
    
    onSave(formData);
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
    if (!formula.trim()) {
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
    if (!formula.trim()) return null;
    
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
    <div className="modal-overlay">
      <ColoredCard className={`modal-content ${styles.modalContent}`}>
        <div className="modal-header">
          <h3>{config._id ? 'Edit Chart Configuration' : 'Create Chart Configuration'}</h3>
          <button className="btn btn-secondary" onClick={onCancel}>✕</button>
        </div>

        <div className="modal-body">
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
                  const newType = e.target.value as 'pie' | 'bar' | 'kpi' | 'text' | 'image' | 'value';
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
                  
                  // WHAT: Auto-initialize formatting configs for VALUE type
                  // WHY: VALUE charts REQUIRE both kpiFormatting and barFormatting with defaults
                  let newKpiFormatting = formData.kpiFormatting;
                  let newBarFormatting = formData.barFormatting;
                  
                  if (newType === 'value') {
                    // Initialize with defaults if not already set
                    if (!newKpiFormatting) {
                      newKpiFormatting = { rounded: true, prefix: '€', suffix: '' };
                    }
                    if (!newBarFormatting) {
                      newBarFormatting = { rounded: true, prefix: '€', suffix: '' };
                    }
                  }
                  
                  setFormData({ 
                    ...formData, 
                    type: newType, 
                    elements: newElements,
                    kpiFormatting: newKpiFormatting,
                    barFormatting: newBarFormatting
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
                <option value="value">💰 VALUE Chart (KPI + 5 bars with dual formatting)</option>
              </select>
            </div>

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
          
          {/* WHAT: VALUE TYPE ONLY - Dual Formatting Controls */}
          {/* WHY: VALUE charts need separate formatting for KPI total and bars */}
          {formData.type === 'value' && (
            <div className="formatting-section">
              <h4 className="formatting-section-title">🎯 Formatting Configuration</h4>
              
              {/* KPI Total Formatting */}
              <div className="formatting-group">
                <h5 className="formatting-group-title">KPI Total Formatting</h5>
                <div className="formatting-controls">
                  {/* CHECKBOX 1: Rounded */}
                  <label className="formatting-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.kpiFormatting?.rounded ?? true}
                      onChange={(e) => setFormData({
                        ...formData,
                        kpiFormatting: {
                          ...formData.kpiFormatting,
                          rounded: e.target.checked
                        }
                      })}
                    />
                    <span>Rounded (whole numbers)</span>
                  </label>
                  
                  {/* CHECKBOX 2: Show Prefix */}
                  <label className="formatting-checkbox">
                    <input
                      type="checkbox"
                      checked={!!formData.kpiFormatting?.prefix}
                      onChange={(e) => setFormData({
                        ...formData,
                        kpiFormatting: {
                          ...formData.kpiFormatting,
                          rounded: formData.kpiFormatting?.rounded ?? true,
                          prefix: e.target.checked ? (formattingDefaults?.prefix || '€') : '',
                          suffix: formData.kpiFormatting?.suffix || ''
                        }
                      })}
                    />
                    <span>Show Prefix</span>
                  </label>
                  
                  {/* CHECKBOX 3: Show Suffix */}
                  <label className="formatting-checkbox">
                    <input
                      type="checkbox"
                      checked={!!formData.kpiFormatting?.suffix}
                      onChange={(e) => setFormData({
                        ...formData,
                        kpiFormatting: {
                          ...formData.kpiFormatting,
                          rounded: formData.kpiFormatting?.rounded ?? true,
                          prefix: formData.kpiFormatting?.prefix || '',
                          suffix: e.target.checked ? (formattingDefaults?.suffix || '%') : ''
                        }
                      })}
                    />
                    <span>Show Suffix</span>
                  </label>
                  
                  {/* Predictive Prefix Input */}
                  {formData.kpiFormatting?.prefix !== undefined && formData.kpiFormatting?.prefix !== '' && (
                    <PredictiveFormattingInput
                      value={formData.kpiFormatting?.prefix || ''}
                      onChange={(value) => setFormData({
                        ...formData,
                        kpiFormatting: {
                          ...formData.kpiFormatting,
                          rounded: formData.kpiFormatting?.rounded ?? true,
                          prefix: value,
                          suffix: formData.kpiFormatting?.suffix || ''
                        }
                      })}
                      options={availablePrefixes}
                      placeholder="Select or type prefix"
                      label="Prefix"
                    />
                  )}
                  
                  {/* Predictive Suffix Input */}
                  {formData.kpiFormatting?.suffix !== undefined && formData.kpiFormatting?.suffix !== '' && (
                    <PredictiveFormattingInput
                      value={formData.kpiFormatting?.suffix || ''}
                      onChange={(value) => setFormData({
                        ...formData,
                        kpiFormatting: {
                          ...formData.kpiFormatting,
                          rounded: formData.kpiFormatting?.rounded ?? true,
                          prefix: formData.kpiFormatting?.prefix || '',
                          suffix: value
                        }
                      })}
                      options={availableSuffixes}
                      placeholder="Select or type suffix"
                      label="Suffix"
                    />
                  )}
                </div>
              </div>

              {/* Bar Elements Formatting */}
              <div className="formatting-group">
                <h5 className="formatting-group-title">Bar Elements Formatting (applies to all 5 bars)</h5>
                <div className="formatting-controls">
                  {/* CHECKBOX 1: Rounded */}
                  <label className="formatting-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.barFormatting?.rounded ?? true}
                      onChange={(e) => setFormData({
                        ...formData,
                        barFormatting: {
                          ...formData.barFormatting,
                          rounded: e.target.checked
                        }
                      })}
                    />
                    <span>Rounded (whole numbers)</span>
                  </label>
                  
                  {/* CHECKBOX 2: Show Prefix */}
                  <label className="formatting-checkbox">
                    <input
                      type="checkbox"
                      checked={!!formData.barFormatting?.prefix}
                      onChange={(e) => setFormData({
                        ...formData,
                        barFormatting: {
                          ...formData.barFormatting,
                          rounded: formData.barFormatting?.rounded ?? true,
                          prefix: e.target.checked ? (formattingDefaults?.prefix || '€') : '',
                          suffix: formData.barFormatting?.suffix || ''
                        }
                      })}
                    />
                    <span>Show Prefix</span>
                  </label>
                  
                  {/* CHECKBOX 3: Show Suffix */}
                  <label className="formatting-checkbox">
                    <input
                      type="checkbox"
                      checked={!!formData.barFormatting?.suffix}
                      onChange={(e) => setFormData({
                        ...formData,
                        barFormatting: {
                          ...formData.barFormatting,
                          rounded: formData.barFormatting?.rounded ?? true,
                          prefix: formData.barFormatting?.prefix || '',
                          suffix: e.target.checked ? (formattingDefaults?.suffix || '%') : ''
                        }
                      })}
                    />
                    <span>Show Suffix</span>
                  </label>
                  
                  {/* Predictive Prefix Input */}
                  {formData.barFormatting?.prefix !== undefined && formData.barFormatting?.prefix !== '' && (
                    <PredictiveFormattingInput
                      value={formData.barFormatting?.prefix || ''}
                      onChange={(value) => setFormData({
                        ...formData,
                        barFormatting: {
                          ...formData.barFormatting,
                          rounded: formData.barFormatting?.rounded ?? true,
                          prefix: value,
                          suffix: formData.barFormatting?.suffix || ''
                        }
                      })}
                      options={availablePrefixes}
                      placeholder="Select or type prefix"
                      label="Prefix"
                    />
                  )}
                  
                  {/* Predictive Suffix Input */}
                  {formData.barFormatting?.suffix !== undefined && formData.barFormatting?.suffix !== '' && (
                    <PredictiveFormattingInput
                      value={formData.barFormatting?.suffix || ''}
                      onChange={(value) => setFormData({
                        ...formData,
                        barFormatting: {
                          ...formData.barFormatting,
                          rounded: formData.barFormatting?.rounded ?? true,
                          prefix: formData.barFormatting?.prefix || '',
                          suffix: value
                        }
                      })}
                      options={availableSuffixes}
                      placeholder="Select or type suffix"
                      label="Suffix"
                    />
                  )}
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
                      {formData.type === 'value' && <span className="chart-type-info">💰 Bar {index + 1} (uses unified bar formatting)</span>}
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
                {formData.type === 'value' && '💰 VALUE charts require exactly 5 elements + dual formatting (KPI + Bar)'}
              </div>
              <div className="constraint-note">
                Element count is automatically managed when you change the chart type.
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            {config._id ? 'Update' : 'Create'} Chart
          </button>
        </div>
      </ColoredCard>
      
      {/* Variable Picker Modal */}
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
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .modal-content {
          width: 100%;
          padding: 2rem;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 1rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #1f2937;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .modal-header h3 {
          color: #1f2937;
          font-size: 1.5rem;
          font-weight: 600;
          margin: 0;
        }

        .modal-body {
          margin-bottom: 2rem;
        }

        .modal-footer {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }

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
          gap: 1rem;
          align-items: center;
          flex-wrap: wrap;
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
        
        .variable-picker-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1100;
          padding: 1rem;
        }
        
        .variable-picker-modal {
          background: white;
          border-radius: 0.75rem;
          padding: 1.5rem;
          max-width: 600px;
          width: 100%;
          max-height: 80vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }
        
        .variable-picker-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .variable-picker-header h4 {
          margin: 0;
          color: #1f2937;
          font-size: 1.125rem;
          font-weight: 600;
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
    </div>
  );
}
