#!/usr/bin/env node
/**
 * decouvrir-oracles.mjs — les oracles de forge-audit, LUS SUR LE DISQUE, jamais recopiés d'une
 * liste (TF-1319, 23/09/2026 : temps 2 du verdict O3 de l'étude du pilot du 19/08/2026 sur le
 * méta-oracle d'enclenchement).
 *
 * POURQUOI. Un run consigne au ledger une entrée `oracles_verdict` par oracle qui a tourné (forme
 * canonique TF-0385). Pour dire lesquels MANQUENT, le juge du pilot doit savoir ce que chaque forge
 * mobilisée porte. Mesuré le 23/09/2026 : `oracles/` porte 12 scripts ; le tableau du README de ce
 * dossier en décrit 9 (`verifier-fiche-securite`, `verifier-parite-gabarits` et `verifier-pdf` n'y
 * figurent pas) ; la CI n'en appelle que 2 par leur nom. Trois listes, écrites à la main, et aucune
 * ne dit ce que la forge porte. L'étude du 19/08 comptait zéro oracle ici : elle cherchait le
 * préfixe `oracle-`, que cette forge n'emploie pas.
 *
 * LA RÈGLE N'EST DONC PAS UN NOM, C'EST LE DOSSIER. Le README d'`oracles/` pose la distinction qui
 * structure le produit : `oracles/` vérifie le SYSTÈME AUDITÉ, `tools/` produit et vérifie les
 * LIVRABLES d'audit. Est découvert tout script `.mjs` du premier niveau d'`oracles/`, hors ce
 * script-ci et hors recette `*.test.mjs`. Les vérificateurs de livrables de `tools/`
 * (`verifier-rapport*.mjs`…) n'y entrent pas : le non_juge le dit, avec leur nombre — un run qui les
 * consigne au ledger les verra signalés, jamais accusés.
 *
 * LE CONTRAT, COMMUN AU PARC (`digit-ai/decouverte-oracles@1`, CONTRAT-INTERFACE.md §3 du pilot) :
 *   node oracles/decouvrir-oracles.mjs [--racine <dossier>]
 *   stdout : { contrat, forge, racine, regle, oracles: [{ nom, chemin }], non_juge: [] }
 *   exit 0 : découverte faite — une liste vide est un résultat, et elle se lit comme telle ;
 *   exit 2 : dossier des oracles illisible, motif dit. Jamais d'exit 1 : découvrir n'est pas juger.
 * Ce script ne lance aucun oracle, ne touche aucun système audité et n'écrit rien.
 *
 * Recette à double sens : `tests/oracles/decouvrir-oracles.test.mjs` (jouée par la CI).
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const CONTRAT = 'digit-ai/decouverte-oracles@1';
export const FORGE = 'digit-ai-forge-audit';
export const REGLE = 'tout script `.mjs` du premier niveau d\'`oracles/` (contrôles exécutés contre le système audité), '
  + 'hors `decouvrir-oracles.mjs` et hors recettes `*.test.mjs` — lu sur le disque à chaque appel';

const MOI = 'decouvrir-oracles.mjs';

/** Un script du dossier est un oracle s'il est un module Node, et ni ce script-ci ni une recette. */
export const EST_UN_ORACLE = (nom) => nom.endsWith('.mjs') && nom !== MOI && !nom.endsWith('.test.mjs');

/** La découverte au contrat commun. `racine` = la racine de la forge (le parent d'`oracles/`). */
export function decouvrirOracles(racine) {
  const dossier = join(racine, 'oracles');
  const base = { contrat: CONTRAT, forge: FORGE, racine, regle: REGLE, oracles: [] };
  let lisible = false;
  try { lisible = existsSync(dossier) && statSync(dossier).isDirectory(); } catch { lisible = false; }
  if (!lisible) {
    return { ...base, motif: `dossier des oracles introuvable ou illisible : ${dossier} — rien n'a été découvert`, non_juge: [] };
  }
  const oracles = readdirSync(dossier, { withFileTypes: true })
    .filter((e) => e.isFile() && EST_UN_ORACLE(e.name))
    .map((e) => ({ nom: e.name.replace(/\.mjs$/, ''), chemin: `oracles/${e.name}` }))
    .sort((a, b) => (a.chemin < b.chemin ? -1 : a.chemin > b.chemin ? 1 : 0));
  // Ce que la règle laisse dehors À DESSEIN, compté sur le disque plutôt qu'affirmé : les
  // `verifier-*` de `tools/`, que le README d'`oracles/` range du côté des LIVRABLES d'audit.
  let verificateursDeTools = [];
  try {
    verificateursDeTools = readdirSync(join(racine, 'tools')).filter((f) => /^verifier-[\w-]+\.mjs$/.test(f)).sort();
  } catch { verificateursDeTools = []; }
  return {
    ...base,
    oracles,
    non_juge: [
      'la règle lit le DOSSIER : un contrôle du système audité rangé ailleurs qu\'au premier niveau d\'`oracles/` n\'est pas découvert',
      'découvrir n\'est pas lancer : cette liste ne dit ni qu\'un oracle a tourné, ni sur quel système il s\'applique (granularité retenue : la forge, étude du 19/08 §5)',
      ...(verificateursDeTools.length
        ? [`${verificateursDeTools.length} script(s) \`verifier-*\` sous \`tools/\` (${verificateursDeTools.join(', ')}) ne sont pas découverts : \`tools/\` produit et vérifie les LIVRABLES d'audit, pas le système audité (README d'\`oracles/\`) — un verdict consigné à leur nom sera signalé par le juge, jamais accusé`]
        : []),
    ],
  };
}

// ---- CLI -------------------------------------------------------------------------------------
const lanceEnDirect = process.argv[1]
  && fileURLToPath(import.meta.url).toLowerCase().split('\\').join('/')
     === resolve(process.argv[1]).toLowerCase().split('\\').join('/');
if (lanceEnDirect) {
  const args = process.argv.slice(2);
  const i = args.indexOf('--racine');
  const racine = resolve(i >= 0 && args[i + 1] ? args[i + 1] : join(dirname(fileURLToPath(import.meta.url)), '..'));
  const r = decouvrirOracles(racine);
  console.log(JSON.stringify(r, null, 1));
  process.exit(r.motif ? 2 : 0);
}
