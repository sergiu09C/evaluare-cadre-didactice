import { test } from '@playwright/test';
const URL = 'http://localhost:3000';

test('PDF iframe contains content', async ({ page }) => {
  await page.goto(URL + '/login');
  await page.fill('input[autocomplete="email"]', 'admin@univ.ro');
  await page.fill('input[autocomplete="current-password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL((u: URL) => !u.pathname.includes('/login'));
  await page.goto(URL + '/admin/reports');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  // intercept window.print să nu blocheze
  await page.evaluate(() => {
    (window as any).__printCalled = false;
    const origPrint = window.print;
    window.print = function() { (window as any).__printCalled = true; };
    // și pentru iframe-urile create
    const origAttachIframe = HTMLIFrameElement.prototype.contentWindow;
    Object.defineProperty(HTMLIFrameElement.prototype, 'contentWindow', {
      get() {
        const cw = origAttachIframe?.call(this);
        if (cw && cw.print) cw.print = () => { (window as any).__printCalled = true; };
        return cw;
      }
    });
  });

  await page.getByRole('button', { name: /Export PDF/i }).click();
  await page.waitForTimeout(3000);

  const iframeContent = await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    if (!iframe) return { exists: false };
    return {
      exists: true,
      src: iframe.src,
      hasContent: iframe.contentDocument?.body?.innerHTML?.length || 0,
      title: iframe.contentDocument?.title || '',
    };
  });
  console.log('Iframe:', JSON.stringify(iframeContent));
});
