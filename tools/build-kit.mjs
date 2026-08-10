#!/usr/bin/env node
// AuditCore — build-kit : packe des kits marque-blanche distribuables en zip.
//   kind=compliance : la part du PROJET AUDITÉ (contraintes fusionnées, banc de preuves,
//                     vérificateur AUTONOME sans dépendance, gabarit fiche sécurité, thème).
//   kind=audit      : la part de l'ÉQUIPE QUI CONDUIT L'AUDIT (le kit compliance + dimensions,
//                     13 gabarits, schémas, init-workspace autonome).
// Indice de version auto (a, b, c… par jour — règle méthodologie), zip natif (ziplib, zéro dépendance).
// Usage: node tools/build-kit.mjs <tenant.yaml> [--kind audit|compliance|both] [--out <dir>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT, rel, loadTenant, loadJson, loadYaml } from './lib.mjs';
import { createZip } from './ziplib.mjs';

const tenantYaml = process.argv[2];
if (!tenantYaml) { console.error('Usage: node tools/build-kit.mjs <tenant.yaml> [--kind audit|compliance|both] [--out <dir>]'); process.exit(2); }
const kindArg = process.argv.includes('--kind') ? process.argv[process.argv.indexOf('--kind') + 1] : 'both';
const kinds = kindArg === 'both' ? ['compliance', 'audit'] : [kindArg];
const { cfg } = loadTenant(tenantYaml);
const tenant = cfg.tenant.name;
const slug = tenant.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const outDir = process.argv.includes('--out')
  ? path.resolve(process.argv[process.argv.indexOf('--out') + 1])
  : rel('deliverables', 'generated', slug);
fs.mkdirSync(outDir, { recursive: true });

