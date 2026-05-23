import { test, devices } from '@playwright/test';
const URL = 'http://localhost:3000';
test.use({ ...devices['iPhone 13'] });
async function login(page: any) {
  await page.goto(URL + '/login');
  await page.fill('input[autocomplete="email"]', 'admin@univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}
test('@mobile reports clean mobile', async ({ page }) => {
  await login(page);
  await page.goto(URL + '/admin/reports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/reports-clean-mobile.png', fullPage: false });
  // scroll to chart
  await page.evaluate(() => window.scrollBy(0, 400));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/reports-clean-chart.png', fullPage: false });
});
