#!/usr/bin/env node
/**
 * fiche-en-pdf — LE PDF DE DIFFUSION EST **IMPRIMÉ** DEPUIS LE HTML, JAMAIS CAPTURÉ (TF-0700).
 *
 * ── LE FAIT QUI A PAYÉ CET OUTIL (mesuré le 27/08/2026 sur un dossier de livraison réel) ──
 * Le kit prescrivait la fiche sécurité en HTML et rien d'autre : ni le format réellement DIFFUSÉ
 * à l'équipe sécurité (un PDF), ni le moyen de le produire, ni le moindre contrôle sur lui. Un
 * format qu'aucun outil ne produit est un format qu'on refait à la main, quand on y pense.
 * Résultat relevé sur le PDF parti à l'équipe sécurité :
 *   · 1 page, **0 caractère de texte extractible**, 9 images incorporées — une CAPTURE
 *     rasterisée, pas une impression ;
 *   · donc : non recherchable, **muette pour un lecteur d'écran** alors que le destinataire est
 *     l'équipe sécurité, non contrôlable par machine, et 653 Ko contre 124 Ko pour le même
 *     document imprimé en texte (5× plus lourd) ;
 *   · et l'indice avait divergé : PDF en `c`, HTML déposé à côté en `d`. Ce qui a été diffusé
 *     n'était pas la révision de référence conservée à côté de lui, et rien ne l'a signalé.
 * Le second défaut découle du premier : c'est la régénération manuelle qui perd l'indice.
 *
 * ── CE QUE CET OUTIL FAIT, ET LE POINT NON ÉVIDENT ────────────────────────────────────────
 * Il pilote le moteur d'impression d'un navigateur Chromium DÉJÀ PRÉSENT sur le poste, par le
 * protocole DevTools (aucune dépendance, aucun binaire embarqué — même doctrine que le reste du
 * dépôt, et les kits distribués restent autoportants). Trois réglages, et le troisième est celui
 * qu'on n'invente pas :
 *   1. `Emulation.setEmulatedMedia({media:'print'})` — la page est mise en média `print` AVANT
 *      le tirage : sans cela, ce qui est relu à l'écran et ce qui part en PDF divergent ;
 *   2. `printBackground: true` — sans lui, les aplats de la charte (en-têtes de tableau, bandeau
 *      de marque) disparaissent du tirage et la fiche imprimée cesse de ressembler à la charte ;
 *   3. **`preferCSSPageSize: true`** — LE POINT NON ÉVIDENT. Sans lui, Chromium impose SES
 *      propres format et marges et IGNORE le `@page{size:A4 portrait;margin:8mm}` du gabarit.
 *      Mesuré ici même, sur la fiche d'exemple, le 02/09/2026 : sans le drapeau la boîte média
 *      du PDF vaut **612×792 pt (US Letter)** ; avec, **595×842 pt (A4)**. Le gabarit fait déjà
 *      tout le travail difficile ; il suffisait de ne pas le jeter.
 *
 * ── LA RÈGLE D'INDICE (TF-0700 c) ─────────────────────────────────────────────────────────
 * Le PDF porte le **MÊME indice** que le HTML dont il est imprimé. C'est pour cela que la sortie
 * par défaut est le chemin du HTML avec l'extension changée : l'indice ne peut pas diverger sans
 * qu'on l'ait écrit exprès — et si `--out` porte un autre indice, l'outil REFUSE. Une fiche
 * rendue sans son PDF de même indice n'est pas une fiche complète.
 *
 * ── ON RELIT LE FICHIER, ON NE CROIT PAS LA COMMANDE ──────────────────────────────────────
 * Le tirage produit est relu par `verifier-pdf.mjs` (format, pages, fraîcheur) : un code de
 * retour 0 d'un navigateur ne prouve pas qu'un octet a été écrit — sous Windows, un PDF ouvert
 * dans une visionneuse verrouille le fichier et l'écriture échoue EN SILENCE.
 *
 *   node tools/fiche-en-pdf.mjs <fiche.html> [--out <fiche.pdf>] [--pages-max N]
 *                               [--navigateur <chemin>] [--sans-relecture]
 *   node tools/fiche-en-pdf.mjs --self-test
 *
 * Exit : 0 = PDF imprimé et relu · 1 = refusé (indice divergent, tirage absent/faux) ·
 *        2 = usage · 3 = aucun moteur d'impression sur le poste (SKIP MOTIVÉ, jamais un PASS
 *        silencieux : le jeu remis est incomplet et la commande le DIT).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));

/** Les moteurs d'impression cherchés, dans l'ordre. `FORGE_NAVIGATEUR` prime toujours. */
export const NAVIGATEURS = [
  process.env.FORGE_NAVIGATEUR,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge',
].filter(Boolean);