// ── 1. Produits dérivés (réutilise les outils existants, sortie en répertoire temporaire)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'auditcore-kit-'));
const run = (args) => execFileSync(process.execPath, args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
run([rel('tools', 'merge-packs.mjs'), path.resolve(tenantYaml), '--out', path.join(tmp, 'merged.json')]);
run([rel('tools', 'build-banc.mjs'), path.resolve(tenantYaml), '--out', path.join(tmp, 'banc-de-preuves.md')]);
run([rel('tools', 'build-theme.mjs'), path.resolve(tenantYaml), '--out', path.join(tmp, 'theme')]);
run([rel('tools', 'build-catalogue.mjs'), path.resolve(tenantYaml), '--out', path.join(tmp, 'catalogue-adr.html')]);
run([rel('tools', 'build-referentiel.mjs'), path.resolve(tenantYaml), '--out', path.join(tmp, 'referentiel-audit.html')]);
run([rel('tools', 'build-fiche.mjs'), path.resolve(tenantYaml), '--out', path.join(tmp, 'fiche-securite.html')]);
const merged = loadJson(path.join(tmp, 'merged.json'));

// ── 2. Vérificateur AUTONOME (dimensions inlinées, zéro import hors node:fs)
const dims = loadYaml(rel('core', 'dimensions', 'dimensions.yaml')).dimensions.map(d => d.id);
const verifierStandalone = [
  '#!/usr/bin/env node',
  `// Vérificateur de rapport AUTONOME — généré par AuditCore build-kit pour « ${tenant} » (core ${cfg.core_version}).`,
  '// Gate bloquant avant diffusion. Usage: node verifier-rapport-standalone.mjs <rapport-data.json>',
  "import fs from 'node:fs';",
  `const DIMS = ${JSON.stringify(dims)};`,
  "const VERDICTS = ['conforme', 'partiel', 'non_conforme', 'sans_objet', 'a_evaluer'];",
  "const file = process.argv[2];",
  "if (!file) { console.error('Usage: node verifier-rapport-standalone.mjs <rapport-data.json>'); process.exit(2); }",
  "const raw = fs.readFileSync(file, 'utf-8');",
  'const data = JSON.parse(raw);',
  'const errors = [];',
  "const ph = raw.match(/\\{\\{[^}]+\\}\\}|__TODO__|À COMPLÉTER/g) ?? [];",
  "if (ph.length) errors.push(`${ph.length} placeholder(s) résiduel(s) — ex: ${ph.slice(0, 3).join(', ')}`);",
  "const got = (data.dimensions ?? []).map(d => d.id);",
  'for (const d of DIMS) if (!got.includes(d)) errors.push(`dimension manquante: ${d}`);',
  'for (const d of data.dimensions ?? []) {',
  "  if (!(d.score >= 1 && d.score <= 5) && d.applicability !== 'off') errors.push(`${d.id}: score invalide ou absent (${d.score})`);",
  "  if (d.score !== undefined && !(d.preuves?.length) && d.applicability !== 'off') errors.push(`${d.id}: score sans preuve — interdit (invariant)`);",
  '}',
  'for (const r of data.regles ?? []) {',
  '  if (!VERDICTS.includes(r.verdict)) errors.push(`règle ${r.id}: verdict manquant/invalide (${r.verdict})`);',
  "  if ((r.verdict === 'sans_objet' || r.verdict === 'a_evaluer') && !r.motif) errors.push(`règle ${r.id}: ${r.verdict} exige un motif`);",
  '}',
  "for (const c of data.constats ?? []) if (!c.preuves?.length) errors.push(`constat « ${c.titre} »: aucune preuve`);",
  "if (/audit précédent|rapport précédent/i.test(raw)) errors.push('auto-portance: référence à un audit antérieur (règle B.1)');",
  'if (errors.length) {',
  "  for (const e of errors) console.error(`ERREUR: ${e}`);",
  '  console.error(`\\n✖ rapport NON diffusable (${errors.length} erreur(s))`);',
  '  process.exit(1);',
  '}',
  `console.log(\`✔ rapport diffusable — \${got.length} dimensions, \${(data.regles ?? []).length} règles — tenant ${tenant}\`);`,
].join('\n');

// ── 3. init-audit-workspace AUTONOME (nom du tenant inliné)
const initStandalone = [
  '#!/usr/bin/env node',
  `// Espace de travail d'audit — généré par AuditCore build-kit pour « ${tenant} ».`,
  "import fs from 'node:fs'; import path from 'node:path';",
  "const target = process.argv[2] ?? '.';",
  `const T = ${JSON.stringify(tenant)};`,
  "const INPUT = ['00 - Cadrage', '01 - Code & dépôt', '02 - Architecture & IaC', '03 - Sécurité & secrets', '04 - Données', '05 - Tests & CI-CD', '06 - Observabilité', '07 - Docs & gouvernance'];",
  "const OUTPUT = [\"00 - Rapport d'audit\", '01 - Fiche Sécurité', '02 - Présentation autorité de décision', '03 - Scans & preuves', '04 - Schémas & annexes', 'Old'];",
  "for (const d of [...INPUT.map(d => path.join(target, 'input', d)), ...OUTPUT.map(d => path.join(target, 'output', d))]) {",
  "  fs.mkdirSync(d, { recursive: true });",
  "  const k = path.join(d, '.gitkeep'); if (!fs.existsSync(k)) fs.writeFileSync(k, '');",
  '}',
  "console.log(`✔ espace d'audit ${T} initialisé: ${target}`);",
].join('\n');

// ── 3ter. Moteur de rendu de rapport AUTONOME (M5) — source du moteur inliné + config bakée
const engineSrc = fs.readFileSync(rel('tools', 'rapport-engine.mjs'), 'utf-8')
  .replace(/^export function renderRapport/m, 'function renderRapport');
const kitLang = cfg.tenant.language === 'en' ? 'en' : 'fr';
const dimsPack = loadYaml(rel('core', 'dimensions', 'dimensions.yaml'));
const relabelKit = cfg.dimensions?.relabel ?? {};
const bakedDims = dimsPack.dimensions.map(d => ({ ...d, label: relabelKit[d.id] ?? (kitLang === 'en' ? (d.label_en ?? d.label) : d.label) }));
const bakedFams = dimsPack.families.map(f => ({ ...f, label: kitLang === 'en' ? (f.label_en ?? f.label) : f.label }));
const themeCssKit = fs.readFileSync(path.join(tmp, 'theme', 'theme.css'), 'utf-8');
const cIndex = Object.fromEntries(loadJson(path.join(tmp, 'merged.json')).constraints.map(c => [c.id,
  { dimension_audit: c.dimension_audit, criticite: c.criticite, bucket: c.bucket, enforcement: c.enforcement, regle: c.regle }]));
const rapportStandalone = [
  '#!/usr/bin/env node',
  `// Rendu de rapport AUTONOME — généré par AuditCore build-kit pour « ${tenant} » (core ${cfg.core_version}).`,
  '// Usage: node build-rapport-standalone.mjs <rapport-data.json> [--out <fichier.html>]',
  '// Gate machine AVANT diffusion : node verifier-rapport-standalone.mjs <rapport-data.json>',
  "import fs from 'node:fs';",
  engineSrc,
  `const TENANT=${JSON.stringify(tenant)}, CORE=${JSON.stringify(String(cfg.core_version))}, SHORT=${JSON.stringify(cfg.tenant.short_code)};`,
  `const DIMS=${JSON.stringify(bakedDims)}, FAMS=${JSON.stringify(bakedFams)}, LANG=${JSON.stringify(kitLang)};`,
  `const THEME=${JSON.stringify(themeCssKit)};`,
  `const CIDX=${JSON.stringify(cIndex)};`,
  "const file=process.argv[2];",
  "if(!file){console.error('Usage: node build-rapport-standalone.mjs <rapport-data.json> [--out <fichier.html>]');process.exit(2);}",
  "const data=JSON.parse(fs.readFileSync(file,'utf-8')); data._constraints_index=CIDX; data._short_code=SHORT;",
  'const html=renderRapport(data,{tenant:TENANT,dimensions:DIMS,families:FAMS,themeCss:THEME,coreVersion:CORE,lang:LANG});',
  "const oi=process.argv.indexOf('--out'); const out=oi>-1?process.argv[oi+1]:'rapport-audit.html';",
  "fs.writeFileSync(out,html,'utf-8');",
  "console.log('✔ rapport rendu → '+out+' — gate machine : node verifier-rapport-standalone.mjs '+file);",
].join('\n');

// ── 3bis. Skill de conformité (M8) — template substitué avec les valeurs tenant
const skillTplEn = rel('deliverables', 'templates', 'compliance-skill.template.en.md');
const skillTpl = fs.readFileSync(
  kitLang === 'en' && fs.existsSync(skillTplEn) ? skillTplEn : rel('deliverables', 'templates', 'compliance-skill.template.md'), 'utf-8');
const complianceSkill = skillTpl
  .replace(/\{\{tenant\.name\}\}/g, tenant)
  .replace(/\{\{core_version\}\}/g, String(cfg.core_version))
  .replace(/\{\{counts\.total\}\}/g, String(merged.counts.total))
  .replace(/\{\{counts\.opposable\}\}/g, String(merged.counts.opposable))
  .replace(/\{\{counts\.informatif\}\}/g, String(merged.counts.informatif))
  .replace(/\{\{binding_authorities\}\}/g, JSON.stringify(cfg.enforcement?.binding_authorities ?? []))
  .replace(/\{\{roles\.decision_authority\}\}/g, cfg.roles?.decision_authority ?? "l'autorité de décision");

// ── 4. Indice de version auto (règle méthodologie : a, b, c… par jour, sans écrasement)
const today = new Date();
const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
function nextIndice(prefix) {
  const re = new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([a-z])\\.zip$`);
  let max = '';
  for (const f of fs.readdirSync(outDir)) { const m = f.match(re); if (m && m[1] > max) max = m[1]; }
  return max ? String.fromCharCode(max.charCodeAt(0) + 1) : 'a';
}

// ── 5. Assemblage des kits
const F = (p) => fs.readFileSync(p);
const results = [];
for (const kind of kinds) {
  const kindLabel = kind === 'compliance' ? 'Compliance Pack' : 'Audit';
  const prefix = `${tenant} - Kit ${kindLabel} - ${ymd}`;
  const name = `${prefix}${nextIndice(prefix)}`;
  const entries = [];
  const add = (n, data) => entries.push({ name: `${name}/${n}`, data });
  // ECR-01 : les oracles PROJET (contrôles exécutés contre le système audité) partent dans les
  // DEUX kits — le projet s'en sert pour se prouver conforme, l'auditeur pour l'exercer lui-même.
  // Autoportants (Node ≥ 18, zéro dépendance) : ils se copient tels quels.
  const addOracles = () => {
    const od = rel('oracles');
    for (const f of fs.readdirSync(od).sort())
      if (f.endsWith('.mjs') || f.endsWith('.md')) add(`oracles/${f}`, F(path.join(od, f)));
  };

  const lisezmoiCommon = kitLang === 'en'
    ? `# ${tenant} — ${kindLabel} Kit — ${name.slice(-9)}

Kit **generated by AuditCore ${cfg.core_version}** (\`tools/build-kit.mjs\`) — do not edit:
any change goes through a new dated generation. Merge: ${merged.counts.total} rules
(${merged.counts.opposable} binding / ${merged.counts.informatif} informative), packs:
${(cfg.constraint_packs ?? []).map(p => `\`${p}\``).join(' · ')}.
`
    : `# ${tenant} — Kit ${kindLabel} — ${name.slice(-9)}

Kit **généré par AuditCore ${cfg.core_version}** (\`tools/build-kit.mjs\`) — ne pas éditer :
toute évolution passe par une régénération datée. Fusion : ${merged.counts.total} contraintes
(${merged.counts.opposable} opposables / ${merged.counts.informatif} informatives), packs :
${(cfg.constraint_packs ?? []).map(p => `\`${p}\``).join(' · ')}.
`;
  if (kind === 'compliance') {
    add('LISEZMOI - Compliance Pack.md', lisezmoiCommon + `
