#!/usr/bin/env node
// verifier-pdf — le PDF PRODUIT est relu, jamais deduit de la commande (TF-0506, 23/08/2026).
//
// POURQUOI CET ORACLE EXISTE. Le catalogue de la bibliotheque declare deux formats pour la fiche
// securite — html ET pdf — et la forge n'en produisait qu'un. Trois consequences, toutes
// observees le 22/08 sur une production reelle :
//   (a) le jeu de livrables a ete remis INCOMPLET, et c'est LE COMMANDITAIRE qui a du reclamer le
//       second format : le PDF est ce qui circule en piece jointe et ce qui s'imprime ;
//   (b) le generateur PDF a ete reecrit DE ZERO cote produit, alors que le gabarit portait deja
//       tout le travail difficile (@page A4, marges, hauteur dimensionnee par le contenu) ;
//   (c) UN PIEGE S'EST REFERME : sous Windows, un PDF ouvert dans une visionneuse VERROUILLE le
//       fichier. Le navigateur echoue a l'ecrire SANS LE DIRE, et le script a revalide L'ANCIEN
//       TIRAGE en croyant valider le nouveau. Le defaut n'a ete vu qu'en comparant l'horodatage
//       du fichier a celui du lancement.
//
// D'ou la regle de cet oracle, et elle tient en une phrase : ON RELIT LE FICHIER, ON NE CROIT
// PAS LA COMMANDE. Un code de retour 0 d'un navigateur ne prouve pas qu'un octet a ete ecrit.
//
//   node oracles/verifier-pdf.mjs <fichier.pdf> [--format A4] [--pages-max N]
//        [--apres <horodatage ms>] [--source <fichier>] [--json-only]
//
// Verdicts : PASS (exit 0) · FAIL (exit 1) · SKIP motive (exit 2, rien a juger).
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
const jsonOnly = args.includes('--json-only');
const cible = args.find((a) => !a.startsWith('--') && /\.pdf$/i.test(a));
const format = (opt('--format', 'A4') || 'A4').toUpperCase();
const pagesMax = opt('--pages-max') ? Number(opt('--pages-max')) : null;
const apres = opt('--apres') ? Number(opt('--apres')) : null;
const source = opt('--source');

// A4 en points PostScript : 595,28 × 841,89. Tolerance de 4 pt — les moteurs d'impression
// arrondissent (Edge rend 594,96 × 841,92 sur la meme feuille de style), et refuser un tirage
// pour trois dixiemes de point serait un controle qui apprend a etre contourne.
const FORMATS = { A4: { l: 595.28, h: 841.89 }, A3: { l: 841.89, h: 1190.55 }, LETTER: { l: 612, h: 792 } };
const TOLERANCE_PT = 4;

const F = [];
const add = (statut, regle, message) => F.push({ statut, regle, message });
const NJ = [
  "le CONTENU du PDF : ni le texte, ni les polices incorporees, ni les images — cet oracle juge le contenant (format, pages, fraicheur)",
  "un PDF dont les dictionnaires de pages sont dans un flux COMPRESSE ne livre pas /MediaBox en clair : le format est alors declare NON JUGE, jamais faux",
  "la conformite d'accessibilite du PDF (PDF/UA, arbre de structure) — hors perimetre, et aucun moteur d'impression de navigateur ne la produit",
];

const sortir = (verdict, code) => {
  process.stdout.write(JSON.stringify({
    oracle: 'verifier-pdf', artefact: cible ? path.resolve(cible) : null, verdict,
    findings: F, non_juge: NJ,
  }, null, jsonOnly ? 0 : 2) + '\n');
  process.exit(code);
};

if (!cible) {
  add('SKIP', 'P0', 'aucun fichier .pdf donne — rien a juger');
  sortir('SKIP', 2);
}
if (!fs.existsSync(cible)) {
  // C'EST LE CAS DU VERROU WINDOWS, et il ne doit jamais passer pour une absence benigne : le
  // navigateur a rendu 0 et le fichier n'existe pas.
  add('FAIL', 'P1', `fichier absent : ${cible}. Si un moteur d'impression vient de rendre 0, ` +
    "c'est precisement le piege mesure le 22/08 — un PDF ouvert dans une visionneuse verrouille " +
    "le fichier et l'ecriture echoue en silence. Fermer la visionneuse et rejouer");
  sortir('FAIL', 1);
}

const st = fs.statSync(cible);
const octets = fs.readFileSync(cible);
const texte = octets.toString('latin1');

// ---- P1 · c'est un PDF, et il est complet -----------------------------------------------
if (!texte.startsWith('%PDF-')) {
  add('FAIL', 'P1', `en-tete %PDF- absent : le fichier existe et n'est pas un PDF (${st.size} octets)`);
  sortir('FAIL', 1);
}
if (!/%%EOF\s*$/.test(texte.slice(-64))) {
  add('FAIL', 'P1', 'marqueur de fin %%EOF absent — tirage TRONQUE : le fichier a ete ecrit ' +
    'partiellement (processus interrompu, disque plein, ou verrou pose pendant l\'ecriture)');
} else {
  add('PASS', 'P1', `PDF complet : en-tete ${texte.slice(0, 8).trim()}, %%EOF present, ${st.size} octets`);
}

