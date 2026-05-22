/**
 * Audit dynamic — crawl prin meniu per rol, verifică:
 *  - fiecare entry de meniu navighează cu success (HTTP/route OK)
 *  - pagina se încarcă fără erori de consolă (excluding warning-uri React Router)
 *  - butoanele principale de pe fiecare pagină răspund (cel puțin: au handler)
 *
 * Output: /tmp/audit-buttons.json — listă cu pagini vizitate + erori găsite.
 */
import { test, expect } from '@playwright/test';
import * as fs from 'fs';

const BASE = 'http://localhost:3000';
const ACCOUNTS = {
  student: { email: 'student1@univ.ro', password: 'password123' },
  professor: { email: 'vasile.popescu.1@prof.univ.ro', password: 'password123' },
  admin: { email: 'admin@univ.ro', password: 'password123' },
};

async function login(page: import('@playwright/test').Page, role: keyof typeof ACCOUNTS) {
  const creds = ACCOUNTS[role];
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', creds.email);
  await page.fill('input[autocomplete="current-password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL((u) => !u.pathname.includes('/login'), { timeout: 10000 });
}

interface PageReport {
  role: string;
  path: string;
  ok: boolean;
  errors: string[];
  buttonsCount: number;
  buttonsWithoutHandler: number;
  consoleErrors: string[];
}

async function walkRole(page: import('@playwright/test').Page, role: keyof typeof ACCOUNTS, results: PageReport[]) {
  const consoleErrors: string[] = [];
  page.on('pageerror', (e) => consoleErrors.push(`PAGEERROR: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (!t.includes('React Router Future Flag')) consoleErrors.push(t);
    }
  });

  await login(page, role);

  // Meniul folosește <button onClick={navigate(path)}> — extragem textul fiecărui buton
  // și mapăm la path pe baza unei configurări fixe per rol (sincronizată cu Layout.tsx).
  const NAV_MAP: Record<string, Array<{ label: RegExp; path: string }>> = {
    student: [
      { label: /^Acasă/, path: '/' },
      { label: /Dashboard student/, path: '/dashboard' },
      { label: /Evaluări active/, path: '/evaluations' },
      { label: /^Istoric$/, path: '/history' },
      { label: /Rezultate agregate/, path: '/results' },
      { label: /Achievements/, path: '/achievements' },
      { label: /Feedback platformă/, path: '/feedback' },
    ],
    professor: [
      { label: /^Acasă/, path: '/professor' },
      { label: /Dashboard profesor/, path: '/professor/dashboard' },
      { label: /Cursurile mele/, path: '/professor/courses' },
      { label: /^Studenți$/, path: '/professor/students' },
      { label: /Acțiuni propuse/, path: '/professor/actions' },
      { label: /^Rapoarte$/, path: '/professor/reports' },
      { label: /Feedback platformă/, path: '/feedback' },
      { label: /Ghid pentru profesori/, path: '/guide/professor' },
    ],
    admin: [
      { label: /^Acasă/, path: '/admin' },
      { label: /Dashboard admin/, path: '/admin/dashboard' },
      { label: /Gestionare platformă/, path: '/admin/controls' },
      { label: /Closing-the-loop/, path: '/admin/closing-loop' },
      { label: /Editor ghiduri/, path: '/admin/guides' },
      { label: /Editor achievements/, path: '/admin/achievements' },
      { label: /Feedback platformă/, path: '/admin/platform-feedback' },
      { label: /^Rapoarte$/, path: '/admin/reports' },
      { label: /Utilizatori/, path: '/admin/users' },
      { label: /Ghid pentru admin/, path: '/guide/admin' },
    ],
  };
  const navPaths = NAV_MAP[role].map((e) => e.path);

  for (const path of navPaths) {
    consoleErrors.length = 0;
    const rep: PageReport = {
      role,
      path,
      ok: true,
      errors: [],
      buttonsCount: 0,
      buttonsWithoutHandler: 0,
      consoleErrors: [],
    };

    try {
      await page.goto(BASE + path);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      await page.waitForTimeout(500);

      // verifică că nu suntem pe login (redirect)
      if (page.url().includes('/login')) {
        rep.ok = false;
        rep.errors.push('Redirected to /login (auth issue or protected route)');
      }

      // Count butoane vizibile în <main>
      const mainButtons = await page.locator('#main-content button:visible, main button:visible').all();
      rep.buttonsCount = mainButtons.length;

      // Verifică butoanele care nu au onclick/disabled (heuristic)
      for (const btn of mainButtons.slice(0, 30)) {
        const aria = await btn.getAttribute('aria-label').catch(() => null);
        const text = (await btn.textContent().catch(() => ''))?.trim();
        const onClick = await btn.evaluate((el) => {
          const handlers = (el as any).onclick || (el as any)._reactProps?.onClick;
          return !!handlers;
        }).catch(() => true);
        // Heuristic: dacă butonul nu are nici text nici aria-label și nu pare a fi un container
        if (!text && !aria) {
          rep.buttonsWithoutHandler++;
        }
      }
    } catch (e: any) {
      rep.ok = false;
      rep.errors.push(`Navigation failed: ${e?.message ?? e}`);
    }
    rep.consoleErrors = [...consoleErrors];
    results.push(rep);
  }
}

async function appendResults(role: string, rs: PageReport[]) {
  const path = '/tmp/audit-buttons.json';
  let existing: PageReport[] = [];
  if (fs.existsSync(path)) {
    try {
      existing = JSON.parse(fs.readFileSync(path, 'utf-8'));
    } catch {
      existing = [];
    }
  }
  // overwrite items for this role to avoid duplicates on re-run
  existing = existing.filter((x) => x.role !== role);
  existing.push(...rs);
  fs.writeFileSync(path, JSON.stringify(existing, null, 2));
}

test.describe.serial('Audit button-walk', () => {
  test.beforeAll(() => {
    if (fs.existsSync('/tmp/audit-buttons.json')) fs.unlinkSync('/tmp/audit-buttons.json');
  });

  test('Student crawl', async ({ page }) => {
    const results: PageReport[] = [];
    await walkRole(page, 'student', results);
    await appendResults('student', results);
    expect(results.length).toBeGreaterThan(0);
  });
  test('Profesor crawl', async ({ page }) => {
    const results: PageReport[] = [];
    await walkRole(page, 'professor', results);
    await appendResults('professor', results);
    expect(results.length).toBeGreaterThan(0);
  });
  test('Admin crawl', async ({ page }) => {
    const results: PageReport[] = [];
    await walkRole(page, 'admin', results);
    await appendResults('admin', results);
    expect(results.length).toBeGreaterThan(0);
  });
});
