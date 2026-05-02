/**
 * not-found.tsx
 * 
 * Next.js 13+ App Directory Not Found page
 * Handles 404 errors and provides user-friendly messaging
 * 
 * This file is required by Next.js app directory structure
 * to prevent ENOENT errors on missing routes
 */

import { Metadata } from 'next';
import Link from 'next/link';
import styles from './not-found.module.css';

export const metadata: Metadata = {
  title: '404 - Page Not Found | {messmass}',
  description: 'The page you are looking for could not be found.',
};

export default function NotFound() {
  return (
    <div className="error-container">
      <div className={`card card-lg ${styles.card}`}>
        <div className="card-body">
          <div className={styles.icon}>
            🔍
          </div>
          <h1 className={styles.title}>
            Page Not Found
          </h1>
          <p className={styles.description}>
            The page you are looking for could not be found. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          <div className={styles.actions}>
            <Link
              href="/"
              className="btn btn-primary"
            >
              🏠 Go Home
            </Link>
            <Link
              href="/admin"
              className="btn btn-secondary"
            >
              ⚙️ Admin Panel
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
