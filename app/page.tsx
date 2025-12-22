import Link from 'next/link';
import styles from './page.module.css';

/**
 * WHAT: Public landing page for MessMass
 * WHY: Root URL should be accessible without authentication
 * HOW: Simple welcome page with link to admin panel
 */
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>MessMass</h1>
        <p className={styles.subtitle}>Event Statistics Dashboard</p>
        <Link href="/admin" className={styles.button}>
          Go to Admin Panel
        </Link>
      </div>
    </div>
  );
}
