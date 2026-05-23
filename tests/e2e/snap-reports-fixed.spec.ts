import { test, devices } from '@playwright/test';
const URL = 'https://evaluare-cadre-didactice-production.up.railway.app';
test.use({ ...devices['iPhone 13'] });
test('@mobile reports fixed prod', async ({ page }) => {
  await page.goto(URL + '/login');
  await page.fill('input[autocomplete="email"]', 'admin@univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'));
  await page.goto(URL + '/admin/reports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  // scroll un pic ca să vedem tabelul
  await page.evaluate(() => window.scrollBy(0, 350));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/reports-fixed.png', fullPage: false });
});
