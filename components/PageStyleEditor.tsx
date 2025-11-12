/* WHAT: Modal form for creating and editing page styles
 * WHY: Allow admins to customize themes with visual interface
 * HOW: Form with sections for backgrounds, typography, and colors */

'use client';

import React, { useState, useEffect } from 'react';
import ColoredCard from './ColoredCard';
import StylePreview from './StylePreview';
import FormModal from './modals/FormModal';
import styles from './PageStyleEditor.module.css';
import { 
  PageStyleEnhanced, 
  BackgroundStyle, 
  DEFAULT_PAGE_STYLE_ENHANCED 
} from '@/lib/pageStyleTypesEnhanced';

interface PageStyleEditorProps {
  /* WHAT: Existing style to edit (undefined for new style)
   * WHY: Pre-populate form fields when editing */
  style?: PageStyleEnhanced;
  
  /* WHAT: Callback when form is saved
   * WHY: Allow parent to handle API call and UI updates */
  onSave: (style: Omit<PageStyleEnhanced, '_id' | 'createdAt' | 'updatedAt' | 'projectIds'>) => Promise<void>;
  
  /* WHAT: Callback when modal is closed
   * WHY: Allow parent to control modal visibility */
  onClose: () => void;
  
  /* WHAT: Loading state from parent
   * WHY: Disable form during save operation */
  isLoading?: boolean;
}

