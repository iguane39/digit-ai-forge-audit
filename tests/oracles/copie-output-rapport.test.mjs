// TF-2261 (RT-52, Produit-84) — build-rapport --copie-output dépose le rendu et ses compagnons dans output/ du produit,
// range l'indice précédent sous old/, et un contrôle refuse un output/ en retard sur l'espace d'audit.
//
// Le fait : le 05/11/2026 à 11:47, le rapport 20261104b a été rendu sous l'espace d'audit seulement ; output/05-audits/
// du produit a gardé 20261104a jusqu'au 06/11 à 10:15. Aucun geste ne le déposait, aucun contrôle ne le voyait.
//
// Preuves, à double sens : le dépôt (vert), l'indice précédent rangé, l'idempotence, les refus qui n'écrivent RIEN
// (contenu différent, indice plus récent déjà déposé, option sans dossier), le contrôle ROUGE sur un output/ en retard
// et sur un output/ vide, puis VERT une fois le remède du message joué (TF-1013 : le remède recommandé passe).
//
// Lancer : node --test tests/oracles/copie-output-rapport.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { decomposer, deposerCopie, verifierOutputAJour } from '../../tools/copie-output.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');
const DATA = path.join(RACINE, 'tests', 'fixtures', 'rapport-data-valid.json');
const BUILD = path.join(RACINE, 'tools', 'build-rapport.mjs');
const CONTROLE = path.join(RACINE, 'tools', 'copie-output.mjs');
const node = (args) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 180000, maxBuffer: 1e8 });
const racine = fs.mkdtempSync(path.join(os.tmpdir(), 'copie-output-'));
let n = 0;
/** Un espace d'audit et un output/ de produit neufs. */
function espaces() {
  const base = path.join(racine, `cas-${++n}`);
  const espace = path.join(base, 'forge', 'audit', '20261104', 'output');
  const output = path.join(base, 'produit', 'output', '05-audits');
  fs.mkdirSync(espace, { recursive: true });
  return { espace, output };
}
const FAMILLE = "Produit-84 - Audit - Rapport d'audit - ";
const nom = (ref, suffixe = '.html') => `${FAMILLE}${ref}${suffixe}`;
const TROIS = ['.html', '.remediation-actions.yaml', '.controles-evalues.json'];
const rendre = (espace, ref, ...opts) => node([BUILD, DATA, '--tenant', TENANT, '--out', path.join(espace, nom(ref)), ...opts]);
const lister = (d) => (fs.existsSync(d) ? fs.readdirSync(d).sort() : []);
const poser = (dossier, ref, contenu = 'ancien') => { fs.mkdirSync(dossier, { recursive: true }); for (const s of TROIS) fs.writeFileSync(path.join(dossier, nom(ref, s)), `${contenu} ${s}`); };

test('TF-2261 — decomposer lit famille, jour, lettre et suffixe ; un nom hors convention rend null', () => {
  assert.deepEqual(decomposer(nom('20261104b')), { famille: FAMILLE, jour: '20261104', lettre: 'b', ref: '20261104b', suffixe: '.html' });
  assert.equal(decomposer(nom('20261104b', '.controles-evalues.json')).suffixe, '.controles-evalues.json');
  assert.equal(decomposer('rapport-audit.html'), null);
  assert.equal(decomposer(nom('20261104b', '.pdf')), null);
});

test('TF-2261 — --copie-output dépose le rendu ET ses deux compagnons dans le dossier désigné', () => {
  const { espace, output } = espaces();
  const r = rendre(espace, '20261104b', '--copie-output', output);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(lister(output), TROIS.map((s) => nom('20261104b', s)).sort());
  assert.match(r.stdout, /copie output : 3 fichier\(s\) déposé\(s\)/);
  for (const s of TROIS) assert.equal(fs.readFileSync(path.join(output, nom('20261104b', s)), 'utf8'), fs.readFileSync(path.join(espace, nom('20261104b', s)), 'utf8'), `${s} : copie non conforme`);
  assert.ok(!fs.existsSync(path.join(output, 'old')), 'aucun indice précédent : pas de old/');
});

