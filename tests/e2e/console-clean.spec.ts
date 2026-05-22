import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const ROLES = [
  {
    name: 'student',
    email: 'student1@univ.ro',
    paths: ['/', '/dashboard', '/active', '/history', '/achievements', '/feedback', '/aggregated'],
  },
  {
    name: 'professor',
    email: 'vasile.popescu.1@prof.univ.ro',
    paths: [
      '/professor',
      '/professor/dashboard',
      '/professor/reports',
      '/professor/students',
      '/professor/actions',
      '/feedback',
    ],
  },
  {
    name: 'admin',
    email: 'admin@univ.ro',
    paths: [
      '/admin',
      '/admin/users',
      '/admin/reports',
      '/admin/controls',
      '/admin/closing-loop',
      '/admin/platform-feedback',
      '/admin/achievements',
      '/admin/guides',
    ],
  },
];

async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

function isIgnorable(text: string): boolean {
  return (
    text.includes('React Router Future Flag') ||
    text.includes('favicon') ||
    text.includes('manifest.json') ||
    text.includes('Download the React DevTools') ||
    // Vite dev-mode emite ERR_ABORTED când naviga rapidă întrerupe lazy-load-uri;
    // nu sunt erori reale ale aplicației.
    text.includes('ERR_ABORTED')
  );
}

for (const r of ROLES) {
  test(`Console clean — ${r.name} (${r.paths.length} pagini)`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isIgnorable(msg.text())) errors.push(`[${page.url()}] ${msg.text()}`);
    });
    page.on('pageerror', (err) => errors.push(`PAGEERROR: ${err.message}`));
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.includes('favicon') || url.includes('manifest')) return;
      // ERR_ABORTED pe lazy-imports din vite e fals-pozitiv (navigare rapidă întrerupe)
      const err = req.failure()?.errorText || '';
      if (err.includes('ERR_ABORTED')) return;
      errors.push(`REQ_FAIL: ${url} ${err}`);
    });

    await login(page, r.email);
    for (const p of r.paths) {
      try {
        await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(300);
      } catch (e: any) {
        errors.push(`NAV_FAIL ${p}: ${e.message?.substring(0, 100)}`);
      }
    }

    if (errors.length > 0) {
      console.log(`[${r.name}] ${errors.length} erori:`);
      for (const e of errors.slice(0, 15)) console.log('  ', e.substring(0, 250));
    }
    expect(errors, `Erori console pe rolul ${r.name}`).toEqual([]);
  });
}
