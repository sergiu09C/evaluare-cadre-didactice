/**
 * Dark mode crawl — vizitează 8 pagini cheie cu data-theme="dark" injectat și
 * captează screenshot pentru audit manual.
 */
import { test } from '@playwright/test';

const BASE = 'http://localhost:3000';

const ACCOUNTS = {
  student: { email: 'student1@univ.ro', password: 'password123' },
  professor: { email: 'vasile.popescu.1@prof.univ.ro', password: 'password123' },
  admin: { email: 'admin@univ.ro', password: 'password123' },
};

async function loginAndForceDark(page: import('@playwright/test').Page, role: keyof typeof ACCOUNTS) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', ACCOUNTS[role].email);
  await page.fill('input[autocomplete="current-password"]', ACCOUNTS[role].password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
  // Inject dark theme
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(400);
}

const pages: Array<{ role: keyof typeof ACCOUNTS; path: string; name: string }> = [
  { role: 'student', path: '/', name: 'student-acasa-sumar' },
  { role: 'student', path: '/?tab=explore', name: 'student-acasa-explore' },
  { role: 'student', path: '/dashboard', name: 'student-dashboard' },
  { role: 'student', path: '/feedback', name: 'student-feedback' },
  { role: 'professor', path: '/professor', name: 'prof-acasa' },
  { role: 'professor', path: '/professor/dashboard', name: 'prof-dashboard' },
  { role: 'admin', path: '/admin/users', name: 'admin-users' },
  { role: 'admin', path: '/admin/dashboard', name: 'admin-table' },
];

for (const p of pages) {
  test(`Dark mode — ${p.name}`, async ({ page }) => {
    await loginAndForceDark(page, p.role);
    await page.goto(BASE + p.path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(700);
    // re-injectează dacă navigarea a resetat-o
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(300);
    await page.screenshot({ path: `/tmp/dark-${p.name}.png`, fullPage: true });
  });
}
