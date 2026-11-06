// TF-2231 (D-178 (a), pièce 7) — les profils contrôlent les réglages de plateforme du registre des réglages sûrs par défaut
// du pilot, et l'écart accepté d'un réglage classé « décision » s'écrit : pas d'écart nu.
//
// Le fait : l'étude du 06/11/2026 mesure 7 écarts sur 30 qui se reproduisent à chaque produit ; l'audit relisait le TLS
// imposé, la protection à la poussée, Dependabot, la branche protégée et HSTS, mais ni Always Use HTTPS ni la MFA des
// membres de l'organisation, et un réglage que le porteur avait choisi de ne pas poser ressortait comme un écart sans histoire.
//
// La recette porte une COPIE du registre (tests/fixtures/reglages-sures-par-defaut.json) : ce dépôt public se clone seul,
// le fichier du pilot n'existe pas sur un runner. Preuves, à double sens :
//   · profils du dépôt + registre de fixture : PASS ; les mêmes profils SANS leurs revendications (état d'avant) : 9 écarts ;
//   · la clause de l'écart accepté retirée d'un binding classé décision : RG3 ; le remède (la remettre) : PASS ;
//   · un audit qui lit un réglage décision non conforme sans écart accepté : écart nu (RG5) ; le remède joué : PASS ;
//   · un réglage défaut non conforme ne s'accepte pas (RG6) ;
//   · sans registre : « non jugé » (0) pour les profils, 2 pour les écarts (jamais un faux PASS).
//
// Lancer : node --test tests/oracles/reglages-plateforme.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLES_REGISTRE, jugerCouverture, jugerEcarts, jugerRegistre, porteClauseEcartAccepte } from '../../tools/verifier-reglages-plateforme.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUTIL = path.join(RACINE, 'tools', 'verifier-reglages-plateforme.mjs');
const REGISTRE = path.join(RACINE, 'tests', 'fixtures', 'reglages-sures-par-defaut.json');
const node = (args, env = {}) => spawnSync(process.execPath, [OUTIL, ...args], { encoding: 'utf8', timeout: 120000, env: { ...process.env, ...env } });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'reglages-'));
const registre = JSON.parse(fs.readFileSync(REGISTRE, 'utf8'));
const profilsReels = () => Object.fromEntries(['cloudflare', 'github', 'supabase'].map((n) => [n, JSON.parse(fs.readFileSync(path.join(RACINE, 'profiles', n, 'bindings.json'), 'utf8'))]));
const ecrire = (nom, o) => { const f = path.join(tmp, nom); fs.writeFileSync(f, JSON.stringify(o), 'utf8'); return f; };
const urlDe = (motif) => registre.find((e) => motif.test(e.source_url)).source_url;

test('TF-2231 — la copie de fixture du registre porte les 9 entrées et les 10 clés du contrat', () => {
  assert.equal(registre.length, 9);
  for (const e of registre) assert.deepEqual(Object.keys(e), CLES_REGISTRE);
  assert.deepEqual(jugerRegistre(registre), []);
  assert.equal(registre.filter((e) => e.classement === 'defaut').length, 5);
  assert.equal(registre.filter((e) => e.classement === 'decision').length, 4);
});

test('TF-2231 — VERT : les profils du dépôt couvrent le registre (9 entrées revendiquées, aucune non jugée)', () => {
  const r = node(['--registre', REGISTRE]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /PASS : 9 entrée\(s\) du registre, 9 couverte\(s\) par un profil, 0 non jugée\(s\)/);
});

test('TF-2231 — ROUGE : les mêmes profils SANS revendication (état d\'avant) laissent 9 réglages sans binding (RG2)', () => {
  const p = profilsReels();
  for (const b of Object.values(p)) for (const x of b.bindings) delete x.reglage_registre;
  const res = jugerCouverture(registre, p);
  assert.equal(res.findings.filter((f) => f.code === 'RG2').length, 9);
  const dossier = path.join(tmp, 'profils-avant');
  for (const [nom, b] of Object.entries(p)) { fs.mkdirSync(path.join(dossier, nom), { recursive: true }); fs.writeFileSync(path.join(dossier, nom, 'bindings.json'), JSON.stringify(b)); }
  const r = node(['--registre', REGISTRE, '--profils', dossier]);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stdout, /FAIL : 9 écart\(s\)/);
});

