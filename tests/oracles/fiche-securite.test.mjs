// LA FICHE SÉCURITÉ : CE QUI EST DIFFUSÉ, ET SOUS QUEL NOM (TF-0700, TF-0701, TF-0697, TF-0693).
//
// Les quatre défauts figés ici ont tous été payés sur des livraisons réelles, en juillet et en
// août 2026, et aucun n'a été vu par une porte :
//
//   TF-0700 · le kit prescrivait la fiche en HTML et rien d'autre, alors que ce qui PART à
//             l'équipe sécurité est un PDF. Un format qu'aucun outil ne produit est un format
//             qu'on refait à la main : le tirage diffusé le 24/07 était une CAPTURE rasterisée
//             (1 page, 0 caractère extractible, 9 images, 653 Ko contre 124 Ko imprimé), et il
//             portait un indice ANTÉRIEUR au HTML déposé à côté de lui.
//   TF-0701 · le rapport d'audit avait une porte bloquante, la fiche n'en avait aucune — alors
//             que ses deux règles écrites (0 placeholder, lien DEV) sont mécaniques. Le seul
//             artefact relu était celui qui n'est pas diffusé.
//   TF-0697 · 32 % à 34 % de la page réservés à une colonne d'intitulés courts, sans
//             `table-layout:fixed` — la largeur déclarée n'était qu'un vœu.
//   TF-0693 · aucun allocateur d'indice dans la famille : quatre écrasements du même nom en
//             80 minutes, dont deux poussés, découverts par une question humaine.
//
// Lancer : node --test tests/oracles/fiche-securite.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORACLE = path.join(RACINE, 'oracles', 'verifier-fiche-securite.mjs');
const IMPRIMEUR = path.join(RACINE, 'tools', 'fiche-en-pdf.mjs');
const BUILD = path.join(RACINE, 'tools', 'build-fiche.mjs');
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');

const jouer = (outil, ...args) => spawnSync(process.execPath, [outil, ...args], { encoding: 'utf8', cwd: RACINE });
const temporaire = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fiche-t-'));

// ── L'AUTO-TEST DES DEUX OUTILS : la loi de qualité veut une fixture à double sens, et c'est
//    l'auto-test qui la porte. On l'exerce ici pour qu'une régression du contrôle lui-même
//    tombe dans la même batterie que le reste.
test('verifier-fiche-securite --self-test : le cas vert est accepté, chaque cas rouge est refusé', () => {
  const r = jouer(ORACLE, '--self-test');
  assert.equal(r.status, 0, `auto-test rouge : ${r.stdout}${r.stderr}`);
  assert.match(r.stdout, /11\/11 PASS/, 'le compte de cas exercés a changé sans que le test le dise');
});

test('fiche-en-pdf --self-test : la règle d\'indice mord, et preferCSSPageSize est MESURÉ', () => {
  const r = jouer(IMPRIMEUR, '--self-test');
  assert.equal(r.status, 0, `auto-test rouge : ${r.stdout}${r.stderr}`);
  // Sans moteur d'impression, l'étage de mesure est SAUTÉ et le dit : un SKIP motivé n'est pas
  // un PASS, et il ne doit pas non plus faire échouer une batterie sur un poste sans navigateur.
  assert.match(r.stdout, /(6\/6 PASS|SKIP MOTIVÉ)/,
    'ni les 6 cas ni un SKIP motivé : l\'auto-test ne dit plus ce qu\'il a joué');
});

