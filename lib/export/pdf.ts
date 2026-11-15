// lib/export/pdf.ts
// WHAT: Client-side PDF export trigger with automatic graceful fallback to window.print()
// WHY: Serverless Chromium PDF generation can fail due to Lambda cold starts, network timeouts,
//      or resource constraints. Never strand the user on a raw JSON error response.
// HOW: Requests PDF blob via fetch. If successful, triggers native browser file download.
//      If the server responds with an error (e.g. 502) or fetch fails, immediately falls back
//      to the browser's native print dialog with print CSS.

export async function exportReportToPDF(options: {
  pathAndQuery: string;
  filename: string;
  onSuccess?: () => void;
  onError?: (err: unknown) => void;
}): Promise<void> {
  const { pathAndQuery, filename, onSuccess, onError } = options;
  const exportUrl = `/api/export/pdf?path=${encodeURIComponent(pathAndQuery)}&filename=${encodeURIComponent(filename)}`;

  try {
    const response = await fetch(exportUrl);
    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/pdf')) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `${filename}.pdf`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
        if (onSuccess) onSuccess();
        return;
      }
    }
    // If serverless Chromium export fails or returns an error, fallback to client-side print
    console.warn('⚠️ Server-side PDF export returned non-PDF or error, using browser print fallback');
    window.print();
    if (onSuccess) onSuccess();
  } catch (err) {
    console.warn('⚠️ Server-side PDF export fetch failed, falling back to browser print dialog', err);
    window.print();
    if (onError) onError(err);
  }
}
