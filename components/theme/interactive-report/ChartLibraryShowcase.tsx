'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Chart, { type ChartConfiguration } from 'chart.js/auto';
import * as echarts from 'echarts';
import * as d3 from 'd3';
import { MatchItem, VisionProgressData } from './types';
import { REPORT_CHART_PALETTE, buildPartnerChartSeries } from '@/lib/theme/interactiveReportPalette';
import styles from './interactive-report.module.css';

interface ChartLibraryShowcaseProps {
  matches: MatchItem[];
  vision?: VisionProgressData | null;
  brands: Array<{ brand: string; count: number }>;
  clubs: Array<{ club: string; count: number }>;
  primaryColor?: string;
  accentColor?: string;
}

type InsightDomain = 'all' | 'events' | 'attendance' | 'weather' | 'brands';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function getFillPct(m: MatchItem): number | null {
  if (typeof m.capacityUtilizationRate === 'number' && Number.isFinite(m.capacityUtilizationRate)) {
    return Math.min(100, Math.max(0, m.capacityUtilizationRate));
  }
  if (m.attendance && m.venueCapacity && m.venueCapacity > 0) {
    return Math.min(100, Math.round((m.attendance / m.venueCapacity) * 1000) / 10);
  }
  return null;
}

function ChartJsPanel({
  title,
  icon,
  status,
  description,
  config,
  tall = false,
}: {
  title: string;
  icon: string;
  status?: string;
  description?: string;
  config: ChartConfiguration;
  tall?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const chart = new Chart(canvas, config);
    return () => {
      chart.destroy();
    };
  }, [config]);

  return (
    <article className={styles.bentoPanel}>
      <header className={styles.bentoPanelHeader}>
        <div className={styles.bentoPanelTitle}>
          <span className={styles.bentoPanelIcon} aria-hidden="true">{icon}</span>
          <h3 className={styles.gdsCardTitle}>{title}</h3>
        </div>
        {status && <span className={styles.bentoPanelStatus}>{status}</span>}
      </header>
      <div className={styles.bentoPanelBody}>
        {description && <p className={styles.bentoBenefit}>{description}</p>}
        <div className={tall ? styles.chartCanvasBoxTall : styles.chartCanvasBox}>
          <canvas ref={canvasRef} />
        </div>
      </div>
    </article>
  );
}

function EChartsPanel({
  title,
  icon,
  status,
  description,
  option,
  tall = false,
}: {
  title: string;
  icon: string;
  status?: string;
  description?: string;
  option: echarts.EChartsOption;
  tall?: boolean;
}) {
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const instance = echarts.init(el);
    instance.setOption(option);
    const ro = new ResizeObserver(() => {
      instance.resize();
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      instance.dispose();
    };
  }, [option]);

  return (
    <article className={styles.bentoPanel}>
      <header className={styles.bentoPanelHeader}>
        <div className={styles.bentoPanelTitle}>
          <span className={styles.bentoPanelIcon} aria-hidden="true">{icon}</span>
          <h3 className={styles.gdsCardTitle}>{title}</h3>
        </div>
        {status && <span className={styles.bentoPanelStatus}>{status}</span>}
      </header>
      <div className={styles.bentoPanelBody}>
        {description && <p className={styles.bentoBenefit}>{description}</p>}
        <div ref={boxRef} className={tall ? styles.chartCanvasBoxTall : styles.chartCanvasBox} />
      </div>
    </article>
  );
}

