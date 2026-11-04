// TF-2106 — un kit de deliverables/generated/ ne doit pas embarquer une version PÉRIMÉE des outils
// qu'il emporte. Les kits portent `fiche-en-pdf.mjs`, `verifier-remediation.mjs`, les oracles de
// `oracles/` (dont `verifier-fiche-securite.mjs`), l'init d'espace d'audit autonome, les schémas : des
// COPIES. TF-2086 à TF-2089 (03/11/2026) ont corrigé les sources ; les kits déjà fabriqués ont continué
// à porter l'ancienne copie, et aucun contrôle ne comparait la copie à sa source.
//
// Trois preuves, dans l'ordre :
//  1. le comparateur à DOUBLE SENS, sur un vrai kit fabriqué à l'instant : le kit frais est conforme
//     (vert) ; une copie périmée, un oracle manquant, une copie obsolète et un autonome altéré sont
//     chacun nommés (rouge) ;
//  2. le GÉNÉRATEUR est fidèle : chaque copie « verbatim » d'un kit frais est identique à sa source ;
//  3. l'ÉTAT RÉEL : le dernier kit de chaque (tenant, sorte) de deliverables/generated/ est comparé à un kit
//     fabriqué à l'instant. Rouge ⇒ régénérer par `node tools/build-kit.mjs <tenant.yaml> --kind both`.
//     Sans aucun kit sur le poste (runner neuf, dossier ignoré par git), ce contrôle se déclare SKIP
//     motivé : il ne dit pas « vert ».
//
// Seules les entrées que le kit COPIE d'un outil ou d'un oracle sont jugées (liste EMBARQUE) : le reste
// (LISEZMOI daté, contraintes fusionnées, thème…) n'est pas une source embarquée. Les fins de ligne sont
// normalisées (CRLF → LF) : un poste Windows lit les sources en CRLF, le comparateur juge le contenu.
//
// `AUDITCORE_KITS_DIR` remplace deliverables/generated/ pour la preuve 3 (mesurer un lot de kits à part).
//
// Lancer : node --test tests/oracles/kits-embarques-a-jour.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BUILD_KIT = path.join(RACINE, 'tools', 'build-kit.mjs');
const TENANT_EXEMPLE = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');
const KITS = process.env.AUDITCORE_KITS_DIR || path.join(RACINE, 'deliverables', 'generated');

/** Les entrées qu'un kit COPIE d'un outil, d'un oracle ou d'un schéma (ou en génère un autonome). */
const EMBARQUE = [
  /^fiche-en-pdf\.mjs$/, /^verifier-remediation\.mjs$/, /^oracles\/[^/]+$/, /^[^/]+-standalone\.mjs$/,
  /^schemas\/[^/]+$/, /^dimensions\.yaml$/, /^fiche-securite\.template\.md$/,
];
const estEmbarque = (nom) => EMBARQUE.some((re) => re.test(nom));

/** Le dépôt d'où chaque copie « verbatim » est tirée par build-kit.mjs (nom d'entrée → fichier source). */
function sourcesVerbatim() {
  const m = new Map([
    ['fiche-en-pdf.mjs', path.join(RACINE, 'tools', 'fiche-en-pdf.mjs')],
    ['verifier-remediation.mjs', path.join(RACINE, 'tools', 'verifier-remediation.mjs')],
    ['dimensions.yaml', path.join(RACINE, 'core', 'dimensions', 'dimensions.yaml')],
    ['fiche-securite.template.md', path.join(RACINE, 'deliverables', 'templates', 'fiche-securite.template.md')],
  ]);
  for (const f of fs.readdirSync(path.join(RACINE, 'oracles')))
    if (f.endsWith('.mjs') || f.endsWith('.md')) m.set(`oracles/${f}`, path.join(RACINE, 'oracles', f));
  for (const f of fs.readdirSync(path.join(RACINE, 'core', 'schemas')))
    if (f === 'control.schema.json' || f === 'remediation-actions.schema.json') m.set(`schemas/${f}`, path.join(RACINE, 'core', 'schemas', f));
  return m;
}

// Lecteur ZIP minimal (format de tools/ziplib.mjs : en-têtes locaux séquentiels). Le dossier racine du
// kit est retiré du nom : « ACME - Kit Audit - 20261104a/oracles/x.mjs » → « oracles/x.mjs ».
function lireZip(buf) {
  const out = [];
  let o = 0;
  while (o + 4 <= buf.length && buf.readUInt32LE(o) === 0x04034b50) {
    const method = buf.readUInt16LE(o + 8);
    const compSize = buf.readUInt32LE(o + 18);
    const nameLen = buf.readUInt16LE(o + 26);
    const extraLen = buf.readUInt16LE(o + 28);
    const name = buf.toString('utf8', o + 30, o + 30 + nameLen);
    const dataStart = o + 30 + nameLen + extraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    out.push({ name: name.split('/').slice(1).join('/'), data: method === 8 ? inflateRawSync(raw) : Buffer.from(raw) });
    o = dataStart + compSize;
  }
  return out;
}

