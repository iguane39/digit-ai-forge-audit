#!/usr/bin/env node
// AuditCore — porte de conformité de la FORME POC-to-Prod du rapport d'audit (TF-2145, décision humaine D-171 (a)).
//
// LE FAIT. La forme du rapport d'audit POC-to-Prod devient le rendu par défaut de build-rapport. Sa forme de référence
// (Produit-68, 24/09/2026) avait sa porte de format chez le commanditaire ; ce dépôt, public et agnostique, n'en avait
// aucune : un rendu de cette forme qui perd une dimension, un moteur qui lève au clic d'un mode, un schéma dont une flèche
// traverse un nœud ou un plan embarqué édité à la main sortait sans qu'aucun contrôle du dépôt ne le dise. Cette porte
// en est la version AGNOSTIQUE : mêmes familles de contrôles, référentiel lu dans core/dimensions/dimensions.yaml (18
// dimensions, jamais une borne recopiée), vocabulaire et doctrine d'AuditCore (une dimension hors périmètre n'a pas de
// note ; une règle « à évaluer » se motive), plus ce que la forme promet en propre — schéma tracé par ports et voies,
// bascule de thème, pleine largeur, plan auto-porté et intègre.
//
// Ne juge PAS le fond (scores, verdicts) : il juge que le fichier rendu est la forme, complète, cohérente et exécutable.
// Jouée seule (CLI, CI) ou par verifier-rapport-html dès qu'un rendu déclare la forme (<meta name="auditcore-forme">).
//
//   F0  la forme est déclarée (<meta name="auditcore-forme" content="poc-to-prod">)
//   F1  aucun champ {{…}} résiduel : corps statique (hors scripts et commentaires) ET données du moteur
//   F2  aucun bloc d'instructions de modèle (.tpl-instructions) dans un rapport
//   F3  chaque script compile
//   F4  les dimensions sont celles du référentiel, dans l'ordre ; score entier 1–5, ou aucun pour une dimension hors
//       périmètre ; criticité et gate 1b dans leur vocabulaire (ou non renseignées, dit à la pastille)
//   F5  familles : introduction rédigée sans champ, chaque dimension dans exactement une famille
//   F6  une réponse (ADR_RESP) par règle (ADRS), verdict dans le vocabulaire fermé
//   F7  le moteur s'EXÉCUTE : initialisation, chaque mode de la bascule piloté, chaque render*/build* sans argument
//   F8  l'auto-test interne du rapport, hérité (ses anomalies sont des anomalies de la porte)
//   F9  aucun champ {{…}} dans le contenu que le moteur écrit
//   F10 plausibilité des versions (avertissement), contrat de statuts partagé avec oracles/maj-versions.mjs
//   F11 inventaires : ANALYSES = outillage exécuté (version), COMPOSANTS = briques versionnées ; une revue humaine est
//       un constat de dimension, jamais une ligne d'inventaire
//   F12 plan auto-porté : bloc remediation-plan-json lisible, schéma v1, identifiants uniques, action et critère rédigés,
//       identique au plan embarqué du moteur, et chaque action citée par une règle présente au plan
//   F13 schéma d'architecture : présent si la donnée en porte un, chaque nœud dessiné, et la MESURE sur le SVG rendu —
//       0 flèche qui traverse un nœud non extrémité, 0 paire de flèches confondues
//   F14 bascule de thème : bouton en en-tête, script qui mute data-theme et le mémorise, bloc sombre déclaré
//   F15 pleine largeur : .app déclarée page de données, conteneurs de lecture présents, aucune largeur maximale sur .app
//   F16 chiffres : bloquants, score global, verdict et nombre de règles affichés = ceux que les données embarquées donnent
//   F17 repli en cartes : la matrice et les listes se replient sous 900 px (règle td[data-label]::before), et chaque
//       cellule de données y porte le nom de sa colonne (data-label) — sans lui, la carte aligne des valeurs sans nom
//   F18 cartes de synthèse : exactement les 6 que la forme déclare (CARTES_SYNTHESE, rapport-poc-to-prod.mjs, TF-2262) —
//       une carte hors liste ou une carte du modèle absente est refusée
//
// Usage : node tools/verifier-forme-rapport.mjs <rapport.html> | --self-test
// Exit : 0 conforme · 1 non conforme · 2 usage / lecture.
import fs from 'node:fs';
import os from 'node:os';
import vm from 'node:vm';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { TextEncoder } from 'node:util';
import { rel, loadYaml } from './lib.mjs';
import { mesurerRoutageSvg } from './schema-architecture.mjs';
import { CARTES_SYNTHESE } from './rapport-poc-to-prod.mjs';
import { STATUTS_VERSION_NA } from '../oracles/maj-versions.mjs';

const CRIT = ['fatal', 'bloquant', 'majeur', 'standard'];
const GATE = ['nogo', 'reserve', 'go'];
const VERDICTS = ['conforme', 'partiel', 'non_conforme', 'sans_objet', 'a_evaluer'];

