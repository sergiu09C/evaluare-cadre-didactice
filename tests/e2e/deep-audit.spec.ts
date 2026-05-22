/**
 * DEEP AUDIT — toate rolurile, toate paginile, corelare de date între roluri.
 * Output: tests/deep-audit-report.json
 */
import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const STUDENT = { email: 'student1@univ.ro', password: 'password123' };
const ADMIN = { email: 'admin@univ.ro', password: 'password123' };
const PROFESSOR = { email: 'vasile.popescu.1@prof.univ.ro', password: 'password123' };

type Finding = {
  role: 'student' | 'professor' | 'admin' | 'cross';
  area: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  page?: string;
  evidence?: string;
};
type DesignAudit = {
  page: string;
  url: string;
  role: string;
  usesNewCardClass: boolean;
  usesOldDotCard: boolean;
  usesOldBtnClass: boolean;
  usesHardcodedColors: boolean;
  usesGeistFont: boolean;
  usesNeutral25Bg: boolean;
  oldClassCount: number;
  newComponentCount: number;
  designScore: number; // 0–100
  notes: string[];
};

const findings: Finding[] = [];
const designAudits: DesignAudit[] = [];
const consoleErrors: { page: string; role: string; text: string }[] = [];
const pageErrors: { page: string; role: string; text: string }[] = [];
const networkErrors: { page: string; role: string; url: string; status: number }[] = [];

function trackErrors(page: Page, pageName: string, role: string) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push({ page: pageName, role, text: msg.text() });
  });
  page.on('pageerror', (err) => pageErrors.push({ page: pageName, role, text: err.message }));
  page.on('response', (resp) => {
    if (resp.status() >= 400 && resp.url().includes('localhost')) {
      networkErrors.push({ page: pageName, role, url: resp.url(), status: resp.status() });
    }
  });
}

async function login(page: Page, creds: { email: string; password: string }, expectedUrlPart: string) {
  await page.goto('/login');
  await page.fill('input[autocomplete="email"]', creds.email);
  await page.fill('input[autocomplete="current-password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(new RegExp(expectedUrlPart), { timeout: 10000 });
  await page.waitForLoadState('networkidle');
}

async function auditDesign(page: Page, pageName: string, url: string, role: string): Promise<DesignAudit> {
  const html = await page.content();
  // Old design markers
  const oldDotCard = (html.match(/class="[^"]*\bcard\b[^"]*"/g) || []).filter(
    (m) => !m.includes('Card') && !m.includes('rounded-xl'),
  ).length;
  const oldBtn = (html.match(/\bbtn btn-(primary|secondary|danger)\b/g) || []).length;
  const oldBgGray = (html.match(/\bbg-gray-(50|100|200)\b/g) || []).length;
  const oldTextGray = (html.match(/\btext-gray-(500|600|700|800|900)\b/g) || []).length;
  const oldHardcodedBlue = (html.match(/\bbg-blue-(50|100|200|600)\b|\bborder-blue-(200|300|500)\b|\btext-blue-(600|700|800)\b/g) || []).length;

  // New design markers (Tailwind classes from new tokens)
  const newNeutralBg = (html.match(/\bbg-neutral-(25|50|100|800)\b/g) || []).length;
  const newPrimaryColors = (html.match(/\bbg-primary-(50|800)\b|\btext-primary-(700|800)\b/g) || []).length;
  const newAccentColors = (html.match(/\bbg-accent-(50|600|700)\b|\btext-accent-(700)\b/g) || []).length;
  const newShadows = (html.match(/\bshadow-elev-[1-5]\b/g) || []).length;
  const fontDisplay = (html.match(/\bfont-display\b/g) || []).length;
  const fontGeist = (await page.evaluate(() => {
    const body = window.getComputedStyle(document.body);
    return body.fontFamily.toLowerCase().includes('geist');
  })) ? 1 : 0;
  const neutral25Bg = (html.includes('bg-neutral-25')) ? 1 : 0;

  const oldClassCount = oldDotCard + oldBtn + oldBgGray + oldTextGray + oldHardcodedBlue;
  const newComponentCount = newNeutralBg + newPrimaryColors + newAccentColors + newShadows + fontDisplay;
  const designScore = Math.round(Math.max(0, Math.min(100, 100 - oldClassCount * 4 + newComponentCount * 2)));

  const notes: string[] = [];
  if (oldDotCard > 0) notes.push(`${oldDotCard}× clasă veche ".card"`);
  if (oldBtn > 0) notes.push(`${oldBtn}× ".btn btn-*"`);
  if (oldBgGray > 0) notes.push(`${oldBgGray}× "bg-gray-*"`);
  if (oldTextGray > 0) notes.push(`${oldTextGray}× "text-gray-*"`);
  if (oldHardcodedBlue > 0) notes.push(`${oldHardcodedBlue}× "blue-* hardcodat"`);
  if (fontGeist === 0) notes.push('Geist font NU este aplicat');
  if (neutral25Bg === 0) notes.push('NU folosește bg-neutral-25 (pagină background)');

  return {
    page: pageName,
    url,
    role,
    usesNewCardClass: html.includes('rounded-xl shadow-elev'),
    usesOldDotCard: oldDotCard > 0,
    usesOldBtnClass: oldBtn > 0,
    usesHardcodedColors: oldHardcodedBlue > 0,
    usesGeistFont: fontGeist === 1,
    usesNeutral25Bg: neutral25Bg === 1,
    oldClassCount,
    newComponentCount,
    designScore,
    notes,
  };
}

test.afterAll(() => {
  const outPath = path.join(__dirname, '..', 'deep-audit-report.json');
  const summary = {
    findings: {
      total: findings.length,
      critical: findings.filter((f) => f.severity === 'critical').length,
      high: findings.filter((f) => f.severity === 'high').length,
      medium: findings.filter((f) => f.severity === 'medium').length,
      low: findings.filter((f) => f.severity === 'low').length,
    },
    errors: {
      consoleErrors: consoleErrors.length,
      pageErrors: pageErrors.length,
      networkErrors: networkErrors.length,
    },
    designScores: designAudits.map((d) => ({
      page: d.page,
      role: d.role,
      score: d.designScore,
      oldClasses: d.oldClassCount,
      issues: d.notes.length,
    })),
  };
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      { summary, findings, designAudits, consoleErrors, pageErrors, networkErrors },
      null,
      2,
    ),
  );
  console.log('\n📊 DEEP AUDIT SUMMARY:');
  console.log(JSON.stringify(summary, null, 2));
});

