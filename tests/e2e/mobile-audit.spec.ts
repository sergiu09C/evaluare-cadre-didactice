/**
 * Mobile audit @mobile — rulează doar pe proiectul „mobile-chrome" (iPhone 13 viewport 390×844).
 * Capturează screenshots pe paginile cheie pentru audit manual de UX mobile.
 */
import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

async function login(page: import('@playwright/test').Page, email: string, password: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 15000 });
}

test('@mobile Login page pe iPhone 13', async ({ page }) => {
  await page.goto(BASE + '/login');
  await page.waitForLoadState('networkidle');
  await expect(page.locator('input[autocomplete="email"]')).toBeVisible();
  await page.screenshot({ path: '/tmp/mobile-login.png', fullPage: true });
});

test('@mobile Acasă student tab Sumar pe iPhone 13', async ({ page }) => {
  await login(page, 'student1@univ.ro', 'password123');
  await page.goto(BASE + '/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/mobile-acasa-sumar.png', fullPage: true });
});

test('@mobile Acasă tab Explorează pe iPhone 13', async ({ page }) => {
  await login(page, 'student1@univ.ro', 'password123');
  await page.goto(BASE + '/?tab=explore');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/mobile-acasa-explore.png', fullPage: true });
});

test('@mobile Acasă tab Trend pe iPhone 13', async ({ page }) => {
  await login(page, 'student1@univ.ro', 'password123');
  await page.goto(BASE + '/?tab=trend');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/mobile-acasa-trend.png', fullPage: true });
});

test('@mobile Active evaluations', async ({ page }) => {
  await login(page, 'student1@univ.ro', 'password123');
  await page.goto(BASE + '/evaluations');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/mobile-evaluations.png', fullPage: true });
});

test('@mobile Feedback platformă', async ({ page }) => {
  await login(page, 'student1@univ.ro', 'password123');
  await page.goto(BASE + '/feedback');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/mobile-feedback.png', fullPage: true });
});
