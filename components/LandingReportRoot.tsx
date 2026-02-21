'use client';

/**
 * WHAT: Fetches landing-report (event + style + sections), applies messmass.com style as CSS vars,
 *       and renders all content from report/event (valuechain cards + copy from stats).
 * WHY: Single source of truth — all texts from event report texts; all valuechain cards from charts; style from report style.
 */

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ColoredCard from '@/components/ColoredCard';
import LandingKPIChart from '@/components/LandingKPIChart';
import ContactForm from '@/components/ContactForm';
import styles from '@/app/page.module.css';

interface ChartResult {
  chartId: string;
  type: string;
  title: string;
  icon?: string;
  iconVariant?: string;
  kpiValue?: number | string;
  elements?: Array<{ label: string; value: number | string; color?: string }>;
}

interface LandingData {
  project: { stats?: Record<string, unknown> };
  style: Record<string, string> | null;
  sections: { coreBelief: ChartResult[]; problem: ChartResult[]; product: ChartResult[] };
}

const ACCENT_COLORS = [
  'var(--mm-color-primary-500)',
  'var(--mm-color-secondary-500)',
  'var(--mm-success)',
];
const PROBLEM_ACCENTS = ['var(--mm-color-primary-500)', 'var(--mm-warning)', 'var(--mm-info)'];

function renderValueChainCards(
  results: ChartResult[],
  accentColors: string[],
  titleUppercase = false
) {
  return results.map((r, i) => {
    const el = r.type === 'valuechain' && Array.isArray(r.elements) && r.elements.length >= 2 ? r.elements : null;
    const title = el ? (typeof el[0].value === 'string' ? el[0].value : '') : r.title;
    const value = el ? (typeof el[1].value === 'string' ? el[1].value : '') : (typeof r.kpiValue === 'string' || typeof r.kpiValue === 'number' ? String(r.kpiValue) : '');
    return (
      <LandingKPIChart
        key={r.chartId}
        title={title}
        value={value}
        icon={r.icon}
        accentColor={accentColors[i % accentColors.length]}
        titleUppercase={titleUppercase}
      />
    );
  });
}

function getStat(stats: Record<string, unknown> | undefined, key: string, fallback: string): string {
  const v = stats?.[key];
  return (v !== undefined && v !== null && String(v).trim() !== '') ? String(v) : fallback;
}