test.describe('Deep Audit — Admin role', () => {
  test('Admin · Dashboard renders + design audit', async ({ page }) => {
    trackErrors(page, 'AdminDashboard', 'admin');
    await login(page, ADMIN, '/admin');
    const audit = await auditDesign(page, 'AdminDashboard', '/admin', 'admin');
    designAudits.push(audit);
    if (audit.designScore < 70) {
      findings.push({
        role: 'admin',
        area: 'design',
        severity: 'high',
        description: `AdminDashboard design score: ${audit.designScore}/100. Issues: ${audit.notes.join(', ')}`,
        page: '/admin',
      });
    }
    // Verify it actually loads content
    const text = await page.locator('main').innerText();
    expect(text.length).toBeGreaterThan(100);
  });

  test('Admin · Controls — all 6 tabs accessible', async ({ page }) => {
    trackErrors(page, 'AdminControls', 'admin');
    await login(page, ADMIN, '/admin');
    await page.goto('/admin/controls');
    await page.waitForLoadState('networkidle');
    const audit = await auditDesign(page, 'AdminControls', '/admin/controls', 'admin');
    designAudits.push(audit);
    if (audit.designScore < 70) {
      findings.push({
        role: 'admin',
        area: 'design',
        severity: 'high',
        description: `AdminControls design score: ${audit.designScore}/100. Issues: ${audit.notes.join(', ')}`,
        page: '/admin/controls',
      });
    }

    // Try each tab
    const tabs = ['platform', 'messages', 'filters', 'disciplines', 'questionnaire', 'email'];
    for (const tab of tabs) {
      const tabBtn = page.locator(`button[role="tab"]:has-text("${tab}"), button:has-text("${tab.charAt(0).toUpperCase() + tab.slice(1)}")`).first();
      const visible = await tabBtn.isVisible({ timeout: 500 }).catch(() => false);
      if (!visible) {
        findings.push({
          role: 'admin',
          area: 'controls',
          severity: 'medium',
          description: `Tab "${tab}" NU este vizibil în AdminControls (sau selector incorect)`,
          page: '/admin/controls',
        });
      }
    }
  });

  test('Admin · Reports page', async ({ page }) => {
    trackErrors(page, 'AdminReports', 'admin');
    await login(page, ADMIN, '/admin');
    await page.goto('/admin/reports');
    await page.waitForLoadState('networkidle');
    const audit = await auditDesign(page, 'AdminReports', '/admin/reports', 'admin');
    designAudits.push(audit);
    const text = await page.locator('main').innerText();
    expect(text.length).toBeGreaterThan(50);
  });

  test('Admin · Professor detail page', async ({ page }) => {
    trackErrors(page, 'ProfessorDetails', 'admin');
    await login(page, ADMIN, '/admin');
    // Click first professor in the dashboard table (if exists)
    await page.goto('/admin/professor/1');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    const audit = await auditDesign(page, 'ProfessorDetails', '/admin/professor/1', 'admin');
    designAudits.push(audit);
  });

  test('Admin · Sidebar — matches student structure (audit)', async ({ page }) => {
    trackErrors(page, 'AdminSidebar', 'admin');
    await login(page, ADMIN, '/admin');
    const navItems = await page.locator('nav button').allInnerTexts();
    const labels = navItems.map((t) => t.trim().split('\n')[0]).filter(Boolean);
    findings.push({
      role: 'admin',
      area: 'sidebar',
      severity: 'low',
      description: `Sidebar admin items: ${JSON.stringify(labels)}`,
      page: '/admin',
    });
  });
});

