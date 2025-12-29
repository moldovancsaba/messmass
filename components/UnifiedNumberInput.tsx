// components/UnifiedNumberInput.tsx
// WHAT: Universal numeric input component with blur-based auto-save
// WHY: Single source of truth for ALL numeric inputs across the application
// HOW: Stores value as string to allow deletion, parses on blur only

'use client';

import React, { useState, useEffect } from 'react';

interface UnifiedNumberInputProps {
  label?: string;
  value: number;
  onSave: (value: number) => void;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  required?: boolean;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  showValueDisplay?: boolean;
}

/**
 * UnifiedNumberInput - Single numeric input component for entire application
 * 
 * Features:
 * - Blur-based saving (no aggressive keystroke saves)
 * - Allows complete deletion of values (including "0")
 * - Optional min/max validation
 * - Decimal and negative number support
 * - Parse and validate only on blur
 * 
 * Usage:
 * <UnifiedNumberInput
 *   label="Remote Images"
 *   value={stats.remoteImages}
 *   onSave={(newValue) => updateStat('remoteImages', newValue)}
 *   min={0}
 * />
 */
export default function UnifiedNumberInput({
  label,
  value,
  onSave,
  placeholder,
  disabled = false,
  min = 0,
  max,
  step = 1,
  className = 'form-input',
  required = false,
  allowNegative = false,
  allowDecimal = false,
  showValueDisplay = false
}: UnifiedNumberInputProps) {
  // WHAT: Store input value as string to allow empty state during editing
  // WHY: Prevents aggressive parsing that resets empty string to 0 immediately
  // HOW: Only parse and validate on blur, not on every keystroke
  const [tempValue, setTempValue] = useState<string>(value.toString());
  const [isSaving, setIsSaving] = useState(false);

  // Sync with external value changes
  useEffect(() => {
    setTempValue(value.toString());
  }, [value]);

  // WHAT: Parse and validate only when user leaves the field (blur)
  // WHY: Allows user to delete "0" and type new number smoothly
  const handleBlur = () => {
    // Parse the string to number
    let parsedValue = allowDecimal ? parseFloat(tempValue) : parseInt(tempValue);
    
    // Handle invalid input (empty or NaN)
    if (isNaN(parsedValue) || tempValue === '') {
      parsedValue = min || 0;
    }
    
    // Apply min/max constraints
    if (!allowNegative && parsedValue < 0) {
      parsedValue = 0;
    }
    if (min !== undefined && parsedValue < min) {
      parsedValue = min;
    }
    if (max !== undefined && parsedValue > max) {
      parsedValue = max;
    }
    
    // Save if value changed
    if (parsedValue !== value) {
      setIsSaving(true);
      onSave(parsedValue);
      setTimeout(() => setIsSaving(false), 500);
    } else {
      // Reset display to match actual value if no change
      setTempValue(value.toString());
    }
  };

  // Handle Enter key (optional submit)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="form-group">
      {label && (
        <label className="form-label-block">
          {label} {required && <span className="text-danger">*</span>}
          {isSaving && <span className="text-muted ml-2">💾 Saving...</span>}
        </label>
      )}
      
      <input
        type="number"
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        min={min}
        max={max}
        step={allowDecimal ? (step || 0.01) : (step || 1)}
        className={className}
      />
      
      {showValueDisplay && (
        <div className="text-muted text-sm mt-1">
          Current value: {value}
          {min !== undefined && ` (min: ${min})`}
          {max !== undefined && ` (max: ${max})`}
        </div>
      )}
    </div>
  );
}
