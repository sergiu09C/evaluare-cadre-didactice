'use strict';

const http = require('http');
const fs = require('fs');
const { spawn } = require('child_process');
const path = require('path');

const PORT = process.env.PORT || 5000;

// ─── 0. Verificare volum Railway ─────────────────────────────────────────────
// Sync OK: e o operatie rapida (< 5ms), nu blocheaza health checks.
const configuredDBPath = process.env.DB_PATH;
if (configuredDBPath) {
  const volumeDir = path.dirname(configuredDBPath);
  const testFile = path.join(volumeDir, '.write_test_' + process.pid);
  try {
    fs.mkdirSync(volumeDir, { recursive: true });
    fs.writeFileSync(testFile, 'x');
    fs.unlinkSync(testFile);
    console.log(`[bootstrap] Volum accesibil la ${volumeDir} — DB_PATH activ`);
  } catch (e) {
    console.error(`[bootstrap] Volum ${volumeDir} inaccesibil (${e.code}: ${e.message}) — folosesc in-repo DB`);
    delete process.env.DB_PATH;
  }
}

// ─── 1. Server HTTP minimal — pornit IMEDIAT, răspunde la healthcheck ─────────
// Health check Railway: /api/health trebuie să returneze 200 în <= 60s.
// Nu blocăm event loop-ul cu migrații sync — folosim spawn async.
let app = null;

const server = http.createServer((req, res) => {
  if (app) {
    app(req, res);
  } else {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK', phase: 'starting' }));
  }
});

server.listen(PORT, () => {
  console.log(`[bootstrap] HTTP server bound on port ${PORT} — healthcheck activ`);
});

// ─── 2. Helper: rulează un script Node.js ca subprocess async ─────────────────
// Spre deosebire de execFileSync, spawn nu blochează event loop-ul Node.js.
// Asta înseamnă că server-ul HTTP de mai sus poate răspunde la health checks
// în timp ce migratiile rulează în background.
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    console.log(`[bootstrap] spawn: ${path.basename(scriptPath)}`);
    const child = spawn(process.execPath, [scriptPath], {
      stdio: 'inherit',
      env: process.env,
      cwd: path.join(__dirname, '..'),
    });
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${path.basename(scriptPath)} exit code ${code}`));
      }
    });
    child.on('error', reject);
  });
}

// ─── 3. Migrații async — event loop liber, health check funcționează ──────────
const dbDir = path.join(__dirname, 'db');

Promise.resolve()
  .then(() => runScript(path.join(dbDir, 'ensure-db.js')))
  .catch((e) => {
    console.error('[bootstrap] ensure-db FAILED — fallback la in-repo DB:', e.message);
    delete process.env.DB_PATH;
  })
  .then(() => runScript(path.join(dbDir, 'migrate-on-boot.js')))
  .catch((e) => {
    console.error('[bootstrap] migrate-on-boot FAILED (continuam):', e.message);
  })
  .then(() => {
    try {
      console.log('[bootstrap] Loading Express app...');
      app = require('./server');
      console.log('[bootstrap] Express app loaded OK');
    } catch (e) {
      console.error('[bootstrap] Express app FAILED to load:', e.message, e.stack);
    }
  });