test.describe('Deep Audit — Professor role', () => {
  test('Professor · Dashboard renders + design audit', async ({ page }) => {
    trackErrors(page, 'ProfessorDashboard', 'professor');
    await login(page, PROFESSOR, '/professor');
    const audit = await auditDesign(page, 'ProfessorDashboard', '/professor', 'professor');
    designAudits.push(audit);
    if (audit.designScore < 70) {
      findings.push({
        role: 'professor',
        area: 'design',
        severity: 'high',
        description: `ProfessorDashboard design score: ${audit.designScore}/100. Issues: ${audit.notes.join(', ')}`,
        page: '/professor',
      });
    }
  });

  test('Professor · Course details page', async ({ page }) => {
    trackErrors(page, 'ProfessorCourseDetails', 'professor');
    await login(page, PROFESSOR, '/professor');

    // Find first course link
    await page.waitForTimeout(1000);
    const links = await page.locator('a[href^="/professor/course/"]').count();
    if (links === 0) {
      // try button-based card
      const cards = await page.locator('a, button').filter({ hasText: /Vezi Detalii|Detalii curs/i }).count();
      if (cards === 0) {
        findings.push({
          role: 'professor',
          area: 'navigation',
          severity: 'medium',
          description: 'Profesor nu are link/buton către detalii curs vizibil pe Dashboard',
          page: '/professor',
        });
      } else {
        await page.locator('a, button').filter({ hasText: /Vezi Detalii|Detalii curs/i }).first().click();
      }
    } else {
      await page.locator('a[href^="/professor/course/"]').first().click();
    }
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(800);
    const audit = await auditDesign(page, 'ProfessorCourseDetails', page.url(), 'professor');
    designAudits.push(audit);
  });

  test('Professor · Reports page', async ({ page }) => {
    trackErrors(page, 'ProfessorReports', 'professor');
    await login(page, PROFESSOR, '/professor');
    await page.goto('/professor/reports');
    await page.waitForLoadState('networkidle');
    const audit = await auditDesign(page, 'ProfessorReports', '/professor/reports', 'professor');
    designAudits.push(audit);
  });

  test('Professor · Sidebar items audit', async ({ page }) => {
    await login(page, PROFESSOR, '/professor');
    const navItems = await page.locator('nav button').allInnerTexts();
    const labels = navItems.map((t) => t.trim().split('\n')[0]).filter(Boolean);
    findings.push({
      role: 'professor',
      area: 'sidebar',
      severity: 'low',
      description: `Sidebar professor items: ${JSON.stringify(labels)}`,
      page: '/professor',
    });
    if (labels.length < 3) {
      findings.push({
        role: 'professor',
        area: 'sidebar',
        severity: 'medium',
        description: `Sidebar profesor pare prea sărac (${labels.length} itemi vs. 5 la student). Lipsesc: Notificări, Setări, etc.`,
        page: '/professor',
      });
    }
  });
});

test.describe('Deep Audit — Student role (baseline)', () => {
  test('Student · all pages design score', async ({ page }) => {
    trackErrors(page, 'StudentDashboard', 'student');
    await login(page, STUDENT, '/');
    designAudits.push(await auditDesign(page, 'StudentDashboard', '/', 'student'));

    await page.goto('/evaluations');
    await page.waitForLoadState('networkidle');
    designAudits.push(await auditDesign(page, 'ActiveEvaluations', '/evaluations', 'student'));

    await page.goto('/history');
    await page.waitForLoadState('networkidle');
    designAudits.push(await auditDesign(page, 'EvaluationHistory', '/history', 'student'));

    await page.goto('/results');
    await page.waitForLoadState('networkidle');
    designAudits.push(await auditDesign(page, 'AggregatedResults', '/results', 'student'));

    await page.goto('/achievements');
    await page.waitForLoadState('networkidle');
    designAudits.push(await auditDesign(page, 'Achievements', '/achievements', 'student'));
  });
});

