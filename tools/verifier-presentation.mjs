#!/usr/bin/env node
// AuditCore — oracle de la PRÉSENTATION à l'autorité de décision (TF-2142, RU-8, 04/11/2026).
//
// LA CLASSE DE DÉFAUT : « générateur de livrable sans oracle ». `build-slides.mjs` produisait un livrable que
// personne ne jugeait, et le livrable mentait : « Aucun constat critique » affiché sur un NO-GO (le filtre
// `severite === 'critique'` sort du vocabulaire du référentiel), plan lu dans `data.actions` sans les règles
// non conformes, 5 diapositives rendues contre 8 au gabarit. Aucune porte ne le voyait, parce qu'aucune porte
// n'existait. Ce fichier est cette porte ; `build-slides.mjs` la joue sur sa propre sortie.
//
// CE QU'IL JUGE (le gabarit fait foi : `deliverables/templates/presentation-autorite.template.md`, lu à
// l'exécution — jamais recopié ici, une liste de titres écrite à la main dérive au premier changement de gabarit) :
//   P1  le nombre de diapositives égale celui du gabarit (8) ;
//   P2  chaque diapositive porte son rôle du gabarit (`data-gabarit`), dans l'ordre, et son titre visible ;
//   P3  zéro placeholder résiduel, un seul <h1> ;
//   et, SUR LES DONNÉES (`--rapport-data`, `--tenant`) — la présentation « reprend les éléments-clés du
//   rapport, jamais de contenu non tracé » :
//   P4  le verdict de gate et le nombre de bloquants affichés sont ceux que les données calculent ;
//   P5  les risques majeurs sont les constats Fatal / Bloquant, jamais « aucun constat » quand il y en a ;
//   P6  le schéma d'architecture est CELUI du rapport (même rendu `renderSchemaArchitecture`, ports et voies propres —
//       TF-2145), ou son absence est dite ;
//   P7  les modes d'activation du plan totalisent le plan de `buildPlan` ;
//   P8  les contacts nomment l'autorité de décision et le responsable sécurité du tenant.
// Ce qui n'est pas jugé faute d'entrée est DIT (« non jugé »), jamais compté vert.
//
// Usage: node tools/verifier-presentation.mjs <presentation.html> [--rapport-data <rapport-data.json>] [--tenant <tenant.yaml>]
// Exit : 0 conforme · 1 non conforme · 2 usage.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { rel, loadJson, loadTenant } from './lib.mjs';
import { aUnScore, estBloquant, constatsGraves, buildPlan } from './rapport-engine.mjs';
import { renderSchemaArchitecture } from './schema-architecture.mjs';

