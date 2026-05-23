import { test, devices } from '@playwright/test';
const URL = 'https://evaluare-cadre-didactice-production.up.railway.app';
test.use({ ...devices['iPhone 13'] });
async function login(page: any, email: string) {
  await page.goto(URL + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
}
test('@mobile vp student', async ({ page }) => {
  await login(page, 'student1@univ.ro');
  await page.screenshot({ path: '/tmp/m-vp-student-top.png', fullPage: false });
  await page.evaluate(() => window.scrollBy(0, 500));
  await page.waitForTimeout(300);
  await page.screenshot({ path: '/tmp/m-vp-student-mid.png', fullPage: false });
});
test('@mobile vp admin users', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(URL + '/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/m-vp-admin-users.png', fullPage: false });
});
test('@mobile vp prof', async ({ page }) => {
  await login(page, 'vasile.popescu.1@prof.univ.ro');
  await page.screenshot({ path: '/tmp/m-vp-prof.png', fullPage: false });
});
