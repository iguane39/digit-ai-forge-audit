#!/usr/bin/env node
// =============================================================================
// verifier-roundtrip.mjs — Oracle de ROUND-TRIP pour tout livrable GÉNÉRÉ (Fiche Sécurité,
// Rapport d'audit, annexes, Compliance Pack…).
//
// Loi qualité : « itérer par éditions chirurgicales sur la SOURCE, jamais régénérer de zéro ».
// Une édition faite sur la SORTIE (artefact) est perdue à la régénération suivante si elle n'est pas
// réinjectée dans la source (gabarit + données/repl). Cet oracle PROUVE que régénérer reproduit la
// version validée à l'identique — sinon la génération DÉTRUIT du travail à chaque passe.
//
//   Oracle round-trip : node verifier-roundtrip.mjs --reference <validée/éditée> --candidate <régénérée> [--ignore <regex>]…
//   Garde anti-écrasement : node verifier-roundtrip.mjs --guard --reference <dernière livrée> --candidate <nouvelle sortie> [--ignore <regex>]…
//
// --ignore <regex> : neutralise les différences ATTENDUES (référence/date de version), répétable.
// --no-check-placeholders : ne pas exiger l'absence de {{…}} dans le candidat (activé par défaut sinon).
//
// Exit 0 = identique (hors --ignore) et 0 placeholder résiduel · 1 = delta manqué / placeholder résiduel · 2 = usage.
// =============================================================================
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const opts = (n) => args.reduce((a, v, i) => (args[i - 1] === n ? [...a, v] : a), []);
const has = (n) => args.includes(n);
const refArg = opt('--reference'), candArg = opt('--candidate');
const guard = has('--guard'), checkPlaceholders = !has('--no-check-placeholders');
if (!refArg || !candArg) { console.error('usage: node verifier-roundtrip.mjs --reference <f> --candidate <f> [--ignore <regex>]… [--guard] [--no-check-placeholders]'); process.exit(2); }
let refTxt, candTxt;
try { refTxt = fs.readFileSync(refArg, 'utf8'); candTxt = fs.readFileSync(candArg, 'utf8'); }
catch (e) { console.error('lecture impossible : ' + e.message); process.exit(2); }

// Neutraliser les différences attendues (version/date) dans LES DEUX fichiers, à l'identique.
const ignores = opts('--ignore');
let refN = refTxt, candN = candTxt;
for (const pat of ignores) { let re; try { re = new RegExp(pat, 'g'); } catch (e) { console.error('regex --ignore invalide « ' + pat +' » : ' + e.message); process.exit(2); } refN = refN.replace(re, '§IGN§'); candN = candN.replace(re, '§IGN§'); }

// Diff ligne à ligne, ancré (resync borné) — le round-trip attend des écarts minimes.
function diffLines(a, b, maxHunks = 25, win = 400) {
  const hunks = []; let i = 0, j = 0;
  while (i < a.length || j < b.length) {
    if (i < a.length && j < b.length && a[i] === b[j]) { i++; j++; continue; }
    let r = null;
    for (let k = 1; k < win; k++) {
      if (i + k < a.length && j + k < b.length && a[i + k] === b[j + k]) { r = { da: k, db: k }; break; }
      if (j + k < b.length && a[i] === b[j + k]) { r = { da: 0, db: k }; break; }
      if (i + k < a.length && a[i + k] === b[j]) { r = { da: k, db: 0 }; break; }
    }
    const da = r ? r.da : (a.length - i), db = r ? r.db : (b.length - j);
    hunks.push({ refLine: i + 1, candLine: j + 1, removed: a.slice(i, i + da), added: b.slice(j, j + db) });
    i += da; j += db;
    if (hunks.length >= maxHunks) { hunks.push({ truncated: true }); break; }
  }
  return hunks;
}
const hunks = diffLines(refN.split(/\r?\n/), candN.split(/\r?\n/));

// Placeholders résiduels dans le candidat (le livrable généré ne doit contenir aucun {{…}}).
const residual = checkPlaceholders ? [...new Set((candTxt.match(/\{\{[^}]*\}\}/g) || []))] : [];

const bloquant = hunks.length > 0 || residual.length > 0;
if (bloquant) {
  if (hunks.length) {
    console.log((guard
      ? '❌ GARDE ANTI-ÉCRASEMENT : la nouvelle sortie DIFFÈRE de la dernière version livrée/éditée (hors version) — des modifications ne sont PAS reprises dans la source. Ne pas écraser en silence :'
      : '❌ ROUND-TRIP CASSÉ : la régénération ne reproduit PAS la version validée (hors version) — un delta n\'a pas été réinjecté dans la source, ou l\'a été au mauvais endroit :'));
    for (const h of hunks) {
      if (h.truncated) { console.log('   … (diff tronqué)'); break; }
      console.log('   @ réf L' + h.refLine + ' / cand L' + h.candLine);
      h.removed.slice(0, 4).forEach(l => console.log('     - ' + l.slice(0, 160)));
      h.added.slice(0, 4).forEach(l => console.log('     + ' + l.slice(0, 160)));
    }
    console.log('→ Réinjecter chaque delta dans la SOURCE (gabarit = structure/libellé ; données/repl = valeur), jamais sur la sortie. Puis régénérer et relancer cet oracle.');
  }
  if (residual.length) console.log('❌ PLACEHOLDERS résiduels dans le candidat : ' + residual.slice(0, 8).join(' · ') + (residual.length > 8 ? ' …' : '') + ' — valeurs non pilotées par les données.');
  process.exitCode = 1;
} else {
  console.log('✓ ' + (guard ? 'Aucune modification non reprise' : 'Round-trip vérifié') + ' : « ' + candArg.split(/[\\/]/).pop() + ' » est identique à « ' + refArg.split(/[\\/]/).pop() + ' » (hors ' + (ignores.length ? ignores.length + ' motif(s) neutralisé(s)' : 'rien') + ')' + (checkPlaceholders ? ', 0 placeholder résiduel' : '') + '.');
  process.exitCode = 0;
}
