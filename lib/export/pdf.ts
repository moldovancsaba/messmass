'use client';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/* What: Enhanced PDF export utility with intelligent pagination
   Why: Allow users to save complete stats pages as PDF documents
   
   Strategy:
   - Capture hero separately and repeat on every page
   - Capture chart cards individually to prevent splitting
   - Intelligent pagination: move elements to next page if they don't fit
   - Hero block always at top of each page */

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

/* What: Enhanced PDF export with smart pagination and hero repetition
   Why: Prevent element splitting and ensure hero appears on every page
   How: Capture elements separately, manage pagination intelligently */
export async function exportPageWithSmartPagination(
  heroId: string,
  contentId: string,
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
    console.log('📄 Starting enhanced PDF export with smart pagination...');

    /* What: Find hero and content containers
       Why: Need to capture them separately for smart layout */
    const heroElement = document.getElementById(heroId);
    const contentElement = document.getElementById(contentId);
    
    if (!heroElement) {
      throw new Error(`Hero element with id "${heroId}" not found`);
    }
    if (!contentElement) {
      throw new Error(`Content element with id "${contentId}" not found`);
    }

    /* What: Add PDF capture attribute to hide export buttons and style info
       Why: These elements are not relevant for PDF export */
    heroElement.setAttribute('data-pdf-capture', 'true');
    
    /* What: Hide status badges for PDF (Live Data and Active status)
       Why: PDFs are static snapshots, not live data */
    const liveBadge = heroElement.querySelector('.admin-level');
    const activeBadge = heroElement.querySelector('.admin-status');
    const originalLiveBadgeDisplay = liveBadge ? (liveBadge as HTMLElement).style.display : '';
    const originalActiveBadgeDisplay = activeBadge ? (activeBadge as HTMLElement).style.display : '';
    
    if (liveBadge) {
      (liveBadge as HTMLElement).style.display = 'none';
    }
    if (activeBadge) {
      (activeBadge as HTMLElement).style.display = 'none';
    }

    /* What: Capture hero as canvas
       Why: Will be repeated on every page */
    const heroCanvas = await html2canvas(heroElement, {
      useCORS: true,
      logging: false,
    });

    /* What: Find all block cards using data-pdf-block attribute
       Why: Capture blocks to maintain desktop 3-column grid layout
       Note: Blocks contain multiple charts in rows */
    const blockElements = contentElement.querySelectorAll('[data-pdf-block="true"]');
    
    console.log(`🔍 Found ${blockElements.length} blocks to capture`);
    
    if (blockElements.length === 0) {
      console.warn('⚠️ No blocks found! Check that data-pdf-block="true" is set on block elements');
      throw new Error('No chart blocks found to export. Please ensure charts are loaded before exporting.');
    }
    
    const blockCanvases: HTMLCanvasElement[] = [];
    
    /* What: Set wider capture width for 3-column desktop layout
       Why: Default capture is too narrow, need desktop width */
    const originalContentWidth = (contentElement as HTMLElement).style.width;
    (contentElement as HTMLElement).style.width = '1200px';
    
    for (let i = 0; i < blockElements.length; i++) {
      const element = blockElements[i] as HTMLElement;
      console.log(`📸 Capturing block ${i + 1}/${blockElements.length}...`);
      
      /* What: Get actual rendered dimensions of element
         Why: Need to capture at natural size to avoid stretching */
      const elementWidth = element.offsetWidth;
      const elementHeight = element.offsetHeight;
      console.log(`📐 Element dimensions: ${elementWidth}x${elementHeight}px`);
      
      /* What: Capture canvas at natural size without forcing dimensions
         Why: Forcing width/height can cause html2canvas to stretch content
         Note: html2canvas will use element's actual rendered size */
      const canvas = await html2canvas(element, {
        useCORS: true,
        logging: false,
        allowTaint: true, // Allow cross-origin images
        imageTimeout: 0, // No timeout for image loading
        scale: window.devicePixelRatio || 1, // Use device pixel ratio for quality
      });
      blockCanvases.push(canvas);
      console.log(`✅ Block ${i + 1} captured: ${canvas.width}x${canvas.height}px (ratio: ${(canvas.width / canvas.height).toFixed(2)})`);
    }
    
    /* What: Restore original width
       Why: Don't affect page display after capture */
    (contentElement as HTMLElement).style.width = originalContentWidth;

    /* What: Restore hero to normal state
       Why: Remove PDF capture styling after capture complete */
    heroElement.removeAttribute('data-pdf-capture');
    if (liveBadge) {
      (liveBadge as HTMLElement).style.display = originalLiveBadgeDisplay;
    }
    if (activeBadge) {
      (activeBadge as HTMLElement).style.display = originalActiveBadgeDisplay;
    }

    console.log(`✅ Captured ${blockCanvases.length} block elements with 3-column layout`);

    /* What: Calculate PDF dimensions
       Why: A4 and Letter have different dimensions */
    const pdfWidth = format === 'a4' ? 210 : 215.9; // mm
    const pdfHeight = format === 'a4' ? 297 : 279.4; // mm
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);

    /* What: Calculate hero dimensions
       Why: Hero will be at top of every page */
    const heroRatio = heroCanvas.width / heroCanvas.height;
    const heroWidth = contentWidth;
    const heroHeight = heroWidth / heroRatio;
    const heroHeightMM = Math.min(heroHeight, 60); // Cap hero at 60mm
    const heroScaleFactor = heroHeightMM / heroHeight;
    const heroWidthMM = heroWidth * heroScaleFactor;

    /* What: Calculate available space per page after hero
       Why: Charts must fit below hero */
    const availableHeightPerPage = contentHeight - heroHeightMM - 5; // 5mm gap

    /* What: Create PDF document
       Why: jsPDF generates the PDF file */
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format,
      compress: true,
    });

    /* What: Convert hero to image data once
       Why: Reuse on every page */
    const heroImgData = heroCanvas.toDataURL('image/png', quality);

    let currentPage = 0;
    let currentYPosition = margin + heroHeightMM + 5; // Start below hero + gap
    let heroAddedToCurrentPage = false; // Track if hero was added to current page

    /* What: Helper to add hero to current page
       Why: DRY principle for hero rendering */
    const addHeroToPage = () => {
      pdf.addImage(
        heroImgData,
        'PNG',
        margin,
        margin,
        heroWidthMM,
        heroHeightMM,
        undefined,
        'FAST'
      );
      heroAddedToCurrentPage = true;
    };

    /* What: Place blocks with intelligent pagination
       Why: Prevent splitting, move to next page if doesn't fit
       Note: Hero is added lazily when first block is placed */
    for (let i = 0; i < blockCanvases.length; i++) {
      const canvas = blockCanvases[i];
      const imgData = canvas.toDataURL('image/png', quality);
      
      /* What: Calculate block dimensions preserving original aspect ratio
         Why: Prevent stretching - scale proportionally to fit width */
      const blockRatio = canvas.width / canvas.height;
      console.log(`📏 Block ${i + 1} original ratio: ${blockRatio.toFixed(2)} (${canvas.width}x${canvas.height}px)`);
      
      let blockWidth = contentWidth;
      let blockHeight = blockWidth / blockRatio;
      console.log(`📄 Initial PDF dimensions: ${blockWidth.toFixed(1)}mm x ${blockHeight.toFixed(1)}mm`);
      
      /* What: If height exceeds available space, scale down to fit
         Why: Prevent blocks from being too tall while maintaining aspect ratio */
      if (blockHeight > availableHeightPerPage) {
        console.log(`⚠️ Block too tall (${blockHeight.toFixed(1)}mm > ${availableHeightPerPage.toFixed(1)}mm), scaling down...`);
        blockHeight = availableHeightPerPage;
        blockWidth = blockHeight * blockRatio;
        console.log(`🔽 Scaled dimensions: ${blockWidth.toFixed(1)}mm x ${blockHeight.toFixed(1)}mm (ratio preserved: ${(blockWidth/blockHeight).toFixed(2)})`);
      }
      
      /* What: Check if block fits on current page
         Why: Move to next page if it doesn't fit */
      if (currentYPosition + blockHeight > contentHeight + margin) {
        // Block doesn't fit, move to next page
        pdf.addPage();
        currentPage++;
        heroAddedToCurrentPage = false;
        
        // Reset Y position below hero (will be added below)
        currentYPosition = margin + heroHeightMM + 5;
      }
      
      /* What: Add hero if not yet added to current page
         Why: Ensures hero appears before content on each page */
      if (!heroAddedToCurrentPage) {
        addHeroToPage();
      }
      
      /* What: Add block to current position
         Why: Place block on page with 3-column layout preserved */
      pdf.addImage(
        imgData,
        'PNG',
        margin,
        currentYPosition,
        blockWidth,
        blockHeight,
        undefined,
        'FAST'
      );
      
      // Move Y position down for next block (with spacing)
      currentYPosition += blockHeight + 5; // 5mm gap between blocks
    }

    /* What: Generate filename with timestamp
       Why: Avoid filename conflicts */
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}.pdf`;

    /* What: Save PDF file
       Why: Trigger browser download */
    pdf.save(fullFilename);

    const totalPages = currentPage + 1;
    console.log(`✅ PDF exported: ${fullFilename} (${totalPages} page${totalPages > 1 ? 's' : ''})`);  
  } catch (error) {
    console.error('Failed to export enhanced PDF:', error);
    
    // Show user-friendly error message
    if (error instanceof Error && error.message.includes('No chart blocks found')) {
      alert('⚠️ Unable to export PDF: No charts found to export. Please wait for charts to load and try again.');
    }
    
    throw error;
  }
}

/* What: Export current page to PDF with error handling (legacy)
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
