import { test } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: import('@playwright/test').Page, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('Acasă profesor — pipeline personal + KPIs X din Y', async ({ page }) => {
  await login(page, 'vasile.popescu.1@prof.univ.ro');
  await page.goto(BASE + '/professor');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/snap-prof-acasa.png', fullPage: true });
});

test('Acasă admin — KPI nou + Top vs Bottom rankings', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin?tab=explore');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/snap-admin-explore-split.png', fullPage: true });
});

test('Acasă student — KPIs noi cu X din Y', async ({ page }) => {
  await login(page, 'student1@univ.ro');
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/snap-student-acasa.png', fullPage: false });
});
