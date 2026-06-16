/**
 * bootstrap.js — punct de intrare Railway-safe
 *
 * Pornește imediat un server HTTP minimal pe PORT cu /api/health → 200.
 * Railway healthcheck trece. Migrațiile rulează sincron ÎNAINTE de a
 * încărca Express complet, dar serverul HTTP e deja bind-at.
 */
'use strict';

const http = require('http');
const { execFileSync } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 5000;

// ─── 1. Server HTTP minimal — răspunde la healthcheck imediat ───────────────
let app = null; // va fi populat cu Express după migrations

const server = http.createServer((req, res) => {
  if (app) {
    // Express e gata — delegăm
    app(req, res);
  } else {
    // Migrations încă rulează
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', phase: 'starting' }));
  }
});

server.listen(PORT, () => {
  console.log(`[bootstrap] HTTP server bound on port ${PORT}`);
});

// ─── 2. Migrații sincrone (bloc, dar serverul deja ascultă) ─────────────────
const dbDir = path.join(__dirname, 'db');

try {
  console.log('[bootstrap] Running ensure-db...');
  execFileSync(process.execPath, [path.join(dbDir, 'ensure-db.js')], {
    stdio: 'inherit',
    env: process.env,
    cwd: path.join(__dirname, '..'),
  });
  console.log('[bootstrap] ensure-db OK');
} catch (e) {
  console.error('[bootstrap] ensure-db FAILED (continuing):', e.message);
}

try {
  console.log('[bootstrap] Running migrate-on-boot...');
  execFileSync(process.execPath, [path.join(dbDir, 'migrate-on-boot.js')], {
    stdio: 'inherit',
    env: process.env,
    cwd: path.join(__dirname, '..'),
  });
  console.log('[bootstrap] migrate-on-boot OK');
} catch (e) {
  console.error('[bootstrap] migrate-on-boot FAILED (continuing):', e.message);
}

// ─── 3. Încarc Express complet după migrations ────────────────────────────────
try {
  console.log('[bootstrap] Loading Express app...');
  app = require('./server');
  console.log('[bootstrap] Express app loaded OK');
} catch (e) {
  console.error('[bootstrap] Express app FAILED to load:', e.message, e.stack);
  // Serverul HTTP minimal continuă să răspundă cu 200 pentru healthcheck
}
