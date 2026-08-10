#!/usr/bin/env node
// AuditCore — moteur de fusion des packs de contraintes (précédence core > profil > overlay)
// + dérivation du bucket via enforcement.binding_authorities (dé-hardcode l'ex-autorité en dur)
// + TEST D'ISO-COMPORTEMENT (P4.4) contre le constraints.json historique d'un tenant de référence.
//
// Usage:
//   node tools/merge-packs.mjs <tenant.yaml> [--out merged.json] [--allow-missing]
//   node tools/merge-packs.mjs --derive-pack --baseline <constraints.json> --pack <out.json> [--authority N]
//   node tools/merge-packs.mjs --iso-test    --baseline <constraints.json> --pack <pack.json> --tenant <tenant.yaml>
//
// RAF-030 : le produit ne connaît AUCUN tenant réel — les modes --derive-pack et --iso-test
// exigent leurs chemins en flags et se jouent dans le dépôt de l'engagement ; la CI produit
// couvre la même logique via le golden-test synthétique (tests/test-golden-buckets.mjs).
import fs from 'node:fs';
import path from 'node:path';
import Ajv from 'ajv';
import { ROOT, rel, loadTenant, loadJson, saveJson, deriveBucket } from './lib.mjs';

const argv = process.argv.slice(2);
const flag = (name, def) => { const i = argv.indexOf(name); return i > -1 ? argv[i + 1] : def; };
const BASELINE = flag('--baseline', null);
const PACK_OUT = flag('--pack', null);
const AUTHORITY = flag('--authority', 'Tenant');
const TENANT_DEF = flag('--tenant', null);
const requireFlags = (mode, pairs) => {
  const missing = pairs.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length) {
    console.error(`${mode}: flag(s) requis manquant(s): ${missing.join(', ')} — ce mode se joue dans le dépôt du tenant (le produit utilise le golden-test synthétique)`);
    process.exit(2);
  }
};

function derivePack() {
  requireFlags('--derive-pack', [['--baseline', BASELINE], ['--pack', PACK_OUT]]);
  if (!fs.existsSync(BASELINE))
    throw new Error(`baseline introuvable: ${BASELINE} — fournir --baseline <constraints.json> (ce test appartient au dépôt du tenant)`);
  const hist = loadJson(BASELINE);
  const constraints = hist.constraints.map(c => {
    const { bucket, ...rest } = c;
    // bucket historique → autorité d'origine ; le moteur RE-dérive le bucket depuis la config.
    return { ...rest, authority: bucket === 'opposable' ? AUTHORITY : 'Generique' };
  });
  const pack = {
    pack: path.basename(PACK_OUT, '.json'), layer: 'overlay', authority_default: AUTHORITY,
    pack_version: hist.pack_version, generated_from: hist.generated_from,
    hash_source: hist.hash_source, legend: hist.legend, constraints,
  };
  saveJson(PACK_OUT, pack);
  console.log(`✔ pack dérivé: ${constraints.length} contraintes (bucket retiré → authority=${AUTHORITY}) → ${path.relative(ROOT, PACK_OUT)}`);
  return pack;
}

function mergePacks(tenantYaml, { allowMissing = false } = {}) {
  const { cfg, resolveRef } = loadTenant(tenantYaml);
  const binding = cfg.enforcement?.binding_authorities ?? [];
  const merged = new Map();
  const order = []; // provenance
  for (const packRef of cfg.constraint_packs ?? []) {
    let p = resolveRef(packRef);
    // RAF-012 : tenant anglophone → substitution automatique du pack core traduit s'il existe
    if (cfg.tenant?.language === 'en' && p.endsWith('controls-core-v1.json')) {
      const pEn = p.replace(/\.json$/, '.en.json');
      if (fs.existsSync(pEn)) p = pEn;
    }
    if (!fs.existsSync(p)) {
      if (allowMissing) { console.log(`AVERTISSEMENT: pack absent ignoré: ${packRef}`); continue; }
      throw new Error(`pack introuvable: ${packRef} (utiliser --allow-missing pendant la construction)`);
    }
    const pack = loadJson(p);
    const juris = cfg.jurisdictions; // absent → rétro-compatibilité : aucun filtrage
    for (const c0 of pack.constraints ?? []) {
      let c = { ...c0, bucket: deriveBucket(c0, binding) };
      // RAF-011 : contrôle borné à une juridiction non active → sans_objet motivé (jamais supprimé)
      if (juris && c.jurisdiction && !juris.includes(c.jurisdiction))
        c = { ...c, applicabilite_defaut: 'sans_objet',
              applicabilite_motif: `juridiction « ${c.jurisdiction} » non active pour ce tenant (actives : ${juris.join(', ') || 'aucune'})` };
      if (merged.has(c.id)) throw new Error(`id dupliqué à la fusion: ${c.id}`);
      merged.set(c.id, c); order.push(c.id);
    }
  }
  const constraints = order.map(id => merged.get(id));
  const counts = {
    total: constraints.length,
    opposable: constraints.filter(c => c.bucket === 'opposable').length,
    informatif: constraints.filter(c => c.bucket === 'informatif').length,
    blocking: constraints.filter(c => c.enforcement === 'blocking').length,
    advisory: constraints.filter(c => c.enforcement === 'advisory').length,
  };
  // ECR-07 · provenance du pack : reportée telle quelle depuis le tenant, jamais inférée.
  return { tenant: cfg.tenant.name, core_version: cfg.core_version,
    ...(cfg.build_provenance ? { build_provenance: cfg.build_provenance } : {}), counts, constraints };
}