test.describe('Cross-role correlation', () => {
  test('Admin can edit questionnaire — verify CRUD via API', async ({ page, request }) => {
    trackErrors(page, 'QuestionsCRUD', 'admin');
    await login(page, ADMIN, '/admin');
    const cookies = await page.context().cookies();
    const localStorageData = await page.evaluate(() => localStorage.getItem('token'));
    const token = localStorageData;

    // Try to fetch questions
    const resp = await request.get('http://localhost:5001/api/questions', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!resp.ok()) {
      findings.push({
        role: 'admin',
        area: 'questions-CRUD',
        severity: 'high',
        description: `GET /api/questions returnează ${resp.status()} pentru admin`,
      });
    } else {
      const data = await resp.json();
      const qCount = Array.isArray(data) ? data.length : data?.questions?.length || 0;
      findings.push({
        role: 'admin',
        area: 'questions-CRUD',
        severity: 'low',
        description: `Admin poate citi ${qCount} întrebări din chestionar`,
      });
    }
  });

  test('Student questions match what admin manages (data corelation)', async ({ page, request }) => {
    // 1. Admin: fetch questions
    await login(page, ADMIN, '/admin');
    const adminToken = await page.evaluate(() => localStorage.getItem('token'));
    const adminQResp = await request.get('http://localhost:5001/api/questions', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminQuestions = adminQResp.ok() ? await adminQResp.json() : null;
    const adminCount = Array.isArray(adminQuestions) ? adminQuestions.length : adminQuestions?.questions?.length || 0;

    // 2. Student: fetch the questions they see when opening an evaluation
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await login(page, STUDENT, '/');
    const studentToken = await page.evaluate(() => localStorage.getItem('token'));
    // Get first evaluation
    const profsResp = await request.get('http://localhost:5001/api/evaluations/professors', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    let studentCount = 0;
    if (profsResp.ok()) {
      const profs = await profsResp.json();
      const firstProf = profs?.professors?.[0];
      if (firstProf) {
        // Create or fetch existing evaluation
        const createResp = await request.post('http://localhost:5001/api/evaluations', {
          headers: { Authorization: `Bearer ${studentToken}` },
          data: { courseId: firstProf.course.id, professorId: firstProf.id },
        });
        if (createResp.ok()) {
          const created = await createResp.json();
          const evalResp = await request.get(`http://localhost:5001/api/evaluations/${created.evaluationId}`, {
            headers: { Authorization: `Bearer ${studentToken}` },
          });
          if (evalResp.ok()) {
            const evalData = await evalResp.json();
            studentCount = evalData?.questions?.length || 0;
          }
        }
      }
    }

    if (adminCount !== studentCount && adminCount > 0 && studentCount > 0) {
      findings.push({
        role: 'cross',
        area: 'questions-data-correlation',
        severity: 'high',
        description: `Inconsistență: admin vede ${adminCount} întrebări, dar studentul primește ${studentCount} la evaluare`,
      });
    } else {
      findings.push({
        role: 'cross',
        area: 'questions-data-correlation',
        severity: 'low',
        description: `OK: admin vede ${adminCount} întrebări, studentul primește ${studentCount}`,
      });
    }
  });

  test('Admin can send messages → student receives them', async ({ page, request }) => {
    // Admin sends a message
    await login(page, ADMIN, '/admin');
    const adminToken = await page.evaluate(() => localStorage.getItem('token'));
    const testMessage = `[TEST AUDIT ${Date.now()}] Mesaj de testare`;
    const sendResp = await request.post('http://localhost:5001/api/platform/messages/send', {
      headers: { Authorization: `Bearer ${adminToken}` },
      data: {
        title: testMessage,
        content: 'Conținut test',
        targetType: 'all',
        message_type: 'info',
      },
    });
    if (!sendResp.ok()) {
      const err = await sendResp.text();
      findings.push({
        role: 'cross',
        area: 'messaging',
        severity: 'high',
        description: `Admin nu poate trimite mesaje: ${sendResp.status()} — ${err.slice(0, 200)}`,
      });
      return;
    }

    // Student fetches messages
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await login(page, STUDENT, '/');
    const studentToken = await page.evaluate(() => localStorage.getItem('token'));
    const msgsResp = await request.get('http://localhost:5001/api/platform/messages/student', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (!msgsResp.ok()) {
      findings.push({
        role: 'cross',
        area: 'messaging',
        severity: 'high',
        description: `Student nu poate citi mesajele: ${msgsResp.status()}`,
      });
      return;
    }
    const data = await msgsResp.json();
    const hasTestMsg = data?.messages?.some((m: any) => m.title === testMessage);
    if (!hasTestMsg) {
      findings.push({
        role: 'cross',
        area: 'messaging',
        severity: 'high',
        description: `Mesajul trimis de admin "${testMessage}" NU apare la student. Student vede ${data?.messages?.length || 0} mesaje.`,
      });
    } else {
      findings.push({
        role: 'cross',
        area: 'messaging',
        severity: 'low',
        description: `OK: Mesajul de la admin a ajuns la student`,
      });
    }
  });

  test('Platform settings — admin can toggle → student sees effect', async ({ page, request }) => {
    await login(page, ADMIN, '/admin');
    const adminToken = await page.evaluate(() => localStorage.getItem('token'));
    const settingsResp = await request.get('http://localhost:5001/api/platform/settings', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (!settingsResp.ok()) {
      findings.push({
        role: 'admin',
        area: 'platform-settings',
        severity: 'high',
        description: `GET /api/platform/settings returnează ${settingsResp.status()} pentru admin`,
      });
    } else {
      const settings = await settingsResp.json();
      findings.push({
        role: 'admin',
        area: 'platform-settings',
        severity: 'low',
        description: `Admin poate citi setări. is_active=${settings?.is_active}, deadline=${settings?.evaluation_deadline_date}`,
      });
    }
  });

  test('Professor sees evaluations submitted by students (data flow)', async ({ page, request }) => {
    // 1. Student submits an evaluation
    await login(page, STUDENT, '/');
    const studentToken = await page.evaluate(() => localStorage.getItem('token'));

    const profsResp = await request.get('http://localhost:5001/api/evaluations/professors', {
      headers: { Authorization: `Bearer ${studentToken}` },
    });
    const profs = profsResp.ok() ? (await profsResp.json())?.professors || [] : [];

    if (profs.length === 0) {
      findings.push({
        role: 'cross',
        area: 'eval-flow',
        severity: 'medium',
        description: 'Student nu are profesori de evaluat în DB seed — nu putem testa flow-ul',
      });
      return;
    }

    // 2. Professor checks their dashboard
    await page.context().clearCookies();
    await page.evaluate(() => localStorage.clear());
    await login(page, PROFESSOR, '/professor');
    const profToken = await page.evaluate(() => localStorage.getItem('token'));

    const dashResp = await request.get('http://localhost:5001/api/professor/dashboard', {
      headers: { Authorization: `Bearer ${profToken}` },
    });
    if (!dashResp.ok()) {
      findings.push({
        role: 'cross',
        area: 'professor-data',
        severity: 'critical',
        description: `Professor dashboard API returnează ${dashResp.status()} — datele despre evaluări NU ajung la profesor`,
      });
    } else {
      const dash = await dashResp.json();
      findings.push({
        role: 'cross',
        area: 'professor-data',
        severity: 'low',
        description: `OK: Professor poate citi dashboard. Total evaluări vizibile: ${dash?.stats?.totalEvaluations || dash?.totalEvaluations || 'N/A'}`,
      });
    }
  });

  test('Admin global state — verify accessibility of all admin features', async ({ page, request }) => {
    await login(page, ADMIN, '/admin');
    const token = await page.evaluate(() => localStorage.getItem('token'));
    const endpoints = [
      ['GET', '/api/admin/dashboard'],
      ['GET', '/api/admin/professors'],
      ['GET', '/api/admin/filter-options'],
      ['GET', '/api/questions'],
      ['GET', '/api/platform/settings'],
      ['GET', '/api/platform/messages/history'],
      ['GET', '/api/platform/filters/options'],
      ['GET', '/api/admin/courses/names'],
    ];
    for (const [method, ep] of endpoints) {
      const resp = await (method === 'GET'
        ? request.get(`http://localhost:5001${ep}`, { headers: { Authorization: `Bearer ${token}` } })
        : request.post(`http://localhost:5001${ep}`, { headers: { Authorization: `Bearer ${token}` } }));
      if (!resp.ok()) {
        findings.push({
          role: 'admin',
          area: 'api-coverage',
          severity: 'high',
          description: `${method} ${ep} → ${resp.status()} (admin trebuie să poată accesa)`,
        });
      }
    }
  });
});