test('TF-2231 — chaque réglage classé décision est revendiqué par un binding dont l\'evidence porte la clause de l\'écart accepté', () => {
  const p = profilsReels();
  const decisions = registre.filter((e) => e.classement === 'decision');
  assert.equal(decisions.length, 4);
  for (const e of decisions) {
    const noms = Object.entries(p).flatMap(([nom, b]) => b.bindings.filter((x) => (x.reglage_registre ?? []).includes(e.source_url)).map((x) => [nom, x]));
    assert.ok(noms.length >= 1, `${e.reglage} : aucun binding`);
    for (const [nom, x] of noms) assert.ok(porteClauseEcartAccepte(x.evidence), `${nom} ${x.control} : clause de l'écart accepté absente`);
  }
});

test('TF-2231 — ROUGE RG3 : la clause retirée du binding de la MFA d\'organisation, puis le remède (elle est remise) est VERT', () => {
  const p = profilsReels();
  const mfa = urlDe(/org-mfa-enforcement/);
  const b = p.supabase.bindings.find((x) => (x.reglage_registre ?? []).includes(mfa));
  const avec = b.evidence;
  b.evidence = avec.replace(/écart accepté/gi, 'dérogation');
  const rouge = jugerCouverture(registre, p).findings;
  assert.deepEqual(rouge.map((f) => f.code), ['RG3']);
  assert.match(rouge[0].message, /supabase \(CTL-D03-01\).*écart accepté : option, motif, décideur/);
  b.evidence = avec;
  assert.deepEqual(jugerCouverture(registre, p).findings, []);
});

test('TF-2231 — ROUGE RG2 : une revendication vers une entrée qui n\'existe pas est refusée', () => {
  const p = profilsReels();
  p.github.bindings[0].reglage_registre = ['https://exemple.invalid/inconnu'];
  const f = jugerCouverture(registre, p).findings.map((x) => x.code);
  assert.ok(f.includes('RG2'));
});

test('TF-2231 — ROUGE RG1 : une clé absente, une clé hors contrat, un classement hors liste, une URL en double', () => {
  const r = JSON.parse(JSON.stringify(registre));
  delete r[0].cmd_lire; r[1].extra = 1; r[2].classement = 'optionnel'; r[3].source_url = r[4].source_url;
  const codes = jugerRegistre(r).map((x) => x.message);
  assert.ok(codes.some((m) => /clé « cmd_lire » absente/.test(m)));
  assert.ok(codes.some((m) => /clé « extra » hors du contrat/.test(m)));
  assert.ok(codes.some((m) => /classement « optionnel »/.test(m)));
  assert.ok(codes.some((m) => /déjà prise/.test(m)));
});

test('TF-2231 — une plateforme sans profil est dite « non jugée », jamais comptée conforme', () => {
  const p = profilsReels(); delete p.cloudflare;
  const res = jugerCouverture(registre, p);
  assert.equal(res.nonJuge.length, 2);
  assert.match(res.nonJuge[0], /Cloudflare : aucun profil technologique/);
  assert.deepEqual(res.findings, []);
});

// ── Mode écarts : les réglages LUS par un audit ───────────────────────────────────────────────────────────────
const MFA = urlDe(/org-mfa-enforcement/), HTTPS = urlDe(/always-use-https/);
const ACCEPTE = { option: 'Offre Free conservée', motif: 'coût de l\'offre Pro non justifié à ce stade', decideur: 'le porteur', date: '2026-11-06' };

test('TF-2231 — ROUGE RG5 : un réglage décision lu non conforme sans écart accepté est un écart NU (sortie 1, le réglage nommé)', () => {
  const f = ecrire('nu.json', { reglages: [{ source_url: MFA, conforme: false }] });
  const r = node(['--registre', REGISTRE, '--ecarts', f]);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stdout, /\[RG5\].*Double vérification.*écart nu/);
  assert.match(r.stdout, /manque : option, motif, decideur, date/);
});

test('TF-2231 — VERT : le remède de RG5 — l\'écart accepté écrit (option, motif, décideur, date) — passe', () => {
  const f = ecrire('accepte.json', { reglages: [{ source_url: MFA, conforme: false, ecart_accepte: ACCEPTE }, { source_url: HTTPS, conforme: true }] });
  const r = node(['--registre', REGISTRE, '--ecarts', f]);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /PASS : 2 réglage\(s\) lu\(s\), aucun écart nu/);
});

