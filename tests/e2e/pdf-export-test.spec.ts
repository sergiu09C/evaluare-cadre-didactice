import { test, expect } from '@playwright/test';

const URL = 'http://localhost:3000';

async function login(page: any, email: string) {
  await page.goto(URL + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
}

test('PDF button on AdminReports — verify it triggers print', async ({ page }) => {
  await login(page, 'admin@univ.ro');
  await page.goto(URL + '/admin/reports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // Verific că butonul există
  const btn = page.getByRole('button', { name: /Export PDF/i });
  await expect(btn).toBeVisible();

  // Monitorizez crearea de iframe
  const iframeCreated = page.evaluate(() => {
    return new Promise<boolean>((resolve) => {
      const observer = new MutationObserver(() => {
        const iframes = document.querySelectorAll('iframe');
        if (iframes.length > 0) {
          observer.disconnect();
          resolve(true);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => { observer.disconnect(); resolve(false); }, 5000);
    });
  });

  await btn.click();
  const created = await iframeCreated;
  console.log('Iframe creat după click:', created);
  await page.waitForTimeout(1500);

  // Verific orice eroare console
  const errors = await page.evaluate(() => (window as any).__lastErrors || []);
  console.log('Errors:', errors);
});
