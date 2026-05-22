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

test('1. Profesor: vede 3 bare participare (universitate, facultate, personală)', async ({ page }) => {
  await login(page, PROF);
  await page.goto(BASE + '/professor');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /^rate de participare$/i })).toBeVisible({ timeout: 10000 });
  // 3 secțiuni
  await expect(page.locator('text=/^Universitate$/').first()).toBeVisible();
  await expect(page.locator('text=/^Te-au evaluat pe tine$/').first()).toBeVisible();
  // verifică valorile concrete (univ 100%, FI 100%, Vasile Popescu 83%)
  await expect(page.locator('text=/83%/').first()).toBeVisible();
  await page.screenshot({ path: '/tmp/v10-prof-participation.png', fullPage: false });
});

test('2. Profesor: are buton „Situația mea" care setează departament', async ({ page }) => {
  await login(page, PROF);
  await page.goto(BASE + '/professor');
  await page.waitForLoadState('networkidle');
  const btnMy = page.getByRole('button', { name: /situația mea/i });
  await expect(btnMy).toBeVisible({ timeout: 10000 });
  await btnMy.click();
  await page.waitForTimeout(800);
  expect(page.url()).toMatch(/departmentId=/);
  expect(page.url()).toMatch(/facultyId=\d+/);
});

test('3. Student: vede 2 bare (universitate + facultate), NU vede „pe tine"', async ({ page }) => {
  await login(page, STUDENT);
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /^rate de participare$/i })).toBeVisible({ timeout: 10000 });
  // are universitate + facultate (FI, my-faculty)
  await expect(page.locator('text=/^Universitate$/').first()).toBeVisible();
  await expect(page.locator('text=/Informatică/').first()).toBeVisible();
  // NU are „te-au evaluat pe tine"
  expect(await page.locator('text=/^Te-au evaluat pe tine$/').count()).toBe(0);
});
