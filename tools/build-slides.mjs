#!/usr/bin/env node
// promesses-verifiees — ce fichier ADHÈRE au contrôle des promesses de commentaire
// (`oracle-promesses`, règle PR1 du pilot) : une classe ou un attribut nommé dans un commentaire
// ici DOIT exister dans le code. Un générateur de page est l'endroit où une promesse de prose coûte
// le plus cher — elle s'y lit comme une garantie de ce que la page contient. Signé le 23/08/2026,
// choix humain « signer tout ce qui est propre dans les forges » ; joué avant signature, zéro constat.
//
// AuditCore — build-slides (RAF-003 / M6) : rapport-data.json + tenant → présentation HTML
// pour l'autorité de décision (navigation clavier ←/→, impression 1 slide/page).
// Règle conservée : le schéma d'architecture est CELUI du rapport (source unique : `renderArchi`).
//
// TF-2142 (RU-8, 04/11/2026) — la présentation suit les HUIT diapositives de `presentation-autorite.template.md`
// (titre, contexte, schéma d'architecture, verdict Gate, 3 risques majeurs, plan de remédiation, décision
// demandée, contacts) ; les risques majeurs sont les constats Fatal et Bloquant du référentiel (et non un
// `severite === 'critique'` hors vocabulaire) ; le plan est LU dans `buildPlan`, comme le rapport, et non dans
// `data.actions` ; et la présentation produite est jugée par `tools/verifier-presentation.mjs` avant que
// l'outil ne rende la main. Chaque diapositive porte son rôle du gabarit (`data-gabarit`), que l'oracle relit.
// Usage: node tools/build-slides.mjs <rapport-data.json> --tenant <tenant.yaml> [--out <fichier.html>]
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { rel, loadTenant, loadJson, valeurFichierOuUsage } from './lib.mjs';
import { aUnScore, estBloquant, constatsGraves, buildPlan, renderArchi, ARCHI_CSS, STR } from './rapport-engine.mjs';
import { titresDuGabarit, gateAttendu, jugerPresentation } from './verifier-presentation.mjs';

const file = process.argv[2];
const tIdx = process.argv.indexOf('--tenant');
if (!file || tIdx === -1) { console.error('Usage: node tools/build-slides.mjs <rapport-data.json> --tenant <tenant.yaml> [--out <fichier.html>]'); process.exit(2); }
const USAGE = 'Usage: node tools/build-slides.mjs <rapport-data.json> --tenant <tenant.yaml> [--out <fichier.html>]';
const tenantArg = valeurFichierOuUsage(process.argv, '--tenant', USAGE);   // TF-2131 : une option n'est jamais le fichier d'une autre
const { cfg, tenantDir } = loadTenant(tenantArg);
const outArg = valeurFichierOuUsage(process.argv, '--out', USAGE);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const data = loadJson(path.resolve(file));
const tenantAbs = path.resolve(tenantArg);

const themePath = path.join(tenantDir, 'theme', 'theme.css');
if (!fs.existsSync(themePath))
  execFileSync(process.execPath, [rel('tools', 'build-theme.mjs'), tenantAbs, '--out', path.join(tenantDir, 'theme')], { stdio: 'ignore' });
const themeCss = fs.readFileSync(themePath, 'utf-8');

// Même index de contraintes que build-rapport.mjs : le plan de la présentation est celui du rapport.
const mergedPath = path.join(tenantDir, 'merged.json');
if (!fs.existsSync(mergedPath))
  execFileSync(process.execPath, [rel('tools', 'merge-packs.mjs'), tenantAbs, '--out', mergedPath], { stdio: 'ignore' });
const index = Object.fromEntries(loadJson(mergedPath).constraints.map(c => [c.id,
  { dimension_audit: c.dimension_audit, criticite: c.criticite, bucket: c.bucket, enforcement: c.enforcement, regle: c.regle }]));
data._constraints_index = index;

