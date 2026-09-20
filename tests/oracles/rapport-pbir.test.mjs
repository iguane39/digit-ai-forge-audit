// Non-régression du contrôle d'audit 9 : FORME NATIVE DES EXPRESSIONS PBIR d'un rapport Power BI
// (TF-1183, reste déclaré de TF-1175 / RF-21 (2) du lot « Produit-62 - RETOURS - 20260917a »).
//
// Le trou que ces tests ferment : le 17/09/2026, 29 contrôles PASS sur un rapport qui ne rendait
// AUCUN visuel, parce qu'aucun d'eux ne jugeait la FORME du fichier de rapport. La fixture du
// défaut réel vivait déjà dans ce dépôt (`modele-semantique/projet-pbip/Exemple.Report/`) et
// n'était lue par PERSONNE : l'oracle de modèle sémantique se contentait de la NOMMER comme non
// jugée. Elle est désormais jugée, et c'est le troisième test ci-dessous.
//
// Double sens : la fixture verte (SourceRef résolubles, alias uniques, aucune projection
// désactivée, en-têtes déclarés) rend OK ; la fixture rouge réunit les quatre défauts et nomme
// CHAQUE règle PB1-PB4.
//
// Lancer :  node --test tests/oracles/rapport-pbir.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ORACLE = path.join(HERE, '..', '..', 'oracles', 'verifier-rapport-pbir.mjs');
const FIX = path.join(HERE, '..', 'fixtures', 'oracles', 'rapport-pbir');
const FIX_MS = path.join(HERE, '..', 'fixtures', 'oracles', 'modele-semantique');
const run = (args) => spawnSync(process.execPath, [ORACLE, ...args], { encoding: 'utf8', timeout: 60000 });
const rapport = (r) => JSON.parse(r.stdout.slice(0, r.stdout.lastIndexOf('}') + 1));

test('rapport PBIR vert : SourceRef résolubles, alias uniques, aucune projection désactivée, en-têtes déclarés → OK (exit 0)', () => {
  const r = run(['--rapport', path.join(FIX, 'verte')]);
  assert.equal(r.status, 0, r.stdout);
  const j = rapport(r);
  assert.equal(j.verdict, 'OK');
  assert.equal(j.lu.fichiers, 1);
  assert.deepEqual(j.findings, [], 'la forme attendue ne doit produire AUCUN constat — sinon la règle est un piège à faux positifs');
  assert.ok(Array.isArray(j.non_juge) && j.non_juge.length >= 3, 'ce qui n\'est pas jugé est déclaré');
});

test('rapport PBIR rouge : les quatre défauts de forme sont nommés, chacun localisé → BLOQUANT (exit 1)', () => {
  const r = run(['--rapport', path.join(FIX, 'rouge')]);
  assert.equal(r.status, 1);
  const j = rapport(r);
  assert.equal(j.verdict, 'BLOQUANT');
  const regles = new Set(j.findings.map(f => f.regle));
  for (const attendue of ['PB1', 'PB2', 'PB3', 'PB4']) assert.ok(regles.has(attendue), `règle ${attendue} attendue dans les constats`);

  // PB1 dans ses DEUX sens : la forme d'entrée de From recopiée, et l'alias qui ne se résout pas.
  const pb1 = j.findings.filter(f => f.regle === 'PB1');
  assert.equal(pb1.length, 2, 'PB1 doit attraper le {Entity, Name} ET le Source orphelin');
  assert.ok(pb1.some(f => /ENTRÉE DE From recopiée/.test(f.msg)), 'le défaut du 17/09 n\'est pas nommé pour ce qu\'il est');
  assert.ok(pb1.some(f => /ne correspond à aucun alias du From en portée/.test(f.msg)), 'un Source non résolu passe');

  assert.match(r.stdout, /alias « v » déclaré deux fois/, 'l\'alias dupliqué est nommé');
  assert.match(r.stdout, /active: false/, 'la projection désactivée est nommée');
  assert.match(r.stdout, /CTL-D08-01/, 'chaque règle nomme le contrôle AuditCore qu\'elle mécanise');
  assert.match(r.stdout, /CTL-D11-01/, 'la règle d\'en-tête nomme son contrôle');

  // Une localisation sans pointeur est une localisation inutilisable : chaque constat porte le
  // fichier ET le chemin JSON où corriger.
  for (const f of j.findings) assert.match(f.where, /visual\.json @ \$\./, `constat ${f.regle} mal localisé : ${f.where}`);
});

test('TF-1183 — le défaut RÉEL du 17/09, déjà en fixture et jugé par personne, est désormais BLOQUANT', () => {
  const r = run(['--rapport', path.join(FIX_MS, 'projet-pbip', 'Exemple.Report')]);
  assert.equal(r.status, 1, 'le rapport qui n\'a rendu aucun visuel le 17/09 doit sortir 1');
  const j = rapport(r);
  assert.equal(j.verdict, 'BLOQUANT');
  assert.ok(j.findings.some(f => f.regle === 'PB1' && /Entity: "Ventes", Name: "v"/.test(f.msg)),
    'la référence de source réellement fautive n\'est pas pointée');
});

test('un SourceRef { Entity } SEUL reste licite — la règle ne doit pas condamner la forme normale', () => {
  const r = run(['--rapport', path.join(FIX, 'verte')]);
  const j = rapport(r);
  assert.ok(!j.findings.some(f => f.regle === 'PB1'),
    'la fixture verte porte deux SourceRef { Entity } seuls : les condamner ferait de cet oracle un bruit');
});

test('un dossier sans définition lisible n\'est JAMAIS un OK par défaut', () => {
  // La fixture verte du modèle sémantique ne contient que des .tmdl : aucune définition PBIR.
  const r = run(['--rapport', path.join(FIX_MS, 'verte')]);
  assert.equal(r.status, 1);
  const j = rapport(r);
  assert.equal(j.lu.fichiers, 0);
  assert.ok(j.findings.some(f => f.regle === 'PB0'), 'un dossier vide de définition doit sortir un constat, pas un PASS');
});

test('usage : dossier absent → exit 2, jamais un OK par défaut', () => {
  const r = run(['--rapport', path.join(FIX, 'inexistant')]);
  assert.equal(r.status, 2);
});
