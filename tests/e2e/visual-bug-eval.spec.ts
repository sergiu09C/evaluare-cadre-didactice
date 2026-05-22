import { test } from '@playwright/test';

const STUDENT = { email: 'student1@univ.ro', password: 'password123' };

test('Visual: question text overlap with sticky header', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[autocomplete="email"]', STUDENT.email);
  await page.fill('input[autocomplete="current-password"]', STUDENT.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/', { timeout: 10000 });
  await page.waitForLoadState('networkidle');

  // Open first evaluation
  const startBtn = page
    .locator('#main-content button:has-text("Începe"), #main-content button:has-text("Continuă")')
    .first();
  await startBtn.click();
  await page.waitForURL(/\/evaluation\/\d+/);
  await page.waitForLoadState('networkidle');

  // Measure header bottom and question h1 top
  const header = page.locator('header').last(); // EvaluationForm header
  const question = page.locator('#main-content h1').last();

  const headerBox = await header.boundingBox();
  const questionBox = await question.boundingBox();

  console.log('Header box:', headerBox);
  console.log('Question h1 box:', questionBox);

  if (headerBox && questionBox) {
    const overlap = questionBox.y < headerBox.y + headerBox.height;
    console.log(`Header bottom: ${headerBox.y + headerBox.height}`);
    console.log(`Question top:  ${questionBox.y}`);
    console.log(`OVERLAP (question under header)? ${overlap}`);

    // Take screenshot for visual verification
    await page.screenshot({ path: '/tmp/eval-bug.png', fullPage: false });
    console.log('Screenshot saved to /tmp/eval-bug.png');

    // Scroll a bit to expose overlap if it appears at scroll
    await page.evaluate(() => document.querySelector('#main-content')?.scrollBy(0, 100));
    await page.waitForTimeout(300);
    const questionBox2 = await question.boundingBox();
    const headerBox2 = await header.boundingBox();
    console.log('\nAfter scroll 100px:');
    console.log('Header bottom:', headerBox2 && headerBox2.y + headerBox2.height);
    console.log('Question top: ', questionBox2 && questionBox2.y);
    const overlap2 = questionBox2 && headerBox2 && questionBox2.y < headerBox2.y + headerBox2.height;
    console.log('OVERLAP after scroll?', overlap2);

    await page.screenshot({ path: '/tmp/eval-bug-scrolled.png', fullPage: false });
  }
});