export default function PageStyleEditor({ 
  style, 
  onSave, 
  onClose, 
  isLoading = false 
}: PageStyleEditorProps) {
  /* WHAT: Form state initialized from style or defaults
   * WHY: Track all form fields with proper typing */
  const [formData, setFormData] = useState<Omit<PageStyleEnhanced, '_id' | 'createdAt' | 'updatedAt' | 'projectIds'>>(() => {
    if (style) {
      return {
        name: style.name,
        description: style.description,
        isGlobalDefault: style.isGlobalDefault || false,
        pageBackground: style.pageBackground,
        heroBackground: style.heroBackground,
        contentBoxBackground: style.contentBoxBackground,
        typography: style.typography,
        colorScheme: style.colorScheme,
        createdBy: style.createdBy
      };
    }
    return { ...DEFAULT_PAGE_STYLE_ENHANCED };
  });

  const [activeSection, setActiveSection] = useState<'general' | 'backgrounds' | 'typography' | 'colors'>('general');

  /* WHAT: Update form field
   * WHY: Generic handler for nested state updates */
  const updateField = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      const newData = { ...prev };
      let current: any = newData;
      
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      
      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  /* WHAT: Background type toggle
   * WHY: Switch between solid and gradient backgrounds */
  const toggleBackgroundType = (bgKey: 'pageBackground' | 'heroBackground') => {
    const current = formData[bgKey];
    if (current.type === 'solid') {
      updateField(`${bgKey}.type`, 'gradient');
      updateField(`${bgKey}.gradientAngle`, 135);
      updateField(`${bgKey}.gradientStops`, [
        { color: current.solidColor || '#ffffff', position: 0 },
        { color: '#000000', position: 100 }
      ]);
    } else {
      updateField(`${bgKey}.type`, 'solid');
      updateField(`${bgKey}.solidColor`, current.gradientStops?.[0]?.color || '#ffffff');
    }
  };

  const sections = [
    { id: 'general', label: '📝 General', icon: '📝' },
    { id: 'backgrounds', label: '🎨 Backgrounds', icon: '🎨' },
    { id: 'typography', label: '🔤 Typography', icon: '🔤' },
    { id: 'colors', label: '🌈 Colors', icon: '🌈' },
  ] as const;

  return (
    <FormModal
      isOpen={true}
      onClose={onClose}
      onSubmit={async () => {
        // Basic validation
        if (!formData.name || formData.name.trim() === '') {
          alert('Style name is required');
          return;
        }
        
        await onSave(formData);
      }}
      title={style ? `✏️ Edit Style: ${style.name}` : '➕ Create New Style'}
      submitText={style ? 'Update Style' : 'Create Style'}
      isSubmitting={isLoading}
      size="xl"
    >
      {/* Section Tabs */}
      <div className={styles.sectionTabs}>
            {sections.map((section) => (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSection(section.id)}
                className={`${styles.sectionTab} ${activeSection === section.id ? styles.sectionTabActive : ''}`}
              >
                {section.label}
              </button>
            ))}
          </div>

          {/* Split Layout: Form + Preview */}
          <div className={styles.splitLayout}>
            {/* Form Content */}
            <div className={styles.formPane}>
            {/* GENERAL SECTION */}
            {activeSection === 'general' && (
              <div className={styles.section}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Style Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    type="text"
                    className={styles.input}
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    placeholder="e.g. Dark Theme, Light Theme"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Description</label>
                  <textarea
                    className={styles.textarea}
                    value={formData.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="Brief description of this style..."
                    rows={3}
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {/* BACKGROUNDS SECTION */}
            {activeSection === 'backgrounds' && (
              <div className={styles.section}>
                {/* Page Background */}
                <div className={styles.backgroundGroup}>
                  <h3 className={styles.subsectionTitle}>Page Background</h3>
                  
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Type</label>
                    <div className={styles.buttonGroup}>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${formData.pageBackground.type === 'solid' ? styles.toggleActive : ''}`}
                        onClick={() => updateField('pageBackground.type', 'solid')}
                        disabled={isLoading}
                      >
                        Solid
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${formData.pageBackground.type === 'gradient' ? styles.toggleActive : ''}`}
                        onClick={() => toggleBackgroundType('pageBackground')}
                        disabled={isLoading}
                      >
                        Gradient
                      </button>
                    </div>
                  </div>

                  {formData.pageBackground.type === 'solid' && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Color</label>
                      <div className={styles.colorInputGroup}>
                        <input
                          type="color"
                          className={styles.colorPicker}
                          value={formData.pageBackground.solidColor || '#ffffff'}
                          onChange={(e) => updateField('pageBackground.solidColor', e.target.value)}
                          disabled={isLoading}
                        />
                        <input
                          type="text"
                          className={styles.colorText}
                          value={formData.pageBackground.solidColor || '#ffffff'}
                          onChange={(e) => updateField('pageBackground.solidColor', e.target.value)}
                          placeholder="#ffffff"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}

                  {formData.pageBackground.type === 'gradient' && (
                    <>
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Angle (degrees)</label>
                        <input
                          type="number"
                          className={styles.input}
                          value={formData.pageBackground.gradientAngle || 135}
                          onChange={(e) => updateField('pageBackground.gradientAngle', parseInt(e.target.value))}
                          min={0}
                          max={360}
                          disabled={isLoading}
                        />
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label className={styles.label}>Gradient Colors</label>
                        <p className={styles.hint}>Simple gradient builder coming in next step</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Hero Background */}
                <div className={styles.backgroundGroup}>
                  <h3 className={styles.subsectionTitle}>Hero Background</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Type</label>
                    <div className={styles.buttonGroup}>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${formData.heroBackground.type === 'solid' ? styles.toggleActive : ''}`}
                        onClick={() => updateField('heroBackground.type', 'solid')}
                        disabled={isLoading}
                      >
                        Solid
                      </button>
                      <button
                        type="button"
                        className={`${styles.toggleButton} ${formData.heroBackground.type === 'gradient' ? styles.toggleActive : ''}`}
                        onClick={() => toggleBackgroundType('heroBackground')}
                        disabled={isLoading}
                      >
                        Gradient
                      </button>
                    </div>
                  </div>

                  {formData.heroBackground.type === 'solid' && (
                    <div className={styles.formGroup}>
                      <label className={styles.label}>Color</label>
                      <div className={styles.colorInputGroup}>
                        <input
                          type="color"
                          className={styles.colorPicker}
                          value={formData.heroBackground.solidColor || '#ffffff'}
                          onChange={(e) => updateField('heroBackground.solidColor', e.target.value)}
                          disabled={isLoading}
                        />
                        <input
                          type="text"
                          className={styles.colorText}
                          value={formData.heroBackground.solidColor || '#ffffff'}
                          onChange={(e) => updateField('heroBackground.solidColor', e.target.value)}
                          placeholder="#ffffff"
                          disabled={isLoading}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Content Box Background */}
                <div className={styles.backgroundGroup}>
                  <h3 className={styles.subsectionTitle}>Content Box Background</h3>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Color</label>
                    <div className={styles.colorInputGroup}>
                      <input
                        type="color"
                        className={styles.colorPicker}
                        value={formData.contentBoxBackground.solidColor || '#ffffff'}
                        onChange={(e) => updateField('contentBoxBackground.solidColor', e.target.value)}
                        disabled={isLoading}
                      />
                      <input
                        type="text"
                        className={styles.colorText}
                        value={formData.contentBoxBackground.solidColor || '#ffffff'}
                        onChange={(e) => updateField('contentBoxBackground.solidColor', e.target.value)}
                        placeholder="#ffffff"
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Opacity</label>
                    <input
                      type="number"
                      className={styles.input}
                      value={formData.contentBoxBackground.opacity || 1}
                      onChange={(e) => updateField('contentBoxBackground.opacity', parseFloat(e.target.value))}
                      min={0}
                      max={1}
                      step={0.1}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* TYPOGRAPHY SECTION */}
            {activeSection === 'typography' && (
              <div className={styles.section}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Font Family</label>
                  <select
                    className={styles.select}
                    value={formData.typography.fontFamily}
                    onChange={(e) => updateField('typography.fontFamily', e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="inter">Inter</option>
                    <option value="roboto">Roboto</option>
                    <option value="poppins">Poppins</option>
                    <option value="montserrat">Montserrat</option>
                    {/* WHAT: Use exact CSS font-family name as value
                         WHY: Must match @font-face declaration in globals.css */}
                    <option value="AS Roma">AS Roma</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Primary Text Color</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      className={styles.colorPicker}
                      value={formData.typography.primaryTextColor}
                      onChange={(e) => updateField('typography.primaryTextColor', e.target.value)}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      className={styles.colorText}
                      value={formData.typography.primaryTextColor}
                      onChange={(e) => updateField('typography.primaryTextColor', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Secondary Text Color</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      className={styles.colorPicker}
                      value={formData.typography.secondaryTextColor}
                      onChange={(e) => updateField('typography.secondaryTextColor', e.target.value)}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      className={styles.colorText}
                      value={formData.typography.secondaryTextColor}
                      onChange={(e) => updateField('typography.secondaryTextColor', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Heading Color</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      className={styles.colorPicker}
                      value={formData.typography.headingColor}
                      onChange={(e) => updateField('typography.headingColor', e.target.value)}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      className={styles.colorText}
                      value={formData.typography.headingColor}
                      onChange={(e) => updateField('typography.headingColor', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* COLORS SECTION */}
            {activeSection === 'colors' && (
              <div className={styles.section}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Primary Color</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      className={styles.colorPicker}
                      value={formData.colorScheme.primary}
                      onChange={(e) => updateField('colorScheme.primary', e.target.value)}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      className={styles.colorText}
                      value={formData.colorScheme.primary}
                      onChange={(e) => updateField('colorScheme.primary', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Secondary Color</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      className={styles.colorPicker}
                      value={formData.colorScheme.secondary}
                      onChange={(e) => updateField('colorScheme.secondary', e.target.value)}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      className={styles.colorText}
                      value={formData.colorScheme.secondary}
                      onChange={(e) => updateField('colorScheme.secondary', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Success Color</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      className={styles.colorPicker}
                      value={formData.colorScheme.success}
                      onChange={(e) => updateField('colorScheme.success', e.target.value)}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      className={styles.colorText}
                      value={formData.colorScheme.success}
                      onChange={(e) => updateField('colorScheme.success', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Warning Color</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      className={styles.colorPicker}
                      value={formData.colorScheme.warning}
                      onChange={(e) => updateField('colorScheme.warning', e.target.value)}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      className={styles.colorText}
                      value={formData.colorScheme.warning}
                      onChange={(e) => updateField('colorScheme.warning', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Error Color</label>
                  <div className={styles.colorInputGroup}>
                    <input
                      type="color"
                      className={styles.colorPicker}
                      value={formData.colorScheme.error}
                      onChange={(e) => updateField('colorScheme.error', e.target.value)}
                      disabled={isLoading}
                    />
                    <input
                      type="text"
                      className={styles.colorText}
                      value={formData.colorScheme.error}
                      onChange={(e) => updateField('colorScheme.error', e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>
            )}
            </div>
            
            {/* Preview Pane */}
            <div className={styles.previewPane}>
              <StylePreview style={formData} />
            </div>
          </div>
    </FormModal>
  );
}
