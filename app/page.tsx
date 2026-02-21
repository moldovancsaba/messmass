import Link from 'next/link';
import type { Metadata } from 'next';
import ColoredCard from '@/components/ColoredCard';
import MaterialIcon from '@/components/MaterialIcon';
import styles from './page.module.css';

/**
 * WHAT: Sales-oriented landing page for messmass.com (from pitch deck 2026-02-22)
 * WHY: Convert visitors with pitch-deck messaging; drive dashboard sign-in
 * HOW: Uses layout grammar and unified style system (ColoredCard, .btn, KPI-style cards, MaterialIcon, design tokens)
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
            <Link href="/admin/login" className="btn btn-primary">
              Go to Dashboard
            </Link>
            <a href="#solution" className="btn btn-outline-light">
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

      {/* Problem — KPI-style cards (layout grammar) */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>The cost of decision paralysis</h2>
          <p className={styles.problemLead}>
            Teams are paralyzed. We have data, but we lack the courage to use the tools that could interpret it.
          </p>
          <div className={styles.problemGrid}>
            <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
              <div className={styles.kpiCardContent}>
                <div className={styles.kpiCardHeader}>
                  <MaterialIcon name="trending_up" className={styles.kpiCardIcon} />
                  <h3 className={styles.kpiCardTitle}>Insight → Action gap</h3>
                </div>
                <p className={styles.kpiCardValue}>Data abundance, but processing is often manual and slow.</p>
              </div>
            </ColoredCard>
            <ColoredCard accentColor="var(--mm-warning)" hoverable={false}>
              <div className={styles.kpiCardContent}>
                <div className={styles.kpiCardHeader}>
                  <MaterialIcon name="gpp_bad" className={styles.kpiCardIcon} />
                  <h3 className={styles.kpiCardTitle}>Compliance fear</h3>
                </div>
                <p className={styles.kpiCardValue}>PII and KYC data cannot go to public cloud AIs (e.g. ChatGPT).</p>
              </div>
            </ColoredCard>
            <ColoredCard accentColor="var(--mm-info)" hoverable={false}>
              <div className={styles.kpiCardContent}>
                <div className={styles.kpiCardHeader}>
                  <MaterialIcon name="campaign" className={styles.kpiCardIcon} />
                  <h3 className={styles.kpiCardTitle}>The reality</h3>
                </div>
                <p className={styles.kpiCardValue}>If employees use cloud models secretly, that&apos;s a breach. If management bans it, growth slows.</p>
              </div>
            </ColoredCard>
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
            <ColoredCard accentColor="var(--mm-color-secondary-500)" hoverable={false}>
              <div className={styles.highlightRow}>
                <span className={styles.highlightNum}>1</span>
                <span>Local-first: physically isolated (offline/boxed) models perform the analysis.</span>
              </div>
            </ColoredCard>
            <ColoredCard accentColor="var(--mm-color-secondary-500)" hoverable={false}>
              <div className={styles.highlightRow}>
                <span className={styles.highlightNum}>2</span>
                <span>Automated workflow: users get proactive decision-making, not passive dashboards.</span>
              </div>
            </ColoredCard>
          </div>
        </div>
      </section>

      {/* Product — KPI-style cards */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>The messmass platform</h2>
          <div className={styles.productGrid}>
            <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
              <div className={styles.kpiCardContent}>
                <h3 className={styles.kpiCardTitle}>1. Ingest &amp; process</h3>
                <p className={styles.kpiCardValue}>Automated data ingestion and cleaning.</p>
              </div>
            </ColoredCard>
            <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
              <div className={styles.kpiCardContent}>
                <h3 className={styles.kpiCardTitle}>2. Interpret</h3>
                <p className={styles.kpiCardValue}>Trends and anomalies powered by a local AI engine.</p>
              </div>
            </ColoredCard>
            <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
              <div className={styles.kpiCardContent}>
                <h3 className={styles.kpiCardTitle}>3. Act</h3>
                <p className={styles.kpiCardValue}>Decision points, personas, playbooks, and task delegation.</p>
              </div>
            </ColoredCard>
            <ColoredCard accentColor="var(--mm-color-primary-500)" hoverable={false}>
              <div className={styles.kpiCardContent}>
                <h3 className={styles.kpiCardTitle}>4. Governance</h3>
                <p className={styles.kpiCardValue}>100% auditability and access control. Every byte stays where it belongs.</p>
              </div>
            </ColoredCard>
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
          <Link href="/admin/login" className="btn btn-primary">
            Start using the system
          </Link>
          <p className={styles.footerSite}>messmass.com</p>
        </div>
      </footer>
    </div>
  );
}
