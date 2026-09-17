// Non-régression du contrôle d'audit 8 : modèle sémantique Power BI jugé sur ses fichiers TMDL
// (TF-0862, lot L5 de l'étude d'opportunité du pilot du 07/09/2026). Double sens : la fixture
// verte (étoile à trois tables, table de dates marquée, une relation active par paire, modes
// homogènes, un rôle) rend OK ; la fixture rouge (mesure dupliquée entre deux tables, deux
// relations actives sur la même paire, relation vers une table absente, filtrage bidirectionnel,
// aucune table de dates, partition sans mode, modes hétérogènes, aucun rôle) rend BLOQUANT en
// nommant CHAQUE règle MS1-MS6 sauf MS1 (le modèle rouge a bien des tables et des relations).
//
// Lancer :  node --test tests/oracles/modele-semantique.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ORACLE = path.join(HERE, '..', '..', 'oracles', 'verifier-modele-semantique.mjs');
const FIX = path.join(HERE, '..', 'fixtures', 'oracles', 'modele-semantique');
const run = (args) => spawnSync(process.execPath, [ORACLE, ...args], { encoding: 'utf8', timeout: 60000 });
const rapport = (r) => JSON.parse(r.stdout.slice(0, r.stdout.lastIndexOf('}') + 1));

test('modèle sémantique vert : étoile lisible, table de dates marquée, une mesure par nom, un rôle → OK (exit 0)', () => {
  const r = run(['--modele', path.join(FIX, 'verte')]);
  assert.equal(r.status, 0, r.stdout);
  const j = rapport(r);
  assert.equal(j.verdict, 'OK');
  assert.equal(j.lu.tables, 3);
  assert.equal(j.lu.relations, 2);
  assert.equal(j.lu.roles, 1);
  assert.ok(Array.isArray(j.non_juge) && j.non_juge.length >= 3, 'ce qui n\'est pas jugé est déclaré');
});

test('modèle sémantique rouge : mesure dupliquée, relations ambiguës, pas de table de dates, mode absent, aucun rôle → BLOQUANT (exit 1)', () => {
  const r = run(['--modele', path.join(FIX, 'rouge')]);
  assert.equal(r.status, 1);
  const j = rapport(r);
  assert.equal(j.verdict, 'BLOQUANT');
  const regles = new Set(j.findings.map(f => f.regle));
  for (const attendue of ['MS2', 'MS3', 'MS4', 'MS5', 'MS6']) assert.ok(regles.has(attendue), `règle ${attendue} attendue dans les constats`);
  assert.match(r.stdout, /Montant HT/, 'la mesure dupliquée est nommée');
  assert.match(r.stdout, /deux relations ACTIVES/, 'l\'ambiguïté de chemin est nommée');
  assert.match(r.stdout, /Produit\.produit_sk/, 'la relation vers une table absente est localisée');
  assert.match(r.stdout, /CTL-D05-13/, 'chaque règle nomme le contrôle AuditCore qu\'elle mécanise');
});

// ── TF-1175 · UN PASS D'AUDIT N'EST PAS « LIVRABLE VÉRIFIÉ » ─────────────────────────────────
// Le fait, le 17/09/2026 : un projet Power BI généré passe 22 contrôles de recette et 7 contrôles
// d'audit, est publié sur GO humain, et ne rend AUCUN visuel — référence de source PBIR invalide,
// « Chargement… » sans fin, export PDF de 943 octets et 0 caractère après 560 s. 29 contrôles PASS
// sur un livrable invisible. Aucun de ces défauts n'est visible d'un contrôle qui LIT le fichier.
// Cet oracle-ci lit des fichiers TMDL : son périmètre est légitime, sa réserve ne l'était pas —
// elle n'existait pas. Les deux sens portent sur la DÉCLARATION, pas sur le verdict :
//   ROUGE · un projet PBIP dont le modèle est irréprochable et dont le rapport est cassé (le
//           défaut réel recopié en fixture) rend OK, exit 0. C'est vrai, et c'est le piège : le
//           contrôle DOIT alors dire que le rendu n'est pas jugé, NOMMER le rapport qu'il laisse
//           de côté et le geste qui manque. Sans ces trois phrases, ce OK se relit « vérifié ».
//   VERT  · un modèle SANS rapport à côté porte la même réserve générique, sans inventer un nom
//           de rapport qui n'existe pas — une réserve devinée ne vaut pas mieux qu'un silence.
test('TF-1175 — sur un projet PBIP au rapport CASSÉ, le modèle rend OK et le contrôle refuse de se faire lire « livrable vérifié »', () => {
  const r = run(['--modele', path.join(FIX, 'projet-pbip', 'Exemple.SemanticModel', 'definition')]);
  assert.equal(r.status, 0, r.stdout);
  const j = rapport(r);
  assert.equal(j.verdict, 'OK', 'le modèle de la fixture est irréprochable : c\'est ce qui rend le piège réel');

  const declaration = j.non_juge.join('\n');
  assert.match(declaration, /RENDU DU RAPPORT DANS L'OUTIL/,
    'le rapport JSON ne déclare pas que le rendu n\'est pas jugé — un PASS se relira « livrable vérifié »');
  assert.match(declaration, /ne vaut PAS « livrable vérifié »/,
    'la déclaration ne dit pas ce que le OK NE vaut pas');
  assert.match(declaration, /ExportTo/,
    'le geste de vérification manquant n\'est pas nommé : un « ce n\'est pas jugé » sans geste ne se rattrape pas');
  assert.match(declaration, /Exemple\.Report/,
    'le rapport laissé de côté n\'est pas NOMMÉ — une réserve générique s\'oublie, une réserve qui nomme se remarque');

  // Et la réserve est LÀ OÙ LE VERDICT SE LIT, pas seulement dans un JSON que personne n'ouvre.
  assert.match(r.stdout, /verdict : OK — Aucun constat bloquant ni majeur \(MS1-MS6\) SUR LE MODÈLE/,
    'la ligne de verdict ne borne pas sa portée au modèle');
  assert.match(r.stdout, /non jugé : LE RENDU DU RAPPORT DANS L'OUTIL[\s\S]*Exemple\.Report/,
    'la ligne lisible ne porte pas la réserve avec le nom du rapport non jugé');
  assert.match(r.stdout, /geste manquant : [\s\S]*TÉLÉCHARGER le fichier produit/,
    'la ligne lisible ne nomme pas le geste manquant — c\'est le « Succeeded » cru sans téléchargement qui a coûté deux jours');
});

test('TF-1175 — sans rapport à côté, la réserve reste, et aucun nom de rapport n\'est inventé', () => {
  const r = run(['--modele', path.join(FIX, 'verte')]);
  assert.equal(r.status, 0, r.stdout);
  const j = rapport(r);
  const declaration = j.non_juge.join('\n');
  assert.match(declaration, /RENDU DU RAPPORT DANS L'OUTIL/, 'la réserve disparaît quand aucun rapport n\'est visible');
  assert.doesNotMatch(declaration, /rapport\(s\) PRÉSENT\(S\)/,
    'un rapport est déclaré présent alors qu\'aucun ne l\'est : une réserve devinée n\'est pas une mesure');
  assert.doesNotMatch(r.stdout, /rapport\(s\) non jugé\(s\) ici/,
    'la ligne de verdict nomme des rapports inexistants');
});

test('usage : dossier absent → exit 2, jamais un OK par défaut', () => {
  const r = run(['--modele', path.join(FIX, 'inexistant')]);
  assert.equal(r.status, 2);
});
