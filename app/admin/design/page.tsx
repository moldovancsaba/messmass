'use client';

import React, { useState, useEffect } from 'react';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
import styles from './Design.module.css';
import { apiPut } from '@/lib/apiClient';
import MaterialIcon from '@/components/MaterialIcon';
import adminStyles from '@/app/styles/admin-pages.module.css';

export default function AdminDesignPage() {
  const [selectedFont, setSelectedFont] = useState<'inter' | 'roboto' | 'poppins' | 'montserrat' | 'asroma'>('inter');
  const [fontLoading, setFontLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch('/api/admin/ui-settings');
        const data = await response.json();
        if (data.fontFamily) setSelectedFont(data.fontFamily);
      } catch (e) {
        console.error('Failed to load typography settings:', e);
      }
    })();
  }, []);

  const saveFont = async (font: 'inter' | 'roboto' | 'poppins' | 'montserrat' | 'asroma') => {
    setFontLoading(true);
    try {
      const data = await apiPut('/api/admin/ui-settings', { fontFamily: font });
      if (!data.success) throw new Error(data.error || 'Failed to save font');
      setSelectedFont(font);
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
          <div style={{ padding: '1rem' }}>
            <h3>Temporary Notice</h3>
            <p>The existing style editor and per-page style application have been removed. Reports use system defaults for now.</p>
          </div>
        </ColoredCard>
      </div>

      <div className={styles.section}>
        <h3>Typography (Global)</h3>
        <div className={adminStyles.row}>
          {[ 'inter','roboto','poppins','montserrat','asroma' ].map((f) => (
            <button key={f} className={adminStyles.button} disabled={fontLoading} onClick={() => saveFont(f as any)}>
              <MaterialIcon name={selectedFont === f ? 'check' : 'text_fields'} /> {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
