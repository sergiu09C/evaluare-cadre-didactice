import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('T4 — „Situația mea completă" navighează la /professor/dashboard', async ({ page }) => {
  await login(page, 'vasile.popescu.1@prof.univ.ro');
  await page.goto(BASE + '/professor');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);

  const btn = page.getByRole('button', { name: /Situația mea completă/i });
  await expect(btn).toBeVisible();

  await btn.click();
  await page.waitForURL(/\/professor\/dashboard/, { timeout: 5000 });

  // Verific că pagina dedicată afișează pipeline-ul personal
  await expect(page.getByText(/Călătoria evaluării tale/i)).toBeVisible();
  await expect(page.getByText(/Discipline asignate/i)).toBeVisible();
});
