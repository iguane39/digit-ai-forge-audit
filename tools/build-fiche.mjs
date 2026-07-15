#!/usr/bin/env node
// AuditCore — build-fiche (RAF-004 / M9) : fiche sécurité de mise à disposition rendue en HTML
// thémé. Sans données → squelette à compléter ({{placeholders}}) ; avec --data <json> → rempli.
// Usage: node tools/build-fiche.mjs <tenant.yaml> [--data <fiche-data.json>] [--out <fichier.html>]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rel, loadTenant, loadJson } from './lib.mjs';

const tenantYaml = process.argv[2];
if (!tenantYaml) { console.error('Usage: node tools/build-fiche.mjs <tenant.yaml> [--data <fiche-data.json>] [--out <fichier.html>]'); process.exit(2); }
const { cfg, tenantDir } = loadTenant(tenantYaml);
const dIdx = process.argv.indexOf('--data');
const outIdx = process.argv.indexOf('--out');
const data = dIdx > -1 ? loadJson(path.resolve(process.argv[dIdx + 1])) : {};
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const V = (k, ph) => data[k] !== undefined ? esc(data[k]) : `<span class="ph">{{${ph ?? k}}}</span>`;

const themePath = path.join(tenantDir, 'theme', 'theme.css');
if (!fs.existsSync(themePath))
  execFileSync(process.execPath, [rel('tools', 'build-theme.mjs'), path.resolve(tenantYaml), '--out', path.join(tenantDir, 'theme')], { stdio: 'ignore' });
const themeCss = fs.readFileSync(themePath, 'utf-8');

// Les 8 sections de la fiche (structure du profil de référence, généralisée)
const S = (titre, rows) => `<section><h2>${titre}</h2><table><tbody>
${rows.map(([label, key, ph]) => `<tr><th>${label}</th><td>${V(key, ph)}</td></tr>`).join('')}
</tbody></table></section>`;

const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(cfg.tenant.name)} — Fiche sécurité de mise à disposition (DEV)</title><style>${themeCss}
.wrap{max-width:960px;margin:0 auto;padding:24px}h1{font-size:22px}h2{font-size:15px;margin:22px 0 6px;color:var(--accent)}
table{border-collapse:collapse;width:100%}th,td{border:1px solid var(--line);padding:7px 10px;font-size:12.5px;text-align:left;vertical-align:top}
th{background:var(--bg);width:34%}.ph{color:var(--maj);font-family:var(--font-mono);font-size:11.5px}
.muted{color:var(--muted)}.small{font-size:11.5px}
@media print{section{break-inside:avoid}}
</style></head><body><div class="wrap">
<header><span class="brand">${esc(cfg.tenant.short_code)}</span> <b>${esc(cfg.tenant.name)} — Fiche sécurité de mise à disposition (environnement de développement)</b><br>
<span class="muted small">Réf. ${V('reference', 'TRI-SEC-DEV-AAAAMMJJa')} · validée par ${esc(cfg.roles?.security_officer ?? 'le responsable sécurité')} · accompagne le rapport d'audit · core ${esc(String(cfg.core_version))}</span></header>
<h1>Fiche sécurité — ${V('projet', 'NOM_PROJET')}</h1>
${S('1 · Identification', [['Application / trigramme', 'projet'], ['Objet métier', 'objet'], ['Équipe / responsable', 'equipe'], ['Lien environnement DEV', 'lien_dev']])}
${S('2 · Environnement & hébergement', [['Hébergement', 'hebergement'], ['Environnements actifs', 'environnements'], ['IaC / provisionnement', 'iac']])}
${S('3 · Sensibilité & conformité', [['Classification des données', 'classification'], ['Données personnelles (PII)', 'pii'], ['Juridiction(s) applicable(s)', 'juridictions'], ['Analyses requises (impact, IA)', 'analyses']])}
${S('4 · Criticité', [['Criticité métier', 'criticite'], ['Disponibilité attendue', 'disponibilite'], ["Impact en cas d'incident", 'impact']])}
${S('5 · Exposition', [['Exposition réseau (interne/externe)', 'exposition'], ["Point de contrôle d'entrée", 'point_controle'], ['Authentification', 'authentification']])}
${S('6 · IA / LLM', [["Brique d'IA présente", 'ia_presente'], ['Modèle(s) et usage', 'ia_usage'], ['Garde-fous & supervision humaine', 'ia_gardefous']])}
${S('7 · Contrat de service & observabilité', [['Journalisation & traces', 'observabilite'], ['Alerting', 'alerting'], ['Sauvegardes (RPO/RTO)', 'sauvegardes']])}
${S('8 · FinOps', [['Étiquetage / imputation', 'tags'], ['Budget & alertes de coût', 'budget']])}
<footer class="muted small" style="margin-top:26px;border-top:1px solid var(--line);padding-top:10px">
Généré par AuditCore build-fiche (M9) pour ${esc(cfg.tenant.name)} — 0 placeholder exigé avant diffusion (les champs <span class="ph">{{…}}</span> sont à compléter).</footer>
</div></body></html>`;

const out = outIdx > -1 ? path.resolve(process.argv[outIdx + 1])
  : rel('deliverables', 'generated', cfg.tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), 'fiche-securite.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html, 'utf-8');
console.log(`✔ fiche sécurité: 8 sections ${dIdx > -1 ? '(remplie)' : '(squelette à compléter)'} → ${out}`);
