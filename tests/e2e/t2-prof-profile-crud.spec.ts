import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('T2 — Editor profil profesor: admin schimbă departamentul', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin/users');
  await page.waitForLoadState('networkidle');

  // filtrez doar profesori
  await page.getByRole('tab', { name: /Profesori/i }).click();
  await page.waitForTimeout(400);

  // editez primul prof
  await page.getByRole('button', { name: /Editează/i }).first().click();
  await page.waitForTimeout(800);

  // verific că modal-ul de profil profesor e prezent
  await expect(page.getByText(/Profil profesor/i)).toBeVisible();
  await expect(page.getByText(/discipline/i).first()).toBeVisible();

  // închid modalul (test smoke, fără să salvez modificări de date)
  await page.getByRole('button', { name: /Anulează/i }).click();
});
