import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const STUDENT = { email: 'student1@univ.ro', password: 'password123' };
const ADMIN = { email: 'admin@univ.ro', password: 'password123' };
const PROFESSOR = { email: 'vasile.popescu.1@prof.univ.ro', password: 'password123' };

type Audit = {
  page: string;
  selector: string;
  label: string;
  result: 'pass' | 'fail';
  notes?: string;
};
const results: Audit[] = [];
const consoleErrors: { page: string; text: string }[] = [];

async function login(page: Page, creds: { email: string; password: string }, expectedUrl: string | RegExp) {
  await page.goto('/login');
  await page.fill('input[autocomplete="email"]', creds.email);
  await page.fill('input[autocomplete="current-password"]', creds.password);
  await page.click('button[type="submit"]');
  if (typeof expectedUrl === 'string') {
    await page.waitForURL(expectedUrl, { timeout: 10000 });
  } else {
    await page.waitForURL(expectedUrl, { timeout: 10000 });
  }
  await page.waitForLoadState('networkidle');
}

function trackErrors(page: Page, pageName: string) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push({ page: pageName, text: msg.text() });
  });
  page.on('pageerror', (err) => consoleErrors.push({ page: pageName, text: 'PAGE ERROR: ' + err.message }));
}

test.afterAll(() => {
  const outPath = path.join(__dirname, '..', 'full-platform-audit.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        results,
        consoleErrors,
        summary: {
          total: results.length,
          passed: results.filter((r) => r.result === 'pass').length,
          failed: results.filter((r) => r.result === 'fail').length,
          consoleErrorCount: consoleErrors.length,
        },
      },
      null,
      2,
    ),
  );
  console.log('\n📊 Final summary:', JSON.stringify({
    total: results.length,
    passed: results.filter((r) => r.result === 'pass').length,
    failed: results.filter((r) => r.result === 'fail').length,
    consoleErrors: consoleErrors.length,
  }, null, 2));
});

async function recordNav(page: Page, pageName: string, selector: string, label: string, expectedUrlPattern: RegExp) {
  try {
    await page.locator(selector).first().click({ timeout: 2000 });
    await page.waitForTimeout(800);
    const ok = expectedUrlPattern.test(page.url());
    results.push({
      page: pageName,
      selector,
      label,
      result: ok ? 'pass' : 'fail',
      notes: ok ? page.url() : `Expected ${expectedUrlPattern} but got ${page.url()}`,
    });
  } catch (e: any) {
    results.push({
      page: pageName,
      selector,
      label,
      result: 'fail',
      notes: e?.message?.slice(0, 200),
    });
  }
}

