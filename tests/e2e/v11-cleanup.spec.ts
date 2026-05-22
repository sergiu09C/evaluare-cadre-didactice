import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const ADMIN = { email: 'admin@univ.ro', password: 'password123' };
const PROF = { email: 'vasile.popescu.1@prof.univ.ro', password: 'password123' };
const STUDENT = { email: 'student1@univ.ro', password: 'password123' };

async function login(page: import('@playwright/test').Page, creds: { email: string; password: string }) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', creds.email);
  await page.fill('input[autocomplete="current-password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('R1.1: StudentDashboard slim — DualRadar + streak + shortcut buttons', async ({ page }) => {
  await login(page, STUDENT);
  await page.goto(BASE + '/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /dashboard student/i })).toBeVisible();
  await expect(page.locator('text=/Streak completare/i').first()).toBeVisible();
  await expect(page.getByRole('button', { name: /înapoi la acasă/i })).toBeVisible();
});

test('R1.2: ProfessorDashboard slim — Cursurile mele + KPI Media ta', async ({ page }) => {
  await login(page, PROF);
  await page.goto(BASE + '/professor/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /dashboard profesor/i })).toBeVisible();
  await expect(page.locator('text=/Media ta/i').first()).toBeVisible();
  await expect(page.locator('text=/Cursurile mele/i').first()).toBeVisible();
});

test('R1.3: AdminDashboard slim — Tabel profesori cu filtre + sort', async ({ page }) => {
  await login(page, ADMIN);
  await page.goto(BASE + '/admin/dashboard');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /tabel profesori/i })).toBeVisible();
  // tabel cu rânduri
  const rows = await page.locator('table tbody tr').count();
  expect(rows).toBeGreaterThan(10);
  // butoanele de sort prezente
  await expect(page.getByRole('button', { name: /^Medie/i })).toBeVisible();
});

test('R2: AdminUsers paginare — page 1 are <50 butoane, total 1401', async ({ page }) => {
  await login(page, ADMIN);
  await page.goto(BASE + '/admin/users');
  await page.waitForLoadState('networkidle');
  // Verifică paginarea apare
  await expect(page.locator('text=/Pagina 1 din \\d+/').first()).toBeVisible({ timeout: 10000 });
  // Total 1401
  await expect(page.locator('text=/1[.,]?401 utilizatori/').first()).toBeVisible();
  // Doar 25 rânduri în tabel
  const rows = await page.locator('table tbody tr').count();
  expect(rows).toBeLessThanOrEqual(25);
  // Butonul „Următor →" clickable, navighează la page 2
  const next = page.getByRole('button', { name: /următor/i });
  await next.click();
  await page.waitForTimeout(500);
  await expect(page.locator('text=/Pagina 2/').first()).toBeVisible();
});