export default function LandingReportRoot() {
  const [data, setData] = useState<LandingData | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/landing-report', { cache: 'no-store' })
      .then((r) => r.json())
      .then((res) => {
        if (cancelled || !res.success) return;
        setData({
          project: res.project || { stats: {} },
          style: res.style || null,
          sections: res.sections || { coreBelief: [], problem: [], product: [] },
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!data?.style || !rootRef.current) return;
    const s = data.style;
    rootRef.current.style.setProperty('--landing-hero-bg-start', s.heroBackground ?? '#0f172a');
    rootRef.current.style.setProperty('--landing-hero-bg-mid', s.heroBackground ?? '#1e293b');
    rootRef.current.style.setProperty('--landing-hero-bg-end', s.heroBackground ?? '#0f172a');
    rootRef.current.style.setProperty('--landing-hero-text', s.headingColor ?? '#f8fafc');
    rootRef.current.style.setProperty('--landing-hero-text-muted', s.textColor ?? '#cbd5e1');
  }, [data?.style]);

  const stats = data?.project?.stats as Record<string, unknown> | undefined;
  const sections = data?.sections ?? { coreBelief: [], problem: [], product: [] };

  const heroLabel = getStat(stats, 'reportTextHeroLabel', 'Sovereign Decision Intelligence');
  const heroTitle = getStat(stats, 'reportTextHeroTitle', 'Data Privacy and Agentic AI without compromises.');
  const heroSub = getStat(stats, 'reportTextHeroSub', 'The platform that restores the freedom and security of decision-making to data-driven companies—and opens the door for those who want to become one.');
  const sectionCoreTitle = getStat(stats, 'reportTextSectionCoreTitle', 'Our core belief');
  const beliefLead = getStat(stats, 'reportTextBeliefLead', "You shouldn't have to choose between intelligence and security.");
  const beliefBody = getStat(stats, 'reportTextBeliefBody', 'No company should hand over sensitive data to the cloud to be smart—or give up the power of AI to stay compliant. We believe in decision sovereignty: your data stays with you, and the AI comes to it.');
  const problemTitle = getStat(stats, 'reportTextProblemTitle', 'The cost of decision paralysis');
  const problemLead = getStat(stats, 'reportTextProblemLead', 'Teams are paralyzed. We have data, but we lack the courage to use the tools that could interpret it.');
  const solutionTitle = getStat(stats, 'reportTextSolutionTitle', 'The solution: local-first agentic AI');
  const solutionLead = getStat(stats, 'reportTextSolutionLead', 'We flip the logic: the AI goes to the data, not the data to the AI.');
  const solutionBody = getStat(stats, 'reportTextSolutionBody', "We bring local AI agents directly into your secure infrastructure. The data doesn't move; the intelligence runs locally. Proactive decision-making processes, not passive dashboards—without the compliance nightmare.");
  const productTitle = getStat(stats, 'reportTextProductTitle', 'The messmass platform');
  const diffTitle = getStat(stats, 'reportTextDiffTitle', 'Why messmass');
  const diffLead = getStat(stats, 'reportTextDiffLead', 'BI tools are secure but passive. Cloud AI is proactive but no DPO will allow PII. messmass is the only player that brings proactive AI with physical hardware isolation.');
  const footerTitle = getStat(stats, 'reportTextFooterTitle', "Let's build the era of sovereign enterprise AI together.");

  const coreBeliefCards = sections.coreBelief.length > 0
    ? renderValueChainCards(sections.coreBelief, ACCENT_COLORS)
    : (
      <>
        <LandingKPIChart title="Private" value="Strictly proprietary." icon="lock" accentColor={ACCENT_COLORS[0]} />
        <LandingKPIChart title="Actionable" value="Ready for immediate action." icon="bolt" accentColor={ACCENT_COLORS[1]} />
        <LandingKPIChart title="Secure" value="100% safe." icon="shield" accentColor={ACCENT_COLORS[2]} />
      </>
    );

  const problemCards = sections.problem.length > 0
    ? renderValueChainCards(sections.problem, PROBLEM_ACCENTS, true)
    : (
      <>
        <LandingKPIChart title="Insight → Action gap" value="Data abundance, but processing is often manual and slow." icon="trending_up" accentColor="var(--mm-color-primary-500)" titleUppercase />
        <LandingKPIChart title="Compliance fear" value="PII and KYC data cannot go to public cloud AIs (e.g. ChatGPT)." icon="gpp_bad" accentColor="var(--mm-warning)" titleUppercase />
        <LandingKPIChart title="The reality" value="If employees use cloud models secretly, that's a breach. If management bans it, growth slows." icon="campaign" accentColor="var(--mm-info)" titleUppercase />
      </>
    );

  const productCards = sections.product.length > 0
    ? renderValueChainCards(sections.product, ACCENT_COLORS)
    : (
      <>
        <LandingKPIChart title="1. Ingest & process" value="Automated data ingestion and cleaning." accentColor="var(--mm-color-primary-500)" />
        <LandingKPIChart title="2. Interpret" value="Trends and anomalies powered by a local AI engine." accentColor="var(--mm-color-primary-500)" />
        <LandingKPIChart title="3. Act" value="Decision points, personas, playbooks, and task delegation." accentColor="var(--mm-color-primary-500)" />
        <LandingKPIChart title="4. Governance" value="100% auditability and access control. Every byte stays where it belongs." accentColor="var(--mm-color-primary-500)" />
      </>
    );

  return (
    <div ref={rootRef} className={styles.landing}>
      <header className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBrand}>
            <Image src="/messmass-logo-white.png" alt="" width={160} height={48} priority />
            <span className={styles.heroSiteName}>MessMass</span>
          </div>
          <p className={styles.heroLabel}>{heroLabel}</p>
          <h1 className={styles.heroTitle}>{heroTitle}</h1>
          <p className={styles.heroSub}>{heroSub}</p>
          <div className={styles.heroCtas}>
            <Link href="/admin/login" className="btn btn-primary">Go to Dashboard</Link>
            <a href="#solution" className="btn btn-outline-light">See how it works</a>
          </div>
        </div>
      </header>

      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>{sectionCoreTitle}</h2>
          <p className={styles.beliefLead}>{beliefLead}</p>
          <p className={styles.beliefBody}>{beliefBody}</p>
          <div className={styles.beliefGrid}>{coreBeliefCards}</div>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>{problemTitle}</h2>
          <p className={styles.problemLead}>{problemLead}</p>
          <div className={styles.problemGrid}>{problemCards}</div>
        </div>
      </section>

      <section id="solution" className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>{solutionTitle}</h2>
          <p className={styles.solutionLead} dangerouslySetInnerHTML={{ __html: solutionLead.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
          <p className={styles.solutionBody}>{solutionBody}</p>
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

      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>{productTitle}</h2>
          <div className={styles.productGrid}>{productCards}</div>
        </div>
      </section>

      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>{diffTitle}</h2>
          <p className={styles.diffLead} dangerouslySetInnerHTML={{ __html: diffLead.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') }} />
        </div>
      </section>

      <section id="pricing" className={styles.section}>
        <div className={styles.sectionInner}>
          <h2 className={styles.sectionTitle}>Pricing</h2>
          <div className={styles.pricingGrid}>
            <div className={styles.pricingCard}>
              <h3 className={styles.pricingCardTitle}>Welcome</h3>
              <p className={styles.pricingCardPrice}>Free <span className={styles.pricingCardPriceSub}>forever</span></p>
              <ul className={styles.pricingCardFeatures}>
                <li>1 personal profile</li>
                <li>1 public site</li>
                <li>10 public reports</li>
                <li>Basic KYC Dataset</li>
              </ul>
              <p className={styles.pricingCardNote}>(POC required)</p>
              <div className={styles.pricingCardCta}>
                <Link href="/#contact" className="btn btn-secondary">Contact us</Link>
              </div>
            </div>
            <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
              <h3 className={styles.pricingCardTitle}>Business</h3>
              <p className={styles.pricingCardPrice}>$99 <span className={styles.pricingCardPriceSub}>USD / month</span></p>
              <ul className={styles.pricingCardFeatures}>
                <li>Everything in Welcome +</li>
                <li>1 organisation profile</li>
                <li>1 private site</li>
                <li>Unlimited public sites</li>
                <li>10 private reports</li>
                <li>Unlimited public reports</li>
                <li>Advanced KYC Dataset</li>
              </ul>
              <p className={styles.pricingCardNote}>(Consultancy required)</p>
              <div className={styles.pricingCardCta}>
                <Link href="/#contact" className="btn btn-primary">Contact us</Link>
              </div>
            </div>
            <div className={styles.pricingCard}>
              <h3 className={styles.pricingCardTitle}>Organisation</h3>
              <p className={styles.pricingCardPrice}>Custom</p>
              <ul className={styles.pricingCardFeatures}>
                <li>Everything in Business +</li>
                <li>1 organisation profile</li>
                <li>Unlimited private sites</li>
                <li>Unlimited private reports</li>
                <li>Unlimited KYC Dataset</li>
              </ul>
              <p className={styles.pricingCardNote}>(Training required)</p>
              <div className={styles.pricingCardCta}>
                <Link href="/#contact" className="btn btn-secondary">Contact us</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ContactForm />

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerBrand}>
            <Image src="/messmass-logo-white.png" alt="" width={120} height={36} />
            <span className={styles.footerSiteName}>MessMass</span>
          </div>
          <h2 className={styles.footerTitle}>{footerTitle}</h2>
          <Link href="/admin/login" className="btn btn-primary">Start using the system</Link>
          <p className={styles.footerSite}>messmass.com</p>
          <nav className={styles.footerLegal} aria-label="Legal">
            <Link href="/privacy">Privacy Policy</Link>
            <Link href="/terms">Terms &amp; Conditions</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
