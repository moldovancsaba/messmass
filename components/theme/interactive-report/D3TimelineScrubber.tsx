'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { TimelinePeriod } from './types';
import styles from './interactive-report.module.css';

interface D3TimelineScrubberProps {
  timeline: TimelinePeriod[];
  selectedPeriodId: string | null;
  onSelectPeriod: (id: string | null) => void;
}

interface TooltipData {
  period: TimelinePeriod;
  x: number;
  y: number;
}

export default function D3TimelineScrubber({
  timeline,
  selectedPeriodId,
  onSelectPeriod,
}: D3TimelineScrubberProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [granularity, setGranularity] = useState<'monthly' | 'weekly'>('monthly');
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Only periods with recorded activity are drawn; counts shown in the switcher come from this list.
  const periodsWithData = useMemo(
    () => timeline.filter((t) => t.allPhotos > 0 || t.registered > 0),
    [timeline]
  );
  const monthlyPeriods = useMemo(
    () => periodsWithData.filter((t) => t.type === 'monthly'),
    [periodsWithData]
  );
  const weeklyPeriods = useMemo(
    () => periodsWithData.filter((t) => t.type === 'weekly'),
    [periodsWithData]
  );
  const hasBothGranularities = monthlyPeriods.length > 0 && weeklyPeriods.length > 0;

  // The selected granularity only applies when both exist; otherwise show whichever has data.
  const activeGranularity: 'monthly' | 'weekly' = hasBothGranularities
    ? granularity
    : weeklyPeriods.length > 0 && monthlyPeriods.length === 0
      ? 'weekly'
      : 'monthly';

  const activeTimeline = useMemo(() => {
    const list = activeGranularity === 'weekly' ? weeklyPeriods : monthlyPeriods;
    return list.length > 0 ? list : periodsWithData;
  }, [activeGranularity, weeklyPeriods, monthlyPeriods, periodsWithData]);

  // Track parent width via ResizeObserver
  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };
    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (activeTimeline.length === 0) return;

    // Minimum width logic: Weekly needs min 540px so 8 bars are comfortable; Monthly fits container
    const isWeekly = activeGranularity === 'weekly';
    const computedWidth = isWeekly ? Math.max(containerWidth, 540) : Math.max(containerWidth, 320);
    const height = isWeekly ? 210 : 190;
    const margin = isWeekly
      ? { top: 20, right: 24, bottom: 55, left: 45 }
      : { top: 20, right: 24, bottom: 35, left: 45 };

    svg.attr('viewBox', `0 0 ${computedWidth} ${height}`);
    // Explicit pixel width allows smooth horizontal scrolling in svgWrapper on mobile
    svg.style('width', `${computedWidth}px`);

    const innerWidth = computedWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3
      .scaleBand()
      .domain(activeTimeline.map((d) => d.shortName))
      .range([0, innerWidth])
      .padding(isWeekly ? 0.28 : 0.35);

    // Y Scale
    const maxVal = d3.max(activeTimeline, (d) => Math.max(d.allPhotos, d.registered)) || 1000;
    const y = d3
      .scaleLinear()
      .domain([0, maxVal * 1.15])
      .nice()
      .range([innerHeight, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .call(
        d3
          .axisLeft(y)
          .ticks(4)
          .tickSize(-innerWidth)
          .tickFormat(() => '')
      )
      .selectAll('line')
      .attr('stroke', '#f1f5f9')
      .attr('stroke-dasharray', '3 3');

    // Axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y).ticks(4).tickFormat((d) => `${d}`);

    const xAxisG = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);

    xAxisG
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('font-weight', '500')
      .attr('fill', '#475569');

    if (isWeekly) {
      xAxisG
        .selectAll('text')
        .attr('transform', 'rotate(-32)')
        .style('text-anchor', 'end')
        .attr('dx', '-6px')
        .attr('dy', '4px');
    } else {
      xAxisG
        .selectAll('text')
        .style('text-anchor', 'middle')
        .attr('dy', '12px');
    }

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#64748b');

    // Bars: Total Photos
    g.selectAll('.bar-photos')
      .data(activeTimeline)
      .enter()
      .append('rect')
      .attr('class', 'bar-photos')
      .attr('x', (d) => x(d.shortName) || 0)
      .attr('width', x.bandwidth())
      .attr('y', (d) => y(d.allPhotos))
      .attr('height', (d) => Math.max(0, innerHeight - y(d.allPhotos)))
      .attr('fill', (d) => (d.id === selectedPeriodId ? '#88ca45' : '#88ca45cc'))
      .attr('rx', 4)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setTooltip({ period: d, x: mx, y: my });
      })
      .on('mousemove', (event, d) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setTooltip({ period: d, x: mx, y: my });
      })
      .on('mouseleave', () => {
        setTooltip(null);
      })
      .on('click', (_, d) => {
        onSelectPeriod(d.id === selectedPeriodId ? null : d.id);
      });

    // Bars: Hostess Photos
    g.selectAll('.bar-hostess')
      .data(activeTimeline)
      .enter()
      .append('rect')
      .attr('class', 'bar-hostess')
      .attr('x', (d) => (x(d.shortName) || 0) + x.bandwidth() * 0.15)
      .attr('width', x.bandwidth() * 0.7)
      .attr('y', (d) => y(d.hostessPhotos))
      .attr('height', (d) => Math.max(0, innerHeight - y(d.hostessPhotos)))
      .attr('fill', (d) => (d.id === selectedPeriodId ? '#4f7a28' : '#4f7a28bb'))
      .attr('rx', 3)
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setTooltip({ period: d, x: mx, y: my });
      })
      .on('mousemove', (event, d) => {
        const [mx, my] = d3.pointer(event, containerRef.current);
        setTooltip({ period: d, x: mx, y: my });
      })
      .on('mouseleave', () => {
        setTooltip(null);
      })
      .on('click', (_, d) => {
        onSelectPeriod(d.id === selectedPeriodId ? null : d.id);
      });

    // Bar Value Labels (for Monthly View where width permits)
    if (!isWeekly) {
      g.selectAll('.bar-label')
        .data(activeTimeline)
        .enter()
        .append('text')
        .attr('class', 'bar-label')
        .attr('x', (d) => (x(d.shortName) || 0) + x.bandwidth() / 2)
        .attr('y', (d) => y(d.allPhotos) - 6)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .attr('font-weight', '700')
        .attr('fill', '#4f7a28')
        .text((d) => d.allPhotos.toLocaleString());
    }

    // Active Selection Indicator
    if (selectedPeriodId) {
      const selected = activeTimeline.find((d) => d.id === selectedPeriodId);
      if (selected && x(selected.shortName) !== undefined) {
        g.append('rect')
          .attr('x', (x(selected.shortName) || 0) - 4)
          .attr('y', -6)
          .attr('width', x.bandwidth() + 8)
          .attr('height', innerHeight + 12)
          .attr('fill', 'none')
          .attr('stroke', '#4f7a28')
          .attr('stroke-width', 2.5)
          .attr('stroke-dasharray', '4 2')
          .attr('rx', 6);
      }
    }
  }, [activeTimeline, selectedPeriodId, onSelectPeriod, containerWidth, activeGranularity]);

  // No period carries any activity: nothing to scrub.
  if (periodsWithData.length === 0) return null;

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>
            📅 Timeline & Campaign Scrubber
          </h3>
          <p className={styles.cardSubtitle}>
            Click a period bar to see the totals of that period.
          </p>
        </div>

        {/* View Granularity Switcher: only offered when both granularities have data */}
        {hasBothGranularities && (
          <div className={styles.granularityToggle}>
            <button
              onClick={() => setGranularity('monthly')}
              className={`${styles.granularityBtn} ${
                activeGranularity === 'monthly' ? styles.granularityBtnActive : ''
              }`}
            >
              Monthly Cycles ({monthlyPeriods.length})
            </button>
            <button
              onClick={() => setGranularity('weekly')}
              className={`${styles.granularityBtn} ${
                activeGranularity === 'weekly' ? styles.granularityBtnActive : ''
              }`}
            >
              Weekly Campaigns ({weeklyPeriods.length})
            </button>
          </div>
        )}

        <div className={styles.legendGroup}>
          <div className={styles.legendItem}>
            <span className={styles.legendDotGreen} />
            Total Photos
          </div>
          <div className={styles.legendItem}>
            <span className={styles.legendDotDarkGreen} />
            Hostess Photos
          </div>
          {selectedPeriodId && (
            <button
              onClick={() => onSelectPeriod(null)}
              className={styles.resetBtn}
            >
              Reset to All Time ✕
            </button>
          )}
        </div>
      </div>

      <div ref={containerRef} className={styles.svgWrapper}>
        <svg ref={svgRef} className={styles.timelineSvg} />

        {/* Floating Tooltip */}
        {tooltip && (
          <div
            className={styles.timelineTooltip}
            style={{
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
            }}
          >
            <div className={styles.timelineTooltipTitle}>
              {tooltip.period.name}
            </div>
            <div className={styles.timelineTooltipRow}>
              <span>Total Photos:</span>
              <strong>{tooltip.period.allPhotos.toLocaleString()}</strong>
            </div>
            <div className={styles.timelineTooltipRow}>
              <span>Hostess Photos:</span>
              <strong>{tooltip.period.hostessPhotos.toLocaleString()}</strong>
            </div>
            <div className={styles.timelineTooltipRow}>
              <span>Fan Selfies:</span>
              <strong>{tooltip.period.selfies.toLocaleString()}</strong>
            </div>
            <div className={styles.timelineTooltipRow}>
              <span>Registered Fans:</span>
              <strong>{tooltip.period.registered.toLocaleString()}</strong>
            </div>
            <div className={styles.timelineTooltipRow}>
              <span>Marketing Opt-ins:</span>
              <strong>
                {tooltip.period.registered > 0
                  ? `${tooltip.period.optIns.toLocaleString()} (${tooltip.period.optInRate}%)`
                  : 'n/a'}
              </strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
