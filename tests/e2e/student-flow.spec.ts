import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const STUDENT = { email: 'student1@univ.ro', password: 'password123' };

type ButtonAudit = {
  page: string;
  selector: string;
  label: string;
  visible: boolean;
  enabled: boolean;
  clickResult:
    | 'navigated'
    | 'modal_opened'
    | 'no_effect'
    | 'error'
    | 'fragment_only'
    | 'state_changed';
  beforeUrl: string;
  afterUrl: string;
  notes?: string;
};

const audit: ButtonAudit[] = [];
const consoleErrors: { page: string; text: string }[] = [];
const networkErrors: { page: string; url: string; status: number }[] = [];

async function loginAsStudent(page: Page) {
  await page.goto('/login');
  await page.fill('input[autocomplete="email"]', STUDENT.email);
  await page.fill('input[autocomplete="current-password"]', STUDENT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

async function auditButton(
  page: Page,
  pageName: string,
  selector: string,
  label: string,
): Promise<void> {
  const beforeUrl = page.url();
  const beforeBodyHTML = (await page.locator('body').innerHTML()).slice(0, 1000);
  let enabled = true;
  let visible = true;
  let clickResult: ButtonAudit['clickResult'] = 'no_effect';
  let notes: string | undefined;

  try {
    const loc = page.locator(selector).first();
    visible = await loc.isVisible({ timeout: 500 }).catch(() => false);
    if (!visible) {
      audit.push({
        page: pageName,
        selector,
        label,
        visible: false,
        enabled: false,
        clickResult: 'no_effect',
        beforeUrl,
        afterUrl: beforeUrl,
        notes: 'not visible',
      });
      return;
    }
    enabled = await loc.isEnabled({ timeout: 500 }).catch(() => true);
    if (!enabled) {
      audit.push({
        page: pageName,
        selector,
        label,
        visible,
        enabled: false,
        clickResult: 'no_effect',
        beforeUrl,
        afterUrl: beforeUrl,
        notes: 'disabled',
      });
      return;
    }
    await loc.click({ timeout: 1500 });
    await page.waitForTimeout(600);
    const afterUrl = page.url();
    if (afterUrl !== beforeUrl) {
      const fragOnly =
        afterUrl.split('#')[0] === beforeUrl.split('#')[0] && afterUrl.includes('#');
      clickResult = fragOnly ? 'fragment_only' : 'navigated';
    } else {
      const dialogOpen = (await page.locator('[role="dialog"]:visible').count()) > 0;
      const modalOpen =
        (await page.locator('.headlessui-dialog, [aria-modal="true"]').count()) > 0;
      if (dialogOpen || modalOpen) {
        clickResult = 'modal_opened';
      } else {
        const afterBodyHTML = (await page.locator('body').innerHTML()).slice(0, 1000);
        clickResult = beforeBodyHTML !== afterBodyHTML ? 'state_changed' : 'no_effect';
      }
    }
    audit.push({ page: pageName, selector, label, visible, enabled, clickResult, beforeUrl, afterUrl, notes });
  } catch (e: any) {
    audit.push({
      page: pageName,
      selector,
      label,
      visible,
      enabled,
      clickResult: 'error',
      beforeUrl,
      afterUrl: page.url(),
      notes: e?.message?.slice(0, 200),
    });
  }
}

test.beforeAll(() => {
  audit.length = 0;
  consoleErrors.length = 0;
  networkErrors.length = 0;
});

test.afterAll(() => {
  const out = {
    audit,
    consoleErrors,
    networkErrors,
    summary: {
      total: audit.length,
      navigated: audit.filter((a) => a.clickResult === 'navigated').length,
      modalOpened: audit.filter((a) => a.clickResult === 'modal_opened').length,
      stateChanged: audit.filter((a) => a.clickResult === 'state_changed').length,
      noEffect: audit.filter((a) => a.clickResult === 'no_effect').length,
      fragmentOnly: audit.filter((a) => a.clickResult === 'fragment_only').length,
      errors: audit.filter((a) => a.clickResult === 'error').length,
    },
  };
  const outPath = path.join(__dirname, '..', 'audit-results.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log('\n📋 AUDIT SUMMARY:', JSON.stringify(out.summary, null, 2));
  console.log(`📄 Full results: ${outPath}`);
});

test.describe('ECD — Student Flow', () => {
  test('Login page — form fields, audit, submit', async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push({ page: 'login', text: msg.text() });
    });
    page.on('response', (resp) => {
      if (resp.status() >= 400 && resp.url().includes('localhost')) {
        networkErrors.push({ page: 'login', url: resp.url(), status: resp.status() });
      }
    });

    await page.goto('/login');
    await expect(page.locator('h2:has-text("Bun venit")')).toBeVisible();
    await expect(page.locator('input[autocomplete="email"]')).toBeVisible();
    await expect(page.locator('input[autocomplete="current-password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Toggle password visibility — click and verify type changes (BEFORE auditing links, to avoid leaving the login page)
    const pwInput = page.locator('input[autocomplete="current-password"]');
    await expect(pwInput).toHaveAttribute('type', 'password');
    const toggleBtn = page.locator('button[aria-label="Afișează parola"]');
    if (await toggleBtn.isVisible({ timeout: 300 }).catch(() => false)) {
      await toggleBtn.click();
      await page.waitForTimeout(200);
      await expect(pwInput).toHaveAttribute('type', 'text');
      audit.push({
        page: 'login',
        selector: 'button[aria-label="Afișează parola"]',
        label: 'Login · Toggle password visibility',
        visible: true,
        enabled: true,
        clickResult: 'state_changed',
        beforeUrl: page.url(),
        afterUrl: page.url(),
        notes: 'type=password → type=text',
      });
      // Toggle back so submit works on the real password field
      await page.locator('button[aria-label="Ascunde parola"]').click();
    }

    // Audit "Am uitat parola" link (mailto, doesn't navigate so safe)
    await auditButton(page, 'login', 'a:has-text("Am uitat parola")', 'Login · Am uitat parola (mailto)');

    // Real login
    await page.fill('input[autocomplete="email"]', STUDENT.email);
    await page.fill('input[autocomplete="current-password"]', STUDENT.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    expect(page.url()).toMatch(/localhost:3000\/?$/);
  });

  // SKIP: legacy selectors din era pre-refactor (heading „Bună", text „Ați evaluat, noi am acționat").
  // Acoperit acum prin console-clean.spec.ts (smoke + 0 erori console) + t6-a11y-keyboard.spec.ts.
  // De rescris dacă vrem audit pe butoane click pentru StudentDashboard slim.
  test.skip('Student dashboard — renders + complete buttons audit', async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push({ page: 'dashboard', text: msg.text() });
    });
    page.on('response', (resp) => {
      if (resp.status() >= 400 && resp.url().includes('localhost')) {
        networkErrors.push({ page: 'dashboard', url: resp.url(), status: resp.status() });
      }
    });

    await loginAsStudent(page);

    // Sections render (use strict role/heading selectors)
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/Bună/);
    await expect(page.getByText('Ați evaluat, noi am acționat')).toBeVisible();
    // KPI cards — use the uppercase text-xs span containers
    for (const lbl of ['Evaluări active', 'Completate', 'Rata facultății', 'Streak completare']) {
      const span = page.locator(`#main-content span.uppercase:has-text("${lbl}")`);
      await expect(span.first()).toBeVisible();
    }
    await expect(page.getByRole('heading', { name: 'Evaluări active' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Scor mediu facultate' })).toBeVisible();
    await expect(page.locator('text=3,57').first()).toBeVisible();

    // Audit sidebar nav (skip Deconectare - destructive)
    const navItems = [
      ['Acasă', 'Sidebar · Acasă'],
      ['Evaluări active', 'Sidebar · Evaluări active'],
      ['Istoric', 'Sidebar · Istoric'],
      ['Rezultate agregate', 'Sidebar · Rezultate agregate'],
      ['Achievements', 'Sidebar · Achievements'],
    ] as const;
    for (const [label, full] of navItems) {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await auditButton(page, 'dashboard', `nav button:has-text("${label}")`, full);
    }

    // Return to dashboard
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Topbar buttons
    await auditButton(page, 'dashboard', 'button[aria-label="Notificări"]', 'Topbar · Notificări (bell)');
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await auditButton(
      page,
      'dashboard',
      'header button[aria-label*="ccesibilitate"], header button[aria-label*="ettings"]',
      'Topbar · Accessibility menu',
    );

    // Search bar (placeholder — div, not interactive)
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await auditButton(
      page,
      'dashboard',
      'header div:has-text("Caută o disciplină")',
      'Topbar · Search bar (placeholder)',
    );

    // Closing-the-loop CTA
    await auditButton(
      page,
      'dashboard',
      'a:has-text("Vezi toate cele")',
      'Banner · Vezi toate schimbările',
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // "Vezi toate →" link in Evaluări active card header
    await auditButton(
      page,
      'dashboard',
      'a:has-text("Vezi toate →")',
      'Evaluations card · Vezi toate (header link)',
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Achievements teaser CTA
    await auditButton(
      page,
      'dashboard',
      '#main-content button:has-text("Vezi toate")',
      'Achievements teaser · Vezi toate (button)',
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Sidebar help link "Ghid pentru studenți"
    await auditButton(
      page,
      'dashboard',
      'nav a:has-text("Ghid pentru studenți")',
      'Sidebar help · Ghid pentru studenți',
    );
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // "Începe" / "Continuă" on first evaluation card (this DOES navigate)
    const startBtnCount = await page
      .locator('#main-content button:has-text("Începe"), #main-content button:has-text("Continuă")')
      .count();
    if (startBtnCount > 0) {
      await auditButton(
        page,
        'dashboard',
        '#main-content button:has-text("Începe"), #main-content button:has-text("Continuă")',
        'Evaluation card · Începe / Continuă',
      );
    }
  });

  // SKIP: presupune butonul „Începe" pe homepage student care a fost mutat post-Acasă-Lifecycle.
  test.skip('Evaluation form — flow, likert, navigation, autosave UI', async ({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push({ page: 'evaluation', text: msg.text() });
    });
    page.on('response', (resp) => {
      if (resp.status() >= 400 && resp.url().includes('localhost')) {
        networkErrors.push({ page: 'evaluation', url: resp.url(), status: resp.status() });
      }
    });

    await loginAsStudent(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const startBtn = page
      .locator('#main-content button:has-text("Începe"), #main-content button:has-text("Continuă")')
      .first();
    await expect(startBtn).toBeVisible();
    await startBtn.click();
    await page.waitForURL(/\/evaluation\/\d+/, { timeout: 10000 });

    // Question card visible
    await expect(page.locator('#main-content h1').first()).toBeVisible({ timeout: 5000 });

    // 5 likert radios
    const radios = page.locator('button[role="radio"]');
    await expect(radios).toHaveCount(5);

    // Select option 4
    await radios.nth(3).click();
    await page.waitForTimeout(300);
    await expect(radios.nth(3)).toHaveAttribute('aria-checked', 'true');

    // Continue enabled
    const continueBtn = page.locator('button:has-text("Continuă")').first();
    await expect(continueBtn).toBeEnabled();

    // Audit buttons on evaluation page
    await auditButton(
      page,
      'evaluation',
      'button:has-text("Înapoi la evaluări"), a:has-text("Înapoi la evaluări")',
      'Evaluation · Înapoi la evaluări',
    );

    // Reopen if navigated
    if (!page.url().includes('/evaluation/')) {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.locator('#main-content button:has-text("Începe"), #main-content button:has-text("Continuă")').first().click();
      await page.waitForURL(/\/evaluation\/\d+/);
    }

    // Salvează și ieși
    await auditButton(page, 'evaluation', 'button:has-text("Salvează și ieși")', 'Evaluation · Salvează și ieși');
    if (!page.url().includes('/evaluation/')) {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      await page.locator('#main-content button:has-text("Începe"), #main-content button:has-text("Continuă")').first().click();
      await page.waitForURL(/\/evaluation\/\d+/);
    }

    // Select something first so dot navigator works
    await page.locator('button[role="radio"]').nth(2).click();
    await page.waitForTimeout(200);

    const dots = page.locator('[aria-label*="Mergi la întrebarea"]');
    const dotCount = await dots.count();
    if (dotCount >= 3) {
      await auditButton(
        page,
        'evaluation',
        '[aria-label*="Mergi la întrebarea 3"]',
        'Dot navigator · jump to Q3',
      );
    }

    // Make sure we're on a question with an answer
    await page.locator('button[role="radio"]').nth(2).click();
    await page.waitForTimeout(200);

    // Continue button
    await auditButton(
      page,
      'evaluation',
      'button:has-text("Continuă"):not([disabled])',
      'Evaluation · Continuă',
    );
    // Back button
    await auditButton(
      page,
      'evaluation',
      'button:has-text("Înapoi"):not([disabled]):not(:has-text("la evaluări"))',
      'Evaluation · Înapoi',
    );
  });

  // SKIP: depende de Evaluation form test (skipped). Acoperire keyboard a11y prin t6-a11y-keyboard.spec.ts.
  test.skip('Likert keyboard a11y — arrow, space, digit keys', async ({ page }) => {
    await loginAsStudent(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.locator('#main-content button:has-text("Începe"), #main-content button:has-text("Continuă")').first().click();
    await page.waitForURL(/\/evaluation\/\d+/);

    const radios = page.locator('button[role="radio"]');
    await radios.nth(2).focus();
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(150);
    await expect(radios.nth(3)).toBeFocused();
    await page.keyboard.press('Space');
    await page.waitForTimeout(150);
    await expect(radios.nth(3)).toHaveAttribute('aria-checked', 'true');

    await page.keyboard.press('1');
    await page.waitForTimeout(150);
    await expect(radios.nth(0)).toHaveAttribute('aria-checked', 'true');
  });
});
