import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const PROF = { email: 'vasile.popescu.1@prof.univ.ro', password: 'password123' };

test('Reports → click pe evaluare → pagină detalii cu scoruri și text', async ({ page }) => {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', PROF.email);
  await page.fill('input[autocomplete="current-password"]', PROF.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

  await page.goto(BASE + '/professor/reports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  // Primul card devine button clickable
  const firstCard = page.locator('button[aria-label^="Deschide detaliile"]').first();
  await expect(firstCard).toBeVisible();
  await page.screenshot({ path: '/tmp/v4-reports-list.png', fullPage: false });

  await firstCard.click();
  await page.waitForURL(/\/professor\/evaluations\/\d+/, { timeout: 8000 });
  await page.waitForLoadState('networkidle');

  // Verificări conținut: heading, distribuție, lista de răspunsuri
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByText(/Distribuție scoruri Likert/i)).toBeVisible();
  await expect(page.getByText(/Răspunsuri la fiecare întrebare/i)).toBeVisible();

  // Cel puțin câteva întrebări vizibile
  const questionsCount = await page.locator('ul li').count();
  expect(questionsCount).toBeGreaterThan(5);

  await page.screenshot({ path: '/tmp/v4-evaluation-details.png', fullPage: true });

  // Buton „Înapoi la rapoarte" funcțional
  await page.getByRole('button', { name: /înapoi la rapoarte/i }).first().click();
  await page.waitForURL(/\/professor\/reports/, { timeout: 5000 });
});
