#!/usr/bin/env node
// AuditCore — build-rapport (M5 v1) : rapport-data.json + tenant → rapport HTML autonome thémé.
// Recommandé : passer le gate machine d'abord (verifier-rapport). Usage :
//   node tools/build-rapport.mjs <rapport-data.json> --tenant <tenant.yaml> [--out <fichier.html>] [--forme poc-to-prod|vues]
//
// TF-2145 (décision humaine D-171 (a) du 04/11/2026) — LA FORME PAR DÉFAUT est celle du rapport d'audit POC-to-Prod
// (gabarit deliverables/templates/rapport-audit-poc-to-prod.template.html, rendu par tools/rapport-poc-to-prod.mjs).
// `--forme vues` rend l'ancienne forme (rapport-engine.mjs, rendu par vues), gardée pendant la transition ; elle n'est
// plus le défaut. Les deux formes émettent le MÊME plan de remédiation (buildPlan), le même YAML et les mêmes contrôles
// évalués.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import * as yaml from 'js-yaml';
import { rel, loadTenant, loadJson, loadYaml, valeurFichierOuUsage } from './lib.mjs';
import { renderRapport, buildPlan, planToActions, controlesEvalues } from './rapport-engine.mjs';
import { rendreRapportPocToProd, GABARIT_ID, GABARIT_VERSION } from './rapport-poc-to-prod.mjs';
import { construireTheme } from './build-theme.mjs';

const FORMES = ['poc-to-prod', 'vues'];
const file = process.argv[2];
const tIdx = process.argv.indexOf('--tenant');
const USAGE = 'Usage: node tools/build-rapport.mjs <rapport-data.json> --tenant <tenant.yaml> [--out <fichier.html>] [--forme poc-to-prod|vues]';
if (!file || tIdx === -1) { console.error(USAGE); process.exit(2); }
const tenantArg = valeurFichierOuUsage(process.argv, '--tenant', USAGE);   // TF-2131 : une option n'est jamais le fichier d'une autre
const { cfg, tenantDir } = loadTenant(tenantArg);
const outArg = valeurFichierOuUsage(process.argv, '--out', USAGE);
const fIdx = process.argv.indexOf('--forme');
const forme = fIdx === -1 ? 'poc-to-prod' : process.argv[fIdx + 1];
if (!FORMES.includes(forme)) { console.error(`Option --forme : « ${forme ?? ''} » inconnue (${FORMES.join(' | ')}).`); console.error(USAGE); process.exit(2); }

const data = loadJson(path.resolve(file));
const lang = cfg.tenant.language === 'en' ? 'en' : 'fr';
const dimsPack = loadYaml(rel('core', 'dimensions', 'dimensions.yaml'));
const relabel = cfg.dimensions?.relabel ?? {};
const baseLabel = (d) => (lang === 'en' ? (d.label_en ?? d.label) : d.label);
const dimensions = dimsPack.dimensions.map(d => ({ ...d, label: relabel[d.id] ?? baseLabel(d) }));
const families = dimsPack.families.map(f => ({ ...f, label: lang === 'en' ? (f.label_en ?? f.label) : f.label }));

// thème : généré si absent (le yaml peut porter n'importe quel nom)
const tenantAbs = path.resolve(tenantArg);
const themePath = path.join(tenantDir, 'theme', 'theme.css');
if (!fs.existsSync(themePath))
  execFileSync(process.execPath, [rel('tools', 'build-theme.mjs'), tenantAbs, '--out', path.join(tenantDir, 'theme')], { stdio: 'ignore' });
// TF-2145 : le rendu prend le thème COURANT, calculé par build-theme, jamais un `theme.css` laissé en cache par une
// version antérieure du générateur (constat de TF-2139 : un cache d'avant le `.brand` en jetons gardait `#1b2733` et
// `#fff` en dur, et le rapport rendu échouait à oracle-tokens). Le cache existant n'est pas réécrit : un dossier de
// tenant tenu en lecture seule le reste ; sa péremption est DITE.
const themeCss = construireTheme(tenantAbs).css;
if (fs.readFileSync(themePath, 'utf-8').replace(/\r\n/g, '\n') !== themeCss.replace(/\r\n/g, '\n'))
  console.log(`⚠ thème en cache périmé (${themePath}) : le rendu utilise le thème courant calculé par build-theme, le cache n'est pas réécrit — le régénérer : node tools/build-theme.mjs ${tenantArg}`);

