import { test } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 });
}

test('Acasă profesor at-risk — Cristian Popescu (avg 2.02)', async ({ page }) => {
  await login(page, 'cristian.popescu.15@prof.univ.ro', 'password123');
  await page.goto(BASE + '/professor');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/seed-prof-atrisk-acasa.png', fullPage: true });
});

test('Acțiuni CEAC pentru profesorul at-risk', async ({ page }) => {
  await login(page, 'cristian.popescu.15@prof.univ.ro', 'password123');
  await page.goto(BASE + '/professor/actions');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/seed-prof-atrisk-actions.png', fullPage: true });
});

test('Admin Acasă cu noua distribuție', async ({ page }) => {
  await login(page, 'admin@univ.ro', 'password123');
  await page.goto(BASE + '/admin?tab=explore');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/seed-admin-acasa-explore.png', fullPage: true });
});

test('Admin feedback platformă cu mesaje și statuse mixte', async ({ page }) => {
  await login(page, 'admin@univ.ro', 'password123');
  await page.goto(BASE + '/admin/platform-feedback');
  await page.waitForLoadState('networkidle');
  // Click pe tab Mesaje
  const messagesTab = page.getByRole('tab', { name: /Mesaje/i });
  if (await messagesTab.count() > 0) await messagesTab.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/seed-admin-feedback-msgs.png', fullPage: false });
});