const dims = data.dimensions ?? [];
// TF-2143 : un score null n'est ni noté ni bloquant (`null <= 2` vaut true) — mêmes prédicats que le rapport.
const scored = dims.filter(d => d.applicability !== 'off' && aUnScore(d));
const scoreGlobal = scored.length ? (scored.reduce((s, d) => s + d.score, 0) / scored.length).toFixed(1) : '—';
const bloquants = dims.filter(estBloquant);
const gate = gateAttendu(data);
const gateClass = gate === 'GO' ? 'std' : gate === 'NO-GO' ? 'fatal' : 'maj';
const verdict = `<span data-verdict>${esc(gate)}</span>`;
const graves = constatsGraves(data);
const plan = buildPlan(data);

const texte = (v) => (v && typeof v === 'object' ? Object.values(v).filter(Boolean).join(' · ') : String(v ?? ''));
const roles = cfg.roles ?? {};
const autorite = roles.decision_authority ?? "l'autorité de décision";
const projet = data.projet?.nom ?? data.titre ?? '';
const d00 = dims.find(d => d.id === 'D00');

// 2 · Contexte — jamais de contenu non tracé : tout vient du rapport, ce qui manque s'écrit « — ».
const contexte = `<ul>
   <li>Objet du projet : ${esc(texte(data.projet?.objet ?? data.syntheses?.fonctionnelle) || '—')}</li>
   <li>Périmètre audité : ${esc(texte(d00?.resume) || '—')} <span class="muted">(renvoi à D00 du rapport d'audit)</span></li>
   <li>Motif de la présentation : ${esc(data.motif ?? 'passage de Gate')}</li></ul>`;

// 3 · Schéma d'architecture — TEL QUEL celui du rapport ; son absence se dit.
const archi = renderArchi(data.architecture, STR.fr)
  || `<p>Schéma d'architecture non fourni dans les données de l'audit : ${esc(autorite)} ne dispose pas d'un schéma relevé pendant la mission.</p>`;

// 5 · Risques majeurs — constats Fatal puis Bloquant, trois au plus ; le reste est compté, pas tu.
const preuveDe = (c) => { const p = (c.preuves ?? [])[0]; return typeof p === 'string' ? p : (p?.ref ?? '—'); };
const risques = graves.slice(0, 3);
const risquesHtml = risques.length
  ? `<ol>${risques.map(c => `<li><b>${esc(c.titre)}</b> <span class="badge">${esc(c.severite)}</span> — ${esc(c.desc ?? '')}<br>
      <span class="muted">dimension ${esc(c.dimension ?? '—')}, preuve ${esc(preuveDe(c))}</span></li>`).join('')}</ol>`
    + (graves.length > risques.length ? `<p class="muted">${graves.length - risques.length} autre(s) constat(s) Fatal ou Bloquant au rapport d'audit.</p>` : '')
  : '<p>Aucun constat Fatal ou Bloquant dans les données de l\'audit.</p>';

// 6 · Plan de remédiation — par mode d'activation (le plan complet de buildPlan, règles non conformes comprises).
const modeDe = (a) => a.activation?.mode ?? 'manual';
const MODES = [
  ['forge-auto', 'Automatique (forge-auto)', roles.remediation_team ?? '—'],
  ['forge-assisted', 'Assisté (forge-assisted)', `${roles.remediation_team ?? '—'} + revue humaine`],
  ['manual', 'Manuel', 'Porteur / rôles métier concernés (engagement direct)'],
];
const nbMode = (m) => plan.filter(a => modeDe(a) === m).length;
const pct = (n) => (plan.length ? Math.round(100 * n / plan.length) : 0);
const enTete = plan.filter(a => a.priorite === 'urgent' || a.priorite === 'prio').slice(0, 5);
const urgentes = plan.filter(a => a.priorite === 'urgent').length;
const prioritaires = plan.filter(a => a.priorite === 'prio').length;

