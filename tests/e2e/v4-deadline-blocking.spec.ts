import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const STUDENT = { email: 'student1@univ.ro', password: 'password123' };

async function login(page: import('@playwright/test').Page) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', STUDENT.email);
  await page.fill('input[autocomplete="current-password"]', STUDENT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('Deadline expirat → studentul nu poate accesa /evaluation/:id pentru draft', async ({ page }) => {
  await login(page);
  // Acces direct prin URL la un draft cunoscut (deadline e setat la 2026-01-01 < acum)
  await page.goto(BASE + '/evaluation/35463');
  await page.waitForLoadState('networkidle');

  // Trebuie să apară mesajul prietenos de deadline depășit, nu formul
  await expect(page.locator('text=/Termenul-limit.*a expirat/i').first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: /înapoi la dashboard/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /vezi istoricul/i })).toBeVisible();
  await expect(page.locator('#main-content').getByRole('button', { name: /feedback platform/i })).toBeVisible();
  await page.screenshot({ path: '/tmp/v4-deadline-locked.png', fullPage: false });
});

test('Deadline expirat → /evaluation/:id pentru submitted rămâne accesibil (istoric)', async ({ page }) => {
  await login(page);
  await page.goto(BASE + '/evaluation/29567');
  await page.waitForLoadState('networkidle');
  // Submitted încărcat OK — nu apare mesajul de blocare
  await expect(page.locator('text=/Termenul-limit.*a expirat/i')).toHaveCount(0);
});
