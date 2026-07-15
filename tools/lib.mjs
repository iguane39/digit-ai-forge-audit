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
