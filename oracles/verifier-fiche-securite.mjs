#!/usr/bin/env node
/**
 * verifier-fiche-securite — LA PORTE BLOQUANTE QUI MANQUAIT (TF-0701).
 *
 * ── LE DÉSÉQUILIBRE QUI A PAYÉ CET ORACLE ─────────────────────────────────────────────────
 * Le rapport d'audit a une porte machine : « le rapport n'est CONFORME (diffusable) que si exit
 * code = 0 », tenue par `verifier-rapport*.mjs`. La fiche sécurité, elle, n'avait AUCUN contrôle
 * — alors que les règles écrites dans le skill de conformité sont parfaitement mécaniques : zéro
 * placeholder résiduel, et lien de l'environnement DEV présent. Deux règles écrites, tenues par
 * personne.
 *
 * CAUSE, et elle est humaine : le kit a outillé le document le plus volumineux et laissé l'autre
 * à la relecture. C'était défendable pour une fiche de deux pages, SAUF QUE la relecture humaine
 * porte sur le HTML alors que ce qui est DIFFUSÉ est le PDF — **aucun œil ne relisait l'artefact
 * réellement transmis**. C'est ce qui a laissé partir, le 24/07, un PDF d'indice `c` capturé en
 * image pendant qu'un HTML d'indice `d` dormait à côté de lui.
 *
 * ── LES SEPT RÈGLES ───────────────────────────────────────────────────────────────────────
 *   FS1 · zéro placeholder `{{…}}` résiduel — un livrable ne se diffuse pas avec ses trous.
 *   FS2 · les 8 sections du canevas sont présentes — une section perdue est un chapitre perdu.
 *   FS3 · référence interne `<TRIGRAMME>-SEC-DEV-<AAAAMMJJ><indice>`, bien formée, et IDENTIQUE
 *         en en-tête et en pied. Deux références divergentes dans un même document ne se voient
 *         qu'en ouvrant les deux bouts ; personne ne le fait.
 *   FS4 · le lien de l'environnement DEV est présent, et c'est une vraie URL.
 *   FS5 · mise en page : colonne d'intitulés ≤ 25 % et `table-layout` FIXE (TF-0697). Sans
 *         `table-layout:fixed`, une largeur déclarée n'est qu'un vœu — le moteur ré-élargit la
 *         colonne dès qu'un libellé s'allonge, et la déclaration ment.
 *   FS6 · le PDF de diffusion est là, et il porte le MÊME INDICE que le HTML (TF-0700 c).
 *   FS7 · ce PDF porte du TEXTE EXTRACTIBLE au-dessus d'un seuil. Un PDF de fiche sous quelques
 *         centaines d'unités de texte est une IMAGE : non recherchable, non contrôlable par
 *         machine, et MUET POUR UN LECTEUR D'ÉCRAN alors que le destinataire est l'équipe
 *         sécurité. Mesuré le 24/07 sur le PDF réellement diffusé : 0 caractère extractible,
 *         9 images, 653 169 octets — contre 124 Ko pour le même document imprimé en texte.
 *
 *   node oracles/verifier-fiche-securite.mjs <fiche.html> [--seuil-texte N] [--sans-pdf]
 *                                            [--json-only]
 *   node oracles/verifier-fiche-securite.mjs --self-test
 *
 * Verdicts : PASS (exit 0, DIFFUSABLE) · FAIL (exit 1) · SKIP motivé (exit 2, rien à juger).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

/** Le seuil de FS7 : en dessous, le « PDF » est une capture. Grossier, et c'est voulu. */
export const SEUIL_TEXTE = 300;
/** Le canevas de la fiche : huit sections numérotées. */
export const SECTIONS = 8;
/** La référence interne : trigramme, objet, environnement, jour, indice. */
export const RE_REF = /\b([A-Z0-9]{2,6})-SEC-DEV-(\d{8})([a-z])\b/g;

