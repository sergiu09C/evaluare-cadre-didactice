import { test, expect } from '@playwright/test';

test('Admin panel — diagnose blank page', async ({ page }) => {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const networkErrors: { url: string; status: number; body?: string }[] = [];

  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('response', async (resp) => {
    if (resp.status() >= 400 && resp.url().includes('localhost')) {
      networkErrors.push({ url: resp.url(), status: resp.status() });
    }
  });

  // Login as admin
  await page.goto('/login');
  await page.fill('input[autocomplete="email"]', 'admin@univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  // Snapshot admin dashboard
  const dashHTML = await page.content();
  const dashLen = dashHTML.length;
  console.log('AdminDashboard HTML length:', dashLen);

  // Now navigate to admin controls (the reported blank page)
  await page.goto('/admin/controls');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  const controlsHTML = await page.content();
  const visibleText = await page.locator('body').innerText();

  console.log('\n=== /admin/controls inner text length:', visibleText.length, '===');
  console.log(visibleText.slice(0, 1000));

  console.log('\n=== Console errors ===');
  consoleErrors.forEach((e) => console.log('  ✗', e.slice(0, 300)));

  console.log('\n=== Page errors (uncaught) ===');
  pageErrors.forEach((e) => console.log('  ✗', e.slice(0, 300)));

  console.log('\n=== Network errors >=400 ===');
  networkErrors.forEach((e) => console.log('  ✗', e.status, e.url));

  // Save HTML for inspection
  const fs = require('fs');
  fs.writeFileSync('/tmp/admin-controls.html', controlsHTML);
  console.log('\nSaved HTML to /tmp/admin-controls.html');
});
