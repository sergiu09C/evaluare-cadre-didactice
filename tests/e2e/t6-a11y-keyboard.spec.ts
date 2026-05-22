import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('T6a — Skip link + tab navigation pe Acasă student', async ({ page }) => {
  await login(page, 'student1@univ.ro');
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Tab → primul focus trebuie să fie pe „Sari la conținut principal" (skip link)
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.textContent || '');
  expect(focused).toContain('Sari la');
});

test('T6b — Escape închide modal AdminUsers', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin/users');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Adaugă utilizator/i }).click();
  await page.waitForTimeout(400);
  await expect(page.getByText(/Adaugă utilizator nou/i)).toBeVisible();
  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  // Modalul s-a închis — câmpul Email nu mai e vizibil
  await expect(page.getByText(/Adaugă utilizator nou/i)).not.toBeVisible();
});

test('T6c — ConfirmDialog deschis are focus pe Anulează (defensive)', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin/action-templates');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);

  // Dacă există vreun șablon, declanșez ștergerea
  const deleteBtn = page.getByRole('button', { name: /Șterge șablonul/i }).first();
  if ((await deleteBtn.count()) === 0) {
    test.skip(true, 'Niciun șablon de testat');
  }
  await deleteBtn.click();
  await page.waitForTimeout(500);
  // Verific că butonul focusat este „Anulează" (nu „Șterge")
  const focusedText = await page.evaluate(() => document.activeElement?.textContent || '');
  expect(focusedText).toMatch(/Anulează/i);
  await page.keyboard.press('Escape');
});

test('T6d — ARIA tabs/buttons pe Acasă admin', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  // Tab-urile Summary/Explore/Trend trebuie să existe cu role=tab
  const tabs = await page.locator('[role="tab"]').count();
  expect(tabs).toBeGreaterThanOrEqual(3);
});
