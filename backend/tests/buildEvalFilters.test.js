/**
 * Unit tests pentru buildEvalFilters — verifică suport CSV multi-value.
 * Rulează cu: node --test backend/tests/buildEvalFilters.test.js
 *
 * Nu importăm controllerul direct (are side-effects de DB) — copiem helper-ul în formă pură.
 */
const test = require('node:test');
const assert = require('node:assert');

// Inline helper — păstrat sincronizat cu cel din platformController.js.
// Schimbarea uneia trebuie să fie reflectată în cealaltă; CI-ul rulează acest test.
function buildEvalFilters(query, opts = {}) {
  const { withQuestion = false, withCourse = true } = opts;
  const parts = [];
  const params = [];
  const parseList = (v) => {
    if (v == null) return [];
    return String(v).split(',').map((s) => s.trim()).filter(Boolean);
  };
  if (query.facultyId) {
    parts.push('p.faculty_id = ?');
    params.push(Number(query.facultyId));
  }
  if (query.departmentId) {
    parts.push('p.department = ?');
    params.push(String(query.departmentId));
  }
  if (withCourse) {
    const semesters = parseList(query.semester);
    if (semesters.length === 1) {
      parts.push('c.semester = ?');
      params.push(semesters[0]);
    } else if (semesters.length > 1) {
      parts.push(`c.semester IN (${semesters.map(() => '?').join(',')})`);
      params.push(...semesters);
    }
    const courseTypes = parseList(query.courseType);
    if (courseTypes.length === 1) {
      parts.push('c.course_type = ?');
      params.push(courseTypes[0]);
    } else if (courseTypes.length > 1) {
      parts.push(`c.course_type IN (${courseTypes.map(() => '?').join(',')})`);
      params.push(...courseTypes);
    }
  }
  const years = parseList(query.year);
  if (years.length === 1) {
    parts.push('c.study_year_id IN (SELECT id FROM study_years WHERE year_number = ?)');
    params.push(Number(years[0]));
  } else if (years.length > 1) {
    parts.push(
      `c.study_year_id IN (SELECT id FROM study_years WHERE year_number IN (${years.map(() => '?').join(',')}))`,
    );
    params.push(...years.map((y) => Number(y)));
  }
  if (withQuestion) {
    const cats = parseList(query.category);
    if (cats.length === 1) {
      parts.push('q.category = ?');
      params.push(cats[0]);
    } else if (cats.length > 1) {
      parts.push(`q.category IN (${cats.map(() => '?').join(',')})`);
      params.push(...cats);
    }
  }
  return { sql: parts.length ? ' AND ' + parts.join(' AND ') : '', params };
}

test('empty query → no filter', () => {
  const r = buildEvalFilters({});
  assert.strictEqual(r.sql, '');
  assert.deepStrictEqual(r.params, []);
});

test('single facultyId → equals', () => {
  const r = buildEvalFilters({ facultyId: '3' });
  assert.match(r.sql, /p\.faculty_id = \?/);
  assert.deepStrictEqual(r.params, [3]);
});

test('single year → IN with one param', () => {
  const r = buildEvalFilters({ year: '2' });
  assert.match(r.sql, /year_number = \?/);
  assert.deepStrictEqual(r.params, [2]);
});

test('multi year CSV → IN with placeholders', () => {
  const r = buildEvalFilters({ year: '1,2,3' });
  assert.match(r.sql, /year_number IN \(\?,\?,\?\)/);
  assert.deepStrictEqual(r.params, [1, 2, 3]);
});

test('multi year with spaces → trimmed', () => {
  const r = buildEvalFilters({ year: ' 1 , 2 ' });
  assert.deepStrictEqual(r.params, [1, 2]);
});

test('multi courseType CSV', () => {
  const r = buildEvalFilters({ courseType: 'curs,laborator' });
  assert.match(r.sql, /c\.course_type IN \(\?,\?\)/);
  assert.deepStrictEqual(r.params, ['curs', 'laborator']);
});

test('multi semester CSV', () => {
  const r = buildEvalFilters({ semester: '1,2' });
  assert.match(r.sql, /c\.semester IN \(\?,\?\)/);
  assert.deepStrictEqual(r.params, ['1', '2']);
});

test('combined filters: facultyId + year multi + courseType multi', () => {
  const r = buildEvalFilters({ facultyId: '1', year: '1,2', courseType: 'curs,seminar' });
  assert.strictEqual(r.params.length, 5);
  assert.deepStrictEqual(r.params, [1, 'curs', 'seminar', 1, 2]);
});

test('empty string in CSV are filtered out', () => {
  const r = buildEvalFilters({ year: '1,,2,' });
  assert.deepStrictEqual(r.params, [1, 2]);
});

test('category requires withQuestion', () => {
  const r1 = buildEvalFilters({ category: 'didactica' }, { withQuestion: false });
  assert.strictEqual(r1.sql, '');
  const r2 = buildEvalFilters({ category: 'didactica' }, { withQuestion: true });
  assert.match(r2.sql, /q\.category = \?/);
});

test('category multi-value with withQuestion', () => {
  const r = buildEvalFilters({ category: 'didactica,comunicare' }, { withQuestion: true });
  assert.match(r.sql, /q\.category IN \(\?,\?\)/);
  assert.deepStrictEqual(r.params, ['didactica', 'comunicare']);
});
