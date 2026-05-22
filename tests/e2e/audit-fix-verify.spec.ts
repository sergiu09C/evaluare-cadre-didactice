import { test } from '@playwright/test';

const BASE = 'http://localhost:3000';

test('Student dashboard cu DualRadar tu vs facultate', async ({ page }) => {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', 'student1@univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
  await page.goto(BASE + '/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/audit-student-dashboard.png', fullPage: true });
});

test('Acasă student cu filtru courseType=laborator', async ({ page }) => {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', 'student1@univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
  await page.goto(BASE + '/?courseType=laborator');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/audit-acasa-laborator.png', fullPage: false });
});
