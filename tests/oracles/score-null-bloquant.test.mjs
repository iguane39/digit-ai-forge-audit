// TF-2143 (RU-9) — un score null d'une dimension « off » n'est PAS un bloquant.
// En JavaScript `null <= 2` vaut true : `rapport-engine.mjs` et `build-slides.mjs` comptaient donc
// bloquante toute dimension sans score (hors périmètre), et le verdict de porte basculait. Mesuré sur
// le jeu d'une campagne du 04/11/2026 : 16 bloquants annoncés pour 15 réels, la 16e étant D14 (off, null).
// Le comparateur ne se fie plus à la coercition : un score est un NOMBRE (`typeof`) avant tout seuil.
//
// Fixture à double sens : un score null ne compte PAS ; un score 2 compte. Rejoué sur les deux
// producteurs du compte (rapport HTML et présentation) et sur le gate de données, qui refuse null.
//
// Lancer : node --test tests/oracles/score-null-bloquant.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');
const node = (args) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 120000, maxBuffer: 1e8 });
const valide = () => JSON.parse(fs.readFileSync(path.join(RACINE, 'tests', 'fixtures', 'rapport-data-valid.json'), 'utf8'));
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'score-null-'));
const ecrire = (nom, d) => { const p = path.join(dossier, nom); fs.writeFileSync(p, JSON.stringify(d), 'utf8'); return p; };

/** Les 18 dimensions du jeu mesuré : 15 au score 2, D14 off sans score (null), 2 au score 4. */
function jeuDesSeize() {
  const d = valide();
  d.dimensions = d.dimensions.map((x) => {
    if (x.id === 'D14') return { id: 'D14', applicability: 'off', score: null };
    return { ...x, score: ['D16', 'D17'].includes(x.id) ? 4 : 2 };
  });
  return d;
}

/** Les bloquants que le rapport HTML déclare à son auto-test embarqué. */
function bloquantsDuRapport(chemin) {
  const sortie = path.join(dossier, `rapport-${path.basename(chemin, '.json')}.html`);
  const r = node([path.join(RACINE, 'tools', 'build-rapport.mjs'), chemin, '--tenant', TENANT, '--out', sortie]);
  assert.equal(r.status, 0, r.stderr);
  const html = fs.readFileSync(sortie, 'utf8');
  const m = /<script type="application\/json" id="audit-selftest-data">([\s\S]*?)<\/script>/.exec(html);
  assert.ok(m, 'le rapport embarque ses faits d\'auto-test');
  return { liste: JSON.parse(m[1].replace(/\\u003c/g, '<')).bloquants, html };
}
/** Le compte « Bloquants » de la diapositive de synthèse. */
function bloquantsDesDiapositives(chemin) {
  const sortie = path.join(dossier, `slides-${path.basename(chemin, '.json')}.html`);
  const r = node([path.join(RACINE, 'tools', 'build-slides.mjs'), chemin, '--tenant', TENANT, '--out', sortie]);
  assert.equal(r.status, 0, r.stderr);
  const m = /<span>Bloquants<\/span><b>(\d+)<\/b>/.exec(fs.readFileSync(sortie, 'utf8'));
  assert.ok(m, 'la diapositive de synthèse porte le compte des bloquants');
  return Number(m[1]);
}

test('TF-2143 ROUGE→VERT — le jeu mesuré : 16 bloquants annoncés pour 15 réels, D14 (off, null) ne compte pas', () => {
  const chemin = ecrire('seize.json', jeuDesSeize());
  const { liste } = bloquantsDuRapport(chemin);
  assert.equal(liste.length, 15, `rapport HTML : ${liste.length} bloquants (${liste.join(' ')}) au lieu de 15`);
  assert.ok(!liste.includes('D14'), 'D14 (off, sans score) est comptée bloquante');
  assert.equal(bloquantsDesDiapositives(chemin), 15, 'présentation : le compte diverge du rapport');
});

test('TF-2143 double sens — un score null ne compte PAS bloquant, un score 2 compte', () => {
  const d = valide();
  d.dimensions = d.dimensions.map((x) => {
    if (x.id === 'D14') return { id: 'D14', applicability: 'off', score: null };
    if (x.id === 'D13') return { id: 'D13', score: null };          // null sans marqueur off : jamais un bloquant non plus
    if (x.id === 'D05') return { ...x, score: 2 };
    return x;
  });
  const chemin = ecrire('double-sens.json', d);
  const { liste } = bloquantsDuRapport(chemin);
  assert.deepEqual(liste, ['D05'], 'seule la dimension au score 2 est bloquante');
  assert.equal(bloquantsDesDiapositives(chemin), 1);
});

test('TF-2143 — le score global ne compte pas un null pour un zéro (ni dans le rapport, ni dans la présentation)', () => {
  const d = valide();
  d.dimensions = d.dimensions.map((x) => (x.id === 'D14' ? { id: 'D14', applicability: 'off', score: null } : { ...x, score: 4 }));
  const chemin = ecrire('moyenne.json', d);
  const { html } = bloquantsDuRapport(chemin);
  assert.match(html, /class="k-valeur"[^>]*>4\.0 <small>\/5/, 'rapport : la moyenne des 17 dimensions notées vaut 4.0');
  const sortie = path.join(dossier, 'slides-moyenne.html');
  const r = node([path.join(RACINE, 'tools', 'build-slides.mjs'), chemin, '--tenant', TENANT, '--out', sortie]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(fs.readFileSync(sortie, 'utf8'), /<span>Score global<\/span><b>4\.0\/5<\/b>/, 'présentation : un null est compté pour 0');
});

test('TF-2143 — le gate de données refuse un score null ou textuel sur une dimension instruite, et accepte off + null', () => {
  const refuse = (mut, motif) => {
    const d = valide();
    d.dimensions = d.dimensions.map((x) => (x.id === 'D13' ? mut(x) : x));
    const r = node([path.join(RACINE, 'tools', 'verifier-rapport.mjs'), ecrire(`gate-${motif}.json`, d)]);
    assert.equal(r.status, 1, `${motif} : accepté (exit ${r.status})`);
    assert.match(r.stderr, /D13: score invalide ou absent/, `${motif} : le refus ne cite pas le score`);
  };
  refuse((x) => ({ ...x, score: null }), 'null');
  refuse((x) => ({ ...x, score: '2' }), 'texte');
  const off = valide();
  off.dimensions = off.dimensions.map((x) => (x.id === 'D14' ? { id: 'D14', applicability: 'off', score: null } : x));
  const r = node([path.join(RACINE, 'tools', 'verifier-rapport.mjs'), ecrire('off-null.json', off)]);
  assert.equal(r.status, 0, `off + null refusé à tort : ${r.stderr}`);
});
