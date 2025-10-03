'use client';

import { useCallback } from 'react';
import type { Chart as ChartJS } from 'chart.js';

/* What: Custom hook for exporting Chart.js charts as PNG
   Why: Centralized chart export logic with error handling
   
   Usage:
   const { exportChartAsPNG, isExporting } = useChartExport();
   <button onClick={() => exportChartAsPNG(chartRef.current, 'my-chart')}>
     Export PNG
   </button>
*/

interface UseChartExportReturn {
  exportChartAsPNG: (chart: ChartJS | null, filename: string) => Promise<void>;
  copyChartToClipboard: (chart: ChartJS | null) => Promise<void>;
  isExporting: boolean;
}

export function useChartExport(): UseChartExportReturn {
  /* What: Export chart as PNG using Chart.js native toBase64Image
     Why: Canvas-based charts have built-in export capability - no DOM capture needed */
  const exportChartAsPNG = useCallback(async (chart: ChartJS | null, filename: string) => {
    if (!chart) {
      console.error('Chart reference is null');
      alert('Chart not ready for export');
      return;
    }

    try {
      /* What: Use Chart.js native method to get base64 image
         Why: More reliable than html2canvas for canvas elements */
      const base64Image = chart.toBase64Image('image/png', 1.0);
      
      /* What: Create download link and trigger download
         Why: Standard browser download pattern */
      const link = document.createElement('a');
      link.href = base64Image;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      console.log(`✅ Chart exported as ${filename}.png`);
    } catch (error) {
      console.error('Failed to export chart:', error);
      alert('Failed to export chart. Please try again.');
    }
  }, []);

  /* What: Copy chart image to clipboard
     Why: Quick sharing without downloading file */
  const copyChartToClipboard = useCallback(async (chart: ChartJS | null) => {
    if (!chart) {
      console.error('Chart reference is null');
      alert('Chart not ready for clipboard copy');
      return;
    }

    try {
      /* What: Check if Clipboard API is supported
         Why: Not all browsers support clipboard write */
      if (!navigator.clipboard || !window.ClipboardItem) {
        alert('Clipboard copy not supported in this browser');
        return;
      }

      /* What: Convert base64 to blob for clipboard
         Why: Clipboard API requires blob format */
      const base64Image = chart.toBase64Image('image/png', 1.0);
      const response = await fetch(base64Image);
      const blob = await response.blob();
      
      /* What: Write blob to clipboard
         Why: Allow pasting into other applications */
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      
      alert('Chart copied to clipboard! 📋');
      console.log('✅ Chart copied to clipboard');
    } catch (error) {
      console.error('Failed to copy chart to clipboard:', error);
      alert('Failed to copy to clipboard. Try downloading instead.');
    }
  }, []);

  return {
    exportChartAsPNG,
    copyChartToClipboard,
    isExporting: false, // Can add loading state if needed
  };
}