const texte = (b) => b.toString('utf8').replace(/\r\n/g, '\n');

/**
 * Les écarts entre un kit et les références « fraîches » (même sorte, fabriquées à l'instant), limités
 * aux entrées embarquées. Une liste de références, et non une seule : deux tenants peuvent porter le même
 * nom (l'exemple et la fixture minimale de la CI s'appellent tous deux « ACME » et écrivent dans le même
 * dossier), et les autonomes générés dépendent du tenant. Une copie est à jour si elle égale celle d'AU
 * MOINS UNE référence, périmée si elle n'en égale aucune. Chaque écart nomme l'entrée et sa nature.
 */
function ecartsDuKit(entrees, fraisListe) {
  const ecarts = [];
  const duKit = new Map(entrees.filter((e) => estEmbarque(e.name)).map((e) => [e.name, e.data]));
  const duFrais = new Map();
  for (const frais of fraisListe)
    for (const e of frais.filter((x) => estEmbarque(x.name))) duFrais.set(e.name, [...(duFrais.get(e.name) ?? []), e.data]);
  for (const [nom, versions] of duFrais) {
    if (!duKit.has(nom)) ecarts.push(`${nom} : absent du kit (la source le livre)`);
    else if (!versions.some((v) => texte(duKit.get(nom)) === texte(v))) ecarts.push(`${nom} : copie périmée (diffère de la source)`);
  }
  for (const nom of duKit.keys()) if (!duFrais.has(nom)) ecarts.push(`${nom} : copie obsolète (la source ne le livre plus)`);
  return ecarts.sort();
}

/** Fabrique un kit (tenant, sorte) dans un dossier jetable et rend ses entrées. */
function fabriquer(tenantYaml, sorte) {
  const sortie = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-frais-'));
  try {
    const r = spawnSync(process.execPath, [BUILD_KIT, tenantYaml, '--kind', sorte, '--out', sortie], { encoding: 'utf8', cwd: RACINE, timeout: 120000 });
    assert.equal(r.status, 0, `fabrication du kit ${sorte} rouge : ${r.stdout}${r.stderr}`);
    const zip = fs.readdirSync(sortie).find((f) => f.endsWith('.zip'));
    assert.ok(zip, `aucun kit ${sorte} fabriqué`);
    return lireZip(fs.readFileSync(path.join(sortie, zip)));
  } finally { fs.rmSync(sortie, { recursive: true, force: true }); }
}

const memo = new Map();
const frais = (tenantYaml, sorte) => {
  const cle = `${tenantYaml}|${sorte}`;
  if (!memo.has(cle)) memo.set(cle, fabriquer(tenantYaml, sorte));
  return memo.get(cle);
};
const copie = (entrees) => entrees.map((e) => ({ name: e.name, data: Buffer.from(e.data) }));

test('TF-2106 — fixture VERTE : un kit fabriqué à l\'instant ne diffère d\'aucune source embarquée', () => {
  for (const sorte of ['audit', 'compliance']) {
    const kit = frais(TENANT_EXEMPLE, sorte);
    assert.ok(kit.filter((e) => estEmbarque(e.name)).length >= 5, `kit ${sorte} : trop peu d'entrées embarquées jugées`);
    assert.deepEqual(ecartsDuKit(copie(kit), [kit]), []);
  }
});

test('TF-2106 — fixture ROUGE : une copie périmée de fiche-en-pdf.mjs et de l\'init autonome est nommée', () => {
  const kit = frais(TENANT_EXEMPLE, 'audit');
  const perime = copie(kit);
  const touche = (nom, f) => { const e = perime.find((x) => x.name === nom); assert.ok(e, `${nom} absent du kit frais`); e.data = Buffer.from(f(texte(e.data))); };
  touche('fiche-en-pdf.mjs', (t) => t.replace(/\n/, '\n// ancienne version avant TF-2088\n'));
  touche('init-audit-workspace-standalone.mjs', (t) => t.replace(/if \(arg !== undefined && arg\.startsWith\('-'\)\) \{[\s\S]*?\n\}\n/, ''));
  assert.deepEqual(ecartsDuKit(perime, [kit]), [
    'fiche-en-pdf.mjs : copie périmée (diffère de la source)',
    'init-audit-workspace-standalone.mjs : copie périmée (diffère de la source)',
  ]);
});

test('TF-2106 — fixture ROUGE : un oracle absent du kit, et une copie dont la source a disparu, sont nommés', () => {
  const kit = frais(TENANT_EXEMPLE, 'compliance');
  const oracle = kit.find((e) => e.name === 'oracles/verifier-fiche-securite.mjs');
  assert.ok(oracle, 'le kit Compliance Pack ne porte pas oracles/verifier-fiche-securite.mjs');
  const vieux = copie(kit).filter((e) => e.name !== oracle.name);
  vieux.push({ name: 'oracles/ancien-oracle-supprime.mjs', data: Buffer.from('// retiré\n') });
  assert.deepEqual(ecartsDuKit(vieux, [kit]), [
    'oracles/ancien-oracle-supprime.mjs : copie obsolète (la source ne le livre plus)',
    'oracles/verifier-fiche-securite.mjs : absent du kit (la source le livre)',
  ]);
});

