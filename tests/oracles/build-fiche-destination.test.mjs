// TF-0505 (22/08/2026) — OÙ NAÎT UN LIVRABLE. Non-régression sur les trois seules destinations
// admises par `tools/build-fiche.mjs`, et sur la marque de destinataire qu'il pose.
//
// Le fait fondateur. La destination par défaut était
// `deliverables/generated/<tenant>/fiche-securite.html`, c'est-à-dire DANS LE DÉPÔT DE LA FORGE,
// sous une arborescence de travail — exactement le cas que TF-0319 nomme : « pas au fond de
// dossiers de travail imbriqués où l'utilisateur doit naviguer et finit par se perdre ». `--out`
// existait, mais rien n'exigeait de s'en servir, et un chemin par défaut est le chemin qui sera
// pris. Mesuré le 22/08 : la fiche a fini à la racine du produit, hors `output\`, en violation de
// R-2 et R-39 — et aucun oracle ne pouvait le voir, faute de marque (TF-0504).
//
// Ce qui est figé ici, dans les deux sens :
//   1. sans destination, le générateur REFUSE (exit 2) — le refus EST le correctif ;
//   2. `--produit <racine>` rend dans la famille `NN-audit` d'`output\` du produit, en RÉUTILISANT
//      la famille existante (le numéro est localement stable, R-39 al. 2) ;
//   3. le dépôt de la forge ne reçoit RIEN dans les deux cas ;
//   4. le livrable porte `<meta name="destinataire" content="humain">` — sans quoi R-2 ne le voit
//      pas, et son mauvais rangement passe inaperçu par construction.
//
// Ce test porte sur les DESTINATIONS, pas sur l'impression : il passe donc --sans-pdf partout
// (02/09/2026). Sans lui, une batterie de destinations echouerait sur un poste sans navigateur —
// un test qui exige autre chose que ce qu'il pretend juger est un test qui ment sur son motif.
// Le tirage PDF, lui, est juge par tests/oracles/fiche-securite.test.mjs.
// Lancer : node --test tests/oracles/build-fiche-destination.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUTIL = path.join(RACINE, 'tools', 'build-fiche.mjs');
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');

const lancer = (...args) => spawnSync(process.execPath, [OUTIL, TENANT, ...args], { encoding: 'utf8', cwd: RACINE });
const fichiers = (racine) => {
  const sortie = [];
  const marcher = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const c = path.join(d, e.name);
      if (e.isDirectory()) marcher(c); else sortie.push(path.relative(racine, c));
    }
  };
  marcher(racine);
  return sortie;
};

test('sans destination, le générateur REFUSE — il n\'écrit plus dans le dépôt de la forge', () => {
  const avant = fichiers(path.join(RACINE, 'deliverables', 'generated'));
  const r = lancer();
  assert.equal(r.status, 2, `exit ${r.status} attendu 2 — un défaut commode est ce qui a produit le défaut`);
  assert.match(r.stderr, /depot de la forge/i, 'le refus ne dit pas POURQUOI');
  assert.match(r.stderr, /--produit/, 'le refus ne nomme pas la voie à prendre');
  assert.deepEqual(fichiers(path.join(RACINE, 'deliverables', 'generated')), avant,
    'le refus a quand même écrit dans le dépôt de la forge');
});

test('--produit rend dans la famille NN-audit d\'output\\, et RIEN d\'autre n\'apparaît', () => {
  const prod = fs.mkdtempSync(path.join(os.tmpdir(), 'fiche-prod-'));
  try {
    fs.mkdirSync(path.join(prod, 'output', '01-revues'), { recursive: true });
    const avantForge = fichiers(path.join(RACINE, 'deliverables', 'generated'));
    const r = lancer('--produit', prod, '--sans-pdf');
    assert.equal(r.status, 0, `exit ${r.status} : ${r.stderr}`);

    const produits = fichiers(prod).filter(f => f.endsWith('.html'));
    assert.equal(produits.length, 1, `${produits.length} fichier(s) HTML — un seul livrable attendu`);
    // `01-revues` occupe le 01 : la famille prend le premier numéro libre, et pas un numéro fixe.
    // Le nom porte son JOUR et son INDICE depuis TF-0693 : quatre écrasements du même nom en
    // 80 minutes, dont deux poussés, avaient été payés sur un produit faute de cette lettre.
    assert.match(produits[0].split(path.sep).join('/'), /^output\/02-audit\/fiche-securite-acme-\d{8}[a-z]\.html$/,
      `rendu à « ${produits[0]} » — attendu sous output/NN-audit/, daté et indicé`);
    assert.deepEqual(fichiers(path.join(RACINE, 'deliverables', 'generated')), avantForge,
      'le dépôt de la forge a reçu quelque chose alors que la cible est le produit');
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

test('une famille NN-audit EXISTANTE est réutilisée — un numéro local ne se renumérote pas', () => {
  const prod = fs.mkdtempSync(path.join(os.tmpdir(), 'fiche-prod-'));
  try {
    // 07 est un numéro arbitraire déjà attribué : le générateur doit le RETROUVER, pas en créer un.
    fs.mkdirSync(path.join(prod, 'output', '07-audit'), { recursive: true });
    const r = lancer('--produit', prod, '--sans-pdf');
    assert.equal(r.status, 0, `exit ${r.status} : ${r.stderr}`);
    const produits = fichiers(prod).filter(f => f.endsWith('.html'));
    assert.match(produits[0].split(path.sep).join('/'), /^output\/07-audit\//,
      `rendu à « ${produits[0]} » — la famille existante 07-audit devait être réutilisée : un chemin qui bouge casse les liens déjà écrits`);
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

test('le livrable porte la marque de destinataire — sans elle, R-2 ne le voit pas', () => {
  const prod = fs.mkdtempSync(path.join(os.tmpdir(), 'fiche-prod-'));
  try {
    const cible = path.join(prod, 'fiche.html');
    const r = lancer('--out', cible, '--sans-pdf');
    assert.equal(r.status, 0, `exit ${r.status} : ${r.stderr}`);
    const html = fs.readFileSync(cible, 'utf8');
    assert.match(html, /<meta\s+name="destinataire"\s+content="humain">/,
      'marque absente — le document échapperait à R-2 par construction, pas par oubli du producteur');
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

test('--out reste honoré tel quel : build-kit.mjs en dépend', () => {
  const prod = fs.mkdtempSync(path.join(os.tmpdir(), 'fiche-prod-'));
  try {
    const cible = path.join(prod, 'sous', 'dossier', 'fiche-securite.html');
    const r = lancer('--out', cible, '--sans-pdf');
    assert.equal(r.status, 0, `exit ${r.status} : ${r.stderr}`);
    assert.ok(fs.existsSync(cible), '--out non honoré — build-kit.mjs rendrait dans le vide');
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});
