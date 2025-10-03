'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/* What: PDF export utility for full stats pages
   Why: Allow users to save complete stats pages as PDF documents
   
   Strategy: Capture DOM elements with html2canvas, then convert to PDF with jsPDF
   Multi-page support for long content */

export interface PDFExportOptions {
  filename?: string;
  format?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
  quality?: number; // 0-1, higher = better quality but larger file
  margin?: number; // Margin in mm
}

/* What: Export HTML element to PDF
   Why: Primary export function for stats pages */
export async function exportElementToPDF(
  elementId: string,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = 'messmass-stats',
    format = 'a4',
    orientation = 'portrait',
    quality = 0.95,
    margin = 10,
  } = options;

  try {
    /* What: Find element to export
       Why: Need DOM reference for html2canvas */
    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error(`Element with id "${elementId}" not found`);
    }

    console.log('📄 Starting PDF export...');

    /* What: Capture element as canvas
       Why: html2canvas converts DOM to image data */
    const canvas = await html2canvas(element, {
      useCORS: true, // Allow cross-origin images
      logging: false,
    });

    /* What: Calculate PDF dimensions based on format
       Why: A4 and Letter have different dimensions */
    const pdfWidth = format === 'a4' ? 210 : 215.9; // mm
    const pdfHeight = format === 'a4' ? 297 : 279.4; // mm
    
    /* What: Calculate content dimensions with margins
       Why: Leave white space around content */
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);

    /* What: Calculate scaling to fit content
       Why: Maintain aspect ratio while fitting to page */
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    let finalWidth = contentWidth;
    let finalHeight = contentWidth / ratio;
    
    /* What: Check if content fits on one page
       Why: May need multi-page PDF for tall content */
    const pageCount = Math.ceil(finalHeight / contentHeight);
    
    /* What: Create PDF document
       Why: jsPDF generates the PDF file */
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
      compress: true,
    });

    /* What: Convert canvas to image data
       Why: jsPDF needs image format, not canvas */
    const imgData = canvas.toDataURL('image/png', quality);

    /* What: Add pages and content
       Why: Split tall content across multiple pages */
    for (let page = 0; page < pageCount; page++) {
      if (page > 0) {
        pdf.addPage();
      }

      /* What: Calculate position for this page's content
         Why: Show different portion of image on each page */
      const yOffset = -(page * contentHeight);
      
      pdf.addImage(
        imgData,
        'PNG',
        margin,
        margin + yOffset,
        finalWidth,
        finalHeight,
        undefined,
        'FAST'
      );
    }

    /* What: Generate filename with timestamp
       Why: Avoid filename conflicts */
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}.pdf`;

    /* What: Save PDF file
       Why: Trigger browser download */
    pdf.save(fullFilename);

    console.log(`✅ PDF exported: ${fullFilename} (${pageCount} page${pageCount > 1 ? 's' : ''})`);
  } catch (error) {
    console.error('Failed to export PDF:', error);
    throw error;
  }
}

/* What: Export current page to PDF with error handling
   Why: Wrapper with user-friendly error messages */
export async function exportPageToPDF(
  elementId: string = 'pdf-export-content',
  options: PDFExportOptions = {}
): Promise<void> {
  try {
    await exportElementToPDF(elementId, options);
    alert('PDF exported successfully! 📄');
  } catch (error) {
    console.error('PDF export failed:', error);
    alert('Failed to export PDF. Please try again or contact support.');
  }
}

/* What: Check if element is ready for export
   Why: Prevent export attempts before DOM is ready */
export function isElementReadyForExport(elementId: string): boolean {
  const element = document.getElementById(elementId);
  return element !== null && element.offsetHeight > 0;
}
