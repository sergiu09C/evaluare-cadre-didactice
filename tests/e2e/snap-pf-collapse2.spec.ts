import { test, expect } from '@playwright/test';
const BASE = 'http://localhost:3000';
async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
}

test('PF: submit → reload → vezi card colaps cu CTA', async ({ page }) => {
  await login(page, 'student1@univ.ro');
  // forțează submission prin API
  const token = await page.evaluate(() => localStorage.getItem('token'));
  // întâi prind lista de întrebări
  const q = await page.evaluate(async (tok) => {
    const r = await fetch('/api/feedback/questions', { headers: { Authorization: 'Bearer ' + tok } });
    return r.json();
  }, token);
  // construiesc o trimitere completă
  const payload = q.questions.map((qq: any) => ({
    questionId: qq.id,
    likert: qq.type === 'likert' ? 4 : undefined,
    text: qq.type === 'text' ? 'feedback test' : undefined,
    choice: qq.type === 'choice' && qq.options.length ? qq.options[0] : undefined,
  }));
  await page.evaluate(async ({tok, p}) => {
    await fetch('/api/feedback/submit', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses: p }),
    });
  }, { tok: token, p: payload });

  await page.goto(BASE + '/feedback');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/snap-pf-collapsed-v2.png', fullPage: true });

  // verifică prezența textului
  await expect(page.getByText(/Ai trimis deja/i)).toBeVisible();
  
  // click pe „Trimite o evaluare nouă" → formularul apare
  await page.getByRole('button', { name: /Trimite o evaluare nouă/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/snap-pf-expanded.png', fullPage: true });
});
