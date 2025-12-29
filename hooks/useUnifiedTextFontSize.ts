// hooks/useUnifiedTextFontSize.ts
// WHAT: Calculate unified font-size for all text charts in a block
// WHY: Ensure all text charts use same font-size, fitting the largest content
// HOW: Measure all text chart containers, calculate optimal size for each, use minimum

import { useEffect, useState, useRef } from 'react';
import type { ChartResult } from '@/lib/report-calculator';
import { calculateUnifiedFontSize } from '@/lib/textFontSizeCalculator';

/**
 * WHAT: Hook to calculate unified font-size for text charts in a block
 * WHY: All text charts in a block should use the same font-size
 * HOW: Measure containers, calculate optimal sizes, return minimum
 * 
 * @param chartResults - Map of chart results
 * @param chartIds - Array of chart IDs in the block
 * @param blockRef - Ref to the block container element
 * @returns Unified font-size in rem, or null if not calculated yet
 */
export function useUnifiedTextFontSize(
  chartResults: Map<string, ChartResult>,
  chartIds: string[],
  blockRef: React.RefObject<HTMLDivElement>
): number | null {
  const [unifiedFontSize, setUnifiedFontSize] = useState<number | null>(null);
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // WHAT: Clear any pending calculations
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }

    // WHAT: Delay calculation to ensure DOM is ready
    // WHY: Need containers to be rendered and measured
    calculationTimeoutRef.current = setTimeout(() => {
      if (!blockRef.current) {
        return;
      }

      // WHAT: Find all text charts in the block
      // WHY: Only calculate for text charts
      const textCharts = chartIds
        .map(id => {
          const result = chartResults.get(id);
          if (result?.type === 'text' && typeof result.kpiValue === 'string' && result.kpiValue.length > 0) {
            return { id, result };
          }
          return null;
        })
        .filter((chart): chart is { id: string; result: ChartResult } => chart !== null);

      if (textCharts.length === 0) {
        setUnifiedFontSize(null);
        return;
      }

      // WHAT: Find all text chart containers in the DOM
      // WHY: Need to measure actual container dimensions
      const textChartContainers = textCharts
        .map(({ id }) => {
          const container = blockRef.current?.querySelector(
            `[data-chart-id="${id}"] .textContentWrapper`
          ) as HTMLElement;
          return container;
        })
        .filter((container): container is HTMLElement => container !== null);

      if (textChartContainers.length === 0 || textChartContainers.length !== textCharts.length) {
        // WHAT: Not all containers found yet, retry later
        // WHY: DOM might not be fully rendered
        // Retry will happen on next effect run or resize
        return;
      }

      // WHAT: Get container dimensions and content
      // WHY: Need width, height, and content for calculation
      const dimensions = textChartContainers.map(container => {
        const rect = container.getBoundingClientRect();
        return {
          width: rect.width - 16, // Subtract padding (2 * 0.5rem = 1rem = 16px)
          height: rect.height - 16, // Subtract padding
        };
      });

      const contents = textCharts.map(({ result }) => {
        // WHAT: Get raw markdown content
        // WHY: Need to measure actual content, not rendered HTML
        return typeof result.kpiValue === 'string' ? result.kpiValue : '';
      });

      // WHAT: Calculate unified font-size
      // WHY: All charts should use the same size
      const unifiedSize = calculateUnifiedFontSize(contents, dimensions);
      setUnifiedFontSize(unifiedSize);
    }, 100);

    // WHAT: Recalculate on window resize
    // WHY: Container sizes change on resize
    const handleResize = () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
      // WHAT: Trigger recalculation by clearing and resetting state
      // WHY: Force effect to re-run with new dimensions
      setUnifiedFontSize(null);
      calculationTimeoutRef.current = setTimeout(() => {
        // Re-run calculation logic
        if (!blockRef.current) return;
        
        const textCharts = chartIds
          .map(id => {
            const result = chartResults.get(id);
            if (result?.type === 'text' && typeof result.kpiValue === 'string' && result.kpiValue.length > 0) {
              return { id, result };
            }
            return null;
          })
          .filter((chart): chart is { id: string; result: ChartResult } => chart !== null);

        if (textCharts.length === 0) {
          setUnifiedFontSize(null);
          return;
        }

        const textChartContainers = textCharts
          .map(({ id }) => {
            const container = blockRef.current?.querySelector(
              `[data-chart-id="${id}"] .textContentWrapper`
            ) as HTMLElement;
            return container;
          })
          .filter((container): container is HTMLElement => container !== null);

        if (textChartContainers.length === 0 || textChartContainers.length !== textCharts.length) {
          return;
        }

        const dimensions = textChartContainers.map(container => {
          const rect = container.getBoundingClientRect();
          return {
            width: rect.width - 16,
            height: rect.height - 16,
          };
        });

        const contents = textCharts.map(({ result }) => {
          return typeof result.kpiValue === 'string' ? result.kpiValue : '';
        });

        const unifiedSize = calculateUnifiedFontSize(contents, dimensions);
        setUnifiedFontSize(unifiedSize);
      }, 200);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [chartResults, chartIds, blockRef]);

  return unifiedFontSize;
}