const brut = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
const decode = (s) => String(s ?? '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/** Les titres du gabarit, dans l'ordre : `## 3 — Schéma d'architecture` → « Schéma d'architecture ». */
export function titresDuGabarit() {
  const src = fs.readFileSync(rel('deliverables', 'templates', 'presentation-autorite.template.md'), 'utf-8');
  return [...src.matchAll(/^## (\d+) — (.+?)\s*$/gm)].map(m => ({ n: Number(m[1]), titre: m[2] }));
}

/** Le verdict de porte que les données imposent : celui qu'elles déclarent, sinon le calcul du rapport. */
export function gateAttendu(data) {
  const bloquants = (data.dimensions ?? []).filter(estBloquant);
  return data.gate?.verdict ?? (bloquants.length >= 5 ? 'NO-GO' : bloquants.length ? 'GO SOUS RÉSERVE' : 'GO');
}

/**
 * Juge une présentation. `data` / `cfg` / `index` facultatifs : sans eux, la cohérence avec les données n'est
 * pas jugée et le DIT. Rend { errors, nonJuge, nb }.
 */
export function jugerPresentation(html, { data = null, cfg = null, index = {} } = {}) {
  const errors = [];
  const nonJuge = [];
  const gabarit = titresDuGabarit();
  const sections = [...html.matchAll(/<section class="slide[^"]*"([^>]*)>([\s\S]*?)<\/section>/g)]
    .map(m => ({ attrs: m[1], corps: m[2], texte: brut(m[2]) }));

  // P1 — le compte du gabarit
  if (sections.length !== gabarit.length)
    errors.push(`P1 : ${sections.length} diapositives rendues, le gabarit presentation-autorite en demande ${gabarit.length} diapositives`);

  // P2 — rôle, ordre et titre visible de chaque diapositive
  sections.forEach((s, i) => {
    const attendu = gabarit[i]?.titre;
    const role = (s.attrs.match(/data-gabarit="([^"]*)"/) ?? [])[1];
    if (attendu && decode(role) !== attendu)
      errors.push(`P2 : la diapositive ${i + 1} déclare le rôle « ${decode(role) ?? '—'} », le gabarit attend « ${attendu} » (ordre ou contenu du gabarit non tenu)`);
    if (attendu && i > 0) {
      const titre = brut((s.corps.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) ?? [])[1]);
      if (!titre.toLowerCase().includes(attendu.toLowerCase()))
        errors.push(`P2 : la diapositive ${i + 1} s'intitule « ${titre || '—'} », le gabarit attend « ${attendu} »`);
    }
  });

  // P3 — placeholders et titre unique
  const ph = html.match(/\{\{[^}]+\}\}/g) ?? [];
  if (ph.length) errors.push(`P3 : ${ph.length} placeholder(s) résiduel(s) — ex: ${[...new Set(ph)].slice(0, 3).join(', ')}`);
  const nbH1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (nbH1 !== 1) errors.push(`P3 : ${nbH1} titre(s) <h1> — la diapositive de titre en porte un seul`);

  if (!data) {
    nonJuge.push('cohérence avec les données du rapport (P4-P8) : aucun --rapport-data fourni');
    return { errors, nonJuge, nb: sections.length };
  }
  const slide = (n) => sections[n - 1]?.texte ?? '';

  // P4 — verdict et bloquants
  const gate = gateAttendu(data);
  const bloquants = (data.dimensions ?? []).filter(estBloquant);
  // Chaque verdict affiché est balisé `data-verdict` : une recherche de sous-chaîne confondrait « GO » et « NO-GO ».
  const verdicts = [...html.matchAll(/<span data-verdict>([^<]*)<\/span>/g)].map(m => decode(m[1]).trim());
  if (!verdicts.length) errors.push('P4 : aucun verdict de gate balisé (data-verdict) dans la présentation');
  for (const v of verdicts) if (v !== gate) errors.push(`P4 : verdict de gate affiché « ${v} », les données imposent « ${gate} »`);
  const verdict = slide(4);
  const bq = /(\d+) dimension\(s\) ≤ 2 ou Fatal/.exec(verdict);
  if (!bq || Number(bq[1]) !== bloquants.length)
    errors.push(`P4 : bloquants affichés « ${bq ? bq[1] : '—'} », les données en calculent ${bloquants.length} (${bloquants.map(b => b.id).join(' ') || 'aucune'})`);
  const notees = (data.dimensions ?? []).filter(d => d.applicability !== 'off' && aUnScore(d));
  if (notees.length) {
    const moy = (notees.reduce((s, d) => s + d.score, 0) / notees.length).toFixed(1);
    if (!verdict.includes(`${moy}/5`)) errors.push(`P4 : score global affiché différent de ${moy}/5 (moyenne des ${notees.length} dimensions notées)`);
  }

  // P5 — risques majeurs
  const graves = constatsGraves(data);
  const risques = slide(5);
  if (!graves.length) {
    if (!/Aucun constat Fatal ou Bloquant/.test(risques))
      errors.push('P5 : aucun constat Fatal ni Bloquant dans les données, la diapositive doit le dire (« Aucun constat Fatal ou Bloquant »)');
  } else {
    if (/Aucun constat/i.test(risques))
      errors.push(`P5 : « Aucun constat » affiché alors que les données portent ${graves.length} constat(s) Fatal ou Bloquant (verdict ${gate})`);
    for (const c of graves.slice(0, 3))
      if (!risques.includes(brut(c.titre))) errors.push(`P5 : le risque majeur « ${c.titre} » (${c.severite}) manque à la diapositive`);
  }

  // P6 — schéma d'architecture
  const archi = sections[2]?.corps ?? '';
  if (data.architecture?.nodes?.length) {
    const attendu = /<svg viewBox[\s\S]*?<\/svg>/.exec(renderSchemaArchitecture(data.architecture))?.[0];
    const obtenu = /<svg viewBox[\s\S]*?<\/svg>/.exec(archi)?.[0];
    if (!obtenu) errors.push('P6 : le rapport porte un schéma d\'architecture, la diapositive 3 n\'en porte aucun');
    else if (obtenu !== attendu) errors.push('P6 : le schéma d\'architecture de la diapositive n\'est pas celui du rapport (second schéma divergent)');
  } else if (!/non fourni|absent/i.test(brut(archi))) {
    errors.push('P6 : les données ne portent aucun schéma d\'architecture, la diapositive 3 doit déclarer cette absence');
  }

  // P7 — plan : les modes totalisent buildPlan
  if (cfg) {
    const plan = buildPlan({ ...data, _constraints_index: index });
    const total = [...(sections[5]?.corps ?? '').matchAll(/<td data-nb>(\d+)<\/td>/g)].reduce((n, m) => n + Number(m[1]), 0);
    if (total !== plan.length) errors.push(`P7 : les modes d'activation totalisent ${total} action(s), le plan de remédiation en compte ${plan.length}`);
    // P8 — contacts
    const contacts = slide(8);
    for (const [cle, role] of [['decision_authority', cfg.roles?.decision_authority], ['security_officer', cfg.roles?.security_officer]])
      if (role && !contacts.includes(role)) errors.push(`P8 : le contact « ${role} » (${cle}) manque à la diapositive Contacts`);
    if (data.auditeur && !contacts.includes(data.auditeur)) errors.push(`P8 : l'auditeur « ${data.auditeur} » manque à la diapositive Contacts`);
  } else {
    nonJuge.push('plan et contacts (P7-P8) : aucun --tenant fourni');
  }
  return { errors, nonJuge, nb: sections.length };
}

// ── CLI ───────────────────────────────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const argv = process.argv.slice(2);
  const usage = 'Usage: node tools/verifier-presentation.mjs <presentation.html> [--rapport-data <rapport-data.json>] [--tenant <tenant.yaml>]';
  const valeur = (opt) => {
    const i = argv.indexOf(opt);
    if (i === -1) return undefined;
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('-')) { console.error(`Option ${opt} : une valeur est attendue (« ${v ?? ''} » refusé).\n${usage}`); process.exit(2); }
    return v;
  };
  const fichier = argv[0];
  if (!fichier || fichier.startsWith('-')) { console.error(usage); process.exit(2); }
  const donneesPath = valeur('--rapport-data');
  const tenantPath = valeur('--tenant');
  const data = donneesPath ? loadJson(path.resolve(donneesPath)) : null;
  let cfg = null, index = {};
  if (tenantPath) {
    const t = loadTenant(path.resolve(tenantPath));
    cfg = t.cfg;
    const merged = path.join(t.tenantDir, 'merged.json');
    if (fs.existsSync(merged)) index = Object.fromEntries(loadJson(merged).constraints.map(c => [c.id,
      { dimension_audit: c.dimension_audit, criticite: c.criticite, bucket: c.bucket, enforcement: c.enforcement, regle: c.regle }]));
  }
  const { errors, nonJuge, nb } = jugerPresentation(fs.readFileSync(path.resolve(fichier), 'utf-8'), { data, cfg, index });
  for (const n of nonJuge) console.error(`NON JUGÉ: ${n}`);
  if (errors.length) {
    for (const e of errors) console.error(`ERREUR: ${e}`);
    console.error(`\n✖ présentation NON conforme (${errors.length} erreur(s))`);
    process.exit(1);
  }
  console.log(`✔ présentation conforme — ${nb} diapositives au gabarit${nonJuge.length ? ` (non jugé : ${nonJuge.length} contrôle(s) faute d'entrée, voir ci-dessus)` : ', cohérente avec les données du rapport'}`);
}
