import { test, devices } from '@playwright/test';
const URL = 'https://evaluare-cadre-didactice-production.up.railway.app';
test.use({ ...devices['Desktop Chrome'] });
async function login(page: any, email: string) {
  await page.goto(URL + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
}
test('@mobile KPI cu Cronbach', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(URL + '/admin/kpis');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);
  await page.evaluate(() => window.scrollBy(0, 1800));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/final-cronbach.png', fullPage: false });
});
test('@mobile audit log', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(URL + '/admin/audit-log');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/final-audit.png', fullPage: false });
});