test('TF-2261 — le cas du retour : 20261104a déposé, 20261104b rendu → b déposé, a rangé sous old/ (rendu et compagnons)', () => {
  const { espace, output } = espaces();
  poser(output, '20261104a');
  fs.writeFileSync(path.join(output, 'Autre famille - 20261001a.html'), 'sans rapport');
  const r = rendre(espace, '20261104b', '--copie-output', output);
  assert.equal(r.status, 0, r.stderr);
  assert.deepEqual(lister(output), ['Autre famille - 20261001a.html', ...TROIS.map((s) => nom('20261104b', s)), 'old'].sort());
  assert.deepEqual(lister(path.join(output, 'old')), TROIS.map((s) => nom('20261104a', s)).sort());
  assert.equal(fs.readFileSync(path.join(output, 'old', nom('20261104a')), 'utf8'), 'ancien .html', 'le contenu rangé est celui de l\'indice précédent');
  assert.match(r.stdout, /3 indice\(s\) précédent\(s\) rangé\(s\) sous .*old/);
});

test('TF-2261 — rejouer le dépôt est idempotent : fichiers déjà identiques, rien à ranger, sortie 0', () => {
  const { espace, output } = espaces();
  assert.equal(rendre(espace, '20261104b', '--copie-output', output).status, 0);
  const avant = lister(output);
  const r = rendre(espace, '20261104b', '--copie-output', output);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /0 fichier\(s\) déposé\(s\).*3 déjà identique\(s\)/);
  assert.deepEqual(lister(output), avant);
});

test('TF-2261 — un fichier de même nom et de contenu différent est REFUSÉ (sortie 1) et RIEN n\'est écrit ni rangé', () => {
  const { espace, output } = espaces();
  poser(output, '20261104a');
  fs.writeFileSync(path.join(output, nom('20261104b')), 'contenu édité à la main');
  const avant = lister(output);
  const r = rendre(espace, '20261104b', '--copie-output', output);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, new RegExp(`« ${nom('20261104b').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} » existe déjà .* contenu différent : jamais écrasé`));
  assert.match(r.stderr, /rien n'a été écrit/);
  assert.deepEqual(lister(output), avant, 'le dossier de dépôt a changé malgré le refus');
  assert.equal(fs.readFileSync(path.join(output, nom('20261104b')), 'utf8'), 'contenu édité à la main');
  assert.ok(!fs.existsSync(path.join(output, 'old')));
});

test('TF-2261 — un indice PLUS RÉCENT déjà déposé fait refuser le dépôt d\'un indice plus ancien', () => {
  const { espace, output } = espaces();
  poser(output, '20261105a');
  const avant = lister(output);
  const r = rendre(espace, '20261104b', '--copie-output', output);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /plus récent que le rendu \(20261104b\)/);
  assert.deepEqual(lister(output), avant);
});

test('TF-2261 — un indice déjà rangé sous old/ avec un autre contenu n\'est jamais écrasé : refus, rien de déplacé', () => {
  const { espace, output } = espaces();
  poser(output, '20261104a', 'courant');
  poser(path.join(output, 'old'), '20261104a', 'archive différente');
  const r = rendre(espace, '20261104b', '--copie-output', output);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /existe déjà sous old\/ avec un contenu différent/);
  assert.ok(fs.existsSync(path.join(output, nom('20261104a'))), 'l\'indice précédent a été déplacé malgré le refus');
  assert.ok(!fs.existsSync(path.join(output, nom('20261104b'))), 'le rendu a été déposé malgré le refus');
});

test('TF-2261 — --copie-output sans dossier, ou suivi d\'une option, sort 2 et ne crée rien', () => {
  for (const valeur of [['--copie-output'], ['--copie-output', '--forme']]) {
    const { espace } = espaces();
    const r = node([BUILD, DATA, '--tenant', TENANT, '--out', path.join(espace, nom('20261104b')), ...valeur]);
    assert.equal(r.status, 2, r.stdout);
    assert.match(r.stderr, /--copie-output/);
    assert.deepEqual(lister(espace), [], 'un fichier a été écrit malgré le refus d\'usage');
  }
});

test('TF-2261 — le dossier de dépôt ne peut pas être celui du rendu', () => {
  const { espace } = espaces();
  const r = rendre(espace, '20261104b', '--copie-output', espace);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /rien à copier/);
});

