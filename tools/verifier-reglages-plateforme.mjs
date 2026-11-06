#!/usr/bin/env node
/**
 * verifier-reglages-plateforme.mjs — les profils contrôlent les réglages de plateforme du registre du pilot, et l'écart
 * accepté d'un réglage classé « décision » s'écrit : pas d'écart nu (TF-2231, pièce 7 de D-178).
 *
 * LE FAIT. L'étude du 06/11/2026 (« Sécurité par défaut de bout en bout », section 2.2) mesure sur le produit témoin 7
 * écarts d'audit sur 30 qui se reproduisent à chaque produit : un réglage de plateforme que personne n'a appliqué à la
 * création, ou un réglage que le porteur a choisi de ne pas poser, vu à l'audit comme un écart sans histoire. Le
 * principe adopté (D-178 (a), loi transverse) : « réglage admissible appliqué à la création, vérifié à chaque livraison,
 * exception décidée ». Le registre du pilot (`references/REGLAGES-SURS-PAR-DEFAUT.json`) classe chaque réglage `defaut`
 * (appliqué sans question) ou `decision` (le porteur choisit : coût, offre, flux).
 *
 * CE QUE JUGE CET OUTIL, en deux modes :
 *   Mode profils (par défaut) — la couverture des profils technologiques (`profiles/<plateforme>/bindings.json`) :
 *     RG1  le registre est bien formé : les 10 clés du contrat, un classement `defaut` ou `decision`, une URL de source
 *          unique par entrée ;
 *     RG2  chaque entrée dont la plateforme a un profil est REVENDIQUÉE par au moins un binding de ce profil
 *          (champ facultatif `reglage_registre` : l'URL de source de l'entrée), et chaque revendication désigne une
 *          entrée qui existe ;
 *     RG3  le binding qui revendique un réglage classé `decision` porte la clause de l'écart accepté dans son `evidence` :
 *          « écart accepté » avec l'option retenue, le motif et le décideur. Sans elle, l'audit rendrait un écart nu.
 *   Mode écarts (`--ecarts <fichier>`) — les réglages LUS par un audit, jugés contre le registre :
 *     RG4  chaque réglage lu désigne une entrée du registre ;
 *     RG5  un réglage `decision` lu non conforme porte `ecart_accepte` (option, motif, décideur, date), sinon l'écart est nu ;
 *     RG6  un réglage `defaut` lu non conforme ne s'accepte pas : il rouvre un retour vers la forge qui crée (TF-2232).
 *
 * Ce que cet outil ne juge PAS, et c'est déclaré : il ne compare pas la commande d'un binding à `cmd_lire` du registre
 * (lecture humaine) ; il ne lit pas l'état d'une plateforme (aucun jeton, aucun appel réseau : le porteur joue les lectures
 * et en archive la sortie) ; il ne juge pas la sincérité d'un motif ou d'un décideur, seulement leur présence.
 *
 * LE REGISTRE. Une forge le LIT par le chemin du pilot : `references/REGLAGES-SURS-PAR-DEFAUT.json` sous la racine du
 * pilot (`$FORGE_ROOT/digit-ai-factory`, sinon le parent de ce dépôt, comme `verifier-heritage`). Ce dépôt est public et
 * se clone seul : sa recette porte une COPIE de fixture (`tests/fixtures/reglages-sures-par-defaut.json`) et ne dépend
 * jamais du fichier réel. Sans registre à ce chemin, le mode profils rend « non jugé » (sortie 0, dit) ; le mode écarts
 * rend 2, car un audit ne doit pas recevoir un faux PASS.
 *
 * Usage : node tools/verifier-reglages-plateforme.mjs [--registre <fichier>] [--profils <dossier>] [--ecarts <fichier>] | --self-test
 * Format de `--ecarts` : { "reglages": [ { "source_url": "<URL de l'entrée du registre>", "conforme": true|false,
 *   "ecart_accepte": { "option": "…", "motif": "…", "decideur": "…", "date": "AAAA-MM-JJ" } } ] }
 * Exit : 0 = PASS (ou non jugé, dit) · 1 = FAIL · 2 = usage ou entrée illisible.
 */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { ROOT, rel } from './lib.mjs';

export const CLES_REGISTRE = ['plateforme', 'reglage', 'source_url', 'source_lue_le', 'criteres', 'cmd_appliquer', 'cmd_lire', 'attendu', 'cmd_retour', 'classement'];
export const CLASSEMENTS = ['defaut', 'decision'];
export const CHEMIN_PILOT = ['digit-ai-factory', 'references', 'REGLAGES-SURS-PAR-DEFAUT.json'];

/** Le registre du pilot, résolu comme verifier-heritage résout la racine du parc. */
export function cheminRegistrePilot() {
  return path.join(process.env.FORGE_ROOT || path.dirname(ROOT), ...CHEMIN_PILOT);
}

