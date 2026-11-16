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
import { verdictNavigateur } from '../verdicts.mjs';
import { juger, lignesDeChamps, versionsCitees } from '../../oracles/verifier-fiche-securite.mjs';

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
  assert.match(r.stdout, /26\/26 PASS/,'le compte de cas exercés a changé sans que le test le dise');
});

test('fiche-en-pdf --self-test : la règle d\'indice mord, et preferCSSPageSize est MESURÉ', () => {
  const r = jouer(IMPRIMEUR, '--self-test');
  assert.equal(r.status, 0, `auto-test rouge : ${r.stdout}${r.stderr}`);
  // Sans moteur d'impression, l'étage de mesure est SAUTÉ et le dit : un SKIP motivé n'est pas
  // un PASS, et il ne doit pas non plus faire échouer une batterie sur un poste sans navigateur.
  assert.match(r.stdout, /(6\/6 PASS|SKIP MOTIVÉ)/,
    'ni les 6 cas ni un SKIP motivé : l\'auto-test ne dit plus ce qu\'il a joué');
});

// ── TF-2536 · LE CANEVAS PORTE LA LIGNE QUE FS12 LIT. FS12 (TF-2419) compare la version que la fiche CITE à
//    la dernière étiquette déployée ; or aucun canevas ne posait cette ligne : sur une fiche née du canevas,
//    FS12 rendait SKIP (« aucune version citée ») — inerte. Le canevas, dans ses deux langues, reçoit une ligne
//    « Version déployée » / « Deployed version » ; ce test instancie le canevas (la ligne de tableau markdown
//    devient une ligne de fiche), pose la version à la place du trou, et REJOUE FS12. Sens rouge : le même
//    canevas privé de sa ligne ne cite aucune version (le défaut d'avant).
for (const [langue, fichier] of [['fr', 'fiche-securite.template.md'], ['en', 'fiche-securite.template.en.md']]) {
  const canevas = fs.readFileSync(path.join(RACINE, 'deliverables', 'templates', fichier), 'utf8');
  const enLignes = (md, version) => md.split(/\r?\n/)
    .filter((l) => /^\|[^|]+\|[^|]+\|$/.test(l.trim()))
    .map((l) => l.trim().slice(1, -1).split('|'))
    .map(([i, v]) => `<tr><th>${i.replace(/\*\*/g, '').trim()}</th><td>${/\{\{\s*projet\.version_deployee/.test(v) ? version : 'valeur'}</td></tr>`)
    .join('\n');
  const fiche = (md, version) => `<table>${enLignes(md, version)}</table>`;
  const sansLigne = (md) => md.split(/\r?\n/).filter((l) => !/projet\.version_deployee/.test(l)).join('\n');

  test(`TF-2536 — le canevas ${langue} porte une ligne de version que FS12 lit (sens vert), son absence ne cite rien (sens rouge)`, () => {
    assert.match(canevas, /\{\{\s*projet\.version_deployee/, 'le canevas ne porte pas le champ projet.version_deployee');
    assert.deepEqual(versionsCitees(lignesDeChamps(fiche(canevas, 'v1.13.0'))), ['1.13.0'],
      'la ligne du canevas n\'est pas lue comme « la version que la fiche cite »');
    assert.deepEqual(versionsCitees(lignesDeChamps(fiche(sansLigne(canevas), 'v1.13.0'))), [],
      'le canevas privé de sa ligne cite encore une version : le contrôle ne mord pas');
  });
}

// ── TF-2567 · LA FICHE RENDUE PORTE LA LIGNE QUE FS12 LIT. TF-2536 a posé « Version déployée » dans le canevas
//    Markdown, mais le squelette HTML de `tools/build-fiche.mjs` ne la portait pas : sur toute fiche rendue, FS12 rendait
//    SKIP (« aucune version citée ») — le contrôle écrit n'était pas câblé à l'étape qui produit la fiche. Ces cas
//    rendent la fiche PAR LE GÉNÉRATEUR (pas un HTML écrit à la main) et jouent FS12 dessus. Rouge sur le build-fiche
//    d'avant : la clé `version_deployee` y était ignorée, la fiche ne citait aucune version, FS12 restait SKIP.
const CLES_FICHE_COMPLETE = ['projet', 'objet', 'equipe', 'hebergement', 'environnements', 'iac', 'classification', 'pii',
  'juridictions', 'analyses', 'criticite', 'disponibilite', 'impact', 'exposition',
  'point_controle', 'authentification', 'population_admise', 'restriction', 'invites', 'ia_presente', 'ia_usage', 'ia_gardefous',
  'observabilite', 'alerting', 'sauvegardes', 'tags', 'budget', 'porteur', 'business_owner', 'lien_dev'];
const texteDeLaLigne = (h) => String(h).replace(/<[^>]*>/g, '');
/** Rend une fiche par build-fiche (données complètes + la version donnée), la juge avec l'étiquette donnée. */
const ficheRendueJugee = (version, etiquetteDeployee, sansChamps = []) => {
  const prod = temporaire();
  try {
    const donnees = path.join(prod, 'data.json');
    const champs = Object.fromEntries(CLES_FICHE_COMPLETE.filter((k) => !sansChamps.includes(k))
      .map((k) => [k, k === 'lien_dev' ? 'https://dev.exemple.test/app' : `valeur ${k}`]));
    if (version !== undefined) champs.version_deployee = version;
    fs.writeFileSync(donnees, JSON.stringify(champs), 'utf8');
    const b = jouer(BUILD, TENANT, '--data', donnees, '--produit', prod, '--sans-pdf');
    assert.equal(b.status, 0, `génération rouge : ${b.stderr}`);
    return juger(trouverFiche(prod), { sansPdf: true, etiquetteDeployee });
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
};

test('TF-2567 — sens vert : la fiche RENDUE par build-fiche cite la version donnée, et FS12 la juge PASS contre la même étiquette', () => {
  const r = ficheRendueJugee('v1.13.0', '1.13.0');
  assert.equal(statutDe(r, 'FS12'), 'PASS',
    `FS12 ne joue pas sur la fiche rendue : ${r.findings.find((f) => f.regle === 'FS12')?.message}`);
  assert.equal(r.verdict, 'PASS', r.findings.filter((f) => f.statut === 'FAIL').map((f) => f.message).join(' | '));
});

test('TF-2567 — sens rouge : la fiche RENDUE cite v1.10.0 alors que v1.13.0 est servie → FS12 FAIL (elle rendait SKIP avant)', () => {
  const r = ficheRendueJugee('v1.10.0', '1.13.0');
  assert.equal(statutDe(r, 'FS12'), 'FAIL', 'la fiche périmée rendue par le générateur n\'est pas refusée par FS12');
  assert.match(r.findings.find((f) => f.regle === 'FS12').message, /ANTÉRIEURE/);
  assert.equal(r.verdict, 'FAIL');
});

test('TF-2567 — le squelette porte la ligne « Version déployée » (ligne lue, trou signalé), et la version non donnée laisse un trou que FS1 refuse', () => {
  const prod = temporaire();
  try {
    assert.equal(jouer(BUILD, TENANT, '--produit', prod, '--sans-pdf').status, 0);
    const html = fs.readFileSync(trouverFiche(prod), 'utf8');
    const ligne = lignesDeChamps(html).find((l) => l.intitule === 'Version déployée');
    assert.ok(ligne, 'le squelette ne porte pas de ligne « Version déployée » : FS12 ne peut pas la lire');
    assert.match(ligne.valeur, /<span class="ph">\{\{VERSION_DEPLOYEE/, 'la ligne n\'est pas un trou à compléter');
    assert.doesNotMatch(texteDeLaLigne(ligne.valeur), /\d+\.\d+\.\d+/, 'le trou cite déjà une version : FS12 la lirait comme citée');
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
  // Une fiche complète SANS la version : le trou reste, FS1 (placeholder résiduel) la refuse — on ne diffuse pas sans version.
  const sans = ficheRendueJugee(undefined, '1.13.0');
  assert.equal(statutDe(sans, 'FS1'), 'FAIL', 'une fiche sans version déployée est diffusable');
  assert.notEqual(statutDe(sans, 'FS12'), 'PASS', 'FS12 ne doit pas passer sur un trou');
});

// ── TF-2582 · UN TROU QUE FS1 NE LIT PAS EST UN TROU DIFFUSÉ. FS1 ne lit que les `{{…}}` de 80 caractères au plus ;
//    le trou « BUSINESS_OWNER — … ; si c'est le porteur lui-même, … » en portait 116 : une fiche complète SANS
//    business_owner rendait PASS (FS1 « 0 placeholder résiduel »), le trou imprimé dans la page. Rouge sur le
//    build-fiche d'avant (verdict PASS, 1 trou sur 32 non vu par FS1), vert sur le nouveau.
test('TF-2582 — une fiche complète SANS business_owner est refusée par FS1 (elle rendait PASS, le trou imprimé)', () => {
  const sans = ficheRendueJugee('v1.13.0', '1.13.0', ['business_owner']);
  assert.equal(statutDe(sans, 'FS1'), 'FAIL', 'le trou BUSINESS_OWNER passe FS1 : une fiche sans valideur est diffusable');
  assert.match(sans.findings.find((f) => f.regle === 'FS1').message, /BUSINESS_OWNER/, 'FS1 refuse sans nommer le trou');
  assert.equal(sans.verdict, 'FAIL');
  // Sens vert : la même fiche AVEC business_owner reste diffusable.
  assert.equal(ficheRendueJugee('v1.13.0', '1.13.0').verdict, 'PASS');
});

test('TF-2582 — chaque trou du squelette rendu tient dans la borne de FS1 : tous sont comptés, aucun n\'échappe', () => {
  const prod = temporaire();
  try {
    assert.equal(jouer(BUILD, TENANT, '--produit', prod, '--sans-pdf').status, 0);
    const fiche = trouverFiche(prod);
    const trous = [...fs.readFileSync(fiche, 'utf8').matchAll(/\{\{([\s\S]*?)\}\}/g)].map((m) => m[1].trim());
    assert.ok(trous.length > 0, 'le squelette ne porte plus aucun trou');
    const trop = trous.filter((t) => t.length > 80);
    assert.deepEqual(trop, [], `${trop.length} trou(s) de plus de 80 caractères : FS1 ne les lit pas`);
    const lus = Number(/^(\d+) placeholder/.exec(juger(fiche, { sansPdf: true }).findings.find((f) => f.regle === 'FS1').message)?.[1]);
    assert.equal(lus, trous.length, `le squelette porte ${trous.length} trous, FS1 en compte ${lus}`);
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

// ── TF-2592 · LE CANEVAS NE PORTE AUCUN TROU QUE FS1 NE LIT PAS. TF-2582 a ramené le trou du squelette HTML dans la
//    borne de FS1 (80 caractères) ; les canevas Markdown portaient le même défaut : 6 trous trop longs dans
//    fiche-securite.template.md, 7 dans la version anglaise, 1 dans banc-de-preuves.template.md (mesuré avant
//    correction). Une fiche rédigée depuis le canevas qui en laissait un en place passait FS1. Ces cas instancient le
//    canevas (chaque trou lu par FS1 est rempli, un seul est laissé) et jouent FS1 : un trou laissé tel quel rend FAIL.
//    Rouge sur les canevas d'avant (FS1 PASS pour chacun des 14 trous longs), vert sur les canevas raccourcis.
const DOSSIER_CANEVAS = path.join(RACINE, 'deliverables', 'templates');
const TROU = /\{\{[^}]*\}\}/g;
const CANEVAS_A_TROUS = ['fiche-securite.template.md', 'fiche-securite.template.en.md', 'banc-de-preuves.template.md'];
/** Instancie le canevas : tout trou est rempli sauf `laisse`, puis FS1 juge le résultat posé en HTML. */
const fs1SurCanevasInstancie = (md, laisse) => {
  const dossier = temporaire();
  try {
    const fiche = path.join(dossier, 'fiche.html');
    fs.writeFileSync(fiche, `<html><body><pre>${md.replace(TROU, (t) => (t === laisse ? t : 'valeur'))}</pre></body></html>`, 'utf8');
    return juger(fiche, { sansPdf: true }).findings.find((f) => f.regle === 'FS1').statut;
  } finally { fs.rmSync(dossier, { recursive: true, force: true }); }
};

for (const fichier of CANEVAS_A_TROUS) {
  test(`TF-2592 — ${fichier} : un trou laissé en place est refusé par FS1, aucun n'échappe à la borne de 80 caractères`, () => {
    const md = fs.readFileSync(path.join(DOSSIER_CANEVAS, fichier), 'utf8');
    const trous = [...new Set(md.match(TROU))];
    assert.ok(trous.length > 0, `${fichier} ne porte plus aucun trou`);
    const echappes = trous.filter((t) => fs1SurCanevasInstancie(md, t) !== 'FAIL');
    assert.deepEqual(echappes.map((t) => `${t.length - 4} car. : ${t.slice(0, 60)}`), [],
      `${echappes.length} trou(s) de ${fichier} laissé(s) en place passe(nt) FS1`);
  });
}

test('TF-2592 — sens vert : le canevas entièrement rempli reste accepté par FS1 (le contrôle ne refuse pas tout)', () => {
  for (const fichier of CANEVAS_A_TROUS) {
    const md = fs.readFileSync(path.join(DOSSIER_CANEVAS, fichier), 'utf8');
    assert.equal(fs1SurCanevasInstancie(md, null), 'PASS', `${fichier} rempli est refusé par FS1`);
  }
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
      'point_controle', 'authentification', 'population_admise', 'restriction', 'invites', 'ia_presente', 'ia_usage', 'ia_gardefous',
      'observabilite', 'alerting', 'sauvegardes', 'tags', 'budget', 'porteur', 'business_owner',
    ].map((k) => [k, `valeur ${k}`]).concat([['lien_dev', 'https://dev.exemple.test/app'], ['version_deployee', 'v1.13.0']]))), 'utf8');
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
    for (const regle of ['FS1', 'FS2', 'FS3', 'FS3bis', 'FS4', 'FS5', 'FS8', 'FS9', 'FS10', 'FS11'])
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

// ── TF-1751 (lot Produit-76 du 25/09/2026) · LE SURLIGNAGE « À REMPLIR » SE DÉCIDE À LA GÉNÉRATION.
//    Mesuré chez le produit : 29 et 36 fragments REMPLIS restaient habillés en « à remplir » pour
//    toute lecture sans JavaScript, parce que le gabarit du kit ne retirait la classe qu'au chargement.
//    Ici, une fiche complète ne porte AUCUN `span.ph` ni script de dépouillement ; une fiche
//    partielle n'en porte que sur ses champs manquants, plus la légende qui les explique.
test('TF-1751 — fiche complète : aucun surlignage « à remplir » dans le source, aucun script pour l\'ôter', () => {
  const prod = temporaire();
  try {
    const donnees = path.join(prod, 'data.json');
    const cles = ['projet', 'objet', 'equipe', 'hebergement', 'environnements', 'iac', 'classification', 'pii',
      'juridictions', 'analyses', 'criticite', 'disponibilite', 'impact', 'exposition',
      'point_controle', 'authentification', 'population_admise', 'restriction', 'invites', 'ia_presente', 'ia_usage', 'ia_gardefous',
      'observabilite', 'alerting', 'sauvegardes', 'tags', 'budget', 'porteur', 'business_owner', 'lien_dev', 'version_deployee'];
    fs.writeFileSync(donnees, JSON.stringify(Object.fromEntries(cles.map((k) => [k, k === 'version_deployee' ? 'v1.13.0' : `valeur ${k}`]))), 'utf8');
    assert.equal(jouer(BUILD, TENANT, '--data', donnees, '--produit', prod, '--sans-pdf').status, 0);
    const source = fs.readFileSync(trouverFiche(prod), 'utf8');
    assert.equal((source.match(/class="ph"/g) ?? []).length, 0, 'une fiche complète porte encore un surlignage « à remplir »');
    assert.doesNotMatch(source, /classList\.remove\(['"](ph|placeholder)['"]\)/, 'un script de dépouillement au chargement');
  } finally { fs.rmSync(prod, { recursive: true, force: true }); }
});

test('TF-1751 — fiche partielle : le surlignage ne marque QUE les champs manquants (sens rouge)', () => {
  const prod = temporaire();
  try {
    const donnees = path.join(prod, 'data.json');
    fs.writeFileSync(donnees, JSON.stringify({ projet: 'Produit-NN', objet: 'objet renseigné' }), 'utf8');
    assert.equal(jouer(BUILD, TENANT, '--data', donnees, '--produit', prod, '--sans-pdf').status, 0);
    const source = fs.readFileSync(trouverFiche(prod), 'utf8');
    const marques = (source.match(/<span class="ph">\{\{/g) ?? []).length;
    assert.ok(marques > 0, 'les champs manquants ne sont plus signalés');
    assert.doesNotMatch(source, /<span class="ph">\{\{[^}]*\}\}<\/span>[^<]*Produit-NN|<span class="ph">Produit-NN/, 'une valeur écrite est habillée en « à remplir »');
    assert.match(source, /<span class="ph">chasse fixe<\/span>/, 'la légende explique le surlignage tant qu\'il reste un champ à remplir');
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
    // TF-1220 / TF-1408 : le moteur PRÉSENT peut ne pas répondre à temps (port DevTools non
    // annoncé) — ce n'est PAS un échec de ce test, c'est un point NON VÉRIFIÉ (code 3, motivé),
    // même famille que « aucun moteur ». Même classification que verifier-pdf.test.mjs (TF-1017).
    const verdictMoteur = verdictNavigateur({ status: b.status, stderr: b.stderr, navigateur: trouverNavigateur() });
    if (verdictMoteur.verdict === 'SKIP') { t.skip(verdictMoteur.motif); return; }
    assert.equal(verdictMoteur.verdict, 'JUGE', `${verdictMoteur.motif} — sortie : ${b.stdout}${b.stderr}`);
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

// ── TF-1020 · LE TIRAGE NE DÉPEND PLUS D'UNE POLICE DU POSTE ─────────────────────────────────
// Ce que les tests ci-dessus NE prouvent pas : que la fiche tienne sur une page ICI ne dit rien
// de ce qu'elle fera ailleurs. Le 11/09, elle tenait sur une page sous Windows et sortait sur
// DEUX sur le runner Linux, où son propre juge la refusait (P3) — parce que la pile du thème ne
// nommait que des polices DU POSTE et que le moteur y retombait sur DejaVu Sans, plus large.
//
// La preuve demandée n'est donc pas « une page ici », c'est « la police résolue est celle qui
// voyage avec le livrable ». On la mesure DANS le moteur, à double sens :
//   VERT  · thème complet : `var(--font-body)` rend à la largeur de la face INCORPORÉE, et
//           `document.fonts` porte cette face chargée ;
//   ROUGE · le MÊME thème amputé de ses `@font-face` : la largeur CHANGE. Si elle ne changeait
//           pas, c'est que la face incorporée n'était pas celle que le moteur résolvait — la
//           correction ne prouverait rien et le défaut serait intact.
//
// Pourquoi la famille s'appelle « AuditCore Sans » et pas « Roboto » : parce que la fixture rouge
// ne mordait PAS sous le vrai nom. Mesuré ici le 17/09/2026, sur un poste où Roboto n'est installé
// ni pour la machine ni pour l'utilisateur, le moteur rend quand même `font-family:Roboto` à
// 183,52 px contre 183,64 px pour la face incorporée : 0,12 px d'écart, et donc aucune preuve
// possible de laquelle des deux a servi. Sous un nom qu'aucun poste ne possède, le repli est
// franc (system-ui → 180,61 px ici, DejaVu Sans ailleurs) et la mesure tranche.
test('TF-1020 — la police résolue est la police EMBARQUÉE, pas celle du poste', async (t) => {
  const { trouverNavigateur, mesurer, webSocketDisponible } = await import(
    path.join(RACINE, 'tools', 'fiche-en-pdf.mjs').replace(/\\/g, '/').replace(/^/, 'file:///'));
  const navigateur = webSocketDisponible() ? trouverNavigateur() : null;
  if (!navigateur) {
    t.skip("aucun moteur d'impression (ou pas de WebSocket natif) sur ce poste — la police "
      + 'RÉELLEMENT résolue n\'est PAS mesurée ici (SKIP motivé, jamais un PASS)');
    return;
  }
  const { genererTheme } = await import(
    path.join(RACINE, 'tools', 'build-theme.mjs').replace(/\\/g, '/').replace(/^/, 'file:///'));

  const dir = temporaire();
  try {
    const css = genererTheme(TENANT, path.join(dir, 'theme')).css;
    assert.match(css, /@font-face\{font-family:'AuditCore Sans'/, 'le thème ne porte plus de face incorporée');
    assert.match(css, /--font-body:AuditCore Sans,/,
      'la pile du thème ne commence pas par la face incorporée : le moteur résoudra une police du poste');
    const sansFaces = css.replace(/@font-face\{[^}]*\}/g, '');
    assert.ok(!/@font-face/.test(sansFaces), 'la fixture rouge porte encore une face : elle ne mord pas');

    // Le texte mesuré est celui qui décide du nombre de pages : des intitulés de la fiche.
    const page = (feuille) => `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>t</title>`
      + `<style>${feuille}\n#m{font-family:var(--font-body);font-size:12.5px;`
      + `white-space:nowrap;display:inline-block}</style></head><body>`
      + `<span id="m">Population effectivement admise · Restriction d'accès effective</span></body></html>`;
    const sonde = 'JSON.stringify({l:document.getElementById("m").getBoundingClientRect().width,'
      + 'faces:[...document.fonts].map(f=>f.family+":"+f.status)})';

    const vertFichier = path.join(dir, 'vert.html');
    const rougeFichier = path.join(dir, 'rouge.html');
    fs.writeFileSync(vertFichier, page(css), 'utf8');
    fs.writeFileSync(rougeFichier, page(sansFaces), 'utf8');

    // TF-1220 : le moteur PRÉSENT peut ne pas répondre à temps — un point NON VÉRIFIÉ, pas un
    // échec de ce test (même distinction que le test bout-en-bout ci-dessus).
    let vert, rouge;
    try {
      vert = JSON.parse(await mesurer(vertFichier, sonde, { navigateur }));
      rouge = JSON.parse(await mesurer(rougeFichier, sonde, { navigateur }));
    } catch (e) {
      if (e.portBloque) { t.skip(`moteur présent (${navigateur}) mais NON VÉRIFIÉ — port non annoncé en ${e.delaiMs} ms`); return; }
      throw e;
    }

    assert.ok(vert.faces.includes('AuditCore Sans:loaded'),
      `aucune face incorporée chargée dans la page : ${vert.faces.join(', ') || '(aucune)'} — la police `
      + 'ne voyage donc pas avec le livrable');
    assert.equal(rouge.faces.length, 0, 'la fixture rouge charge quand même une face');
    assert.notEqual(Math.round(vert.l), Math.round(rouge.l),
      `même largeur avec (${vert.l.toFixed(2)} px) et sans (${rouge.l.toFixed(2)} px) la face incorporée : `
      + 'le moteur ne résout PAS la police embarquée, il retombe sur une police du poste — le tirage '
      + 'reste dépendant de la machine qui imprime, et le défaut TF-1020 est intact');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

// ── TF-2086 / TF-2087 · LE MODÈLE DE FICHE D'UN PRODUIT (cellules `th.k` / `td.k`) ET LES TROIS
//    ENVIRONNEMENTS. Extrait minimal du modèle qui a fait rendre FS4 FAIL, FS5 SKIP et FS8/10/11
//    FAIL sur une fiche pourtant complète, puis FS3/FS4 FAIL sur une fiche HPR bien formée
//    (`CDC-SEC-HPR-20261030a`) : intitulés en `<th class="k">` (largeur déclarée par `th.k{…}`)
//    ET en `<td class="k">`, et une première ligne « Dev-team / run » SANS URL avant la ligne qui
//    porte le lien. Chaque fixture a son sens vert et son sens rouge.
const SECTIONS_MODELE = (env, { lien, libelleLien, population, restriction, invites, intitule = 'td' }) =>
  Array.from({ length: 8 }, (_, k) => {
    const cellule = (libelle, valeur) => (intitule === 'td'
      ? `<tr><td class="k">${libelle}</td><td>${valeur}</td></tr>`
      : `<tr><th class="k">${libelle}</th><td>${valeur}</td></tr>`);
    const entete = k === 0 ? [
      // Piège de FS4 : une ligne dont l'intitulé contient « Dev » mais qui ne porte AUCUNE URL.
      `<tr><th class="k">Dev-team / run</th><td>Équipe A, run partagé</td></tr>`,
      `<tr><th class="k">${libelleLien}</th><td>${lien}</td></tr>`,
      population === null ? '' : cellule('Population effectivement admise', population),
      restriction === null ? '' : cellule("Restriction d'accès effective", restriction),
      invites === null ? '' : cellule('Comptes externes / invités en portée', invites),
    ].join('') : '';
    return `<section><h2>${k + 1} · Section ${k + 1}</h2><table><tbody>${entete}`
      + `${cellule(`Champ ${k + 1}`, 'valeur')}</tbody></table></section>`;
  }).join('\n');

function ficheModele({ env = 'DEV', ref, jour = '20261030a', largeur = 22, fixe = true, lien, libelleLien,
  population = 'Collaborateurs du tenant (128)', restriction = 'assignation de rôle requise',
  invites = '0 (portail invités désactivé)', intitule = 'td' } = {}) {
  const r = ref ?? `CDC-SEC-${env}-${jour}`;
  const l = lien === undefined ? `<a href="https://${env.toLowerCase()}.exemple.test/app">https://${env.toLowerCase()}.exemple.test/app</a>` : lien;
  const lib = libelleLien ?? `Lien environnement ${env}`;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Fiche</title><style>`
    + `table{${fixe ? 'table-layout:fixed;' : ''}border-collapse:collapse;width:100%}`
    + `th.k{background:#eee;width:${largeur}%}td.k{font-weight:600}td{overflow-wrap:break-word}</style></head><body>`
    + `<header>Réf. ${r} · validée par le responsable sécurité</header><h1>Fiche sécurité</h1>\n`
    + SECTIONS_MODELE(env, { lien: l === null ? 'à venir' : l, libelleLien: lib, population, restriction, invites, intitule })
    + `\n<footer>Réf. ${r} — Gabarit : gd-fiche-securite-auditcore · version du gabarit 1.0.0.</footer></body></html>`;
}

function jugerFiche(nom, html, opts = {}) {
  const dir = temporaire();
  try {
    const p = path.join(dir, nom);
    fs.writeFileSync(p, html, 'utf8');
    return juger(p, { sansPdf: true, ...opts });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
const statutDe = (rapport, regle) => rapport.findings.find((f) => f.regle === regle)?.statut;

test('TF-2086 — le modèle à cellules th.k / td.k est jugé : FS4 vise la ligne qui porte l\'URL, FS5 lit th.k, FS8/10/11 lisent td.k', () => {
  const r = jugerFiche('CDC - Fiche Securite - Dev - 20261030a.html', ficheModele());
  const echecs = r.findings.filter((f) => f.statut !== 'PASS' && f.regle !== 'FS6' && f.regle !== 'FS7');
  assert.deepEqual(echecs, [], 'la fiche du modèle, complète, ne doit rien rendre d\'autre que PASS (hors PDF déclaré absent)');
  assert.equal(r.verdict, 'PASS');
  assert.match(r.findings.find((f) => f.regle === 'FS4').message, /dev\.exemple\.test/, 'FS4 doit citer l\'URL de la bonne ligne');
  assert.match(r.findings.find((f) => f.regle === 'FS5').message, /22 %/, 'FS5 doit rapporter la largeur lue sur th.k');
});

test('TF-2086 — sens rouge : aucune ligne « Dev » ne porte d\'URL → FS4 FAIL, et le message nomme la ligne sans lien', () => {
  const r = jugerFiche('CDC - Fiche Securite - Dev - 20261030a.html', ficheModele({ lien: null }));
  assert.equal(statutDe(r, 'FS4'), 'FAIL');
  assert.equal(r.verdict, 'FAIL');
});

test('TF-2086 — sens rouge : th.k à 32 % ou sans table-layout fixe → FS5 FAIL (plus un SKIP silencieux)', () => {
  let r = jugerFiche('CDC - Fiche Securite - Dev - 20261030a.html', ficheModele({ largeur: 32 }));
  assert.equal(statutDe(r, 'FS5'), 'FAIL', 'th.k à 32 % n\'est pas refusé');
  r = jugerFiche('CDC - Fiche Securite - Dev - 20261030a.html', ficheModele({ fixe: false }));
  assert.equal(statutDe(r, 'FS5'), 'FAIL', 'th.k sans table-layout:fixed n\'est pas refusé');
});

test('TF-2086 — sens rouge : champs td.k absents ou vides → FS8, FS10, FS11 FAIL (et la variante th.k reste lue)', () => {
  const nom = 'CDC - Fiche Securite - Dev - 20261030a.html';
  assert.equal(statutDe(jugerFiche(nom, ficheModele({ population: null })), 'FS8'), 'FAIL', 'FS8 : ligne td.k supprimée');
  assert.equal(statutDe(jugerFiche(nom, ficheModele({ population: '' })), 'FS8'), 'FAIL', 'FS8 : ligne td.k vide');
  assert.equal(statutDe(jugerFiche(nom, ficheModele({ restriction: null })), 'FS10'), 'FAIL', 'FS10 : ligne td.k supprimée');
  assert.equal(statutDe(jugerFiche(nom, ficheModele({ invites: null })), 'FS11'), 'FAIL', 'FS11 : ligne td.k supprimée');
  // La même fiche, intitulés en th.k : toujours lue, toujours PASS.
  const th = jugerFiche(nom, ficheModele({ intitule: 'th' }));
  for (const regle of ['FS8', 'FS10', 'FS11']) assert.equal(statutDe(th, regle), 'PASS', `${regle} ne lit pas les intitulés en th.k`);
});

test('TF-2087 — une fiche HPR bien formée (CDC-SEC-HPR-20261030a) est jugée sur HPR : FS3 et FS4 PASS', () => {
  const r = jugerFiche('CDC - Fiche Securite - HPR - 20261030a.html', ficheModele({ env: 'HPR' }));
  assert.equal(statutDe(r, 'FS3'), 'PASS', r.findings.find((f) => f.regle === 'FS3').message);
  assert.equal(statutDe(r, 'FS4'), 'PASS', r.findings.find((f) => f.regle === 'FS4').message);
  assert.equal(r.verdict, 'PASS');
  assert.match(r.findings.find((f) => f.regle === 'FS4').message, /HPR/, 'le message doit dire quel environnement est jugé');
});

test('TF-2087 — double sens : la fiche DEV reste jugée juste, et un lien DEV ne tient pas lieu de lien HPR', () => {
  // DEV (le cas historique) : toujours verte.
  assert.equal(jugerFiche('CDC - Fiche Securite - Dev - 20261030a.html', ficheModele({ env: 'DEV' })).verdict, 'PASS');
  // HPR dont la seule ligne à lien est celle de DEV : FS4 FAIL, l'environnement jugé est HPR.
  const croise = jugerFiche('CDC - Fiche Securite - HPR - 20261030a.html',
    ficheModele({ env: 'HPR', libelleLien: 'Lien environnement DEV' }));
  assert.equal(statutDe(croise, 'FS4'), 'FAIL', 'un lien DEV est accepté comme lien HPR');
  // Nom HPR mais références DEV : deux environnements dans un même livrable, FS3 FAIL.
  const incoherent = jugerFiche('CDC - Fiche Securite - HPR - 20261030a.html',
    ficheModele({ env: 'HPR', ref: 'CDC-SEC-DEV-20261030a' }));
  assert.equal(statutDe(incoherent, 'FS3'), 'FAIL', 'nom HPR et référence DEV acceptés ensemble');
  assert.match(incoherent.findings.find((f) => f.regle === 'FS3').message, /HPR[\s\S]*DEV|DEV[\s\S]*HPR/);
});

test('TF-2087 — l\'environnement se lit aussi dans l\'en-tête quand le nom n\'en porte pas, et PRD ne se confond pas avec HPR', () => {
  // Nom sans environnement : c'est la référence de l'en-tête qui fixe HPR.
  const entete = jugerFiche('fiche-securite-cdc-20261030a.html', ficheModele({ env: 'HPR' }));
  assert.equal(entete.verdict, 'PASS', entete.findings.filter((f) => f.statut === 'FAIL').map((f) => f.message).join(' | '));
  assert.match(entete.findings.find((f) => f.regle === 'FS4').message, /HPR/);
  // PRD vert.
  assert.equal(jugerFiche('CDC - Fiche Securite - PRD - 20261030a.html', ficheModele({ env: 'PRD', libelleLien: 'Lien environnement PRD (production)' })).verdict, 'PASS');
  // PRD dont la seule ligne à lien est « pré-production » : ce n'est pas la production.
  const prerod = jugerFiche('CDC - Fiche Securite - PRD - 20261030a.html',
    ficheModele({ env: 'PRD', libelleLien: 'Lien pré-production' }));
  assert.equal(statutDe(prerod, 'FS4'), 'FAIL', 'un lien de pré-production est accepté comme lien de production');
});

// ── TF-2419 · FS12 : LA VERSION CITÉE PAR LA FICHE EST LA DERNIÈRE ÉTIQUETTE DÉPLOYÉE. Le 10/11/2026, la fiche
//    CDC-SEC-HPR-20261104a citait v1.10.0 alors que v1.13.0 était qualifiée et servie : jointe telle quelle à un courriel du
//    référent sécurité, elle a été réémise (16 champs sur 29 changés). Chaque sortie de la règle a son sens vert et son
//    sens rouge ; la fiche est celle du modèle (intitulés th.k / td.k) avec une ligne « Version déployée » ajoutée.
const NOM_HPR = 'CDC - Fiche Securite - HPR - 20261104a.html';
const avecVersion = (v, { intitule = 'Version déployée', env = 'HPR' } = {}) => ficheModele({ env, jour: '20261104a' })
  .replace('<tr><th class="k">Dev-team / run</th>', `<tr><th class="k">${intitule}</th><td>${v}</td></tr><tr><th class="k">Dev-team / run</th>`);

test('TF-2419 — sens rouge : la fiche cite v1.10.0 alors que v1.13.0 est servie → FS12 FAIL, qui nomme les deux versions', () => {
  const r = jugerFiche(NOM_HPR, avecVersion('v1.10.0'), { etiquetteDeployee: 'v1.13.0' });
  assert.equal(statutDe(r, 'FS12'), 'FAIL');
  assert.equal(r.verdict, 'FAIL');
  const message = r.findings.find((f) => f.regle === 'FS12').message;
  assert.match(message, /1\.10\.0/); assert.match(message, /1\.13\.0/); assert.match(message, /ANTÉRIEURE/);
  // Les onze règles de forme, elles, ne voient rien : c'est le trou que FS12 ferme.
  const sans = jugerFiche(NOM_HPR, avecVersion('v1.10.0'));
  assert.equal(sans.verdict, 'PASS', 'la fiche périmée passait déjà FS1 à FS11 — elle doit continuer à les passer');
});

test('TF-2419 — sens vert : la fiche à jour (v1.13.0 contre « v1.13.0 » ou « 1.13.0 ») est ACCEPTÉE, la citée postérieure est refusée', () => {
  for (const etiquette of ['v1.13.0', '1.13.0']) {
    const r = jugerFiche(NOM_HPR, avecVersion('v1.13.0'), { etiquetteDeployee: etiquette });
    assert.equal(statutDe(r, 'FS12'), 'PASS', `étiquette ${etiquette}`);
    assert.equal(r.verdict, 'PASS', r.findings.filter((f) => f.statut === 'FAIL').map((f) => f.message).join(' | '));
  }
  const apres = jugerFiche(NOM_HPR, avecVersion('v1.14.0'), { etiquetteDeployee: 'v1.13.0' });
  assert.equal(statutDe(apres, 'FS12'), 'FAIL');
  assert.match(apres.findings.find((f) => f.regle === 'FS12').message, /POSTÉRIEURE/);
  // « 1.9.0 » précède « 1.13.0 » : la comparaison est numérique, pas lexicographique.
  assert.match(jugerFiche(NOM_HPR, avecVersion('v1.9.0'), { etiquetteDeployee: 'v1.13.0' }).findings.find((f) => f.regle === 'FS12').message, /ANTÉRIEURE/);
});

test('TF-2419 — la version se lit aussi sur « Projet / application » et « Version de l\'application » ; une version de TLS n\'est pas la version citée', () => {
  assert.equal(statutDe(jugerFiche(NOM_HPR, avecVersion('Produit-84 v1.13.0', { intitule: 'Projet / application' }), { etiquetteDeployee: '1.13.0' }), 'FS12'), 'PASS');
  assert.equal(statutDe(jugerFiche(NOM_HPR, avecVersion('v1.10.0', { intitule: "Version de l'application" }), { etiquetteDeployee: '1.13.0' }), 'FS12'), 'FAIL');
  // « Version TLS » (1.3, 1.2.0) n'est pas la version de l'application : aucune version citée → SKIP, pas un faux refus.
  const tls = jugerFiche(NOM_HPR, avecVersion('TLS 1.2.0', { intitule: 'Version TLS' }), { etiquetteDeployee: '1.13.0' });
  assert.equal(statutDe(tls, 'FS12'), 'SKIP');
  // Deux versions différentes citées par la même fiche : refusée.
  const deux = jugerFiche(NOM_HPR, avecVersion('v1.13.0').replace('<tr><th class="k">Dev-team / run</th>', '<tr><th class="k">Version</th><td>v1.10.0</td></tr><tr><th class="k">Dev-team / run</th>'), { etiquetteDeployee: '1.13.0' });
  assert.equal(statutDe(deux, 'FS12'), 'FAIL');
  assert.match(deux.findings.find((f) => f.regle === 'FS12').message, /2 versions différentes/);
});

test('TF-2419 — aucune version citée : SKIP motivé (ni réussie ni échouée) ; aucune étiquette donnée : FS12 absente des constats et dite non jouée', () => {
  const nue = jugerFiche(NOM_HPR, ficheModele({ env: 'HPR', jour: '20261104a' }), { etiquetteDeployee: '1.13.0' });
  assert.equal(statutDe(nue, 'FS12'), 'SKIP');
  assert.equal(nue.verdict, 'PASS', 'un SKIP motivé ne fait pas échouer la fiche');
  assert.match(nue.findings.find((f) => f.regle === 'FS12').message, /NI réussie NI échouée/);
  const sans = jugerFiche(NOM_HPR, avecVersion('v1.10.0'));
  assert.equal(statutDe(sans, 'FS12'), undefined, 'FS12 ne rend aucun constat quand rien ne lui est donné à comparer');
  assert.ok(sans.non_juge.some((n) => /FS12/.test(n) && /NON JOUÉE/.test(n)), 'le non-jugé ne dit pas que FS12 n\'a pas eu lieu');
  const donnee = jugerFiche(NOM_HPR, avecVersion('v1.13.0'), { etiquetteDeployee: '1.13.0' });
  assert.ok(!donnee.non_juge.some((n) => /FS12/.test(n)), 'FS12 est jouée : elle ne doit plus se dire non jouée');
  // Une étiquette illisible donnée à juger() est un refus nommé, pas une comparaison devinée.
  assert.equal(statutDe(jugerFiche(NOM_HPR, avecVersion('v1.13.0'), { etiquetteDeployee: 'dernière' }), 'FS12'), 'FAIL');
});

test('TF-2419 — en ligne de commande : --etiquette-deployee refuse la fiche périmée (exit 1), accepte la fiche à jour (exit 0), et une étiquette illisible est une erreur d\'usage (exit 2)', () => {
  const dir = temporaire();
  try {
    const perimee = path.join(dir, NOM_HPR);
    fs.writeFileSync(perimee, avecVersion('v1.10.0'), 'utf8');
    let r = jouer(ORACLE, perimee, '--sans-pdf', '--etiquette-deployee', 'v1.13.0', '--json-only');
    assert.equal(r.status, 1, `la fiche périmée est déclarée diffusable : ${r.stdout}`);
    assert.match(r.stdout, /FS12/);
    // sans l'option, le même fichier passe : c'est le trou d'avant TF-2419, désormais dit dans non_juge
    r = jouer(ORACLE, perimee, '--sans-pdf', '--json-only');
    assert.equal(r.status, 0, r.stdout);
    assert.match(r.stdout, /FS12 \(fraîcheur de la version citée\) NON JOUÉE/);
    const aJour = path.join(dir, 'CDC - Fiche Securite - HPR - 20261104b.html');
    fs.writeFileSync(aJour, avecVersion('v1.13.0').replace(/20261104a/g, '20261104b'), 'utf8');
    r = jouer(ORACLE, aJour, '--sans-pdf', '--etiquette-deployee', '1.13.0', '--json-only');
    assert.equal(r.status, 0, `la fiche à jour est refusée : ${r.stdout}`);
    r = jouer(ORACLE, aJour, '--sans-pdf', '--etiquette-deployee', 'dernière');
    assert.equal(r.status, 2, 'une étiquette qui n\'est pas une version doit être une erreur d\'usage');
    assert.match(r.stderr, /--etiquette-deployee/);
    r = jouer(ORACLE, aJour, '--sans-pdf', '--etiquette-deployee');
    assert.equal(r.status, 2, 'une option sans valeur doit être une erreur d\'usage');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
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