test('TF-2261 — un rendu au nom hors convention est déposé tel quel, sans rangement, et le dit', () => {
  const { espace, output } = espaces();
  const r = node([BUILD, DATA, '--tenant', TENANT, '--out', path.join(espace, 'rapport-audit.html'), '--copie-output', output]);
  assert.equal(r.status, 0, r.stderr);
  assert.ok(fs.existsSync(path.join(output, 'rapport-audit.html')));
  assert.ok(!fs.existsSync(path.join(output, 'old')));
});

// ── Le contrôle : un output/ en retard sur l'espace d'audit ─────────────────────────────────────────────────────
test('TF-2261 — ROUGE : output/ garde 20261104a pendant que l\'espace porte 20261104b → refus (1) qui NOMME le fichier en retard', () => {
  const { espace, output } = espaces();
  assert.equal(rendre(espace, '20261104b').status, 0);
  poser(output, '20261104a');
  const r = node([CONTROLE, '--verifier', espace, output]);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /plus récent que/);
  assert.ok(r.stderr.includes(nom('20261104b')), 'le message ne nomme pas le fichier en retard');
  assert.match(r.stderr, /output\/ en retard sur l'espace d'audit/);
});

test('TF-2261 — ROUGE : un output/ vide est en retard sur un espace qui porte un rendu', () => {
  const { espace, output } = espaces();
  assert.equal(rendre(espace, '20261104b').status, 0);
  fs.mkdirSync(output, { recursive: true });
  const r = node([CONTROLE, '--verifier', espace, output]);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stderr, /aucun équivalent/);
});

test('TF-2261 — VERT : le remède que le message recommande (--copie-output) est joué et le contrôle passe', () => {
  const { espace, output } = espaces();
  assert.equal(rendre(espace, '20261104b').status, 0);
  poser(output, '20261104a');
  assert.equal(node([CONTROLE, '--verifier', espace, output]).status, 1);
  assert.equal(rendre(espace, '20261104b', '--copie-output', output).status, 0);
  const r = node([CONTROLE, '--verifier', espace, output]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /output\/ à jour : 3 famille\(s\)/);
});

test('TF-2261 — VERT : un output/ plus récent que l\'espace n\'est pas en retard ; un compagnon manquant l\'est', () => {
  const a = espaces();
  assert.equal(rendre(a.espace, '20261104b').status, 0);
  poser(a.output, '20261105a');
  assert.equal(node([CONTROLE, '--verifier', a.espace, a.output]).status, 0);
  const b = espaces();
  assert.equal(rendre(b.espace, '20261104b', '--copie-output', b.output).status, 0);
  fs.rmSync(path.join(b.output, nom('20261104b', '.controles-evalues.json')));
  const r = node([CONTROLE, '--verifier', b.espace, b.output]);
  assert.equal(r.status, 1, r.stdout);
  assert.ok(r.stderr.includes(nom('20261104b', '.controles-evalues.json')));
});

test('TF-2261 — le contrôle : usage (2) sans argument, avec un dossier absent, et sur un espace sans rendu', () => {
  assert.equal(node([CONTROLE]).status, 2);
  assert.equal(node([CONTROLE, '--verifier', path.join(racine, 'absent'), racine]).status, 2);
  const { espace, output } = espaces();
  fs.mkdirSync(output, { recursive: true });
  const r = node([CONTROLE, '--verifier', espace, output]);
  assert.equal(r.status, 2, r.stdout);
  assert.match(r.stderr, /rien à comparer/);
});

test('TF-2261 — l\'API : deposerCopie et verifierOutputAJour rendent leurs listes (rien n\'est écrit quand refus non vide)', () => {
  const { espace, output } = espaces();
  assert.equal(rendre(espace, '20261104b').status, 0);
  poser(output, '20261105a');
  const dep = deposerCopie({ rendu: path.join(espace, nom('20261104b')), dossier: output });
  assert.equal(dep.refus.length, 3, 'un refus par fichier plus récent déjà déposé');
  assert.deepEqual([dep.deposes, dep.ranges], [[], []]);
  const v = verifierOutputAJour({ espace, output });
  assert.deepEqual(v.erreurs, []);
  assert.equal(v.familles, 3);
});
