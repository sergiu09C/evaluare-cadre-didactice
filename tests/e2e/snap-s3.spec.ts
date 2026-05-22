import { test } from '@playwright/test';
const BASE = 'http://localhost:3000';
async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('S3 — ConfirmDialog AdminUsers', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  // declanșez prima dezactivare (fără să confirm)
  const btn = page.locator('button[aria-label="Dezactivează"]').first();
  if (await btn.count() > 0) {
    await btn.click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: '/tmp/snap-s3-confirm.png', fullPage: false });
  }
});