const slides = [
  ['Titre', `<h1>${esc(cfg.tenant.name)} — Audit ${esc(projet)}</h1>
   <p class="big">Présentation à ${esc(autorite)}</p>
   <p class="gate ${gateClass}">Verdict proposé : ${verdict}</p>
   <p class="muted">${esc(data.date ?? '')}${esc(data.indice ?? '')} · auditeur : ${esc(data.auditeur ?? '—')} · core ${esc(String(cfg.core_version))}</p>`],

  ['Contexte', `<h2>Contexte</h2>${contexte}`],

  ["Schéma d'architecture", `<h2>Schéma d'architecture</h2><div class="archi">${archi}</div>
   <p class="muted">Schéma du rapport d'audit, repris tel quel (section D01).</p>`],

  ['Verdict Gate', `<h2>Verdict Gate</h2>
   <table><thead><tr><th>Score global</th><th>Statut Gate</th><th>Bloquants</th></tr></thead><tbody>
   <tr><td>${scoreGlobal}/5</td><td><b class="gate ${gateClass}">${verdict}</b></td><td>${bloquants.length} dimension(s) ≤ 2 ou Fatal</td></tr></tbody></table>
   ${bloquants.length ? `<p><b>Dimensions bloquantes :</b> ${bloquants.map(b => `<code>${esc(b.id)}</code>`).join(' · ')}</p>` : '<p>Aucune dimension bloquante.</p>'}
   <p class="muted">${(data.regles ?? []).length} règle(s) instruite(s) · ${scored.length} dimension(s) notée(s) sur ${dims.length}.</p>`],

  ['3 risques majeurs', `<h2>3 risques majeurs</h2>${risquesHtml}`],

  ['Plan de remédiation', `<h2>Plan de remédiation</h2>
   <table><thead><tr><th>Mode d'activation</th><th>Nb actions</th><th>% du total</th><th>Portage</th></tr></thead><tbody>
   ${MODES.map(([m, lib, portage]) => `<tr><td>${esc(lib)}</td><td data-nb>${nbMode(m)}</td><td>${pct(nbMode(m))} %</td><td>${esc(portage)}</td></tr>`).join('')}
   </tbody></table>
   <p>Délai global estimé : ${esc(data.remediation?.delai ?? "non estimé par l'audit")} · Effort global estimé : ${esc(data.remediation?.effort ?? "non chiffré par l'audit (cotation au plan d'amélioration)")}</p>
   ${enTete.length ? `<p>En tête de file (${urgentes} urgente(s), ${prioritaires} prioritaire(s)) :</p>
   <ul>${enTete.map(a => `<li><span class="badge t-${esc(a.priorite)}">${esc(a.priorite)}</span> <b>${esc(a.titre)}</b></li>`).join('')}</ul>` : ''}
   <p class="muted">Backlog complet (${plan.length} action(s)) et modes d'activation : plan de remédiation joint.</p>`],

  ['Décision demandée', `<h2>Décision demandée</h2>
   <p class="gate ${gateClass}">Verdict proposé : ${verdict}</p>
   <ul class="decision">
   <li>☐ <b>GO</b> — mise en production sans réserve</li>
   <li>☐ <b>GO sous réserve</b> — engagements : ${esc(data.decision?.reserves ?? 'à fixer en séance')}</li>
   <li>☐ <b>NO-GO</b> — bloquants à lever : ${bloquants.length ? bloquants.map(b => `<code>${esc(b.id)}</code>`).join(' · ') : 'aucun'}</li></ul>
   <p>Décision de ${esc(autorite)} le ____ : ____</p>
   <p class="muted">Rappel : « pas de score sans preuve » — chaque chiffre de cette présentation est adossé au rapport d'audit.</p>`],

  ['Contacts', `<h2>Contacts</h2>
   <ul><li>${esc(autorite)}</li><li>${esc(roles.security_officer ?? '—')}</li>
   <li>Porteur : ${esc(data.porteur?.nom ?? data.projet?.porteur ?? '—')}</li><li>Auditeur : ${esc(data.auditeur ?? '—')}</li></ul>`],
];

// Le gabarit fait foi : le nombre et l'ordre des diapositives sont ceux de `presentation-autorite.template.md`.
const gabarit = titresDuGabarit();
if (gabarit.length !== slides.length || gabarit.some((g, i) => g.titre !== slides[i][0])) {
  console.error(`ERREUR: le générateur rend ${slides.length} diapositives (${slides.map(s => s[0]).join(' / ')}), le gabarit en attend ${gabarit.length} (${gabarit.map(g => g.titre).join(' / ')}).`);
  process.exit(1);
}

