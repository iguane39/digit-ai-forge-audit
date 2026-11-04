// AuditCore — lib partagée (chargement config, chemins, utilitaires)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as yaml from 'js-yaml';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const rel = (...p) => path.join(ROOT, ...p);

export function loadYaml(file) {
  return yaml.load(fs.readFileSync(file, 'utf-8'));
}
export function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}
export function saveJson(file, obj) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf-8');
}

export const ENFORCEMENT_ORDER = { recommendation: 0, advisory: 1, required: 2, blocking: 3 };

/** Charge un tenant.yaml et résout les chemins relatifs (au dossier du tenant, sinon à ROOT). */
export function loadTenant(tenantYamlPath) {
  const abs = path.resolve(tenantYamlPath);
  const cfg = loadYaml(abs);
  const tenantDir = path.dirname(abs);
  const resolveRef = (p) => {
    if (!p) return p;
    const c1 = path.resolve(tenantDir, p);
    const c2 = path.resolve(ROOT, p);
    return fs.existsSync(c1) ? c1 : c2;
  };
  return { cfg, tenantDir, resolveRef };
}

/** Dérive le bucket d'une contrainte depuis son autorité d'origine (dé-hardcode l'ex-autorité en dur). */
export function deriveBucket(entry, bindingAuthorities) {
  if (entry.bucket) return entry.bucket; // déjà résolu (pack legacy)
  const auth = entry.authority ?? 'Generique';
  return bindingAuthorities.includes(auth) ? 'opposable' : 'informatif';
}

/** Frontmatter YAML d'un fichier markdown (DESIGN.md, ADR). */
export function frontmatter(file) {
  const src = fs.readFileSync(file, 'utf-8');
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return m ? yaml.load(m[1]) : null;
}

/** Contraste WCAG (approx) entre deux couleurs hex. */
export function contrastRatio(hex1, hex2) {
  const lum = (hex) => {
    const h = hex.replace('#', '');
    const full = h.length === 3 ? h.split('').map(c => c + c).join('') : h.slice(0, 6);
    const [r, g, b] = [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16) / 255)
      .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const [a, b] = [lum(hex1), lum(hex2)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

export function fail(msg) { console.error(`ERREUR: ${msg}`); process.exitCode = 1; }
export function ok(msg) { console.log(`OK: ${msg}`); }

/**
 * TF-2089 (récidive de TF-1181) — le dossier cible POSITIONNEL d'un outil. Un argument qui commence
 * par « - » est une option, jamais un dossier : `init-audit-workspace.mjs --help` avait créé un dossier
 * nommé « --help » dans le dépôt. `--help` et `-h` disent l'usage (sortie 0, rien de créé) ; toute autre
 * option est refusée avec son motif (sortie 2) ; l'absence d'argument dit l'usage en sortie 2.
 * Rend l'argument quand c'est un dossier ; sinon l'outil s'arrête ici.
 * `build-kit.mjs` inscrit la même règle dans `init-audit-workspace-standalone.mjs` (autoportant).
 */
export function dossierCibleOuUsage(argument, usage) {
  if (argument !== undefined && !String(argument).startsWith('-')) return argument;
  const aide = argument === '--help' || argument === '-h';
  if (argument !== undefined && !aide) {
    console.error(`Argument « ${argument} » refusé comme dossier cible : un argument qui commence par « - » `
      + 'est une option, pas un dossier.');
  }
  (aide ? console.log : console.error)(usage);
  process.exit(aide ? 0 : 2);
}

/**
 * TF-2105 (variante de TF-2089) — la valeur d'une OPTION de dossier (`--out <dir>`). Même règle que
 * `dossierCibleOuUsage` : un argument qui commence par « - » est une option, jamais un dossier ;
 * `build-kit.mjs <tenant> --out --dry-run` créait un dossier nommé « --dry-run ». Rend `undefined` si
 * l'option n'est pas passée, la valeur si c'est un dossier ; sinon (valeur absente ou en « - »)
 * refus motivé + usage sur stderr, sortie 2, et l'outil s'arrête ici avant de rien créer.
 */
export function valeurDossierOuUsage(argv, option, usage, genre = 'dossier', codeUsage = 2) {
  const i = argv.indexOf(option);
  if (i === -1) return undefined;
  const valeur = argv[i + 1];
  if (valeur !== undefined && !String(valeur).startsWith('-')) return valeur;
  console.error(valeur === undefined
    ? `Option ${option} sans valeur : un ${genre} est attendu.`
    : `Option ${option} : « ${valeur} » refusé comme ${genre}, un argument qui commence par « - » `
      + `est une option, pas un ${genre}.`);
  console.error(usage);
  process.exit(codeUsage);
}

/**
 * TF-2131 (suite de TF-2105) — la valeur d'une option de FICHIER (`--out <fichier>`, `--tenant <yaml>`,
 * `--data <json>`, `--status <suivi>`…). Même règle que pour un dossier : `build-catalogue.mjs <tenant> --out
 * --dry-run` écrivait un fichier littéralement nommé « --dry-run » ; une quinzaine d'outils lisaient
 * `process.argv[indexOf(option) + 1]` sans rien refuser. `valeurDossierOuUsage` porte le garde (paramètre
 * `genre`) ; ce raccourci le nomme pour la lecture. Les oracles de `oracles/`, autoportants (embarqués dans le
 * kit, sans import de ce fichier), recopient la règle en ligne dans leur `opt()`.
 */
export const valeurFichierOuUsage = (argv, option, usage, codeUsage = 2) =>
  valeurDossierOuUsage(argv, option, usage, 'fichier', codeUsage);
