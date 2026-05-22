import { test } from '@playwright/test';
const BASE = 'http://localhost:3000';
async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('S2 — admin Acasă cu multi-select an deschis', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.locator('#ms-anul').click();
  await page.waitForTimeout(300);
  await page.getByRole('option', { name: /Anul 1/i }).click();
  await page.getByRole('option', { name: /Anul 2/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/snap-s2-multi-select.png', fullPage: true });
});

test('S2 — pagina șabloane acțiuni', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin/action-templates');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/snap-s2-action-templates.png', fullPage: true });
});

test('S2 — AdminUsers cu ListFilterBar', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/snap-s2-admin-users.png', fullPage: false });
});

test('S2 — AdminReports cu buton ARACIS', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin/reports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/snap-s2-admin-reports.png', fullPage: false });
});
