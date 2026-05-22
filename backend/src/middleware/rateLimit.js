/**
 * Rate limiter in-memory simplu (per IP). Zero dependențe externe.
 *
 * Folosit pentru endpoint-uri sensibile (auth, reset password) ca să previn
 * brute-force și spam de tokens.
 *
 * Limitări:
 *  - State în memorie → la restart server se resetează (acceptabil pentru dev,
 *    iar în prod cu reverse proxy se poate adăuga un cache distribuit).
 *  - IP-ul provine din req.ip (Express respectă X-Forwarded-For dacă
 *    `app.set('trust proxy', true)` e setat).
 */

function createRateLimiter({
  windowMs,
  max,
  key = 'global',
  message = 'Prea multe cereri. Încearcă mai târziu.',
  relaxInNonProd = true,
}) {
  // În dev relaxăm rate limit-ul x10 — altfel suite-urile Playwright care fac
  // multe login-uri din același IP local sunt blocate fals-pozitiv.
  // Putem opta-out cu `relaxInNonProd: false` (folosit în unit tests).
  if (relaxInNonProd && process.env.NODE_ENV !== 'production') {
    max = max * 10;
  }
  const hits = new Map(); // ip -> { count, resetAt }

  // Curățare periodică ca să nu acumulăm chei pentru IP-uri vechi.
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of hits) {
      if (rec.resetAt < now) hits.delete(ip);
    }
  }, Math.max(windowMs, 60_000));
  if (cleanup.unref) cleanup.unref();

  return (req, res, next) => {
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const compositeKey = `${key}:${ip}`;
    const now = Date.now();
    let rec = hits.get(compositeKey);
    if (!rec || rec.resetAt < now) {
      rec = { count: 0, resetAt: now + windowMs };
      hits.set(compositeKey, rec);
    }
    rec.count++;
    if (rec.count > max) {
      const retryAfterSec = Math.max(1, Math.ceil((rec.resetAt - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({ error: message, retryAfterSeconds: retryAfterSec });
    }
    next();
  };
}

module.exports = { createRateLimiter };
