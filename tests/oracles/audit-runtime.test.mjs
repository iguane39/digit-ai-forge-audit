// Non-régression des contrôles d'audit RUNTIME (prompt : derive-schema-modele-et-smoke-runtime).
// Incident ACME : audit « GO » alors que GET /listing/<id> = 500 (listings.status déclarée par l'ORM,
// absente de la base ; DDL orphelines ; aucun smoke runtime). Trois angles morts → trois contrôles.
//
// Lancer :  node --test __tests__/audit-runtime.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CP = path.join(HERE, '..', '..', 'oracles');
const FIX = path.join(HERE, '..', 'fixtures', 'oracles');
const run = (tool, args) => spawnSync(process.execPath, [path.join(CP, tool), ...args], { encoding: 'utf8', timeout: 60000, maxBuffer: 1e8 });

// ───────────── Contrôle 1 · dérive schéma ORM ↔ base (BLOQUANT) ─────────────
test('drift : colonne déclarée par le modèle mais absente de la base → BLOQUANT (exit 1) + liste', () => {
  const r = run('verifier-schema-modele.mjs', ['--model', path.join(FIX, 'schema-drift', 'models.py'), '--schema', path.join(FIX, 'schema-drift', 'db-drift.sql')]);
  assert.equal(r.status, 1, 'une dérive modèle→base doit être bloquante');
  assert.match(r.stdout, /BLOQUANT/);
  assert.match(r.stdout, /listings\.status/, 'le cas listings.status est nommé');
  assert.match(r.stdout, /listings\.closed_at/);
  assert.match(r.stdout, /listings\.territory_id/);
});

test('drift : base alignée (migrations appliquées) → OK (exit 0)', () => {
  const r = run('verifier-schema-modele.mjs', ['--model', path.join(FIX, 'schema-drift', 'models.py'), '--schema', path.join(FIX, 'schema-drift', 'db-aligned.sql')]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /Aucune dérive bloquante/);
});

test('drift : modèle en JSON (fallback universel, tout ORM) — table absente → BLOQUANT', () => {
  const tmp = path.join(os.tmpdir(), 'drift-model.json');
  fs.writeFileSync(tmp, JSON.stringify({ listings: ['id', 'title', 'status'], territories: ['id'] }));
  const dbtmp = path.join(os.tmpdir(), 'drift-db.json');
  fs.writeFileSync(dbtmp, JSON.stringify({ listings: ['id', 'title'] })); // status absent + table territories absente
  const r = run('verifier-schema-modele.mjs', ['--model', tmp, '--schema', dbtmp]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /listings\.status/);
  assert.match(r.stdout, /territories/, 'table entière absente signalée');
});

// ───────────── Contrôle 3 · migrations pipeline & DDL orphelines (D09) ─────────────
test('migrations : DDL orphelines + pas d\'étape pipeline → BLOQUANT (exit 1), constat D09', () => {
  const r = run('verifier-migrations.mjs', [path.join(FIX, 'migrations', 'drift')]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /D09/);
  assert.match(r.stdout, /orphelines/i);
  assert.match(r.stdout, /08-add-status\.sql/);
});

test('migrations : pipeline applique les DDL → OK (exit 0)', () => {
  const r = run('verifier-migrations.mjs', [path.join(FIX, 'migrations', 'clean')]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /verdict : OK/);
});

// ───────────── Contrôle 2 · smoke runtime des parcours critiques (BLOQUANT sur 5xx) ─────────────
// Serveur HTTP local : /listings → 200, /listing/1 → 500 (reproduit l'incident ACME).
// IMPORTANT : spawn ASYNChrone — spawnSync bloquerait l'event loop et le serveur ne répondrait pas.
function smoke(routes) {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => { const code = routes[req.url] ?? 404; res.writeHead(code); res.end(String(code)); });
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      const man = path.join(os.tmpdir(), 'smoke-man-' + port + '.json');
      fs.writeFileSync(man, JSON.stringify({ base_url: 'http://127.0.0.1:' + port, parcours: Object.keys(routes).map(p => ({ id: p, method: 'GET', path: p, critique: true })) }));
      const c = spawn(process.execPath, [path.join(CP, 'smoke-parcours.mjs'), '--manifest', man], { encoding: 'utf8' });
      let out = ''; c.stdout.on('data', d => out += d); c.stderr.on('data', d => out += d);
      c.on('close', code => { srv.close(); resolve({ code, out }); });
    });
  });
}

test('smoke : un 500 sur un parcours critique → BLOQUANT (exit 1), interdit le GO', async () => {
  const { code, out } = await smoke({ '/listings': 200, '/listing/1': 500 });
  assert.equal(code, 1, 'un 500 critique doit interdire le GO');
  assert.match(out, /BLOQUANT/);
  assert.match(out, /\/listing\/1.*500/s);
  assert.match(out, /NO GO/);
});

test('smoke : tous les parcours critiques en 2xx → OK (exit 0)', async () => {
  const { code, out } = await smoke({ '/listings': 200, '/listing/1': 200 });
  assert.equal(code, 0);
  assert.match(out, /verdict : OK/);
});
