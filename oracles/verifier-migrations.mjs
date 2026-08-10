#!/usr/bin/env node
// =============================================================================
// verifier-migrations.mjs — Contrôle d'audit 3 : le PIPELINE applique-t-il les migrations ?
//
// Un « model change » sans migration appliquée = release silencieusement cassée (cas de
// référence : DDL présentes dans le dépôt mais câblées dans AUCUN flux → base désynchronisée du modèle).
//
//   node verifier-migrations.mjs <dossier-projet> [--out migrations.json]
//
// Détecte : (a) DDL/migrations ORPHELINES (présentes mais référencées par aucun flux → dérive) ;
//           (b) absence d'étape de migration dans le PIPELINE CI/CD (constat D09 : le déploiement peut diverger).
//
// Exit 0 = ok · 1 = DDL orpheline(s) OU aucune application de migration nulle part (dérive probable) · 2 = usage.
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';

const dir = process.argv[2];
const outArg = (() => { const i = process.argv.indexOf('--out'); return i >= 0 ? process.argv[i + 1] : null; })();
if (!dir || dir.startsWith('--') || !fs.existsSync(dir)) { console.error('usage: node verifier-migrations.mjs <dossier-projet> [--out migrations.json]'); process.exit(2); }

const files = [];
(function walk(d) { for (const e of fs.readdirSync(d)) { const f = path.join(d, e); const s = fs.statSync(f); if (s.isDirectory()) { if (!/node_modules|\.git/.test(e)) walk(f); } else files.push(f); } })(dir);
const rel = f => path.relative(dir, f).replace(/\\/g, '/');
const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch { return ''; } };

// ---- DDL / fichiers de migration ----
const isDDLsql = f => /\.sql$/i.test(f) && /\b(create\s+table|alter\s+table|create\s+index|add\s+column)\b/i.test(read(f));
const inMigrationsDir = f => /(^|\/)(migrations|alembic\/versions|prisma\/migrations|db\/migrate)(\/|$)/i.test(rel(f));
const ddlFiles = files.filter(f => isDDLsql(f) || (inMigrationsDir(f) && /\.(sql|py|js|ts)$/i.test(f)));

// ---- flux susceptibles d'appliquer les migrations ----
const isPipeline = f => /(^|\/)(azure-pipelines\.ya?ml|\.gitlab-ci\.ya?ml)$/i.test(rel(f)) || /(^|\/)\.github\/workflows\/[^/]+\.ya?ml$/i.test(rel(f));
const isOtherFlow = f => /(\.sh|Dockerfile|docker-compose[^/]*\.ya?ml|Makefile|package\.json|entrypoint[^/]*)$/i.test(rel(f)) || /(^|\/)Dockerfile$/i.test(rel(f));
const pipelines = files.filter(isPipeline);
const otherFlows = files.filter(f => isOtherFlow(f) && !isPipeline(f));
const flowText = f => read(f);
const allFlowText = [...pipelines, ...otherFlows].map(flowText).join('\n');
const pipelineText = pipelines.map(flowText).join('\n');

const MIGRE = /migrat|alembic|flyway|liquibase|prisma\s+migrate|db[:_-]?upgrade|restore-db|goose|dbmate|sqlcmd[^\n]*-i|psql[^\n]*-f|for\s+\w+\s+in[^\n]*\.sql|\*\.sql/i;
const migrationAnywhere = ddlFiles.length ? MIGRE.test(allFlowText) : false;
const migrationInPipeline = ddlFiles.length ? MIGRE.test(pipelineText) : false;

// ---- DDL orphelines : référencées par aucun flux (ni par nom, ni par glob couvrant leur dossier) ----
const referenced = (f) => {
  const base = path.basename(f); const r = rel(f);
  if (allFlowText.includes(base) || allFlowText.includes(r)) return true;
  const dirOf = r.replace(/\/[^/]*$/, '');
  if (dirOf && (allFlowText.includes(dirOf + '/*') || allFlowText.includes(dirOf + '/') )) return true;
  if (/\.sql$/i.test(f) && /\*\.sql|for\s+\w+\s+in[^\n]*\.sql/i.test(allFlowText)) return true; // « applique tous les .sql »
  if (inMigrationsDir(f) && MIGRE.test(allFlowText)) return true; // runner (alembic/prisma) applique tout le dossier
  return false;
};
const orphanDDL = ddlFiles.filter(f => !referenced(f)).map(rel);

const constats = [];
if (ddlFiles.length && orphanDDL.length) constats.push({ domaine: 'D09', severite: 'bloquant', constat: 'DDL/migrations présentes mais référencées par AUCUN flux (orphelines) → la base peut diverger du modèle. Fichiers : ' + orphanDDL.join(', ') + '. Remédiation : câbler ces migrations dans une étape idempotente du pipeline.' });
if (ddlFiles.length && !migrationInPipeline) constats.push({ domaine: 'D09', severite: (migrationAnywhere ? 'majeur' : 'bloquant'), constat: 'Aucune étape de migration dans le pipeline CI/CD (' + (pipelines.length ? pipelines.map(rel).join(', ') : 'aucun pipeline détecté') + ')' + (migrationAnywhere ? ' — des migrations existent dans un script hors-pipeline (provisioning) : le déploiement peut diverger de la base tant que le pipeline ne les applique pas.' : ' — le déploiement peut diverger de la base. Ajouter une commande `migrate` idempotente avant/après déploiement.') });

const bloquant = constats.some(c => c.severite === 'bloquant');
const result = {
  schema: 'auditcore.migrations/v1',
  verdict: bloquant ? 'bloquant' : (constats.length ? 'reserve' : 'ok'),
  ddl_detectees: ddlFiles.map(rel),
  ddl_orphelines: orphanDDL,
  migration_dans_pipeline: migrationInPipeline,
  migration_ailleurs: migrationAnywhere,
  pipelines: pipelines.map(rel),
  constats_D09: constats
};
if (outArg) fs.writeFileSync(outArg, JSON.stringify(result, null, 2), 'utf8');

console.log('Migrations — verdict : ' + result.verdict.toUpperCase() + ' · DDL détectées : ' + ddlFiles.length + ' · orphelines : ' + orphanDDL.length + ' · migration dans pipeline : ' + (migrationInPipeline ? 'oui' : 'non'));
constats.forEach(c => console.log('  ' + (c.severite === 'bloquant' ? '❌' : '⚠') + ' [' + c.domaine + '/' + c.severite + '] ' + c.constat));
if (!ddlFiles.length) console.log('  (aucune DDL/migration détectée — contrôle sans objet pour ce projet.)');
process.exit(bloquant || (ddlFiles.length && !migrationAnywhere) ? 1 : 0);
