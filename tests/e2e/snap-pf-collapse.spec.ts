import { test, expect } from '@playwright/test';
const BASE = 'http://localhost:3000';
async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('PlatformFeedback: user cu submission anterior → card colaps cu CTA', async ({ page }) => {
  // student1 a fost folosit deja în alte teste → are probabil răspunsuri
  await login(page, 'student1@univ.ro');
  await page.goto(BASE + '/platform-feedback');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/snap-pf-collapsed.png', fullPage: true });

  // click pe „Trimite o evaluare nouă" → formularul apare
  const btn = page.getByRole('button', { name: /Trimite o evaluare nouă/i });
  if (await btn.count() > 0) {
    await btn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/snap-pf-expanded.png', fullPage: true });
  }
});
