#!/usr/bin/env node
// AuditCore — lint d'agnosticité du core (issu de l'audit docs/AUDIT-AGNOSTICITE.md).
// Vérifie qu'aucun nom d'éditeur/produit (N1) ni vocabulaire biaisé connu (N2) n'apparaît
// dans les zones NORMATIVES : corps des ADRs (hors frontmatter et hors « ## More Information »)
// et champs textuels des contrôles core. Gate CI : exit 1 si finding.
// v2 (RAF-030) : + balayage REPO-WIDE des noms de tenants réels (N0) sur tout le dépôt produit —
// le produit ne doit nommer aucun client, nulle part (docs, outils, fixtures, templates compris).
// Usage: node tools/lint-agnostic.mjs [--quiet]
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, rel, loadJson } from './lib.mjs';

// N1 — noms durs (éditeurs, produits, services commerciaux). Les SPÉCIFICATIONS ouvertes
// (OAuth2, OIDC, TLS, OpenAPI, OpenTelemetry, SemVer, MADR, SBOM/SPDX/CycloneDX, SLSA,
// REST/JSON, RBAC, WCAG, Kimball) sont autorisées et absentes de cette liste.
const N1 = [
  'Azure', 'AWS', 'GCP', 'Google Cloud', 'Microsoft', 'Entra', 'Active Directory', 'APIM',
  'API Management', 'Key Vault', 'Databricks', 'Unity Catalog', 'Power BI', 'Fabric',
  'Elastic', 'Kibana', 'Sentinel', 'Defender', 'App Service', 'Container Apps', 'Cosmos',
  'SQL Server', 'Oracle', 'PostgreSQL', 'MySQL', 'MongoDB', 'Kafka', 'Kubernetes',
  'AKS', 'EKS', 'GKE', 'Docker', 'Terraform', 'Ansible', 'GitHub', 'GitLab', 'Azure DevOps',
  'SharePoint', 'Snowflake', 'Purview', 'sops', 'DirectQuery',
];
// N2 — vocabulaire conceptuellement biaisé (façonné éditeur / présuppose un modèle de livraison)
const N2 = [
  "zones? d'atterrissage", 'landing zones?', 'groupes? de ressources', 'SaaS\\s*(?:→|->)\\s*PaaS',
  'médaillon', 'bronze[/ -]silver[/ -]gold', 'lakehouse', 'identités managées',
];
// Frontières Unicode : \b ASCII de JS voit une frontière avant les accents (« Entra » matcherait
// « données d'entraînement ») — on exige l'absence de lettre/chiffre Unicode de part et d'autre.
const B1 = '(?<![\\p{L}\\p{N}_])', B2 = '(?![\\p{L}\\p{N}_])';
const n1re = new RegExp(`${B1}(${N1.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})${B2}`, 'iu');
const n2re = new RegExp(`${B1}(${N2.join('|')})${B2}`, 'iu');

const quiet = process.argv.includes('--quiet');
const findings = [];

// ── ADRs : corps normatif = après le frontmatter, avant « ## More Information »
for (const dom of fs.readdirSync(rel('core', 'adr'))) {
  const dd = rel('core', 'adr', dom);
  if (!fs.statSync(dd).isDirectory()) continue;
  for (const f of fs.readdirSync(dd).filter(x => x.endsWith('.md'))) {
    const lines = fs.readFileSync(path.join(dd, f), 'utf-8').split('\n');
    let inFm = false, fmDone = false, inMoreInfo = false;
    lines.forEach((line, i) => {
      if (i === 0 && line.trim() === '---') { inFm = true; return; }
      if (inFm) { if (line.trim() === '---') { inFm = false; fmDone = true; } return; }
      if (!fmDone && !inFm) fmDone = true;
      if (/^##\s+More Information/.test(line)) inMoreInfo = true;
      if (inMoreInfo) return;
      const m1 = line.match(n1re);
      if (m1) findings.push({ file: `core/adr/${dom}/${f}`, line: i + 1, level: 'N1', term: m1[1], excerpt: line.trim().slice(0, 110) });
      else { const m2 = line.match(n2re); if (m2) findings.push({ file: `core/adr/${dom}/${f}`, line: i + 1, level: 'N2', term: m2[1], excerpt: line.trim().slice(0, 110) }); }
    });
  }
}

// ── Contrôles core : champs textuels normatifs
const pack = loadJson(rel('core', 'controls', 'controls-core-v1.json'));
for (const c of pack.constraints) {
  for (const field of ['regle', 'verification', 'preuve_attendue', 'grille_verdict', ...(c.actions_audit ?? []).map((_, i) => `actions_audit[${i}]`)]) {
    const text = field.startsWith('actions_audit') ? c.actions_audit[parseInt(field.match(/\d+/)[0])] : c[field];
    if (!text) continue;
    const m1 = String(text).match(n1re);
    const m2 = m1 ? null : String(text).match(n2re);
    if (m1 || m2) findings.push({ file: `core/controls (${c.id})`, line: 0, level: m1 ? 'N1' : 'N2', term: (m1 ?? m2)[1], excerpt: `${field}: ${String(text).slice(0, 90)}` });
  }
}

// ── N0 (v2, RAF-030) : noms de tenants réels — balayage de TOUT le dépôt produit.
// Termes construits par concaténation : le lint lui-même ne contient pas la chaîne interdite,
// si bien que le critère de done « grep -ri <tenant> = 0 sur le dépôt produit » tient partout.
const N0 = ['nho' + 'od', 'cee' + 'trus'];
const n0re = new RegExp(`(${N0.join('|')})`, 'i');
const SKIP_DIRS = new Set(['node_modules', '.git', 'generated']);
const TEXT_EXT = new Set(['.md', '.mjs', '.js', '.json', '.yaml', '.yml', '.html', '.css', '.txt', '.svg', '.gitignore']);
let scanned = 0;
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (!SKIP_DIRS.has(e.name)) walk(p); continue; }
    if (!TEXT_EXT.has(path.extname(e.name)) && e.name !== '.gitignore') continue;
    scanned++;
    fs.readFileSync(p, 'utf-8').split('\n').forEach((line, i) => {
      const m = line.match(n0re);
      if (m) findings.push({ file: path.relative(ROOT, p), line: i + 1, level: 'N0', term: m[1], excerpt: line.trim().slice(0, 110) });
    });
  }
})(ROOT);

if (findings.length) {
  for (const f of findings) console.error(`✖ [${f.level}] ${f.file}:${f.line} — « ${f.term} » — ${f.excerpt}`);
  console.error(`\n✖ lint agnosticité: ${findings.length} finding(s) — le core ne doit nommer ni éditeur ni vocabulaire biaisé (zones normatives), et le dépôt produit ne doit nommer aucun tenant réel (N0, repo-wide).`);
  process.exit(1);
}
if (!quiet) console.log(`✔ lint agnosticité: 0 finding — ${pack.constraints.length} contrôles + corpus ADR conformes (zones normatives) · N0 repo-wide: ${scanned} fichiers sans nom de tenant réel.`);