function D3LollipopPanel({
  items,
  primaryColor = REPORT_CHART_PALETTE.blue,
}: {
  items: Array<{ name: string; rate: number; photos: number; attendance: number }>;
  primaryColor?: string;
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl || items.length === 0) return;

    const W = 820;
    const H = items.length * 28 + 36;
    const margin = { top: 14, right: 48, bottom: 24, left: 295 };
    const innerW = W - margin.left - margin.right;
    const innerH = H - margin.top - margin.bottom;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();
    svg.attr('viewBox', `0 0 ${W} ${H}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const maxRate = d3.max(items, (d) => d.rate) || 10;

    const x = d3.scaleLinear().domain([0, maxRate * 1.12]).range([0, innerW]);
    const y = d3
      .scaleBand<string>()
      .domain(items.map((d) => d.name))
      .range([0, innerH])
      .padding(0.35);

    g.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(x).ticks(5))
      .selectAll('text')
      .attr('fill', REPORT_CHART_PALETTE.muted)
      .attr('font-size', '10px');

    g.append('g')
      .call(d3.axisLeft(y).tickSize(0))
      .selectAll('text')
      .attr('fill', REPORT_CHART_PALETTE.ink)
      .attr('font-size', '11px')
      .attr('font-weight', '600');

    g.selectAll('.domain').attr('stroke', REPORT_CHART_PALETTE.grid);

    g.selectAll('line.stem')
      .data(items)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', (d) => x(d.rate))
      .attr('y1', (d) => (y(d.name) ?? 0) + y.bandwidth() / 2)
      .attr('y2', (d) => (y(d.name) ?? 0) + y.bandwidth() / 2)
      .attr('stroke', primaryColor)
      .attr('stroke-width', 2.5);

    g.selectAll('circle.dot')
      .data(items)
      .enter()
      .append('circle')
      .attr('cx', (d) => x(d.rate))
      .attr('cy', (d) => (y(d.name) ?? 0) + y.bandwidth() / 2)
      .attr('r', 5.5)
      .attr('fill', REPORT_CHART_PALETTE.teal)
      .append('title')
      .text((d) => `${d.name}: ${d.rate} photos / 1k fans (${d.photos.toLocaleString()} photos, ${d.attendance.toLocaleString()} fans)`);

    g.selectAll('text.val')
      .data(items)
      .enter()
      .append('text')
      .attr('x', (d) => x(d.rate) + 10)
      .attr('y', (d) => (y(d.name) ?? 0) + y.bandwidth() / 2 + 4)
      .attr('fill', REPORT_CHART_PALETTE.ink)
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .text((d) => `${d.rate}`);
  }, [items, primaryColor]);

  return (
    <article className={styles.bentoPanel}>
      <header className={styles.bentoPanelHeader}>
        <div className={styles.bentoPanelTitle}>
          <span className={styles.bentoPanelIcon} aria-hidden="true">🎯</span>
          <h3 className={styles.gdsCardTitle}>Best matches for photo engagement</h3>
        </div>
        <span className={styles.bentoPanelStatus}>Top 12 matches</span>
      </header>
      <div className={styles.bentoPanelBody}>
        <p className={styles.bentoBenefit}>
          Highlights which matches generated the most fan photos per 1,000 attendees so you can repeat what worked.
        </p>
        <svg ref={svgRef} className={styles.svgChart} role="img" aria-label="Chart of match photo participation rate" />
      </div>
    </article>
  );
}

export default function ChartLibraryShowcase({
  matches,
  vision,
  brands,
  clubs,
  primaryColor = REPORT_CHART_PALETTE.blue,
  accentColor = REPORT_CHART_PALETTE.teal,
}: ChartLibraryShowcaseProps) {
  const partnerPalette = useMemo(
    () => buildPartnerChartSeries(primaryColor, accentColor),
    [primaryColor, accentColor]
  );
  const [domain, setDomain] = useState<InsightDomain>('all');

  // Chronological monthly aggregates
  const monthlySeries = useMemo(() => {
    const map = new Map<string, { month: string; attendance: number; photos: number; fillSum: number; fillN: number }>();
    for (const m of matches) {
      const ym = (m.date || '').replace(/\./g, '-').slice(0, 7);
      if (!/^\d{4}-\d{2}$/.test(ym)) continue;
      const cur = map.get(ym) ?? { month: ym, attendance: 0, photos: 0, fillSum: 0, fillN: 0 };
      cur.attendance += m.attendance || 0;
      cur.photos += m.submitted || 0;
      const f = getFillPct(m);
      if (f !== null) {
        cur.fillSum += f;
        cur.fillN += 1;
      }
      map.set(ym, cur);
    }
    const sorted = Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
    let cumAtt = 0;
    let cumPhotos = 0;
    return sorted.map((r) => {
      cumAtt += r.attendance;
      cumPhotos += r.photos;
      return { ...r, cumAtt, cumPhotos, avgFill: r.fillN > 0 ? Math.round((r.fillSum / r.fillN) * 10) / 10 : 0 };
    });
  }, [matches]);

  // 1. ECharts: Cumulative Season Attendance & Photos (Stacked Area)
  const cumulativeOption = useMemo<echarts.EChartsOption>(
    () => ({
      tooltip: { trigger: 'axis' },
      legend: { data: ['Cumulative Attendance', 'Cumulative Photos'], bottom: 0, textStyle: { color: REPORT_CHART_PALETTE.muted } },
      grid: { left: 52, right: 52, top: 18, bottom: 42 },
      xAxis: { type: 'category', data: monthlySeries.map((m) => m.month), axisLabel: { color: REPORT_CHART_PALETTE.muted } },
      yAxis: [
        { type: 'value', name: 'Fans', axisLabel: { color: REPORT_CHART_PALETTE.muted } },
        { type: 'value', name: 'Photos', axisLabel: { color: REPORT_CHART_PALETTE.muted } },
      ],
      series: [
        {
          name: 'Cumulative Attendance',
          type: 'line',
          smooth: true,
          areaStyle: { color: partnerPalette.primarySoft },
          lineStyle: { color: partnerPalette.primary, width: 2.5 },
          itemStyle: { color: partnerPalette.primary },
          data: monthlySeries.map((m) => m.cumAtt),
        },
        {
          name: 'Cumulative Photos',
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          areaStyle: { color: partnerPalette.accentSoft },
          lineStyle: { color: REPORT_CHART_PALETTE.teal, width: 2.5 },
          itemStyle: { color: REPORT_CHART_PALETTE.teal },
          data: monthlySeries.map((m) => m.cumPhotos),
        },
      ],
    }),
    [monthlySeries, partnerPalette]
  );

  // 2. ECharts: Brand Treemap
  const treemapOption = useMemo<echarts.EChartsOption>(
    () => ({
      tooltip: { formatter: '{b}: {c} detections' },
      color: [...partnerPalette.series],
      series: [
        {
          type: 'treemap',
          roam: false,
          breadcrumb: { show: false },
          label: { show: true, formatter: '{b}\n{c}' },
          data: brands.slice(0, 18).map((b) => ({ name: b.brand, value: b.count })),
        },
      ],
    }),
    [brands, partnerPalette]
  );

  // 3. ECharts: Day-of-Week x Month Fill % Heatmap
  const heatmapOption = useMemo<echarts.EChartsOption>(() => {
    const months = monthlySeries.slice(-12).map((m) => m.month);
    const cellMap = new Map<string, { sum: number; n: number }>();
    for (const m of matches) {
      const cleanDate = (m.date || '').replace(/\./g, '-').slice(0, 10);
      const ym = cleanDate.slice(0, 7);
      if (!months.includes(ym) || !/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) continue;
      const fill = getFillPct(m);
      if (fill === null) continue;
      const dayIdx = new Date(`${cleanDate}T12:00:00Z`).getUTCDay();
      const k = `${ym}|${dayIdx}`;
      const cur = cellMap.get(k) ?? { sum: 0, n: 0 };
      cur.sum += fill;
      cur.n += 1;
      cellMap.set(k, cur);
    }
    const data: Array<[number, number, number]> = [];
    months.forEach((ym, xi) => {
      DAY_ORDER.forEach((dayIdx, yi) => {
        const cell = cellMap.get(`${ym}|${dayIdx}`);
        if (cell && cell.n > 0) {
          data.push([xi, yi, Math.round((cell.sum / cell.n) * 10) / 10]);
        }
      });
    });
    return {
      tooltip: {
        position: 'top',
        formatter: (params: unknown) => {
          const p = params as { value?: [number, number, number] };
          if (!p.value) return '';
          return `${months[p.value[0]]} · ${DAY_LABELS[DAY_ORDER[p.value[1]]]}: ${p.value[2]}% avg seat occupancy`;
        },
      },
      grid: { left: 48, right: 20, top: 14, bottom: 76 },
      xAxis: { type: 'category', data: months, splitArea: { show: true }, axisLabel: { color: REPORT_CHART_PALETTE.muted } },
      yAxis: {
        type: 'category',
        data: DAY_ORDER.map((i) => DAY_LABELS[i]),
        splitArea: { show: true },
        axisLabel: { color: REPORT_CHART_PALETTE.muted },
      },
      visualMap: {
        min: 0,
        max: 100,
        orient: 'horizontal',
        left: 'center',
        bottom: 4,
        itemWidth: 12,
        itemHeight: 90,
        inRange: { color: [partnerPalette.primarySoft, REPORT_CHART_PALETTE.teal, partnerPalette.primary] },
      },
      series: [{ type: 'heatmap', data, label: { show: months.length <= 8 } }],
    };
  }, [matches, monthlySeries, partnerPalette]);

  // 4. ECharts: Club Apparel Nightingale Rose
  const roseOption = useMemo<echarts.EChartsOption>(
    () => ({
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      color: [...partnerPalette.series],
      series: [
        {
          type: 'pie',
          radius: ['22%', '76%'],
          center: ['50%', '50%'],
          roseType: 'area',
          itemStyle: { borderRadius: 6 },
          data: clubs.slice(0, 8).map((c) => ({ name: c.club, value: c.count })),
        },
      ],
    }),
    [clubs, partnerPalette]
  );

  const hasFillData = useMemo(() => matches.some((m) => getFillPct(m) !== null), [matches]);
  const hasBoxplotData = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of matches) {
      if (getFillPct(m) === null) continue;
      counts.set(m.sport, (counts.get(m.sport) || 0) + 1);
    }
    return Array.from(counts.values()).some((n) => n >= 2);
  }, [matches]);
  const hasOutdoorWindFillData = useMemo(
    () => matches.some((m) => m.weather && !m.weather.isIndoor && getFillPct(m) !== null),
    [matches]
  );
  const hasWeatherBubbleData = useMemo(
    () => matches.some((m) => m.weather && getFillPct(m) !== null),
    [matches]
  );

  // 5. ECharts: Stadium Utilization Gauge
  const gaugeOption = useMemo<echarts.EChartsOption>(() => {
    const fills = matches.map(getFillPct).filter((v): v is number => v !== null);
    const avg = fills.length > 0 ? Math.round((fills.reduce((a, b) => a + b, 0) / fills.length) * 10) / 10 : 0;
    return {
      series: [
        {
          type: 'gauge',
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          progress: { show: true, width: 14, itemStyle: { color: partnerPalette.primary } },
          axisLine: { lineStyle: { width: 14, color: [[1, REPORT_CHART_PALETTE.grid]] } },
          pointer: { show: false },
          axisTick: { show: false },
          splitLine: { length: 8, lineStyle: { width: 2, color: REPORT_CHART_PALETTE.muted } },
          axisLabel: { distance: 20, color: REPORT_CHART_PALETTE.muted, fontSize: 10 },
          detail: { valueAnimation: true, formatter: '{value}%', fontSize: 28, fontWeight: 800, color: REPORT_CHART_PALETTE.ink, offsetCenter: [0, '10%'] },
          data: [{ value: avg, name: 'Avg Stadium Fill' }],
          title: { offsetCenter: [0, '42%'], fontSize: 11, color: REPORT_CHART_PALETTE.muted },
        },
      ],
    };
  }, [matches, partnerPalette]);

  // 6. ECharts: Fill Rate Spread by Sport (Boxplot)
  const boxplotOption = useMemo<echarts.EChartsOption>(() => {
    const bySport = new Map<string, number[]>();
    for (const m of matches) {
      const f = getFillPct(m);
      if (f === null) continue;
      const list = bySport.get(m.sport) ?? [];
      list.push(f);
      bySport.set(m.sport, list);
    }
    const entries = Array.from(bySport.entries()).filter(([, vals]) => vals.length >= 2);
    const categories = entries.map(([sp]) => sp);
    const boxData = entries.map(([, vals]) => {
      const s = [...vals].sort((a, b) => a - b);
      const q = (p: number) => s[Math.min(s.length - 1, Math.floor((s.length - 1) * p))];
      return [s[0], q(0.25), q(0.5), q(0.75), s[s.length - 1]];
    });
    return {
      tooltip: { trigger: 'item' },
      grid: { left: 46, right: 20, top: 18, bottom: 32 },
      xAxis: { type: 'category', data: categories, axisLabel: { color: REPORT_CHART_PALETTE.muted } },
      yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%', color: REPORT_CHART_PALETTE.muted } },
      series: [
        {
          type: 'boxplot',
          data: boxData,
          itemStyle: { color: partnerPalette.primarySoft, borderColor: partnerPalette.primary, borderWidth: 2 },
        },
      ],
    };
  }, [matches, partnerPalette]);

  // 7. ECharts: Wind Speed vs Fill % (Dry vs Rain)
  const windScatterOption = useMemo<echarts.EChartsOption>(() => {
    const outdoor = matches.filter((m) => m.weather && !m.weather.isIndoor && getFillPct(m) !== null);
    const dryPts = outdoor.filter((m) => (m.weather?.precipitationMm ?? 0) === 0).map((m) => [m.weather!.windKmh, getFillPct(m)!, m.cleanName]);
    const wetPts = outdoor.filter((m) => (m.weather?.precipitationMm ?? 0) > 0).map((m) => [m.weather!.windKmh, getFillPct(m)!, m.cleanName]);
    return {
      tooltip: {
        trigger: 'item',
        formatter: (p: unknown) => {
          const item = p as { value?: [number, number, string] };
          return item.value ? `${item.value[2]}<br/>Wind: ${item.value[0]} km/h · Fill: ${item.value[1]}%` : '';
        },
      },
      legend: { data: ['Dry (0 mm)', 'Rain (>0 mm)'], bottom: 0 },
      grid: { left: 46, right: 20, top: 16, bottom: 40 },
      xAxis: { type: 'value', name: 'Wind km/h', axisLabel: { color: REPORT_CHART_PALETTE.muted } },
      yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%', color: REPORT_CHART_PALETTE.muted } },
      series: [
        { name: 'Dry (0 mm)', type: 'scatter', symbolSize: 10, itemStyle: { color: partnerPalette.primary }, data: dryPts },
        { name: 'Rain (>0 mm)', type: 'scatter', symbolSize: 11, itemStyle: { color: REPORT_CHART_PALETTE.rose }, data: wetPts },
      ],
    };
  }, [matches, partnerPalette]);

  // 8. Chart.js: Dual-Axis Monthly Attendance vs Fan Photos
  const monthlyChartJsConfig = useMemo<ChartConfiguration>(
    () => ({
      type: 'bar',
      data: {
        labels: monthlySeries.map((m) => m.month),
        datasets: [
          {
            type: 'bar',
            label: 'Gate Attendance',
            data: monthlySeries.map((m) => m.attendance),
            backgroundColor: partnerPalette.primary,
            borderRadius: 6,
            yAxisID: 'y',
          },
          {
            type: 'line',
            label: 'Fan Photos',
            data: monthlySeries.map((m) => m.photos),
            borderColor: REPORT_CHART_PALETTE.amber,
            backgroundColor: REPORT_CHART_PALETTE.amberSoft,
            tension: 0.35,
            fill: false,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { position: 'left', beginAtZero: true },
          y1: { position: 'right', beginAtZero: true, grid: { drawOnChartArea: false } },
        },
      },
    }),
    [monthlySeries, partnerPalette]
  );

  // 9. Chart.js: Sport Performance Radar (only meaningful for multi-sport scopes)
  const radarSportCount = useMemo(() => {
    const set = new Set<string>();
    for (const m of matches) {
      if (m.sport && m.sport !== 'Other') set.add(m.sport);
    }
    return set.size;
  }, [matches]);

  const radarConfig = useMemo<ChartConfiguration>(() => {
    const bySport = new Map<string, { n: number; fillSum: number; fillN: number; att: number; photos: number; homeWins: number; scored: number }>();
    for (const m of matches) {
      if (!m.sport || m.sport === 'Other') continue;
      const cur = bySport.get(m.sport) ?? { n: 0, fillSum: 0, fillN: 0, att: 0, photos: 0, homeWins: 0, scored: 0 };
      cur.n += 1;
      cur.att += m.attendance || 0;
      cur.photos += m.submitted || 0;
      const f = getFillPct(m);
      if (f !== null) {
        cur.fillSum += f;
        cur.fillN += 1;
      }
      if (m.outcome === 'home_win') cur.homeWins += 1;
      if (m.outcome && m.outcome !== 'unrecorded' && m.outcome !== 'scheduled') cur.scored += 1;
      bySport.set(m.sport, cur);
    }
    const sports = Array.from(bySport.entries()).filter(([, v]) => v.n >= 1).slice(0, 4);
    const totalMatches = matches.length || 1;
    return {
      type: 'radar',
      data: {
        labels: ['Seat Occupancy %', 'Home Win %', 'Match Share %', 'Photo Density (scaled)', 'Attendance Share %'],
        datasets: sports.map(([sport, v], idx) => {
          const avgFill = v.fillN > 0 ? Math.round(v.fillSum / v.fillN) : 0;
          const hwPct = v.scored > 0 ? Math.round((v.homeWins / v.scored) * 100) : 0;
          const matchShare = Math.round((v.n / totalMatches) * 100);
          const density = v.att > 0 ? Math.min(100, Math.round((v.photos / v.att) * 2000)) : 0;
          const totalAtt = matches.reduce((s, m) => s + (m.attendance || 0), 0) || 1;
          const attShare = Math.round((v.att / totalAtt) * 100);
          return {
            label: sport,
            data: [avgFill, hwPct, matchShare, density, attShare],
            borderColor: partnerPalette.series[idx % partnerPalette.series.length],
            backgroundColor: idx % 2 === 0 ? partnerPalette.primarySoft : partnerPalette.accentSoft,
          };
        }),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { r: { min: 0, max: 100, ticks: { stepSize: 25 } } },
      },
    };
  }, [matches, partnerPalette]);

  // 10. Chart.js: Age Polar Area
  const ageGroups = vision?.aggregates?.ageGroups;
  const agePolarConfig = useMemo<ChartConfiguration>(
    () => ({
      type: 'polarArea',
      data: {
        labels: ['Children', 'Teenagers', 'Adults', 'Seniors'],
        datasets: [
          {
            data: ageGroups ? [ageGroups.children, ageGroups.teens, ageGroups.adults, ageGroups.seniors] : [0, 0, 0, 0],
            backgroundColor: [
              REPORT_CHART_PALETTE.cyan,
              REPORT_CHART_PALETTE.teal,
              partnerPalette.primary,
              REPORT_CHART_PALETTE.violet,
            ],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    }),
    [ageGroups, partnerPalette]
  );

  // 11. Chart.js: Emotion Doughnut
  const emotions = useMemo(() => vision?.aggregates?.topEmotions ?? [], [vision?.aggregates?.topEmotions]);
  const emotionDoughnutConfig = useMemo<ChartConfiguration>(
    () => ({
      type: 'doughnut',
      data: {
        labels: emotions.slice(0, 6).map((e) => e.emotion),
        datasets: [
          {
            data: emotions.slice(0, 6).map((e) => e.count),
            backgroundColor: [...partnerPalette.series],
          },
        ],
      },
      options: { responsive: true, maintainAspectRatio: false },
    }),
    [emotions, partnerPalette]
  );

  // 12. Chart.js: Top Venues Attended vs Empty Seats (Horizontal Stacked)
  const venueStackConfig = useMemo<ChartConfiguration>(() => {
    const vMap = new Map<string, { att: number; cap: number }>();
    for (const m of matches) {
      if (!m.venue || !m.venueCapacity) continue;
      const cur = vMap.get(m.venue) ?? { att: 0, cap: 0 };
      cur.att += m.attendance || 0;
      cur.cap += m.venueCapacity;
      vMap.set(m.venue, cur);
    }
    const top = Array.from(vMap.entries()).sort((a, b) => b[1].att - a[1].att).slice(0, 8);
    return {
      type: 'bar',
      data: {
        labels: top.map(([name]) => name.length > 22 ? `${name.slice(0, 20)}…` : name),
        datasets: [
          { label: 'Attended', data: top.map(([, v]) => v.att), backgroundColor: partnerPalette.primary },
          { label: 'Unoccupied', data: top.map(([, v]) => Math.max(0, v.cap - v.att)), backgroundColor: REPORT_CHART_PALETTE.grid },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { stacked: true }, y: { stacked: true } },
      },
    };
  }, [matches, partnerPalette]);

  // 13. Chart.js: Temp x Fill % x Photos Bubble Chart
  const bubbleConfig = useMemo<ChartConfiguration>(() => {
    const pts = matches
      .filter((m) => m.weather && getFillPct(m) !== null)
      .map((m) => ({
        x: m.weather!.tempC,
        y: getFillPct(m)!,
        r: Math.min(20, Math.max(4, Math.sqrt(m.submitted || 1) * 0.85)),
      }));
    return {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: 'Matches (size = fan photos)',
            data: pts,
            backgroundColor: partnerPalette.primarySoft,
            borderColor: partnerPalette.primary,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { title: { display: true, text: 'Temperature (°C)' } },
          y: { min: 0, max: 100, title: { display: true, text: 'Stadium Seat Occupancy (%)' } },
        },
      },
    };
  }, [matches, partnerPalette]);

  // 14. D3: Top 12 Fixtures Capture Rate
  const lollipopItems = useMemo(
    () =>
      matches
        .filter((m) => (m.attendance ?? 0) > 0 && m.submitted > 0)
        .map((m) => ({
          name: m.cleanName.length > 44 ? `${m.cleanName.slice(0, 42)}…` : m.cleanName,
          rate: Math.round((m.submitted / m.attendance!) * 10000) / 10,
          photos: m.submitted,
          attendance: m.attendance!,
        }))
        .sort((a, b) => b.rate - a.rate)
        .slice(0, 12),
    [matches]
  );

  // 15. ECharts: All Events Photo Volume Treemap (treemap-simple, largest to smallest)
  const eventsWithPhotos = useMemo(
    () => [...matches].filter((m) => m.submitted > 0).sort((a, b) => b.submitted - a.submitted),
    [matches]
  );

  const allEventsTreemapOption = useMemo<echarts.EChartsOption>(
    () => ({
      tooltip: {
        formatter: (info: unknown) => {
          const item = info as { name?: string; value?: number; data?: { date?: string; venue?: string; sport?: string } };
          const meta = [item.data?.sport, item.data?.date, item.data?.venue].filter(Boolean).join(' · ');
          return `<strong>${item.name ?? ''}</strong><br/>${(item.value ?? 0).toLocaleString()} photos${meta ? `<br/>${meta}` : ''}`;
        },
      },
      color: [...partnerPalette.series],
      series: [
        {
          name: 'Events by Photos',
          type: 'treemap',
          roam: false,
          nodeClick: 'zoomToNode',
          breadcrumb: { show: true, bottom: 2 },
          label: { show: true, formatter: '{b}\n{c}' },
          upperLabel: { show: false },
          itemStyle: { borderColor: REPORT_CHART_PALETTE.surface, borderWidth: 1.5, gapWidth: 1.5 },
          data: eventsWithPhotos.map((m) => ({
            name: m.cleanName,
            value: m.submitted,
            date: m.date,
            venue: m.venue,
            sport: m.sport,
          })),
        },
      ],
    }),
    [eventsWithPhotos, partnerPalette]
  );

  // 16. ECharts: Top 15 Events Photo Concentration Pareto
  const eventsParetoOption = useMemo<echarts.EChartsOption>(() => {
    const top15 = eventsWithPhotos.slice(0, 15);
    const total = eventsWithPhotos.reduce((s, m) => s + m.submitted, 0) || 1;
    let running = 0;
    const cumPct = top15.map((m) => {
      running += m.submitted;
      return Math.round((running / total) * 1000) / 10;
    });
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: 48, right: 48, top: 20, bottom: 88 },
      xAxis: {
        type: 'category',
        data: top15.map((m) => (m.cleanName.length > 24 ? `${m.cleanName.slice(0, 22)}…` : m.cleanName)),
        axisLabel: { rotate: 32, interval: 0, color: REPORT_CHART_PALETTE.muted, fontSize: 10 },
      },
      yAxis: [
        { type: 'value', name: 'Photos', axisLabel: { color: REPORT_CHART_PALETTE.muted } },
        { type: 'value', name: 'Cum %', min: 0, max: 100, axisLabel: { formatter: '{value}%', color: REPORT_CHART_PALETTE.muted } },
      ],
      series: [
        { name: 'Photos', type: 'bar', data: top15.map((m) => m.submitted), itemStyle: { color: partnerPalette.primary, borderRadius: [6, 6, 0, 0] } },
        { name: 'Cumulative %', type: 'line', yAxisIndex: 1, smooth: true, data: cumPct, itemStyle: { color: REPORT_CHART_PALETTE.amber }, lineStyle: { width: 2.5 } },
      ],
    };
  }, [eventsWithPhotos, partnerPalette]);

  // 17. ECharts: Sport -> Top Events Sunburst
  const sportSunburstOption = useMemo<echarts.EChartsOption>(() => {
    const bySport = new Map<string, MatchItem[]>();
    for (const m of eventsWithPhotos) {
      const list = bySport.get(m.sport) ?? [];
      list.push(m);
      bySport.set(m.sport, list);
    }
    const children = Array.from(bySport.entries()).map(([sport, list]) => ({
      name: sport,
      children: list.slice(0, 4).map((m) => ({
        name: m.cleanName.length > 20 ? `${m.cleanName.slice(0, 18)}…` : m.cleanName,
        value: m.submitted,
      })),
    }));
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} photos' },
      color: [...partnerPalette.series],
      series: [
        {
          type: 'sunburst',
          radius: ['16%', '90%'],
          nodeClick: 'rootToNode',
          label: { rotate: 'radial', fontSize: 10, minAngle: 10, overflow: 'truncate', width: 68 },
          data: children,
        },
      ],
    };
  }, [eventsWithPhotos, partnerPalette]);

  // 18. ECharts: Environment -> Sport -> Outcome Attendance Sankey
  const attendanceSankeyOption = useMemo<echarts.EChartsOption>(() => {
    const linkMap = new Map<string, number>();
    const nodeSet = new Set<string>();
    const addLink = (source: string, target: string, val: number) => {
      if (val <= 0 || source === target) return;
      nodeSet.add(source);
      nodeSet.add(target);
      const k = `${source}|${target}`;
      linkMap.set(k, (linkMap.get(k) ?? 0) + val);
    };
    for (const m of matches) {
      const att = m.attendance || 0;
      if (att <= 0) continue;
      const env = m.weather?.isIndoor ? 'Indoor Arena' : 'Outdoor Stadium';
      const sport = m.sport || 'Other';
      const outcomeLabel =
        m.outcome === 'home_win'
          ? 'Home Win'
          : m.outcome === 'away_win'
            ? 'Away Win'
            : m.outcome === 'draw'
              ? 'Draw'
              : 'Unrecorded';
      addLink(env, sport, att);
      addLink(sport, outcomeLabel, att);
    }
    const links = Array.from(linkMap.entries()).map(([k, value]) => {
      const [source, target] = k.split('|');
      return { source, target, value };
    });
    const nodes = Array.from(nodeSet).map((name) => ({ name }));
    return {
      tooltip: { trigger: 'item', triggerOn: 'mousemove' },
      color: [...partnerPalette.series],
      series: [
        {
          type: 'sankey',
          emphasis: { focus: 'adjacency' },
          data: nodes,
          links,
          lineStyle: { color: 'gradient', curveness: 0.5 },
        },
      ],
    };
  }, [matches, partnerPalette]);

  // 19. ECharts: Multi-Dimensional Fixture Parallel Coordinates
  const parallelOption = useMemo<echarts.EChartsOption>(() => {
    const rows = matches
      .filter((m) => m.weather && (m.venueCapacity ?? 0) > 0 && (m.attendance ?? 0) > 0)
      .slice(0, 60)
      .map((m) => [
        m.weather!.tempC,
        m.venueCapacity!,
        m.attendance!,
        getFillPct(m) ?? 0,
        m.submitted || 0,
      ]);
    return {
      parallelAxis: [
        { dim: 0, name: 'Temp °C' },
        { dim: 1, name: 'Capacity' },
        { dim: 2, name: 'Attendance' },
        { dim: 3, name: 'Seat Occupancy %', max: 100 },
        { dim: 4, name: 'Photos' },
      ],
      series: {
        type: 'parallel',
        lineStyle: { width: 1.5, opacity: 0.45, color: partnerPalette.primary },
        data: rows,
      },
    };
  }, [matches, partnerPalette]);

  if (matches.length === 0 && brands.length === 0) return null;

  const hasBrandsSection =
    brands.length > 0 ||
    clubs.length > 0 ||
    Boolean(ageGroups && ageGroups.children + ageGroups.teens + ageGroups.adults + ageGroups.seniors > 0) ||
    emotions.length > 0;
  const hasEventsSection = eventsWithPhotos.length >= 2;
  const hasVenueSeatData = matches.some(
    (m) => Boolean(m.venue?.trim()) && (m.venueCapacity ?? 0) > 0 && (m.attendance ?? 0) > 0,
  );
  const hasMonthlyAttendance =
    monthlySeries.length >= 2 && monthlySeries.some((m) => m.attendance > 0);
  const hasAttendanceSection =
    monthlySeries.length > 1 ||
    (monthlySeries.length >= 2 && hasFillData) ||
    (hasFillData && matches.length >= 2) ||
    hasMonthlyAttendance ||
    hasVenueSeatData;
  const weatherMatchCount = matches.filter(
    (m) => m.weather && (m.venueCapacity ?? 0) > 0 && (m.attendance ?? 0) > 0,
  ).length;
  const hasWeatherSection =
    weatherMatchCount >= 2 ||
    (weatherMatchCount >= 2 && (hasBoxplotData || hasOutdoorWindFillData || hasWeatherBubbleData)) ||
    radarSportCount >= 2;

  if (!hasBrandsSection && !hasEventsSection && !hasAttendanceSection && !hasWeatherSection) {
    return null;
  }

  const domainTabs = [
    { id: 'all' as const, label: 'All Insights', visible: true },
    { id: 'brands' as const, label: 'Brands & Audience', visible: hasBrandsSection },
    { id: 'events' as const, label: 'Events & Photos', visible: hasEventsSection },
    { id: 'attendance' as const, label: 'Attendance & Venues', visible: hasAttendanceSection },
    { id: 'weather' as const, label: 'Weather', visible: hasWeatherSection },
  ].filter((tab) => tab.visible);

  const showEvents = (domain === 'all' || domain === 'events') && hasEventsSection;
  const showAttendance = (domain === 'all' || domain === 'attendance') && hasAttendanceSection;
  const showWeather = (domain === 'all' || domain === 'weather') && hasWeatherSection;
  const showBrands = (domain === 'all' || domain === 'brands') && hasBrandsSection;

  return (
    <section className={styles.suiteStack} aria-label="Deep-Dive Visual Intelligence">
      {domainTabs.length > 2 && (
      <div className={styles.bentoPanel}>
        <header className={styles.bentoPanelHeader}>
          <div className={styles.bentoPanelTitle}>
            <span className={styles.bentoPanelIcon} aria-hidden="true">📊</span>
            <h2 className={styles.gdsCardTitle}>Deep-dive visual intelligence</h2>
          </div>
          <div className={styles.bentoToggle} role="tablist" aria-label="Filter analytics domain">
            {domainTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={domain === tab.id}
                onClick={() => setDomain(tab.id)}
                className={`${styles.bentoToggleBtn} ${domain === tab.id ? styles.bentoToggleBtnActive : ''}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </header>
      </div>
      )}

      {/* Tier 1 & 2: Brands, Merch & Audience */}
      {showBrands && (
        <>
          <div className={styles.bentoTwoCol}>
            {brands.length > 0 && (
              <EChartsPanel
                title="Share of sponsor brand visibility"
                icon="🏷️"
                status={`Top ${Math.min(18, brands.length)} brands`}
                description="Shows each commercial brand's share of total logo detections—useful for sponsor tiering and pitch decks."
                option={treemapOption}
              />
            )}
            {clubs.length > 0 && (
              <EChartsPanel
                title="Team merch &amp; jersey share"
                icon="🌹"
                status={`Top ${Math.min(8, clubs.length)} clubs`}
                description="Compares which clubs' jerseys and scarves fans wear most often in the stands."
                option={roseOption}
              />
            )}
          </div>
          <div className={styles.bentoTwoCol}>
            {ageGroups && (ageGroups.children + ageGroups.teens + ageGroups.adults + ageGroups.seniors) > 0 && (
              <ChartJsPanel
                title="Age groups in the crowd"
                icon="🧭"
                description="Breaks down kids, teens, adults, and seniors so sponsors can match products to the actual crowd."
                config={agePolarConfig}
              />
            )}
            {emotions.length > 0 && (
              <ChartJsPanel
                title="How fans feel in photos"
                icon="😊"
                description="Measures happiness, excitement, and calm expressions so you can prove positive brand sentiment."
                config={emotionDoughnutConfig}
              />
            )}
          </div>
        </>
      )}

      {/* Tier 2 & 3: Events & Photo Volume */}
      {showEvents && eventsWithPhotos.length >= 2 && (
        <>
          <EChartsPanel
            title={`Which matches drove the most photos (${eventsWithPhotos.length} events)`}
            icon="🖼️"
            status="Click to zoom"
            description="Larger blocks mean more fan photos—spot your biggest matchday activations at a glance."
            option={allEventsTreemapOption}
            tall
          />
          <div className={styles.bentoTwoCol}>
            <EChartsPanel
              title="Top 15 matches driving total photo volume"
              icon="📊"
              description="Shows whether a few marquee games generate most of your photos or if volume is spread evenly."
              option={eventsParetoOption}
            />
            <EChartsPanel
              title="Photo breakdown by sport &amp; match"
              icon="☀️"
              description="Groups fan photos by sport and match so you can see which competitions contribute the most."
              option={sportSunburstOption}
            />
          </div>
          {lollipopItems.length >= 2 && <D3LollipopPanel items={lollipopItems} primaryColor={primaryColor} />}
        </>
      )}

      {/* Tier 3: Attendance & Venues */}
      {showAttendance && (
        <>
          {matches.some((m) => (m.attendance ?? 0) > 0) && (
            <EChartsPanel
              title="How attendance flows across venues &amp; results"
              icon="🔀"
              status="Attendance flow"
              description="Traces how total ticketed fans split between indoor/outdoor venues, sports, and match outcomes."
              option={attendanceSankeyOption}
              tall
            />
          )}
          {monthlySeries.length > 1 && (
            <EChartsPanel
              title="Season growth in attendance &amp; photos"
              icon="📈"
              status={`${monthlySeries.length} months`}
              description="Tracks cumulative crowd and photo momentum over the season to show long-term campaign growth."
              option={cumulativeOption}
              tall
            />
          )}
          <div className={styles.bentoTwoCol}>
            {monthlySeries.length >= 2 && hasFillData && (
              <EChartsPanel
                title="Best days &amp; months for stadium fill"
                icon="🗓️"
                description="Reveals which days of the week and months draw the fullest crowds to help plan future schedules."
                option={heatmapOption}
              />
            )}
            {hasFillData && matches.length >= 2 && (
              <EChartsPanel
                title="Average stadium fill across all games"
                icon="⏱️"
                description="Gives a single headline score for how full your venues are across the selected matches."
                option={gaugeOption}
              />
            )}
          </div>
          <div className={styles.bentoTwoCol}>
            {hasMonthlyAttendance && (
              <ChartJsPanel
                title="Monthly crowd size vs. fan photos"
                icon="📊"
                description="Compares monthly ticketed attendance against photo counts to spot months with high or low fan engagement."
                config={monthlyChartJsConfig}
              />
            )}
            {hasVenueSeatData && (
              <ChartJsPanel
                title="Filled vs. empty seats by venue"
                icon="🏟️"
                description="Shows where empty seats still exist in top stadiums—highlighting ticket and fan-zone growth opportunities."
                config={venueStackConfig}
              />
            )}
          </div>
        </>
      )}

      {/* Tier 4: Background Weather Context (Lowest Priority) */}
      {showWeather && (
        <>
          {weatherMatchCount >= 2 && (
            <EChartsPanel
              title="Match profile: weather, seats &amp; photos"
              icon="🧬"
              status="Temp · Capacity · Attendance · Seat Occupancy % · Photos"
              description="Connects temperature, stadium size, turnout, and photo counts to show what conditions produce peak matchdays."
              option={parallelOption}
            />
          )}
          {weatherMatchCount >= 2 && (hasBoxplotData || hasOutdoorWindFillData) && (
            <div className={styles.bentoTwoCol}>
              {hasBoxplotData && (
                <EChartsPanel
                  title="Attendance range by sport"
                  icon="📦"
                  description="Shows the typical, peak, and lowest stadium seat occupancy so you can benchmark consistency."
                  option={boxplotOption}
                />
              )}
              {hasOutdoorWindFillData && (
                <EChartsPanel
                  title="Wind &amp; rain impact on outdoor crowds"
                  icon="💨"
                  description="Tests whether windy or rainy matchdays noticeably reduce outdoor stadium turnout."
                  option={windScatterOption}
                />
              )}
            </div>
          )}
          {(radarSportCount >= 2 || (weatherMatchCount >= 2 && hasWeatherBubbleData)) && (
            <div className={styles.bentoTwoCol}>
              {radarSportCount >= 2 && (
                <ChartJsPanel
                  title="Sport-by-sport performance comparison"
                  icon="🕸️"
                  description="Compares stadium seat occupancy, win rate, and photo density across sports to show where activation performs best."
                  config={radarConfig}
                />
              )}
              {weatherMatchCount >= 2 && hasWeatherBubbleData && (
                <ChartJsPanel
                  title="Temperature, seat occupancy &amp; photo volume"
                  icon="🫧"
                  description="Shows whether warmer matchdays bring bigger crowds and larger fan photo volumes (bubble size)."
                  config={bubbleConfig}
                />
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