const url = (u) => String(u ?? '').trim().replace(/\/+$/, '');
const plein = (v) => typeof v === 'string' && v.trim().length >= 3;

/** RG1 — le registre est bien formé. */
export function jugerRegistre(registre) {
  const f = [];
  if (!Array.isArray(registre) || !registre.length) return [{ code: 'RG1', message: 'le registre est vide ou n\'est pas une liste' }];
  const vus = new Set();
  registre.forEach((e, i) => {
    const ou = `entrée ${i + 1}${e?.reglage ? ` (${String(e.reglage).slice(0, 50)})` : ''}`;
    const cles = Object.keys(e ?? {});
    for (const c of CLES_REGISTRE) if (!cles.includes(c)) f.push({ code: 'RG1', message: `${ou} : clé « ${c} » absente` });
    for (const c of cles) if (!CLES_REGISTRE.includes(c)) f.push({ code: 'RG1', message: `${ou} : clé « ${c} » hors du contrat` });
    if (!CLASSEMENTS.includes(e?.classement)) f.push({ code: 'RG1', message: `${ou} : classement « ${e?.classement} » hors de ${CLASSEMENTS.join(' | ')}` });
    if (!/^https:\/\//.test(e?.source_url ?? '')) f.push({ code: 'RG1', message: `${ou} : source_url n'est pas une URL https` });
    else if (vus.has(url(e.source_url))) f.push({ code: 'RG1', message: `${ou} : source_url déjà prise par une autre entrée (c'est la clé de revendication des bindings)` });
    else vus.add(url(e.source_url));
  });
  return f;
}

/** La clause de l'écart accepté, dans le texte d'un binding : « écart accepté » avec option, motif et décideur. */
export function porteClauseEcartAccepte(texte) {
  const t = String(texte ?? '');
  return /écart accepté/i.test(t) && /\boption\b/i.test(t) && /\bmotif\b/i.test(t) && /\bdécideur\b/i.test(t);
}

/**
 * RG2 et RG3 — la couverture des profils. `profils` : { <nom>: bindings.json }.
 * Rend { findings, nonJuge } ; `nonJuge` nomme les plateformes sans profil, jamais comptées comme conformes.
 */
export function jugerCouverture(registre, profils) {
  const findings = [], nonJuge = [];
  const f = (code, message) => findings.push({ code, message });
  const revendications = new Map();   // URL → [{ profil, control }]
  for (const [nom, b] of Object.entries(profils)) {
    for (const x of b.bindings ?? []) for (const u of x.reglage_registre ?? []) {
      if (!revendications.has(url(u))) revendications.set(url(u), []);
      revendications.get(url(u)).push({ profil: nom, binding: x });
    }
  }
  const connues = new Set(registre.map((e) => url(e.source_url)));
  for (const [u, qui] of revendications) if (!connues.has(u)) f('RG2', `${qui[0].profil} (${qui[0].binding.control}) revendique « ${u} », qui n'est une entrée d'aucun registre`);
  for (const e of registre) {
    const nom = String(e.plateforme ?? '').toLowerCase();
    if (!profils[nom]) { nonJuge.push(`${e.plateforme} : aucun profil technologique, « ${String(e.reglage).slice(0, 60)} » non couvert par l'audit`); continue; }
    const qui = (revendications.get(url(e.source_url)) ?? []).filter((r) => r.profil === nom);
    if (!qui.length) { f('RG2', `${nom} : aucun binding ne revendique le réglage « ${String(e.reglage).slice(0, 70)} » (reglage_registre: ${e.source_url})`); continue; }
    if (e.classement === 'decision')
      for (const r of qui)
        if (!porteClauseEcartAccepte(r.binding.evidence))
          f('RG3', `${nom} (${r.binding.control}) : le réglage « ${String(e.reglage).slice(0, 60)} » est classé décision, l'evidence du binding ne porte pas la clause de l'écart accepté (écart accepté : option, motif, décideur) — l'audit rendrait un écart nu`);
  }
  return { findings, nonJuge };
}

/** RG4, RG5 et RG6 — les réglages LUS par un audit, jugés contre le registre. */
export function jugerEcarts(registre, ecarts) {
  const f = [];
  const parUrl = new Map(registre.map((e) => [url(e.source_url), e]));
  const lus = Array.isArray(ecarts?.reglages) ? ecarts.reglages : null;
  if (!lus) return [{ code: 'RG4', message: 'le fichier des écarts n\'a pas de liste « reglages »' }];
  lus.forEach((l, i) => {
    const e = parUrl.get(url(l?.source_url));
    const ou = `réglage lu ${i + 1}${e ? ` (${String(e.reglage).slice(0, 60)})` : ''}`;
    if (!e) { f.push({ code: 'RG4', message: `${ou} : « ${l?.source_url} » n'est une entrée d'aucun registre` }); return; }
    if (typeof l.conforme !== 'boolean') { f.push({ code: 'RG4', message: `${ou} : « conforme » doit être vrai ou faux` }); return; }
    if (l.conforme) return;
    if (e.classement === 'defaut') {
      f.push({ code: 'RG6', message: `${ou} : réglage classé défaut lu non conforme — il ne s'accepte pas, il rouvre un retour vers la forge qui crée (appliquer cmd_appliquer, relire cmd_lire)` });
      return;
    }
    const a = l.ecart_accepte;
    const manques = ['option', 'motif', 'decideur'].filter((k) => !plein(a?.[k]));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(a?.date ?? '')) manques.push('date');
    if (manques.length) f.push({ code: 'RG5', message: `${ou} : réglage classé décision lu non conforme sans écart accepté complet (manque : ${manques.join(', ')}) — écart nu` });
  });
  return f;
}

