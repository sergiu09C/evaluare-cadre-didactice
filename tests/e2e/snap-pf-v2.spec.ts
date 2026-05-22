import { test, expect } from '@playwright/test';
const BASE = 'http://localhost:3000';
async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
  await page.waitForTimeout(500);
}

test('PF v2: counter real + istoric + form curat', async ({ page }) => {
  await login(page, 'student1@univ.ro');
  await page.goto(BASE + '/feedback');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/snap-pf-v2-landing.png', fullPage: true });

  // click „Trimite o evaluare nouă" → formular curat (fără răspunsuri pre-completate)
  await page.getByRole('button', { name: /Trimite o evaluare nouă/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/snap-pf-v2-form-clean.png', fullPage: true });

  // click pe primul item din istoric → modal de vizualizare
  await page.getByRole('button', { name: /Renunță/i }).click();
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /Evaluare din/ }).first().click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/snap-pf-v2-history-modal.png', fullPage: true });
});
