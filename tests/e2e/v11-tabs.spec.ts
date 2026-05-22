import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const STUDENT = { email: 'student1@univ.ro', password: 'password123' };

async function login(page: import('@playwright/test').Page) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', STUDENT.email);
  await page.fill('input[autocomplete="current-password"]', STUDENT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('R3: 3 tab-uri pe Acasă cu URL persistence', async ({ page }) => {
  await login(page);
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');

  // tab nav vizibil
  await expect(page.getByRole('tab', { name: 'Sumar' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Explorează' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Trend' })).toBeVisible();

  // Default = Sumar — Rate participare vizibil, NU vede pie distribuție
  await expect(page.getByRole('heading', { name: /^rate de participare$/i })).toBeVisible({ timeout: 8000 });
  await expect(page.locator('text=/Distribuție scoruri/i')).toHaveCount(0);

  // Click Explorează → URL conține tab=explore, Distribuție scoruri vizibil
  await page.getByRole('tab', { name: 'Explorează' }).click();
  await page.waitForTimeout(400);
  expect(page.url()).toContain('tab=explore');
  await expect(page.getByRole('heading', { name: /distribuție scoruri/i }).first()).toBeVisible();
  await expect(page.getByRole('heading', { name: /top 10 rankings/i })).toBeVisible();
  // Rate participare NU mai vizibil
  await expect(page.getByRole('heading', { name: /^rate de participare$/i })).toHaveCount(0);

  // Click Trend → time series
  await page.getByRole('tab', { name: 'Trend' }).click();
  await page.waitForTimeout(400);
  expect(page.url()).toContain('tab=trend');
  await expect(page.locator('text=/Submisii zilnice/i').first()).toBeVisible();

  // Refresh URL persistence
  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=/Submisii zilnice/i').first()).toBeVisible();

  await page.screenshot({ path: '/tmp/v11-tabs-trend.png', fullPage: true });
});
