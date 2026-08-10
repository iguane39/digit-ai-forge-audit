#!/usr/bin/env node
// =============================================================================
// AuditCore — verifier-remediation.mjs (ECR-04) : plan de remédiation & PORTE DE CLÔTURE.
//
// Le rapport d'audit est AUTO-PORTEUR de sa remédiation : ce script en extrait le plan
// exhaustif SANS export manuel, en exécutant la logique du rapport sans navigateur. Il
// accepte indifféremment les DEUX formes émises par build-rapport :
//   • le rapport HTML          → bloc machine embarqué (le projet n'a que ce fichier) ;
//   • remediation-actions.yaml → contrat de la forge (validé par JSON Schema).
//
// Usage :
//   node tools/verifier-remediation.mjs <rapport.html|actions.yaml>
//       → extrait le plan, écrit "<base>.remediation-plan.json", affiche le résumé.
//   node tools/verifier-remediation.mjs <source> --init [suivi.json]
//       → gabarit de suivi { "REM-…": { done:false, preuve:"" } } + provenance du LLM.
//   node tools/verifier-remediation.mjs <source> --status <suivi.json>
//       → PORTE DE CLÔTURE : exit 0 seulement si chaque action est faite AVEC preuve.
//
// Règle de cycle : avant de (re)demander un audit, le projet obtient exit 0. Ce n'est
// JAMAIS une dispense de contrôle — la feuille blanche reste la règle côté audit ; la
// clôture est la garantie côté projet.
//
// Exit 0 = prêt · 1 = non prêt (actions ouvertes, sans preuve, ou plan incomplet) · 2 = usage.
// =============================================================================
// js-yaml n'est chargé QUE si la source est un YAML : sur la voie HTML ce script reste
// autoportant (zéro dépendance) et part tel quel dans le kit remis au projet.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';

const fail = (m) => { console.error('ERREUR : ' + m); process.exit(2); };

const args = process.argv.slice(2);
const src = args.find(a => !a.startsWith('--'));
if (!src) fail("indiquer un rapport HTML ou un remediation-actions.yaml. Voir l'en-tête pour l'usage.");
if (!fs.existsSync(src)) fail('fichier introuvable : ' + src);
const iInit = args.indexOf('--init');
const doInit = iInit >= 0;
const initArg = (doInit && args[iInit + 1] && !args[iInit + 1].startsWith('--') && args[iInit + 1] !== src) ? args[iInit + 1] : null;
const iStatus = args.indexOf('--status');
const statusFile = iStatus >= 0 ? args[iStatus + 1] : null;
if (iStatus >= 0 && !statusFile) fail('--status attend un chemin de fichier de suivi.');

// ── Extraction du plan ───────────────────────────────────────────────────────
let plan = [];
let meta = {};