test.describe('ECD Full Platform Audit', () => {
  test('Admin panel renders without blank page', async ({ page }) => {
    trackErrors(page, 'admin');
    await login(page, ADMIN, '/admin');
    await expect(page.locator('main')).toBeVisible();

    // Visit admin controls (previously blank)
    await page.goto('/admin/controls');
    await page.waitForLoadState('networkidle');
    const text = await page.locator('main').innerText();
    expect(text.length).toBeGreaterThan(100);
    expect(text).toMatch(/Platform|Setări|Mesaje/i);
    results.push({
      page: 'admin',
      selector: '/admin/controls',
      label: 'AdminControls renders',
      result: 'pass',
      notes: `text length: ${text.length}`,
    });

    await page.goto('/admin/reports');
    await page.waitForLoadState('networkidle');
    const reportText = await page.locator('main').innerText();
    expect(reportText.length).toBeGreaterThan(50);
    results.push({
      page: 'admin',
      selector: '/admin/reports',
      label: 'AdminReports renders',
      result: 'pass',
    });
  });

  test('Student sidebar — all routes load distinct pages', async ({ page }) => {
    trackErrors(page, 'student-nav');
    await login(page, STUDENT, /\/$/);

    // 1. Acasă — already on it
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Bună/);
    results.push({ page: 'sidebar', selector: '/', label: 'Acasă', result: 'pass' });

    // 2. Evaluări active → /evaluations
    await page.locator('nav button:has-text("Evaluări active")').click();
    await page.waitForURL('**/evaluations', { timeout: 5000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Toate evaluările/);
    results.push({ page: 'sidebar', selector: '/evaluations', label: 'Evaluări active', result: 'pass' });

    // 3. Istoric → /history
    await page.locator('nav button:has-text("Istoric")').click();
    await page.waitForURL('**/history', { timeout: 5000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Istoric/);
    results.push({ page: 'sidebar', selector: '/history', label: 'Istoric', result: 'pass' });

    // 4. Rezultate agregate → /results
    await page.locator('nav button:has-text("Rezultate agregate")').click();
    await page.waitForURL('**/results', { timeout: 5000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Rezultate agregate/);
    results.push({ page: 'sidebar', selector: '/results', label: 'Rezultate agregate', result: 'pass' });

    // 5. Achievements → /achievements
    await page.locator('nav button:has-text("Achievements")').click();
    await page.waitForURL('**/achievements', { timeout: 5000 });
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Achievements/);
    results.push({ page: 'sidebar', selector: '/achievements', label: 'Achievements', result: 'pass' });
  });

  test('Dashboard CTA links go to real pages', async ({ page }) => {
    trackErrors(page, 'dashboard-ctas');
    await login(page, STUDENT, /\/$/);

    // "Vezi toate schimbările" in closing-the-loop banner → /results
    await recordNav(
      page,
      'dashboard',
      '#main-content a:has-text("Vezi toate schimbările")',
      'Banner · Vezi toate schimbările',
      /\/results$/,
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // "Vezi toate →" in Evaluări active card → /evaluations
    await recordNav(
      page,
      'dashboard',
      '#main-content a:has-text("Vezi toate →")',
      'Evaluations card · Vezi toate',
      /\/evaluations$/,
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Achievements teaser "Vezi toate" button → /achievements
    await recordNav(
      page,
      'dashboard',
      '#main-content button:has-text("Vezi toate")',
      'Achievements teaser · Vezi toate',
      /\/achievements$/,
    );
  });

  test('Topbar — Notifications dropdown opens', async ({ page }) => {
    trackErrors(page, 'notifications');
    await login(page, STUDENT, /\/$/);

    await page.locator('button[aria-label^="Notificări"]').click();
    await page.waitForTimeout(500);
    const panel = page.locator('h3:has-text("Notificări")').first();
    await expect(panel).toBeVisible({ timeout: 3000 });
    results.push({
      page: 'topbar',
      selector: 'button[aria-label="Notificări"]',
      label: 'Notificări dropdown opens',
      result: 'pass',
    });
  });

  test('Topbar — Command Palette opens with ⌘K and click', async ({ page }) => {
    trackErrors(page, 'command-palette');
    await login(page, STUDENT, /\/$/);

    // Click search bar
    await page.locator('button[aria-label="Deschide paleta de comenzi"]').click();
    await page.waitForTimeout(500);
    await expect(page.locator('input[placeholder*="Caută"]')).toBeVisible();
    results.push({
      page: 'topbar',
      selector: 'CommandPalette',
      label: 'Command palette opens on click',
      result: 'pass',
    });
    // Press Escape to close
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Open via keyboard shortcut
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(300);
    const inputVisible = await page.locator('input[placeholder*="Caută"]').isVisible({ timeout: 1500 }).catch(() => false);
    if (!inputVisible) {
      // Try Control+k (linux)
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(300);
    }
    const finalVisible = await page.locator('input[placeholder*="Caută"]').isVisible({ timeout: 1500 }).catch(() => false);
    results.push({
      page: 'topbar',
      selector: 'CommandPalette · keyboard',
      label: '⌘K opens palette',
      result: finalVisible ? 'pass' : 'fail',
    });
  });

  test('Static pages — Terms, Privacy, Guide load', async ({ page }) => {
    trackErrors(page, 'static-pages');

    // Terms (public, no auth)
    await page.goto('/terms');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Termenii/);
    results.push({ page: 'static', selector: '/terms', label: 'Terms', result: 'pass' });

    // Privacy (public)
    await page.goto('/privacy');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/confidențialitate/);
    results.push({ page: 'static', selector: '/privacy', label: 'Privacy', result: 'pass' });

    // Guide (auth required)
    await login(page, STUDENT, /\/$/);
    await page.goto('/guide');
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Ghid/);
    results.push({ page: 'static', selector: '/guide', label: 'Guide', result: 'pass' });
  });

  test('Login footer links — Terms + Privacy', async ({ page }) => {
    trackErrors(page, 'login-footer');
    await page.goto('/login');
    await page.locator('a:has-text("Termenii de utilizare")').click();
    await page.waitForURL('**/terms');
    results.push({ page: 'login', selector: 'a · Termeni', label: 'Login → Terms', result: 'pass' });

    await page.goto('/login');
    await page.locator('a:has-text("Politica de confidențialitate")').click();
    await page.waitForURL('**/privacy');
    results.push({ page: 'login', selector: 'a · Privacy', label: 'Login → Privacy', result: 'pass' });
  });

  test('Sidebar "Ghid pentru studenți" → /guide', async ({ page }) => {
    trackErrors(page, 'sidebar-guide');
    await login(page, STUDENT, /\/$/);
    await page.locator('nav a:has-text("Ghid pentru studenți")').click();
    await page.waitForURL('**/guide', { timeout: 5000 });
    results.push({ page: 'sidebar', selector: '/guide', label: 'Ghid pentru studenți', result: 'pass' });
  });

  test('Evaluation form — still works after refactors', async ({ page }) => {
    trackErrors(page, 'evaluation');
    await login(page, STUDENT, /\/$/);
    await page.goto('/evaluations');
    await page.waitForLoadState('networkidle');

    const btn = page.locator('#main-content button:has-text("Începe"), #main-content button:has-text("Continuă")').first();
    await expect(btn).toBeVisible();
    await btn.click();
    await page.waitForURL(/\/evaluation\/\d+/);

    const radios = page.locator('button[role="radio"]');
    await expect(radios).toHaveCount(5);
    await radios.nth(3).click();
    await expect(radios.nth(3)).toHaveAttribute('aria-checked', 'true');

    results.push({ page: 'evaluation', selector: 'flow', label: 'Evaluation form flow works', result: 'pass' });
  });

  test('Professor dashboard loads', async ({ page }) => {
    trackErrors(page, 'professor');
    await login(page, PROFESSOR, '/professor');
    await expect(page.locator('main')).toBeVisible();
    const text = await page.locator('main').innerText();
    expect(text.length).toBeGreaterThan(50);
    results.push({ page: 'professor', selector: '/professor', label: 'Professor dashboard', result: 'pass' });
  });
});
