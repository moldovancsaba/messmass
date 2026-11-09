'use client';
/* eslint-disable react/forbid-dom-props */

import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { MatchItem } from './types';
import styles from './interactive-report.module.css';

interface D3BubbleExplorerProps {
  matches: MatchItem[];
  onSelectMatch?: (match: MatchItem) => void;
}

const SPORT_COLORS: Record<string, string> = {
  Football: '#059669',
  'Ice Hockey': '#0284c7',
  Basketball: '#b45309',
  Handball: '#e11d48',
  Other: '#64748b',
};

export default function D3BubbleExplorer({ matches, onSelectMatch }: D3BubbleExplorerProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [selectedSport, setSelectedSport] = useState<string>('All');
  const [hoveredMatch, setHoveredMatch] = useState<MatchItem | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const filteredMatches = useMemo(() => {
    if (selectedSport === 'All') return matches;
    return matches.filter((m) => m.sport === selectedSport);
  }, [matches, selectedSport]);

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    if (filteredMatches.length === 0) return;

    const width = 800;
    const height = 480;
    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const maxPhotos = d3.max(filteredMatches, (d) => d.submitted) || 200;
    const radiusScale = d3.scaleSqrt().domain([0, maxPhotos]).range([14, 52]);

    const nodes = filteredMatches.map((d) => ({
      ...d,
      r: radiusScale(d.submitted),
      x: width / 2 + (Math.random() - 0.5) * 200,
      y: height / 2 + (Math.random() - 0.5) * 200,
    }));

    const simulation = d3
      .forceSimulation(nodes as any)
      .force('charge', d3.forceManyBody().strength(5))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.r + 3).iterations(3));

    const g = svg.append('g');

    const bubbleGroups = g
      .selectAll('.bubble-group')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'bubble-group')
      .attr('cursor', 'pointer')
      .on('mouseenter', (event, d) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
        setHoveredMatch(d);
      })
      .on('mousemove', (event) => {
        const rect = svgRef.current?.getBoundingClientRect();
        if (rect) {
          setTooltipPos({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
          });
        }
      })
      .on('mouseleave', () => {
        setHoveredMatch(null);
        setTooltipPos(null);
      })
      .on('click', (_, d) => {
        if (onSelectMatch) onSelectMatch(d);
      });

    // Outer circle
    bubbleGroups
      .append('circle')
      .attr('r', (d) => d.r)
      .attr('fill', (d) => SPORT_COLORS[d.sport] || '#64748b')
      .attr('fill-opacity', 0.85)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2);

    // Inner photo count
    bubbleGroups
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.1em')
      .attr('font-size', (d) => Math.max(9, d.r * 0.42))
      .attr('font-weight', '700')
      .attr('fill', '#ffffff')
      .text((d) => d.submitted);

    // Sport / Name label for larger bubbles
    bubbleGroups
      .filter((d) => d.r >= 26)
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .attr('font-size', (d) => Math.max(8, d.r * 0.22))
      .attr('font-weight', '500')
      .attr('fill', 'rgba(255, 255, 255, 0.95)')
      .text((d) => {
        const parts = d.cleanName.split(' vs ');
        return parts[0].slice(0, 8);
      });

    simulation.on('tick', () => {
      bubbleGroups.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => {
      simulation.stop();
    };
  }, [filteredMatches, onSelectMatch]);

  const sportsList = ['All', 'Football', 'Ice Hockey', 'Basketball', 'Handball'];

  return (
    <div className={styles.reportCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3 className={styles.cardTitle}>
            🫧 Interactive Match Activation Explorer
          </h3>
          <p className={styles.cardSubtitle}>
            Each bubble represents a sponsored match. Bubble size represents total photos submitted.
          </p>
        </div>
        <div className={styles.bubbleControls}>
          {sportsList.map((sport) => {
            const isSelected = selectedSport === sport;
            const count = sport === 'All' ? matches.length : matches.filter((m) => m.sport === sport).length;
            return (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`${styles.sportPill} ${isSelected ? styles.sportPillActive : ''}`}
              >
                {sport}
                <span className={isSelected ? styles.bubbleCountBadgeActive : styles.bubbleCountBadge}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className={styles.bubbleSvgWrap}>
        <svg ref={svgRef} className={styles.bubbleSvg} />

        {/* Hover Tooltip */}
        {hoveredMatch && tooltipPos && (
          // WHAT: Dynamic cursor coordinates for floating SVG tooltip
          // WHY: Tooltip position follows live mouse cursor movement over D3 force bubbles
          // eslint-disable-next-line react/forbid-dom-props
          <div
            className={styles.tooltipCard}
            style={{
              left: Math.min(tooltipPos.x + 15, 520),
              top: Math.max(10, tooltipPos.y - 110),
            }}
          >
            <div className={styles.tooltipSport}>
              {hoveredMatch.sport} • {hoveredMatch.date}
            </div>
            <div className={styles.tooltipTitle}>
              {hoveredMatch.cleanName}
            </div>
            <div className={styles.tooltipGrid}>
              <div>
                Submitted: <strong>{hoveredMatch.submitted}</strong>
              </div>
              <div>
                Approved: <strong className={styles.valApproved}>{hoveredMatch.approved}</strong>
              </div>
              <div>
                Hostess: <strong>{hoveredMatch.hostess}</strong>
              </div>
              <div>
                Selfies: <strong>{hoveredMatch.selfies}</strong>
              </div>
            </div>
            <div className={styles.tooltipFooter}>
              <span>Brand Protection Pass:</span>
              <strong className={styles.valApproved}>{hoveredMatch.approvalRate}%</strong>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