// ---- P2 · le FORMAT, relu dans le fichier ------------------------------------------------
const boites = [...texte.matchAll(/\/MediaBox\s*\[\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*\]/g)]
  .map((m) => m.slice(1, 5).map(Number));
const attendu = FORMATS[format];
if (!boites.length) {
  add('SKIP', 'P2', `aucun /MediaBox en clair — dictionnaires de pages probablement dans un flux ` +
    `compresse. Le format n'est PAS juge (declare, jamais devine)`);
} else if (!attendu) {
  add('SKIP', 'P2', `format « ${format} » inconnu de l'oracle (connus : ${Object.keys(FORMATS).join(', ')})`);
} else {
  const mauvaises = boites.filter(([x0, y0, x1, y1]) => {
    const l = Math.abs(x1 - x0), h = Math.abs(y1 - y0);
    return Math.abs(l - attendu.l) > TOLERANCE_PT || Math.abs(h - attendu.h) > TOLERANCE_PT;
  });
  if (mauvaises.length) {
    add('FAIL', 'P2', `${mauvaises.length} page(s) hors ${format} portrait : ` +
      mauvaises.slice(0, 3).map(([x0, y0, x1, y1]) =>
        `${Math.round(Math.abs(x1 - x0))}×${Math.round(Math.abs(y1 - y0))} pt`).join(', ') +
      ` (attendu ${Math.round(attendu.l)}×${Math.round(attendu.h)} pt a ${TOLERANCE_PT} pt pres). ` +
      "La feuille de style du gabarit fait foi pour les marges : c'est la que se corrige un format, " +
      'jamais dans la ligne de commande');
  } else {
    add('PASS', 'P2', `${boites.length} page(s) au format ${format} portrait ` +
      `(${Math.round(Math.abs(boites[0][2] - boites[0][0]))}×${Math.round(Math.abs(boites[0][3] - boites[0][1]))} pt), ` +
      'lu dans le fichier');
  }
}

// ---- P3 · le NOMBRE DE PAGES, relu dans le fichier ---------------------------------------
const pages = (texte.match(/\/Type\s*\/Page(?![s/])/g) || []).length
  || Number((texte.match(/\/Count\s+(\d+)/) || [])[1] || 0);
if (!pages) {
  add('SKIP', 'P3', 'nombre de pages illisible (objets compresses) — non juge');
} else if (pagesMax && pages > pagesMax) {
  add('FAIL', 'P3', `${pages} pages pour un maximum de ${pagesMax} : le tirage a debordé. ` +
    'Un compte de pages se regle dans la feuille de style (hauteur dimensionnee par le contenu, ' +
    'overflow visible), pas en reduisant le contenu');
} else {
  add('PASS', 'P3', `${pages} page(s)${pagesMax ? ` (maximum ${pagesMax})` : ''}, lues dans le fichier`);
}

// ---- P4 · la FRAICHEUR : c'est ce controle qui attrape le verrou Windows ------------------
// Deux comparaisons, et il faut les DEUX : posterieur au lancement (sinon c'est un ancien
// tirage), et posterieur a sa source (sinon la source a change depuis le tirage).
if (apres === null && !source) {
  add('SKIP', 'P4', "fraicheur non jugee : ni --apres <horodatage du lancement> ni --source. " +
    "C'est le controle qui a manque le 22/08 — un ancien tirage a ete revalide en croyant valider " +
    'le nouveau. Le donner change tout, et il ne coute rien');
} else {
  let frais = true;
  if (apres !== null && st.mtimeMs < apres - 1000) {
    frais = false;
    add('FAIL', 'P4', `tirage ANTERIEUR au lancement : fichier ecrit a ${new Date(st.mtimeMs).toISOString()}, ` +
      `lancement a ${new Date(apres).toISOString()}. Le PDF que vous relisez n'est pas celui que vous ` +
      "venez de demander — sous Windows, une visionneuse ouverte verrouille le fichier et l'ecriture " +
      'echoue SANS LE DIRE. Fermer la visionneuse et rejouer');
  }
  if (source && fs.existsSync(source)) {
    const sm = fs.statSync(source).mtimeMs;
    if (st.mtimeMs < sm - 1000) {
      frais = false;
      add('FAIL', 'P4', `tirage ANTERIEUR a sa source (${path.basename(source)} modifiee a ` +
        `${new Date(sm).toISOString()}, PDF ecrit a ${new Date(st.mtimeMs).toISOString()}) : ` +
        'le livrable ne reflete plus ce qu\'il pretend rendre');
    }
  }
  if (frais) {
    add('PASS', 'P4', `tirage frais : ecrit a ${new Date(st.mtimeMs).toISOString()}` +
      (apres !== null ? ', posterieur au lancement' : '') +
      (source ? ', posterieur a sa source' : ''));
  }
}

const echecs = F.filter((f) => f.statut === 'FAIL').length;
sortir(echecs ? 'FAIL' : 'PASS', echecs ? 1 : 0);
