// WHAT: Online reader for a single user guide (renders docs/guides/guides-tutorial-<slug>.md).
// WHY: Makes the canonical tutorial markdown readable in-app. Static (SSG) — only the known
//      guide slugs are prerendered (dynamicParams=false), so unknown paths 404.
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getGuide, listGuideSlugs } from '@/lib/guides';
import styles from '../guides.module.css';

export const dynamic = 'force-static';
export const dynamicParams = false;

export async function generateStaticParams() {
  const slugs = await listGuideSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  return { title: guide ? guide.title : 'User Guide' };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = await getGuide(slug);
  if (!guide) notFound();

  return (
    <div className="page-container">
      <div className={styles.wrapper}>
        <Link href="/admin/help/guides" className={styles.back}>← All guides</Link>
        <article className={styles.prose} dangerouslySetInnerHTML={{ __html: guide.html }} />
      </div>
    </div>
  );
}
