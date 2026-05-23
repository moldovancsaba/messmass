// components/UnifiedTextInput.tsx
// WHAT: Universal text input component with blur-based auto-save
// WHY: Single source of truth for ALL text inputs across the application
// HOW: Stores value as string, saves only on blur (not on every keystroke)

'use client';

import React, { useState, useEffect } from 'react';
import { Text, TextInput } from '@mantine/core';

interface UnifiedTextInputProps {
  label?: string;
  value: string;
  onSave: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: 'text' | 'email' | 'url' | 'tel' | 'password';
  className?: string;
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
  showCharCount?: boolean;
}

/**
 * UnifiedTextInput - Single text input component for entire application
 * 
 * Features:
 * - Blur-based saving (no aggressive keystroke saves)
 * - Allows empty state during editing
 * - Optional character count display
 * - Type safety and validation
 * 
 * Usage:
 * <UnifiedTextInput
 *   label="Event Name"
 *   value={eventName}
 *   onSave={(newValue) => updateField('eventName', newValue)}
 *   placeholder="Enter event name"
 * />
 */
export default function UnifiedTextInput({
  label,
  value,
  onSave,
  placeholder,
  disabled = false,
  type = 'text',
  className = 'form-input',
  required = false,
  maxLength,
  autoComplete,
  showCharCount = false
}: UnifiedTextInputProps) {
  // WHAT: Store input value as string to allow smooth editing
  // WHY: Only save on blur, not on every keystroke
  const [tempValue, setTempValue] = useState<string>(value || '');
  const [isSaving, setIsSaving] = useState(false);

  // Sync with external value changes
  useEffect(() => {
    setTempValue(value || '');
  }, [value]);

  // WHAT: Save only when user leaves the field (blur)
  // WHY: Prevents aggressive saving on every keystroke
  const handleBlur = () => {
    if (tempValue !== value) {
      setIsSaving(true);
      onSave(tempValue);
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  // Handle Enter key (optional submit)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  const labelNode = label ? (
    <>
      {label} {required && <span className="text-danger">*</span>}
      {isSaving && <span className="text-muted ml-2">💾 Saving...</span>}
    </>
  ) : undefined;

  const description = showCharCount && tempValue.length > 0
    ? `${tempValue.length} characters${maxLength ? ` / ${maxLength}` : ''}`
    : undefined;

  return (
    <TextInput
      label={labelNode}
      value={tempValue}
      onChange={(event) => setTempValue(event.currentTarget.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      maxLength={maxLength}
      autoComplete={autoComplete}
      className={className}
      type={type}
      description={description ? <Text size="sm">{description}</Text> : undefined}
    />
  );
}
