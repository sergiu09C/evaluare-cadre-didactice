import { test, expect } from '@playwright/test';
const BASE = 'http://localhost:3000';
async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('Profesor: click „Situația facultății mele" → URL conține facultyId', async ({ page }) => {
  await login(page, 'vasile.popescu.1@prof.univ.ro');
  await page.goto(BASE + '/professor');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);

  const btn = page.getByRole('button', { name: /Situația facultății mele/i });
  await expect(btn).toBeVisible();
  await btn.click();
  await page.waitForTimeout(500);
  const url = page.url();
  console.log('URL după click:', url);
  await expect(page).toHaveURL(/facultyId=\d+/);
  await page.screenshot({ path: '/tmp/snap-fix-fac-after.png', fullPage: true });
});