## À qui ce kit est destiné
Au **projet audité** : équipe de développement, agent IA codeur, pipeline CI.

## Usage
1. Self-audit : pour chaque contrainte applicable de \`constraints-merged.json\`, émettre
   \`id · statut (PASS|FAIL|N-A|A-REVOIR) · preuve · dimension_audit\`. **Aucun PASS sans preuve.**
2. Le \`banc-de-preuves.md\` donne, règle par règle : Actions d'audit · Preuve attendue · Grille de verdict
   (avec l'instanciation du profil technologique quand elle existe).
3. Fiche sécurité : compléter \`fiche-securite.template.md\`.
4. Avant diffusion d'un rapport : \`node verifier-rapport-standalone.mjs <rapport-data.json>\` → exit 0.
5. Thème : \`theme/theme.css\` + \`theme/header.html\` (généré depuis la charte ${tenant}).
`);
    add('constraints-merged.json', F(path.join(tmp, 'merged.json')));
    add('banc-de-preuves.md', F(path.join(tmp, 'banc-de-preuves.md')));
    add('verifier-rapport-standalone.mjs', verifierStandalone);
    add('compliance-skill.md', complianceSkill);
    add('fiche-securite.template.md', F(rel('deliverables', 'templates', 'fiche-securite.template.md')));
    add('theme/theme.css', F(path.join(tmp, 'theme', 'theme.css')));
    add('theme/header.html', F(path.join(tmp, 'theme', 'header.html')));
    addOracles();
    // ECR-04 · la porte de clôture part avec le kit : le projet contrôle sa remédiation
    // depuis le seul rapport HTML qu'on lui a remis, sans export ni outillage supplémentaire.
    add('verifier-remediation.mjs', F(rel('tools', 'verifier-remediation.mjs')));
  } else {
    add('LISEZMOI - Kit Audit.md', lisezmoiCommon + `
## À qui ce kit est destiné
À **l'équipe qui conduit l'audit** (auditeur humain ou agent IA). La part du projet audité
est le kit « Compliance Pack » généré séparément (\`--kind compliance\`).

## Démarrage
1. \`node init-audit-workspace-standalone.mjs <dossier>\` — échafaude input/00-07, output/00-04, Old/.
2. Référentiel : \`dimensions.yaml\` (17 dimensions, 6 familles, scoring 1-5, applicabilité par type).
3. Conduite : gabarits \`templates/\` (rapport, matrices, présentation, go-prod, plan de remédiation…).
4. Règles impératives : feuille blanche · preuves \`fichier:ligne\` · « pas de score sans preuve » ·
   ne jamais écraser (Old/) · vérificateur obligatoire avant diffusion.
5. Remédiation : produire \`remediation-actions.yaml\` (schéma \`schemas/\`) — l'adaptateur forge
   vit dans AuditCore (\`tools/forge-adapter.mjs\`), hors kit.
`);
    add('constraints-merged.json', F(path.join(tmp, 'merged.json')));
    add('banc-de-preuves.md', F(path.join(tmp, 'banc-de-preuves.md')));
    add('verifier-rapport-standalone.mjs', verifierStandalone);
    add('compliance-skill.md', complianceSkill);
    add('init-audit-workspace-standalone.mjs', initStandalone);
    add('build-rapport-standalone.mjs', rapportStandalone);
    add('catalogue-adr.html', F(path.join(tmp, 'catalogue-adr.html')));
    add('referentiel-audit.html', F(path.join(tmp, 'referentiel-audit.html')));
    add('fiche-securite.html', F(path.join(tmp, 'fiche-securite.html')));
    add('dimensions.yaml', F(rel('core', 'dimensions', 'dimensions.yaml')));
    add('theme/theme.css', F(path.join(tmp, 'theme', 'theme.css')));
    add('theme/header.html', F(path.join(tmp, 'theme', 'header.html')));
    // RAF-012 : sélection des gabarits par langue — un tenant EN reçoit les .template.en.md
    // (renommés sans le suffixe), un tenant FR ne reçoit pas les variantes EN.
    const tplDir = rel('deliverables', 'templates');
    const allTpl = fs.readdirSync(tplDir).sort();
    for (const t of allTpl) {
      if (t.includes('.template.en.')) continue; // variantes traitées via leur base
      const enVariant = t.replace('.template.', '.template.en.');
      const useEn = kitLang === 'en' && allTpl.includes(enVariant);
      add(`templates/${t}`, F(path.join(tplDir, useEn ? enVariant : t)));
    }
    add('schemas/control.schema.json', F(rel('core', 'schemas', 'control.schema.json')));
    add('schemas/remediation-actions.schema.json', F(rel('core', 'schemas', 'remediation-actions.schema.json')));
    addOracles();
    // ECR-04 · la porte de clôture part avec le kit : le projet contrôle sa remédiation
    // depuis le seul rapport HTML qu'on lui a remis, sans export ni outillage supplémentaire.
    add('verifier-remediation.mjs', F(rel('tools', 'verifier-remediation.mjs')));
  }

  const zip = createZip(entries);
  const outPath = path.join(outDir, `${name}.zip`);
  fs.writeFileSync(outPath, zip);
  results.push({ kind, outPath, entries: entries.length, bytes: zip.length });
}
fs.rmSync(tmp, { recursive: true, force: true });
for (const r of results)
  console.log(`✔ kit ${r.kind}: ${r.entries} entrées, ${r.bytes.toLocaleString('fr-FR')} o → ${r.outPath}`);
