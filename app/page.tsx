import Link from 'next/link';
import type { Metadata } from 'next';
import styles from './page.module.css';

/**
 * WHAT: Sales-oriented landing page for messmass.com (from pitch deck 2026-02-22)
 * WHY: Convert visitors with pitch-deck messaging; drive dashboard sign-in
 */
export const metadata: Metadata = {
  title: 'MessMass — Sovereign Decision Intelligence',
  description: 'Data privacy and agentic AI without compromises. Your data stays with you; the AI comes to it. Local-first decision intelligence for enterprises.',
  openGraph: {
    title: 'MessMass — Sovereign Decision Intelligence',
    description: 'Data privacy and agentic AI without compromises. Local-first agentic AI for data-driven companies.',
  },
};
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function HomePage() {
  return (
    <div className={styles.landing}>
      {/* Hero */}
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <p className={styles.heroLabel}>Sovereign Decision Intelligence</p>
          <h1 className={styles.heroTitle}>
            Data Privacy and Agentic AI without compromises.
          </h1>
          <p className={styles.heroSub}>
            The platform that restores the freedom and security of decision-making to data-driven companies—and opens the door for those who want to become one.
          </p>
          <div className={styles.heroCtas}>
            <Link href="/admin/login" className={styles.ctaPrimary}>
              Go to Dashboard
            </Link>
            <a href="#solution" className={styles.ctaSecondary}>
              See how it works
            </a>
          </div>
        </div>
      </header>

      {/* Core belief */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Our core belief</h2>
          <p className={styles.beliefLead}>
            You shouldn&apos;t have to choose between intelligence and security.
          </p>
          <p className={styles.beliefBody}>
            No company should hand over sensitive data to the cloud to be smart—or give up the power of AI to stay compliant. We believe in <strong>decision sovereignty</strong>: your data stays with you, and the AI comes to it.
          </p>
          <ul className={styles.pillList}>
            <li><span className={styles.pill}>Private</span> Strictly proprietary</li>
            <li><span className={styles.pill}>Actionable</span> Ready for immediate action</li>
            <li><span className={styles.pill}>Secure</span> 100% safe</li>
          </ul>
        </div>
      </section>

      {/* Problem */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>The cost of decision paralysis</h2>
          <p className={styles.problemLead}>
            Teams are paralyzed. We have data, but we lack the courage to use the tools that could interpret it.
          </p>
          <div className={styles.problemGrid}>
            <div className={styles.problemCard}>
              <span className={styles.problemIcon}>↗</span>
              <h3>Insight → Action gap</h3>
              <p>Data abundance, but processing is often manual and slow.</p>
            </div>
            <div className={styles.problemCard}>
              <span className={styles.problemIcon}>⚠</span>
              <h3>Compliance fear</h3>
              <p>PII and KYC data cannot go to public cloud AIs (e.g. ChatGPT).</p>
            </div>
            <div className={styles.problemCard}>
              <span className={styles.problemIcon}>◉</span>
              <h3>The reality</h3>
              <p>If employees use cloud models secretly, that&apos;s a breach. If management bans it, growth slows.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution */}
      <section id="solution" className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>The solution: local-first agentic AI</h2>
          <p className={styles.solutionLead}>
            We flip the logic: <strong>the AI goes to the data, not the data to the AI.</strong>
          </p>
          <p className={styles.solutionBody}>
            We bring local AI agents directly into your secure infrastructure. The data doesn&apos;t move; the intelligence runs locally. Proactive decision-making processes, not passive dashboards—without the compliance nightmare.
          </p>
          <div className={styles.solutionHighlights}>
            <div className={styles.highlight}>
              <span className={styles.highlightNum}>1</span>
              <span>Local-first: physically isolated (offline/boxed) models perform the analysis.</span>
            </div>
            <div className={styles.highlight}>
              <span className={styles.highlightNum}>2</span>
              <span>Automated workflow: users get proactive decision-making, not passive dashboards.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>The messmass platform</h2>
          <div className={styles.productGrid}>
            <div className={styles.productCard}>
              <h3>1. Ingest &amp; process</h3>
              <p>Automated data ingestion and cleaning.</p>
            </div>
            <div className={styles.productCard}>
              <h3>2. Interpret</h3>
              <p>Trends and anomalies powered by a local AI engine.</p>
            </div>
            <div className={styles.productCard}>
              <h3>3. Act</h3>
              <p>Decision points, personas, playbooks, and task delegation.</p>
            </div>
            <div className={styles.productCard}>
              <h3>4. Governance</h3>
              <p>100% auditability and access control. Every byte stays where it belongs.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Traction */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Validated foundations, live</h2>
          <p className={styles.tractionLead}>
            The messmass data processing engine has been running live. Service-to-product is working.
          </p>
          <div className={styles.tractionGrid}>
            <div className={styles.tractionItem}>
              <span className={styles.tractionValue}>3</span>
              <span className={styles.tractionLabel}>paying clients</span>
            </div>
            <div className={styles.tractionItem}>
              <span className={styles.tractionValue}>$5k</span>
              <span className={styles.tractionLabel}>P.O.C. revenue</span>
            </div>
            <div className={styles.tractionItem}>
              <span className={styles.tractionValue}>7</span>
              <span className={styles.tractionLabel}>avg data sources per client</span>
            </div>
            <div className={styles.tractionItem}>
              <span className={styles.tractionValue}>300+</span>
              <span className={styles.tractionLabel}>managed data types</span>
            </div>
            <div className={styles.tractionItem}>
              <span className={styles.tractionValue}>1,000+</span>
              <span className={styles.tractionLabel}>automated decision points</span>
            </div>
            <div className={styles.tractionItem}>
              <span className={styles.tractionValue}>100+</span>
              <span className={styles.tractionLabel}>AI-generated micro-personas</span>
            </div>
          </div>
        </div>
      </section>

      {/* Differentiator */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Why messmass</h2>
          <p className={styles.diffLead}>
            BI tools are secure but passive. Cloud AI is proactive but no DPO will allow PII. <strong>messmass is the only player that brings proactive AI with physical hardware isolation.</strong>
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <h2 className={styles.footerTitle}>
            Let&apos;s build the era of sovereign enterprise AI together.
          </h2>
          <Link href="/admin/login" className={styles.ctaPrimary}>
            Start using the system
          </Link>
          <p className={styles.footerSite}>messmass.com</p>
        </div>
      </footer>
    </div>
  );
}
