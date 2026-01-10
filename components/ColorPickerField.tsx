/* WHAT: Color picker field with hex input and transparency support
 * WHY: Simple, effective color editing for style editor
 * HOW: HTML5 color picker + text input synced together */

'use client';

import React, { useState, useEffect } from 'react';
import styles from './ColorPickerField.module.css';

interface ColorPickerFieldProps {
  label: string;
  description?: string;
  value: string; // 8-character hex: #RRGGBBAA
  onChange: (value: string) => void;
}

/**
 * ColorPickerField
 * 
 * WHAT: Color picker with hex input and transparency slider
 * WHY: User needs visual color selection + precise hex control
 * HOW: HTML5 <input type="color"> synced with text input
 */
export default function ColorPickerField({ label, description, value, onChange }: ColorPickerFieldProps) {
  // Separate color (6 chars) and alpha (2 chars)
  const [hexInput, setHexInput] = useState(value);
  
  useEffect(() => {
    setHexInput(value);
  }, [value]);
  
  // Extract RGB portion for color picker (HTML5 color input only supports 6-char hex)
  const rgbValue = value.length >= 7 ? value.slice(0, 7) : '#000000';
  
  // Extract alpha as percentage (last 2 hex digits → 0-100)
  const alphaHex = value.length === 9 ? value.slice(7, 9) : 'ff';
  const alphaPercent = Math.round((parseInt(alphaHex, 16) / 255) * 100);
  
  /**
   * Handle color picker change (RGB only, preserves alpha)
   */
  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRgb = e.target.value; // 6-char hex
    const newValue = `${newRgb}${alphaHex}`;
    onChange(newValue);
  };
  
  /**
   * Handle transparency slider change
   */
  const handleAlphaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseInt(e.target.value);
    const newAlphaHex = Math.round((percent / 100) * 255).toString(16).padStart(2, '0');
    const newValue = `${rgbValue}${newAlphaHex}`;
    onChange(newValue);
  };
  
  /**
   * Handle hex input change (manual typing)
   */
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.trim();
    
    // Remove # if user types it
    if (input.startsWith('#')) {
      input = input.slice(1);
    }
    
    // Update local state (allow partial input)
    setHexInput(`#${input}`);
    
    // Only propagate valid hex codes (6 or 8 chars)
    if (/^[0-9A-Fa-f]{6}$/.test(input)) {
      onChange(`#${input}ff`); // Add full opacity if 6 chars
    } else if (/^[0-9A-Fa-f]{8}$/.test(input)) {
      onChange(`#${input}`);
    }
  };
  
  /**
   * Handle blur - normalize invalid input
   */
  const handleHexInputBlur = () => {
    // If input is invalid, reset to current value
    if (!/^#[0-9A-Fa-f]{8}$/.test(hexInput)) {
      setHexInput(value);
    }
  };
  
  return (
    <div className={styles.field}>
      <div className={styles.labelRow}>
        <label className={styles.label}>{label}</label>
        {description && <span className={styles.description}>{description}</span>}
      </div>
      
      <div className={styles.controls}>
        {/* Color preview + picker */}
        <div className={styles.pickerWrapper}>
          <input
            type="color"
            value={rgbValue}
            onChange={handleColorChange}
            className={styles.colorPicker}
            title="Pick color"
          />
          {/* Color preview with transparency checkerboard */}
          <div className={styles.preview}>
            <div className={styles.checkerboard} />
            {/* eslint-disable-next-line react/forbid-dom-props */}
            <div className={styles.previewColor} style={{ backgroundColor: hexInput }} />
          </div>
        </div>
        
        {/* Hex input */}
        <input
          type="text"
          value={hexInput}
          onChange={handleHexInputChange}
          onBlur={handleHexInputBlur}
          placeholder="#RRGGBBAA"
          maxLength={9}
          className={styles.hexInput}
          title="Hex color code (8 characters with transparency)"
        />
        
        {/* Transparency slider */}
        <div className={styles.alphaControl}>
          <label className={styles.alphaLabel}>
            Opacity: {alphaPercent}%
          </label>
          <input
            type="range"
            min="0"
            max="100"
            value={alphaPercent}
            onChange={handleAlphaChange}
            className={styles.alphaSlider}
            title="Transparency (0% = transparent, 100% = opaque)"
          />
        </div>
      </div>
    </div>
  );
}
