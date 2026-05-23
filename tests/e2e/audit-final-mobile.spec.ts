import { test, devices } from '@playwright/test';
const URL = 'https://evaluare-cadre-didactice-production.up.railway.app';

async function login(page: any, email: string) {
  await page.goto(URL + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 15000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
}

test.use({ ...devices['iPhone 13'] });

test('@mobile iphone login', async ({ page }) => {
  await page.goto(URL + '/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/final-iphone-login.png', fullPage: false });
});

test('@mobile iphone student', async ({ page }) => {
  await login(page, 'student1@univ.ro');
  await page.screenshot({ path: '/tmp/final-iphone-student.png', fullPage: false });
});

test('@mobile iphone menu open', async ({ page }) => {
  await login(page, 'student1@univ.ro');
  await page.getByRole('button', { name: /Deschide meniul/i }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/final-iphone-menu.png', fullPage: false });
});

test('@mobile iphone admin users', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(URL + '/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/final-iphone-admin-users.png', fullPage: false });
});
