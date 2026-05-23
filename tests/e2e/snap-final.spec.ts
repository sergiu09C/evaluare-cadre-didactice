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

test('@mobile final student home with YS/WD', async ({ page }) => {
  await login(page, 'student1@univ.ro');
  // scroll la secțiunea YS/WD
  await page.evaluate(() => window.scrollBy(0, 1800));
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/final-yswd.png', fullPage: false });
});

test('@mobile final admin KPI dashboard', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(URL + '/admin/kpis');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/final-kpis.png', fullPage: false });
});
