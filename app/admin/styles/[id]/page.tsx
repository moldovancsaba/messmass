/* WHAT: Report Style Editor with Live Preview
 * WHY: Edit all 26 color properties with real-time visual feedback
 * HOW: Split layout - preview left, color fields right */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import ColorPickerField from '@/components/ColorPickerField';
import ReportStylePreview from '@/components/ReportStylePreview';
import MaterialIcon from '@/components/MaterialIcon';
import { apiPost, apiPut } from '@/lib/apiClient';
import { 
  ReportStyle, 
  DEFAULT_STYLE, 
  withEffectiveStyleDefaults,
  COLOR_FIELDS, 
  DIMENSION_FIELDS,
  validateStyle,
  injectStyleAsCSS,
  removeStyleCSS
} from '@/lib/reportStyleTypes';
import { useAvailableFonts } from '@/hooks/useAvailableFonts';
import { HEX8_OPAQUE_BLACK } from '@/lib/theme/color';
import styles from './editor.module.css';

export default function StyleEditorPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const isNew = id === 'new';

  const [style, setStyle] = useState<ReportStyle>(DEFAULT_STYLE as ReportStyle);
  // WHAT: Free-text filter across every field's label, key and description.
  const [fieldFilter, setFieldFilter] = useState('');
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
      
      const merged = withEffectiveStyleDefaults({ ...DEFAULT_STYLE, ...data.style });
      setStyle(merged);
      injectStyleAsCSS(merged);
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

  // WHAT: Inject current style into document whenever it changes so Live Preview and CSS var consumers update
  // WHY: Preview and report bars use var(--barColor1) etc.; without this, edits don't show until save/reload
  useEffect(() => {
    injectStyleAsCSS(style);
    return () => removeStyleCSS();
  }, [style]);

  const handleChange = (field: keyof ReportStyle, value: string) => {
    const next = { ...style, [field]: value };
    setStyle(next);
    setSaveStatus('');
    // WHAT: Inject immediately so preview and any getComputedStyle readers see new values on same paint
    injectStyleAsCSS(next);
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
        <UnifiedAdminHeroWithSearch 
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
        <UnifiedAdminHeroWithSearch 
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

  // WHAT: Split the 54 fields into Report and Landing scopes, then group by
  //   category within each.
  // WHY: Landing-only fields are irrelevant while styling a report and vice
  //   versa, but they were interleaved in one flat scroll, so finding a single
  //   field meant scanning every group. Scope first, then category, then filter.
  const isLanding = (category: string) => category.toLowerCase().startsWith('landing');

  const q = fieldFilter.trim().toLowerCase();
  type FilterableField = { category: string; label: string; key: string; description?: string };
  const matches = (f: FilterableField) =>
    !q || f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) ||
    (f.description ?? '').toLowerCase().includes(q);

  const groupBy = <T extends FilterableField>(items: readonly T[], landing: boolean) => {
    const wanted = items.filter(f => isLanding(f.category) === landing);
    const cats = Array.from(new Set(wanted.map(f => f.category)));
    return cats
      .map(cat => ({ category: cat, fields: wanted.filter(f => f.category === cat && matches(f)) }))
      .filter(g => g.fields.length > 0);
  };

  const reportColors = groupBy(COLOR_FIELDS, false);
  const landingColors = groupBy(COLOR_FIELDS, true);
  const reportDims = groupBy(DIMENSION_FIELDS, false);
  const landingDims = groupBy(DIMENSION_FIELDS, true);
  const totalMatches =
    [...reportColors, ...landingColors, ...reportDims, ...landingDims]
      .reduce((n, g) => n + g.fields.length, 0);

  // WHAT: One scope (Report or Landing) as collapsible category sections.
  // WHY: <details> gives keyboard support and open/close for free; sections are
  //   forced open while a filter is active so matches are never hidden inside a
  //   collapsed group.
  const renderScope = (
    title: string,
    colorGroups: { category: string; fields: typeof COLOR_FIELDS }[],
    dimGroups: { category: string; fields: typeof DIMENSION_FIELDS }[]
  ) => {
    const count =
      colorGroups.reduce((n, g) => n + g.fields.length, 0) +
      dimGroups.reduce((n, g) => n + g.fields.length, 0);
    if (count === 0) return null;
    const forceOpen = fieldFilter.trim().length > 0;
    return (
      <section className={styles.scope} key={title}>
        <h4 className={styles.scopeTitle}>{title} <span className={styles.scopeCount}>{count}</span></h4>
        {colorGroups.map(({ category, fields }) => (
          <details key={category} className={styles.category} open={forceOpen || !title.startsWith('Landing')}>
            <summary className={styles.categoryTitle}>
              {category} <span className={styles.scopeCount}>{fields.length}</span>
            </summary>
            <div className={styles.categoryFields}>
              {fields.map(field => (
                <ColorPickerField
                  key={field.key}
                  label={field.label}
                  description={field.description}
                  value={style[field.key] || HEX8_OPAQUE_BLACK}
                  onChange={(value) => handleChange(field.key, value)}
                />
              ))}
            </div>
          </details>
        ))}
        {dimGroups.map(({ category, fields }) => (
          <details key={category} className={styles.category} open={forceOpen}>
            <summary className={styles.categoryTitle}>
              {category} <span className={styles.scopeCount}>{fields.length}</span>
            </summary>
            <div className={styles.categoryFields}>
              {fields.map(field => (
                <div key={field.key} className={styles.formGroup}>
                  <label className={styles.label} htmlFor={`dim-${field.key}`}>{field.label}</label>
                  <input
                    id={`dim-${field.key}`}
                    type="text"
                    value={style[field.key] ?? field.default}
                    onChange={(e) => handleChange(field.key, e.target.value)}
                    placeholder={field.placeholder ?? field.default}
                    className={styles.textInput}
                  />
                  {field.description && <small className={styles.hint}>{field.description}</small>}
                </div>
              ))}
            </div>
          </details>
        ))}
      </section>
    );
  };

  return (
    <div className={styles.container}>
      <UnifiedAdminHeroWithSearch 
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

          {/* WHAT: One filter across all 54 fields. WHY: scrolling nine
              categories to find a single colour was the main complaint. */}
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="field-filter">Find a setting</label>
            <input
              id="field-filter"
              type="search"
              value={fieldFilter}
              onChange={(e) => setFieldFilter(e.target.value)}
              placeholder="e.g. background, title, bar"
              className={styles.textInput}
            />
            {fieldFilter.trim() && (
              <small className={styles.hint}>
                {totalMatches} {totalMatches === 1 ? 'setting' : 'settings'} match
              </small>
            )}
          </div>

          {renderScope('Report', reportColors, reportDims)}
          {renderScope('Landing page', landingColors, landingDims)}
        </div>
      </div>
    </div>
  );
}