/**
 * Les UNITÉS DE TEXTE réellement montrées par un PDF : opérateurs `Tj`/`TJ`/`'` des flux de
 * contenu, chaînes littérales `(…)` comme chaînes hexadécimales `<…>` (les moteurs
 * d'impression émettent des identifiants de glyphe sur deux octets pour les polices
 * sous-ensemblées : compter les caractères ASCII seulement rendrait 0 sur un tirage parfait).
 * Ce n'est PAS une extraction de texte lisible — c'est un COMPTEUR, et il suffit à séparer une
 * impression d'une capture.
 */
export function unitesDeTexte(octets) {
  let total = 0, i = 0, flux = 0;
  const taille = (jeton) => (jeton.startsWith('<')
    ? Math.ceil(jeton.slice(1, -1).replace(/\s/g, '').length / 4)
    : Math.max(0, jeton.length - 2));
  while (true) {
    const s = octets.indexOf('stream', i);
    if (s < 0) break;
    let d = s + 6;
    if (octets[d] === 13) d++;
    if (octets[d] === 10) d++;
    const e = octets.indexOf('endstream', d);
    if (e < 0) break;
    const brut = octets.subarray(d, e);
    let texte;
    try { texte = zlib.inflateSync(brut).toString('latin1'); } catch { texte = brut.toString('latin1'); }
    i = e + 9;
    // Un flux de CONTENU porte un bloc de texte (`BT`) et une sélection de police (`Tf`) ; un
    // programme de police ou une image n'en portent pas. On ne compte pas les octets d'une image.
    if (!/\bBT\b/.test(texte) || !/\bTf\b/.test(texte)) continue;
    flux++;
    for (const m of texte.matchAll(/(\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f\s]*>)\s*(?:Tj|')/g)) total += taille(m[1]);
    for (const m of texte.matchAll(/\[([\s\S]*?)\]\s*TJ/g))
      for (const j of m[1].matchAll(/\((?:\\.|[^\\()])*\)|<[0-9A-Fa-f\s]*>/g)) total += taille(j[0]);
  }
  return { total, flux };
}

/** Le PDF de diffusion attendu à côté d'un HTML de référence : même nom, même indice. */
export const pdfDe = (html) => String(html).replace(/\.html?$/i, '') + '.pdf';
/** `… - 20260902c.html` → `20260902c` ; `null` si le nom n'est pas daté. */
export const indiceDe = (nom) => (/(\d{8}[a-z])(?=\.[A-Za-z0-9]+$|$)/.exec(path.basename(String(nom))) || [])[1] ?? null;

/**
 * Juge une fiche. Rend `{ verdict, findings, non_juge }` — la forme commune des oracles du dépôt.
 * Aucune sortie, aucun `process.exit` : c'est ce qui rend l'auto-test possible.
 */
export function juger(fiche, { seuilTexte = SEUIL_TEXTE, sansPdf = false } = {}) {
  const F = [];
  const add = (statut, regle, message) => F.push({ statut, regle, message });
  const html = fs.readFileSync(fiche, 'utf8');

  // ── FS1 · zéro placeholder résiduel ──────────────────────────────────────────────────────
  const trous = [...html.matchAll(/\{\{\s*([^}]{0,80}?)\s*\}\}/g)].map((m) => m[1]);
  if (trous.length) {
    add('FAIL', 'FS1', `${trous.length} placeholder(s) non renseigné(s) : ${[...new Set(trous)].slice(0, 6).join(', ')}`
      + (trous.length > 6 ? '…' : '') + '. Un livrable ne se diffuse pas avec ses trous — et la fiche '
      + "part à l'équipe sécurité, qui n'a pas le contexte pour les combler.");
  } else {
    add('PASS', 'FS1', '0 placeholder résiduel');
  }

  // ── FS2 · les 8 sections du canevas ──────────────────────────────────────────────────────
  // Numérotées plutôt que nommées : un tenant renomme ses sections, il n'en supprime pas.
  const vues = new Set([...html.matchAll(/<h2[^>]*>\s*(\d+)\s*[·.)-]/g)].map((m) => Number(m[1])));
  const manquantes = Array.from({ length: SECTIONS }, (_, k) => k + 1).filter((n) => !vues.has(n));
  if (manquantes.length) {
    add('FAIL', 'FS2', `${manquantes.length} section(s) absente(s) du canevas : ${manquantes.join(', ')} `
      + `(${vues.size}/${SECTIONS} vues). Une section perdue est un chapitre perdu, et son absence ne se `
      + 'voit pas dans un document que personne ne compare au canevas.');
  } else {
    add('PASS', 'FS2', `${SECTIONS}/${SECTIONS} sections du canevas présentes`);
  }

  // ── FS3 · référence interne bien formée, ET la même en en-tête et en pied ────────────────
  const bloc = (balise) => (new RegExp(`<${balise}[^>]*>([\\s\\S]*?)</${balise}>`, 'i').exec(html) || [])[1] ?? '';
  const refsDe = (t) => [...t.matchAll(RE_REF)].map((m) => m[0]);
  const enTete = refsDe(bloc('header'));
  const pied = refsDe(bloc('footer'));
  const toutes = new Set(refsDe(html));
  if (!toutes.size) {
    add('FAIL', 'FS3', 'aucune référence interne au format <TRIGRAMME>-SEC-DEV-<AAAAMMJJ><indice>. '
      + 'Sans elle, le document ne se rattache ni à son projet ni à sa révision : deux tirages '
      + 'différents deviennent indiscernables une fois imprimés.');
  } else if (!enTete.length || !pied.length) {
    add('FAIL', 'FS3', `référence présente (${[...toutes][0]}) mais absente ${enTete.length ? 'du PIED' : "de l'EN-TÊTE"}. `
      + 'Elle est due AUX DEUX BOUTS : une page détachée du reste doit encore dire de quelle révision elle vient.');
  } else if (new Set([...enTete, ...pied]).size > 1) {
    add('FAIL', 'FS3', `références DIVERGENTES dans le même document : en-tête ${enTete.join('/')} contre `
      + `pied ${pied.join('/')}. Ce défaut ne se voit qu'en ouvrant les deux bouts, et personne ne le fait.`);
  } else {
    add('PASS', 'FS3', `référence interne ${enTete[0]}, identique en en-tête et en pied`);
  }

  // ── FS3bis · la référence porte l'indice du NOM DE FICHIER ───────────────────────────────
  const iNom = indiceDe(fiche);
  const iRef = toutes.size ? (/(\d{8}[a-z])/.exec([...toutes][0]) || [])[1] : null;
  if (!iNom) {
    add('SKIP', 'FS3bis', `le nom « ${path.basename(fiche)} » n'est pas daté : rien à rapprocher de la `
      + 'référence interne. Un livrable non daté est un livrable qui s\'écrase lui-même, mais ce n\'est '
      + 'pas cet oracle qui le juge.');
  } else if (iRef && iNom !== iRef) {
    add('FAIL', 'FS3bis', `le nom du fichier porte ${iNom} et la référence imprimée DANS le document porte `
      + `${iRef}. La divergence est invisible tant qu'on n'ouvre pas les deux — c'est exactement ce qui a `
      + 'été demandé à la main sur un produit le 27/08, une fois quatre versions écrasées.');
  } else if (iRef) {
    add('PASS', 'FS3bis', `nom de fichier et référence interne portent le même indice (${iNom})`);
  }

  // ── FS4 · le lien de l'environnement DEV ────────────────────────────────────────────────
  const ligneDev = [...html.matchAll(/<tr>\s*<th[^>]*>([\s\S]*?)<\/th>\s*<td[^>]*>([\s\S]*?)<\/td>/gi)]
    .find(([, label]) => /\bDEV\b|développement|developpement/i.test(label));
  if (!ligneDev) {
    add('FAIL', 'FS4', "aucune ligne ne porte le lien de l'environnement DEV. C'est la seule information "
      + 'de la fiche qui permet à un tiers de CONSTATER par lui-même ce qui est exposé.');
  } else if (!/https?:\/\/[^\s"'<]+/i.test(ligneDev[2])) {
    add('FAIL', 'FS4', `la ligne « ${ligneDev[1].replace(/<[^>]*>/g, '').trim().slice(0, 60)} » ne porte pas d'URL : `
      + `« ${ligneDev[2].replace(/<[^>]*>/g, '').trim().slice(0, 60)} ». Un lien annoncé et absent vaut moins qu'un lien absent.`);
  } else {
    add('PASS', 'FS4', `lien DEV présent : ${(/https?:\/\/[^\s"'<]+/i.exec(ligneDev[2]) || [])[0].slice(0, 70)}`);
  }

  // ── FS5 · la mise en page ne réserve pas la page à la colonne des intitulés (TF-0697) ────
  const largeurTh = Number((/(?:^|[{;\s])th\s*\{[^}]*\bwidth\s*:\s*([\d.]+)%/i.exec(html) || [])[1]
    ?? (/(?:^|[{;\s])td\.k\s*\{[^}]*\bwidth\s*:\s*([\d.]+)%/i.exec(html) || [])[1]);
  const fixe = /table-layout\s*:\s*fixed/i.test(html);
  if (!Number.isFinite(largeurTh)) {
    add('SKIP', 'FS5', "aucune largeur de colonne d'intitulés déclarée en pourcentage : la mise en page "
      + "n'est pas jugée ici (elle l'est par la mesure au moteur, hors de cet oracle).");
  } else if (largeurTh > 25 || !fixe) {
    add('FAIL', 'FS5', `colonne d'intitulés à ${largeurTh} %${fixe ? '' : ' et `table-layout` NON fixe'}. `
      + 'Mesuré sur des fiches livrées : 32 % réservés à des intitulés courts (Nom, Tags, Budget) pendant '
      + 'que la colonne de droite porte des paragraphes entiers — 12,6 % à 19,4 % de largeur GASPILLÉS sur '
      + '7 tables sur 8. Sans `table-layout:fixed`, la largeur déclarée n\'est qu\'un vœu : le moteur '
      + "ré-élargit la colonne dès qu'un libellé s'allonge.");
  } else {
    add('PASS', 'FS5', `colonne d'intitulés à ${largeurTh} % avec table-layout fixe — la largeur déclarée est tenue`);
  }

  // ── FS6 / FS7 · le PDF RÉELLEMENT DIFFUSÉ ───────────────────────────────────────────────
  const pdf = pdfDe(fiche);
  if (sansPdf) {
    add('SKIP', 'FS6', '--sans-pdf : écart DÉCLARÉ. Le jeu remis est incomplet au regard du catalogue '
      + '(formats html + pdf) — le dire au destinataire fait partie de la remise.');
    add('SKIP', 'FS7', '--sans-pdf : aucun tirage à relire.');
  } else if (!fs.existsSync(pdf)) {
    add('FAIL', 'FS6', `aucun PDF de diffusion à côté du HTML (attendu : ${path.basename(pdf)}). Le HTML est la `
      + "révision de RÉFÉRENCE ; le PDF est ce qui PART. Une fiche rendue sans son PDF de même indice n'est "
      + 'pas complète — et un format qu\'aucun outil ne produit est un format qu\'on refait à la main, quand '
      + 'on y pense. `node fiche-en-pdf.mjs <fiche.html>` le produit.');
    add('SKIP', 'FS7', 'aucun tirage à relire.');
  } else {
    const iPdf = indiceDe(pdf);
    if (iNom && iPdf && iNom !== iPdf) {
      add('FAIL', 'FS6', `indices divergents : HTML ${iNom}, PDF ${iPdf}. Ce qui est diffusé n'est pas la `
        + 'révision de référence conservée à côté de lui.');
    } else {
      add('PASS', 'FS6', `PDF de diffusion présent${iPdf ? ` et de même indice (${iPdf})` : ''} : ${path.basename(pdf)}`);
    }
    const octets = fs.readFileSync(pdf);
    const { total, flux } = unitesDeTexte(octets);
    const images = (octets.toString('latin1').match(/\/Subtype\s*\/Image/g) || []).length;
    if (total < seuilTexte) {
      add('FAIL', 'FS7', `${total} unité(s) de texte extractible dans ${flux} flux de contenu (seuil ${seuilTexte}), `
        + `pour ${images} image(s) incorporée(s) et ${octets.length} octets : ce PDF est une CAPTURE, pas une `
        + 'impression. Conséquences vérifiables : non recherchable, MUET POUR UN LECTEUR D\'ÉCRAN alors que le '
        + "destinataire est l'équipe sécurité, non contrôlable par machine, et environ 5× plus lourd. Le gabarit "
        + 'porte déjà `@media print` et `@page` : `node fiche-en-pdf.mjs <fiche.html>` imprime au lieu de capturer.');
    } else {
      add('PASS', 'FS7', `${total} unités de texte extractible (seuil ${seuilTexte}), ${images} image(s) — `
        + 'tirage IMPRIMÉ, recherchable et lisible par un lecteur d\'écran');
    }
  }

  const echecs = F.filter((f) => f.statut === 'FAIL').length;
  return {
    oracle: 'verifier-fiche-securite',
    artefact: path.resolve(fiche),
    verdict: echecs ? 'FAIL' : 'PASS',
    findings: F,
    non_juge: [
      "la VÉRACITÉ des valeurs saisies : qu'une exposition annoncée « interne » le soit vraiment relève de "
      + "l'audit, pas de cet oracle — il juge qu'une réponse est là, jamais qu'elle est vraie",
      'la qualité RÉDACTIONNELLE de la fiche, et la pertinence des garde-fous décrits',
      'la conformité d\'accessibilité du PDF (PDF/UA, arbre de structure) : FS7 mesure la présence de texte '
      + 'extractible, ce qui sépare une impression d\'une capture — ce n\'est pas un audit d\'accessibilité',
      'la mise en page RENDUE : FS5 lit la feuille de style, il ne mesure pas au moteur (cette mesure vit '
      + 'dans `tools/fiche-en-pdf.mjs --self-test` et dans les tests, qui ont un navigateur)',
    ],
  };
}

// ── Auto-test À DOUBLE SENS — un cas vert accepté, un cas rouge par règle ────────────────────
const FICHE_VERTE = (ref = 'ACM-SEC-DEV-20260902a') => `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8">
<title>Fiche</title><style>table{table-layout:fixed;border-collapse:collapse;width:100%}
th{background:#eee;width:20%}td{overflow-wrap:break-word}</style></head><body>
<header>Réf. ${ref} · validée par le responsable sécurité</header>
<h1>Fiche sécurité</h1>
${Array.from({ length: 8 }, (_, k) => `<section><h2>${k + 1} · Section ${k + 1}</h2><table><tbody>`
    + (k === 0 ? '<tr><th>Lien environnement DEV</th><td>https://dev.exemple.test/app</td></tr>' : '')
    + `<tr><th>Champ ${k + 1}</th><td>valeur</td></tr></tbody></table></section>`).join('\n')}
<footer>Réf. ${ref} — 0 placeholder exigé avant diffusion.</footer>
</body></html>`;

/** Un PDF minimal VALIDE dont on choisit la quantité de texte montré et le nombre d'images. */
function pdfFabrique(unites, images = 0) {
  const chaine = 'Fiche securite de mise a disposition — ligne de texte reelle. ';
  const lignes = Math.ceil(unites / chaine.length);
  let contenu = 'BT\n/F1 11 Tf\n';
  for (let i = 0; i < lignes; i++) contenu += `1 0 0 -1 10 ${20 + i * 12} Tm\n(${chaine}) Tj\n`;
  contenu += 'ET\n';
  let corps = '%PDF-1.4\n';
  corps += `3 0 obj\n<< /Type /Page /MediaBox [0 0 595.28 841.89] /Contents 4 0 R >>\nendobj\n`;
  corps += `4 0 obj\n<< /Length ${contenu.length} >>\nstream\n${contenu}\nendstream\nendobj\n`;
  for (let i = 0; i < images; i++)
    corps += `${5 + i} 0 obj\n<< /Type /XObject /Subtype /Image /Width 8 /Height 8 >>\nendobj\n`;
  corps += 'trailer\n<< /Root 1 0 R >>\n%%EOF';
  return Buffer.from(corps, 'latin1');
}

function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fiche-sec-'));
  const casse = [];
  const ecrire = (nom, contenu) => { const p = path.join(dir, nom); fs.writeFileSync(p, contenu, 'utf8'); return p; };
  const statut = (r, regle) => (r.findings.find((f) => f.regle === regle) || {}).statut;

  // ── LE CAS VERT : une fiche complète, avec son PDF imprimé de même indice, est ACCEPTÉE. ──
  const vert = ecrire('ACM - Fiche Securite - Dev - 20260902a.html', FICHE_VERTE());
  fs.writeFileSync(pdfDe(vert), pdfFabrique(1200));
  let r = juger(vert);
  if (r.verdict !== 'PASS') casse.push('la fiche VERTE est refusée : ' + r.findings.filter((f) => f.statut === 'FAIL').map((f) => f.regle).join(','));

  // ── LES CAS ROUGES : un par règle, chacun le défaut réellement constaté. ──────────────────
  const rouge = (nom, contenu, regle, avecPdf = true, opts = {}) => {
    const p = ecrire(nom, contenu);
    if (avecPdf) fs.writeFileSync(pdfDe(p), pdfFabrique(1200));
    const j = juger(p, opts);
    if (statut(j, regle) !== 'FAIL') casse.push(`${regle} : le cas rouge « ${nom} » n'est PAS refusé (statut ${statut(j, regle)})`);
    if (j.verdict !== 'FAIL') casse.push(`${regle} : verdict ${j.verdict} sur un cas rouge`);
  };
  rouge('ACM - Fiche Securite - Dev - 20260902b.html',
    FICHE_VERTE('ACM-SEC-DEV-20260902b').replace('<td>valeur</td>', '<td>{{auth.mode}}</td>'), 'FS1');
  rouge('ACM - Fiche Securite - Dev - 20260902c.html',
    FICHE_VERTE('ACM-SEC-DEV-20260902c').replace(/<section><h2>8 · [\s\S]*?<\/section>/, ''), 'FS2');
  rouge('ACM - Fiche Securite - Dev - 20260902d.html',
    FICHE_VERTE('ACM-SEC-DEV-20260902d').replace('<footer>Réf. ACM-SEC-DEV-20260902d', '<footer>Réf. ACM-SEC-DEV-20260901a'), 'FS3');
  rouge('ACM - Fiche Securite - Dev - 20260902e.html', FICHE_VERTE('ACM-SEC-DEV-20260902a'), 'FS3bis');
  rouge('ACM - Fiche Securite - Dev - 20260902f.html',
    FICHE_VERTE('ACM-SEC-DEV-20260902f').replace('https://dev.exemple.test/app', 'à venir'), 'FS4');
  rouge('ACM - Fiche Securite - Dev - 20260902g.html',
    FICHE_VERTE('ACM-SEC-DEV-20260902g').replace('table-layout:fixed;', '').replace('width:20%', 'width:32%'), 'FS5');
  rouge('ACM - Fiche Securite - Dev - 20260902h.html', FICHE_VERTE('ACM-SEC-DEV-20260902h'), 'FS6', false);
  // FS7 : LE DÉFAUT FONDATEUR — un PDF d'une page, sans texte, plein d'images. Une capture.
  const capture = ecrire('ACM - Fiche Securite - Dev - 20260902i.html', FICHE_VERTE('ACM-SEC-DEV-20260902i'));
  fs.writeFileSync(pdfDe(capture), pdfFabrique(0, 9));
  r = juger(capture);
  if (statut(r, 'FS7') !== 'FAIL') casse.push("FS7 : un PDF SANS texte et à 9 images n'est pas refusé — c'est le défaut du 24/07, non attrapé");
  if (statut(r, 'FS6') !== 'PASS') casse.push('FS7 : le cas rouge de FS7 fait aussi tomber FS6 — la fixture ne prouve pas ce qu\'elle prétend');

  // Le PDF d'indice divergent : le second défaut du même dossier.
  const div = ecrire('ACM - Fiche Securite - Dev - 20260902j.html', FICHE_VERTE('ACM-SEC-DEV-20260902j'));
  fs.writeFileSync(path.join(dir, 'ACM - Fiche Securite - Dev - 20260902j.pdf'), pdfFabrique(1200));
  // Le nom du PDF ne peut pas diverger par construction (il dérive du HTML) : on prouve donc
  // l'autre sens, celui qui SE PRODUIT — le PDF absent, déjà couvert par FS6 ci-dessus.
  if (juger(div).verdict !== 'PASS') casse.push('la fiche témoin de contrôle est refusée à tort');

  // L'écart DÉCLARÉ ne se confond pas avec le défaut : il rend SKIP, jamais PASS silencieux.
  const sansPdf = ecrire('ACM - Fiche Securite - Dev - 20260902k.html', FICHE_VERTE('ACM-SEC-DEV-20260902k'));
  const j = juger(sansPdf, { sansPdf: true });
  if (statut(j, 'FS6') !== 'SKIP' || statut(j, 'FS7') !== 'SKIP')
    casse.push('--sans-pdf ne rend pas un SKIP motivé : un écart déclaré doit se lire, jamais se taire');

  fs.rmSync(dir, { recursive: true, force: true });
  console.log(casse.length
    ? 'SELF-TEST FAIL : ' + casse.join(' · ')
    : 'Self-test verifier-fiche-securite : 11/11 PASS — fiche complète acceptée · placeholder résiduel (FS1), '
      + 'section perdue (FS2), références divergentes en-tête/pied (FS3), indice du nom ≠ indice imprimé (FS3bis), '
      + 'lien DEV sans URL (FS4), colonne à 32 % sans table-layout fixe (FS5), PDF de diffusion absent (FS6) et '
      + 'PDF sans texte à 9 images — la capture du 24/07 (FS7) : tous REFUSÉS · --sans-pdf rendu en SKIP motivé');
  return casse.length ? 1 : 0;
}

// ── Ligne de commande ────────────────────────────────────────────────────────────────────────
if (path.resolve(process.argv[1] ?? '') === path.resolve(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) process.exit(selfTest());
  const opt = (n, d = null) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
  const jsonOnly = args.includes('--json-only');
  const cible = args.find((a) => !a.startsWith('--') && /\.html?$/i.test(a));
  if (!cible || !fs.existsSync(cible)) {
    process.stdout.write(JSON.stringify({
      oracle: 'verifier-fiche-securite', artefact: cible ? path.resolve(cible) : null, verdict: 'SKIP',
      findings: [{ statut: 'SKIP', regle: 'FS0', message: cible ? `fiche introuvable : ${cible}` : 'aucune fiche .html donnée — rien à juger' }],
      non_juge: [],
    }, null, jsonOnly ? 0 : 2) + '\n');
    process.exit(2);
  }
  const rapport = juger(cible, {
    seuilTexte: opt('--seuil-texte') ? Number(opt('--seuil-texte')) : SEUIL_TEXTE,
    sansPdf: args.includes('--sans-pdf'),
  });
  process.stdout.write(JSON.stringify(rapport, null, jsonOnly ? 0 : 2) + '\n');
  process.exit(rapport.verdict === 'FAIL' ? 1 : 0);
}
