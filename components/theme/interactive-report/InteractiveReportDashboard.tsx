'use client';

import React, { useState } from 'react';
import { InteractiveReportData, MatchItem } from './types';
import SzrtHeader from './SzrtHeader';
import OverviewTab from './OverviewTab';
import FanmassVisionSection from './FanmassVisionSection';
import TerritoryMapCanvas from './TerritoryMapCanvas';
import D3BubbleExplorer from './D3BubbleExplorer';
import D3FunnelFlow from './D3FunnelFlow';
import D3DemographicsChart from './D3DemographicsChart';
import MatchesTable from './MatchesTable';
import { getReportSlug } from './reportSlug';
import HashtagReportView from '@/components/hashtagReport/HashtagReportView';
import type { HashtagReport } from '@/lib/hashtagReport/types';
import { resolvePartnerTheme } from '@/lib/theme/interactiveReportPalette';
import styles from './interactive-report.module.css';

interface InteractiveReportDashboardProps {
  initialData: InteractiveReportData;
  /** The Fanmass report (lib/hashtagReport/dashboard.ts): only what Fanmass measured, no hand-entered figure. The
   * dashboard then shows the Fanmass tabs only (vision, map, demographics, figures) and Fanmass header figures. */
  fanmass?: HashtagReport;
}

export type DashboardTab = 'overview' | 'vision' | 'territory' | 'bubble' | 'funnel' | 'demographics' | 'table' | 'figures';

