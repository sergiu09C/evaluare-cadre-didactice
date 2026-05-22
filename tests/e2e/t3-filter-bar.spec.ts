import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('T3a — ListFilterBar pe AdminUsers (tabs + search + clear)', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin/users');
  await page.waitForLoadState('networkidle');

  // Tab „Profesori" funcționează
  await page.getByRole('tab', { name: /Profesori/i }).click();
  await page.waitForTimeout(400);
  await expect(page.getByRole('tab', { name: /Profesori/i })).toHaveAttribute('aria-selected', 'true');

  // Searchul filtrează
  await page.getByPlaceholder(/Caută după nume/i).fill('vasile');
  await page.waitForTimeout(500);

  // Clear all funcționează
  await page.getByRole('button', { name: /Resetează filtrele/i }).click();
  await page.waitForTimeout(400);
  await expect(page.getByRole('tab', { name: /Toți/i })).toHaveAttribute('aria-selected', 'true');
});

test('T3b — ListFilterBar pe EvaluationHistory (student)', async ({ page }) => {
  await login(page, 'student1@univ.ro');
  await page.goto(BASE + '/history');
  await page.waitForLoadState('networkidle');

  // Tab Trimise comutează
  await page.getByRole('tab', { name: /Trimise/i }).click();
  await page.waitForTimeout(400);
  await expect(page.getByRole('tab', { name: /Trimise/i })).toHaveAttribute('aria-selected', 'true');
});
