import { test } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function loginAdmin(page: import('@playwright/test').Page) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', 'admin@univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('Acasă: Robotică + seminar (anterior 0)', async ({ page }) => {
  await loginAdmin(page);
  await page.goto(BASE + '/admin?departmentId=Robotic%C4%83&courseType=seminar');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/proof-robotica-seminar.png', fullPage: false });
});

test('Acasă: MATC + an=1 + seminar (anterior 0)', async ({ page }) => {
  await loginAdmin(page);
  await page.goto(BASE + '/admin?programId=6&year=1&courseType=seminar');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/proof-matc-an1-seminar.png', fullPage: false });
});
