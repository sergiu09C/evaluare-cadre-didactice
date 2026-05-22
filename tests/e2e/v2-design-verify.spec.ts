import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

const STUDENT = { email: 'student1@univ.ro', password: 'password123' };
const PROF = { email: 'vasile.popescu.1@prof.univ.ro', password: 'password123' };

test.describe('v2 Design verification', () => {
  test('Student dashboard — DualRadar + Skeleton + page transition', async ({ page }) => {
    await login(page, STUDENT.email, STUDENT.password);
    await page.waitForLoadState('networkidle');
    // DualRadar (svg cu polygons)
    const radarSvgs = await page.locator('svg polygon').count();
    expect(radarSvgs).toBeGreaterThan(0);
    // Page transition class
    const trans = await page.locator('.ecd-page-transition').count();
    expect(trans).toBeGreaterThan(0);
    await page.screenshot({ path: '/tmp/v2-student-dashboard.png', fullPage: true });
  });

  test('Professor students — dot matrix toggle', async ({ page }) => {
    await login(page, PROF.email, PROF.password);
    await page.goto(BASE + '/professor/students');
    await page.waitForLoadState('networkidle');
    // Toggle matrix view
    const matrixBtn = page.getByRole('tab', { name: /matrice/i });
    if (await matrixBtn.count()) {
      await matrixBtn.click();
      await page.waitForTimeout(400);
    }
    await page.screenshot({ path: '/tmp/v2-prof-students-matrix.png', fullPage: true });
  });

  test('Dark mode toggle', async ({ page }) => {
    await login(page, STUDENT.email, STUDENT.password);
    // toggle via DOM attribute (simulate dark mode switch)
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    await page.waitForTimeout(300);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // Dark background should NOT be white
    expect(bg).not.toBe('rgb(255, 255, 255)');
    await page.screenshot({ path: '/tmp/v2-dark-mode.png', fullPage: true });
  });

  test('Professor actions — illustration empty state', async ({ page }) => {
    await login(page, PROF.email, PROF.password);
    await page.goto(BASE + '/professor/actions');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/v2-prof-actions.png', fullPage: true });
  });
});