function isoTest() {
  requireFlags('--iso-test', [['--baseline', BASELINE], ['--pack', PACK_OUT], ['--tenant', TENANT_DEF]]);
  if (!fs.existsSync(BASELINE))
    throw new Error(`baseline introuvable: ${BASELINE} — l'iso-test se joue dans le dépôt du tenant (fournir --baseline/--pack/--tenant), le produit utilise le golden-test synthétique`);
  if (!fs.existsSync(PACK_OUT)) derivePack();
  const tenantYaml = TENANT_DEF;
  const merged = mergePacks(tenantYaml, { allowMissing: true });
  const hist = loadJson(BASELINE);
  const histBy = new Map(hist.constraints.map(c => [c.id, c]));
  const FIELDS = ['bucket', 'enforcement', 'criticite', 'domaine'];
  let okCount = 0; const diffs = [];
  for (const c of merged.constraints.filter(x => /^C-/.test(x.id))) {
    const h = histBy.get(c.id);
    if (!h) { diffs.push(`${c.id}: absent de l'historique`); continue; }
    const delta = FIELDS.filter(f => JSON.stringify(c[f]) !== JSON.stringify(h[f]));
    if (delta.length) diffs.push(`${c.id}: divergence sur ${delta.join(', ')}`);
    else okCount++;
  }
  const missing = [...histBy.keys()].filter(id => !merged.constraints.some(c => c.id === id));
  console.log(`\n── TEST ISO-COMPORTEMENT (P4.4) ──`);
  console.log(`historique: ${histBy.size} contraintes · fusion: ${merged.constraints.length} · identiques (bucket+enforcement+criticite+domaine): ${okCount}/${histBy.size}`);
  if (missing.length) console.log(`manquantes: ${missing.join(', ')}`);
  for (const d of diffs.slice(0, 10)) console.log(`  ✖ ${d}`);
  if (okCount === histBy.size && !missing.length) { console.log(`✔ ISO-COMPORTEMENT PROUVÉ ${okCount}/${histBy.size} — la dérivation binding_authorities reproduit exactement les buckets historiques`); return true; }
  process.exitCode = 1; return false;
}

const FLAGS_WITH_VALUE = ['--baseline', '--pack', '--authority', '--tenant', '--out'];
if (argv.includes('--derive-pack')) derivePack();
else if (argv.includes('--iso-test')) isoTest();
else {
  const tenantYaml = argv.find((a, i) => !a.startsWith('--') && !FLAGS_WITH_VALUE.includes(argv[i - 1]));
  if (!tenantYaml) { console.error('Usage: node tools/merge-packs.mjs <tenant.yaml> [--out f] | --derive-pack --baseline f --pack f [--authority N] | --iso-test --baseline f --pack f --tenant f'); process.exit(2); }
  const out = argv.includes('--out') ? argv[argv.indexOf('--out') + 1] : rel('config', 'merged.json');
  const merged = mergePacks(tenantYaml, { allowMissing: argv.includes('--allow-missing') });
  // validation de chaque contrainte contre le schéma control (les C- historiques sont tolérés via pattern)
  const ajv = new Ajv({ allErrors: true, strict: false });
  const validate = ajv.compile(loadJson(rel('core', 'schemas', 'control.schema.json')));
  let invalid = 0;
  for (const c of merged.constraints) if (!validate(c)) invalid++;
  saveJson(out, merged);
  console.log(`✔ fusion: ${merged.counts.total} contraintes (${merged.counts.opposable} opposables / ${merged.counts.informatif} informatives) → ${out}${invalid ? ` — AVERTISSEMENT: ${invalid} non conformes au schéma control (héritage historique sans standards[])` : ''}`);
}
