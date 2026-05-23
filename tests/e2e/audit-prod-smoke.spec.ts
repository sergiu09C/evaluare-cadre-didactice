import { test, expect, devices } from '@playwright/test';
const URL = 'https://evaluare-cadre-didactice-production.up.railway.app';
test.use({ ...devices['Desktop Chrome'] });

const PAGES = {
  student: ['/', '/dashboard', '/active', '/history', '/achievements', '/feedback', '/aggregated'],
  professor: ['/professor', '/professor/dashboard', '/professor/reports', '/professor/students', '/professor/actions'],
  admin: ['/admin', '/admin/users', '/admin/reports', '/admin/controls', '/admin/closing-loop', '/admin/platform-feedback', '/admin/achievements', '/admin/guides', '/admin/action-templates', '/admin/kpis', '/admin/audit-log'],
};
const CREDS = {
  student: 'student1@univ.ro',
  professor: 'vasile.popescu.1@prof.univ.ro',
  admin: 'admin@univ.ro',
};

async function login(page: any, email: string) {
  await page.goto(URL + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 15000 });
}

for (const [role, paths] of Object.entries(PAGES)) {
  test(`@mobile prod-smoke ${role} (${paths.length} pagini)`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const t = msg.text();
        if (t.includes('React Router Future') || t.includes('favicon') || t.includes('manifest')) return;
        errors.push(t);
      }
    });
    page.on('pageerror', (e) => errors.push('PAGEERR: ' + e.message));
    await login(page, CREDS[role as keyof typeof CREDS]);
    for (const p of paths) {
      try {
        await page.goto(URL + p, { waitUntil: 'networkidle', timeout: 20000 });
        await page.waitForTimeout(500);
      } catch (e: any) {
        errors.push(`NAV_FAIL ${p}: ${e.message?.substring(0, 100)}`);
      }
    }
    if (errors.length > 0) {
      console.log(`[${role}] ${errors.length} erori:`);
      for (const e of errors.slice(0, 10)) console.log('  -', e.substring(0, 250));
    }
    expect(errors, `Erori pe rolul ${role}`).toEqual([]);
  });
}
