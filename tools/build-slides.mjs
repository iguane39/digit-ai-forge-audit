#!/usr/bin/env node
// promesses-verifiees — ce fichier ADHÈRE au contrôle des promesses de commentaire
// (`oracle-promesses`, règle PR1 du pilot) : une classe ou un attribut nommé dans un commentaire
// ici DOIT exister dans le code. Un générateur de page est l'endroit où une promesse de prose coûte
// le plus cher — elle s'y lit comme une garantie de ce que la page contient. Signé le 23/08/2026,
// choix humain « signer tout ce qui est propre dans les forges » ; joué avant signature, zéro constat.
//
// AuditCore — build-slides (RAF-003 / M6) : rapport-data.json + tenant → présentation HTML
// pour l'autorité de décision (navigation clavier ←/→, impression 1 slide/page).
// Règle conservée : le schéma d'architecture est CELUI du rapport (source unique).
// Usage: node tools/build-slides.mjs <rapport-data.json> --tenant <tenant.yaml> [--out <fichier.html>]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rel, loadTenant, loadJson } from './lib.mjs';

const file = process.argv[2];
const tIdx = process.argv.indexOf('--tenant');
if (!file || tIdx === -1) { console.error('Usage: node tools/build-slides.mjs <rapport-data.json> --tenant <tenant.yaml> [--out <fichier.html>]'); process.exit(2); }
const { cfg, tenantDir } = loadTenant(process.argv[tIdx + 1]);
const outIdx = process.argv.indexOf('--out');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const data = loadJson(path.resolve(file));

const themePath = path.join(tenantDir, 'theme', 'theme.css');
if (!fs.existsSync(themePath))
  execFileSync(process.execPath, [rel('tools', 'build-theme.mjs'), path.resolve(process.argv[tIdx + 1]), '--out', path.join(tenantDir, 'theme')], { stdio: 'ignore' });
const themeCss = fs.readFileSync(themePath, 'utf-8');

const dims = data.dimensions ?? [];
const scored = dims.filter(d => d.score !== undefined);
const scoreGlobal = scored.length ? (scored.reduce((s, d) => s + d.score, 0) / scored.length).toFixed(1) : '—';
const bloquants = dims.filter(d => d.score <= 2 || d.criticite === 'Fatal');
const gate = data.gate?.verdict ?? (bloquants.length >= 5 ? 'NO-GO' : bloquants.length ? 'GO SOUS RÉSERVE' : 'GO');
const gateClass = gate === 'GO' ? 'std' : gate === 'NO-GO' ? 'fatal' : 'maj';
const constats = (data.constats ?? []).filter(c => c.severite === 'critique').slice(0, 5);
const actions = (data.actions ?? []).filter(a => a.tag === 'urgent' || a.tag === 'prio').slice(0, 6);

