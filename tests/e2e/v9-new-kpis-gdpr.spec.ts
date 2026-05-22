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

test('1. Student: vede noile KPIs (eligibili, max posibile) și buton facultatea mea', async ({ page }) => {
  await login(page, STUDENT);
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('text=/Studenți eligibili/i').first()).toBeVisible({ timeout: 10000 });
  await expect(page.locator('text=/Max\\. evaluări posibile/i').first()).toBeVisible();
  // Acțiuni propuse KPI
  await expect(page.locator('text=/Acțiuni propuse/i').first()).toBeVisible();
  // butonul Situația facultății mele
  await expect(page.getByRole('button', { name: /situația facultății mele/i })).toBeVisible();
  await page.screenshot({ path: '/tmp/v9-student-kpis.png', fullPage: true });
});

test('2. Student: click pe „Situația facultății mele" aplică filtru', async ({ page }) => {
  await login(page, STUDENT);
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  const btn = page.getByRole('button', { name: /situația facultății mele/i });
  await btn.click();
  await page.waitForTimeout(800);
  expect(page.url()).toMatch(/facultyId=\d+/);
  // după click apare linkul „Vezi întreaga platformă →"
  await expect(page.locator('text=/Vezi [iî]ntreaga platform/i').first()).toBeVisible();
});

test('3. Student: charts noi (evaluări per an / ciclu / acțiuni) prezente', async ({ page }) => {
  await login(page, STUDENT);
  await page.goto(BASE + '/?tab=explore');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /evaluări per an de studiu/i })).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('heading', { name: /evaluări per ciclu studii/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^acțiuni ceac$/i })).toBeVisible();
  // heatmap dim selectabilă (anterior „an × facultate" fix — eliminat în R7)
  await expect(page.getByRole('heading', { name: /heatmap 2d/i })).toBeVisible();
});

test('4. GDPR student: NU vede opțiunea „Profesori" în top-rankings', async ({ page }) => {
  await login(page, STUDENT);
  await page.goto(BASE + '/?tab=explore');
  await page.waitForLoadState('networkidle');
  // ar trebui să apară mesajul GDPR
  await expect(page.locator('text=/Studenții văd doar agregate pe departamente/i').first()).toBeVisible({ timeout: 10000 });
  // Select-ul de Categorie nu trebuie să conțină „Profesori" ca opțiune
  const rankingSelect = page
    .locator('label')
    .filter({ hasText: /^Categorie$/ })
    .first()
    .locator('xpath=following-sibling::select');
  if ((await rankingSelect.count()) > 0) {
    const options = await rankingSelect.locator('option').allTextContents();
    expect(options).not.toContain('Profesori');
  }
});

test('5. GDPR profesor: NU vede „Profesori" dar vede „Disciplinele mele"', async ({ page }) => {
  await login(page, PROF);
  await page.goto(BASE + '/professor?tab=explore');
  await page.waitForLoadState('networkidle');
  // căutăm „Disciplinele mele" în opțiuni
  const content = await page.content();
  expect(content).toMatch(/Disciplinele mele/i);
  expect(content).not.toMatch(/<option value="professors"/i);
});

test('6. GDPR admin: vede toate opțiunile incl. „Profesori"', async ({ page }) => {
  await login(page, ADMIN);
  await page.goto(BASE + '/admin?tab=explore');
  await page.waitForLoadState('networkidle');
  const content = await page.content();
  expect(content).toMatch(/value="professors"/i);
});
