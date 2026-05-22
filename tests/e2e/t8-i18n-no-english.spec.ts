import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3000';

/**
 * Scanează DOM-ul pentru texte vizibile care conțin cuvinte englezești tipice.
 * Whitelist: termeni acceptați (date format, brand names, etc.).
 */
const ENGLISH_PATTERNS = [
  /\bSubmit\b/,
  /\bLoading\.{0,3}\b/,
  /\bError\b/,
  /\bCancel\b/,
  /\bSave\b(?! the date)/,
  /\bDelete\b/,
  /\bEdit\b/,
  /\bClose\b/,
  /\bPlease\b/,
  /\bSearch\b/,
];

const WHITELIST_SUBSTRINGS = [
  'JWT',
  'CSV',
  'PDF',
  'ARACIS',
  'CEAC',
  'GDPR',
  'FAIMA',
  'UNSTPB',
  'API',
  'localhost',
  'closing-loop',
  'closing-the-loop',
  // Date dropdowns folosesc luna în engleză „short" — Recharts intern
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

async function scanPageForEnglish(page: any): Promise<string[]> {
  const text = await page.evaluate(() => document.body.innerText || '');
  const lines = text.split('\n').map((l: string) => l.trim()).filter(Boolean);
  const offenders: string[] = [];
  for (const line of lines) {
    if (WHITELIST_SUBSTRINGS.some((w) => line.includes(w))) continue;
    for (const re of ENGLISH_PATTERNS) {
      if (re.test(line)) {
        offenders.push(line);
        break;
      }
    }
  }
  return offenders;
}

const TEST_PAGES = [
  { name: 'student-home', email: 'student1@univ.ro', path: '/' },
  { name: 'student-feedback', email: 'student1@univ.ro', path: '/feedback' },
  { name: 'professor-home', email: 'vasile.popescu.1@prof.univ.ro', path: '/professor' },
  { name: 'admin-users', email: 'admin@univ.ro', path: '/admin/users' },
  { name: 'admin-action-templates', email: 'admin@univ.ro', path: '/admin/action-templates' },
];

for (const p of TEST_PAGES) {
  test(`T8 — Fără texte engleze user-facing pe ${p.name}`, async ({ page }) => {
    await login(page, p.email);
    await page.goto(BASE + p.path);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    const offenders = await scanPageForEnglish(page);
    if (offenders.length > 0) {
      console.log(`[${p.name}] ${offenders.length} texte EN suspecte:`);
      for (const o of offenders.slice(0, 10)) console.log('  •', o.substring(0, 200));
    }
    expect(offenders, `texte EN pe ${p.name}`).toEqual([]);
  });
}
