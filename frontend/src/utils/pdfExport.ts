/**
 * PDF Export Utilities
 *
 * Folosim un iframe ascuns same-origin (NU popup → fără popup blocker)
 * în care clonăm elementul-țintă + stylesheet-urile paginii, apoi invocăm print()
 * pe fereastra iframe-ului. La sfârșit ștergem iframe-ul.
 *
 * Avantaje față de varianta veche (window.open('','_blank')):
 *  - nu e blocată de popup blocker
 *  - menține CSS-ul și fonturile din aplicație
 *  - SVG-urile Recharts se randează fără re-mount
 */

function collectHeadAssets(): string {
  // Copiem <style> și <link rel="stylesheet"> din pagina curentă în iframe.
  const parts: string[] = [];
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((node) => {
    parts.push(node.outerHTML);
  });
  return parts.join('\n');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Construiește un bloc HTML cu titlu + filtre aplicate (folosit ca headerHtml).
 */
export function buildReportHeader(
  title: string,
  filters?: Record<string, string | number | null | undefined>,
): string {
  const parts: string[] = [];
  parts.push(
    `<h1 style="font-size:22px;font-weight:700;color:#0E2233;margin:0 0 4px 0;">${escapeHtml(title)}</h1>`,
  );
  parts.push(
    `<p style="font-size:12px;color:#5F6878;margin:0;">Generat: ${new Date().toLocaleString('ro-RO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })}</p>`,
  );

  if (filters && Object.values(filters).some((v) => v != null && v !== '')) {
    parts.push('<div style="margin-top:10px;font-size:12px;color:#5F6878;">');
    parts.push('<strong style="color:#0E2233;">Filtre aplicate:</strong> ');
    const items = Object.entries(filters)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `${escapeHtml(k)}: <span style="color:#0E2233;">${escapeHtml(String(v))}</span>`);
    parts.push(items.join(' · '));
    parts.push('</div>');
  }

  return parts.join('');
}

const PRINT_CSS = `
  *, *::before, *::after { box-sizing: border-box; }
  @page { margin: 16mm; size: A4; }
  html, body {
    margin: 0;
    padding: 0;
    background: #ffffff !important;
    color: #0E2233;
    font-family: Geist, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body { padding: 8mm; }
  /* Ascunde butoanele, input-urile și controalele interactive */
  button, input, select, textarea, [role="tablist"], .no-print { display: none !important; }
  /* Carduri și tabele să nu se rupă peste pagini */
  .card, table { page-break-inside: avoid; break-inside: avoid; }
  tr { page-break-inside: avoid; break-inside: avoid; }
  /* Recharts: păstrează ratio + nu depăși lățimea paginii */
  .recharts-wrapper, .recharts-responsive-container { width: 100% !important; max-width: 100% !important; }
  svg { max-width: 100%; height: auto; page-break-inside: avoid; }
  /* Tabele: lățime completă */
  table { width: 100%; border-collapse: collapse; }
`;

/**
 * Export către PDF folosind print dialog-ul nativ al browser-ului, via iframe ascuns.
 */
export function exportElementToPDF(
  target: HTMLElement,
  options: { title: string; headerHtml?: string } = { title: 'Raport' },
): void {
  const { title, headerHtml } = options;

  // 1. Construim documentul HTML pentru iframe
  const targetHtml = target.outerHTML;
  const stylesheets = collectHeadAssets();
  const header = headerHtml ? `<div class="ecd-print-header" style="margin-bottom:16px;padding-bottom:12px;border-bottom:2px solid #7C3AED;">${headerHtml}</div>` : '';

  const documentHtml = `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)} — ${new Date().toLocaleDateString('ro-RO')}</title>
  ${stylesheets}
  <style>${PRINT_CSS}</style>
</head>
<body>
  ${header}
  ${targetHtml}
</body>
</html>`;

  // Strategie nouă (mai robustă): deschidem o fereastră nouă same-origin.
  // Browserele blochează `print()` din iframe ascuns în multe cazuri (Chrome,
  // Safari), dar permit din ferestre noi inițiate de user gesture.
  // Fallback la iframe doar dacă popup-ul e blocat.
  const popup = window.open('', '_blank', 'width=900,height=700');
  if (popup && !popup.closed) {
    popup.document.open();
    popup.document.write(documentHtml);
    popup.document.close();
    // Așteptăm să se randeze înainte de print
    const tryPrint = () => {
      try {
        popup.focus();
        popup.print();
      } catch {
        // print() blocked by browser — iframe fallback below
      }
    };
    if (popup.document.readyState === 'complete') {
      setTimeout(tryPrint, 400);
    } else {
      popup.addEventListener('load', () => setTimeout(tryPrint, 400));
      // Failsafe
      setTimeout(tryPrint, 1500);
    }
    return;
  }

  // FALLBACK: popup blocat → iframe ascuns
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);

  const cleanup = () => setTimeout(() => iframe.remove(), 100);

  iframe.onload = () => {
    try {
      const win = iframe.contentWindow;
      if (!win) { cleanup(); return; }
      win.addEventListener('afterprint', cleanup);
      setTimeout(cleanup, 60_000);
      setTimeout(() => { win.focus(); win.print(); }, 200);
    } catch {
      cleanup();
      alert('Browserul nu permite generarea PDF. Activează pop-up-urile sau folosește Ctrl+P pe pagină.');
    }
  };

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) {
    iframe.remove();
    alert('Browserul nu permite generarea PDF. Activează pop-up-urile sau folosește Ctrl+P pe pagină.');
    return;
  }
  doc.open();
  doc.write(documentHtml);
  doc.close();
}

/**
 * @deprecated Folosește exportElementToPDF în loc.
 * Păstrată pentru compatibilitate cu codul vechi care încă o apelează.
 */
export function generatePrintableReport(
  reportContent: HTMLElement,
  reportTitle: string,
  filters?: Record<string, any>,
): void {
  exportElementToPDF(reportContent, {
    title: reportTitle,
    headerHtml: buildReportHeader(reportTitle, filters),
  });
}

/** @deprecated */
export function exportToPDF(title: string = 'Raport') {
  exportElementToPDF(document.body, { title, headerHtml: buildReportHeader(title) });
}

/** @deprecated */
export function exportCurrentPageToPDF(pageTitle: string) {
  exportToPDF(pageTitle);
}
