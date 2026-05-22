import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const STUDENT = { email: 'student1@univ.ro', password: 'password123' };
const PROF = { email: 'vasile.popescu.1@prof.univ.ro', password: 'password123' };
const ADMIN = { email: 'admin@univ.ro', password: 'password123' };

async function login(page: import('@playwright/test').Page, creds: { email: string; password: string }) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', creds.email);
  await page.fill('input[autocomplete="current-password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('Student: Acasă afișează Călătoria evaluării; Dashboard student separat în meniu', async ({ page }) => {
  await login(page, STUDENT);
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /Acas[ăa].*C[ăa]l[ăa]toria evalu[ăa]rii/i })).toBeVisible();
  await expect(page.getByRole('button', { name: /dashboard student/i })).toBeVisible();
  await page.getByRole('button', { name: /dashboard student/i }).click();
  await page.waitForURL(/\/dashboard$/, { timeout: 5000 });
});

test('Profesor: /professor = lifecycle; /professor/dashboard = slim cu cursurile mele', async ({ page }) => {
  await login(page, PROF);
  await page.goto(BASE + '/professor');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /Acas[ăa].*C[ăa]l[ăa]toria evalu[ăa]rii/i })).toBeVisible();
  await page.goto(BASE + '/professor/dashboard');
  await page.waitForLoadState('networkidle');
  // slim — KPI cu „Evaluări primite" + „Media ta"
  await expect(page.locator('text=/Evaluări primite/i').first()).toBeVisible();
  await expect(page.locator('text=/Cursurile mele/i').first()).toBeVisible();
});

test('Admin: /admin = lifecycle; /admin/dashboard = vechiul dashboard', async ({ page }) => {
  await login(page, ADMIN);
  await page.goto(BASE + '/admin');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /Acas[ăa].*C[ăa]l[ăa]toria evalu[ăa]rii/i })).toBeVisible();
  await page.goto(BASE + '/admin/dashboard');
  await page.waitForLoadState('networkidle');
  // verificare prezență dashboard
  expect(page.url()).toContain('/admin/dashboard');
});
