'use client';

import React, { useState, useEffect } from 'react';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
import styles from './Design.module.css';
import { apiPut } from '@/lib/apiClient';
import MaterialIcon from '@/components/MaterialIcon';
import adminStyles from '@/app/styles/admin-pages.module.css';
import { useAvailableFonts } from '@/hooks/useAvailableFonts';
import { AvailableFont } from '@/lib/fontTypes';
import { getFontKey } from '@/lib/fontUtils';

export default function AdminDesignPage() {
  // WHAT: Fetch available fonts from MongoDB (dynamic, no hardcoding)
  // WHY: Font list is managed in database, not hardcoded
  const { fonts: availableFonts, loading: fontsLoading } = useAvailableFonts();
  const [selectedFont, setSelectedFont] = useState<string>('inter');
  const [fontLoading, setFontLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/admin/ui-settings');
        const data = await response.json();
        if (data.fontFamily) {
          // WHAT: Map font name to lowercase for compatibility
          // WHY: API stores lowercase, but we display proper names
          setSelectedFont(data.fontFamily.toLowerCase());
        }
      } catch (e) {
        console.error('Failed to load typography settings:', e);
      }
    })();
  }, []);

  // WHAT: Get font key from font name (for API compatibility)
  // WHY: API expects lowercase keys, but fonts have display names
  const getFontKeyFromFont = (font: AvailableFont): string => {
    return getFontKey(font.name);
  };

  const saveFont = async (fontKey: string) => {
    setFontLoading(true);
    try {
      const data = await apiPut('/api/admin/ui-settings', { fontFamily: fontKey });
      if (!data.success) throw new Error(data.error || 'Failed to save font');
      setSelectedFont(fontKey);
    } catch (e) {
      console.error('Failed to save font:', e);
    } finally {
      setFontLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <AdminHero title="Design & Styles" subtitle="Style editor disabled — rebuilding from scratch." />
      <div className={styles.section}>
        <ColoredCard accentColor="#3b82f6">
          {/* WHAT: Inline padding for temporary notice card - WHY: Temporary component, no need for CSS module */}
          {/* eslint-disable-next-line react/forbid-dom-props */}
          <div style={{ padding: '1rem' }}>
            <h3>Temporary Notice</h3>
            <p>The existing style editor and per-page style application have been removed. Reports use system defaults for now.</p>
          </div>
        </ColoredCard>
      </div>

      <div className={styles.section}>
        <h3>Typography (Global)</h3>
        {fontsLoading ? (
          <p>Loading available fonts...</p>
        ) : availableFonts.length > 0 ? (
          <div className={adminStyles.row}>
            {availableFonts.map((font) => {
              const fontKey = getFontKeyFromFont(font);
              const isSelected = selectedFont === fontKey;
              return (
                <button 
                  key={font._id || font.name} 
                  className={adminStyles.button} 
                  disabled={fontLoading} 
                  onClick={() => saveFont(fontKey)}
                >
                  <MaterialIcon name={isSelected ? 'check' : 'text_fields'} /> {font.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p>No fonts available. Please add fonts in the database.</p>
        )}
      </div>
    </div>
  );
}
