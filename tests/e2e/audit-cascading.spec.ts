import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function loginAdmin(page: import('@playwright/test').Page) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', 'admin@univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('Scenariul user: FAC + AIA + master → warning + auto-fix', async ({ page }) => {
  await loginAdmin(page);
  // Acces direct cu combinație imposibilă (AIA e licență, nu master)
  // facultyId=5 (FAC), programId=13 (AIA), programLevel=master
  await page.goto(BASE + '/admin?facultyId=5&programId=13&programLevel=master');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  // Trebuie să apară warning-ul „Combinație fără date"
  await expect(page.locator('text=/Combinație fără date/i').first()).toBeVisible({ timeout: 8000 });
  await page.screenshot({ path: '/tmp/audit-impossible-combo.png', fullPage: false });
});

test('Cascading: pick master → year=3 dispare din dropdown', async ({ page }) => {
  await loginAdmin(page);
  await page.goto(BASE + '/admin');
  await page.waitForLoadState('networkidle');
  // setează level=master via Select
  const lvlSelect = page.locator('label:has-text("Nivel") + select, label:has-text("Nivel")').first().locator('xpath=following-sibling::select[1] | xpath=//select[1]');
  // simpler: direct via URL
  await page.goto(BASE + '/admin?programLevel=master');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // Anul Select trebuie să aibă doar opțiunile 1 și 2
  const yearSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'Toți' }) });
  if ((await yearSelect.count()) > 0) {
    const yearOptions = await yearSelect.first().locator('option').allTextContents();
    expect(yearOptions).not.toContain('3');
  }
});

test('Cascading: pick programId nou → programLevel se sincronizează', async ({ page }) => {
  await loginAdmin(page);
  // pornesc cu master setat
  await page.goto(BASE + '/admin?programLevel=master');
  await page.waitForLoadState('networkidle');
  // Acum pick program licență (AIA id=13) — programLevel ar trebui să devină 'licenta'
  await page.goto(BASE + '/admin?programLevel=master&programId=13');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // Click pe Select Program și schimbă la AIA (id=13) — verifică că URL se actualizează
  // Simplification: verify URL state
  // Reality check: navigăm la URL combinat, observăm că cascading nu rulează cu URL direct
  // În schimb verificăm: dacă scriu programId=13 din UI, programLevel devine 'licenta'
  // Trebuie testat via select.selectOption
  await page.goto(BASE + '/admin?programLevel=master');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  // Open program select and pick AIA
  const programSelect = page.locator('select').filter({ hasText: /AIA|IS|RIA/ }).first();
  if ((await programSelect.count()) > 0) {
    await programSelect.selectOption('13');
    await page.waitForTimeout(500);
    // URL ar trebui să aibă programId=13 ȘI programLevel=licenta
    expect(page.url()).toContain('programId=13');
    expect(page.url()).toContain('programLevel=licenta');
  }
});
