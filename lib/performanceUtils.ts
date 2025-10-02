/**
 * Performance Utilities for MessMass
 * 
 * WHAT: React optimization utilities for component memoization and rendering performance
 * WHY: Reduce unnecessary re-renders and improve application responsiveness
 * 
 * This file provides utilities for:
 * - Deep comparison functions for complex props
 * - Memoization helpers
 * - Performance monitoring utilities
 */

/**
 * WHAT: Deep comparison for hashtag arrays
 * WHY: Prevent re-renders when hashtag arrays have the same content
 */
export function areHashtagArraysEqual(prev: string[], next: string[]): boolean {
  if (prev.length !== next.length) return false;
  return prev.every((tag, i) => tag === next[i]);
}

/**
 * WHAT: Deep comparison for categorized hashtags object
 * WHY: Prevent re-renders when categorized hashtags structure hasn't changed
 */
export function areCategorizedHashtagsEqual(
  prev: { [key: string]: string[] },
  next: { [key: string]: string[] }
): boolean {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  return prevKeys.every(key => {
    if (!next[key]) return false;
    return areHashtagArraysEqual(prev[key], next[key]);
  });
}

/**
 * WHAT: Shallow comparison for HashtagCategory arrays
 * WHY: Prevent re-renders when category configuration hasn't changed
 */
export function areCategoryArraysEqual(
  prev: Array<{ _id?: any; name: string; color: string; order: number }>,
  next: Array<{ _id?: any; name: string; color: string; order: number }>
): boolean {
  if (prev.length !== next.length) return false;
  
  return prev.every((cat, i) => {
    const nextCat = next[i];
    return cat.name === nextCat.name && 
           cat.color === nextCat.color && 
           cat.order === nextCat.order;
  });
}

/**
 * WHAT: Stats object shallow comparison
 * WHY: Prevent chart re-renders when stats haven't changed
 */
export function areStatsEqual(
  prev: Record<string, number | undefined>,
  next: Record<string, number | undefined>
): boolean {
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  
  if (prevKeys.length !== nextKeys.length) return false;
  
  return prevKeys.every(key => prev[key] === next[key]);
}

/**
 * WHAT: Performance monitoring hook data
 * WHY: Track component render performance in development
 */
interface RenderMetrics {
  componentName: string;
  renderCount: number;
  lastRenderTime: number;
  averageRenderTime: number;
}

const renderMetrics = new Map<string, RenderMetrics>();

/**
 * WHAT: Track component render performance
 * WHY: Identify components that need optimization
 * 
 * Usage in component:
 * ```
 * useEffect(() => {
 *   trackComponentRender('MyComponent');
 * });
 * ```
 */
export function trackComponentRender(componentName: string): void {
  if (process.env.NODE_ENV !== 'development') return;
  
  const now = performance.now();
  const existing = renderMetrics.get(componentName);
  
  if (!existing) {
    renderMetrics.set(componentName, {
      componentName,
      renderCount: 1,
      lastRenderTime: now,
      averageRenderTime: 0
    });
  } else {
    const renderTime = now - existing.lastRenderTime;
    const newAverage = (existing.averageRenderTime * existing.renderCount + renderTime) / (existing.renderCount + 1);
    
    renderMetrics.set(componentName, {
      componentName,
      renderCount: existing.renderCount + 1,
      lastRenderTime: now,
      averageRenderTime: newAverage
    });
    
    // Warn about frequent re-renders
    if (existing.renderCount > 10 && existing.renderCount % 10 === 0) {
      console.warn(
        `⚠️ ${componentName} has rendered ${existing.renderCount} times. ` +
        `Average time: ${newAverage.toFixed(2)}ms`
      );
    }
  }
}

/**
 * WHAT: Get render metrics for all tracked components
 * WHY: Analyze performance bottlenecks
 */
export function getRenderMetrics(): RenderMetrics[] {
  return Array.from(renderMetrics.values()).sort((a, b) => b.renderCount - a.renderCount);
}

/**
 * WHAT: Clear render metrics
 * WHY: Reset performance tracking between tests
 */
export function clearRenderMetrics(): void {
  renderMetrics.clear();
}

/**
 * WHAT: Custom memo comparison for ColoredHashtagBubble
 * WHY: Prevent re-renders when props haven't meaningfully changed
 */
export function compareHashtagBubbleProps(
  prevProps: any,
  nextProps: any
): boolean {
  // If hashtag string changed, re-render
  if (prevProps.hashtag !== nextProps.hashtag) return false;
  
  // If styling props changed, re-render
  if (
    prevProps.small !== nextProps.small ||
    prevProps.interactive !== nextProps.interactive ||
    prevProps.showCategoryPrefix !== nextProps.showCategoryPrefix ||
    prevProps.categoryColor !== nextProps.categoryColor ||
    prevProps.removable !== nextProps.removable
  ) {
    return false;
  }
  
  // If project context changed, re-render
  if (
    prevProps.projectCategorizedHashtags !== nextProps.projectCategorizedHashtags &&
    !areCategorizedHashtagsEqual(
      prevProps.projectCategorizedHashtags || {},
      nextProps.projectCategorizedHashtags || {}
    )
  ) {
    return false;
  }
  
  // Props are equal, skip re-render
  return true;
}

/**
 * WHAT: Custom memo comparison for chart components
 * WHY: Prevent chart re-renders when stats haven't changed
 */
export function compareChartProps(
  prevProps: { stats: any; eventName?: string },
  nextProps: { stats: any; eventName?: string }
): boolean {
  // If event name changed, re-render
  if (prevProps.eventName !== nextProps.eventName) return false;
  
  // Compare stats object
  return areStatsEqual(prevProps.stats, nextProps.stats);
}

/**
 * WHAT: Debounce utility for expensive operations
 * WHY: Reduce frequency of expensive calculations or API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * WHAT: Throttle utility for high-frequency events
 * WHY: Limit execution rate for scroll, resize, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
