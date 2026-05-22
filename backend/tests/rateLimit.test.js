/**
 * Unit tests pentru middleware-ul de rate limit.
 * Rulează: node --test backend/tests/rateLimit.test.js
 */
const test = require('node:test');
const assert = require('node:assert');
const { createRateLimiter } = require('../src/middleware/rateLimit');

// Mini-helper pentru a simula req/res/next
function makeContext(ip = '1.2.3.4') {
  const headers = {};
  const res = {
    statusCode: 200,
    body: null,
    setHeader(k, v) { headers[k] = v; },
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; },
  };
  let nextCalled = false;
  return {
    req: { ip, connection: { remoteAddress: ip } },
    res,
    headers,
    next: () => { nextCalled = true; },
    nextCalled: () => nextCalled,
  };
}

test('permite primele N cereri', () => {
  const limiter = createRateLimiter({ relaxInNonProd: false, key: 't1', windowMs: 60000, max: 3 });
  let passed = 0;
  for (let i = 0; i < 3; i++) {
    const ctx = makeContext('1.1.1.1');
    limiter(ctx.req, ctx.res, ctx.next);
    if (ctx.nextCalled()) passed++;
  }
  assert.strictEqual(passed, 3);
});

test('blochează cererea peste max cu 429', () => {
  const limiter = createRateLimiter({ relaxInNonProd: false, key: 't2', windowMs: 60000, max: 2 });
  const ip = '2.2.2.2';
  let ctx;
  for (let i = 0; i < 2; i++) {
    ctx = makeContext(ip);
    limiter(ctx.req, ctx.res, ctx.next);
  }
  // a 3-a → 429
  ctx = makeContext(ip);
  limiter(ctx.req, ctx.res, ctx.next);
  assert.strictEqual(ctx.res.statusCode, 429);
  assert.ok(ctx.res.body.error);
  assert.ok(ctx.res.body.retryAfterSeconds > 0);
  assert.ok(ctx.headers['Retry-After']);
});

test('IP-uri diferite au contoare separate', () => {
  const limiter = createRateLimiter({ relaxInNonProd: false, key: 't3', windowMs: 60000, max: 1 });
  const a = makeContext('3.3.3.3');
  limiter(a.req, a.res, a.next);
  assert.ok(a.nextCalled());
  const b = makeContext('4.4.4.4');
  limiter(b.req, b.res, b.next);
  assert.ok(b.nextCalled());
});

test('Key-uri diferite (login vs forgot) — contoare separate', () => {
  const loginLim = createRateLimiter({ relaxInNonProd: false, key: 'login', windowMs: 60000, max: 1 });
  const forgotLim = createRateLimiter({ relaxInNonProd: false, key: 'forgot', windowMs: 60000, max: 1 });
  const ip = '5.5.5.5';
  const a = makeContext(ip);
  loginLim(a.req, a.res, a.next);
  assert.ok(a.nextCalled());
  // pe forgot — IP-ul are 0 hit-uri pe „forgot" → trebuie să treacă
  const b = makeContext(ip);
  forgotLim(b.req, b.res, b.next);
  assert.ok(b.nextCalled());
});

test('Resetare după windowMs expiră', async () => {
  const limiter = createRateLimiter({ relaxInNonProd: false, key: 't4', windowMs: 100, max: 1 });
  const ip = '6.6.6.6';
  const a = makeContext(ip);
  limiter(a.req, a.res, a.next);
  assert.ok(a.nextCalled());
  // imediat: blocat
  const b = makeContext(ip);
  limiter(b.req, b.res, b.next);
  assert.strictEqual(b.res.statusCode, 429);
  // așteaptă peste fereastră
  await new Promise((r) => setTimeout(r, 150));
  const c = makeContext(ip);
  limiter(c.req, c.res, c.next);
  assert.ok(c.nextCalled());
});
