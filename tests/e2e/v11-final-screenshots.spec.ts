import { test } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('Acasă - tab Sumar (student)', async ({ page }) => {
  await login(page, 'student1@univ.ro', 'password123');
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/cleanup-acasa-sumar.png', fullPage: true });
});

test('Acasă - tab Explorează (student)', async ({ page }) => {
  await login(page, 'student1@univ.ro', 'password123');
  await page.goto(BASE + '/?tab=explore');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/cleanup-acasa-explore.png', fullPage: true });
});

test('Acasă - tab Trend (student)', async ({ page }) => {
  await login(page, 'student1@univ.ro', 'password123');
  await page.goto(BASE + '/?tab=trend');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/cleanup-acasa-trend.png', fullPage: true });
});

test('AdminUsers cu paginare', async ({ page }) => {
  await login(page, 'admin@univ.ro', 'password123');
  await page.goto(BASE + '/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/cleanup-admin-users.png', fullPage: false });
});

test('ProfessorDashboard slim', async ({ page }) => {
  await login(page, 'vasile.popescu.1@prof.univ.ro', 'password123');
  await page.goto(BASE + '/professor/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/cleanup-prof-dashboard.png', fullPage: true });
});
