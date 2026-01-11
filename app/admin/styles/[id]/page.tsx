/* WHAT: Report Style Editor with Live Preview
 * WHY: Edit all 26 color properties with real-time visual feedback
 * HOW: Split layout - preview left, color fields right */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import AdminHero from '@/components/AdminHero';
import ColorPickerField from '@/components/ColorPickerField';
import ReportStylePreview from '@/components/ReportStylePreview';
import MaterialIcon from '@/components/MaterialIcon';
import { apiPost, apiPut } from '@/lib/apiClient';
import { 
  ReportStyle, 
  DEFAULT_STYLE, 
  COLOR_FIELDS, 
  validateStyle,
  injectStyleAsCSS,
  removeStyleCSS
} from '@/lib/reportStyleTypes';
import { useAvailableFonts } from '@/hooks/useAvailableFonts';
import styles from './editor.module.css';

export default function StyleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';

  const [style, setStyle] = useState<ReportStyle>(DEFAULT_STYLE as ReportStyle);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<string>('');
  
  // WHAT: Fetch available fonts from MongoDB (dynamic, no hardcoding)
  // WHY: Font list is managed in database, not hardcoded
  const { fonts: availableFonts, loading: fontsLoading } = useAvailableFonts();

  // Fetch existing style
  const fetchStyle = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/report-styles/${id}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch style');
      }
      
      // WHAT: Merge fetched style with DEFAULT_STYLE
      // WHY: Ensures all color fields exist (backward compatibility with old styles)
      // HOW: Spread DEFAULT_STYLE first, then override with fetched values
      setStyle({ ...DEFAULT_STYLE, ...data.style });
    } catch (err) {
      console.error('Failed to fetch style:', err);
      setError(err instanceof Error ? err.message : 'Failed to load style');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch existing style on mount
  useEffect(() => {
    if (!isNew) {
      fetchStyle();
    }
  }, [isNew, fetchStyle]);

  const handleChange = (field: keyof ReportStyle, value: string) => {
    setStyle(prev => ({ ...prev, [field]: value }));
    setSaveStatus(''); // Clear status on change
  };

  const handleSave = async () => {
    // Validate
    const validation = validateStyle(style);
    if (!validation.valid) {
      setSaveStatus('❌ ' + validation.errors[0]);
      return;
    }

    setSaving(true);
    setSaveStatus('💾 Saving...');
    
    try {
      // WHAT: Use apiPost/apiPut for CSRF protection
      // WHY: Raw fetch() doesn't include CSRF token, causing 403 errors
      const data = isNew
        ? await apiPost('/api/report-styles', style)
        : await apiPut(`/api/report-styles?id=${id}`, style);
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save style');
      }
      
      setSaveStatus('✅ Saved!');
      
      // If new, redirect to edit page
      if (isNew && data.styleId) {
        setTimeout(() => {
          router.push(`/admin/styles/${data.styleId}`);
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to save style:', err);
      setSaveStatus('❌ ' + (err instanceof Error ? err.message : 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (confirm('Discard changes?')) {
      router.push('/admin/styles');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <AdminHero 
          title={isNew ? 'Create Style' : 'Edit Style'} 
          subtitle="Loading..." 
        />
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading style...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <AdminHero 
          title={isNew ? 'Create Style' : 'Edit Style'} 
          subtitle="Error" 
        />
        <div className={styles.error}>
          <MaterialIcon name="error" variant="outlined" />
          <p>{error}</p>
          <button onClick={() => router.push('/admin/styles')} className={styles.backButton}>
            Back to Styles
          </button>
        </div>
      </div>
    );
  }

  // Group fields by category
  const categories = Array.from(new Set(COLOR_FIELDS.map(f => f.category)));
  const fieldsByCategory = categories.map(cat => ({
    category: cat,
    fields: COLOR_FIELDS.filter(f => f.category === cat)
  }));

  return (
    <div className={styles.container}>
      <AdminHero 
        title={isNew ? 'Create New Style' : `Edit: ${style.name}`}
        subtitle="Customize colors with live preview"
      />

      {/* Save/Cancel Actions */}
      <div className={styles.actions}>
        <button onClick={handleCancel} className={styles.cancelButton} disabled={saving}>
          <MaterialIcon name="close" variant="outlined" />
          Cancel
        </button>
        {saveStatus && (
          <span className={styles.saveStatus}>{saveStatus}</span>
        )}
        <button onClick={handleSave} className={styles.saveButton} disabled={saving}>
          <MaterialIcon name="save" variant="outlined" />
          {saving ? 'Saving...' : 'Save Style'}
        </button>
      </div>

      {/* Split Layout: Preview | Form */}
      <div className={styles.splitLayout}>
        {/* Left: Live Preview */}
        <div className={styles.previewPanel}>
          <div className={styles.panelHeader}>
            <MaterialIcon name="visibility" variant="outlined" />
            <h3>Live Preview</h3>
          </div>
          <div className={styles.previewContainer}>
            <ReportStylePreview style={style} />
          </div>
        </div>

        {/* Right: Color Fields */}
        <div className={styles.formPanel}>
          <div className={styles.panelHeader}>
            <MaterialIcon name="palette" variant="outlined" />
            <h3>Colors</h3>
          </div>
          
          {/* Name & Description */}
          <div className={styles.basicFields}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Style Name *</label>
              <input
                type="text"
                value={style.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="My Custom Style"
                className={styles.textInput}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Description</label>
              <textarea
                value={style.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                placeholder="Optional description"
                rows={2}
                className={styles.textArea}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Font Family</label>
              <select
                value={style.fontFamily || 'Inter'}
                onChange={(e) => handleChange('fontFamily', e.target.value)}
                className={styles.selectInput}
                disabled={fontsLoading}
              >
                {fontsLoading ? (
                  <option>Loading fonts...</option>
                ) : availableFonts.length > 0 ? (
                  availableFonts.map(font => (
                    <option key={font._id || font.name} value={font.name}>
                      {font.name}
                    </option>
                  ))
                ) : (
                  <option value="Inter">Inter (default)</option>
                )}
              </select>
              <small className={styles.hint}>
                {fontsLoading 
                  ? 'Loading available fonts...' 
                  : `Font used for all text in reports (${availableFonts.length} available)`}
              </small>
            </div>
          </div>

          {/* Color Fields by Category */}
          <div className={styles.colorFields}>
            {fieldsByCategory.map(({ category, fields }) => (
              <div key={category} className={styles.category}>
                <h4 className={styles.categoryTitle}>{category}</h4>
                <div className={styles.categoryFields}>
                  {fields.map(field => (
                    <ColorPickerField
                      key={field.key}
                      label={field.label}
                      description={field.description}
                      value={style[field.key] || '#000000ff'}
                      onChange={(value) => handleChange(field.key, value)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