const slides = [
  `<h1>${esc(cfg.tenant.name)} — Audit ${esc(data.projet?.nom ?? data.titre ?? '')}</h1>
   <p class="big">Présentation à ${esc(cfg.roles?.decision_authority ?? "l'autorité de décision")}</p>
   <p class="gate ${gateClass}">Verdict proposé : ${esc(gate)}</p>
   <p class="muted">${esc(data.date ?? '')}${esc(data.indice ?? '')} · auditeur : ${esc(data.auditeur ?? '—')} · core ${esc(String(cfg.core_version))}</p>`,

  `<h2>Synthèse</h2>
   <div class="kpis"><div class="kpi"><span>Score global</span><b>${scoreGlobal}/5</b></div>
   <div class="kpi"><span>Bloquants</span><b>${bloquants.length}</b></div>
   <div class="kpi"><span>Règles instruites</span><b>${(data.regles ?? []).length}</b></div></div>
   ${bloquants.length ? `<p><b>Dimensions bloquantes :</b> ${bloquants.map(b => `<code>${esc(b.id)}</code>`).join(' · ')}</p>` : '<p>Aucune dimension bloquante.</p>'}
   ${data.syntheses ? Object.entries(data.syntheses).map(([k, v]) => `<p><b>${esc(k)} :</b> ${esc(v)}</p>`).join('') : ''}`,

  `<h2>Risques majeurs (constats critiques)</h2>
   ${constats.length ? `<ol>${constats.map(c => `<li><b>${esc(c.titre)}</b><br><span class="muted">${esc(c.desc ?? '')}</span></li>`).join('')}</ol>` : '<p>Aucun constat critique.</p>'}`,

  `<h2>Plan de remédiation — priorités</h2>
   <table><thead><tr><th></th><th>Action</th><th>Effort</th></tr></thead><tbody>
   ${actions.map(a => `<tr><td><span class="badge t-${esc(a.tag)}">${esc(a.tag)}</span></td><td><b>${esc(a.titre)}</b></td><td>${esc(a.effort ?? '—')}</td></tr>`).join('') || '<tr><td colspan="3">—</td></tr>'}
   </tbody></table>
   <p class="muted">Backlog complet et modes d'activation (forge-auto / assisté / manuel) : plan de remédiation joint.</p>`,

  `<h2>Décision demandée</h2>
   <p class="gate ${gateClass}">${esc(gate)}</p>
   <ul>${gate !== 'GO' ? '<li>Lever les bloquants listés (plan de remédiation) puis re-audit ciblé</li>' : '<li>Autoriser la suite du parcours</li>'}
   <li>Valider le plan de remédiation et ses propriétaires</li>
   <li>Fixer l'échéance du point de contrôle suivant</li></ul>
   <p class="muted">Rappel : « pas de score sans preuve » — chaque chiffre de cette présentation est adossé au rapport d'audit.</p>`,
];

const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(cfg.tenant.name)} — Présentation audit ${esc(data.projet?.nom ?? '')}</title><style>${themeCss}
html,body{height:100%}.deck{height:100vh;overflow:hidden}
.slide{height:100vh;padding:7vh 9vw;display:none;flex-direction:column;justify-content:center;gap:12px;box-sizing:border-box}
.slide.on{display:flex}h1{font-size:34px}h2{font-size:26px;color:var(--accent)}.big{font-size:20px}
.gate{display:inline-block;padding:10px 20px;border-radius:10px;color:#fff;font-weight:700;font-size:22px;width:fit-content}
.gate.std{background:var(--std)}.gate.maj{background:var(--maj)}.gate.fatal{background:var(--fatal)}
.kpis{display:flex;gap:18px}.kpi{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 26px}
.kpi span{color:var(--muted)}.kpi b{display:block;font-size:34px}
table{border-collapse:collapse}th,td{border:1px solid var(--line);padding:8px 12px;text-align:left}
.badge{border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-size:12px}
.t-urgent{background:var(--fatal);color:#fff;border-color:var(--fatal)}.t-prio{color:var(--maj);border-color:var(--maj)}
.muted{color:var(--muted)}.nav{position:fixed;bottom:14px;right:18px;color:var(--muted);font-size:12px}
@media print{.slide{display:flex!important;page-break-after:always;height:auto;min-height:90vh}.nav{display:none}}
</style></head><body><div class="deck">
${slides.map((s, i) => `<section class="slide${i ? '' : ' on'}">${s}<div class="muted" style="margin-top:auto">${esc(cfg.tenant.name)} · ${i + 1}/${slides.length}</div></section>`).join('')}
</div><div class="nav">← → pour naviguer · Ctrl+P pour exporter</div><script>
var i=0,S=document.querySelectorAll('.slide');
document.addEventListener('keydown',function(e){if(e.key==='ArrowRight')i=Math.min(i+1,S.length-1);else if(e.key==='ArrowLeft')i=Math.max(i-1,0);else return;S.forEach((s,j)=>s.classList.toggle('on',j===i));});
</script></body></html>`;

const out = outIdx > -1 ? path.resolve(process.argv[outIdx + 1])
  : rel('deliverables', 'generated', cfg.tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), 'presentation-autorite.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html, 'utf-8');
console.log(`✔ slides: ${slides.length} diapositives → ${out}`);
