#!/usr/bin/env node
// promesses-verifiees — ce fichier ADHÈRE au contrôle des promesses de commentaire
// (`oracle-promesses`, règle PR1 du pilot) : une classe ou un attribut nommé dans un commentaire
// ici DOIT exister dans le code. Un générateur de page est l'endroit où une promesse de prose coûte
// le plus cher — elle s'y lit comme une garantie de ce que la page contient. Signé le 23/08/2026,
// choix humain « signer tout ce qui est propre dans les forges » ; joué avant signature, zéro constat.
//
// AuditCore — build-catalogue (M7) : corpus ADR core + fusion tenant → catalogue HTML
// navigable thémé (filtre par domaine, recherche, cartes ADR avec règles dérivées).
// Usage: node tools/build-catalogue.mjs <tenant.yaml> [--out <fichier.html>]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rel, loadTenant, loadJson } from './lib.mjs';

const tenantYaml = process.argv[2];
if (!tenantYaml) { console.error('Usage: node tools/build-catalogue.mjs <tenant.yaml> [--out <fichier.html>]'); process.exit(2); }
const { cfg, tenantDir } = loadTenant(tenantYaml);
const outIdx = process.argv.indexOf('--out');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── corpus : parse frontmatter + titre + extraits des 65 ADRs
const adrs = [];
for (const dom of fs.readdirSync(rel('core', 'adr')).sort()) {
  const dd = rel('core', 'adr', dom);
  if (!fs.statSync(dd).isDirectory()) continue;
  for (const f of fs.readdirSync(dd).filter(x => x.endsWith('.md')).sort()) {
    const txt = fs.readFileSync(path.join(dd, f), 'utf-8');
    const fm = txt.split('---')[1] ?? '';
    const g = (re) => fm.match(re)?.[1]?.trim();
    const sect = (name) => txt.split(new RegExp(`## ${name}\\s*`))[1]?.split(/\n##? /)[0]?.replace(/<!--[\s\S]*?-->/g, '').trim() ?? '';
    adrs.push({
      id: g(/^id:\s*(ADR\d{4})/m), domain: g(/^domain:\s*"?(\d\d)"?/m),
      title: txt.match(/^#\s+(.+)$/m)?.[1] ?? '', status: g(/^status:\s*"?([a-z]+)/m),
      invariant: /^invariant:\s*true/m.test(fm),
      standards: (fm.match(/^standards:\s*\[(.*?)\]/ms)?.[1] ?? '').split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean),
      controls: (fm.match(/^derived_controls:\s*\[(.*?)\]/m)?.[1] ?? '').split(',').map(s => s.trim()).filter(Boolean),
      contexte: sect('Context and Problem Statement').slice(0, 380),
      decision: (sect('Decision Outcome').split('\n###')[0] ?? '').slice(0, 380),
      file: `core/adr/${dom}/${f}`,
    });
  }
}
// règles dérivées : index de la fusion tenant (le yaml peut porter n'importe quel nom)
const tenantAbs = path.resolve(tenantYaml);
const mergedPath = path.join(tenantDir, 'merged.json');
if (!fs.existsSync(mergedPath))
  execFileSync(process.execPath, [rel('tools', 'merge-packs.mjs'), tenantAbs, '--out', mergedPath], { stdio: 'ignore' });
const merged = loadJson(mergedPath);
const ctlMeta = Object.fromEntries(merged.constraints.map(c => [c.id, c]));

// thème
const themePath = path.join(tenantDir, 'theme', 'theme.css');
if (!fs.existsSync(themePath))
  execFileSync(process.execPath, [rel('tools', 'build-theme.mjs'), tenantAbs, '--out', path.join(tenantDir, 'theme')], { stdio: 'ignore' });
const themeCss = fs.readFileSync(themePath, 'utf-8');
const domains = cfg.domains ?? [];
const domLabel = Object.fromEntries(domains.map(d => [d.code, d.label]));
const domKey = Object.fromEntries(domains.map(d => [d.code, d.key]));

const card = (a) => `<article class="card" data-dom="${a.domain}" data-q="${esc((a.id + ' ' + a.title + ' ' + a.contexte).toLowerCase())}">
  <h3><span class="aid" style="color:var(--dom-${domKey[a.domain] ?? 'meta'})">${a.id}</span> ${esc(a.title.replace(/^.*?—\s*/, ''))}
   ${a.invariant ? '<span class="badge b-inv">invariant</span>' : ''}<span class="badge">${esc(a.status)}</span></h3>
  <p class="muted">${esc(a.contexte)}${a.contexte.length >= 380 ? '…' : ''}</p>
  ${a.decision ? `<p><b>Décision :</b> ${esc(a.decision)}${a.decision.length >= 380 ? '…' : ''}</p>` : ''}
  <p class="small"><b>Standards :</b> ${a.standards.map(s => `<span class="badge">${esc(s)}</span>`).join(' ') || '—'}</p>
  <p class="small"><b>Règles dérivées :</b> ${a.controls.map(c => {
    const m = ctlMeta[c];
    return `<span class="badge c-${m ? (m.criticite ?? '').toLowerCase() : ''}" title="${esc(m?.regle ?? '')}">${esc(c)}${m ? ` · ${esc(m.criticite)}` : ''}</span>`;
  }).join(' ') || '—'}</p>
  <p class="muted small">${esc(a.file)}</p></article>`;

const byDom = domains.map(d => ({ ...d, items: adrs.filter(a => a.domain === d.code) }));
const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(cfg.tenant.name)} — Catalogue ADR (${adrs.length})</title><style>${themeCss}
.wrap{max-width:1240px;margin:0 auto;padding:24px}h1{font-size:24px}h2{margin:26px 0 10px;font-size:18px}
.muted{color:var(--muted)}.small{font-size:11.5px}
.badge{display:inline-block;border:1px solid var(--line);border-radius:999px;padding:1px 8px;font-size:10.5px;margin:1px 3px 1px 0;background:var(--panel)}
.b-inv{background:var(--accent);color:#fff;border-color:var(--accent)}
.c-fatal{border-color:var(--fatal);color:var(--fatal)}.c-bloquant{border-color:var(--bloq);color:var(--bloq)}.c-majeur{border-color:var(--maj);color:var(--maj)}
.card{background:var(--panel);border:1px solid var(--line);border-radius:10px;padding:12px 16px;margin:10px 0}
.card h3{margin:0 0 6px;font-size:14.5px}.aid{font-family:var(--font-mono)}
.filters{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0}.filters button{border:1px solid var(--line);background:var(--panel);border-radius:999px;padding:5px 12px;cursor:pointer;font:inherit;font-size:12px}
.filters button.on{background:var(--accent);color:#fff;border-color:var(--accent)}
input[type=search]{width:100%;padding:9px;border:1px solid var(--line);border-radius:8px;font:inherit;margin:8px 0}
.count{font-weight:700}
@media print{.filters,input{display:none}}
</style></head><body><div class="wrap">
<header><span class="brand">${esc(cfg.tenant.short_code)}</span> <b>${esc(cfg.tenant.name)} — Catalogue des décisions d'architecture</b>
 <span class="muted">· ${adrs.length} ADRs core · ${merged.counts.total} règles (${merged.counts.opposable} opposables) · core ${esc(String(cfg.core_version))}</span></header>
<h1>Catalogue ADR par domaine</h1>
<input type="search" id="q" placeholder="Rechercher (id, titre, contexte)…" oninput="apply()">
<div class="filters"><button class="on" data-d="*" onclick="dom('*',this)">Tous (${adrs.length})</button>
${byDom.map(d => `<button data-d="${d.code}" onclick="dom('${d.code}',this)" style="border-color:var(--dom-${d.key})">${d.code} · ${esc(d.label)} (${d.items.length})</button>`).join('')}</div>
<p class="muted"><span class="count" id="n">${adrs.length}</span> ADR affichés — les mentions produits vivent dans les profils, jamais dans le core (voir AUDIT-AGNOSTICITE).</p>
${byDom.map(d => `<h2 data-dom-h="${d.code}" style="color:var(--dom-${d.key})">${d.code} · ${esc(d.label)}</h2>${d.items.map(card).join('')}`).join('')}
<footer class="muted small" style="margin-top:26px;border-top:1px solid var(--line);padding-top:10px">Généré par AuditCore build-catalogue (M7) pour ${esc(cfg.tenant.name)} — ne pas éditer.</footer>
</div><script>
var D='*';function dom(d,btn){D=d;document.querySelectorAll('.filters button').forEach(b=>b.classList.remove('on'));btn.classList.add('on');apply();}
function apply(){var q=document.getElementById('q').value.toLowerCase(),n=0;
 document.querySelectorAll('.card').forEach(function(c){var ok=(D==='*'||c.dataset.dom===D)&&(!q||c.dataset.q.includes(q));c.style.display=ok?'':'none';if(ok)n++;});
 document.querySelectorAll('[data-dom-h]').forEach(function(h){h.style.display=(D==='*'||h.dataset.domH===D)?'':'none';});
 document.getElementById('n').textContent=n;}
</script></body></html>`;

const out = outIdx > -1 ? path.resolve(process.argv[outIdx + 1])
  : rel('deliverables', 'generated', cfg.tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), 'catalogue-adr.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html, 'utf-8');
console.log(`✔ catalogue: ${adrs.length} ADRs, ${(html.length / 1024).toFixed(0)} Ko → ${out}`);
