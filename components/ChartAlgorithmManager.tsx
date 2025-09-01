'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChartConfiguration, AVAILABLE_VARIABLES, AvailableVariable } from '@/lib/chartConfigTypes';
import { validateFormula, testFormula } from '@/lib/formulaEngine';
import { calculateChart, formatChartValue } from '@/lib/chartCalculator';

// Props type for the Chart Algorithm Manager component
// This component doesn't require any props as it manages its own state
type ChartAlgorithmManagerProps = Record<string, never>;

// Interface for chart configuration form data
interface ChartConfigFormData {
  _id?: string;
  chartId: string;
  title: string;
  type: 'pie' | 'bar' | 'kpi';
  order: number;
  isActive: boolean;
  elements: {
    id: string;
    label: string;
    formula: string;
    color: string;
    description?: string;
  }[];
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

export default function ChartAlgorithmManager({ }: ChartAlgorithmManagerProps) {
  const [configurations, setConfigurations] = useState<ChartConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showVariableReference, setShowVariableReference] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ChartConfigFormData | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Variable reference state
  const [filteredVariables, setFilteredVariables] = useState<AvailableVariable[]>(AVAILABLE_VARIABLES);
  
  // Load configurations on mount
  useEffect(() => {
    loadConfigurations();
  }, []);