// ── TF-0701 · LA PORTE. Une fiche réellement produite par la forge passe l'oracle ; chaque
//    défaut réellement constaté le fait sortir 1.
test('TF-0701 — la fiche produite par la forge passe la porte, et exit 0 vaut « diffusable »', () => {
  const prod = temporaire();
  try {
    const donnees = path.join(prod, 'data.json');
    fs.writeFileSync(donnees, JSON.stringify(Object.fromEntries([
      'projet', 'objet', 'equipe', 'hebergement', 'environnements', 'iac', 'classification', 'pii',
      'juridictions', 'analyses', 'criticite', 'disponibilite', 'impact', 'exposition',
      'point_controle', 'authentification', 'ia_presente', 'ia_usage', 'ia_gardefous',
      'observabilite', 'alerting', 'sauvegardes', 'tags', 'budget', 'porteur', 'business_owner',
    ].map((k) => [k, `valeur ${k}`]).concat([['lien_dev', 'https://dev.exemple.test/app']]))), 'utf8');
    const b = jouer(BUILD, TENANT, '--data', donnees, '--produit', prod, '--sans-pdf');
    assert.equal(b.status, 0, `génération rouge : ${b.stderr}`);
    const fiche = trouverFiche(prod);

    // Sans PDF à côté, la porte REFUSE : un jeu incomplet n'est pas diffusable.
    let r = jouer(ORACLE, fiche, '--json-only');
    assert.equal(r.status, 1, 'une fiche SANS son PDF de diffusion est déclarée diffusable');
    assert.match(r.stdout, /FS6/, 'le refus ne nomme pas la règle du PDF manquant');

    // L'écart DÉCLARÉ, lui, rend un SKIP motivé et laisse la porte verte sur le reste.
    r = jouer(ORACLE, fiche, '--sans-pdf', '--json-only');
    assert.equal(r.status, 0, `la fiche complète est refusée : ${r.stdout}`);
    const rapport = JSON.parse(r.stdout);
    for (const regle of ['FS1', 'FS2', 'FS3', 'FS3bis', 'FS4', 'FS5'])
      assert.equal(rapport.findings.find((f) => f.regle === regle)?.statut, 'PASS',
        `${regle} n'est pas vert sur une fiche pourtant complète`);
    assert.ok(rapport.non_juge.length >= 3, 'un oracle qui ne déclare pas ce qu\'il ne juge pas ment par omission');
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

test('TF-0701 — un placeholder résiduel fait sortir 1 : le squelette n\'est pas diffusable', () => {
  const prod = temporaire();
  try {
    const b = jouer(BUILD, TENANT, '--produit', prod, '--sans-pdf');
    assert.equal(b.status, 0, `génération rouge : ${b.stderr}`);
    const r = jouer(ORACLE, trouverFiche(prod), '--sans-pdf', '--json-only');
    assert.equal(r.status, 1, 'le SQUELETTE, plein de {{…}}, est déclaré diffusable');
    assert.match(r.stdout, /FS1/, 'le refus ne nomme pas la règle du placeholder');
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

// ── TF-0697 · LA MISE EN PAGE. Ce que la forge produit ne réserve plus le tiers de la page à
//    des intitulés courts, et la largeur déclarée est TENUE (table-layout fixe).
test('TF-0697 — la colonne d\'intitulés ne mange plus la page, et sa largeur n\'est plus un vœu', () => {
  const prod = temporaire();
  try {
    jouer(BUILD, TENANT, '--produit', prod, '--sans-pdf');
    const html = fs.readFileSync(trouverFiche(prod), 'utf8');
    const largeur = Number(/th\s*\{[^}]*\bwidth\s*:\s*([\d.]+)%/.exec(html)?.[1]);
    assert.ok(largeur <= 25, `colonne d'intitulés à ${largeur} % — mesuré avant correction : 34 %, `
      + 'soit 12 points de largeur de page pris à la colonne qui porte les paragraphes');
    assert.match(html, /table-layout\s*:\s*fixed/,
      'sans `table-layout:fixed`, la largeur déclarée n\'est qu\'un vœu : le moteur ré-élargit la '
      + 'colonne dès qu\'un libellé s\'allonge — c\'est la moitié du correctif, et celle qu\'on oublie');
    assert.match(html, /overflow-wrap\s*:\s*break-word/,
      'sans coupure de mot, une URL sans espace rouvre la table de force et le gain est repris');
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

// ── TF-0693 · L'INDICE. Le nom du livrable, et la référence imprimée DEDANS.
test('TF-0693 — deux générations du jour à contenus différents portent a puis b', () => {
  const prod = temporaire();
  try {
    assert.equal(jouer(BUILD, TENANT, '--produit', prod, '--sans-pdf').status, 0);
    const donnees = path.join(prod, 'd.json');
    fs.writeFileSync(donnees, JSON.stringify({ projet: 'PLX', lien_dev: 'https://dev.exemple.test/plx' }), 'utf8');
    assert.equal(jouer(BUILD, TENANT, '--data', donnees, '--produit', prod, '--sans-pdf').status, 0);
    const noms = fichesDe(prod).map((f) => path.basename(f)).sort();
    assert.equal(noms.length, 2, `${noms.length} fichier(s) : ${noms.join(', ')} — quatre écrasements du `
      + 'même nom en 80 minutes est le défaut fondateur ; deux contenus différents doivent faire deux fichiers');
    assert.match(noms[0], /-\d{8}a\.html$/, `premier indice inattendu : ${noms[0]}`);
    assert.match(noms[1], /-\d{8}b\.html$/, `second indice inattendu : ${noms[1]}`);
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

test('TF-0693 — le MÊME contenu regénéré garde SON indice : un outil ne pond pas un fichier par lancement', () => {
  const prod = temporaire();
  try {
    for (let i = 0; i < 3; i++) assert.equal(jouer(BUILD, TENANT, '--produit', prod, '--sans-pdf').status, 0);
    const noms = fichesDe(prod);
    assert.equal(noms.length, 1, `${noms.length} fichiers pour trois générations à contenu identique — `
      + 'une régénération inchangée n\'est pas une nouvelle version');
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

test('TF-0693 — la référence imprimée DANS la fiche porte l\'indice du NOM du fichier', () => {
  const prod = temporaire();
  try {
    jouer(BUILD, TENANT, '--produit', prod, '--sans-pdf');
    const fiche = trouverFiche(prod);
    const indiceNom = /(\d{8}[a-z])\.html$/.exec(path.basename(fiche))[1];
    const html = fs.readFileSync(fiche, 'utf8');
    const refs = [...html.matchAll(/[A-Z0-9]{2,6}-SEC-DEV-(\d{8}[a-z])/g)].map((m) => m[1]);
    assert.ok(refs.length >= 2, 'la référence n\'est pas imprimée aux DEUX bouts (en-tête et pied) : '
      + 'une page détachée du reste ne dirait plus de quelle révision elle vient');
    for (const r of refs)
      assert.equal(r, indiceNom, `le nom porte ${indiceNom} et la référence imprimée porte ${r} — `
        + 'la divergence est invisible tant qu\'on n\'ouvre pas les deux, et c\'est ce qui a été relevé à la main');
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

test('TF-0693 — porteur et Business Owner identiques : le gabarit le DIT au lieu de le laisser déduire', () => {
  const prod = temporaire();
  try {
    const d = path.join(prod, 'd.json');
    fs.writeFileSync(d, JSON.stringify({ porteur: 'A. Martin', business_owner: 'a. martin' }), 'utf8');
    jouer(BUILD, TENANT, '--data', d, '--produit', prod, '--sans-pdf');
    const html = fs.readFileSync(trouverFiche(prod), 'utf8');
    assert.match(html, /aucune relecture croisée entre construire et valider/,
      'les deux rôles tenus par la même personne passent en silence — c\'est un fait qu\'un responsable '
      + 'sécurité doit LIRE, pas déduire en comparant deux lignes');
    // Le sens inverse : deux personnes distinctes ne déclenchent pas la phrase.
    fs.writeFileSync(d, JSON.stringify({ porteur: 'A. Martin', business_owner: 'B. Durand' }), 'utf8');
    const prod2 = temporaire();
    try {
      jouer(BUILD, TENANT, '--data', d, '--produit', prod2, '--sans-pdf');
      assert.doesNotMatch(fs.readFileSync(trouverFiche(prod2), 'utf8'), /aucune relecture croisée/,
        'la phrase apparaît alors que les deux rôles sont tenus par des personnes différentes');
    } finally { fs.rmSync(prod2, { recursive: true, force: true }); }
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

// ── TF-0700 · L'INDICE DU PDF. Le second défaut du dossier du 24/07, refusé sans navigateur.
test('TF-0700 — un PDF d\'indice différent de son HTML est REFUSÉ (le défaut du 24/07)', () => {
  const dir = temporaire();
  try {
    const html = path.join(dir, 'ACM - Fiche - Dev - 20260902d.html');
    fs.writeFileSync(html, '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>t</title></head><body>x</body></html>', 'utf8');
    const r = jouer(IMPRIMEUR, html, '--out', path.join(dir, 'ACM - Fiche - Dev - 20260902c.pdf'));
    assert.equal(r.status, 1, `exit ${r.status} : un PDF d'indice c imprimé depuis un HTML d'indice d est accepté`);
    assert.match(r.stderr, /indice divergent/i, 'le refus ne dit pas POURQUOI');
    assert.ok(!fs.existsSync(path.join(dir, 'ACM - Fiche - Dev - 20260902c.pdf')),
      'le refus a quand même écrit un tirage');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('TF-0700 — le kit compliance emporte l\'outil d\'impression ET la porte de la fiche', () => {
  // Un format qu'aucun outil ne produit est un format qu'on refait à la main : c'est la cause
  // racine du PDF capturé. La correction n'est complète que si le KIT les emporte.
  const zip = fs.readFileSync(dernierKit('Kit Compliance Pack')).toString('latin1');
  assert.ok(zip.includes('fiche-en-pdf.mjs'), 'le kit compliance ne fournit pas l\'outil d\'impression');
  assert.ok(zip.includes('verifier-fiche-securite.mjs'), 'le kit compliance ne fournit pas la porte de la fiche');
  const skill = fs.readFileSync(path.join(RACINE, 'deliverables', 'templates', 'compliance-skill.template.md'), 'utf8');
  assert.match(skill, /jamais capturé/i, 'le skill ne prescrit pas l\'impression contre la capture');
  assert.match(skill, /MÊME indice/, 'le skill ne pose pas la règle d\'indice');
  assert.match(skill, /verifier-fiche-securite\.mjs[\s\S]{0,200}exit code = 0/,
    'le skill ne pose pas la porte bloquante de la fiche, symétrique de celle du rapport');
});

// ── LA CHAÎNE ENTIÈRE, sur la fiche d'exemple du dépôt. Sautée — en le DISANT — sur un poste
//    sans moteur d'impression : un SKIP motivé n'est pas un PASS, et il ne doit pas non plus
//    faire échouer une batterie pour une raison qui n'a rien à voir avec le livrable.
test('TF-0700 — bout en bout : la fiche ACME est IMPRIMÉE, relue par verifier-pdf, et passe la porte', async (t) => {
  const { trouverNavigateur } = await import(path.join(RACINE, 'tools', 'fiche-en-pdf.mjs').replace(/\\/g, '/').replace(/^/, 'file:///'));
  if (!trouverNavigateur()) {
    t.skip("aucun moteur d'impression sur ce poste — le tirage réel n'est PAS jugé ici (SKIP motivé)");
    return;
  }
  const prod = temporaire();
  try {
    const d = path.join(prod, 'd.json');
    fs.writeFileSync(d, JSON.stringify({ projet: 'ACM', lien_dev: 'https://dev.exemple.test/acm' }), 'utf8');
    const b = jouer(BUILD, TENANT, '--data', d, '--produit', prod);
    assert.equal(b.status, 0, `la passe HTML+PDF est rouge : ${b.stdout}${b.stderr}`);
    const fiche = trouverFiche(prod);
    const pdf = fiche.replace(/\.html$/, '.pdf');
    assert.ok(fs.existsSync(pdf), 'le PDF de diffusion n\'a pas été écrit : le jeu remis serait incomplet');

    // `verifier-pdf` accepte le tirage : format lu dans le fichier, pages comptées, fraîcheur.
    const v = jouer(path.join(RACINE, 'oracles', 'verifier-pdf.mjs'), pdf, '--format', 'A4',
      '--pages-max', '1', '--source', fiche, '--json-only');
    assert.equal(v.status, 0, `verifier-pdf refuse le tirage : ${v.stdout}`);

    // Et ce tirage porte du TEXTE : c'est ce qui le sépare de la capture diffusée le 24/07.
    const o = jouer(ORACLE, fiche, '--json-only');
    const rapport = JSON.parse(o.stdout);
    const fs7 = rapport.findings.find((f) => f.regle === 'FS7');
    assert.equal(fs7.statut, 'PASS', `FS7 refuse un tirage pourtant imprimé : ${fs7.message}`);
    assert.match(fs7.message, /^\d{3,}\s+unités/, `FS7 ne rapporte pas sa mesure : ${fs7.message}`);
    assert.equal(rapport.findings.find((f) => f.regle === 'FS6').statut, 'PASS',
      'le PDF produit dans la même passe n\'a pas le même indice que son HTML');
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

// ── Utilitaires ──────────────────────────────────────────────────────────────────────────────
function fichesDe(racine) {
  const out = [];
  const marcher = (d) => {
    if (!fs.existsSync(d)) return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const c = path.join(d, e.name);
      if (e.isDirectory()) marcher(c);
      else if (/^fiche-securite-.*\.html$/.test(e.name)) out.push(c);
    }
  };
  marcher(path.join(racine, 'output'));
  return out.sort();
}
function trouverFiche(racine) {
  const f = fichesDe(racine);
  assert.equal(f.length, 1, `${f.length} fiche(s) trouvée(s) sous ${racine}`);
  return f[0];
}
function dernierKit(motif) {
  const dir = path.join(RACINE, 'deliverables', 'generated', 'acme');
  const lister = () => (fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.includes(motif) && f.endsWith('.zip')).sort() : []);
  let zips = lister();
  if (!zips.length) {
    // Le job d'oracles ne fabrique pas les kits (c'est l'autre job) : on le fait ici plutôt que
    // de dépendre d'un artefact produit ailleurs — un test qui suppose l'ordre des jobs est un
    // test qui passe en local et tombe en intégration.
    const b = jouer(path.join(RACINE, 'tools', 'build-kit.mjs'),
      path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml'), '--kind', 'compliance');
    assert.equal(b.status, 0, `fabrication du kit rouge : ${b.stdout}${b.stderr}`);
    zips = lister();
  }
  assert.ok(zips.length, `aucun kit « ${motif} » n'a pu être fabriqué`);
  return path.join(dir, zips[zips.length - 1]);
}
