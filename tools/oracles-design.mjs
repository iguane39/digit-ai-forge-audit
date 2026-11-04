// AuditCore — point de branchement des ORACLES DE DESIGN de la forge design (TF-2139, RU-6, 04/11/2026).
//
// LE FAIT. Le rapport HTML rendu par `rapport-engine.mjs` rendait FAIL à `run-oracles-design` (forge-design) : 11 écarts
// durs d'oracle-slop (bandeaux latéraux, accents néon, emoji) et 77 d'oracle-tokens (couleurs et espacements en dur) —
// sans que rien, ici, ne le voie : le hook de fin de tour exige la critique de tout HTML écrit, la porte de rendu du
// dépôt (`verifier-rapport-html.mjs`) n'en jugeait aucune. Elle les joue désormais, à la production du rapport.
//
// LE POINT DE BRANCHEMENT. `run-oracles-design.mjs` vit dans le dépôt FRÈRE `digit-ai-forge-design` (dossier
// `oracles/`) ; il se lance par `node <racine>/oracles/run-oracles-design.mjs <fichier.html> --json-only` et rend un
// JSON { verdict, oracles[{ oracle, verdict, findings[{ sev, regle, msg, where }] }] } avec la sortie 0 (PASS), 1 (FAIL)
// ou 2 (indéterminé). La racine se résout, dans l'ordre :
//   1. l'option `--design-root <dossier>` de `verifier-rapport-html.mjs` — introuvable : erreur (sortie 2), on ne saute
//      pas en silence un contrôle qu'on a demandé par son nom ;
//   2. la variable d'environnement `FORGE_DESIGN_ROOT` — même règle ;
//   3. le dépôt voisin `../digit-ai-forge-design` (convention du parc : les forges sont des frères sous une racine
//      commune) — absent : le contrôle est déclaré NON JUGÉ, avec son motif, jamais compté vert. C'est le cas d'un
//      runner de CI, qui ne clone pas les forges sœurs : un dépôt absent est une mesure qu'on n'a pas pu faire, pas un
//      rouge d'environnement (même convention que `verifier-heritage.mjs`).
// Ce dépôt est autonome (il se clone seul, ses kits n'ont aucun dépôt frère) : l'oracle n'est donc ni copié ni
// importé, il est APPELÉ s'il est là. Une copie dériverait ; un import casserait la CI.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT } from './lib.mjs';

const ORACLE = path.join('oracles', 'run-oracles-design.mjs');
const porteUnOrchestrateur = (racine) => fs.existsSync(path.join(racine, ORACLE));

/**
 * La racine de forge-design. Rend { racine } trouvée, { erreur } si une racine DEMANDÉE (option, variable) est
 * introuvable, { racine: null, motif } si rien n'est demandé et que le voisin est absent.
 */
export function trouverRacineDesign({ option, env, voisin = path.resolve(ROOT, '..', 'digit-ai-forge-design') } = {}) {
  for (const [origine, valeur] of [['--design-root', option], ['FORGE_DESIGN_ROOT', env]]) {
    if (valeur === undefined || valeur === '') continue;
    const racine = path.resolve(valeur);
    return porteUnOrchestrateur(racine)
      ? { racine }
      : { erreur: `racine des oracles de design introuvable (${origine} = ${racine}) : ${ORACLE} n'y est pas` };
  }
  if (porteUnOrchestrateur(voisin)) return { racine: voisin };
  return { racine: null, motif: `ni --design-root, ni FORGE_DESIGN_ROOT, et le dépôt voisin digit-ai-forge-design est absent (${voisin}) — `
    + 'run-oracles-design n\'a pas été joué sur ce poste' };
}

/** Joue run-oracles-design sur un fichier. Rend { verdict, erreurs[], avertissements[] }. */
export function jouerOraclesDesign(fichier, racine) {
  const r = spawnSync(process.execPath, [path.join(racine, ORACLE), path.resolve(fichier), '--json-only'],
    { encoding: 'utf8', timeout: 180000, maxBuffer: 1e8, cwd: racine });
  let rapport;
  try { rapport = JSON.parse(r.stdout); } catch { rapport = null; }
  if (!rapport || !Array.isArray(rapport.oracles)) {
    return { verdict: 'INDETERMINE', erreurs: [], avertissements: [`run-oracles-design n'a pas rendu de JSON exploitable (sortie ${r.status}) : ${String(r.stderr || r.stdout).trim().slice(0, 200)}`] };
  }
  if (r.status === 2 || rapport.verdict === 'INDETERMINE') {
    return { verdict: 'INDETERMINE', erreurs: [], avertissements: [`run-oracles-design indéterminé (sortie ${r.status}) : ${(rapport.non_juge ?? []).slice(0, 2).join(' ; ')}`] };
  }
  const erreurs = [];
  for (const o of rapport.oracles.filter((x) => x.verdict === 'FAIL')) {
    const durs = (o.findings ?? []).filter((f) => f.sev === 'bloquant' || f.sev === 'majeur');
    erreurs.push(`${o.oracle} : ${durs.length || o.ecarts_durs} écart(s) dur(s) — `
      + durs.slice(0, 5).map((f) => `${f.regle} ${f.msg}${f.where ? ` (${String(f.where).slice(0, 60)})` : ''}`).join(' ; ')
      + (durs.length > 5 ? ` ; … ${durs.length - 5} autre(s)` : ''));
  }
  return { verdict: rapport.verdict, erreurs, avertissements: [] };
}