export const trouverNavigateur = () =>
  NAVIGATEURS.find((n) => { try { return fs.existsSync(n); } catch { return false; } }) ?? null;

/**
 * L'indice d'un nom de livrable daté : `… - 20260902c.html` → `{ jour:'20260902', indice:'c' }`.
 * Rend `null` quand le nom n'est pas daté — l'absence d'indice n'est pas une divergence.
 */
export function indiceDe(nomOuChemin) {
  const m = /(\d{8})([a-z])(?=\.[A-Za-z0-9]+$|$)/.exec(path.basename(String(nomOuChemin)));
  return m ? { jour: m[1], indice: m[2] } : null;
}

/** Le PDF de diffusion d'un HTML de référence : même chemin, même nom, même INDICE. */
export const pdfDe = (html) => String(html).replace(/\.html?$/i, '') + '.pdf';

// ── Le client DevTools : le strict nécessaire, sans dépendance. ──────────────────────────────
async function ouvrirNavigateur(navigateur, profil) {
  const proc = spawn(navigateur, ['--headless=new', '--disable-gpu', '--no-first-run',
    '--no-default-browser-check', '--disable-extensions', '--remote-debugging-port=0',
    `--user-data-dir=${profil}`, 'about:blank'], { stdio: ['ignore', 'pipe', 'pipe'] });
  let journal = '';
  const url = await new Promise((res, rej) => {
    const minuteur = setTimeout(
      () => rej(new Error(`le navigateur n'a pas annoncé son point d'écoute en 30 s. Journal : ${journal.slice(-400)}`)), 30000);
    proc.on('error', (e) => { clearTimeout(minuteur); rej(e); });
    proc.stderr.on('data', (d) => {
      journal += d;
      const m = /ws:\/\/\S+/.exec(journal);
      if (m) { clearTimeout(minuteur); res(m[0]); }
    });
  });
  return { proc, url };
}

/**
 * Le protocole DevTools passe par un WebSocket. `globalThis.WebSocket` est natif à partir de
 * Node 22 ; sur un runtime plus ancien il faut `--experimental-websocket`. On le DIT plutôt que
 * de tomber sur un `ReferenceError` illisible à 200 lignes de là.
 */
export const webSocketDisponible = () => typeof globalThis.WebSocket === 'function';

function brancher(url) {
  if (!webSocketDisponible()) {
    throw Object.assign(new Error(
      `ce runtime (${process.version}) n'expose pas WebSocket, requis par le protocole DevTools. `
      + 'Node ≥ 22 le fournit nativement ; sur un runtime plus ancien, relancer avec '
      + '`node --experimental-websocket`.'), { sansWebSocket: true });
  }
  const sock = new WebSocket(url);
  let numero = 0;
  const attentes = new Map();
  sock.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (m.id && attentes.has(m.id)) { attentes.get(m.id)(m); attentes.delete(m.id); }
  });
  const pret = new Promise((res, rej) => {
    sock.addEventListener('open', res);
    sock.addEventListener('error', () => rej(new Error('connexion au protocole DevTools refusée')));
  });
  const cmd = (methode, params = {}, sessionId) => new Promise((res, rej) => {
    const id = ++numero;
    attentes.set(id, (m) => (m.error ? rej(new Error(`${methode} : ${JSON.stringify(m.error)}`)) : res(m.result)));
    sock.send(JSON.stringify({ id, method: methode, params, sessionId }));
  });
  /** Attend un événement CDP d'une session donnée. */
  const evenement = (methode, sessionId) => new Promise((res) => {
    const h = (e) => {
      const m = JSON.parse(e.data);
      if (m.method === methode && m.sessionId === sessionId) { sock.removeEventListener('message', h); res(m.params); }
    };
    sock.addEventListener('message', h);
  });
  return { sock, pret, cmd, evenement };
}

