import { test, expect } from '@playwright/test';
const BASE = 'http://localhost:3000';
async function login(page: any, email: string) {
  await page.goto(BASE + '/login');
  await page.fill('input[autocomplete="email"]', email);
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'), { timeout: 10000 });
  await page.waitForTimeout(500);
}

test('PF colaps + expand', async ({ page, context }) => {
  await login(page, 'student1@univ.ro');
  // Trimit feedback prin API folosind cookie/storage din pagina autentificată
  const result = await page.evaluate(async () => {
    const tok = localStorage.getItem('token');
    const qr = await fetch('/api/platform-feedback/questions', { headers: { Authorization: 'Bearer ' + tok } });
    const qd = await qr.json();
    if (!qd.questions) return { err: 'no questions', qd };
    const payload = qd.questions.map((q: any) => ({
      questionId: q.id,
      likert: q.type === 'likert' ? 4 : undefined,
      text: q.type === 'text' ? 'feedback automat de test' : undefined,
      choice: q.type === 'choice' && q.options && q.options.length ? q.options[0] : undefined,
    }));
    const sr = await fetch('/api/platform-feedback/submit', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + tok, 'Content-Type': 'application/json' },
      body: JSON.stringify({ responses: payload }),
    });
    return { qcount: qd.questions.length, submitOk: sr.ok };
  });
  console.log('submit result:', JSON.stringify(result));
  
  await page.goto(BASE + '/feedback');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/snap-pf-collapsed-final.png', fullPage: true });
  
  await expect(page.getByText(/Ai trimis deja/i)).toBeVisible();
  
  await page.getByRole('button', { name: /Trimite o evaluare nouă/i }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/snap-pf-expanded-final.png', fullPage: true });
});
