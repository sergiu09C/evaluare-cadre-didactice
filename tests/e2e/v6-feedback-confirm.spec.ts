import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const STUDENT = { email: 'student1@univ.ro', password: 'password123' };
const PROF = { email: 'vasile.popescu.1@prof.univ.ro', password: 'password123' };

async function login(page: import('@playwright/test').Page, creds: { email: string; password: string }) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', creds.email);
  await page.fill('input[autocomplete="current-password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
}

async function submitAndConfirm(page: import('@playwright/test').Page) {
  await page.goto(BASE + '/feedback');
  await page.waitForLoadState('networkidle');

  // Click pe „Trimite feedback" (chiar fără răspunsuri — backend acceptă lista goală)
  const submitBtn = page.getByRole('button', { name: /^trimite feedback$/i });
  await expect(submitBtn).toBeVisible();
  await submitBtn.click();

  // Ecran de confirmare cu mesaj clar
  await expect(page.locator('text=/Feedbackul a fost trimis cu succes/i').first()).toBeVisible({ timeout: 8000 });

  // Buton „Trimite din nou feedback"
  const resendBtn = page.getByRole('button', { name: /trimite din nou feedback/i });
  await expect(resendBtn).toBeVisible();

  // Butonul „Trimite feedback" inițial dispare cât timp e confirmarea
  await expect(page.getByRole('button', { name: /^trimite feedback$/i })).toHaveCount(0);

  // Click → reset, lista de întrebări reapare
  await resendBtn.click();
  await expect(page.locator('text=/Feedbackul a fost trimis cu succes/i')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^trimite feedback$/i })).toBeVisible();
}

test('Student — submit → confirmare + buton „Trimite din nou"', async ({ page }) => {
  await login(page, STUDENT);
  await submitAndConfirm(page);
  await page.screenshot({ path: '/tmp/v6-student-confirm.png', fullPage: true });
});

test('Profesor — submit → confirmare + buton „Trimite din nou"', async ({ page }) => {
  await login(page, PROF);
  await submitAndConfirm(page);
  await page.screenshot({ path: '/tmp/v6-prof-confirm.png', fullPage: true });
});
