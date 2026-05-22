import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function setPlatformActive(active: boolean) {
  // login ca admin direct prin API
  const loginResp = await fetch('http://localhost:5001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@univ.ro', password: 'password123' }),
  });
  const { token } = await loginResp.json();
  const resp = await fetch('http://localhost:5001/api/platform/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ is_active: active }),
  });
  if (!resp.ok) throw new Error(`PUT settings failed: ${resp.status}`);
}

test.describe.serial('Login page reflects platform close status', () => {
  test('Platform închisă → cardul de timer arată „Platformă închisă"', async ({ page }) => {
    await setPlatformActive(false);
    await page.goto(BASE + '/login');
    await page.waitForLoadState('networkidle');
    // așteaptă fetch /public-stats
    await expect(page.locator('text=/Platform[ăa] [ÎIi]nchis[ăa]/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Termenul-limit.*a trecut/i').first()).toBeVisible();
    await page.screenshot({ path: '/tmp/v5-login-closed.png', fullPage: false });
  });

  test('Platform deschisă → cardul arată „Timp rămas pentru evaluări"', async ({ page }) => {
    await setPlatformActive(true);
    await page.goto(BASE + '/login');
    await page.waitForLoadState('networkidle');
    // așteaptă fetch /public-stats
    await page.waitForTimeout(800);
    // NU trebuie să apară „Platformă închisă" pe card
    const closedOnCard = await page
      .locator('text=/Platform[ăa] [ÎIi]nchis[ăa]/i')
      .count();
    expect(closedOnCard).toBe(0);
    await page.screenshot({ path: '/tmp/v5-login-open.png', fullPage: false });
  });
});
