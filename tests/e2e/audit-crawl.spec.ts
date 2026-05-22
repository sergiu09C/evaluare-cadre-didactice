import { test } from '@playwright/test';
const BASE = 'http://localhost:3000';

const ROLES = [
  { email: 'student1@univ.ro', name: 'student', paths: ['/', '/dashboard', '/active', '/history', '/achievements', '/feedback', '/aggregated'] },
  { email: 'vasile.popescu.1@prof.univ.ro', name: 'professor', paths: ['/professor', '/professor/dashboard', '/professor/reports', '/professor/students', '/professor/actions', '/feedback'] },
  { email: 'admin@univ.ro', name: 'admin', paths: ['/admin', '/admin/users', '/admin/reports', '/admin/controls', '/admin/closing-loop', '/admin/platform-feedback', '/admin/achievements', '/admin/guides'] },
];

async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

for (const r of ROLES) {
  test(`audit-${r.name}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    page.on('pageerror', (err) => errors.push('PAGEERROR: ' + err.message));
    page.on('requestfailed', (req) => {
      const url = req.url();
      if (url.includes('favicon') || url.includes('manifest')) return;
      errors.push('REQ_FAIL: ' + url + ' ' + req.failure()?.errorText);
    });
    
    await login(page, r.email);
    for (const p of r.paths) {
      try {
        await page.goto(BASE + p, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(400);
      } catch (e: any) { errors.push(`NAV_FAIL ${p}: ${e.message.substring(0, 100)}`); }
    }
    
    const filtered = errors.filter((e) =>
      !e.includes('React Router Future') && !e.includes('favicon') && !e.includes('manifest'),
    );
    console.log(`[${r.name}] errors: ${filtered.length}`);
    for (const e of filtered.slice(0, 15)) console.log('  ERR:', e.substring(0, 250));
  });
}
