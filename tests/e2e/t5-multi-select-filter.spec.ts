import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('T5 — Multi-select filtru (an=1 ȘI an=2 simultan)', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Click pe trigger-ul „Anul" (MultiSelect)
  const anYearTrigger = page.locator('#ms-anul');
  await expect(anYearTrigger).toBeVisible();
  await anYearTrigger.click();
  await page.waitForTimeout(300);

  // Selectez Anul 1
  await page.getByRole('option', { name: /Anul 1/i }).click();
  await page.waitForTimeout(300);
  // Selectez Anul 2
  await page.getByRole('option', { name: /Anul 2/i }).click();
  await page.waitForTimeout(500);

  // Verific că URL conține year=1,2 sau 2,1
  await expect(page).toHaveURL(/year=(1%2C2|2%2C1|1,2|2,1)/);

  // Verific că datele s-au refiltrat (verific că un KPI există)
  await expect(page.getByText(/Evaluări transmise/i).first()).toBeVisible();
});
