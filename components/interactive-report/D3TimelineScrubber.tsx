'use client';

import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TimelinePeriod } from './types';
import styles from './interactive-report.module.css';

interface D3TimelineScrubberProps {
  timeline: TimelinePeriod[];
  selectedPeriodId: string | null;
  onSelectPeriod: (id: string | null) => void;
}

export default function D3TimelineScrubber({
  timeline,
  selectedPeriodId,
  onSelectPeriod,
}: D3TimelineScrubberProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Filter only weekly and monthly periods that have photos
  const activeTimeline = timeline.filter((t) => t.allPhotos > 0 || t.registered > 0);

  useEffect(() => {
    if (!svgRef.current || activeTimeline.length === 0) return;

    const container = svgRef.current.parentElement;
    const width = container ? container.clientWidth : 800;
    const height = 180;
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale
    const x = d3
      .scaleBand()
      .domain(activeTimeline.map((d) => d.shortName))
      .range([0, innerWidth])
      .padding(0.25);

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
      .attr('stroke', '#e2e8f0')
      .attr('stroke-dasharray', '3 3');

    // Axes
    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y).ticks(4).tickFormat((d) => `${d}`);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('font-size', '10px')
      .attr('fill', '#64748b')
      .attr('transform', 'rotate(-15)')
      .style('text-anchor', 'end');

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
      .attr('height', (d) => innerHeight - y(d.allPhotos))
      .attr('fill', (d) => (d.id === selectedPeriodId ? '#88ca45' : '#88ca45cc'))
      .attr('rx', 4)
      .attr('cursor', 'pointer')
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
      .attr('height', (d) => innerHeight - y(d.hostessPhotos))
      .attr('fill', (d) => (d.id === selectedPeriodId ? '#4f7a28' : '#4f7a28bb'))
      .attr('rx', 3)
      .attr('cursor', 'pointer')
      .on('click', (_, d) => {
        onSelectPeriod(d.id === selectedPeriodId ? null : d.id);
      });

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
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '4 2')
          .attr('rx', 6);
      }
    }
  }, [activeTimeline, selectedPeriodId, onSelectPeriod]);

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>
            📅 Timeline & Campaign Scrubber
          </h3>
          <p className={styles.cardSubtitle}>
            Click any period bar to filter dashboard metrics by campaign date range.
          </p>
        </div>
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
      <div className={styles.svgWrapper}>
        <svg ref={svgRef} className={styles.timelineSvg} />
      </div>
    </div>
  );
}
