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

async function waitForHomeLoaded(page: import('@playwright/test').Page) {
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /acasă · călătoria evaluării/i }).first()).toBeVisible({ timeout: 10000 });
}

test.describe.serial('v8 — Rich dashboards Acasă', () => {
  test('1. Student: render baseline cu toate secțiunile', async ({ page }) => {
    await login(page, STUDENT);
    await page.goto(BASE + '/?tab=explore');
    await waitForHomeLoaded(page);
    // KPI hero pe Sumar — navig back ca să verific şi
    await page.goto(BASE + '/');
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/cadre didactice/i).first()).toBeVisible();
    // grafice pe Explore
    await page.goto(BASE + '/?tab=explore');
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('heading', { name: /distribuție scoruri/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /roluri active/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /heatmap 2d/i })).toBeVisible();
    await expect(page.getByRole('heading', { name: /top 10 rankings/i })).toBeVisible();
    await page.screenshot({ path: '/tmp/v8-student-baseline.png', fullPage: true });
  });

  test('2. Student: filtre + chips + URL persistence', async ({ page }) => {
    await login(page, STUDENT);
    await page.goto(BASE + '/?facultyId=1&programLevel=licenta');
    await waitForHomeLoaded(page);
    // chips trebuie să apară
    await expect(page.locator('text=/Facultatea: FI/i').first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator('text=/Nivel: licenta/i').first()).toBeVisible();
    await page.screenshot({ path: '/tmp/v8-student-filters.png', fullPage: false });

    // resetează tot
    await page.getByRole('button', { name: /resetează tot/i }).click();
    await expect(page.locator('text=/Facultatea: FI/i')).toHaveCount(0);
  });

  test('3. Student: click pe bara facultății → setează filtrul', async ({ page }) => {
    await login(page, STUDENT);
    await page.goto(BASE + '/?tab=explore');
    await waitForHomeLoaded(page);
    // localizează prima bară din chart-ul „Evaluări per facultate" (recharts)
    const bars = page.locator('.recharts-bar-rectangle path');
    const count = await bars.count();
    expect(count).toBeGreaterThan(0);
    // verifică că URL nu are facultyId înainte
    expect(page.url()).not.toContain('facultyId');
    // click pe prima bară
    await bars.first().click();
    await page.waitForTimeout(800);
    // URL ar trebui să conțină facultyId acum
    expect(page.url()).toMatch(/facultyId=\d+/);
  });

  test('4. Profesor: render Acasă cu filtre relevante', async ({ page }) => {
    await login(page, PROF);
    await page.goto(BASE + '/professor?tab=explore');
    await waitForHomeLoaded(page);
    await expect(page.getByRole('heading', { name: /heatmap 2d/i })).toBeVisible();
    // departament e disponibil pentru profesor — Select cu label „Departament"
    const departmentSelect = page.locator('select').filter({ has: page.locator('option', { hasText: /toate/i }) });
    expect(await departmentSelect.count()).toBeGreaterThan(0);
    await page.screenshot({ path: '/tmp/v8-prof-baseline.png', fullPage: true });
  });

  test('5. Profesor: slider zile schimbă time series', async ({ page }) => {
    await login(page, PROF);
    await page.goto(BASE + '/professor');
    await waitForHomeLoaded(page);
    const slider = page.locator('input[type="range"]');
    await expect(slider).toBeVisible();
    // schimbă valoarea — React controlled input necesită native setter
    await slider.evaluate((el: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
      setter?.call(el, '360');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.waitForTimeout(500);
    expect(page.url()).toContain('days=360');
  });

  test('6. Admin: render Acasă + top-N profesori clickable', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(BASE + '/admin?tab=explore');
    await waitForHomeLoaded(page);
    await expect(page.getByRole('heading', { name: /top 10 rankings/i })).toBeVisible();
    // setează ranking pe profesori avg
    const items = page.locator('ol li button').filter({ has: page.locator('div').first() });
    // ar trebui să existe minim 1 item
    expect(await items.count()).toBeGreaterThan(0);
    await page.screenshot({ path: '/tmp/v8-admin-baseline.png', fullPage: true });
  });

  test('7. Toggle %/absolut pe pie', async ({ page }) => {
    await login(page, STUDENT);
    await page.goto(BASE + '/?tab=explore');
    await waitForHomeLoaded(page);
    // căutăm primul toggle %
    const pctBtn = page.locator('button[aria-pressed]').filter({ hasText: /^%$/ }).first();
    await expect(pctBtn).toBeVisible({ timeout: 8000 });
    expect(await pctBtn.getAttribute('aria-pressed')).toBe('false');
    await pctBtn.click();
    await page.waitForTimeout(300);
    expect(await pctBtn.getAttribute('aria-pressed')).toBe('true');
  });

  test('8. Heatmap: schimbare rowDim/colDim → re-render', async ({ page }) => {
    await login(page, ADMIN);
    await page.goto(BASE + '/admin?tab=explore');
    await waitForHomeLoaded(page);
    // setează heatmap rowDim=program
    const rowSelect = page.locator('select').filter({ has: page.locator('option', { hasText: /^facultate$/i }) }).first();
    await rowSelect.selectOption('program');
    await page.waitForTimeout(800);
    // verifică că în heatmap apare un label „Program ↓"
    await expect(page.locator('text=/Program ↓ ·/i')).toBeVisible();
  });

  test('9. Reset filtre individual via X pe chip', async ({ page }) => {
    await login(page, STUDENT);
    await page.goto(BASE + '/?facultyId=1&semester=1&year=2');
    await waitForHomeLoaded(page);
    // 3 chips
    const chips = page.locator('text=/Active:/i').locator('..').locator('span').filter({ hasText: /^(Facultatea|Sem|An):/i });
    const before = await chips.count();
    expect(before).toBeGreaterThanOrEqual(3);
    // click pe primul X
    const firstX = page.getByLabel(/Elimină filtrul Facultatea:/i).first();
    await firstX.click();
    await page.waitForTimeout(400);
    // facultyId dispare din URL
    expect(page.url()).not.toContain('facultyId=1');
    expect(page.url()).toContain('semester=1');
  });
});
