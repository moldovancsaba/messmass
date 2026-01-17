// components/ChartErrorBoundary.tsx
// WHAT: React error boundary for chart rendering (A-R-13)
// WHY: Prevent chart rendering errors from crashing entire report
// HOW: Catch rendering errors and display error placeholder

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import MaterialIcon from './MaterialIcon';
import styles from '@/app/report/[slug]/ReportChart.module.css';

interface ChartErrorBoundaryProps {
  children: ReactNode;
  chartId?: string;
  chartTitle?: string;
  fallback?: ReactNode;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * WHAT: Error boundary component for chart rendering
 * WHY: Catch rendering errors to prevent entire report from crashing
 * HOW: Display error placeholder when rendering error occurs
 */
export class ChartErrorBoundary extends Component<ChartErrorBoundaryProps, ChartErrorBoundaryState> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ChartErrorBoundaryState> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('[ChartErrorBoundary] Chart rendering error:', {
      chartId: this.props.chartId,
      chartTitle: this.props.chartTitle,
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      // Display error placeholder
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className={`${styles.chart} ${styles.chartError}`}>
          <MaterialIcon name="error_outline" className={styles.chartErrorIcon} />
          <div className={styles.chartErrorTitle}>
            {this.props.chartTitle || 'Chart Error'}
          </div>
          <div className={styles.chartErrorMessage}>
            Chart rendering failed. Please refresh the page or contact support if the issue persists.
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
