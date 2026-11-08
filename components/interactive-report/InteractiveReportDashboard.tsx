'use client';

import React, { useState } from 'react';
import { InteractiveReportData, MatchItem } from './types';
import SzrtHeader from './SzrtHeader';
import OverviewTab from './OverviewTab';
import D3BubbleExplorer from './D3BubbleExplorer';
import D3FunnelFlow from './D3FunnelFlow';
import D3DemographicsChart from './D3DemographicsChart';
import MatchesTable from './MatchesTable';
import styles from './interactive-report.module.css';

interface InteractiveReportDashboardProps {
  initialData: InteractiveReportData;
}

export default function InteractiveReportDashboard({ initialData }: InteractiveReportDashboardProps) {
  const [data] = useState<InteractiveReportData>(initialData);
  const [activeTab, setActiveTab] = useState<'overview' | 'bubble' | 'funnel' | 'demographics' | 'table'>('overview');
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<MatchItem | null>(null);

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

      {/* Footer / Attribution-free compliance stamp */}
      <footer className={styles.reportFooter}>
        <div>
          Szerencsejáték Zrt. Interactive Analytics Engine • Verified Dataset Dec 2025 – Mar 2026
        </div>
        <div>
          Powered by Messmass Interactive Reporting
        </div>
      </footer>
    </div>
  );
}
