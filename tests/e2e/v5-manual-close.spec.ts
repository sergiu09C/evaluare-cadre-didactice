import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const ADMIN = { email: 'admin@univ.ro', password: 'password123' };
const STUDENT = { email: 'student1@univ.ro', password: 'password123' };

async function login(page: import('@playwright/test').Page, creds: { email: string; password: string }) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', creds.email);
  await page.fill('input[autocomplete="current-password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
}

async function setPlatformActive(page: import('@playwright/test').Page, active: boolean) {
  // Folosesc direct API-ul cu token-ul din localStorage al sesiunii adminului
  const token = await page.evaluate(() => localStorage.getItem('token'));
  const resp = await fetch('http://localhost:5001/api/platform/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_active: active }),
  });
  if (!resp.ok) throw new Error(`PATCH settings failed: ${resp.status}`);
}

test.describe.serial('Manual platform close affects students', () => {
  test('Admin oprește platforma → studentul vede „Platformă închisă" în header', async ({ browser }) => {
    // 1) Admin oprește platforma
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await login(adminPage, ADMIN);
    await setPlatformActive(adminPage, false);
    await adminCtx.close();

    // 2) Studentul vede starea închisă
    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();
    await login(studentPage, STUDENT);
    await studentPage.goto(BASE + '/');
    await studentPage.waitForLoadState('networkidle');

    // Header: pill „Platformă închisă · termen trecut"
    await expect(studentPage.locator('text=/Platform[ăa] [ÎIi]nchis[ăa]/i').first()).toBeVisible({ timeout: 10000 });
    await studentPage.screenshot({ path: '/tmp/v5-student-closed-header.png', fullPage: false });

    // 3) Accesare directă /evaluation/:id (draft) → ecran locked
    await studentPage.goto(BASE + '/evaluation/35463');
    await studentPage.waitForLoadState('networkidle');
    await expect(studentPage.locator('text=/Platforma de evaluare este închis/i').first()).toBeVisible({ timeout: 10000 });
    await studentPage.screenshot({ path: '/tmp/v5-evalform-locked.png', fullPage: false });

    await studentCtx.close();
  });

  test('Admin redeschide → studentul nu mai vede „închisă"', async ({ browser }) => {
    const adminCtx = await browser.newContext();
    const adminPage = await adminCtx.newPage();
    await login(adminPage, ADMIN);
    await setPlatformActive(adminPage, true);
    await adminCtx.close();

    const studentCtx = await browser.newContext();
    const studentPage = await studentCtx.newPage();
    await login(studentPage, STUDENT);
    await studentPage.goto(BASE + '/');
    await studentPage.waitForLoadState('networkidle');

    await expect(studentPage.locator('text=/Platform[ăa] [ÎIi]nchis[ăa]/i')).toHaveCount(0);
    await studentCtx.close();
  });
});