/**
 * Imprime `html` en PDF et rend les octets. `preferCSSPageSize` est passé à `pref` pour que la
 * fixture rouge de l'auto-test puisse prouver, en mesurant, ce que coûte son absence.
 */
export async function imprimer(html, { navigateur, pref = true } = {}) {
  const moteur = navigateur ?? trouverNavigateur();
  if (!moteur) throw Object.assign(new Error('aucun moteur d\'impression'), { sansNavigateur: true });
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'fiche-pdf-'));
  const { proc, url } = await ouvrirNavigateur(moteur, profil);
  const { sock, pret, cmd, evenement } = brancher(url);
  try {
    await pret;
    const { targetId } = await cmd('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cmd('Target.attachToTarget', { targetId, flatten: true });
    await cmd('Page.enable', {}, sessionId);
    const charge = evenement('Page.loadEventFired', sessionId);
    await cmd('Page.navigate', { url: pathToFileURL(path.resolve(html)).href }, sessionId);
    await Promise.race([charge, new Promise((_, rej) => setTimeout(() => rej(new Error('chargement du HTML > 30 s')), 30000))]);
    // 1. média `print` : ce qui est relu et ce qui part en PDF ne doivent pas diverger.
    await cmd('Emulation.setEmulatedMedia', { media: 'print' }, sessionId);
    // 2. et 3. : aplats de la charte conservés, et @page du gabarit respecté.
    const { data } = await cmd('Page.printToPDF', {
      printBackground: true, preferCSSPageSize: pref,
      displayHeaderFooter: false, transferMode: 'ReturnAsBase64',
    }, sessionId);
    return Buffer.from(data, 'base64');
  } finally {
    try { sock.close(); } catch { /* le socket est déjà tombé : rien à fermer */ }
    try { proc.kill(); } catch { /* le navigateur est déjà sorti */ }
    try { fs.rmSync(profil, { recursive: true, force: true }); } catch { /* profil temporaire */ }
  }
}