test('TF-2106 — fixture VERTE : seules les fins de ligne et les entrées non embarquées (LISEZMOI, thème) diffèrent sans écart', () => {
  const kit = frais(TENANT_EXEMPLE, 'audit');
  const autre = copie(kit).map((e) => {
    if (e.name === 'fiche-en-pdf.mjs') return { ...e, data: Buffer.from(texte(e.data).replace(/\n/g, '\r\n')) };
    if (e.name.startsWith('LISEZMOI') || e.name.startsWith('theme/')) return { ...e, data: Buffer.from('autre contenu') };
    return e;
  });
  assert.deepEqual(ecartsDuKit(autre, [kit]), []);
});

test('TF-2106 — le générateur est fidèle : chaque copie verbatim d\'un kit frais est identique à sa source', () => {
  const sources = sourcesVerbatim();
  for (const sorte of ['audit', 'compliance']) {
    const kit = frais(TENANT_EXEMPLE, sorte);
    const copies = kit.filter((e) => sources.has(e.name));
    assert.ok(copies.length >= 4, `kit ${sorte} : seulement ${copies.length} copie(s) verbatim reconnue(s)`);
    for (const e of copies)
      assert.equal(texte(e.data), texte(fs.readFileSync(sources.get(e.name))), `kit ${sorte} : ${e.name} diffère de ${path.relative(RACINE, sources.get(e.name))}`);
    // Les oracles livrés sont TOUS ceux de oracles/ : un oracle ajouté à la source doit partir dans le kit.
    for (const nom of sources.keys())
      if (nom.startsWith('oracles/')) assert.ok(kit.some((e) => e.name === nom), `kit ${sorte} : ${nom} existe dans oracles/ et n'est pas livré`);
  }
});

/** Le dernier kit de chaque (dossier de tenant, sorte) sous `racineKits`, par ordre alphabétique du nom daté. */
function derniersKits(racineKits) {
  const out = [];
  if (!fs.existsSync(racineKits)) return out;
  for (const d of fs.readdirSync(racineKits, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    const parSorte = new Map();
    for (const f of fs.readdirSync(path.join(racineKits, d.name)).sort()) {
      const m = /^(.+) - Kit (Audit|Compliance Pack) - (\d{8}[a-z])\.zip$/.exec(f);
      if (m) parSorte.set(m[2], { tenant: m[1], sorte: m[2] === 'Audit' ? 'audit' : 'compliance', fichier: path.join(racineKits, d.name, f), nom: f });
    }
    out.push(...parSorte.values());
  }
  return out;
}

/**
 * Les tenant.yaml que la CI fabrique en kit et dont `tenant.name` est `nom` : `config/tenants/*` et les
 * fixtures `tests/fixtures/tenant-valid-*.yaml` (étape « Kits marque-blanche » du workflow).
 */
async function tenantsNommes(nom) {
  const { loadYaml } = await import(`file:///${path.join(RACINE, 'tools', 'lib.mjs').replace(/\\/g, '/')}`);
  const candidats = [];
  const dossier = path.join(RACINE, 'config', 'tenants');
  for (const d of fs.readdirSync(dossier)) candidats.push(path.join(dossier, d, 'tenant.yaml'));
  const fixtures = path.join(RACINE, 'tests', 'fixtures');
  for (const f of fs.readdirSync(fixtures)) if (/^tenant-valid-.*\.yaml$/.test(f)) candidats.push(path.join(fixtures, f));
  return candidats.filter((f) => fs.existsSync(f) && loadYaml(f)?.tenant?.name === nom);
}

test('TF-2106 — état réel : le dernier kit de deliverables/generated/ embarque les outils et oracles À JOUR', async (t) => {
  const kits = derniersKits(KITS);
  if (!kits.length) {
    t.skip(`SKIP motivé : aucun kit sous ${path.relative(RACINE, KITS) || KITS} (dossier ignoré par git, vide sur un runner neuf) — l'état réel n'est pas mesuré ici`);
    return;
  }
  const ecarts = [];
  const nonJuges = [];
  for (const k of kits) {
    const tenants = await tenantsNommes(k.tenant);
    if (!tenants.length) { nonJuges.push(`${k.nom} (aucun tenant « ${k.tenant} » sous config/tenants/ ni tests/fixtures/)`); continue; }
    for (const e of ecartsDuKit(lireZip(fs.readFileSync(k.fichier)), tenants.map((y) => frais(y, k.sorte)))) ecarts.push(`${k.nom} → ${e}`);
  }
  if (nonJuges.length) t.diagnostic(`non jugés : ${nonJuges.join(' ; ')}`);
  assert.deepEqual(ecarts, [],
    `${ecarts.length} écart(s) entre le dernier kit de chaque tenant et les sources embarquées :\n  ${ecarts.join('\n  ')}\n`
    + 'Régénérer : node tools/build-kit.mjs config/tenants/exemple/tenant.yaml --kind both (puis relancer ce test).');
});
