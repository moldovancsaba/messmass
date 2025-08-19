'use client';

import React, { useState, useEffect } from 'react';
import { ChartConfiguration, ChartAlgorithm, ChartParameter } from '@/lib/chart-config';

interface ChartConfigurationProps {
  onConfigUpdate?: (config: ChartConfiguration) => void;
}

export const ChartConfigurationComponent: React.FC<ChartConfigurationProps> = ({ onConfigUpdate }) => {
  const [config, setConfig] = useState<ChartConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'merchandise' | 'engagement' | 'value' | 'sources'>('engagement');
  const [expandedAlgorithm, setExpandedAlgorithm] = useState<string | null>(null);

  // Load chart configuration on component mount
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/chart-config');
      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
      } else {
        setError(data.error || 'Failed to load configuration');
      }
    } catch (err) {
      console.error('Configuration load error:', err);
      setError('Failed to load chart configuration');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!config) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/chart-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config,
          updatedBy: 'admin'
        })
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
        onConfigUpdate?.(data.config);
        alert('Chart configuration saved successfully!');
      } else {
        setError(data.error || 'Failed to save configuration');
      }
    } catch (err) {
      console.error('Configuration save error:', err);
      setError('Failed to save chart configuration');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefaults = async () => {
    if (!confirm('Are you sure you want to reset all chart configurations to defaults? This cannot be undone.')) {
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/chart-config', {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setConfig(data.config);
        onConfigUpdate?.(data.config);
        alert('Chart configuration reset to defaults successfully!');
      } else {
        setError(data.error || 'Failed to reset configuration');
      }
    } catch (err) {
      console.error('Configuration reset error:', err);
      setError('Failed to reset chart configuration');
    } finally {
      setSaving(false);
    }
  };

  const updateParameter = (
    category: keyof ChartConfiguration['algorithms'],
    algorithmId: string,
    parameterKey: string,
    value: number
  ) => {
    if (!config) return;

    const updatedConfig = { ...config };
    const algorithm = updatedConfig.algorithms[category].find(alg => alg.id === algorithmId);
    
    if (algorithm) {
      const parameter = algorithm.parameters.find(param => param.key === parameterKey);
      if (parameter) {
        parameter.value = value;
        setConfig(updatedConfig);
      }
    }
  };

  const toggleAlgorithm = (
    category: keyof ChartConfiguration['algorithms'],
    algorithmId: string,
    enabled: boolean
  ) => {
    if (!config) return;

    const updatedConfig = { ...config };
    const algorithm = updatedConfig.algorithms[category].find(alg => alg.id === algorithmId);
    
    if (algorithm) {
      algorithm.enabled = enabled;
      setConfig(updatedConfig);
    }
  };

  const formatParameterValue = (parameter: ChartParameter): string => {
    switch (parameter.type) {
      case 'currency':
        return `€${parameter.value}`;
      case 'percentage':
        return `${parameter.value}%`;
      default:
        return parameter.value.toString();
    }
  };

  const renderAlgorithm = (algorithm: ChartAlgorithm, category: keyof ChartConfiguration['algorithms']) => {
    const isExpanded = expandedAlgorithm === algorithm.id;

    return (
      <div key={algorithm.id} className="algorithm-card">
        <div className="algorithm-header">
          <div className="algorithm-title">
            <h4>{algorithm.name}</h4>
            <p className="algorithm-description">{algorithm.description}</p>
          </div>
          <div className="algorithm-controls">
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={algorithm.enabled}
                onChange={(e) => toggleAlgorithm(category, algorithm.id, e.target.checked)}
              />
              <span className="toggle-slider"></span>
            </label>
            <button
              className="expand-button"
              onClick={() => setExpandedAlgorithm(isExpanded ? null : algorithm.id)}
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="algorithm-details">
            <div className="formula-section">
              <h5>Formula</h5>
              <code className="formula-code">{algorithm.formula}</code>
            </div>

            {algorithm.parameters.length > 0 && (
              <div className="parameters-section">
                <h5>Parameters</h5>
                <div className="parameters-grid">
                  {algorithm.parameters.map((parameter) => (
                    <div key={parameter.key} className="parameter-item">
                      <label className="parameter-label">
                        {parameter.name}
                        <span className="parameter-description">{parameter.description}</span>
                      </label>
                      <div className="parameter-input-group">
                        <input
                          type="number"
                          value={parameter.value}
                          min={parameter.min}
                          max={parameter.max}
                          step={parameter.type === 'currency' ? 0.1 : parameter.type === 'percentage' ? 1 : 0.1}
                          onChange={(e) => updateParameter(
                            category,
                            algorithm.id,
                            parameter.key,
                            parseFloat(e.target.value) || 0
                          )}
                          className="parameter-input"
                        />
                        <span className="parameter-unit">
                          {parameter.type === 'currency' ? '€' : parameter.type === 'percentage' ? '%' : ''}
                        </span>
                      </div>
                      <div className="parameter-range">
                        {parameter.min !== undefined && parameter.max !== undefined && (
                          <span>Range: {parameter.min} - {parameter.max}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="chart-config-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading chart configuration...</p>
        </div>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="chart-config-container">
        <div className="error-state">
          <h3>⚠️ Configuration Error</h3>
          <p>{error || 'Failed to load chart configuration'}</p>
          <button onClick={loadConfiguration} className="btn btn-primary">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="chart-config-container">
      <div className="config-header">
        <div className="config-title">
          <h3>🔧 Chart Configuration</h3>
          <p>Manage calculation algorithms for all chart types</p>
        </div>
        <div className="config-info">
          <div className="config-meta">
            <span><strong>Version:</strong> {config.version}</span>
            <span><strong>Last Updated:</strong> {new Date(config.lastUpdated).toLocaleDateString()}</span>
            <span><strong>Updated By:</strong> {config.updatedBy}</span>
          </div>
        </div>
      </div>

      <div className="config-actions">
        <button
          onClick={saveConfiguration}
          disabled={saving}
          className="btn btn-primary"
        >
          {saving ? 'Saving...' : '💾 Save Configuration'}
        </button>
        <button
          onClick={resetToDefaults}
          disabled={saving}
          className="btn btn-warning"
        >
          🔄 Reset to Defaults
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
        </div>
      )}

      <div className="config-tabs">
        <div className="tab-buttons">
          {(['merchandise', 'engagement', 'value', 'sources'] as const).map((tab) => (
            <button
              key={tab}
              className={`tab-button ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="tab-count">
                ({config.algorithms[tab].length})
              </span>
            </button>
          ))}
        </div>

        <div className="tab-content">
          <div className="algorithms-section">
            <h4>
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Algorithms
            </h4>
            <div className="algorithms-list">
              {config.algorithms[activeTab].map((algorithm) =>
                renderAlgorithm(algorithm, activeTab)
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .chart-config-container {
          padding: 1.5rem;
          max-width: 100%;
        }

        .config-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 2rem;
          padding-bottom: 1rem;
          border-bottom: 2px solid rgba(255, 255, 255, 0.1);
        }

        .config-title h3 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 1.5rem;
        }

        .config-title p {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .config-meta {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .config-actions {
          display: flex;
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-warning {
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          color: white;
        }

        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #dc2626;
          padding: 1rem;
          border-radius: 8px;
          margin-bottom: 1rem;
        }

        .config-tabs {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 1.5rem;
          backdrop-filter: blur(10px);
        }

        .tab-buttons {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 2rem;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .tab-button {
          background: none;
          border: none;
          padding: 0.75rem 1.5rem;
          border-radius: 8px 8px 0 0;
          cursor: pointer;
          font-weight: 500;
          color: #6b7280;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .tab-button.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .tab-button:hover:not(.active) {
          background: rgba(102, 126, 234, 0.1);
          color: #667eea;
        }

        .tab-count {
          background: rgba(0, 0, 0, 0.2);
          padding: 0.2rem 0.5rem;
          border-radius: 12px;
          font-size: 0.7rem;
        }

        .algorithms-section h4 {
          margin: 0 0 1.5rem 0;
          color: #1f2937;
        }

        .algorithms-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .algorithm-card {
          border: 1px solid rgba(0, 0, 0, 0.1);
          border-radius: 8px;
          overflow: hidden;
          transition: all 0.2s;
        }

        .algorithm-card:hover {
          border-color: rgba(102, 126, 234, 0.3);
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
        }

        .algorithm-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          padding: 1rem;
          background: rgba(0, 0, 0, 0.02);
        }

        .algorithm-title h4 {
          margin: 0 0 0.25rem 0;
          color: #1f2937;
          font-size: 1rem;
        }

        .algorithm-description {
          margin: 0;
          color: #6b7280;
          font-size: 0.9rem;
        }

        .algorithm-controls {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
        }

        .toggle-switch input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .toggle-slider {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #ccc;
          transition: .4s;
          border-radius: 24px;
        }

        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }

        input:checked + .toggle-slider {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }

        .expand-button {
          background: none;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 4px;
          width: 24px;
          height: 24px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          color: #6b7280;
          transition: all 0.2s;
        }

        .expand-button:hover {
          background: rgba(102, 126, 234, 0.1);
          border-color: rgba(102, 126, 234, 0.3);
          color: #667eea;
        }

        .algorithm-details {
          padding: 1rem;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
          background: rgba(0, 0, 0, 0.01);
        }

        .formula-section {
          margin-bottom: 1.5rem;
        }

        .formula-section h5 {
          margin: 0 0 0.5rem 0;
          color: #1f2937;
          font-size: 0.9rem;
        }

        .formula-code {
          background: rgba(0, 0, 0, 0.05);
          padding: 0.75rem;
          border-radius: 6px;
          font-family: 'Monaco', 'Menlo', monospace;
          font-size: 0.85rem;
          color: #374151;
          display: block;
          border-left: 3px solid #667eea;
        }

        .parameters-section h5 {
          margin: 0 0 1rem 0;
          color: #1f2937;
          font-size: 0.9rem;
        }

        .parameters-grid {
          display: grid;
          gap: 1rem;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        }

        .parameter-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .parameter-label {
          font-weight: 500;
          color: #374151;
          font-size: 0.9rem;
        }

        .parameter-description {
          display: block;
          font-weight: normal;
          color: #6b7280;
          font-size: 0.8rem;
          margin-top: 0.25rem;
        }

        .parameter-input-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .parameter-input {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid rgba(0, 0, 0, 0.2);
          border-radius: 6px;
          font-size: 0.9rem;
        }

        .parameter-input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .parameter-unit {
          font-weight: 500;
          color: #6b7280;
          min-width: 20px;
        }

        .parameter-range {
          font-size: 0.75rem;
          color: #9ca3af;
        }

        .loading-state, .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 3rem;
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #f3f4f6;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 1rem;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
