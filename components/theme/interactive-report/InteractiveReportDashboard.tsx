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
import styles from './interactive-report.module.css';

interface InteractiveReportDashboardProps {
  initialData: InteractiveReportData;
}

export default function InteractiveReportDashboard({ initialData }: InteractiveReportDashboardProps) {
  const [data, setData] = useState<InteractiveReportData>(initialData);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'vision' | 'territory' | 'bubble' | 'funnel' | 'demographics' | 'table'
  >('overview');
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

  return (
    <div className={styles.pageContainer}>
      {/* Client Header & Navigation */}
      <SzrtHeader
        data={data}
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
      {activeTab === 'table' && <MatchesTable matches={data.matches} />}

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