function chargerProfils(dossier) {
  const profils = {};
  for (const nom of fs.readdirSync(dossier).sort()) {
    const fichier = path.join(dossier, nom, 'bindings.json');
    if (fs.existsSync(fichier)) profils[nom] = JSON.parse(fs.readFileSync(fichier, 'utf8'));
  }
  return profils;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTO-TEST À DOUBLE SENS : le registre de fixture et les vrais profils passent ; chaque règle a son rouge, et le remède
// que le message recommande est joué et passe.
// ─────────────────────────────────────────────────────────────────────────────
const FIXTURE = rel('tests', 'fixtures', 'reglages-sures-par-defaut.json');
const clone = (o) => JSON.parse(JSON.stringify(o));
const urlDe = (registre, motif) => registre.find((e) => motif.test(e.source_url)).source_url;

export function casDeBanc(registre, profils) {
  const mfaOrg = urlDe(registre, /org-mfa-enforcement/), https = urlDe(registre, /always-use-https/);
  const ecart = { source_url: mfaOrg, conforme: false };
  const accepte = { option: 'Offre Free conservée', motif: 'coût de l\'offre Pro non justifié à ce stade', decideur: 'le porteur', date: '2026-11-06' };
  const sansClause = (p) => { for (const b of p.supabase.bindings) if ((b.reglage_registre ?? []).some((u) => url(u) === url(mfaOrg))) b.evidence = b.evidence.replace(/écart accepté/gi, 'dérogation'); return p; };
  const sansRevendication = (p) => { for (const b of p.cloudflare.bindings) b.reglage_registre = (b.reglage_registre ?? []).filter((u) => url(u) !== url(https)); return p; };
  const revendicationInconnue = (p) => { p.github.bindings[0].reglage_registre = [...(p.github.bindings[0].reglage_registre ?? []), 'https://exemple.invalid/inconnu']; return p; };
  const registreCasse = clone(registre); delete registreCasse[0].cmd_lire; registreCasse[1].classement = 'optionnel';
  return {
    couverture: [
      ['VERT : registre de fixture et profils du dépôt', registre, profils, []],
      ['ROUGE RG1 : une clé absente et un classement hors liste', registreCasse, profils, ['RG1']],
      ['ROUGE RG2 : Always Use HTTPS non revendiqué par le profil cloudflare', registre, sansRevendication(clone(profils)), ['RG2']],
      ['ROUGE RG2 : une revendication vers une entrée inexistante', registre, revendicationInconnue(clone(profils)), ['RG2']],
      ['ROUGE RG3 : la clause de l\'écart accepté retirée du binding de la MFA d\'organisation', registre, sansClause(clone(profils)), ['RG3']],
    ],
    ecarts: [
      ['VERT : réglage défaut conforme', { reglages: [{ source_url: https, conforme: true }] }, []],
      ['ROUGE RG5 : réglage décision non conforme, écart nu', { reglages: [ecart] }, ['RG5']],
      ['VERT : le remède de RG5 — l\'écart accepté écrit', { reglages: [{ ...ecart, ecart_accepte: accepte }] }, []],
      ['ROUGE RG5 : écart accepté sans décideur', { reglages: [{ ...ecart, ecart_accepte: { ...accepte, decideur: '' } }] }, ['RG5']],
      ['ROUGE RG6 : réglage défaut non conforme, même avec un écart écrit', { reglages: [{ source_url: https, conforme: false, ecart_accepte: accepte }] }, ['RG6']],
      ['VERT : le remède de RG6 — le réglage défaut appliqué puis relu', { reglages: [{ source_url: https, conforme: true }] }, []],
      ['ROUGE RG4 : un réglage lu qui n\'est pas au registre', { reglages: [{ source_url: 'https://exemple.invalid/x', conforme: true }] }, ['RG4']],
      ['ROUGE RG4 : « conforme » ni vrai ni faux', { reglages: [{ source_url: https, conforme: 'oui' }] }, ['RG4']],
    ],
  };
}

function selfTest() {
  const registre = JSON.parse(fs.readFileSync(FIXTURE, 'utf8'));
  const profils = chargerProfils(rel('profiles'));
  const cas = casDeBanc(registre, profils);
  const ecarts = [];
  const brut = jugerRegistre(registre);
  if (brut.length) ecarts.push(`registre de fixture refusé : ${brut.map((x) => x.message).join(' | ')}`);
  for (const [lib, reg, pro, attendus] of cas.couverture) {
    const obtenus = [...new Set([...jugerRegistre(reg), ...jugerCouverture(reg, pro).findings].map((x) => x.code))].sort();
    if (obtenus.join() !== attendus.join()) ecarts.push(`${lib} : attendu [${attendus}], obtenu [${obtenus}]`);
  }
  for (const [lib, ec, attendus] of cas.ecarts) {
    const obtenus = [...new Set(jugerEcarts(registre, ec).map((x) => x.code))].sort();
    if (obtenus.join() !== attendus.join()) ecarts.push(`${lib} : attendu [${attendus}], obtenu [${obtenus}]`);
  }
  const total = cas.couverture.length + cas.ecarts.length;
  if (ecarts.length) { for (const e of ecarts) console.log(`  ✖ ${e}`); console.log(`self-test FAIL : ${ecarts.length} écart(s) sur ${total} cas`); return 1; }
  console.log(`self-test PASS : ${total}/${total} cas conformes (RG1 à RG6, chaque rouge pour SA règle, chaque remède joué et vert)`);
  return 0;
}

function option(argv, nom) {
  const i = argv.indexOf(nom);
  if (i === -1) return undefined;
  const v = argv[i + 1];
  if (v === undefined || v.startsWith('-')) { console.error(`Option ${nom} sans valeur.`); process.exit(2); }
  return v;
}

function principal(argv) {
  const USAGE = 'Usage: node tools/verifier-reglages-plateforme.mjs [--registre <fichier>] [--profils <dossier>] [--ecarts <fichier>] | --self-test';
  if (argv.includes('--self-test')) return selfTest();
  const cheminRegistre = path.resolve(option(argv, '--registre') ?? cheminRegistrePilot());
  const cheminEcarts = option(argv, '--ecarts');
  const dossierProfils = path.resolve(option(argv, '--profils') ?? rel('profiles'));
  if (argv.some((a) => a.startsWith('-') && !['--registre', '--profils', '--ecarts', '--self-test'].includes(a))) { console.error(USAGE); return 2; }
  if (!fs.existsSync(cheminRegistre)) {
    if (cheminEcarts !== undefined) { console.error(`Registre introuvable : ${cheminRegistre} — impossible de juger des écarts sans lui.`); return 2; }
    console.log(`non jugé : registre des réglages sûrs par défaut introuvable (${cheminRegistre}) ; poser --registre, ou lire celui du pilot (références du pilot, TF-2225).`);
    return 0;
  }
  let registre;
  try { registre = JSON.parse(fs.readFileSync(cheminRegistre, 'utf8')); } catch (e) { console.error(`Registre illisible : ${e.message}`); return 2; }
  const findings = jugerRegistre(registre);
  if (findings.length) { for (const x of findings) console.log(`  ✖ [${x.code}] ${x.message}`); console.log(`FAIL : ${findings.length} écart(s)`); return 1; }
  if (cheminEcarts !== undefined) {
    let ecarts;
    try { ecarts = JSON.parse(fs.readFileSync(path.resolve(cheminEcarts), 'utf8')); } catch (e) { console.error(`Fichier des écarts illisible : ${e.message}`); return 2; }
    const res = jugerEcarts(registre, ecarts);
    for (const x of res) console.log(`  ✖ [${x.code}] ${x.message}`);
    console.log(res.length ? `FAIL : ${res.length} écart(s) nu(s) ou non admis` : `PASS : ${ecarts.reglages.length} réglage(s) lu(s), aucun écart nu`);
    return res.length ? 1 : 0;
  }
  const res = jugerCouverture(registre, chargerProfils(dossierProfils));
  for (const n of res.nonJuge) console.log(`  non jugé : ${n}`);
  for (const x of res.findings) console.log(`  ✖ [${x.code}] ${x.message}`);
  console.log(res.findings.length ? `FAIL : ${res.findings.length} écart(s)` : `PASS : ${registre.length} entrée(s) du registre, ${registre.length - res.nonJuge.length} couverte(s) par un profil, ${res.nonJuge.length} non jugée(s)`);
  return res.findings.length ? 1 : 0;
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) process.exit(principal(process.argv.slice(2)));
