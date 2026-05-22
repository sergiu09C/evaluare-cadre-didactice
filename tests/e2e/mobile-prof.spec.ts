import { test } from '@playwright/test';

const BASE = 'http://localhost:3000';

test('@mobile ProfDashboard slim pe iPhone 13', async ({ page }) => {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', 'vasile.popescu.1@prof.univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 });
  await page.goto(BASE + '/professor/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/mobile-prof-dashboard.png', fullPage: true });
});

test('@mobile AdminUsers paginare pe iPhone 13', async ({ page }) => {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', 'admin@univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 });
  await page.goto(BASE + '/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/mobile-admin-users.png', fullPage: false });
});
