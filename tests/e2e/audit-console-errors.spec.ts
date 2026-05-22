/**
 * Audit console errors — crawl pe pagini cheie cu listener pe console + pageerror.
 * Output: /tmp/audit-console.json
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE = 'http://localhost:3000';

interface PageReport {
  role: string;
  path: string;
  errors: string[];
  warnings: string[];
}

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 });
}

const SCENARIOS: Array<{ role: string; email: string; paths: string[] }> = [
  {
    role: 'student',
    email: 'student1@univ.ro',
    paths: ['/', '/?tab=explore', '/?tab=trend', '/dashboard', '/evaluations', '/history', '/results', '/achievements', '/feedback', '/?facultyId=1&semester=1', '/?programLevel=master&courseType=laborator'],
  },
  {
    role: 'professor',
    email: 'vasile.popescu.1@prof.univ.ro',
    paths: ['/professor', '/professor?tab=explore', '/professor/dashboard', '/professor/courses', '/professor/students', '/professor/actions', '/professor/reports', '/feedback', '/?departmentId=Algoritmi+și+Structuri+de+Date'],
  },
  {
    role: 'admin',
    email: 'admin@univ.ro',
    paths: ['/admin', '/admin?tab=explore', '/admin/dashboard', '/admin/controls', '/admin/closing-loop', '/admin/users', '/admin/reports', '/admin/platform-feedback', '/admin?facultyId=2&year=3'],
  },
];

test.describe.serial('Audit console errors', () => {
  test.beforeAll(() => {
    if (fs.existsSync('/tmp/audit-console.json')) fs.unlinkSync('/tmp/audit-console.json');
    fs.writeFileSync('/tmp/audit-console.json', '[]');
  });

  for (const sc of SCENARIOS) {
    test(`${sc.role} — crawl ${sc.paths.length} paths`, async ({ page }) => {
      const results: PageReport[] = [];
      for (const path of sc.paths) {
        const errors: string[] = [];
        const warnings: string[] = [];
        const onConsole = (msg: import('@playwright/test').ConsoleMessage) => {
          const text = msg.text();
          // Skip React Router future flag warnings + vite warnings
          if (text.includes('React Router Future Flag') || text.includes('[vite]')) return;
          if (msg.type() === 'error') errors.push(text);
          else if (msg.type() === 'warning') warnings.push(text);
        };
        const onPageError = (e: Error) => errors.push(`PAGEERROR: ${e.message}`);
        page.on('console', onConsole);
        page.on('pageerror', onPageError);

        if (results.length === 0) {
          // Login on first iteration
          await login(page, sc.email, 'password123');
        }
        await page.goto(BASE + path);
        await page.waitForLoadState('networkidle', { timeout: 15000 });
        await page.waitForTimeout(700);

        results.push({ role: sc.role, path, errors: [...errors], warnings: [...warnings] });

        page.off('console', onConsole);
        page.off('pageerror', onPageError);
      }
      // Append to file
      const existing = JSON.parse(fs.readFileSync('/tmp/audit-console.json', 'utf-8'));
      existing.push(...results);
      fs.writeFileSync('/tmp/audit-console.json', JSON.stringify(existing, null, 2));
      expect(results.length).toBe(sc.paths.length);
    });
  }
});
