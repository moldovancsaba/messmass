// components/TextareaField.tsx
// WHAT: Multiline text field for Clicker editor with auto-save
// WHY: Partner report text notes need textarea (not single-line input)
// HOW: Textarea with onBlur save, no character limit

'use client';

import React, { useState, useEffect } from 'react';
import styles from './TextareaField.module.css';

interface TextareaFieldProps {
  label: string;
  value: string;
  onSave: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  rows?: number;
}

export default function TextareaField({ 
  label, 
  value, 
  onSave, 
  disabled, 
  placeholder = 'Enter text...',
  rows = 4 
}: TextareaFieldProps) {
  const [tempValue, setTempValue] = useState(value || '');
  const [isSaving, setIsSaving] = useState(false);

  // Update temp value when prop value changes
  useEffect(() => {
    setTempValue(value || '');
  }, [value]);

  // WHAT: Save on blur (when user leaves field)
  // WHY: Auto-save without needing explicit save button
  const handleBlur = () => {
    if (tempValue !== value) {
      setIsSaving(true);
      onSave(tempValue);
      // Reset saving state after short delay
      setTimeout(() => setIsSaving(false), 500);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.labelRow}>
        <label className={styles.label}>{label}</label>
        {isSaving && <span className={styles.saving}>💾 Saving...</span>}
      </div>
      
      <textarea
        value={tempValue}
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        rows={rows}
        className={styles.textarea}
      />
      
      <div className={styles.info}>
        {tempValue.length > 0 && (
          <span className={styles.charCount}>{tempValue.length} characters</span>
        )}
      </div>
    </div>
  );
}
