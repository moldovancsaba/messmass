import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import ColoredCard from '@/components/ColoredCard';
import LandingKPIChart from '@/components/LandingKPIChart';
import ContactForm from '@/components/ContactForm';
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
          <div className={styles.heroLogo}>
            <Image src="/messmass-logo-white.png" alt="MessMass" width={160} height={48} priority />
          </div>
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
          <div className={styles.beliefGrid}>
            <LandingKPIChart
              title="Private"
              value="Strictly proprietary."
              icon="lock"
              accentColor="var(--mm-color-primary-500)"
            />
            <LandingKPIChart
              title="Actionable"
              value="Ready for immediate action."
              icon="bolt"
              accentColor="var(--mm-color-secondary-500)"
            />
            <LandingKPIChart
              title="Secure"
              value="100% safe."
              icon="shield"
              accentColor="var(--mm-success)"
            />
          </div>
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
            <LandingKPIChart
              title="Insight → Action gap"
              value="Data abundance, but processing is often manual and slow."
              icon="trending_up"
              accentColor="var(--mm-color-primary-500)"
            />
            <LandingKPIChart
              title="Compliance fear"
              value="PII and KYC data cannot go to public cloud AIs (e.g. ChatGPT)."
              icon="gpp_bad"
              accentColor="var(--mm-warning)"
            />
            <LandingKPIChart
              title="The reality"
              value="If employees use cloud models secretly, that's a breach. If management bans it, growth slows."
              icon="campaign"
              accentColor="var(--mm-info)"
            />
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
            <LandingKPIChart
              title="1. Ingest & process"
              value="Automated data ingestion and cleaning."
              accentColor="var(--mm-color-primary-500)"
            />
            <LandingKPIChart
              title="2. Interpret"
              value="Trends and anomalies powered by a local AI engine."
              accentColor="var(--mm-color-primary-500)"
            />
            <LandingKPIChart
              title="3. Act"
              value="Decision points, personas, playbooks, and task delegation."
              accentColor="var(--mm-color-primary-500)"
            />
            <LandingKPIChart
              title="4. Governance"
              value="100% auditability and access control. Every byte stays where it belongs."
              accentColor="var(--mm-color-primary-500)"
            />
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

      {/* Contact */}
      <ContactForm />

      {/* Final CTA */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>
            <Image src="/messmass-logo-white.png" alt="MessMass" width={120} height={36} />
          </div>
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
