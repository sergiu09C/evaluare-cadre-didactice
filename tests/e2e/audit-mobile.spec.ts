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

test('@mobile login', async ({ page }) => {
  await page.goto(URL + '/login');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/m-login.png', fullPage: true });
});

test('@mobile admin home', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(URL + '/admin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/m-admin.png', fullPage: true });
});

test('@mobile student home', async ({ page }) => {
  await login(page, 'student1@univ.ro');
  await page.goto(URL + '/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/m-student.png', fullPage: true });
});

test('@mobile professor home', async ({ page }) => {
  await login(page, 'vasile.popescu.1@prof.univ.ro');
  await page.goto(URL + '/professor');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/m-prof.png', fullPage: true });
});

test('@mobile admin users', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(URL + '/admin/users');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/m-admin-users.png', fullPage: true });
});
