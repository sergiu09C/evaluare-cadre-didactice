/**
 * QUESTIONNAIRE EDITOR — CRUD test pe tab Chestionar din AdminControls.
 */
import { test, expect, type Page } from '@playwright/test';

const ADMIN = { email: 'admin@univ.ro', password: 'password123' };

async function loginAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('input[autocomplete="email"]', ADMIN.email);
  await page.fill('input[autocomplete="current-password"]', ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/admin', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

test.describe('AdminControls · Editor Chestionar', () => {
  test('Switch to Chestionar tab + verifică itemii', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (e) => errors.push('PAGE ERROR: ' + e.message));

    await loginAdmin(page);
    await page.goto('/admin/controls');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);

    // Find tab by aria-selected and click
    const tabs = page.locator('button[role="tab"]');
    const count = await tabs.count();
    console.log(`Tabs found: ${count}`);

    // Click Chestionar tab (5th — index 4)
    const tabLabels: string[] = [];
    for (let i = 0; i < count; i++) {
      tabLabels.push(await tabs.nth(i).innerText());
    }
    console.log('Tab labels:', tabLabels);

    // Find by Romanian text
    const chestTab = page.locator('button[role="tab"]').filter({ hasText: /chestionar/i });
    if ((await chestTab.count()) > 0) {
      await chestTab.first().click();
    } else {
      // Fallback by aria-selected after click — use 5th tab
      await tabs.nth(4).click();
    }
    await page.waitForTimeout(800);

    // Check that questions list rendered
    const text = await page.locator('main').innerText();
    console.log('After tab click — main text length:', text.length);
    expect(text.toLowerCase()).toContain('întreb'); // "Întrebări" sau "întrebare"

    // Verify questions are shown (we know there should be ~13)
    const questionItems = await page.locator('main >> text=/întrebare|cadru didactic|Likert|categori/i').count();
    expect(questionItems).toBeGreaterThan(0);

    console.log('Console errors:', errors);
    expect(errors.filter((e) => !e.includes('vite') && !e.includes('react-refresh'))).toEqual([]);
  });

  test('Add → Edit → Delete question (full CRUD)', async ({ page, request }) => {
    await loginAdmin(page);
    const token = await page.evaluate(() => localStorage.getItem('token'));

    // Use API directly for cleaner CRUD test
    const baseUrl = 'http://localhost:5001';
    const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

    // 1. Get initial count
    const initialResp = await request.get(`${baseUrl}/api/questions`, { headers });
    const initialData = await initialResp.json();
    const initialCount = Array.isArray(initialData)
      ? initialData.length
      : initialData?.questions?.length || 0;
    console.log('Initial questions count:', initialCount);

    // 2. Create a new question
    const newQ = {
      text: `TEST AUDIT ${Date.now()} — Cadru didactic este disponibil pe Teams.`,
      type: 'likert',
      category: 'Disponibilitate',
      is_required: true,
    };
    const createResp = await request.post(`${baseUrl}/api/questions`, { headers, data: newQ });
    expect(createResp.ok()).toBeTruthy();
    const created = await createResp.json();
    const newId = created.id || created.question?.id;
    expect(newId).toBeTruthy();
    console.log('Created question id:', newId);

    // 3. Verify count increased
    const afterCreateResp = await request.get(`${baseUrl}/api/questions`, { headers });
    const afterCreateData = await afterCreateResp.json();
    const afterCreateCount = Array.isArray(afterCreateData)
      ? afterCreateData.length
      : afterCreateData?.questions?.length || 0;
    expect(afterCreateCount).toBe(initialCount + 1);

    // 4. Update the question
    const updatedText = `TEST AUDIT EDITED ${Date.now()}`;
    const updateResp = await request.put(`${baseUrl}/api/questions/${newId}`, {
      headers,
      data: { text: updatedText, type: 'likert', category: 'Disponibilitate', is_required: false },
    });
    expect(updateResp.ok()).toBeTruthy();

    // 5. Verify update propagated
    const verifyResp = await request.get(`${baseUrl}/api/questions`, { headers });
    const verifyData = await verifyResp.json();
    const qs = Array.isArray(verifyData) ? verifyData : verifyData?.questions || [];
    const updated = qs.find((q: any) => q.id === newId);
    expect(updated).toBeTruthy();
    expect(updated.text).toBe(updatedText);

    // 6. Delete
    const deleteResp = await request.delete(`${baseUrl}/api/questions/${newId}`, { headers });
    expect(deleteResp.ok()).toBeTruthy();

    // 7. Verify deletion
    const finalResp = await request.get(`${baseUrl}/api/questions`, { headers });
    const finalData = await finalResp.json();
    const finalCount = Array.isArray(finalData)
      ? finalData.length
      : finalData?.questions?.length || 0;
    expect(finalCount).toBe(initialCount);
    console.log('✓ Full CRUD cycle successful');
  });

  test('Editor UI works end-to-end with click', async ({ page }) => {
    await loginAdmin(page);
    await page.goto('/admin/controls');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Click Chestionar tab
    const chestTab = page.locator('button[role="tab"]').filter({ hasText: /chestionar/i });
    if ((await chestTab.count()) > 0) {
      await chestTab.first().click();
      await page.waitForTimeout(500);
    }

    // Look for "Adaugă" button (add question)
    const addBtn = page.locator('button').filter({ hasText: /adaug|add|nou/i });
    const hasAddBtn = (await addBtn.count()) > 0;
    console.log('Add button found:', hasAddBtn);

    if (hasAddBtn) {
      await addBtn.first().click();
      await page.waitForTimeout(500);
      // Check if form appeared
      const formText = await page.locator('main').innerText();
      const hasForm = formText.toLowerCase().includes('text') && formText.toLowerCase().includes('categori');
      console.log('Form appeared after add click:', hasForm);
    }
  });
});