export default function InteractiveReportDashboard({ initialData, fanmass }: InteractiveReportDashboardProps) {
  const [data, setData] = useState<InteractiveReportData>(initialData);
  // The Fanmass report opens on the overview (victory podiums, demographics) when Fanmass has vision data
  const [activeTab, setActiveTab] = useState<DashboardTab>(fanmass && !initialData.vision ? 'figures' : 'overview');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);

  // Slug the report routes understand (hashtag-<name>, event-<slug>, partner slug)
  const reportSlug = getReportSlug(data);
  const scopeName = data.scope?.name || data.partner.name;

  // Poll for live vision progress updates while running
  React.useEffect(() => {
    if (!reportSlug || !data.vision || data.vision.status !== 'running') return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/interactive-report/${reportSlug}`);
        if (res.ok) {
          const json = await res.json();
          const liveVision = json.vision || json.data?.vision;
          if (liveVision) {
            setData((prev) => ({
              ...prev,
              vision: {
                ...(prev.vision || {}),
                ...liveVision,
                aggregates: {
                  ...(prev.vision?.aggregates || {}),
                  ...(liveVision.aggregates || {}),
                },
              },
            }));
          }
        }
      } catch {
        // Silently continue on network jitter
      }
    }, 3000);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.vision?.status, reportSlug]);

  // Date range of the events in the data; only ISO-style dates are used, otherwise nothing is shown.
  const datasetRange = React.useMemo(() => {
    const dates = (data.matches || [])
      .map((m) => (m.date || '').replace(/\./g, '-').replace(/-$/, '').trim())
      .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d))
      .sort();
    if (dates.length === 0) return null;
    const first = dates[0];
    const last = dates[dates.length - 1];
    return first === last ? `Events on ${first}` : `Events ${first} to ${last}`;
  }, [data.matches]);

  const handleSelectMatch = (match: MatchItem) => {
    setSelectedMatch(match);
  };

  const partnerTheme = resolvePartnerTheme(
    data.style,
    data.partner?.name || data.scope?.name,
    data.scope?.type,
    data.partner?.viewSlug || data.scope?.viewSlug
  );

  const themeVars = {
    '--report-primary': partnerTheme.primary,
    '--report-primary-dark': partnerTheme.primaryDark,
    '--report-primary-soft': partnerTheme.primarySoft,
    '--report-accent': partnerTheme.accent,
    '--report-hero-bg': partnerTheme.heroBg,
    '--report-hero-glow': partnerTheme.heroGlow,
    '--report-pill-bg': partnerTheme.pillBg,
    '--report-pill-text': partnerTheme.pillText,
    '--report-gender-male': partnerTheme.genderMale,
    '--report-gender-female': partnerTheme.genderFemale,
  } as React.CSSProperties;

  return (
    /* eslint-disable-next-line react/forbid-dom-props */
    <div className={styles.pageContainer} style={themeVars}>
      {/* Client Header & Navigation */}
      <SzrtHeader
        data={data}
        fanmass={fanmass}
        activeTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          setSelectedMatch(null);
        }}
      />

      {/* Tab 1: Executive Overview */}
      {activeTab === 'overview' && (
        <OverviewTab
          data={data}
          selectedPeriodId={selectedPeriodId}
          onSelectPeriod={setSelectedPeriodId}
          onViewBubble={() => setActiveTab('bubble')}
          onViewFunnel={() => setActiveTab('funnel')}
          onViewTerritoryMap={() => setActiveTab('territory')}
          onViewMatches={() => setActiveTab('table')}
          isFanmass={Boolean(fanmass)}
        />
      )}

      {/* Tab: Dedicated Fanmass Vision AI */}
      {activeTab === 'vision' && data.vision && (
        <FanmassVisionSection
          vision={data.vision}
          partnerSlug={reportSlug ?? undefined}
          matches={data.matches}
          onViewTerritoryMap={() => setActiveTab('territory')}
        />
      )}

      {/* Tab: Geographic Activation & Territory Distribution Map */}
      {activeTab === 'territory' && (
        <TerritoryMapCanvas
          matches={data.matches || []}
          vision={data.vision}
          partnerSlug={reportSlug ?? undefined}
          partnerName={scopeName}
          embedded={true}
        />
      )}

      {/* Tab 2: D3 Match Bubble Explorer */}
      {activeTab === 'bubble' && (
        <div className={styles.funnelList}>
          <D3BubbleExplorer
            matches={data.matches}
            onSelectMatch={handleSelectMatch}
          />

          {/* Selected Match Details Drawer */}
          {selectedMatch && (
            <div className={styles.selectedMatchDrawer}>
              <div>
                <div className={styles.cardSubtitle}>
                  Selected Match Details • {selectedMatch.date}
                </div>
                <h4 className={styles.selectedMatchTitle}>
                  {selectedMatch.cleanName}
                </h4>
                <div className={styles.cardSubtitle}>
                  {selectedMatch.partnerName} • {selectedMatch.venue}
                </div>
              </div>

              <div className={styles.actionsGroup}>
                <div className={styles.kpiCard}>
                  <div className={styles.cardSubtitle}>Submitted</div>
                  <div className={styles.matchTitle}>{selectedMatch.submitted}</div>
                </div>
                <div className={styles.kpiCard}>
                  <div className={styles.cardSubtitle}>Approved</div>
                  <div className={styles.valApproved}>{selectedMatch.approved}</div>
                </div>
                <div className={styles.kpiCard}>
                  <div className={styles.cardSubtitle}>Hostess</div>
                  <div className={styles.matchTitle}>{selectedMatch.hostess}</div>
                </div>
                <button
                  onClick={() => setSelectedMatch(null)}
                  className={styles.resetBtn}
                >
                  Close ✕
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Marketing Conversion Funnel */}
      {activeTab === 'funnel' && (
        <D3FunnelFlow funnel={data.funnel} summary={data.summary} />
      )}

      {/* Tab 4: Audience Demographics */}
      {activeTab === 'demographics' && <D3DemographicsChart demographics={data.demographics} />}

      {/* Tab 5: All Match Data Table */}
      {activeTab === 'table' && <MatchesTable matches={data.matches} isFanmass={Boolean(fanmass)} />}

      {/* Fanmass report: every measured figure with its counts, and the events it comes from */}
      {activeTab === 'figures' && fanmass && <HashtagReportView report={fanmass} embedded />}

      {/* Footer: scope name and the date range of the events in the data */}
      <footer className={styles.reportFooter}>
        <div>
          {[scopeName ? `${scopeName} Interactive Analytics` : 'Interactive Analytics', datasetRange]
            .filter(Boolean)
            .join(' • ')}
        </div>
        <div>
          Powered by Messmass Interactive Reporting
        </div>
      </footer>
    </div>
  );
}
