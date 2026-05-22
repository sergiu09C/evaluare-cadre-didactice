/**
 * Cross-browser smoke @cross — rulează pe chromium + firefox + webkit.
 * Verifică flow-uri critice: login, Acasă tab switch, AdminUsers paginare.
 *
 * Filtrat în config via `grep: /@cross/`.
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

test('@cross Login student + Acasă render', async ({ page }) => {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', 'student1@univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /Acas[ăa].*C[ăa]l[ăa]toria evalu[ăa]rii/i })).toBeVisible({ timeout: 10000 });
});

test('@cross Tab switch pe Acasă persistă în URL', async ({ page }) => {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', 'student1@univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 });
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab', { name: 'Explorează' }).click();
  await page.waitForTimeout(400);
  expect(page.url()).toContain('tab=explore');
});

test('@cross AdminUsers paginare se încarcă', async ({ page }) => {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', 'admin@univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 });
  await page.goto(BASE + '/admin/users');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=/Pagina 1 din \\d+/').first()).toBeVisible({ timeout: 10000 });
  // Doar 25 rânduri în pagina 1
  const rows = await page.locator('table tbody tr').count();
  expect(rows).toBeLessThanOrEqual(25);
});
