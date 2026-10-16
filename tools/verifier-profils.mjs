#!/usr/bin/env node
/**
 * verifier-profils.mjs — juge les profils technologiques (`profiles/<clé>/bindings.json`).
 *
 * LE FAIT QUI A PRODUIT CET OUTIL (16/10/2026, ajout du profil `supabase`) : cinq profils
 * existaient, chargés par `tools/build-banc.mjs` dès qu'un tenant les déclare dans `profiles[]`,
 * et AUCUN contrôle ne jugeait leur contenu. Un binding pointant un contrôle core disparu, un
 * `evidence` vide ou un profil absent de l'index du README passaient sans bruit : le banc de
 * preuves perdait l'instanciation sans le dire.
 *
 * Ce qu'il juge, profil par profil (tout dossier de `profiles/` qui porte un `bindings.json`) :
 *   P1 `profile` = nom du dossier (c'est la clé que le tenant écrit dans `profiles[]`) ;
 *   P2 `version` SemVer ;
 *   P3 `bindings` non vide ;
 *   P4 chaque binding porte `control`, `instanciation`, `verification_command`, `evidence` non vides ;
 *   P5 `control` existe au pack core (`core/controls/controls-core-v1.json`), `manual[]` compris ;
 *   P6 un contrôle n'est lié qu'une fois (build-banc ne garde que le premier) ;
 *   P7 `README.md` présent ;
 *   P8 si le profil déclare `sources[]` (id, url https, lu_le AAAA-MM-JJ), chaque binding en cite
 *      au moins une, et seulement des ids déclarés ;
 *   P9 (mode dépôt) le profil est nommé dans l'arborescence `profiles/` du README racine ;
 *   P10 (mode dépôt) le profil est APPELÉ : build-banc, lancé sur un tenant qui ne déclare que lui,
 *      rend autant d'instanciations que le profil a de bindings.
 *
 * Ce qu'il ne juge pas : la justesse technique d'une commande de vérification, ni la fidélité
 * d'un binding à sa source (lecture humaine).
 *
 * Usage : node tools/verifier-profils.mjs [<dossier-profils>] [--self-test]
 * Exit : 0 = PASS · 1 = FAIL (au moins un écart) · 2 = usage ou entrée illisible.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, rel, loadJson } from './lib.mjs';

const CHAMPS = ['control', 'instanciation', 'verification_command', 'evidence'];
const SEMVER = /^\d+\.\d+\.\d+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function controlesCore() {
  return new Set(loadJson(rel('core', 'controls', 'controls-core-v1.json')).constraints.map(c => c.id));
}

/** Juge un dossier de profils ; `depot` active P9/P10 (index du README et appel par build-banc). */
export function verifierProfils(racine, { depot = false } = {}) {
  const core = controlesCore();
  const findings = [];
  const f = (profil, code, message) => findings.push({ profil, code, message });
  const profils = [];
  for (const nom of fs.readdirSync(racine).sort()) {
    const dir = path.join(racine, nom);
    if (!fs.statSync(dir).isDirectory() || !fs.existsSync(path.join(dir, 'bindings.json'))) continue;
    let b;
    try { b = JSON.parse(fs.readFileSync(path.join(dir, 'bindings.json'), 'utf-8')); }
    catch (e) { f(nom, 'P0', `bindings.json illisible : ${e.message}`); continue; }
    profils.push({ nom, b });
    if (b.profile !== nom) f(nom, 'P1', `profile « ${b.profile} » ≠ dossier « ${nom} »`);
    if (!SEMVER.test(String(b.version ?? ''))) f(nom, 'P2', `version « ${b.version} » non SemVer`);
    const liste = Array.isArray(b.bindings) ? b.bindings : [];
    if (!liste.length) f(nom, 'P3', 'bindings vide ou absent');
    const vus = new Set();
    const sources = Array.isArray(b.sources) ? b.sources : null;
    const ids = new Set();
    if (sources) for (const s of sources) {
      if (!s?.id || !/^https:\/\//.test(s.url ?? '') || !DATE.test(s.lu_le ?? '')) f(nom, 'P8', `source mal formée : ${JSON.stringify(s)}`);
      else ids.add(s.id);
    }
    liste.forEach((x, i) => {
      const ou = `bindings[${i}]${x?.control ? ` (${x.control})` : ''}`;
      for (const c of CHAMPS) if (typeof x?.[c] !== 'string' || !x[c].trim()) f(nom, 'P4', `${ou} : champ « ${c} » vide ou absent`);
      if (x?.control && !core.has(x.control)) f(nom, 'P5', `${ou} : contrôle inconnu du core`);
      if (x?.control && vus.has(x.control)) f(nom, 'P6', `${ou} : contrôle déjà lié plus haut`);
      if (x?.control) vus.add(x.control);
      if (sources) {
        const cites = Array.isArray(x?.sources) ? x.sources : [];
        if (!cites.length) f(nom, 'P8', `${ou} : aucune source citée alors que le profil en déclare`);
        for (const s of cites) if (!ids.has(s)) f(nom, 'P8', `${ou} : source « ${s} » non déclarée`);
      }
    });
    for (const m of b.manual ?? []) if (!core.has(m.control)) f(nom, 'P5', `manual (${m.control}) : contrôle inconnu du core`);
    if (!fs.existsSync(path.join(dir, 'README.md'))) f(nom, 'P7', 'README.md absent');
  }
  if (depot) {
    const readme = fs.readFileSync(rel('README.md'), 'utf-8').split(/\r?\n/);
    const i0 = readme.findIndex(l => /profiles\/\s+#/.test(l));
    const bloc = i0 < 0 ? '' : readme.slice(i0, i0 + 4).join(' ');
    for (const { nom, b } of profils) {
      if (!new RegExp(`(?<![\\w-])${nom.replace(/[-]/g, '\\-')}(?![\\w-])`).test(bloc)) f(nom, 'P9', 'profil absent de l\'arborescence profiles/ du README racine');
      const attendu = (b.bindings ?? []).filter(x => core.has(x.control)).length;
      const obtenu = instanciationsParBuildBanc(nom);
      if (obtenu !== attendu) f(nom, 'P10', `build-banc rend ${obtenu} instanciation(s) pour un tenant qui ne déclare que « ${nom} », ${attendu} attendue(s)`);
    }
  }
  return { profils: profils.map(p => p.nom), findings };
}

/** Lance le vrai chargeur (build-banc) sur un tenant jetable qui ne déclare que ce profil. */
function instanciationsParBuildBanc(nom) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'profil-'));
  try {
    const tenant = path.join(tmp, 'tenant.yaml');
    fs.writeFileSync(tenant, [
      'schema_version: 1', 'core_version: "1.0.x"', 'tenant: { name: "Fictif", short_code: "FI", language: fr }',
      'constraint_packs: [ "core/controls/controls-core-v1.json" ]', `profiles: [ ${nom} ]`, '',
    ].join('\n'));
    const r = spawnSync(process.execPath, [rel('tools', 'build-banc.mjs'), tenant, '--out', path.join(tmp, 'banc.md')], { cwd: ROOT, encoding: 'utf-8' });
    const m = /(\d+) instanciations profils/.exec(r.stdout ?? '');
    return m ? Number(m[1]) : -1;
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

function rendre({ profils, findings }, titre) {
  console.log(`${titre} : ${profils.length} profil(s) jugé(s) — ${profils.join(', ')}`);
  for (const x of findings) console.log(`  ✖ [${x.code}] ${x.profil} — ${x.message}`);
  console.log(findings.length ? `FAIL : ${findings.length} écart(s)` : 'PASS : 0 écart');
}

function selfTest() {
  const base = rel('tests', 'fixtures', 'profils');
  const vert = verifierProfils(path.join(base, 'vert'));
  const rouge = verifierProfils(path.join(base, 'rouge'));
  const codes = new Set(rouge.findings.map(x => x.code));
  const attendus = ['P1', 'P4', 'P5', 'P6', 'P7', 'P8'];
  const manquants = attendus.filter(c => !codes.has(c));
  rendre(vert, 'fixture verte');
  rendre(rouge, 'fixture rouge');
  const ok = vert.findings.length === 0 && vert.profils.length > 0 && manquants.length === 0;
  console.log(ok ? `self-test PASS : verte sans écart, rouge détectée sur ${attendus.join(', ')}`
    : `self-test FAIL : verte ${vert.findings.length} écart(s) ; codes rouges non détectés : ${manquants.join(', ') || 'aucun'}`);
  return ok ? 0 : 1;
}

if (process.argv[1]?.endsWith('verifier-profils.mjs')) {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) process.exit(selfTest());
  const cible = args.find(a => !a.startsWith('--'));
  const racine = cible ? path.resolve(cible) : rel('profiles');
  if (!fs.existsSync(racine)) { console.error(`dossier introuvable : ${racine}`); process.exit(2); }
  const res = verifierProfils(racine, { depot: !cible });
  rendre(res, 'profils');
  process.exit(res.findings.length ? 1 : 0);
}
