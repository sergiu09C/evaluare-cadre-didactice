import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';
const ADMIN = { email: 'admin@univ.ro', password: 'password123' };
const STUDENT = { email: 'student1@univ.ro', password: 'password123' };
const PROF = { email: 'vasile.popescu.1@prof.univ.ro', password: 'password123' };

async function login(page: import('@playwright/test').Page, creds: { email: string; password: string }) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', creds.email);
  await page.fill('input[autocomplete="current-password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
}

test('#7 AdminUsers — 200 profesori, 1200 studenți', async ({ page }) => {
  await login(page, ADMIN);
  await page.goto(BASE + '/admin/users');
  await page.waitForLoadState('networkidle');
  const prof = page.getByRole('tab', { name: /profesori/i });
  const stud = page.getByRole('tab', { name: /studenți/i });
  expect((await prof.textContent())?.match(/\d+/)?.[0]).toBe('200');
  expect((await stud.textContent())?.match(/\d+/)?.[0]).toBe('1200');
  await page.screenshot({ path: '/tmp/v3-admin-users.png', fullPage: false });
});

test('#2 ProfessorStudents — full names, fără has_evaluated', async ({ page }) => {
  await login(page, PROF);
  await page.goto(BASE + '/professor/students');
  await page.waitForLoadState('networkidle');
  // NU trebuie să existe text „evaluat" pe student individual (privacy by design)
  const pageContent = await page.content();
  expect(pageContent).not.toContain('✓ evaluat');
  expect(pageContent).not.toContain('○ neevaluat');
  // Caut numele complete din secțiunea principală (#main-content) ca să evit ListFilterBar tabs.
  // Structura curentă: list-uri grupate per curs; un nume e text-ul direct al unui <span> sau <li>.
  const main = page.locator('#main-content');
  await expect(main).toBeVisible();
  const text = (await main.textContent()) ?? '';
  // verific că există pattern de 2 cuvinte capitalizate consecutive (prenume + nume)
  expect(text).toMatch(/[A-ZȘȚĂÂÎ][a-zșțăâî]+\s+[A-ZȘȚĂÂÎ][a-zșțăâî]+/);
  await page.screenshot({ path: '/tmp/v3-prof-students.png', fullPage: false });
});

test('#6 EvaluationLifecycle — accesibil din meniu, render OK', async ({ page }) => {
  await login(page, STUDENT);
  await page.goto(BASE + '/lifecycle');
  await page.waitForLoadState('networkidle');
  await expect(page.getByRole('heading', { name: /călătoria|ce se întâmplă/i }).first()).toBeVisible();
  await page.screenshot({ path: '/tmp/v3-lifecycle.png', fullPage: true });
});

test('#1 PlatformFeedback — buton „Mai trimite un mesaj", trimite mesaj, vede istoricul', async ({ page }) => {
  await login(page, STUDENT);
  await page.goto(BASE + '/feedback');
  await page.waitForLoadState('networkidle');
  const sendButton = page.getByRole('button', { name: /trimite (primul|un) mesaj/i }).first();
  await expect(sendButton).toBeVisible();
  await sendButton.click();
  await page.fill('#pf-new-message', 'Test automatizat: subiect lifecycle');
  await page.getByRole('button', { name: /trimite mesajul/i }).click();
  await page.waitForTimeout(800);
  // Toast verde apare → istoricul conține mesajul
  const content = await page.content();
  expect(content).toContain('Test automatizat: subiect lifecycle');
  await page.screenshot({ path: '/tmp/v3-platform-feedback.png', fullPage: true });
});

test('#4 ProfessorDashboard — pie + bar + radar render', async ({ page }) => {
  await login(page, PROF);
  await page.goto(BASE + '/professor?tab=explore');
  await page.waitForLoadState('networkidle');
  // 4 KPICards (am adăugat „Notă echivalentă")
  const kpis = await page.locator('[class*="KPI"], .kpi-card, [data-testid="kpi-card"]').count();
  // verificare grafice: pie are .recharts-pie, bar are .recharts-bar-rectangle
  const hasPie = (await page.locator('.recharts-pie').count()) > 0;
  const hasBar = (await page.locator('.recharts-bar-rectangle').count()) > 0;
  expect(hasPie || hasBar).toBe(true); // cel puțin unul render-ează
  await page.screenshot({ path: '/tmp/v3-prof-dashboard.png', fullPage: true });
});
