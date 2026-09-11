#!/usr/bin/env node
// =============================================================================
// AuditCore — verifier-referentiel (TF-1014) : LE JUGE DU RÉFÉRENTIEL LUI-MÊME.
//
// LE FAIT QUI A PRODUIT CE JUGE (mesure du 10/09/2026). Le référentiel de référence décrivait
// chaque dimension par des THÈMES de périmètre, des TYPES de preuve, des LIVRABLES attendus et un
// BARÈME. Le référentiel courant ne décrivait une dimension que par ses contrôles CTL : 17
// dimensions sur 18 n'avaient, dans le modèle, ni thème, ni preuve, ni livrable — et RIEN ne le
// disait. Le référentiel se rendait, complet en apparence, parce qu'aucun juge ne regardait ce
// qu'il ne portait pas. Un référentiel incomplet qui se rend sans broncher est le défaut que ce
// fichier existe pour attraper.
//
// LA RÈGLE, UNE SEULE, ET ELLE EST DURE : une dimension APPLICABLE qui n'a ni thème, ni preuve,
// ni livrable rend le référentiel INCOMPLET (FAIL), et elle est NOMMÉE. Une dimension qui n'a
// aucun profil applicable (`off` partout) n'est pas jugée : elle est déclarée dans `non_juge`,
// jamais comptée verte en silence.
//
// CE QU'IL NE JUGE PAS, ET IL LE DIT (`non_juge`) : la JUSTESSE de la doctrine (un thème peut
// être présent et faux — cela se juge en revue humaine, pas ici) ; la SUFFISANCE (trois thèmes
// valent-ils neuf ?) ; la cohérence entre la doctrine et les contrôles CTL de la même dimension ;
// la pseudonymisation du pack (garde-fou de `tools/importer-doctrine.mjs`, à l'import) ; la
// complétude du barème (une dimension peut porter thèmes et preuves sans barème et rester verte).
//
// Usage :
//   node tools/verifier-referentiel.mjs [--dimensions <dimensions.yaml>] [--doctrine <doctrine.yaml>]
//                                       [--type <web-app|api|data|mobile|ml|infra>] [--out <rapport.json>]
// Sortie : rapport JSON { oracle, verdict: PASS|FAIL, findings[], non_juge[] } sur la sortie standard.
// Exit : 0 = PASS · 1 = FAIL · 2 = usage (fichier absent, illisible) — jamais un PASS par défaut.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { rel, loadYaml } from './lib.mjs';

const ORACLE = 'verifier-referentiel';
const args = process.argv.slice(2);
const opt = (n, d = null) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };

const dimensionsPath = path.resolve(opt('--dimensions', rel('core', 'dimensions', 'dimensions.yaml')));
const doctrinePath = path.resolve(opt('--doctrine', rel('core', 'dimensions', 'doctrine.yaml')));
const typeVoulu = opt('--type');
const outPath = opt('--out');

const usage = (msg) => {
  console.error(`usage: node tools/verifier-referentiel.mjs [--dimensions <dimensions.yaml>] [--doctrine <doctrine.yaml>] [--type <projet>] [--out <rapport.json>]`);
  console.error(`  ${msg}`);
  process.exit(2);
};
if (!fs.existsSync(dimensionsPath)) usage(`pack de dimensions introuvable : ${dimensionsPath}`);
if (!fs.existsSync(doctrinePath)) usage(`pack de doctrine introuvable : ${doctrinePath} — un référentiel sans pack de doctrine ne se juge pas complet par défaut`);

let pack, doctrinePack;
try { pack = loadYaml(dimensionsPath); } catch (e) { usage(`pack de dimensions illisible : ${e.message}`); }
try { doctrinePack = loadYaml(doctrinePath); } catch (e) { usage(`pack de doctrine illisible : ${e.message}`); }
if (!Array.isArray(pack?.dimensions)) usage('le pack de dimensions ne porte pas de liste `dimensions`');

const doctrine = doctrinePack?.dimensions ?? {};
const TYPES = pack.project_types ?? ['web-app', 'api', 'data', 'mobile', 'ml', 'infra'];
if (typeVoulu && !TYPES.includes(typeVoulu)) usage(`type de projet inconnu : ${typeVoulu} (attendus : ${TYPES.join(', ')})`);

/**
 * Applicable = le profil demandé n'est pas `off` ; sans profil demandé, au moins un type de
 * projet n'est pas `off`. Une applicabilité absente vaut `full` (défaut du pack, cf. build-referentiel).
 */
const applicable = (d) => {
  const app = d.applicability ?? {};
  const valeurs = typeVoulu ? [app[typeVoulu] ?? 'full'] : TYPES.map((t) => app[t] ?? 'full');
  return valeurs.some((v) => v !== 'off');
};

const findings = [];
const non_juge = [
  "justesse de la doctrine : un thème, une preuve ou un livrable peut être présent ET faux — cela se juge en revue humaine, pas ici",
  "suffisance de la doctrine : le nombre de thèmes, de preuves ou de livrables n'est pas confronté à un attendu",
  "cohérence entre la doctrine d'une dimension et ses contrôles CTL (aucun rapprochement fait ici)",
  "pseudonymisation du pack (commanditaire, éditeurs, produits) : jugée à l'import par le garde-fou de tools/importer-doctrine.mjs",
  "complétude du barème : une dimension portant thèmes, preuves et livrables sans barème reste PASS",
];

let jugees = 0, complets = 0;
const horsPerimetre = [];
for (const d of pack.dimensions) {
  if (!applicable(d)) {
    horsPerimetre.push(d.id);
    continue;
  }
  jugees++;
  const doc = doctrine[d.id] ?? {};
  const nbThemes = (doc.themes ?? []).length;
  const nbPreuves = (doc.preuves ?? []).length;
  const nbLivrables = (doc.livrables ?? []).length;
  if (nbThemes === 0 && nbPreuves === 0 && nbLivrables === 0) {
    findings.push({
      regle: 'RF1',
      dimension: d.id,
      libelle: d.label ?? '',
      gravite: 'BLOQUANT',
      constat: `dimension applicable « ${d.id} — ${d.label ?? ''} » : ni thème de périmètre, ni type de preuve, ni livrable attendu — le référentiel est incomplet sur cette dimension`,
      ou: path.relative(process.cwd(), doctrinePath) + ` → dimensions.${d.id}`,
      correction: `alimenter la doctrine de ${d.id} (import depuis une source, ou rédaction humaine), ou consigner son absence motivée dans core/dimensions/doctrine-ecarts.md`,
    });
  } else {
    complets++;
  }
}
if (horsPerimetre.length) {
  non_juge.push(`dimension(s) sans aucun profil applicable (\`off\` partout), non jugée(s) : ${horsPerimetre.join(', ')}`);
}

const verdict = findings.length ? 'FAIL' : 'PASS';
const rapport = {
  oracle: ORACLE,
  verdict,
  lu: {
    pack_dimensions: path.relative(process.cwd(), dimensionsPath),
    pack_doctrine: path.relative(process.cwd(), doctrinePath),
    type_de_projet: typeVoulu ?? '(tous)',
    dimensions_totales: pack.dimensions.length,
    dimensions_jugees: jugees,
    dimensions_completes: complets,
    dimensions_incompletes: findings.length,
  },
  findings,
  non_juge,
};

const texte = JSON.stringify(rapport, null, 2);
console.log(texte);
if (outPath) { fs.mkdirSync(path.dirname(path.resolve(outPath)), { recursive: true }); fs.writeFileSync(path.resolve(outPath), texte, 'utf-8'); }
process.exit(verdict === 'FAIL' ? 1 : 0);
