/* WHAT: Report Styles List Page
 * WHY: Manage all report styles - view, create, edit, delete
 * HOW: Fetch from API, display in grid, navigate to editor */

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminHero from '@/components/AdminHero';
import ColoredCard from '@/components/ColoredCard';
import MaterialIcon from '@/components/MaterialIcon';
import { ReportStyle } from '@/lib/reportStyleTypes';
import styles from './styles.module.css';

export default function StylesListPage() {
  const router = useRouter();
  const [stylesList, setStylesList] = useState<ReportStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteStatus, setDeleteStatus] = useState<string>('');

  useEffect(() => {
    fetchStyles();
  }, []);

  const fetchStyles = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/report-styles');
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch styles');
      }
      
      setStylesList(data.styles || []);
    } catch (err) {
      console.error('Failed to fetch styles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load styles');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    router.push('/admin/styles/new');
  };

  const handleEdit = (id: string) => {
    router.push(`/admin/styles/${id}`);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete style "${name}"? This cannot be undone.`)) {
      return;
    }

    setDeleteStatus('Deleting...');
    try {
      const response = await fetch(`/api/report-styles?id=${id}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete style');
      }
      
      setDeleteStatus('✅ Deleted!');
      setTimeout(() => setDeleteStatus(''), 2000);
      
      // Refresh list
      fetchStyles();
    } catch (err) {
      console.error('Failed to delete style:', err);
      setDeleteStatus('❌ Error');
      setTimeout(() => setDeleteStatus(''), 3000);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <AdminHero title="Report Styles" subtitle="Loading..." />
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>Loading styles...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <AdminHero title="Report Styles" subtitle="Error loading styles" />
        <ColoredCard accentColor="#ef4444">
          <div className={styles.error}>
            <MaterialIcon name="error" variant="outlined" />
            <p>{error}</p>
            <button onClick={fetchStyles} className={styles.retryButton}>
              Retry
            </button>
          </div>
        </ColoredCard>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <AdminHero 
        title="Report Styles" 
        subtitle="Manage color themes for report pages"
      />

      <div className={styles.header}>
        <div className={styles.headerInfo}>
          <p className={styles.count}>
            {stylesList.length} {stylesList.length === 1 ? 'style' : 'styles'}
          </p>
          {deleteStatus && (
            <span className={styles.deleteStatus}>{deleteStatus}</span>
          )}
        </div>
        <button onClick={handleCreate} className={styles.createButton}>
          <MaterialIcon name="add" variant="outlined" />
          Create New Style
        </button>
      </div>

      {stylesList.length === 0 ? (
        <ColoredCard accentColor="#3b82f6">
          <div className={styles.empty}>
            <MaterialIcon name="palette" variant="outlined" className={styles.emptyIcon} />
            <h3>No Styles Yet</h3>
            <p>Create your first report style to customize colors</p>
            <button onClick={handleCreate} className={styles.createButtonLarge}>
              <MaterialIcon name="add" variant="outlined" />
              Create First Style
            </button>
          </div>
        </ColoredCard>
      ) : (
        <div className={styles.grid}>
          {stylesList.map((style) => (
            <ColoredCard key={style._id} accentColor={style.chartTitleColor || '#3b82f6'} hoverable>
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{style.name}</h3>
                  {style.description && (
                    <p className={styles.cardDescription}>{style.description}</p>
                  )}
                </div>

                {/* Color Preview */}
                <div className={styles.colorPreview}>
                  <div className={styles.colorRow}>
                    <ColorSwatch color={style.heroBackground} label="Hero" />
                    <ColorSwatch color={style.chartBackground} label="Chart" />
                    <ColorSwatch color={style.kpiIconColor} label="Icon" />
                  </div>
                  <div className={styles.colorRow}>
                    <ColorSwatch color={style.barColor1} label="Bar 1" />
                    <ColorSwatch color={style.barColor2} label="Bar 2" />
                    <ColorSwatch color={style.pieColor1} label="Pie" />
                  </div>
                </div>

                {/* Actions */}
                <div className={styles.cardActions}>
                  <button 
                    onClick={() => handleEdit(style._id!)}
                    className={styles.editButton}
                  >
                    <MaterialIcon name="edit" variant="outlined" />
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(style._id!, style.name)}
                    className={styles.deleteButton}
                  >
                    <MaterialIcon name="delete" variant="outlined" />
                  </button>
                </div>

                {/* Metadata */}
                {style.updatedAt && (
                  <div className={styles.metadata}>
                    Last updated: {new Date(style.updatedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </ColoredCard>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Color swatch preview component
 */
function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className={styles.swatch}>
      <div className={styles.swatchColor} style={{ backgroundColor: color }} />
      <span className={styles.swatchLabel}>{label}</span>
    </div>
  );
}
