/**
 * PDF Export Utilities
 * Uses browser's native print functionality to generate PDFs
 */

/**
 * Prepares the page for PDF export and triggers print dialog
 * @param title - Title to display in the printed document
 */
export function exportToPDF(title: string = 'Raport') {
  // Store original title
  const originalTitle = document.title;

  // Set custom title for PDF
  document.title = `${title} - ${new Date().toLocaleDateString('ro-RO')}`;

  // Add print-specific class to body
  document.body.classList.add('print-mode');

  // Trigger print dialog
  window.print();

  // Restore original state after print dialog closes
  setTimeout(() => {
    document.body.classList.remove('print-mode');
    document.title = originalTitle;
  }, 1000);
}

/**
 * Generates a formatted report element for printing
 * @param reportContent - The HTML content to include in the report
 * @param reportTitle - Title of the report
 * @param filters - Active filters to display in the report header
 */
export function generatePrintableReport(
  reportContent: HTMLElement,
  reportTitle: string,
  filters?: Record<string, any>
): void {
  // Create print window
  const printWindow = window.open('', '_blank');

  if (!printWindow) {
    alert('Vă rugăm să permiteți pop-up-urile pentru a exporta raportul.');
    return;
  }

  // Build filter summary
  let filterSummary = '';
  if (filters && Object.keys(filters).length > 0) {
    filterSummary = '<div style="margin-bottom: 20px; padding: 15px; background: #f3f4f6; border-radius: 8px;">';
    filterSummary += '<h3 style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">Filtre aplicate:</h3>';
    filterSummary += '<ul style="margin: 0; padding-left: 20px; font-size: 12px;">';

    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        const label = key === 'facultyId' ? 'Facultate' :
                     key === 'level' ? 'Nivel' :
                     key === 'yearNumber' ? 'An' :
                     key === 'courseType' ? 'Tip curs' :
                     key === 'semester' ? 'Semestru' : key;
        filterSummary += `<li>${label}: ${value}</li>`;
      }
    }

    filterSummary += '</ul></div>';
  }

  // Get current date
  const currentDate = new Date().toLocaleDateString('ro-RO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Clone the content
  const clonedContent = reportContent.cloneNode(true) as HTMLElement;

  // Build HTML document
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="ro">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${reportTitle}</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
          padding: 40px;
          color: #1f2937;
          background: white;
        }

        .report-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #3b82f6;
        }

        .report-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 10px;
        }

        .report-date {
          font-size: 14px;
          color: #6b7280;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 12px;
        }

        th {
          background: #f3f4f6;
          padding: 12px 8px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #e5e7eb;
          font-size: 11px;
          text-transform: uppercase;
          color: #6b7280;
        }

        td {
          padding: 10px 8px;
          border-bottom: 1px solid #e5e7eb;
        }

        tr:hover {
          background: #f9fafb;
        }

        .card {
          margin: 20px 0;
          padding: 20px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        h2, h3 {
          margin: 20px 0 10px 0;
          color: #1f2937;
        }

        h2 {
          font-size: 20px;
        }

        h3 {
          font-size: 16px;
        }

        /* Hide interactive elements */
        button, .btn, input, select, textarea {
          display: none !important;
        }

        /* Charts styling */
        .recharts-wrapper {
          margin: 20px 0;
        }

        @media print {
          body {
            padding: 20px;
          }

          .report-header {
            page-break-after: avoid;
          }

          table {
            page-break-inside: avoid;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          .card {
            page-break-inside: avoid;
          }
        }
      </style>
    </head>
    <body>
      <div class="report-header">
        <h1 class="report-title">${reportTitle}</h1>
        <p class="report-date">Generat: ${currentDate}</p>
      </div>

      ${filterSummary}

      <div class="report-content">
        ${clonedContent.innerHTML}
      </div>

      <script>
        // Auto-print when page loads
        window.onload = function() {
          window.print();
          // Close window after print dialog closes (optional)
          // setTimeout(() => window.close(), 1000);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
}

/**
 * Export current page as PDF using browser print
 */
export function exportCurrentPageToPDF(pageTitle: string) {
  const originalTitle = document.title;
  const timestamp = new Date().toLocaleDateString('ro-RO');

  document.title = `${pageTitle} - ${timestamp}`;

  // Add CSS for print
  const style = document.createElement('style');
  style.id = 'print-styles';
  style.innerHTML = `
    @media print {
      /* Hide navigation and unnecessary elements */
      nav, .no-print, button:not(.print-include) {
        display: none !important;
      }

      /* Ensure content fits on page */
      body {
        margin: 0;
        padding: 20px;
      }

      /* Page breaks */
      .page-break {
        page-break-after: always;
      }

      /* Preserve colors in charts */
      * {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  `;

  document.head.appendChild(style);

  window.print();

  // Cleanup
  setTimeout(() => {
    document.title = originalTitle;
    const styleElement = document.getElementById('print-styles');
    if (styleElement) {
      styleElement.remove();
    }
  }, 1000);
}
