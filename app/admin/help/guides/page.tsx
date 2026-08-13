// WHAT: Online reader index for the user guides (renders docs/guides/guides-tutorials-index.md).
// WHY: Lets operators read the tutorial learning path in-app; individual guides live at
//      /admin/help/guides/[slug]. Static (SSG): the markdown is read at build time.
import Link from 'next/link';
import { getGuidesIndex } from '@/lib/guides';
import styles from './guides.module.css';

export const dynamic = 'force-static';

export const metadata = {
  title: 'User Guides',
};

export default async function GuidesIndexPage() {
  const guide = await getGuidesIndex();

  return (
    <div className="page-container">
      <div className={styles.wrapper}>
        <Link href="/admin/help" className={styles.back}>← Back to Help</Link>
        {guide ? (
          <article className={styles.prose} dangerouslySetInnerHTML={{ __html: guide.html }} />
        ) : (
          <p>User guides are currently unavailable.</p>
        )}
      </div>
    </div>
  );
}
