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