/** Le mesureur de mise en page : rend ce que le MOTEUR calcule, jamais ce que la CSS déclare. */
export async function mesurer(html, expression, { navigateur } = {}) {
  const moteur = navigateur ?? trouverNavigateur();
  if (!moteur) throw Object.assign(new Error('aucun moteur d\'impression'), { sansNavigateur: true });
  const profil = fs.mkdtempSync(path.join(os.tmpdir(), 'fiche-mes-'));
  const { proc, url } = await ouvrirNavigateur(moteur, profil);
  const { sock, pret, cmd, evenement } = brancher(url);
  try {
    await pret;
    const { targetId } = await cmd('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cmd('Target.attachToTarget', { targetId, flatten: true });
    await cmd('Page.enable', {}, sessionId);
    const charge = evenement('Page.loadEventFired', sessionId);
    await cmd('Page.navigate', { url: pathToFileURL(path.resolve(html)).href }, sessionId);
    await Promise.race([charge, new Promise((_, rej) => setTimeout(() => rej(new Error('chargement du HTML > 30 s')), 30000))]);
    await cmd('Emulation.setEmulatedMedia', { media: 'print' }, sessionId);
    const r = await cmd('Runtime.evaluate', { expression, returnByValue: true }, sessionId);
    return r.result?.value;
  } finally {
    try { sock.close(); } catch { /* déjà fermé */ }
    try { proc.kill(); } catch { /* déjà sorti */ }
    try { fs.rmSync(profil, { recursive: true, force: true }); } catch { /* profil temporaire */ }
  }
}

/** `verifier-pdf.mjs`, où qu'il soit : dépôt (`oracles/`) ou kit distribué (racine, `oracles/`). */
function oraclePdf() {
  const candidats = [
    path.join(ICI, '..', 'oracles', 'verifier-pdf.mjs'),
    path.join(ICI, 'oracles', 'verifier-pdf.mjs'),
    path.join(ICI, 'verifier-pdf.mjs'),
  ];
  return candidats.find((c) => fs.existsSync(c)) ?? null;
}

// ── Ligne de commande ────────────────────────────────────────────────────────────────────────
const USAGE = 'Usage: node fiche-en-pdf.mjs <fiche.html> [--out <fiche.pdf>] [--pages-max N] '
  + '[--navigateur <chemin>] [--sans-relecture]  |  node fiche-en-pdf.mjs --self-test';

async function principal(args) {
  const opt = (n, d = null) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
  const source = args.find((a) => !a.startsWith('--') && /\.html?$/i.test(a));
  if (!source) { console.error(USAGE); return 2; }
  if (!fs.existsSync(source)) { console.error(`fiche HTML introuvable : ${source}`); return 2; }

  const cible = opt('--out') ? path.resolve(opt('--out')) : pdfDe(path.resolve(source));
  // RÈGLE D'INDICE (TF-0700 c) : c'est ici qu'on refuse la divergence qui a diffusé un `c`
  // pendant qu'un `d` dormait à côté.
  const iSrc = indiceDe(source);
  const iOut = indiceDe(cible);
  if (iSrc && iOut && (iSrc.jour !== iOut.jour || iSrc.indice !== iOut.indice)) {
    console.error(`— PDF NON RENDU : indice divergent. Le HTML porte ${iSrc.jour}${iSrc.indice}, la sortie `
      + `demandée porte ${iOut.jour}${iOut.indice}. Le PDF de diffusion porte le MÊME indice que le HTML `
      + "dont il est imprimé : c'est exactement le défaut du 27/08 — un PDF d'indice c diffusé pendant "
      + "qu'un HTML d'indice d dormait à côté de lui, sans que rien ne le signale.");
    return 1;
  }
  if (iSrc && !iOut) {
    console.error(`— PDF NON RENDU : le HTML est daté (${iSrc.jour}${iSrc.indice}) et la sortie demandée `
      + `ne l'est pas (${path.basename(cible)}). Un PDF sans indice ne peut pas être rapproché de sa source.`);
    return 1;
  }

  if (!webSocketDisponible()) {
    console.error(`— PDF NON RENDU : ce runtime (${process.version}) n'expose pas WebSocket, requis par `
      + 'le protocole DevTools. Node ≥ 22 le fournit nativement ; sinon relancer avec '
      + '`node --experimental-websocket`. Le jeu remis serait INCOMPLET — le dire fait partie de la remise.');
    return 3;
  }
  const navigateur = opt('--navigateur') ?? trouverNavigateur();
  if (!navigateur) {
    console.error("— PDF NON RENDU : aucun moteur d'impression trouvé. Cherchés : " + NAVIGATEURS.join(', ')
      + ". Poser FORGE_NAVIGATEUR sur le chemin d'un navigateur Chromium. Le jeu remis serait INCOMPLET "
      + '(le catalogue déclare html + pdf) — le dire au destinataire fait partie de la remise.');
    return 3;
  }

  // Un ancien tirage encore là fausserait la relecture : on le retire AVANT.
  if (fs.existsSync(cible)) {
    try { fs.unlinkSync(cible); } catch (e) {
      console.error(`— PDF NON RENDU : le tirage précédent ne peut pas être remplacé (${e.code}). Sous `
        + 'Windows, un PDF ouvert dans une visionneuse VERROUILLE le fichier : le navigateur échouerait '
        + "à l'écrire sans le dire, et la relecture porterait sur l'ancien tirage. Fermer la visionneuse.");
      return 1;
    }
  }

  const lancement = Date.now();
  let octets;
  try { octets = await imprimer(source, { navigateur }); } catch (e) {
    if (e.sansNavigateur) { console.error("— PDF NON RENDU : aucun moteur d'impression."); return 3; }
    console.error(`— PDF NON RENDU : le moteur d'impression a échoué — ${e.message}`);
    return 1;
  }
  fs.mkdirSync(path.dirname(cible), { recursive: true });
  fs.writeFileSync(cible, octets);

  if (args.includes('--sans-relecture')) {
    console.log(`✔ fiche imprimée en PDF → ${cible} (${octets.length} octets) — RELECTURE NON JOUÉE (--sans-relecture)`);
    return 0;
  }
  const oracle = oraclePdf();
  if (!oracle) {
    console.error(`— TIRAGE NON RELU : verifier-pdf.mjs introuvable. Le PDF est écrit (${cible}), mais `
      + "« on relit le fichier, on ne croit pas la commande » : sans l'oracle, rien ne prouve qu'un octet "
      + 'correct a été écrit. Rejouer depuis le kit complet, ou assumer avec --sans-relecture.');
    return 1;
  }
  const pagesMax = opt('--pages-max');
  const verif = spawnSync(process.execPath, [oracle, cible, '--format', 'A4', '--apres', String(lancement),
    '--source', path.resolve(source), ...(pagesMax ? ['--pages-max', String(pagesMax)] : []), '--json-only'],
  { encoding: 'utf-8' });
  let rapport = null;
  try { rapport = JSON.parse((verif.stdout || '').trim()); } catch { /* illisible : traité juste après */ }
  if (!rapport || rapport.verdict !== 'PASS') {
    console.error(`— PDF REFUSÉ (${rapport ? rapport.verdict : 'oracle illisible'}) : `
      + (rapport ? rapport.findings.filter((f) => f.statut === 'FAIL').map((f) => `${f.regle} ${f.message}`).join(' | ')
        : (verif.stdout || verif.stderr || '').slice(0, 300)));
    return 1;
  }
  const ok = rapport.findings.filter((f) => f.statut === 'PASS').map((f) => f.regle).join('+');
  console.log(`✔ fiche imprimée en PDF → ${cible} (${octets.length} octets) [relu dans le fichier : ${ok}]`);
  return 0;
}

// ── Auto-test À DOUBLE SENS ──────────────────────────────────────────────────────────────────
// Deux étages. Le premier est HERMÉTIQUE (aucun navigateur) et porte la règle d'indice. Le
// second n'existe que si un moteur d'impression est présent, et c'est lui qui PROUVE, en
// mesurant la boîte média du tirage, ce que coûte l'absence de `preferCSSPageSize`.
async function selfTest() {
  const casse = [];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fiche-pdf-st-'));
  const html = path.join(dir, 'ACM - Fiche Securite - Dev - 20260902c.html');
  fs.writeFileSync(html, '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>t</title>'
    + '<style>@page{size:A4 portrait;margin:8mm}body{font:12px sans-serif}'
    + 'th{background:#eee}</style></head><body><h1>Fiche</h1>'
    + '<table><tr><th>Application</th><td>ACME</td></tr><tr><th>Lien DEV</th><td>https://dev.example</td></tr></table>'
    + '</body></html>', 'utf8');

  // ROUGE 1 — un PDF d'indice différent de son HTML est REFUSÉ (le défaut du 27/08).
  let code = await principal([html, '--out', path.join(dir, 'ACM - Fiche Securite - Dev - 20260902d.pdf')]);
  if (code !== 1) casse.push(`indice divergent (c → d) accepté : exit ${code} au lieu de 1 — c'est le défaut réel, non attrapé`);
  // ROUGE 2 — une source absente ne produit pas un PDF silencieux.
  code = await principal([path.join(dir, 'absente.html')]);
  if (code !== 2) casse.push(`source absente : exit ${code} au lieu de 2`);
  // VERT (règle d'indice) — la sortie par défaut porte forcément le même indice.
  const attendu = pdfDe(html);
  if (indiceDe(attendu)?.indice !== 'c') casse.push(`la sortie par défaut perd l'indice : ${path.basename(attendu)}`);

  const navigateur = webSocketDisponible() ? trouverNavigateur() : null;
  if (!navigateur) {
    console.log((casse.length ? 'SELF-TEST FAIL : ' + casse.join(' · ') + '\n' : '')
      + 'Self-test fiche-en-pdf : 3/3 PASS sur la règle d\'indice (étage hermétique). '
      + 'ÉTAGE IMPRESSION NON JOUÉ — SKIP MOTIVÉ : ' + (webSocketDisponible()
        ? 'aucun moteur d\'impression sur ce poste (' + NAVIGATEURS.join(', ') + ')'
        : `ce runtime (${process.version}) n'expose pas WebSocket — Node ≥ 22, ou --experimental-websocket`)
      + '. Ce n\'est pas un PASS : la mesure preferCSSPageSize n\'a pas eu lieu.');
    fs.rmSync(dir, { recursive: true, force: true });
    return casse.length ? 1 : 0;
  }

  // VERT — imprimé AVEC preferCSSPageSize : la boîte média suit le @page du gabarit (A4).
  const vert = await imprimer(html, { navigateur, pref: true });
  const boite = (pdf) => {
    const m = /\/MediaBox\s*\[\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*\]/.exec(pdf.toString('latin1'));
    return m ? [Math.round(Math.abs(m[3] - m[1])), Math.round(Math.abs(m[4] - m[2]))] : null;
  };
  const bv = boite(vert);
  if (!bv || Math.abs(bv[0] - 595) > 4 || Math.abs(bv[1] - 842) > 4)
    casse.push(`avec preferCSSPageSize, le tirage n'est pas A4 : ${bv ? bv.join('×') : 'boîte média illisible'} pt`);
  if (!/\/Type\s*\/Font/.test(vert.toString('latin1')))
    casse.push('le tirage ne porte AUCUNE police : ce serait une capture rasterisée, pas une impression');
  // ROUGE — imprimé SANS lui : Chromium impose son propre format et le @page du gabarit est jeté.
  const rouge = await imprimer(html, { navigateur, pref: false });
  const br = boite(rouge);
  if (!br || (Math.abs(br[0] - 595) <= 4 && Math.abs(br[1] - 842) <= 4))
    casse.push('sans preferCSSPageSize le tirage sort quand même A4 : la fixture rouge ne mord plus, '
      + "le drapeau ne prouve plus rien sur ce moteur — le vérifier avant de retirer le réglage");

  fs.rmSync(dir, { recursive: true, force: true });
  console.log(casse.length
    ? 'SELF-TEST FAIL : ' + casse.join(' · ')
    : `Self-test fiche-en-pdf : 6/6 PASS — indice divergent refusé · source absente refusée · sortie par `
      + `défaut de même indice · tirage A4 ${bv.join('×')} pt avec preferCSSPageSize et polices incorporées · `
      + `tirage ${br.join('×')} pt SANS lui (le @page du gabarit est jeté : c'est ce que coûte le drapeau absent)`);
  return casse.length ? 1 : 0;
}

const args = process.argv.slice(2);
if (path.resolve(process.argv[1] ?? '') === path.resolve(fileURLToPath(import.meta.url))) {
  process.exit(args.includes('--self-test') ? await selfTest() : await principal(args));
}
