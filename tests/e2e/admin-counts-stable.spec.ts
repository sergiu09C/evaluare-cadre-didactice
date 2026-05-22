import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const ADMIN = { email: 'admin@univ.ro', password: 'password123' };

test('AdminUsers — counts rămân stabile la schimbarea tab-urilor', async ({ page }) => {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', ADMIN.email);
  await page.fill('input[autocomplete="current-password"]', ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  await page.goto(BASE + '/admin/users');
  await page.waitForLoadState('networkidle');

  // citește counts pe tab "Toți"
  const all = page.getByRole('tab', { name: /toți/i });
  const stud = page.getByRole('tab', { name: /studenți/i });
  const prof = page.getByRole('tab', { name: /profesori/i });
  const adm = page.getByRole('tab', { name: /administratori/i });

  const initial = {
    all: (await all.textContent())?.match(/\d+/)?.[0],
    student: (await stud.textContent())?.match(/\d+/)?.[0],
    professor: (await prof.textContent())?.match(/\d+/)?.[0],
    admin: (await adm.textContent())?.match(/\d+/)?.[0],
  };

  // click pe "Profesori" și așteaptă refetch
  await prof.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const after = {
    all: (await all.textContent())?.match(/\d+/)?.[0],
    student: (await stud.textContent())?.match(/\d+/)?.[0],
    professor: (await prof.textContent())?.match(/\d+/)?.[0],
    admin: (await adm.textContent())?.match(/\d+/)?.[0],
  };

  expect(after).toEqual(initial);
  expect(initial.all).toBe('1401');
  expect(initial.student).toBe('1200');
  expect(initial.professor).toBe('200');
  expect(initial.admin).toBe('1');

  // și pe "Studenți"
  await stud.click();
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);

  const final = {
    all: (await all.textContent())?.match(/\d+/)?.[0],
    student: (await stud.textContent())?.match(/\d+/)?.[0],
    professor: (await prof.textContent())?.match(/\d+/)?.[0],
    admin: (await adm.textContent())?.match(/\d+/)?.[0],
  };
  expect(final).toEqual(initial);

  await page.screenshot({ path: '/tmp/admin-counts-stable.png', fullPage: false });
});
