'use client';

import { useState, useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import UnifiedAdminHeroWithSearch from '@/components/UnifiedAdminHeroWithSearch';
import type { ContactInquiry } from '@/lib/contactInquiries';
import adminStyles from '@/app/styles/admin-pages.module.css';
import styles from './page.module.css';

export default function AdminMessagesPage() {
  const { user, loading: authLoading } = useAdminAuth();
  const [inquiries, setInquiries] = useState<ContactInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchInquiries = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/contact-inquiries', { cache: 'no-store' });
        const data = await res.json();
        if (data.success) {
          setInquiries(data.inquiries || []);
          setError(null);
        } else {
          setError(data.error || 'Failed to load inquiries');
        }
      } catch (err) {
        console.error('Failed to fetch inquiries:', err);
        setError('Failed to load inquiries');
      } finally {
        setLoading(false);
      }
    };
    fetchInquiries();
  }, [user]);

  if (authLoading || !user) {
    return null;
  }

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        dateStyle: 'short',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="page-container">
      <UnifiedAdminHeroWithSearch
        title="Messages"
        subtitle="Contact form inquiries from the website"
        backLink="/admin"
      />
      {error && (
        <div className={adminStyles.errorContainer}>
          <p className={adminStyles.errorText}>{error}</p>
        </div>
      )}
      {loading && inquiries.length === 0 ? (
        <p className={styles.loading}>Loading inquiries…</p>
      ) : inquiries.length === 0 ? (
        <p className={styles.empty}>No inquiries yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Name</th>
                <th>Email</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((row) => (
                <tr key={row._id}>
                  <td className={styles.cellDate}>{formatDate(row.createdAt)}</td>
                  <td>{row.name}</td>
                  <td>
                    <a href={`mailto:${row.email}`} className={styles.emailLink}>
                      {row.email}
                    </a>
                  </td>
                  <td className={styles.cellMessage}>{row.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
