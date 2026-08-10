#!/usr/bin/env node
// =============================================================================
// maj-versions.mjs (v2 — recos PILOTÉES PAR DRIVER, pas par distance de version)
//
// « Version actuelle » VÉRIFIÉE (dernière STABLE des registres officiels ; jamais
// une pré-version). Une reco d'ACTION (reco_flag="Oui") n'est émise QUE s'il existe
// un DRIVER : sécurité (OSV) > EOL (endoflife.date) > déprécié/yanked > incompat >
// correctif (retard patch/minor dans le majeur courant). Un nouveau MAJEUR sans
// driver → `veille_majeur` (informationnel, pas d'action). Écart couvert par la
// plage (résolu = latest-in-range) → `couvert_plage` (au plus refresh lockfile).
// Driver non déterminable → marqué tel quel, jamais inventé.
//
//   node maj-versions.mjs [dossier-projet] [--out versions-actuelles.json]
// Node ≥ 18 (fetch natif). Exit 0 (rapport d'inventaire).
// =============================================================================
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

/* ---------------- sémantique de version ---------------- */
const isPrerelease = v => /-(?:rc|beta|alpha|next|canary|dev|pre|snapshot)\b|-\d|[abc]\d+$/i.test(String(v || ''));
const parts = v => { const m = String(v).replace(/^[^\d]*/, '').match(/\d+(?:\.\d+)*/); const p = (m ? m[0] : '').split('.').map(n => parseInt(n, 10) || 0); return [p[0] || 0, p[1] || 0, p[2] || 0]; };
const cmpVer = (a, b) => { const x = parts(a), y = parts(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };
const cleanUsed = u => String(u).replace(/[\^~>=<!\s*]/g, '').replace(/,.*$/, '').replace(/\.x.*$/i, '');
function ecartKind(from, to) {
  if (!to) return 'inconnu';
  const a = parts(cleanUsed(from)), b = parts(to);
  if (a[0] === b[0] && a[1] === b[1] && a[2] === b[2]) return 'none';
  if (b[0] > a[0]) return 'major';
  if (b[1] > a[1]) return 'minor';
  if (b[2] > a[2]) return 'patch';
  return 'none';
}
function pickStable(versions) {
  const st = (versions || []).filter(v => v && !isPrerelease(v));
  if (!st.length) return null;
  st.sort(cmpVer); return st[st.length - 1];
}

/* ---------------- classification (grille §1, ordre de priorité) ---------------- */
// Source HORS-REGISTRE (défaut B) : pour ces specs le « latest » npm n'est PAS la vérité.
// Retourne un libellé (hôte URL / schéma), ou null pour une spec de registre classique (plage/version).
function nonRegistrySource(spec) {
  const s = String(spec || '').trim();
  const um = s.match(/^https?:\/\/([^/]+)/i);
  if (um) return um[1];                                   // URL → hôte (ex. cdn.sheetjs.com)
  if (/\.tgz(?:[?#]|$)/i.test(s)) return 'tarball';
  const sc = s.match(/^(git\+[a-z]+|git|github|file|link|workspace|patch):/i);
  return sc ? sc[1].toLowerCase() : null;
}
// Successeur nommé dans un message de dépréciation npm (défaut A) — sinon null.
function successorFromDeprecation(msg) {
  if (!msg || typeof msg !== 'string') return null;
  const m = msg.match(/(?:superseded by|use|replaced by|moved to|migrate to|see)\s+["'`]?(@?[a-z0-9._/-]+)["'`]?/i);
  return m ? m[1].replace(/[.,)]+$/, '') : null;
}
function classer(c, d) {
  const target = c.version_actuelle;
  const mk = (statut, driver, reco_flag, priorite, reco, veille = false) => ({ statut, driver, reco_flag, priorite: priorite || '', reco: reco || '', veille });
  if (d.vulns && d.vulns.length) return mk('reco_securite', 'sécurité : ' + d.vulns.slice(0, 4).join(', '), 'Oui', 'urgent', 'Vulnérabilité sur la version utilisée — monter vers ' + target + ' (' + d.vulns.slice(0, 4).join(', ') + ')');
  if (d.eol === true) return mk('reco_eol', 'majeur EOL / non maintenu', 'Oui', 'prio', 'Majeur utilisé en fin de vie — migrer vers un majeur supporté (cible stable ' + target + ')');
  if (d.deprecated) { // défaut A : porter le successeur, masquer la flèche x→x
    const succ = successorFromDeprecation(typeof d.deprecated === 'string' ? d.deprecated : null);
    const r = mk('reco_deprecie', 'paquet/version déprécié·e ou yanked', 'Oui', 'prio',
      succ ? ('Paquet déprécié — remplacer par ' + succ + ' (cf. message npm)')
           : 'Paquet déprécié, aucun successeur nommé — chercher une alternative maintenue ou retirer');
    r.remplacant = succ; r.no_version_target = true; return r;
  }
  if (d.incompat) return mk('reco_incompat', 'conflit de peer / incompatibilité', 'Oui', 'prio', 'Incompatibilité de dépendances à résoudre (' + (d.incompat_detail || '') + ')');
  const horsReg = nonRegistrySource(c.version_utilisee); // défaut B : ne pas comparer au latest npm
  if (horsReg) { const r = mk('hors_registre', 'source hors-registre (' + horsReg + ')', '—', '', 'Source hors-registre (' + horsReg + ') — fraîcheur à suivre chez l\'éditeur ; le "latest" npm n\'est pas comparable'); r.source_hors_registre = horsReg; return r; }
  if (!target) return mk('non_verifie', 'registre inaccessible', '—', '', '');
  if (isPrerelease(target)) return mk('ignore_prerelease', 'dernière disponible = pré-version', '—', '', '');
  const resolved = c.version_resolue || cleanUsed(c.version_utilisee);
  // Garde ANTI-DOWNGRADE (défaut B) : une cible strictement INFÉRIEURE à l'installé = incohérence de source ;
  // ne JAMAIS émettre reco_flag=Oui / reco_correctif vers une version plus basse — journaliser l'anomalie.
  if (resolved && /^\d/.test(String(cleanUsed(resolved))) && cmpVer(target, resolved) < 0) {
    const r = mk('veille', 'cible registre < installé — incohérence de source', '—', 'planif',
      'Anomalie : « latest » registre (' + target + ') INFÉRIEUR à l\'installé (' + resolved + ') — registre périmé / fork / pré-version. Ne pas rétrograder ; suivre la fraîcheur à la source.', true);
    r.anti_downgrade = true; return r;
  }
  if (ecartKind(resolved, target) === 'none') {
    const borneDiff = /[\^~><]/.test(String(c.version_utilisee)) && cleanUsed(c.version_utilisee) !== target;
    return borneDiff
      ? mk('couvert_plage', 'résolu = dernière stable ; borne déclarée en retard', '—', '', 'Rafraîchir le lockfile (déjà à jour à l\'exécution)')
      : mk('a_jour', 'à jour', '—', '', '');
  }
  if (ecartKind(resolved, target) === 'major') return mk('veille_majeur', 'nouveau majeur, aucun driver', '—', 'planif', 'Veille : majeur ' + target + ' disponible — planifier un lot (majeur courant supporté)', true);
  return mk('reco_correctif', 'retard patch/minor dans le majeur courant', 'Oui', 'norm', 'Bump d\'entretien ' + cleanUsed(c.version_utilisee) + ' → ' + target);
}

/* ---------------- réseau (réessai borné avant échec — défaut 6) ---------------- */
const sleep = ms => new Promise(r => setTimeout(r, ms));
async function fetchRetry(url, opts = {}, tries = 2) {
  for (let i = 0; i < tries; i++) {
    try { const r = await fetch(url, { ...opts, signal: AbortSignal.timeout(opts.timeoutMs || 15000) }); if (r.ok || (r.status >= 400 && r.status < 500)) return r; } catch {}
    if (i < tries - 1) await sleep(400);
  }
  return null; // échec réseau (après réessai) — distinct d'un 404
}
// Hooks de TEST (uniquement pour la CI de non-régression — jamais actifs en usage normal) :
//   MAJVER_TEST_FORCE_REGISTRY_FAIL → registres PyPI/npm simulés injoignables
//   MAJVER_TEST_FORCE_EOL_FAIL      → endoflife.date simulé injoignable
//   MAJVER_TEST_FORCE_SEC_FAIL      → tous les barreaux d'audit sécurité en échec
const T_REGISTRY_FAIL = () => !!process.env.MAJVER_TEST_FORCE_REGISTRY_FAIL;
const T_EOL_FAIL = () => !!process.env.MAJVER_TEST_FORCE_EOL_FAIL;
const T_SEC_FAIL = () => !!process.env.MAJVER_TEST_FORCE_SEC_FAIL;
async function pypiInfo(pkg) {
  if (T_REGISTRY_FAIL()) return null; // test : registre injoignable
  const r = await fetchRetry('https://pypi.org/pypi/' + encodeURIComponent(pkg) + '/json');
  if (!r || !r.ok) return null;
  try { const j = await r.json(); const rels = j.releases || {}; const stable = pickStable(Object.keys(rels).filter(v => !(rels[v] && rels[v].every && rels[v].every(f => f.yanked)))); return { latest: stable, yanked: v => !!(rels[v] && rels[v].length && rels[v].every(f => f.yanked)) }; } catch { return null; }
}
async function npmInfo(pkg) {
  if (T_REGISTRY_FAIL()) return null; // test : registre injoignable
  const r = await fetchRetry('https://registry.npmjs.org/' + pkg.replace('/', '%2f'));
  if (!r || !r.ok) return null;
  try { const j = await r.json(); return { latest: pickStable(Object.keys(j.versions || {})), deprecated: v => (j.versions && j.versions[v] && j.versions[v].deprecated) || null }; } catch { return null; } // deprecated = MESSAGE (nomme souvent le successeur), pas un booléen — défaut A
}
async function osvBatch(queries) {
  const r = await fetchRetry('https://api.osv.dev/v1/querybatch', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ queries: queries.map(q => ({ package: { ecosystem: q.ecosystem, name: q.name }, version: q.version })) }), timeoutMs: 20000 });
  if (!r || !r.ok) return null;
  try { return (await r.json()).results.map(x => (x.vulns || []).map(v => v.id)); } catch { return null; }
}
// CONTRAT PARTAGÉ producteur (maj-versions) ↔ checker (verifier-rapport-audit, check 10) :
// statuts pour lesquels « version_actuelle » N'EST PAS une version de registre résolue — le validateur
// ne doit ni exiger de version ni avertir dessus (sinon les deux fichiers redivergent). Cf. prompt check10-vs-statuts.
//   hors_registre → n/a (source hors-registre) ; reco_deprecie → n/a (remplacement) + remplacant ;
//   non_verifie   → « non vérifié (registre inaccessible) ».
const STATUTS_VERSION_NA = new Set(['hors_registre', 'reco_deprecie', 'non_verifie']);
// Périmètre par barreau (défaut 3) : l'audit natif couvre les transitives ; OSV, seulement les directes.
const COVERS = { 'corepack yarn audit': { d: true, t: true }, 'yarn audit': { d: true, t: true }, 'npm audit': { d: true, t: true }, 'npx yarn audit': { d: true, t: true }, 'OSV (arbre résolu)': { d: true, t: false }, 'pip-audit': { d: true, t: true }, 'python -m pip_audit': { d: true, t: true }, 'OSV (versions résolues)': { d: true, t: false } };
const _eolCache = {};
// État TERNAIRE (défaut 4) : { state: true|false|null, reason: 'eol'|'not-eol'|'not-listed'|'unreachable' }.
// « unreachable » (réseau KO) ≠ « not-listed » (produit non répertorié) ≠ « not-eol » — jamais confondus.
async function eolMajor(product, usedMajor, refNow) {
  if (T_EOL_FAIL()) return { state: null, reason: 'unreachable' }; // test : endoflife.date injoignable
  if (!(product in _eolCache)) {
    const r = await fetchRetry('https://endoflife.date/api/' + encodeURIComponent(product) + '.json', { timeoutMs: 12000 });
    _eolCache[product] = (r === null) ? undefined : (r.ok ? await r.json().catch(() => null) : null);
  }
  const cycles = _eolCache[product];
  if (cycles === undefined) return { state: null, reason: 'unreachable' };
  if (!cycles) return { state: null, reason: 'not-listed' };
  const cy = cycles.find(c => String(c.cycle) === String(usedMajor) || String(c.cycle).startsWith(usedMajor + '.'));
  if (!cy) return { state: null, reason: 'not-listed' };
  if (cy.eol === true) return { state: true, reason: 'eol' };
  if (typeof cy.eol === 'string') return { state: (new Date(cy.eol).getTime() < refNow), reason: 'eol' };
  return { state: false, reason: 'not-eol' };
}

/* ---------------- parseurs de manifestes + lockfiles ---------------- */
function parseRequirements(text) {
  return String(text).split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith('#') && !l.startsWith('-') && !/^https?:/.test(l) && !/[/\\]/.test(l.split(/[=<>~!]/)[0]))
    .map(l => { const m = l.match(/^([A-Za-z0-9._-]+)\s*(?:\[[^\]]*\])?\s*([=<>~!].*)?$/); if (!m) return null; const pin = (m[2] || '').match(/==\s*([\d.]+)/); return { name: m[1].toLowerCase(), used: m[2] || '', resolved: pin ? pin[1] : null }; }).filter(Boolean);
}
function parsePackageJson(obj) { const out = []; ['dependencies', 'devDependencies', 'optionalDependencies'].forEach(k => Object.entries((obj && obj[k]) || {}).forEach(([name, r]) => out.push({ name, used: String(r), resolved: null }))); return out; }
/* ---------------- résolution EXACTE (lockfile satisfaisant la plage déclarée) ---------------- */
function yarnBlocks(text) {
  const blocks = []; let cur = null;
  for (const line of String(text).split(/\r?\n/)) {
    if (/^\S/.test(line) && line.trim().endsWith(':')) { if (cur) blocks.push(cur); cur = { header: line.trim().replace(/:$/, ''), version: null }; }
    else if (cur && cur.version == null) { const mv = line.match(/^\s+version:?\s+"?([\d][\w.\-+]*)"?/); if (mv) cur.version = mv[1]; }
  }
  if (cur) blocks.push(cur);
  return blocks;
}
// Bloc yarn.lock dont l'en-tête contient EXACTEMENT `name@<plage déclarée>` (pas « premier bloc du même nom »).
function yarnResolvedFor(text, name, declaredRange) {
  const want = name + '@' + String(declaredRange || '').trim();
  for (const b of yarnBlocks(text)) {
    const specs = b.header.split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    if (specs.includes(want)) return b.version;
  }
  return null;
}
function npmLockTop(dir) {
  const map = {};
  for (const f of ['package-lock.json', 'npm-shrinkwrap.json']) {
    const p = path.join(dir, f); if (!fs.existsSync(p)) continue;
    try {
      const j = JSON.parse(fs.readFileSync(p, 'utf8'));
      Object.keys(j.packages || {}).forEach(k => { const m = k.match(/^node_modules\/((?:@[^/]+\/)?[^/]+)$/); if (m && j.packages[k].version) map[m[1]] = j.packages[k].version; });
      Object.entries(j.dependencies || {}).forEach(([n, v]) => { if (v.version && !(n in map)) map[n] = v.version; });
    } catch {}
  }
  return map;
}
function nmVersion(dir, name) { try { return JSON.parse(fs.readFileSync(path.join(dir, 'node_modules', name, 'package.json'), 'utf8')).version || null; } catch { return null; } }
function resolveNpm(dir, name, declaredRange, yl, lockTop) {
  return (yl ? yarnResolvedFor(yl, name, declaredRange) : null) || lockTop[name] || nmVersion(dir, name) || null;
}
/* ---------------- exécution de commandes (helper UNIQUE — défauts 1,2,5) ---------------- */
// shell sur Windows (évite EINVAL sur .cmd — CVE-2024-27980) + maxBuffer 100 Mo (évite ENOBUFS
// sur gros audits) + sémantique code retour : status≠0 n'est PAS un échec (yarn/npm/pip-audit
// sortent en ≠0 quand ils TROUVENT des vulns). ok:false ⇒ barreau échoué (→ tentative suivante).
function runCmd(dir, cmd, args, { timeout = 120000 } = {}) {
  const win = process.platform === 'win32';
  const bin = win && /^(yarn|npx|corepack|npm|pip-audit)$/.test(cmd) ? cmd + '.cmd' : cmd;
  const opts = { cwd: dir, encoding: 'utf8', timeout, maxBuffer: 1e8 };
  let r;
  if (win) { // chaîne unique via shell (résout .cmd, évite EINVAL) sans passer d'args au shell (évite DEP0190)
    const line = [bin, ...args.map(a => /[\s"^&|<>]/.test(a) ? '"' + String(a).replace(/"/g, '\\"') + '"' : a)].join(' ');
    r = spawnSync(line, { ...opts, shell: true });
  } else { r = spawnSync(bin, args, opts); }
  if (r.error) return { ok: false, reason: r.error.code };
  return { ok: true, stdout: r.stdout || '', status: r.status };
}
// invocabilité RÉELLE (pas seulement présence sur le PATH — défaut 5)
// Invocabilité RÉELLE (défaut 5) : sous shell Windows une commande absente sort en status≠0 sans r.error
// (ok:true trompeur) — exiger status===0 pour ne pas confondre « présent sur le PATH » et « invocable ».
function canRun(cmd, args = ['--version']) { const r = runCmd(process.cwd(), cmd, args, { timeout: 15000 }); return r.ok && r.status === 0; }
function toolVersion(cmd, args = ['--version']) { const r = runCmd(process.cwd(), cmd, args, { timeout: 15000 }); return (r.ok && r.status === 0) ? ((r.stdout || '').trim().split(/\r?\n/)[0] || 'présent') : null; }

/* ---------------- échelle de résolution (resolution ladder) ---------------- */
// « non vérifié » = DERNIER recours, après épuisement d'une échelle ordonnée + trace des tentatives.
// Ne descendre au barreau suivant qu'après échec du précédent ; un barreau ne « réussit » que s'il
// produit une vraie mesure (map, éventuellement vide = « scanné, 0 »). null = échec du barreau.
async function runWithLadder(steps) {
  const tried = [];
  for (const s of steps) {
    let r = null; try { r = await s.run(); } catch { r = null; }
    if (r !== null) return { ok: true, value: r, via: s.label, tried };
    tried.push(s.label);
  }
  return { ok: false, value: null, via: 'non vérifié', tried };
}
function parseYarnAudit(stdout) {
  if (!stdout || !/"type":"audit/.test(stdout)) return null;      // sortie yarn audit valide (advisory|summary)
  const out = {};
  stdout.split(/\r?\n/).forEach(l => { if (!l.trim()) return; try { const o = JSON.parse(l); if (o.type === 'auditAdvisory') { const a = o.data.advisory, p = (o.data.resolution && o.data.resolution.path) || ''; out[a.module_name] = { severity: a.severity, ids: [a.github_advisory_id, a.cve].filter(Boolean).slice(0, 3), transitive: String(p).split('>').length > 1 }; } } catch {} });
  return out;                                                     // {} = scanné, 0 vuln (succès)
}
function parseNpmAudit(stdout) { try { const j = JSON.parse(stdout || ''); if (!j.vulnerabilities) return null; const out = {}; Object.entries(j.vulnerabilities).forEach(([n, v]) => { out[n] = { severity: v.severity, ids: (v.via || []).filter(x => typeof x === 'object').map(x => x.source || x.url || x.title).slice(0, 3), transitive: v.isDirect === false }; }); return out; } catch { return null; } }
function parsePipAudit(stdout) { try { const j = JSON.parse(stdout || ''); const out = {}; (j.dependencies || j || []).forEach(d => { if ((d.vulns || []).length) out[(d.name || '').toLowerCase()] = { severity: 'high', ids: d.vulns.map(v => v.id).slice(0, 3), transitive: false }; }); return out; } catch { return null; } }
async function osvMapFor(list) {
  const q = list.filter(c => c.resolved && /^\d/.test(c.resolved));
  if (!q.length) return {};
  const res = await osvBatch(q.map(c => ({ ecosystem: c.eco === 'npm' ? 'npm' : 'PyPI', name: c.name, version: c.resolved })));
  if (res === null) return null;                                  // OSV injoignable → barreau échoué
  const out = {}; q.forEach((c, i) => { if ((res[i] || []).length) out[c.name] = { severity: '?', ids: res[i], transitive: false }; });
  return out;
}
function npmSecuritySteps(dir, list) {
  const yr = (cmd, args) => () => { if (T_SEC_FAIL()) return null; const r = runCmd(dir, cmd, args); return r.ok ? parseYarnAudit(r.stdout) : null; };
  const nr = (cmd, args) => () => { if (T_SEC_FAIL()) return null; const r = runCmd(dir, cmd, args); return r.ok ? parseNpmAudit(r.stdout) : null; };
  return [
    { label: 'corepack yarn audit', run: yr('corepack', ['yarn', 'audit', '--json']) },
    { label: 'yarn audit', run: yr('yarn', ['audit', '--json']) },
    { label: 'npm audit', run: nr('npm', ['audit', '--json']) },
    { label: 'npx yarn audit', run: yr('npx', ['--yes', 'yarn', 'audit', '--json']) },
    { label: 'OSV (arbre résolu)', run: () => T_SEC_FAIL() ? null : osvMapFor(list) }
  ];
}
function pySecuritySteps(dir, reqFile, list) {
  const py = canRun('python') ? 'python' : (canRun('python3') ? 'python3' : 'python'); // invocabilité réelle
  return [
    { label: 'pip-audit', run: () => { if (T_SEC_FAIL()) return null; const r = runCmd(dir, 'pip-audit', ['-r', reqFile, '-f', 'json']); return r.ok ? parsePipAudit(r.stdout) : null; } },
    { label: 'python -m pip_audit', run: () => { if (T_SEC_FAIL()) return null; const r = runCmd(dir, py, ['-m', 'pip_audit', '-r', reqFile, '-f', 'json']); return r.ok ? parsePipAudit(r.stdout) : null; } },
    { label: 'OSV (versions résolues)', run: () => T_SEC_FAIL() ? null : osvMapFor(list) }
  ];
}

/* ---------------- scan projet ---------------- */
async function main() {
  const args = process.argv.slice(2);
  const dir = args.find(a => !a.startsWith('--')) || '.';
  const out = (args.includes('--out') ? args[args.indexOf('--out') + 1] : null) || path.join(dir, 'versions-actuelles.json');
  const read = f => { try { return fs.readFileSync(f, 'utf8'); } catch { return null; } };
  const files = fs.existsSync(dir) ? fs.readdirSync(dir) : [];
  const comps = [];
  const refNow = Date.now(); // date de référence EOL (provenance — défaut 7)

  const reqFile = files.find(f => /^requirements.*\.txt$/i.test(f));
  for (const f of files.filter(f => /^requirements.*\.txt$/i.test(f))) parseRequirements(read(path.join(dir, f)) || '').forEach(p => comps.push({ eco: 'PyPI', ...p }));
  const pkg = read(path.join(dir, 'package.json'));
  const npmDirect = new Set();
  if (pkg) { try { const yl = read(path.join(dir, 'yarn.lock')); const lockTop = npmLockTop(dir); parsePackageJson(JSON.parse(pkg)).forEach(p => { npmDirect.add(p.name); comps.push({ eco: 'npm', name: p.name, used: p.used, resolved: resolveNpm(dir, p.name, p.used, yl, lockTop) }); }); } catch {} }

  // DRIVER SÉCURITÉ — ÉCHELLE DE RÉSOLUTION (corepack yarn → yarn → npm → npx yarn → OSV ;
  // pip-audit → python -m pip_audit → OSV). Couvre l'arbre complet (direct + transitif) via l'audit
  // natif ; « non vérifié » seulement après épuisement, avec la trace des tentatives.
  const npmComps = comps.filter(c => c.eco === 'npm'), pyComps = comps.filter(c => c.eco === 'PyPI');
  const secLad = {
    npm: pkg ? await runWithLadder(npmSecuritySteps(dir, npmComps)) : null,
    PyPI: reqFile ? await runWithLadder(pySecuritySteps(dir, path.join(dir, reqFile), pyComps)) : null
  };
  const secInfo = {};
  for (const eco of ['npm', 'PyPI']) {
    const s = secLad[eco];
    if (!s) { secInfo[eco] = { applicable: false }; continue; }
    const cov = s.ok ? (COVERS[s.via] || { d: true, t: false }) : { d: false, t: false };
    secInfo[eco] = { via: s.ok ? s.via : 'non vérifié', tentatives: s.tried, directes_couvertes: cov.d, transitif_couvert: cov.t,
      note: s.ok ? (cov.t ? '' : 'sécurité transitive : NON couverte par ce barreau (OSV = directes uniquement)') : ('sécurité NON VÉRIFIÉE — tentatives : [' + s.tried.join(', ') + ']') };
  }
  for (const c of comps) { const s = secLad[c.eco]; c._vulns = (s && s.ok) ? ((s.value[c.name] || {}).ids || []) : null; } // null = sécurité non déterminée
  // transitives vulnérables (audit natif, hors dépendances directes) → ajoutées à l'inventaire
  const npmMap = secLad.npm && secLad.npm.ok ? secLad.npm.value : null;
  if (npmMap) Object.entries(npmMap).forEach(([n, info]) => { if (!npmDirect.has(n)) comps.push({ eco: 'npm', name: n, used: '(transitive)', resolved: nmVersion(dir, n), _vulns: info.ids, _transitive: true }); });

  const infoCache = {};
  const result = {}; let recos = 0, veilles = 0, pre = 0, nonres = 0, transit = 0, eolNV = 0;
  for (const c of comps) {
    const key = c.eco + ':' + c.name;
    if (!(key in infoCache)) infoCache[key] = c.eco === 'PyPI' ? await pypiInfo(c.name) : await npmInfo(c.name);
    const info = infoCache[key];
    c.version_actuelle = info ? info.latest : null;
    c.version_resolue = c.resolved || (c._transitive ? null : cleanUsed(c.used)) || null;
    c.deprecated = info && c.version_resolue ? (c.eco === 'npm' ? info.deprecated(c.version_resolue) : info.yanked(c.version_resolue)) : false;
    const usedMajor = String(parts(c.version_resolue || c.used)[0]);
    const eolRes = (c.version_actuelle && !c._transitive) ? await eolMajor(c.name, usedMajor, refNow) : { state: null, reason: 'n/a' };
    c.version_utilisee = c.used; c.ecart = ecartKind(c.version_resolue || c.used, c.version_actuelle);
    const cls = classer(c, { vulns: c._vulns, eol: eolRes.state, deprecated: c.deprecated, incompat: false });
    // Masquer la « cible » de version trompeuse (défauts A & B) : ni flèche x→x pour un déprécié,
    // ni « latest » npm pour une source hors-registre — l'action n'est pas « monter » mais « remplacer / suivre à la source ».
    if (cls.no_version_target || cls.statut === 'hors_registre') { c.version_actuelle = cls.statut === 'hors_registre' ? 'n/a (source hors-registre)' : 'n/a (remplacement)'; c.ecart = 'n/a'; }
    else if (!c.version_actuelle) { if (!(c._vulns && c._vulns.length)) { cls.statut = 'non_verifie'; cls.reco_flag = '—'; nonres++; } c.version_actuelle = 'non vérifié (registre inaccessible)'; }
    // EOL indéterminé par ÉCHEC RÉSEAU (≠ non listé) : ne pas laisser lire « à jour/veille » comme un EOL vérifié (défaut 4).
    const eol_verifie = !(eolRes.reason === 'unreachable');
    if (!eol_verifie && ['a_jour', 'veille_majeur', 'couvert_plage'].includes(cls.statut)) { cls.driver += ' · EOL non vérifié (endoflife injoignable)'; eolNV++; }
    if (cls.reco_flag === 'Oui') recos++; if (cls.veille) veilles++; if (cls.statut === 'ignore_prerelease') pre++; if (c._transitive) transit++;
    const sec = secInfo[c.eco] || {};
    result[key] = { ecosysteme: c.eco, nom: c.name, version_utilisee: c.version_utilisee || '(non épinglée)', version_resolue: c.version_resolue || '(inconnue)', version_actuelle: c.version_actuelle, ecart: c.ecart, statut: cls.statut, driver: cls.driver, reco_flag: cls.reco_flag, veille: !!cls.veille, priorite: cls.priorite, reco: cls.reco, perimetre: c._transitive ? '(transitive)' : undefined, eol_verifie, securite_transitif_couvert: sec.transitif_couvert !== false ? (sec.transitif_couvert || false) : false, remplacant: cls.remplacant, source_hors_registre: cls.source_hors_registre, anti_downgrade: cls.anti_downgrade };
  }
  // Provenance (défaut 7) : environnement + outils détectés + date de référence EOL — indispensable pour interpréter un « transitives:0 » ou un verdict EOL.
  const env = { os: process.platform, node: process.version, eol_reference_date: new Date(refNow).toISOString().slice(0, 10), outils: { corepack: toolVersion('corepack'), yarn: toolVersion('yarn'), npm: toolVersion('npm'), 'pip-audit': toolVersion('pip-audit'), python: toolVersion(canRun('python') ? 'python' : 'python3') } };
  const transitifNonCouvert = ['npm', 'PyPI'].filter(e => secInfo[e] && secInfo[e].applicable !== false && !secInfo[e].transitif_couvert);
  // Sécurité NON VÉRIFIÉE (échelle épuisée) : le « transitives_vuln » chiffré n'a alors AUCUN sens de
  // « propre » — on le rend explicite (invariant 3 issues : jamais un 0 nu présenté comme conforme).
  const securiteNonVerifiee = ['npm', 'PyPI'].filter(e => secInfo[e] && secInfo[e].via === 'non vérifié');
  const transitivesVulnOut = securiteNonVerifiee.length && transit === 0 ? 'non vérifié' : transit;
  fs.writeFileSync(out, JSON.stringify({ schema: 'auditcore.versions/v5', env, source_securite: secInfo, resume: { total: comps.length, actionnables: recos, veille_majeur: veilles, transitives_vuln: transitivesVulnOut, transitif_non_couvert: transitifNonCouvert, securite_non_verifiee: securiteNonVerifiee, eol_non_verifies: eolNV, prerelease_ignorees: pre, non_verifies: nonres }, composants: result }, null, 2), 'utf8');
  console.log('versions-actuelles écrites : ' + out + '  (env : ' + env.os + ', node ' + env.node + ', EOL@' + env.eol_reference_date + ')');
  for (const eco of ['npm', 'PyPI']) { const s = secInfo[eco]; if (s && s.applicable !== false) console.log('Sécurité ' + eco + ' — via ' + (s.via || '?') + (s.note ? ' — ' + s.note : '') + (s.tentatives && s.tentatives.length && s.via !== s.tentatives[0] ? ' (tentatives : ' + s.tentatives.join(', ') + ')' : '')); }
  if (transitifNonCouvert.length) console.log('⚠ Sécurité TRANSITIVE non couverte pour : ' + transitifNonCouvert.join(', ') + ' (aucun audit natif n\'a tourné — installer corepack/yarn/npm).');
  console.log('Total ' + comps.length + ' · actionnables ' + recos + ' · veille ' + veilles + ' · transitives vuln ' + transitivesVulnOut + ' · EOL non vérifiés ' + eolNV + ' · pré-versions ' + pre + ' · non vérifiés ' + nonres);
}

const isMain = process.argv[1] && /maj-versions\.mjs$/.test(process.argv[1].replace(/\\/g, '/'));
if (isMain) main();

export { isPrerelease, parts, cmpVer, cleanUsed, ecartKind, pickStable, classer, parseRequirements, parsePackageJson, yarnBlocks, yarnResolvedFor, runWithLadder, runCmd, canRun, toolVersion, eolMajor, COVERS, nonRegistrySource, successorFromDeprecation, STATUTS_VERSION_NA };
