// components/FormulaEditor.tsx
// WHAT: Live formula editor with real-time validation and variable picker
// WHY: Enable admins to write formulas with immediate feedback on errors/warnings

'use client';

import React, { useState, useEffect, useRef } from 'react';
import { validateFormula, extractVariablesFromFormula } from '@/lib/formulaEngine';
import { buildReferenceToken } from '@/lib/variableRefs';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
  usedVariables: string[];
  evaluatedResult?: number | 'NA';
}

interface FormulaEditorProps {
  formula: string;
  onChange: (newFormula: string) => void;
  onValidate?: (result: ValidationResult) => void;
  placeholder?: string;
  disabled?: boolean;
}

interface KYCVariable {
  name: string;
  label: string;
  type: 'count' | 'percentage' | 'currency' | 'numeric' | 'text' | 'boolean' | 'date';
  category: string;
  description?: string;
  derived?: boolean;
  isCustom?: boolean;
}

/**
 * FormulaEditor Component
 * 
 * Features:
 * - Live validation as user types
 * - Syntax highlighting for variable tokens [SEYUX]
 * - Variable picker dropdown with autocomplete
 * - Error and warning display
 * - Deprecation warnings for non-SEYU tokens
 */
export default function FormulaEditor({ 
  formula, 
  onChange, 
  onValidate,
  placeholder = 'Enter formula...',
  disabled = false
}: FormulaEditorProps) {
  const [validation, setValidation] = useState<ValidationResult>({ 
    isValid: true, 
    usedVariables: [] 
  });
  const [showVariablePicker, setShowVariablePicker] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [kycVariables, setKycVariables] = useState<KYCVariable[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Validate formula on change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formula.trim()) {
        validateCurrentFormula();
      } else {
        const result: ValidationResult = { isValid: true, usedVariables: [] };
        setValidation(result);
        if (onValidate) onValidate(result);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(timer);
  }, [formula]);

  useEffect(() => {
    // Load KYC variables on mount
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/variables-config', { cache: 'no-store' });
        const data = await res.json();
        if (data?.success && Array.isArray(data.variables)) {
          setKycVariables(data.variables as KYCVariable[]);
        }
      } catch (e) {
        console.error('Failed to load KYC variables', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const validateCurrentFormula = () => {
    try {
      const result = validateFormula(formula);
      const usedVariables = extractVariablesFromFormula(formula);
      
      // Check for deprecation warnings (non-SEYU tokens)
      const warnings: string[] = [];
      usedVariables.forEach(variable => {
        const normalized = variable.replace(/_/g, '');
        if (!normalized.startsWith('SEYU')) {
          warnings.push(`Variable [${variable}] uses deprecated format. Consider using SEYU-prefixed tokens.`);
        }
      });

      // Check for division by zero risk
      if (/\/\s*0(?!\d)/.test(formula)) {
        warnings.push('Potential division by zero detected. Formula will return NA if denominator is 0.');
      }

      const validationResult: ValidationResult = {
        isValid: result.isValid,
        error: result.error,
        warnings: warnings.length > 0 ? warnings : undefined,
        usedVariables,
        evaluatedResult: result.evaluatedResult
      };

      setValidation(validationResult);
      if (onValidate) onValidate(validationResult);
    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        error: 'Unexpected validation error',
        usedVariables: []
      };
      setValidation(errorResult);
      if (onValidate) onValidate(errorResult);
    }
  };

  // Filter variables for picker
  const getFilteredVariables = () => {
    let filtered = kycVariables;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(v => v.category === selectedCategory);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(v => 
        v.name.toLowerCase().includes(term) ||
        (v.label || '').toLowerCase().includes(term) ||
        (v.description || '').toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  const insertVariable = (variable: KYCVariable) => {
    // Generate proper org-prefixed token from variable meta
    const token = buildReferenceToken(variable as any);
    const cursorPos = inputRef.current?.selectionStart || formula.length;
    const newFormula = 
      formula.substring(0, cursorPos) + 
      token + 
      formula.substring(cursorPos);
    
    onChange(newFormula);
    setShowVariablePicker(false);
    setSearchTerm('');
    
    // Focus back on input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newCursorPos = cursorPos + token.length;
        inputRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  // Close picker on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        pickerRef.current && 
        !pickerRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowVariablePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const categories = ['All', ...Array.from(new Set(kycVariables.map(v => v.category)))];
  const filteredVariables = getFilteredVariables();

  return (
    <div className="formula-editor-container">
      {/* Formula Input */}
      <div className="formula-input-wrapper">
        <textarea
          ref={inputRef}
          className={`formula-input ${!validation.isValid ? 'error' : validation.warnings ? 'warning' : ''}`}
          value={formula}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
        />
        <button
          type="button"
          className="variable-picker-button"
          onClick={() => setShowVariablePicker(!showVariablePicker)}
          disabled={disabled}
          title="Insert variable"
        >
          🔢 Variables
        </button>
      </div>

      {/* Validation Status */}
      {validation.error && (
        <div className="validation-message error">
          <span className="validation-icon">❌</span>
          <span>{validation.error}</span>
        </div>
      )}

      {validation.warnings && validation.warnings.map((warning, idx) => (
        <div key={idx} className="validation-message warning">
          <span className="validation-icon">⚠️</span>
          <span>{warning}</span>
        </div>
      ))}

      {validation.isValid && !validation.warnings && formula.trim() && (
        <div className="validation-message success">
          <span className="validation-icon">✅</span>
          <span>
            Valid formula
            {validation.evaluatedResult !== undefined && 
              ` • Test result: ${validation.evaluatedResult}`
            }
          </span>
        </div>
      )}

      {/* Variable Picker Dropdown */}
      {showVariablePicker && (
        <div ref={pickerRef} className="variable-picker-dropdown">
          <div className="variable-picker-header">
            <input
              type="text"
              className="variable-search"
              placeholder="Search variables..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
            <select
              className="category-filter"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="variable-list">
            {loading ? (
              <div className="no-variables">Loading variables...</div>
            ) : filteredVariables.length === 0 ? (
              <div className="no-variables">No variables found</div>
            ) : (
              filteredVariables.map(variable => {
                const token = buildReferenceToken(variable as any);
                return (
                  <button
                    key={variable.name}
                    type="button"
                    className="variable-item"
                    onClick={() => insertVariable(variable)}
                  >
                    <div className="variable-item-header">
                      <span className="variable-name">{token}</span>
                      <span className="variable-display-name">{variable.label}</span>
                    </div>
                    {variable.description && (
                      <div className="variable-description">{variable.description}</div>
                    )}
                    <div className="variable-example">{variable.category} • {variable.type}</div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .formula-editor-container {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .formula-input-wrapper {
          position: relative;
          display: flex;
          gap: 0.5rem;
        }

        .formula-input {
          flex: 1;
          padding: 0.75rem;
          border: 1px solid var(--color-gray-300);
          border-radius: 0.375rem;
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.875rem;
          line-height: 1.5;
          resize: vertical;
          min-height: 80px;
          transition: border-color 0.2s;
        }

        .formula-input:focus {
          outline: none;
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .formula-input.error {
          border-color: var(--color-error);
        }

        .formula-input.error:focus {
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .formula-input.warning {
          border-color: var(--color-warning);
        }

        .formula-input:disabled {
          background: var(--color-gray-50);
          cursor: not-allowed;
        }

        .variable-picker-button {
          padding: 0.75rem 1rem;
          background: var(--color-primary);
          color: white;
          border: none;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
          white-space: nowrap;
        }

        .variable-picker-button:hover:not(:disabled) {
          background: var(--color-primary-dark);
        }

        .variable-picker-button:disabled {
          background: var(--color-gray-300);
          cursor: not-allowed;
        }

        .validation-message {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          padding: 0.75rem;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          line-height: 1.5;
        }

        .validation-message.error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: var(--color-error-dark);
        }

        .validation-message.warning {
          background: rgba(245, 158, 11, 0.1);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: var(--color-warning-dark);
        }

        .validation-message.success {
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: var(--color-success-dark);
        }

        .validation-icon {
          font-size: 1rem;
          flex-shrink: 0;
        }

        .variable-picker-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          left: 0;
          right: 0;
          background: white;
          border: 1px solid var(--color-gray-300);
          border-radius: 0.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          z-index: 1000;
          max-height: 400px;
          display: flex;
          flex-direction: column;
        }

        .variable-picker-header {
          padding: 1rem;
          border-bottom: 1px solid var(--color-gray-200);
          display: flex;
          gap: 0.5rem;
        }

        .variable-search {
          flex: 1;
          padding: 0.5rem;
          border: 1px solid var(--color-gray-300);
          border-radius: 0.375rem;
          font-size: 0.875rem;
        }

        .category-filter {
          padding: 0.5rem;
          border: 1px solid var(--color-gray-300);
          border-radius: 0.375rem;
          font-size: 0.875rem;
          background: white;
          cursor: pointer;
        }

        .variable-list {
          overflow-y: auto;
          max-height: 300px;
        }

        .variable-item {
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          border-bottom: 1px solid var(--color-gray-100);
          background: white;
          text-align: left;
          cursor: pointer;
          transition: background 0.15s;
        }

        .variable-item:hover {
          background: var(--color-gray-50);
        }

        .variable-item:last-child {
          border-bottom: none;
        }

        .variable-item-header {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.25rem;
        }

        .variable-name {
          font-family: 'Monaco', 'Courier New', monospace;
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--color-primary);
          background: rgba(59, 130, 246, 0.1);
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
        }

        .variable-display-name {
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--color-gray-900);
        }

        .variable-description {
          font-size: 0.75rem;
          color: var(--color-gray-600);
          margin-bottom: 0.25rem;
        }

        .variable-example {
          font-size: 0.7rem;
          color: var(--color-gray-500);
          font-family: 'Monaco', 'Courier New', monospace;
        }

        .no-variables {
          padding: 2rem;
          text-align: center;
          color: var(--color-gray-500);
          font-size: 0.875rem;
        }
      `}</style>
    </div>
  );
}