const faits = { gate, bloquants: bloquants.map(b => b.id), score_global: scoreGlobal, nb_actions: plan.length, nb_constats_graves: graves.length };
const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(cfg.tenant.name)} — Présentation audit ${esc(projet)}</title><style>${themeCss}
html,body{height:100%}.deck{height:100vh;overflow:hidden}
.slide{height:100vh;padding:7vh 9vw;display:none;flex-direction:column;justify-content:center;gap:12px;box-sizing:border-box}
.slide.on{display:flex}h1{font-size:34px}h2{font-size:26px;color:var(--accent)}.big{font-size:20px}
.gate{display:inline-block;padding:10px 20px;border-radius:10px;color:#fff;font-weight:700;font-size:22px;width:fit-content}
b.gate{padding:4px 14px;font-size:18px}
.gate.std{background:var(--std)}.gate.maj{background:var(--maj)}.gate.fatal{background:var(--fatal)}
.kpis{display:flex;gap:18px}.kpi{background:var(--panel);border:1px solid var(--line);border-radius:12px;padding:16px 26px}
.kpi span{color:var(--muted)}.kpi b{display:block;font-size:34px}
table{border-collapse:collapse}th,td{border:1px solid var(--line);padding:8px 12px;text-align:left}
.badge{border:1px solid var(--line);border-radius:999px;padding:2px 10px;font-size:12px}
.t-urgent{background:var(--fatal);color:#fff;border-color:var(--fatal)}.t-prio{color:var(--maj);border-color:var(--maj)}
.muted{color:var(--muted)}.nav{position:fixed;bottom:14px;right:18px;color:var(--muted);font-size:12px}
.archi svg{max-width:100%;max-height:52vh;min-width:0!important}.archi h3{display:none}
${ARCHI_CSS}
@media print{.slide{display:flex!important;page-break-after:always;height:auto;min-height:90vh}.nav{display:none}}
</style></head><body><div class="deck">
${slides.map(([role, s], i) => `<section class="slide${i ? '' : ' on'}" data-gabarit="${esc(role)}">${s}<div class="muted" style="margin-top:auto">${esc(cfg.tenant.name)} · ${i + 1}/${slides.length}</div></section>`).join('')}
</div><div class="nav">← → pour naviguer · Ctrl+P pour exporter</div>
<script type="application/json" id="presentation-faits">${JSON.stringify(faits).replace(/</g, '\\u003c')}</script><script>
var i=0,S=document.querySelectorAll('.slide');
document.addEventListener('keydown',function(e){if(e.key==='ArrowRight')i=Math.min(i+1,S.length-1);else if(e.key==='ArrowLeft')i=Math.max(i-1,0);else return;S.forEach((s,j)=>s.classList.toggle('on',j===i));});
</script></body></html>`;

const out = outArg !== undefined ? path.resolve(outArg)
  : rel('deliverables', 'generated', cfg.tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'), 'presentation-autorite.html');
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html, 'utf-8');
console.log(`✔ slides: ${slides.length} diapositives → ${out}`);

// L'oracle juge la présentation PRODUITE (TF-2142 : « générateur de livrable sans oracle »). Un refus est un
// défaut du générateur ou des données : le fichier reste sur le disque pour le diagnostic, la sortie est 1.
const jugement = jugerPresentation(html, { data, cfg, index });
for (const n of jugement.nonJuge) console.error(`NON JUGÉ: ${n}`);
if (jugement.errors.length) {
  for (const e of jugement.errors) console.error(`ERREUR: ${e}`);
  console.error(`\n✖ présentation NON conforme (${jugement.errors.length} erreur(s)) — ${out}`);
  process.exit(1);
}
console.log(`✔ présentation conforme — ${jugement.nb} diapositives au gabarit, cohérentes avec les données du rapport (tools/verifier-presentation.mjs)`);