  // Filter variables based on search and category
  useEffect(() => {
    let filtered = AVAILABLE_VARIABLES;
    
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(variable => variable.category === selectedCategory);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(variable => 
        variable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        variable.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredVariables(filtered);
  }, [searchTerm, selectedCategory]);

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

  const copyVariableToClipboard = (variableName: string) => {
    navigator.clipboard.writeText(`[${variableName}]`);
    // Could show a toast notification here
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

  // Get unique categories for filter dropdown
  const categories = ['All', ...Array.from(new Set(AVAILABLE_VARIABLES.map(v => v.category)))];

  if (loading) {
    return (
      <div className="glass-card">
        <div className="loading-spinner">Loading chart configurations...</div>
      </div>
    );
  }

  return (
    <div className="chart-algorithm-manager">
      {/* Header */}
      <div className="glass-card admin-overview">
        <div className="projects-header">
          <h2 className="section-title">Chart Algorithm Manager</h2>
          <div className="projects-header-buttons">
            <button 
              className="btn btn-secondary"
              onClick={() => setShowVariableReference(!showVariableReference)}
            >
              📚 Variable Reference ({AVAILABLE_VARIABLES.length})
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => startEditing()}
            >
              ➕ Add New Chart
            </button>
          </div>
        </div>
        
        <div className="stats-grid-admin">
          <div className="stat-card-admin">
            <div className="stat-value-admin">{configurations.length}</div>
            <div className="stat-label-admin">Total Charts</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-value-admin">{configurations.filter(c => c.isActive).length}</div>
            <div className="stat-label-admin">Active Charts</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-value-admin">{configurations.filter(c => c.type === 'pie').length}</div>
            <div className="stat-label-admin">Pie Charts</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-value-admin">{configurations.filter(c => c.type === 'bar').length}</div>
            <div className="stat-label-admin">Bar Charts</div>
          </div>
          <div className="stat-card-admin">
            <div className="stat-value-admin">{configurations.filter(c => c.type === 'kpi').length}</div>
            <div className="stat-label-admin">KPI Charts</div>
          </div>
        </div>
      </div>

      {/* Variable Reference Panel */}
      {showVariableReference && (
        <div className="glass-card variable-reference-panel">
          <div className="projects-header">
            <h3 className="section-title">Variable Reference</h3>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowVariableReference(false)}
            >
              ✕ Close
            </button>
          </div>
          
          <div className="variable-filters">
            <input
              type="text"
              placeholder="Search variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input"
              style={{ marginRight: '1rem', maxWidth: '300px' }}
            />
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="form-input"
              style={{ maxWidth: '200px' }}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          <div className="variables-grid">
            {filteredVariables.map(variable => (
              <div key={variable.name} className="variable-card">
                <div className="variable-header">
                  <strong>[{variable.name}]</strong>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => copyVariableToClipboard(variable.name)}
                    title="Copy to clipboard"
                  >
                    📋
                  </button>
                </div>
                <div className="variable-display-name">{variable.displayName}</div>
                <div className="variable-category">{variable.category}</div>
                <div className="variable-description">{variable.description}</div>
                <div className="variable-example">
                  <strong>Example:</strong> <code>{variable.exampleUsage}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart Configurations List */}
      <div className="glass-card admin-projects">
        <h3 className="section-title">Chart Configurations</h3>
        
        <div className="chart-configs-table-container">
          <table className="projects-table">
            <thead>
              <tr>
                <th>Order</th>
                <th>Title</th>
                <th>Type</th>
                <th>Elements</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {configurations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty-state">
                    <div className="admin-empty-icon">📊</div>
                    <div className="admin-empty-title">No Chart Configurations Found</div>
                    <div className="admin-empty-subtitle">
                      Create your first chart configuration to get started.
                    </div>
                  </td>
                </tr>
              ) : (
                configurations.map((config, index) => (
                  <tr key={config._id}>
                    <td className="stat-number">
                      <div className="order-controls">
                        {config.order}
                        <div className="order-buttons">
                          <button 
                            className="btn btn-xs"
                            onClick={() => moveConfiguration(config._id!, 'up')}
                            disabled={index === 0}
                          >
                            ↑
                          </button>
                          <button 
                            className="btn btn-xs"
                            onClick={() => moveConfiguration(config._id!, 'down')}
                            disabled={index === configurations.length - 1}
                          >
                            ↓
                          </button>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="chart-title-cell">
                        {config.emoji && <span className="chart-emoji">{config.emoji}</span>}
                        <strong>{config.title}</strong>
                        <br />
                        <small className="chart-id">ID: {config.chartId}</small>
                      </div>
                    </td>
                    <td>
                      <span className={`chart-type-badge ${config.type}`}>
                        {config.type === 'pie' ? '🥧 Pie' : config.type === 'bar' ? '📊 Bar' : '📈 KPI'}
                      </span>
                    </td>
                    <td className="stat-number">{config.elements.length}</td>
                    <td>
                      <button
                        className={`btn btn-sm ${config.isActive ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => toggleConfigurationActive(config)}
                      >
                        {config.isActive ? '✅ Active' : '❌ Inactive'}
                      </button>
                    </td>
                    <td className="actions-cell">
                      <button 
                        className="btn btn-sm btn-info"
                        onClick={() => startEditing(config)}
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => deleteConfiguration(config._id!, config.title)}
                      >
                        🗑️ Delete
                      </button>
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
          onSave={saveConfiguration}
          onCancel={() => {
            setShowEditor(false);
            setEditingConfig(null);
          }}
        />
      )}
      
      {/* CSS Styles */}
      <style jsx>{`
        .chart-algorithm-manager {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }

        .variable-reference-panel {
          max-height: 70vh;
          overflow-y: auto;
        }

        .variable-filters {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          align-items: center;
        }

        .variables-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 1rem;
        }

        .variable-card {
          background: rgba(255, 255, 255, 0.8);
          border-radius: 0.5rem;
          padding: 1rem;
          border: 1px solid rgba(102, 126, 234, 0.1);
        }

        .variable-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.5rem;
        }

        .variable-display-name {
          font-weight: 600;
          color: #374151;
          margin-bottom: 0.25rem;
        }

        .variable-category {
          color: #6b7280;
          font-size: 0.75rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          font-weight: 500;
        }

        .variable-description {
          color: #4b5563;
          font-size: 0.875rem;
          margin-bottom: 0.5rem;
        }

        .variable-example {
          font-size: 0.75rem;
          color: #6b7280;
        }

        .variable-example code {
          background: #f3f4f6;
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-family: monospace;
        }

        .chart-configs-table-container {
          overflow-x: auto;
        }

        .order-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .order-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.125rem;
        }

        .order-buttons .btn {
          padding: 0.125rem 0.25rem;
          font-size: 0.625rem;
          min-width: 20px;
        }

        .chart-title-cell {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
        }

        .chart-emoji {
          font-size: 1.25rem;
          margin-right: 0.5rem;
        }

        .chart-id {
          color: #6b7280;
          font-family: monospace;
        }

        .chart-type-badge {
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.75rem;
          font-weight: 500;
        }

        .chart-type-badge.pie {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }

        .chart-type-badge.bar {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
        }

        .chart-type-badge.kpi {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        

        .actions-cell {
          display: flex;
          gap: 0.5rem;
        }
      `}</style>
    </div>
  );
}

// Chart Configuration Editor Component (simplified - full implementation would be larger)
interface ChartConfigurationEditorProps {
  config: ChartConfigFormData;
  onSave: (config: ChartConfigFormData) => void;
  onCancel: () => void;
}

function ChartConfigurationEditor({ config, onSave, onCancel }: ChartConfigurationEditorProps) {
  const [formData, setFormData] = useState<ChartConfigFormData>(config);
  const [showVariablePicker, setShowVariablePicker] = useState<{ elementIndex: number } | null>(null);
  const [variableSearchTerm, setVariableSearchTerm] = useState('');
  const [selectedVariableCategory, setSelectedVariableCategory] = useState<string>('All');
  const [formulaValidation, setFormulaValidation] = useState<Record<number, { isValid: boolean; error?: string; result?: number | 'NA' }>>({});
  
  // Get the exact required element count for each chart type
  const getRequiredElementCount = (type: 'pie' | 'bar' | 'kpi'): number => {
    switch (type) {
      case 'kpi': return 1;
      case 'pie': return 2;
      case 'bar': return 5;
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

  // Filter variables for picker
  const getFilteredVariablesForPicker = () => {
    let filtered = AVAILABLE_VARIABLES;
    
    if (selectedVariableCategory !== 'All') {
      filtered = filtered.filter(variable => variable.category === selectedVariableCategory);
    }
    
    if (variableSearchTerm) {
      filtered = filtered.filter(variable => 
        variable.name.toLowerCase().includes(variableSearchTerm.toLowerCase()) ||
        variable.displayName.toLowerCase().includes(variableSearchTerm.toLowerCase()) ||
        variable.description.toLowerCase().includes(variableSearchTerm.toLowerCase())
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
  
  const variableCategories = ['All', ...Array.from(new Set(AVAILABLE_VARIABLES.map(v => v.category)))];
  
  // Test function for formulas (moved to component scope)
  const testConfigurationFormula = (formula: string) => {
    if (!formula.trim()) return null;
    
    // Simple validation - check for balanced brackets and valid variable names
    const variablePattern = /\[([A-Z_]+)\]/g;
    const variables: string[] = [];
    let match;
    
    while ((match = variablePattern.exec(formula)) !== null) {
      variables.push(match[1]);
    }
    
    // Check if all variables are valid
    const invalidVariables = variables.filter(variable => 
      !AVAILABLE_VARIABLES.some(v => v.name === variable)
    );
    
    if (invalidVariables.length > 0) {
      return { error: `Unknown variables: ${invalidVariables.join(', ')}`, result: null };
    }
    
    // Simple test calculation with sample data
    try {
      let testFormula = formula;
      const sampleData = {
        FEMALE: 120, MALE: 160, INDOOR: 50, OUTDOOR: 30, STADIUM: 200,
        GEN_ALPHA: 20, GEN_YZ: 100, GEN_X: 80, BOOMER: 80,
        JERSEY: 15, SCARF: 8, FLAGS: 12, BASEBALL_CAP: 5, OTHER: 3,
        REMOTE_IMAGES: 10, HOSTESS_IMAGES: 25, SELFIES: 15,
        APPROVED_IMAGES: 45, REJECTED_IMAGES: 5
      };
      
      // Replace variables with sample values
      variables.forEach(variable => {
        const value = sampleData[variable as keyof typeof sampleData] || 1;
        testFormula = testFormula.replace(new RegExp(`\\[${variable}\\]`, 'g'), value.toString());
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
      <div className="modal-content glass-card" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
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
                  const newType = e.target.value as 'pie' | 'bar' | 'kpi';
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
                  
                  setFormData({ ...formData, type: newType, elements: newElements });
                  // Clear validation when type changes
                  setFormulaValidation({});
                }}
              >
                <option value="kpi">KPI Chart (1 element)</option>
                <option value="pie">Pie Chart (2 elements)</option>
                <option value="bar">Bar Chart (5 elements)</option>
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
                          className="btn btn-xs btn-secondary variable-picker-btn"
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
                {formData.type === 'pie' && '🥧 Pie charts require exactly 2 elements'}
                {formData.type === 'bar' && '📊 Bar charts require exactly 5 elements'}
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
      </div>
      
      {/* Variable Picker Modal */}
      {showVariablePicker && (
        <div className="variable-picker-overlay">
          <div className="variable-picker-modal">
            <div className="variable-picker-header">
              <h4>Select Variable for Element {showVariablePicker.elementIndex + 1}</h4>
              <button 
                className="btn btn-xs btn-secondary"
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

        .btn {
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
          font-size: 0.875rem;
        }

        .btn-primary {
          background: #667eea;
          color: white;
        }

        .btn-primary:hover {
          background: #5a67d8;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-xs {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
        }

        .btn-danger {
          background: #ef4444;
          color: white;
        }

        .btn-danger:hover {
          background: #dc2626;
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
