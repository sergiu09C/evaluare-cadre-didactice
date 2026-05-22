import { test } from '@playwright/test';
const BASE = 'http://localhost:3000';

test('Reset password — flow complet', async ({ page, request }) => {
  await page.goto(BASE + '/login');
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: /Am uitat parola/i }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/snap-reset-modal-empty.png', fullPage: false });

  await page.fill('input[type="email"]', 'student1@univ.ro');
  await page.getByRole('button', { name: /Trimite link/i }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/snap-reset-modal-sent.png', fullPage: false });
});

test('Reset password — pagina /reset-password fără token', async ({ page }) => {
  await page.goto(BASE + '/reset-password');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/snap-reset-page-no-token.png', fullPage: true });
});