test('TF-2231 — RG5 refuse un écart accepté incomplet : décideur vide, date mal formée', () => {
  for (const mauvais of [{ ...ACCEPTE, decideur: '' }, { ...ACCEPTE, date: 'bientôt' }, { ...ACCEPTE, motif: 'x' }, { option: ACCEPTE.option }]) {
    const f = jugerEcarts(registre, { reglages: [{ source_url: MFA, conforme: false, ecart_accepte: mauvais }] });
    assert.deepEqual(f.map((x) => x.code), ['RG5'], JSON.stringify(mauvais));
  }
});

test('TF-2231 — ROUGE RG6 : un réglage classé défaut non conforme ne s\'accepte pas, même avec un écart écrit', () => {
  const f = ecrire('defaut.json', { reglages: [{ source_url: HTTPS, conforme: false, ecart_accepte: ACCEPTE }] });
  const r = node(['--registre', REGISTRE, '--ecarts', f]);
  assert.equal(r.status, 1, r.stdout);
  assert.match(r.stdout, /\[RG6\].*Always Use HTTPS.*rouvre un retour vers la forge qui crée/);
  const remede = ecrire('defaut-relu.json', { reglages: [{ source_url: HTTPS, conforme: true }] });
  assert.equal(node(['--registre', REGISTRE, '--ecarts', remede]).status, 0, 'le remède (appliquer puis relire) doit passer');
});

test('TF-2231 — ROUGE RG4 : un réglage lu qui n\'est pas au registre, ou « conforme » ni vrai ni faux, ou pas de liste', () => {
  assert.deepEqual(jugerEcarts(registre, { reglages: [{ source_url: 'https://exemple.invalid/x', conforme: true }] }).map((x) => x.code), ['RG4']);
  assert.deepEqual(jugerEcarts(registre, { reglages: [{ source_url: HTTPS, conforme: 'oui' }] }).map((x) => x.code), ['RG4']);
  assert.deepEqual(jugerEcarts(registre, {}).map((x) => x.code), ['RG4']);
});

// ── Le registre du pilot : lu par son chemin, jamais exigé ──────────────────────────────────────────────────────
test('TF-2231 — sans registre au chemin du pilot : « non jugé » (0) pour les profils, 2 pour les écarts (jamais un faux PASS)', () => {
  const vide = fs.mkdtempSync(path.join(tmp, 'parc-'));
  const profils = node([], { FORGE_ROOT: vide });
  assert.equal(profils.status, 0, profils.stderr);
  assert.match(profils.stdout, /non jugé : registre des réglages sûrs par défaut introuvable/);
  const f = ecrire('x.json', { reglages: [] });
  const ecarts = node(['--ecarts', f], { FORGE_ROOT: vide });
  assert.equal(ecarts.status, 2, ecarts.stdout);
  assert.match(ecarts.stderr, /Registre introuvable/);
});

test('TF-2231 — le registre est lu au chemin du pilot : references/REGLAGES-SURS-PAR-DEFAUT.json sous $FORGE_ROOT/digit-ai-factory', () => {
  const parc = fs.mkdtempSync(path.join(tmp, 'parc-'));
  const dossier = path.join(parc, 'digit-ai-factory', 'references');
  fs.mkdirSync(dossier, { recursive: true });
  fs.copyFileSync(REGISTRE, path.join(dossier, 'REGLAGES-SURS-PAR-DEFAUT.json'));
  const r = node([], { FORGE_ROOT: parc });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /PASS : 9 entrée\(s\) du registre/);
});

test('TF-2231 — l\'auto-test de l\'outil joue ses 13 cas, chaque rouge pour SA règle et chaque remède vert', () => {
  const r = node(['--self-test']);
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /self-test PASS : 13\/13 cas conformes/);
});

test('TF-2231 — les usages invalides sortent 2 : option inconnue, option sans valeur', () => {
  assert.equal(node(['--inconnue']).status, 2);
  assert.equal(node(['--registre']).status, 2);
  assert.equal(node(['--registre', '--ecarts']).status, 2);
});
