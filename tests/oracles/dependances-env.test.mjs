// Non-régression : dépendances runtime provisionnées PAR ENV + smokes sur la réalité déployée
// (prompt : provisioning-donnees-env-et-smokes-deployes). Incident ACME : « Télécharger le template »
// → 404 en QUALIF (blob dev-only), CSP figée divergente, échec fetch silencieux — invisible car tout mocké.
//
// Lancer :  node --test __tests__/dependances-env.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync, spawn } from 'node:child_process';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const TOOL = path.join(HERE, '..', '..', 'oracles', 'verifier-dependances-env.mjs');
const FIX = path.join(HERE, '..', 'fixtures', 'oracles', 'dependances-env');
const run = (args) => spawnSync(process.execPath, [TOOL, ...args], { encoding: 'utf8', timeout: 60000, maxBuffer: 1e8 });

// ---- statique (déterministe) ----
test('statique incomplet → BLOQUANT : dev-only, provisioning manuel, smoke manquant, dérive de parité', () => {
  const r = run(['--manifest', path.join(FIX, 'incomplet.json')]);
  assert.equal(r.status, 1);
  assert.match(r.stdout, /parité.*qualif.*sans mécanisme de synchro/s);
  assert.match(r.stdout, /PAS pour \[qualif, prod\]/, 'blob provisionné dev-only');
  assert.match(r.stdout, /provisioning non codé.*manuel/s);
  assert.match(r.stdout, /smoke absent pour \[qualif, prod\]/);
});

test('statique complet → OK', () => {
  const r = run(['--manifest', path.join(FIX, 'complet.json')]);
  assert.equal(r.status, 0);
  assert.match(r.stdout, /verdict : OK/);
});

// ---- exécuté sur la réalité (spawn ASYNChrone — sinon l'event loop bloque les serveurs) ----
function srv(handler) { return new Promise(res => { const s = http.createServer(handler); s.listen(0, '127.0.0.1', () => res(s)); }); }
function execManifest(man) {
  return new Promise((resolve) => {
    const f = path.join(os.tmpdir(), 'depenv-' + Math.floor(process.hrtime()[1]) + '.json');
    fs.writeFileSync(f, JSON.stringify(man));
    const c = spawn(process.execPath, [TOOL, '--manifest', f, '--execute'], { encoding: 'utf8' });
    let out = ''; c.stdout.on('data', d => out += d); c.stderr.on('data', d => out += d);
    c.on('close', code => resolve({ code, out }));
  });
}

test('exécuté : blob présent en dev (200) mais ABSENT en qualif (404) → BLOQUANT, env nommé', async () => {
  const dev = await srv((req, res) => { res.writeHead(req.url === '/file-import/template' ? 200 : 404); res.end('x'); });
  const qualif = await srv((req, res) => { res.writeHead(404); res.end('Template indisponible'); });
  const man = {
    projet: 'ACME', canonical_source: 'main',
    environnements: [
      { nom: 'dev', source: 'main', base_url: 'http://127.0.0.1:' + dev.address().port },
      { nom: 'qualif', source: 'main', base_url: 'http://127.0.0.1:' + qualif.address().port },
    ],
    dependances: [{
      id: 'template-import', type: 'blob',
      provisioning: { mode: 'code', etape: 'deploy/provision_storage.py', envs: ['dev', 'qualif'] },
      smoke: { type: 'http', path: '/file-import/template', attendu: '2xx', verifie: 'blob téléchargeable', par_env: ['dev', 'qualif'] },
    }],
  };
  const { code, out } = await execManifest(man);
  dev.close(); qualif.close();
  assert.equal(code, 1, 'un blob manquant dans un env doit bloquer');
  // Gardes de chiffre (TF-0438, 21/08) : « 404 » nu matche « 4040 » — a l'affirmation comme
  // a la negation, le code cherche doit etre le code, pas son prefixe.
  assert.match(out, /smoke qualif.*[^0-9]404(?![0-9])/s);
  assert.doesNotMatch(out, /smoke dev.*echec|smoke dev.*[^0-9]404(?![0-9])/s, 'dev reste vert');
});

test('exécuté : dérive de config par env — en-tête CSP servi ne contient pas l\'hôte requis → BLOQUANT', async () => {
  const good = await srv((req, res) => { res.setHeader('content-security-policy', "connect-src 'self' https://api.acme"); res.writeHead(200); res.end('x'); });
  const drift = await srv((req, res) => { res.setHeader('content-security-policy', "connect-src 'self'"); res.writeHead(200); res.end('x'); });
  const man = {
    projet: 'ACME', canonical_source: 'main',
    environnements: [
      { nom: 'dev', source: 'main', base_url: 'http://127.0.0.1:' + good.address().port },
      { nom: 'qualif', source: 'main', base_url: 'http://127.0.0.1:' + drift.address().port },
    ],
    dependances: [{
      id: 'csp-connect-src', type: 'header',
      provisioning: { mode: 'code', etape: 'staticwebapp.config.json', envs: ['dev', 'qualif'] },
      smoke: { type: 'header', path: '/', header: 'content-security-policy', doit_contenir: 'https://api.acme', par_env: ['dev', 'qualif'] },
    }],
  };
  const { code, out } = await execManifest(man);
  good.close(); drift.close();
  assert.equal(code, 1);
  assert.match(out, /smoke qualif.*content-security-policy.*ne contient pas.*https:\/\/api\.acme/s);
});
