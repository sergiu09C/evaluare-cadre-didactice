import { test } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('Screenshot student cu 2 filtre', async ({ page }) => {
  await login(page, 'student1@univ.ro', 'password123');
  await page.goto(BASE + '/?facultyId=1&semester=1&days=540');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/acasa-student.png', fullPage: true });
});

test('Screenshot profesor cu 2 filtre', async ({ page }) => {
  await login(page, 'vasile.popescu.1@prof.univ.ro', 'password123');
  await page.goto(BASE + '/professor?facultyId=1&category=didactica&days=540');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/acasa-profesor.png', fullPage: true });
});

test('Screenshot admin cu 2 filtre', async ({ page }) => {
  await login(page, 'admin@univ.ro', 'password123');
  await page.goto(BASE + '/admin?programLevel=licenta&year=2&days=540');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/acasa-admin.png', fullPage: true });
});
