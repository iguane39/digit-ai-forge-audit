#!/usr/bin/env node
// AuditCore — adaptateur forge (PLAN/06 §4) : remediation-actions.yaml →
//   _bmad-output/planning-artifacts/epics.md            (format RemediationPlanner vérifié)
//   _bmad-output/implementation-artifacts/sprint-status.yaml
//   plan-remediation.md                                  (TOUTES les actions, y compris manual — règle d'honnêteté)
// Les actions `manual` ne vont JAMAIS dans epics.md mais restent visibles avec propriétaire.
// Usage: node tools/forge-adapter.mjs <remediation-actions.yaml> --out <repo-cible> [--dry-run]
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import { rel, loadYaml, loadJson } from './lib.mjs';

const file = process.argv[2];
const outIdx = process.argv.indexOf('--out');
if (!file || outIdx === -1) { console.error('Usage: node tools/forge-adapter.mjs <remediation-actions.yaml> --out <repo-cible> [--dry-run]'); process.exit(2); }
const outRepo = path.resolve(process.argv[outIdx + 1]);
const dryRun = process.argv.includes('--dry-run');

const doc = loadYaml(file);
const ajv = new Ajv({ allErrors: true, strict: false });
if (!ajv.validate(loadJson(rel('core', 'schemas', 'remediation-actions.schema.json')), doc)) {
  for (const e of ajv.errors) console.error(`ERREUR schéma: ${e.instancePath} ${e.message}`);
  process.exit(1);
}

const auto = doc.actions.filter(a => a.activation.mode === 'forge-auto');
const assisted = doc.actions.filter(a => a.activation.mode === 'forge-assisted');
const manual = doc.actions.filter(a => a.activation.mode === 'manual');
const forgeable = [...auto, ...assisted];

// ── epics.md (format vérifié : "## Story R<n> — <titre>" + cases à cocher d'acceptation)
let epics = `# Epics — remediation\n\n> Généré par AuditCore depuis ${doc.audit_ref} (core ${doc.core_version}).\n> HITL-1 requis avant sprint. ${manual.length} action(s) manuelle(s) hors epics — voir plan-remediation.md.\n`;
const byEpic = new Map();
for (const a of forgeable) { if (!byEpic.has(a.story.epic)) byEpic.set(a.story.epic, []); byEpic.get(a.story.epic).push(a); }
let n = 0;
const stories = [];
for (const [epic, actions] of byEpic) {
  epics += `\n<!-- epic: ${epic} -->\n`;
  for (const a of actions) {
    n++;
    const sid = `R${n}`;
    epics += `\n## Story ${sid} — ${a.story.title}\n`;
    for (const acc of a.story.acceptance) epics += `- [ ] ${acc}\n`;
    epics += `<!-- auditcore: action=${a.id} control=${a.control_ref} severity=${a.severity} priority=${a.priority} mode=${a.activation.mode} -->\n`;
    stories.push({ id: sid, action: a.id, epic, title: a.story.title, status: 'ready-for-dev', mode: a.activation.mode });
  }
}

// ── sprint-status.yaml
const sprint = `# généré par AuditCore forge-adapter — statuts consommés par la forge (stage D)\nstories:\n${stories.map(s => `  - { id: ${s.id}, action: ${s.action}, epic: ${s.epic}, status: ${s.status} }`).join('\n')}\n`;

// ── plan-remediation.md (vue COMPLÈTE et honnête)
const pct = (x) => doc.actions.length ? Math.round(100 * x.length / doc.actions.length) : 0;
let plan = `# Plan de remédiation — ${doc.audit_ref}\n\n**Taux d'automatisation** : forge-auto ${pct(auto)}% · forge-assisted ${pct(assisted)}% · manual ${pct(manual)}%\n(indicateur mesuré, jamais objectivé — garde-fou PLAN/06 §5)\n\n| ID | Titre | Contrôle | Sévérité | Priorité | Effort | Mode | Propriétaire |\n|---|---|---|---|---|---|---|---|\n`;
for (const a of [...doc.actions].sort((x, y) => ['urgent','prio','quick','norm'].indexOf(x.priority) - ['urgent','prio','quick','norm'].indexOf(y.priority)))
  plan += `| ${a.id} | ${a.title} | ${a.control_ref} | ${a.severity} | ${a.priority} | ${a.effort ?? '—'} | ${a.activation.mode} | ${a.activation.owner_role ?? 'forge'} |\n`;
plan += `\n## Actions manuelles (jamais écartées silencieusement)\n`;
for (const a of manual) plan += `- **${a.id} — ${a.title}** → propriétaire : ${a.activation.owner_role} · raison : ${a.activation.reason}\n`;
plan += `\n## Invocation forge (brownfield, formats vérifiés)\n\`\`\`bash\nuv run --project "<FORGE>" python -m conductor run "Remédiation ${doc.audit_ref}" --mode brownfield --repo "${doc.project.repo}" --intent remediation\n\`\`\`\nHITL-1 : approuver epics.md avant sprint · HITL-2 : merge humain (auto_pr_merge=False verrouillé).\n`;

if (dryRun) {
  console.log(`[dry-run] ${forgeable.length} stories (${auto.length} auto, ${assisted.length} assisted), ${manual.length} manuelles`);
  console.log(epics.split('\n').slice(0, 14).join('\n'));
} else {
  const p1 = path.join(outRepo, '_bmad-output', 'planning-artifacts', 'epics.md');
  const p2 = path.join(outRepo, '_bmad-output', 'implementation-artifacts', 'sprint-status.yaml');
  const p3 = path.join(outRepo, 'plan-remediation.md');
  for (const [p, content] of [[p1, epics], [p2, sprint], [p3, plan]]) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content, 'utf-8');
  }
  console.log(`✔ adaptateur forge: ${stories.length} stories → ${path.relative(outRepo, p1)} + sprint-status.yaml · plan complet (${doc.actions.length} actions dont ${manual.length} manuelles) → plan-remediation.md`);
}
