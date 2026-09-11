#!/usr/bin/env node
// promesses-verifiees — ce fichier ADHÈRE au contrôle des promesses de commentaire
// (`oracle-promesses`, règle PR1 du pilot) : une classe ou un attribut nommé dans un commentaire
// ici DOIT exister dans le code. Un générateur de page est l'endroit où une promesse de prose coûte
// le plus cher — elle s'y lit comme une garantie de ce que la page contient. Signé le 23/08/2026,
// choix humain « signer tout ce qui est propre dans les forges » ; joué avant signature, zéro constat.
//
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
// Pack DOCTRINE (TF-1014) : ce qui est REGARDÉ (`themes`), ce qui est EXIGÉ (`preuves`), ce qui
// SORT (`livrables`) et comment la note se motive (`bareme`), par dimension. Pack ADJACENT et
// facultatif : absent, le référentiel se rend comme avant, sans bloc de doctrine et sans erreur.
const doctrinePath = rel('core', 'dimensions', 'doctrine.yaml');
const doctrine = fs.existsSync(doctrinePath) ? (loadYaml(doctrinePath).dimensions ?? {}) : {};
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

/** Bloc de doctrine d'une dimension : thèmes de périmètre, types de preuve, livrables, barème. */
const doctrineBlock = (id) => {
  const doc = doctrine[id];
  if (!doc) return '<p class="muted small">Doctrine non renseignée pour cette dimension — voir <code>core/dimensions/doctrine-ecarts.md</code>.</p>';
  const themes = doc.themes ?? [], preuves = doc.preuves ?? [], livrables = doc.livrables ?? [], bareme = doc.bareme ?? {};
  return `<details class="doctrine" open>
    <summary><b>Doctrine</b> — ${themes.length} thème(s) de périmètre · ${preuves.length} type(s) de preuve · ${livrables.length} livrable(s) attendu(s)${Object.keys(bareme).length ? ' · barème 1–5' : ''}</summary>
    ${themes.length ? `<h3>Périmètre — ce qui est regardé</h3>${themes.map(t => `<div class="theme"><b>${esc(t.titre)}</b>${(t.points ?? []).length ? `<ul class="small">${t.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : ''}</div>`).join('')}` : ''}
    ${preuves.length ? `<h3>Preuves — ce qui est exigé</h3><ul class="small">${preuves.map(p => `<li><span class="badge">${esc(p.type)}</span> ${esc(p.description)}</li>`).join('')}</ul>` : ''}
    ${livrables.length ? `<h3>Livrables attendus</h3><ul class="small">${livrables.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : ''}
    ${Object.keys(bareme).length ? `<h3>Barème</h3><dl class="small bareme">${Object.keys(bareme).sort().map(n => `<dt>${esc(n)}</dt><dd>${esc(bareme[n])}</dd>`).join('')}</dl>` : ''}
  </details>`;
};

const dimSection = (d) => {
  const cs = byDim[d.id] ?? [];
  return `<section class="dim" data-fam="${d.family}" id="${d.id}">
    <h2>${d.id} — ${esc(relabel[d.id] ?? d.label)} <span class="badge">${esc(famLabel[d.family])}</span>
     <span class="badge">${cs.length} contrôle(s)</span></h2>
    <p class="small muted">Applicabilité : ${TYPES.map(t => `${esc(t)} ${APP[d.applicability?.[t]] ?? '✓'}`).join(' · ')}</p>
    ${doctrineBlock(d.id)}
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
.doctrine{border:1px solid var(--line);border-left:3px solid var(--accent);border-radius:8px;padding:8px 14px;margin:8px 0;background:var(--panel)}
.doctrine summary{cursor:pointer;font-size:12px}.doctrine h3{font-size:12px;margin:10px 0 2px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted)}
.theme{margin:6px 0}.theme b{font-size:12px}
dl.bareme{display:grid;grid-template-columns:auto 1fr;gap:2px 10px;margin:4px 0}
dl.bareme dt{font-weight:700}dl.bareme dd{margin:0}
.filters{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.filters button{border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:5px 12px;cursor:pointer;font:inherit;font-size:12px}
.filters button.on{background:var(--accent);color:#fff;border-color:var(--accent)}
input[type=search]{width:100%;padding:9px;border:1px solid var(--line);border-radius:8px;font:inherit;margin:8px 0}
@media print{.filters,input{display:none}.card,.theme{break-inside:avoid}.doctrine{break-inside:auto}}
</style></head><body><div class="wrap">
<header><span class="brand">${esc(cfg.tenant.short_code)}</span> <b>${esc(cfg.tenant.name)} — Référentiel d'audit</b>
 <span class="muted">· ${pack.dimensions.length} dimensions · ${merged.constraints.filter(c => /^CTL-/.test(c.id)).length} contrôles core · ${Object.values(doctrine).reduce((n, d) => n + (d.themes ?? []).length, 0)} thèmes · ${Object.values(doctrine).reduce((n, d) => n + (d.preuves ?? []).length, 0)} types de preuve · ${Object.values(doctrine).reduce((n, d) => n + (d.livrables ?? []).length, 0)} livrables · scoring 1–5 « pas de score sans preuve » · core ${esc(String(cfg.core_version))}</span></header>
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
const nbDoc = Object.keys(doctrine).length;
console.log(`✔ référentiel: ${pack.dimensions.length} dimensions, ${merged.constraints.filter(c => /^CTL-/.test(c.id)).length} contrôles, `
  + `doctrine sur ${nbDoc}/${pack.dimensions.length} dimensions (${Object.values(doctrine).reduce((n, d) => n + (d.themes ?? []).length, 0)} thèmes, `
  + `${Object.values(doctrine).reduce((n, d) => n + (d.preuves ?? []).length, 0)} preuves, ${Object.values(doctrine).reduce((n, d) => n + (d.livrables ?? []).length, 0)} livrables), `
  + `${(html.length / 1024).toFixed(0)} Ko → ${out}`);