/** Les dimensions du référentiel (source unique). */
export function dimensionsDuReferentiel() {
  return loadYaml(rel('core', 'dimensions', 'dimensions.yaml')).dimensions.map((d) => d.id);
}

function scriptsDe(html) {
  return [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter((m) => !/\bsrc=/i.test(m[1]) && !/type\s*=\s*["']application\/json["']/i.test(m[1])).map((m) => m[2]);
}

/** Lecture des données du moteur : tous les scripts exécutés dans un bac à sable sans DOM, globales capturées. */
function lireDonnees(scripts) {
  const sb = { console: { log() {}, warn() {}, error() {}, info() {} }, JSON, Math };
  sb.globalThis = sb;
  vm.createContext(sb);
  for (const s of scripts) { try { vm.runInContext(s, sb, { timeout: 8000 }); } catch { /* jugé par F7 */ } }
  const noms = ['FAMILIES', 'ORDERED_DOMAINS', 'DOMAINS', 'ADRS', 'ADR_RESP', 'ARCHITECTURE_DATA', 'ARCHITECTURE_SVG', 'DB_SCHEMA_DATA', 'REPRISE',
    'TESTS', 'ANALYSES', 'COMPOSANTS', 'PLAN_EMBARQUE', 'FAITS_AUTOTEST', 'META', 'VUES', 'NB_DIMENSIONS'];
  try {
    return JSON.parse(vm.runInContext(`JSON.stringify({${noms.map((n) => `${n}:(typeof ${n}!=='undefined'?${n}:null)`).join(',')}})`, sb, { timeout: 4000 }));
  } catch { return null; }
}

/** Élément de DOM simulé (même esprit que la porte de format de la forme de référence) : innerHTML gardé pour F9. */
function elementSimule(magasin) {
  return {
    _h: '', dataset: {}, style: {}, value: '', textContent: '',
    set innerHTML(v) { this._h = String(v); }, get innerHTML() { return this._h; },
    set outerHTML(v) { this._h = String(v); }, get outerHTML() { return this._h; },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    addEventListener() {}, appendChild() {}, removeChild() {}, remove() {}, click() {},
    closest() { return null; }, setAttribute() {}, removeAttribute() {}, getAttribute() { return null; }, hasAttribute() { return false; },
    scrollIntoView() {}, focus() {}, insertAdjacentHTML() {}, getBoundingClientRect() { return { top: 0, left: 0, width: 0, height: 0 }; },
    querySelector() { return elementSimule(magasin); }, querySelectorAll() { return []; }, matches() { return false; },
  };
}
/** F7 · le moteur s'exécute comme dans un navigateur : init, chaque mode, chaque fonction render… ou build… sans argument. */
function executerMoteur(html, scripts) {
  const magasin = new Map();
  const parId = (id) => { if (!magasin.has(id)) magasin.set(id, elementSimule(magasin)); return magasin.get(id); };
  const doc = {
    documentElement: {}, body: elementSimule(magasin), head: elementSimule(magasin), readyState: 'complete',
    getElementById: parId, createElement: () => elementSimule(magasin), querySelector: () => elementSimule(magasin), querySelectorAll: () => [],
    addEventListener() {},
  };
  const sb = {
    document: doc, location: { search: '', hash: '', href: '', pathname: '/' }, history: { replaceState() {}, pushState() {} },
    window: { scrollY: 0, scrollTo() {}, innerWidth: 1280, innerHeight: 900, addEventListener() {}, dispatchEvent() {}, location: { search: '', hash: '' }, matchMedia: () => ({ matches: false, addEventListener() {} }) },
    navigator: {}, console: { log() {}, warn() {}, error() {}, info() {} }, Set, Map, Math, JSON, Date,
    setTimeout: (f) => { try { if (typeof f === 'function') f(); } catch { /* jugé ailleurs */ } return 0; }, clearTimeout() {},
    TextEncoder, URLSearchParams, CSS: { escape: (s) => s }, RegExp,
  };
  sb.globalThis = sb;
  vm.createContext(sb);
  const erreurs = [];
  scripts.forEach((s, i) => { try { vm.runInContext(s, sb, { timeout: 8000 }); } catch (e) { erreurs.push(`initialisation du script n°${i + 1} : ${e.message}`); } });
  const piloter = (expr, lib) => { try { vm.runInContext(expr, sb, { timeout: 8000 }); } catch (e) { erreurs.push(`${lib} : ${e.message}`); } };
  const modes = [...new Set([...html.matchAll(/data-mode="([a-z-]+)"/g)].map((m) => m[1]))];
  piloter('typeof render==="function" && render();', 'render()');
  for (const m of modes) piloter(`(function(){ state.mode=${JSON.stringify(m)}; applyMode(); })();`, `mode « ${m} »`);
  piloter('Object.keys(globalThis).filter(function(k){return /^(render|draw|build)/.test(k)&&typeof globalThis[k]==="function"&&globalThis[k].length===0;}).forEach(function(k){try{globalThis[k]();}catch(e){throw new Error(k+"() : "+e.message);}});', 'balayage render*/build*');
  let autotest = null;
  try { autotest = JSON.parse(vm.runInContext('JSON.stringify(typeof auditSelfTest==="function" ? auditSelfTest() : null)', sb, { timeout: 8000 })); }
  catch (e) { erreurs.push(`auditSelfTest() : ${e.message}`); }
  return { erreurs, autotest, magasin, modes };
}

/**
 * Juge un rendu de la forme. Rend { erreurs: [{ check, msg }], avertissements: [{ check, msg }], controles }.
 * `heriterAutotest: false` : l'auto-test interne n'est pas rejoué (verifier-rapport-html l'hérite déjà, check E).
 */
export function jugerForme(html, { dimensions = dimensionsDuReferentiel(), heriterAutotest = true } = {}) {
  const erreurs = [], avertissements = [];
  const fail = (check, msg) => erreurs.push({ check, msg });
  const warn = (check, msg) => avertissements.push({ check, msg });

  if (!/<meta name="auditcore-forme" content="poc-to-prod">/.test(html)) fail('F0', 'la forme POC-to-Prod n\'est pas déclarée (<meta name="auditcore-forme" content="poc-to-prod">) : ce fichier n\'est pas un rendu de cette forme');
  const statique = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ').replace(/<!--[\s\S]*?-->/g, ' ');
  const phStatique = statique.match(/\{\{[\s\S]*?\}\}/g) ?? [];
  if (/class="tpl-instructions"|class="tpl-steps"/.test(html)) fail('F2', 'un bloc d\'instructions de modèle est présent : il n\'a pas sa place dans un rapport');

  const scripts = scriptsDe(html);
  if (!scripts.length) fail('F3', 'aucun script exploitable : le rapport est inerte');
  scripts.forEach((s, i) => { try { new vm.Script(s); } catch (e) { fail('F3', `le script n°${i + 1} ne compile pas : ${e.message}`); } });

  const D = lireDonnees(scripts);
  if (!D || !D.DOMAINS || !D.ORDERED_DOMAINS) {
    fail('F4', 'données du moteur illisibles (DOMAINS, ORDERED_DOMAINS) : moteur absent ou cassé');
  } else {
    // F1 (données) — les blocs que le rendu produit depuis la donnée
    const phDonnees = JSON.stringify([D.DOMAINS, D.FAMILIES, D.ADR_RESP, D.ARCHITECTURE_DATA, D.DB_SCHEMA_DATA, D.REPRISE]).match(/\{\{[\s\S]*?\}\}/g) ?? [];
    const ph = [...phStatique, ...phDonnees];
    if (ph.length) fail('F1', `${ph.length} champ(s) {{…}} résiduel(s) (corps rendu ou données) — ex. : ${[...new Set(ph)].slice(0, 4).join(' · ')}`);
    // F4
    const attendu = dimensions.join(' '), obtenu = D.ORDERED_DOMAINS.join(' ');
    if (attendu !== obtenu) fail('F4', `dimensions rendues « ${obtenu} » ≠ référentiel « ${attendu} »`);
    for (const k of D.ORDERED_DOMAINS) {
      const d = D.DOMAINS[k];
      if (!d) { fail('F4', `${k} : déclarée mais absente de DOMAINS`); continue; }
      if (d.applicability === 'off') { if (d.score !== null && d.score !== undefined && !(Number.isInteger(d.score) && d.score >= 1 && d.score <= 5)) fail('F4', `${k} (hors périmètre) : score invalide (${JSON.stringify(d.score)})`); }
      else if (!(Number.isInteger(d.score) && d.score >= 1 && d.score <= 5)) fail('F4', `${k} : score invalide (${JSON.stringify(d.score)}), attendu un entier de 1 à 5 — une dimension sans note se déclare hors périmètre`);
      if (d.criticality !== null && !CRIT.includes(d.criticality)) fail('F4', `${k} : criticité hors vocabulaire (${JSON.stringify(d.criticality)})`);
      if (d.gate1b !== null && !GATE.includes(d.gate1b)) fail('F4', `${k} : gate 1b hors vocabulaire (${JSON.stringify(d.gate1b)})`);
      if (!d.name) fail('F4', `${k} : libellé absent`);
    }
    // F5
    const vus = new Map();
    for (const f of D.FAMILIES ?? []) {
      if (!String(f.intro ?? '').trim()) fail('F5', `famille « ${f.name ?? f.key} » : introduction vide`);
      else if (/\{\{/.test(f.intro)) fail('F5', `famille « ${f.name ?? f.key} » : introduction en champ non rempli`);
      for (const k of f.domains ?? []) {
        if (!D.DOMAINS[k]) fail('F5', `famille « ${f.key} » : dimension inconnue ${k}`);
        vus.set(k, (vus.get(k) ?? 0) + 1);
      }
    }
    for (const k of D.ORDERED_DOMAINS) if ((vus.get(k) ?? 0) !== 1) fail('F5', `${k} : rattachée à ${vus.get(k) ?? 0} famille(s), exactement une attendue`);
    // F6
    for (const a of D.ADRS ?? []) {
      const r = D.ADR_RESP?.[a.id];
      if (!r) fail('F6', `${a.id} : aucune réponse (ADR_RESP) — verdict laissé au défaut`);
      else if (!VERDICTS.includes(r.verdict)) fail('F6', `${a.id} : verdict hors vocabulaire (${JSON.stringify(r.verdict)})`);
    }
    // F10 · versions (avertissement), F11 · inventaires
    const estim = /≈|~|\bà\s*confirmer\b|\bcanal\b|\bx\b|\.x\b|\?/i;
    const scanVer = (rows, lbl) => (rows ?? []).forEach((r) => {
      if (!r || typeof r !== 'object') return;
      const statut = String(r.statut ?? '').trim(), v = String(r.version_actuelle ?? '').trim(), nom = r.nom ?? r.outil ?? r.id ?? '?';
      if (STATUTS_VERSION_NA.has(statut)) return;
      if (!v) { if (statut) warn('F10', `${lbl} « ${nom} » : statut « ${statut} » sans version actuelle résolue`); return; }
      if (estim.test(v) || !/\d/.test(v)) warn('F10', `${lbl} « ${nom} » : version actuelle non résolue (« ${v} »)`);
    });
    scanVer(D.COMPOSANTS, 'composant'); scanVer(D.ANALYSES, 'analyse');
    const humain = /revue|humain|manuel|relecture|human|manual review/i;
    const revendique = (s) => { const t = String(s ?? '').trim(); return t && !/^(—|-|n\/?a|sans objet|info|n\.?d\.?)$/i.test(t); };
    for (const a of D.ANALYSES ?? []) {
      if (!a || typeof a !== 'object') continue;
      const id = a.id ?? a.outil ?? '?';
      if (humain.test(String(a.outil ?? '')) || /review manuelle|revue/i.test(String(a.categorie ?? ''))) fail('F11', `analyse « ${id} » : revue ou contrôle manuel rangé en outillage — le déplacer en constat de dimension`);
      else if (!String(a.version_utilisee ?? '').trim() && revendique(a.statut ?? a.resultat)) fail('F11', `analyse « ${id} » : aucune version utilisée alors qu'un résultat est revendiqué — un outil exécuté porte sa version`);
    }
    for (const c of D.COMPOSANTS ?? []) {
      if (c && (humain.test(String(c.nom ?? '')) || /review manuelle|revue/i.test(String(c.categorie ?? '')))) fail('F11', `composant « ${c.nom ?? '?'} » : une activité humaine n'est pas une brique versionnée`);
    }
    // F12 · plan auto-porté
    const bloc = /<script type="application\/json" id="remediation-plan-json">([\s\S]*?)<\/script>/.exec(html)?.[1];
    let plan = null;
    if (!bloc) fail('F12', 'bloc remediation-plan-json absent : le plan n\'est pas auto-porté');
    else {
      try { plan = JSON.parse(bloc); } catch (e) { fail('F12', `bloc remediation-plan-json illisible : ${e.message}`); }
      if (plan) {
        if (plan.schema !== 'auditcore.remediation-plan/v1') fail('F12', `schéma du plan « ${plan.schema} » ≠ auditcore.remediation-plan/v1`);
        const ids = new Set();
        for (const a of plan.actions ?? []) {
          if (!a.id) fail('F12', 'action sans identifiant');
          else if (ids.has(a.id)) fail('F12', `identifiant d'action en double : ${a.id}`);
          ids.add(a.id);
          if (!String(a.action ?? '').trim()) fail('F12', `${a.id} : action non rédigée`);
          if (!String(a.verification ?? '').trim()) fail('F12', `${a.id} : critère de clôture absent`);
        }
        if (D.PLAN_EMBARQUE && JSON.stringify(plan) !== JSON.stringify(D.PLAN_EMBARQUE)) fail('F12', 'le bloc remediation-plan-json diffère du plan embarqué dans le moteur : fichier modifié après sa génération');
        for (const [id, r] of Object.entries(D.ADR_RESP ?? {})) if (r.rem_id && !ids.has(r.rem_id)) fail('F12', `la règle ${id} renvoie à l'action ${r.rem_id}, absente du plan`);
      }
    }
    // F13 · schéma d'architecture
    const nNoeuds = (D.ARCHITECTURE_DATA?.nodes ?? []).length;
    if (nNoeuds) {
      const svg = /<svg viewBox="[^"]*"[^>]*data-schema="architecture"[\s\S]*?<\/svg>/.exec(html)?.[0];
      if (!svg) fail('F13', 'la donnée porte une architecture, le rendu ne porte aucun schéma (marqueur data-schema="architecture")');
      else {
        const m = mesurerRoutageSvg(svg);
        if (m.noeuds !== nNoeuds) fail('F13', `${m.noeuds} nœud(s) dessiné(s) pour ${nNoeuds} dans la donnée`);
        if (m.traversees.length) fail('F13', `${m.traversees.length} flèche(s) traversent un nœud qui n'est ni leur source ni leur cible — ex. : ${m.traversees.slice(0, 3).map((t) => `${t.de} → ${t.vers} à travers ${t.noeud}`).join(' ; ')}`);
        if (m.confondues.length) fail('F13', `${m.confondues.length} paire(s) de flèches confondues (segments colinéaires superposés) — le lecteur ne sait plus laquelle va où`);
        const ids = new Set(m.noeuds ? [...svg.matchAll(/id="arch-n-([^"]+)"/g)].map((x) => x[1]) : []);
        for (const p of svg.matchAll(/<polyline\b[^>]*data-de="([^"]*)"[^>]*data-vers="([^"]*)"/g))
          for (const bout of [p[1], p[2]]) if (!ids.has(bout.replace(/[^\w-]/g, '_'))) fail('F13', `une flèche nomme le nœud « ${bout} », absent du schéma`);
      }
    }
    // F16 · chiffres affichés = données embarquées
    const notees = D.ORDERED_DOMAINS.map((k) => D.DOMAINS[k]).filter((d) => d && d.applicability !== 'off' && typeof d.score === 'number');
    const bloquants = D.ORDERED_DOMAINS.filter((k) => { const d = D.DOMAINS[k]; return d && d.applicability !== 'off' && ((typeof d.score === 'number' && d.score <= 2) || d.criticality === 'fatal'); });
    // la valeur d'un KPI : le texte de `.k-valeur` jusqu'à sa première balise fermante, son premier mot (l'unité suit)
    const lu = (id) => (new RegExp(`class="k-valeur" aria-describedby="${id}">([\\s\\S]*?)</span>`).exec(html)?.[1] ?? '')
      .replace(/<[^>]+>/g, ' ').trim().split(/\s+/)[0] ?? '';
    const vBloq = lu('kr-bloq'), vScore = lu('kr-score'), vRegles = lu('kr-regles');
    if (vBloq !== String(bloquants.length)) fail('F16', `KPI bloquants affiché « ${vBloq} », les dimensions embarquées en donnent ${bloquants.length} (${bloquants.join(' ') || 'aucune'})`);
    const moy = notees.length ? (notees.reduce((s, d) => s + d.score, 0) / notees.length).toFixed(1) : '—';
    if (vScore !== moy) fail('F16', `KPI score global affiché « ${vScore} », moyenne des dimensions notées embarquées ${moy}`);
    if (vRegles !== String((D.ADRS ?? []).length)) fail('F16', `KPI règles instruites « ${vRegles} », ${(D.ADRS ?? []).length} règle(s) embarquée(s)`);
    const gateAffiche = /class="gate (?:std|maj|fatal)"[^>]*>([^<]*)</.exec(html)?.[1]?.trim();
    if (D.META?.gate && gateAffiche !== D.META.gate) fail('F16', `verdict affiché « ${gateAffiche} », données embarquées « ${D.META.gate} »`);
  }

  // F14 · bascule de thème
  const enTete = /<header\b[\s\S]*?<\/header>/.exec(html)?.[0] ?? '';
  if (!/id="theme-toggle"/.test(enTete)) fail('F14', 'bouton de bascule de thème absent de l\'en-tête');
  if (!/setAttribute\('data-theme'/.test(html) || !/localStorage/.test(html)) fail('F14', 'script de bascule absent : rien ne mute ni ne mémorise data-theme');
  if (!/:root\[data-theme="dark"\]\{/.test(html)) fail('F14', 'aucun bloc :root[data-theme="dark"] : la palette sombre n\'est pas déclarée');
  // F15 · pleine largeur, lecture tenue
  if (!/<div class="app" data-page="donnees">/.test(html)) fail('F15', '.app n\'est pas déclarée page de données (data-page="donnees") : la pleine largeur de la forme n\'est pas tenue');
  if (!/class="[^"]*\blire\b[^"]*" data-mesure-lecture/.test(html)) fail('F15', 'aucun conteneur de lecture (.lire[data-mesure-lecture]) : la prose n\'est plus tenue en largeur');
  const regleApp = /\.app\{([^}]*)\}/.exec(html)?.[1] ?? '';
  if (/max-width\s*:\s*(?!none)[^;]+/.test(regleApp)) fail('F15', `.app porte une largeur maximale (« ${/max-width\s*:\s*([^;]+)/.exec(regleApp)[1]} ») : la forme est pleine largeur`);
  // F17 · repli en cartes (socle de page, composants §6) : un tableau large déborde de l'écran même dans un conteneur
  // défilant ; replié, chaque cellule dit sa colonne. Corps statique seulement : le moteur porte les mêmes fragments.
  const tablesRepli = [...statique.matchAll(/<table\b[^>]*class="[^"]*\b(?:tm-table|adr-table)\b[^"]*"[^>]*>[\s\S]*?<\/table>/g)].map((m) => m[0]);
  let sansEtiquette = 0, exempleTable = '';
  for (const t of tablesRepli) {
    const corps = /<tbody>([\s\S]*?)<\/tbody>/.exec(t)?.[1] ?? '';
    for (const td of corps.matchAll(/<td\b([^>]*)>/g)) {
      if (/\bcolspan=/.test(td[1]) || /\bdata-label="[^"]+"/.test(td[1])) continue;
      sansEtiquette++;
      if (!exempleTable) exempleTable = /\bid="([^"]*)"/.exec(t)?.[1] ?? '?';
    }
  }
  if (sansEtiquette) fail('F17', `${sansEtiquette} cellule(s) de données sans data-label (ex. : table #${exempleTable}) : repliée en carte sous 900 px, la valeur perd le nom de sa colonne`);
  for (const cls of ['tm-table', 'adr-table'])
    if (tablesRepli.some((t) => new RegExp(`class="[^"]*\\b${cls}\\b`).test(t)) && !new RegExp(`\\.${cls} td\\[data-label\\]::before\\{content:attr\\(data-label\\)`).test(html))
      fail('F17', `aucune règle de repli en cartes pour .${cls} (td[data-label]::before) : sous 900 px, ses tableaux débordent de l'écran`);

  // F18 · cartes de synthèse (TF-2262, RT-53) : la forme déclare ses cartes, le rendu n'en porte ni plus ni moins. Corps
  // statique seulement : le tableau des synthèses est écrit par le générateur, la clé de chaque carte est son `data-carte`.
  const cartesRendues = [...statique.matchAll(/<tr class="summary-card[^"]*" data-carte="([^"]*)"/g)].map((m) => m[1]);
  const cartesDeclarees = CARTES_SYNTHESE.map((c) => c.cle);
  const horsListe = cartesRendues.filter((k) => !cartesDeclarees.includes(k));
  const absentes = cartesDeclarees.filter((k) => !cartesRendues.includes(k));
  if (horsListe.length) fail('F18', `${horsListe.length} carte(s) de synthèse hors de la liste de la forme (${cartesDeclarees.length} déclarées) — ${horsListe.slice(0, 6).join(', ')}${horsListe.length > 6 ? ', …' : ''}`);
  if (absentes.length) fail('F18', `${absentes.length} carte(s) de synthèse du modèle absente(s) du rendu — ${absentes.join(', ')}`);

  // F7, F8, F9 · le moteur exécuté
  if (scripts.length && !erreurs.some((e) => e.check === 'F3')) {
    const r = executerMoteur(html, scripts);
    for (const e of r.erreurs) fail('F7', `le moteur lève : ${e}`);
    if (!r.modes.length) fail('F7', 'aucun mode de bascule (data-mode) : la navigation de la forme est absente');
    if (heriterAutotest) {
      if (!r.autotest) fail('F8', 'auto-test interne absent (auditSelfTest)');
      else {
        const msg = (e) => (typeof e === 'string' ? e : e?.msg ?? JSON.stringify(e));
        for (const e of r.autotest.errors ?? []) fail('F8', `auto-test interne : ${msg(e)}`);
        for (const w of r.autotest.warnings ?? []) warn('F8', `auto-test interne : ${msg(w)}`);
      }
    }
    let n = 0; const ex = new Set();
    for (const el of r.magasin.values()) for (const m of String(el._h ?? '').match(/\{\{[\s\S]*?\}\}/g) ?? []) { n++; ex.add(m); }
    if (n) fail('F9', `${n} champ(s) {{…}} dans le contenu écrit par le moteur — ex. : ${[...ex].slice(0, 3).join(' · ')}`);
  }
  return { erreurs, avertissements, controles: 19 };
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-TEST À DOUBLE SENS : un rendu RÉEL (fixture riche) passe ; chaque mutation échoue pour SA raison.
// ─────────────────────────────────────────────────────────────────────────────
export const MUTATIONS = [
  ['F0', 'forme non déclarée', (h) => h.replace('<meta name="auditcore-forme" content="poc-to-prod">', '')],
  ['F1', 'champ non rempli dans les données', (h) => h.replace(/("name":")([^"]+)(")/, '$1{{NOM_DIMENSION}}$3')],
  ['F2', 'bloc d\'instructions de modèle', (h) => h.replace('<div class="app" data-page="donnees">', '<div class="app" data-page="donnees"><section class="tpl-instructions">mode d\'emploi</section>')],
  ['F3', 'moteur qui ne compile pas', (h) => h.replace('function montreVue(k){', 'function montreVue(k){ if(true{ ')],
  ['F4', 'dimension retirée', (h) => h.replace(/const ORDERED_DOMAINS = \["D00",/, 'const ORDERED_DOMAINS = [')],
  ['F4', 'score hors échelle', (h) => h.replace(/"score":\d/, '"score":7')],
  ['F5', 'introduction de famille vide', (h) => h.replace(/("intro":")[^"]*(")/, '$1$2')],
  ['F6', 'règle sans réponse', (h) => h.replace(/const ADR_RESP = \{"[^"]+":\{[^}]*\},?/, 'const ADR_RESP = {')],
  ['F7', 'moteur qui lève au changement de mode', (h) => h.replace('function applyMode() {', 'function applyMode() { null.mode; ')],
  ['F8', 'verdict déclaré contredit par les dimensions (auto-test interne)', (h) => h.replace(/"gate_declare":"[^"]*"/g, '"gate_declare":"NO-GO"')],
  ['F9', 'champ non rempli écrit par le moteur', (h) => h.replace(/("tm\.titre":")/, '$1{{TITRE_MATRICE}} ')],
  ['F11', 'revue humaine rangée en outillage', (h) => h.replace(/const ANALYSES = \[\{"outil":"[^"]*"/, 'const ANALYSES = [{"outil":"revue manuelle du code"')],
  ['F12', 'plan du bloc machine édité à la main', (h) => h.replace(/(<script type="application\/json" id="remediation-plan-json">[^<]*?"action":")([^"]*)/, '$1action réécrite à la main')],
  ['F13', 'flèche qui traverse un nœud', (h) => traverser(h)],
  ['F13', 'paire de flèches confondues', (h) => confondre(h)],
  ['F14', 'bascule de thème retirée', (h) => h.replace(/<button id="theme-toggle"[\s\S]*?<\/button>/, '')],
  ['F15', 'pleine largeur retirée', (h) => h.replace('<div class="app" data-page="donnees">', '<div class="app">')],
  ['F16', 'KPI bloquants faux', (h) => h.replace(/(class="k-valeur" aria-describedby="kr-bloq">)(?:<span class="kv-alerte">)?(\d+)/, (m, a, n) => `${a}${Number(n) + 3}`)],
  ['F17', 'cellules de la matrice sans nom de colonne', (h) => sansEtiquettes(h)],
  ['F18', 'carte de synthèse hors de la liste de la forme', (h) => h.replace(/<tr class="summary-card[^"]*" data-carte="audit_limites">/, '<tr class="summary-card" data-carte="carte_en_trop">')],
  ['F18', 'carte de synthèse du modèle absente', (h) => h.replace(/<tr class="summary-card[^"]*" data-carte="audit_bloque">[\s\S]*?<\/tr>/, '')],
  ['F17', 'règle de repli en cartes retirée', (h) => h.replace(/td\[data-label\]::before\{content:attr\(data-label\)/g, 'td[data-label]::before{content:none')],
];
/** Retire les data-label de la première matrice rendue qui en porte (corps statique : l'identifiant y est numéroté). */
function sansEtiquettes(h) {
  for (const t of h.matchAll(/<table class="tm-table" id="tm-D\d+-table"[\s\S]*?<\/table>/g))
    if (/ data-label="/.test(t[0])) return h.replace(t[0], t[0].replace(/ data-label="[^"]*"/g, ''));
  return h;
}
/** Les règles d'AVERTISSEMENT ont aussi leurs deux sens : la mutation doit lever l'avertissement, sans erreur ajoutée. */
export const MUTATIONS_AVERTISSEMENT = [
  ['F10', 'version actuelle estimée au lieu de résolue', (h) => h.replace(/"version_actuelle":"[^"]*"/g, '"version_actuelle":"2.x"')],
];
/** Fait passer la première flèche du schéma à travers un nœud qui n'est pas son extrémité. */
function traverser(h) {
  const svg = /<svg viewBox="[^"]*"[^>]*data-schema="architecture"[\s\S]*?<\/svg>/.exec(h)?.[0];
  if (!svg) return h;
  const noeuds = [...svg.matchAll(/<g\b[^>]*id="arch-n-([^"]+)"[^>]*>[\s\S]*?<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)"/g)];
  const fl = /<polyline\b[^>]*data-de="([^"]*)"[^>]*data-vers="([^"]*)" points="([^"]*)"/.exec(svg);
  const autre = noeuds.find((n) => n[1] !== fl[1] && n[1] !== fl[2]);
  if (!fl || !autre) return h;
  const cx = Number(autre[2]) + Number(autre[4]) / 2, cy = Number(autre[3]) + Number(autre[5]) / 2;
  const pts = fl[3].split(' '); pts.splice(1, 0, `${cx},${cy - 40}`, `${cx},${cy + 40}`);
  return h.replace(svg, svg.replace(fl[3], pts.join(' ')));
}
/** Copie le tracé de la première flèche sur la seconde (deux flèches distinctes confondues). */
function confondre(h) {
  const svg = /<svg viewBox="[^"]*"[^>]*data-schema="architecture"[\s\S]*?<\/svg>/.exec(h)?.[0];
  if (!svg) return h;
  const p = [...svg.matchAll(/<polyline\b[^>]*points="([^"]*)"/g)];
  if (p.length < 2) return h;
  return h.replace(svg, svg.replace(`points="${p[1][1]}"`, `points="${p[0][1]}"`));
}

function selfTest() {
  const racine = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'forme-poc-'));
  const vert = path.join(dir, 'vert.html');
  const b = spawnSync(process.execPath, [path.join(racine, 'tools', 'build-rapport.mjs'), path.join(racine, 'tests', 'fixtures', 'rapport-data-riche.json'),
    '--tenant', path.join(racine, 'config', 'tenants', 'exemple', 'tenant.yaml'), '--out', vert], { encoding: 'utf8', timeout: 120000 });
  const casse = [];
  if (b.status !== 0) { console.log(`SELF-TEST FAIL : le rendu de la fixture riche échoue (${b.stderr.slice(0, 300)})`); fs.rmSync(dir, { recursive: true, force: true }); return 1; }
  const h = fs.readFileSync(vert, 'utf8');
  const v = jugerForme(h);
  if (v.erreurs.length) casse.push(`VERT refusé : ${v.erreurs.slice(0, 4).map((e) => `[${e.check}] ${e.msg}`).join(' | ')}`);
  let rouges = 0;
  for (const [check, nom, muter] of MUTATIONS) {
    const m = muter(h);
    if (m === h) { casse.push(`ROUGE « ${nom} » : la mutation n'a rien changé (fixture à revoir)`); continue; }
    const r = jugerForme(m);
    if (!r.erreurs.some((e) => e.check === check)) casse.push(`ROUGE « ${nom} » accepté : ${check} attendu, obtenu ${r.erreurs.map((e) => e.check).join(',') || 'aucune erreur'}`);
    else rouges++;
  }
  if (v.avertissements.some((w) => w.check === 'F10')) casse.push('VERT : un avertissement F10 sur le rendu sain');
  for (const [check, nom, muter] of MUTATIONS_AVERTISSEMENT) {
    const m = muter(h);
    if (m === h) { casse.push(`AVERTISSEMENT « ${nom} » : la mutation n'a rien changé (fixture à revoir)`); continue; }
    const r = jugerForme(m);
    if (!r.avertissements.some((w) => w.check === check)) casse.push(`AVERTISSEMENT « ${nom} » non levé (${check} attendu)`);
    else rouges++;
  }
  fs.rmSync(dir, { recursive: true, force: true });
  const total = MUTATIONS.length + MUTATIONS_AVERTISSEMENT.length + 1;
  if (casse.length) { console.log('SELF-TEST FAIL : ' + casse.join(' · ')); return 1; }
  console.log(`Self-test verifier-forme-rapport : ${total}/${total} PASS — rendu réel de la fixture riche conforme ; ${rouges} mutations rouges refusées (ou avertissement levé) chacune pour SA règle (${[...new Set([...MUTATIONS, ...MUTATIONS_AVERTISSEMENT].map((x) => x[0]))].join(', ')})`);
  return 0;
}

function principal(argv) {
  if (argv[0] === '--self-test') return selfTest();
  const file = argv[0];
  if (!file || file.startsWith('-')) { console.error('Usage: node tools/verifier-forme-rapport.mjs <rapport.html> | --self-test'); return 2; }
  let html;
  try { html = fs.readFileSync(file, 'utf8'); } catch (e) { console.error(`Lecture impossible : ${e.message}`); return 2; }
  const r = jugerForme(html);
  for (const w of r.avertissements) console.error(`AVERTISSEMENT [${w.check}] ${w.msg}`);
  if (r.erreurs.length) {
    for (const e of r.erreurs) console.error(`ERREUR [${e.check}] ${e.msg}`);
    console.error(`\n✖ forme POC-to-Prod NON conforme (${r.erreurs.length} anomalie(s)) — ${path.basename(file)}`);
    return 1;
  }
  console.log(`✔ forme POC-to-Prod conforme — ${r.controles} contrôles (F0–F18)${r.avertissements.length ? `, ${r.avertissements.length} avertissement(s)` : ''} — ${path.basename(file)}`);
  return 0;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) process.exit(principal(process.argv.slice(2)));
