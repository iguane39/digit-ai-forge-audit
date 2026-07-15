#!/usr/bin/env node
// AuditCore — build-referentiel (RAF-002 / M4) : dimensions + contrôles fusionnés → référentiel
// HTML consultable thémé (filtre par famille, recherche, applicabilité par type de projet).
// Usage: node tools/build-referentiel.mjs <tenant.yaml> [--out <fichier.html>]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rel, loadTenant, loadJson, loadYaml } from './lib.mjs';

const tenantYaml = process.argv[2];
if (!tenantYaml) { console.error('Usage: node tools/build-referentiel.mjs <tenant.yaml> [--out <fichier.html>]'); process.exit(2); }
const { cfg, tenantDir } = loadTenant(tenantYaml);
const outIdx = process.argv.indexOf('--out');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tenantAbs = path.resolve(tenantYaml);

const mergedPath = path.join(tenantDir, 'merged.json');
if (!fs.existsSync(mergedPath))
  execFileSync(process.execPath, [rel('tools', 'merge-packs.mjs'), tenantAbs, '--out', mergedPath], { stdio: 'ignore' });
const merged = loadJson(mergedPath);
const themePath = path.join(tenantDir, 'theme', 'theme.css');
if (!fs.existsSync(themePath))
  execFileSync(process.execPath, [rel('tools', 'build-theme.mjs'), tenantAbs, '--out', path.join(tenantDir, 'theme')], { stdio: 'ignore' });
const themeCss = fs.readFileSync(themePath, 'utf-8');

const pack = loadYaml(rel('core', 'dimensions', 'dimensions.yaml'));
const relabel = cfg.dimensions?.relabel ?? {};
const famLabel = Object.fromEntries(pack.families.map(f => [f.key, f.label]));
const TYPES = pack.project_types;
const APP = { full: '✓', partial: '◐', off: '○' };

const dimOf = (c) => (c.dimension_audit ?? '').split(' ')[0];
const byDim = {};
for (const c of merged.constraints.filter(c => /^CTL-/.test(c.id))) (byDim[dimOf(c)] ??= []).push(c);

const card = (c) => `<article class="card" data-q="${esc((c.id + ' ' + c.regle).toLowerCase())}">
  <h4><code>${esc(c.id)}</code> <span class="badge c-${(c.criticite ?? '').toLowerCase()}">${esc(c.criticite)}</span>
   <span class="badge">${esc(c.enforcement)}</span><span class="badge">${esc(c.bucket)}</span>
   ${c.jurisdiction ? `<span class="badge b-jur">juridiction ${esc(c.jurisdiction)}</span>` : ''}
   <span class="badge">${esc(c.mode_de_controle)}</span></h4>
  <p><b>Règle :</b> ${esc(c.regle)}</p>
  ${c.applicabilite_motif && c.applicabilite_defaut === 'sans_objet' ? `<p class="muted">⚪ ${esc(c.applicabilite_motif)}</p>` : ''}
  <p class="small"><b>Vérification :</b> ${esc(c.verification ?? '')}</p>
  <p class="small"><b>Preuve attendue :</b> ${esc(c.preuve_attendue ?? '')} · <b>Grille :</b> ${esc(c.grille_verdict ?? '')}</p>
  ${(c.actions_audit ?? []).length ? `<ul class="small">${c.actions_audit.map(a => `<li>${esc(a)}</li>`).join('')}</ul>` : ''}
  <p class="small"><b>Standards :</b> ${(c.standards ?? []).map(s => `<span class="badge">${esc(s)}</span>`).join(' ')}
   ${(c.adr_source ?? []).length ? ` · <b>ADR :</b> ${c.adr_source.map(a => `<code>${esc(a)}</code>`).join(' ')}` : ''}</p>
</article>`;

