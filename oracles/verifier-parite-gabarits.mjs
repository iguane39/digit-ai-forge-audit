#!/usr/bin/env node
/**
 * verifier-parite-gabarits — un champ ajouté d'un seul côté est un champ ABSENT pour la moitié des
 * tenants, et rien ne le disait.
 *
 * POURQUOI CET ORACLE EXISTE (24/08/2026, TF-0563/TF-0564). En corrigeant deux écarts du canevas
 * `fiche-securite` — il demandait COMMENT on s'authentifie et jamais QUI est admis ; il ne portait
 * aucun champ d'engagement de service — on a cherché le contrôle qui garantissait que la version
 * anglaise recevrait les mêmes champs. Il n'y en avait aucun. Les gabarits `*.template.md` et
 * `*.template.en.md` vivent côte à côte, `build-kit.mjs` choisit l'un ou l'autre selon la langue du
 * tenant (RAF-012), et RIEN ne comparait leurs champs. Un tenant anglophone aurait donc reçu, sans
 * un mot, une fiche sécurité sans population admise et sans engagement de service.
 *
 * C'est la troisième loi transverse du pilot appliquée aux gabarits : *l'oubli n'existe pas* — la
 * surface implicite se propose d'office et s'écarte explicitement, jamais par omission.
 *
 * CE QU'IL COMPARE : les CLÉS de substitution (`{{auth.mode}}`, `{{sla.rto — …}}` → `auth.mode`,
 * `sla.rto`), et elles seules. Les glosses sont rédigées dans la langue du gabarit, les titres de
 * section aussi : les comparer produirait du bruit à chaque traduction. La clé, elle, est le
 * contrat avec les données — c'est le seul objet qui DOIT être identique.
 *
 * CE QU'IL NE FAIT PAS : juger la qualité d'une traduction, ni exiger qu'un gabarit ait une
 * version anglaise. Un gabarit sans jumeau n'est pas un défaut ici ; il est simplement hors sujet.
 *
 *   node oracles/verifier-parite-gabarits.mjs            → jugement sur deliverables/templates
 *   node oracles/verifier-parite-gabarits.mjs --self-test → double sens sur des jumeaux fabriqués
 */
import { readFileSync, readdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const ICI = dirname(fileURLToPath(import.meta.url));
const DEFAUT = join(ICI, '..', 'deliverables', 'templates');

/** Les clés de substitution d'un gabarit : `{{auth.rbac — rôles}}` → `auth.rbac`. */
export function clesDe(texte) {
  const cles = new Set();
  for (const m of texte.matchAll(/\{\{\s*([^}]+?)\s*\}\}/g)) {
    // La gloss commence au premier tiret cadratin ou demi-cadratin ENTOURÉ d'espaces : un nom de
    // clé n'en contient jamais, mais une gloss peut en contenir plusieurs.
    const cle = m[1].split(/\s+[—–-]\s+/)[0].trim();
    if (cle) cles.add(cle);
  }
  return cles;
}

/** Les paires (fr, en) présentes dans un dossier de gabarits. */
export function paires(dossier) {
  const noms = readdirSync(dossier);
  const out = [];
  for (const n of noms) {
    if (!/\.template\.md$/.test(n) || /\.template\.en\.md$/.test(n)) continue;
    const jumeau = n.replace(/\.template\.md$/, '.template.en.md');
    if (noms.includes(jumeau)) out.push([join(dossier, n), join(dossier, jumeau)]);
  }
  return out;
}

export function juger(dossier) {
  const constats = [];
  const jugees = [];
  for (const [fr, en] of paires(dossier)) {
    const a = clesDe(readFileSync(fr, 'utf8'));
    const b = clesDe(readFileSync(en, 'utf8'));
    jugees.push(basename(fr));
    const sansEn = [...a].filter((k) => !b.has(k));
    const sansFr = [...b].filter((k) => !a.has(k));
    if (sansEn.length) {
      constats.push(`${basename(fr)} : ${sansEn.length} champ(s) absent(s) de la version anglaise — ` +
        `${sansEn.join(', ')}. Un tenant anglophone recevrait le livrable SANS eux, et sans un mot.`);
    }
    if (sansFr.length) {
      constats.push(`${basename(en)} : ${sansFr.length} champ(s) absent(s) de la version française — ` +
        `${sansFr.join(', ')}.`);
    }
  }
  return { jugees, constats };
}

const args = process.argv.slice(2);

if (args[0] === '--self-test') {
  const dir = mkdtempSync(join(tmpdir(), 'parite-'));
  const casse = [];
  // Sens VERT : deux jumeaux aux mêmes clés, glosses et titres traduits.
  writeFileSync(join(dir, 'vert.template.md'), '## Authentification\n| Mode | {{auth.mode}} |\n| Rôles | {{auth.rbac — rôles, granularité}} |\n', 'utf8');
  writeFileSync(join(dir, 'vert.template.en.md'), '## Authentication\n| Method | {{auth.mode}} |\n| Roles | {{auth.rbac — roles, granularity}} |\n', 'utf8');
  let r = juger(dir);
  if (r.constats.length) casse.push('deux jumeaux aux mêmes clés rendent un constat : ' + r.constats.join(' · '));
  if (!r.jugees.includes('vert.template.md')) casse.push('la paire verte n’a pas été jugée du tout');
  // Sens ROUGE : le champ ajouté d'un seul côté, exactement le défaut du 24/08.
  writeFileSync(join(dir, 'vert.template.md'), '## Authentification\n| Mode | {{auth.mode}} |\n| Population | {{auth.population_admise — qui, combien}} |\n', 'utf8');
  r = juger(dir);
  if (!r.constats.some((c) => /auth\.population_admise/.test(c) && /anglaise/.test(c))) {
    casse.push('un champ ajouté du seul côté français ne rend AUCUN constat — l’oracle serait muet sur son propre motif');
  }
  // Un gabarit sans jumeau n'est pas un défaut : il est hors sujet.
  writeFileSync(join(dir, 'seul.template.md'), '| X | {{x.y}} |\n', 'utf8');
  r = juger(dir);
  if (r.jugees.includes('seul.template.md')) casse.push('un gabarit sans jumeau est jugé alors qu’il est hors sujet');
  console.log(casse.length
    ? 'SELF-TEST FAIL : ' + casse.join(' · ')
    : 'Self-test parité des gabarits : 3/3 PASS (jumeaux identiques → aucun constat ; champ d’un seul côté → constat nommé ; gabarit sans jumeau → hors sujet)');
  process.exit(casse.length ? 1 : 0);
}

const dossier = args[0] || DEFAUT;
const { jugees, constats } = juger(dossier);
if (constats.length) {
  console.log(`PARITÉ DES GABARITS CASSÉE — ${constats.length} constat(s) sur ${jugees.length} paire(s) :`);
  for (const c of constats) console.log('  · ' + c);
  console.log('Remède : ajouter le champ manquant dans le jumeau, avec sa gloss traduite. Un champ ' +
    'n’existe pour un tenant que si son gabarit de langue le porte.');
  process.exit(1);
}
console.log(`Parité des gabarits vérifiée : ${jugees.length} paire(s) FR/EN, mêmes clés de substitution de part et d’autre.`);