if (/\.ya?ml$/i.test(src)) {
  // Forme YAML : contrat de la forge. On projette vers la forme de suivi.
  let yaml;
  try { yaml = await import('js-yaml'); }
  catch { fail("lecture d'un YAML : js-yaml requis (indisponible hors du dépôt produit) — passer le rapport HTML, qui est auto-porteur."); }
  const doc = yaml.load(fs.readFileSync(src, 'utf-8')) ?? {};
  meta = { projet: doc.project?.repo ?? null, date: null, core_version: doc.core_version ?? null };
  plan = (doc.actions ?? []).map(a => ({
    id: a.id, action: a.title, priorite: a.priority,
    verification: a.verification?.evidence_expected ?? '',
  }));
} else {
  // Forme HTML : on EXÉCUTE la logique du rapport (jamais de parsing à la main du plan —
  // le plan contrôlé est exactement celui que le rapport affiche, il ne peut pas diverger).
  const h = fs.readFileSync(src, 'utf-8');
  const jsonBlocks = Object.fromEntries([...h.matchAll(
    /<script\b[^>]*type\s*=\s*["']application\/json["'][^>]*id\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi,
  )].map(m => [m[1], m[2]]));
  const code = [...h.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
    .filter(m => !/\bsrc=/i.test(m[1]) && !/type\s*=\s*["']application\/json["']/i.test(m[1]))
    .map(m => m[2]).join('\n;\n');
  if (!code.trim()) fail('aucun moteur exploitable dans le rapport.');

  const el = () => ({
    hidden: false, style: {}, textContent: '', value: '',
    classList: { add() {}, remove() {}, contains: () => false },
    querySelectorAll: () => [], appendChild(c) { return c; }, addEventListener() {},
  });
  const nodes = {};
  const sandbox = {
    console: { log() {}, warn() {}, error() {}, info() {} },
    document: {
      getElementById: (id) => (nodes[id] ??= (id in jsonBlocks ? { ...el(), textContent: jsonBlocks[id] } : el())),
      querySelectorAll: () => [], querySelector: () => null,
      addEventListener() {}, createElement: el, body: el(),
    },
    window: { addEventListener() {} }, JSON, Math, Date,
  };
  sandbox.globalThis = sandbox;
  try { vm.createContext(sandbox); vm.runInContext(code, sandbox, { filename: path.basename(src) }); }
  catch (e) { fail('exécution de la logique du rapport impossible : ' + e.message); }

  if (typeof sandbox.buildRemediationPlan !== 'function')
    fail('ce rapport ne porte pas de plan de remédiation (buildRemediationPlan absent) — régénérer avec un moteur AuditCore à jour.');
  plan = sandbox.buildRemediationPlan();
  meta = typeof sandbox.remMeta === 'function' ? sandbox.remMeta() : {};
}

// Une action dont le libellé ou le critère de clôture est encore en placeholder signale un
// rapport INCOMPLET : on ne clôture pas un plan qui n'a jamais été rédigé.
const incompletes = plan.filter(a => /\{\{[\s\S]*?\}\}/.test(`${a.action ?? ''} ${a.verification ?? ''}`));
const ligne = (a) => `  - ${a.id} [${a.priorite ?? '—'}] ${String(a.action ?? '').replace(/\s+/g, ' ').slice(0, 78)}`;

// ── Mode --init ──────────────────────────────────────────────────────────────
if (doInit) {
  const out = initArg || src.replace(/\.(html?|ya?ml)$/i, '') + '.remediation-status.template.json';
  const tpl = {
    source: path.basename(src),
    projet: meta.projet ?? null,
    // ECR-07 · quel LLM a RÉALISÉ la remédiation (distinct du moteur d'audit du rapport).
    execute_par_llm: { role: 'LLM ayant réalisé la remédiation', modele: '', modele_id: '', editeur: '', date: '' },
    suivi: Object.fromEntries(plan.map(a => [a.id, {
      action: a.action, priorite: a.priorite ?? '—', done: false, preuve: '',
    }])),
  };
  fs.writeFileSync(out, JSON.stringify(tpl, null, 2), 'utf-8');
  console.log(`Gabarit de suivi écrit : ${out}  (${plan.length} actions à traiter)`);
  console.log('→ Renseigner done:true + preuve pour chaque action, puis lancer --status.');
  process.exit(0);
}

// ── Mode --status : LA PORTE ─────────────────────────────────────────────────
if (statusFile) {
  if (!fs.existsSync(statusFile)) fail('fichier de suivi introuvable : ' + statusFile);
  let st;
  try { st = JSON.parse(fs.readFileSync(statusFile, 'utf-8')); }
  catch (e) { fail('suivi JSON illisible : ' + e.message); }
  const suivi = st.suivi ?? st;

  const ouvertes = plan.filter(a => suivi[a.id]?.done !== true);
  const sansPreuve = plan.filter(a => suivi[a.id]?.done === true && !String(suivi[a.id]?.preuve ?? '').trim());
  const inconnues = Object.keys(suivi).filter(id => !plan.some(a => a.id === id));

  console.log('=== Contrôle de clôture de la remédiation ===');
  console.log(`Source : ${path.basename(src)}${meta.projet ? '  · projet : ' + meta.projet : ''}`);
  const llm = st.execute_par_llm;
  if (llm && (llm.modele || llm.modele_id)) console.log(`Remédiation réalisée par (LLM) : ${llm.modele || llm.modele_id}${llm.date ? ' · ' + llm.date : ''}`);
  else console.log('⚠ Provenance LLM de la remédiation non renseignée (execute_par_llm vide).');
  console.log(`Actions au plan : ${plan.length} · à faire : ${ouvertes.length} · sans preuve : ${sansPreuve.length} · en placeholder : ${incompletes.length}`);

  if (incompletes.length) { console.log('\nRAPPORT INCOMPLET — actions non rédigées :'); incompletes.forEach(a => console.log(ligne(a))); }
  if (ouvertes.length) { console.log('\nNON CLÔTURÉES (done ≠ true) :'); ouvertes.forEach(a => console.log(ligne(a))); }
  if (sansPreuve.length) { console.log('\nCLÔTURÉES SANS PREUVE :'); sansPreuve.forEach(a => console.log(ligne(a))); }
  if (inconnues.length) console.log('\nIDs de suivi inconnus (ignorés) : ' + inconnues.join(', '));

  const bloquants = incompletes.length + ouvertes.length + sansPreuve.length;
  if (bloquants) {
    console.log(`\n❌ NON PRÊT — ${bloquants} point(s) à traiter avant de redemander un audit.`);
    process.exit(1);
  }
  console.log('\n✓ PRÊT — toutes les actions du plan sont clôturées avec preuve.');
  process.exit(0);
}

// ── Mode par défaut : extraction ─────────────────────────────────────────────
const out = src.replace(/\.(html?|ya?ml)$/i, '') + '.remediation-plan.json';
fs.writeFileSync(out, JSON.stringify({ schema: 'auditcore.remediation-plan/v1', meta, actions: plan }, null, 2), 'utf-8');
console.log('=== Plan de remédiation (auto-porté par le rapport) ===');
console.log(`Source : ${path.basename(src)}${meta.projet ? '  · projet : ' + meta.projet : ''}${meta.verdict_gate1b ? '  · gate : ' + meta.verdict_gate1b : ''}`);
console.log(`Actions : ${plan.length}${incompletes.length ? `  (dont ${incompletes.length} en placeholder — rapport à compléter)` : ''}`);
const parPrio = {};
plan.forEach(a => { parPrio[a.priorite ?? '—'] = (parPrio[a.priorite ?? '—'] ?? 0) + 1; });
console.log('Par priorité : ' + Object.entries(parPrio).map(([p, n]) => `${p}=${n}`).join(' · '));
console.log('\n' + plan.map(ligne).join('\n'));
console.log(`\nJSON exhaustif écrit : ${out}`);
console.log('→ Gabarit de suivi : --init   |   Porte de clôture : --status <suivi.json>');
process.exit(incompletes.length ? 1 : 0);