const dimSection = (d) => {
  const cs = byDim[d.id] ?? [];
  return `<section class="dim" data-fam="${d.family}" id="${d.id}">
    <h2>${d.id} — ${esc(relabel[d.id] ?? d.label)} <span class="badge">${esc(famLabel[d.family])}</span>
     <span class="badge">${cs.length} contrôle(s)</span></h2>
    <p class="small muted">Applicabilité : ${TYPES.map(t => `${esc(t)} ${APP[d.applicability?.[t]] ?? '✓'}`).join(' · ')}</p>
    ${cs.map(card).join('') || '<p class="muted">Aucun contrôle core (dimension instruite par constats).</p>'}
  </section>`;
};

const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(cfg.tenant.name)} — Référentiel d'audit</title><style>${themeCss}
.wrap{max-width:1240px;margin:0 auto;padding:24px}h1{font-size:24px}h2{margin:30px 0 6px;font-size:17px}h4{margin:0 0 6px;font-size:13px}
.muted{color:var(--muted)}.small{font-size:11.5px}p{margin:4px 0}ul{margin:4px 0 4px 18px}
.badge{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:1px 8px;font-size:10.5px;margin:1px 3px 1px 0;background:var(--panel)}
.c-fatal{border-color:var(--fatal);color:var(--fatal)}.c-bloquant{border-color:var(--bloq);color:var(--bloq)}.c-majeur{border-color:var(--maj);color:var(--maj)}
.b-jur{background:var(--accent);color:#fff;border-color:var(--accent)}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:10px 14px;margin:8px 0}
.filters{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.filters button{border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:5px 12px;cursor:pointer;font:inherit;font-size:12px}
.filters button.on{background:var(--accent);color:#fff;border-color:var(--accent)}
input[type=search]{width:100%;padding:9px;border:1px solid var(--line);border-radius:8px;font:inherit;margin:8px 0}
@media print{.filters,input{display:none}.card{break-inside:avoid}}
</style></head><body><div class="wrap">
<header><span class="brand">${esc(cfg.tenant.short_code)}</span> <b>${esc(cfg.tenant.name)} — Référentiel d'audit</b>
 <span class="muted">· 17 dimensions · ${merged.constraints.filter(c => /^CTL-/.test(c.id)).length} contrôles core · scoring 1–5 « pas de score sans preuve » · core ${esc(String(cfg.core_version))}</span></header>
<h1>Référentiel — dimensions & contrôles</h1>
<input type="search" id="q" placeholder="Rechercher un contrôle (id, règle)…" oninput="apply()">
<div class="filters"><button class="on" data-f="*" onclick="fam('*',this)">Toutes les familles</button>
${pack.families.map(f => `<button data-f="${f.key}" onclick="fam('${f.key}',this)">${esc(f.label)}</button>`).join('')}</div>
${pack.dimensions.map(dimSection).join('')}
<footer class="muted small" style="margin-top:26px;border-top:1px solid var(--line);padding-top:10px">Généré par AuditCore build-referentiel (M4) pour ${esc(cfg.tenant.name)} — ne pas éditer. Légende applicabilité : ✓ plein · ◐ partiel · ○ sans objet par défaut.</footer>
</div><script>
var F='*';function fam(f,btn){F=f;document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('on'));btn.classList.add('on');apply();}
function apply(){var q=document.getElementById('q').value.toLowerCase();
 document.querySelectorAll('section.dim').forEach(function(s){var famOk=(F==='*'||s.dataset.fam===F);var any=false;
  s.querySelectorAll('.card').forEach(function(c){var ok=famOk&&(!q||c.dataset.q.includes(q));c.style.display=ok?'':'none';if(ok)any=true;});
  s.style.display=(famOk&&(any||!q))?'':'none';});}
</script></body></html>`;

const out = outIdx > -1 ? path.resolve(process.argv[outIdx + 1])
  : rel('deliverables', 'generated', cfg.tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), 'referentiel-audit.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html, 'utf-8');
console.log(`✔ référentiel: 17 dimensions, ${merged.constraints.filter(c => /^CTL-/.test(c.id)).length} contrôles, ${(html.length / 1024).toFixed(0)} Ko → ${out}`);
