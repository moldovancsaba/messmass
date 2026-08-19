const CHART_PALETTE_HEX = [
  '#3b82f6',
  '#10b981',
  '#8b5cf6',
  '#f97316',
  '#ec4899',
  '#06b6d4',
  '#eab308',
  '#ef4444',
  '#6366f1',
  '#14b8a6',
] as const;

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const int = Number.parseInt(value, 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// WHAT: Minimal structural type for Chart.js's external-tooltip callback
//     context - only the fields the handler below reads.
// WHY: Keeps lib/chartTheme.ts free of a chart.js import; the chart
//     components (the only consumers) hold the real dependency.
type ExternalTooltipContext = {
  chart: { canvas: HTMLCanvasElement };
  tooltip: {
    opacity: number;
    title?: string[];
    body?: { lines: string[] }[];
    labelColors?: { backgroundColor: string | object }[];
  };
};

// WHAT: External tooltip handler that renders overlay info into a fixed
//     top-center HTML bubble inside the chart container, instead of letting
//     Chart.js paint the tooltip onto the canvas.
// WHY: Canvas-drawn tooltips are physically clipped at the canvas edge, so
//     long labels ("Refused Images (unwanted content detected)") got cut
//     mid-word near the border - observed live twice on report donuts. An
//     HTML bubble pinned top-center wraps via CSS up to the full container
//     width, so no label length can ever clip. The bubble element is created
//     once per chart, reused across hovers, and toggled via data-visible so
//     all styling stays in the CSS module.
export function createTopCenterTooltipHandler(bubbleClassName: string) {
  return ({ chart, tooltip }: ExternalTooltipContext) => {
    const parent = chart.canvas.parentElement;
    if (!parent) return;

    let bubble = parent.querySelector<HTMLElement>(':scope > [data-chart-tooltip]');
    if (!bubble) {
      bubble = document.createElement('div');
      bubble.setAttribute('data-chart-tooltip', '');
      bubble.setAttribute('role', 'status');
      bubble.className = bubbleClassName;
      parent.appendChild(bubble);
    }

    if (tooltip.opacity === 0) {
      bubble.setAttribute('data-visible', 'false');
      return;
    }

    bubble.replaceChildren();

    // Per-segment color swatch, mirroring the canvas tooltip's color box.
    const swatchColor = tooltip.labelColors?.[0]?.backgroundColor;
    if (typeof swatchColor === 'string') {
      const swatch = document.createElement('i');
      swatch.setAttribute('aria-hidden', 'true');
      swatch.style.backgroundColor = swatchColor;
      bubble.appendChild(swatch);
    }

    const title = document.createElement('strong');
    title.textContent = (tooltip.title ?? []).join(' ');
    bubble.appendChild(title);

    for (const line of (tooltip.body ?? []).flatMap((item) => item.lines)) {
      const bodyLine = document.createElement('div');
      bodyLine.textContent = line;
      bubble.appendChild(bodyLine);
    }

    bubble.setAttribute('data-visible', 'true');
  };
}

export const CHART_THEME = {
  palette: CHART_PALETTE_HEX,
  tooltipBackground: 'rgba(31, 41, 55, 0.95)',
  tooltipBorder: '#d1d5db',
  tooltipText: '#ffffff',
  legendText: '#4b5563',
  axisText: '#6b7280',
  axisBorder: '#e5e7eb',
  gridLine: 'rgba(229, 231, 235, 0.5)',
  lineGradientFadeAlpha: 0,
  fontFamily: 'inherit',
  linePalette(index: number) {
    return CHART_PALETTE_HEX[index % CHART_PALETTE_HEX.length];
  },
  fillPalette(index: number, alpha: number) {
    return hexToRgba(CHART_PALETTE_HEX[index % CHART_PALETTE_HEX.length], alpha);
  },
};
