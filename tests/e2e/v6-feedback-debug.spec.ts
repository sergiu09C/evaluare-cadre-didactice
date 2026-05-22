import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const STUDENT = { email: 'student1@univ.ro', password: 'password123' };

test('Debug submit feedback', async ({ page }) => {
  const consoleErrors: string[] = [];
  const consoleAll: string[] = [];
  page.on('console', (msg) => {
    consoleAll.push(`[${msg.type()}] ${msg.text()}`);
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));

  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', STUDENT.email);
  await page.fill('input[autocomplete="current-password"]', STUDENT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
  await page.goto(BASE + '/feedback');
  await page.waitForLoadState('networkidle');

  const btn = page.getByRole('button', { name: /^trimite feedback$/i });
  console.log('Found submit button:', await btn.count());
  await btn.click();
  await page.waitForTimeout(2000);

  console.log('=== CONSOLE OUTPUT ===');
  for (const c of consoleAll) console.log(c);
  console.log('=== ERRORS ===');
  for (const e of consoleErrors) console.log(e);

  // Check current DOM
  const hasSuccess = await page.locator('text=/Feedbackul a fost trimis/i').count();
  const hasResend = await page.locator('text=/Trimite din nou/i').count();
  console.log('Has success card:', hasSuccess, 'Has resend btn:', hasResend);
});
