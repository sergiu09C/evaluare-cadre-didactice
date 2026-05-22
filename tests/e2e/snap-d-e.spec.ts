import { test } from '@playwright/test';
const BASE = 'http://localhost:3000';
async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('D — admin: modal edit professor extins cu facultate + dept + assignments', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(BASE + '/admin/users');
  await page.waitForLoadState('networkidle');
  await page.getByRole('tab', { name: /Profesori/i }).click();
  await page.waitForTimeout(400);
  await page.getByRole('button', { name: /Editează/i }).first().click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/snap-d-edit-prof.png', fullPage: true });
});

test('E — ProfessorStudents: ListFilterBar', async ({ page }) => {
  await login(page, 'vasile.popescu.1@prof.univ.ro');
  await page.goto(BASE + '/professor/students');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/snap-e-prof-students.png', fullPage: true });
});

test('E — EvaluationHistory student: ListFilterBar tabs', async ({ page }) => {
  await login(page, 'student1@univ.ro');
  await page.goto(BASE + '/history');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/snap-e-eval-history.png', fullPage: true });
});

test('I — Profesor dashboard extins', async ({ page }) => {
  await login(page, 'vasile.popescu.1@prof.univ.ro');
  await page.goto(BASE + '/professor/dashboard');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/snap-i-prof-dashboard.png', fullPage: true });
});