// index des contraintes (métadonnées des règles) depuis la fusion du tenant
const mergedPath = path.join(tenantDir, 'merged.json');
if (!fs.existsSync(mergedPath))
  execFileSync(process.execPath, [rel('tools', 'merge-packs.mjs'), tenantAbs, '--out', mergedPath], { stdio: 'ignore' });
const merged = loadJson(mergedPath);
data._constraints_index = Object.fromEntries(merged.constraints.map(c => [c.id,
  { dimension_audit: c.dimension_audit, criticite: c.criticite, bucket: c.bucket, enforcement: c.enforcement, regle: c.regle }]));
data._short_code = cfg.tenant.short_code;

const opts = { tenant: cfg.tenant.name, dimensions, families, themeCss, coreVersion: String(cfg.core_version), lang };
const html = forme === 'vues' ? renderRapport(data, opts) : rendreRapportPocToProd(data, opts).html;
const out = outArg !== undefined ? path.resolve(outArg)
  : rel('deliverables', 'generated', cfg.tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), 'rapport-audit.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html, 'utf-8');

// ── ECR-04/05 · DOUBLE ÉMISSION du plan de remédiation, depuis le MÊME calcul que le HTML.
// Le YAML latéral est l'entrée contractuelle de la forge (validée par JSON Schema) ; le bloc
// embarqué dans le HTML rend le rapport auto-porteur pour le projet. Aucune ressaisie, aucune
// divergence possible : `buildPlan` est appelé une fois côté moteur pour les deux sorties.
const plan = buildPlan(data);
const { doc: actionsDoc, nonProjetees } = planToActions(plan, data, cfg.core_version);
const yamlOut = out.replace(/\.html?$/i, '') + '.remediation-actions.yaml';
fs.writeFileSync(yamlOut, yaml.dump(actionsDoc, { lineWidth: 100, noRefs: true }), 'utf-8');
// TF-1235 — le COMPAGNON du plan : ce qui a été évalué, pas seulement ce qui échoue. Même
// référence d'audit que le YAML, pour qu'un tiers prouve qu'ils parlent du même audit.
const evalues = controlesEvalues(data, cfg.core_version);
const evalOut = out.replace(/\.html?$/i, '') + '.controles-evalues.json';
fs.writeFileSync(evalOut, JSON.stringify(evalues, null, 2) + '\n', 'utf-8');

console.log(`✔ rapport rendu (forme ${forme}${forme === 'poc-to-prod' ? `, gabarit ${GABARIT_ID} ${GABARIT_VERSION}` : ', rendu par vues gardé pour la transition'}): ${(html.length / 1024).toFixed(0)} Ko → ${out}`);
console.log(`✔ plan de remédiation: ${plan.length} actions — embarqué dans le HTML ET écrit en ${path.basename(yamlOut)}`);
console.log(`✔ contrôles évalués: ${evalues.total} (${Object.entries(evalues.compte).map(([k, n]) => `${k} ${n}`).join(', ')}) → ${path.basename(evalOut)}`);
// Pas de troncature muette : ce qui ne passe pas le contrat forge se dit.
if (nonProjetees.length)
  console.log(`⚠ ${nonProjetees.length} action(s) hors YAML (dimension non rattachée, visibles au plan HTML) : ${nonProjetees.map(a => a.source).join(', ')}`);
console.log('  rappel gate machine : node tools/verifier-rapport.mjs <rapport-data.json> (exit 0 avant diffusion)');
console.log('  porte de clôture    : node tools/verifier-remediation.mjs <rapport.html> --status <suivi.json>');
