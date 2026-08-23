#!/usr/bin/env node
// AuditCore — build-fiche (RAF-004 / M9) : fiche sécurité de mise à disposition rendue en HTML
// thémé. Sans données → squelette à compléter ({{placeholders}}) ; avec --data <json> → rempli.
// Usage: node tools/build-fiche.mjs <tenant.yaml> [--data <fiche-data.json>]
//                                    (--produit <racine> | --out <fichier.html>)
//
// OU LE LIVRABLE VA (TF-0505, 22/08/2026). La destination par defaut etait
// `deliverables/generated/<tenant>/fiche-securite.html`, c'est-a-dire DANS LE DEPOT DE LA FORGE,
// sous une arborescence de travail. TF-0319 nomme ce cas mot pour mot : « pas au fond de dossiers
// de travail imbriques ou l'utilisateur doit naviguer et finit par se perdre ». `--out` existait,
// mais RIEN N'EXIGEAIT DE S'EN SERVIR — et un chemin par defaut est le chemin qui sera pris.
// Mesure : la fiche du 22/08 a fini a la racine du produit, hors `output\`, en violation de R-2 et
// R-39, et aucun oracle ne pouvait le voir faute de marque de destinataire (TF-0504).
//
// La regle est desormais : `--produit <racine>` resout la famille `NN-audit` d'`output\` du
// PRODUIT (R-39 al. 1-2 : numero local stable, reutilise s'il existe) ; `--out` reste pour les cas
// particuliers, dont `build-kit.mjs` qui rend dans un temporaire. Et SANS L'UN DES DEUX, LE
// GENERATEUR REFUSE : il n'ecrit plus jamais un livrable dans le depot de la forge. Un defaut
// commode est ce qui a produit le defaut.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { rel, loadTenant, loadJson } from './lib.mjs';

const tenantYaml = process.argv[2];
const USAGE = 'Usage: node tools/build-fiche.mjs <tenant.yaml> [--data <fiche-data.json>] (--produit <racine> | --out <fichier.html>) [--sans-pdf]';
if (!tenantYaml) { console.error(USAGE); process.exit(2); }
const { cfg, tenantDir } = loadTenant(tenantYaml);
const dIdx = process.argv.indexOf('--data');
const outIdx = process.argv.indexOf('--out');
const data = dIdx > -1 ? loadJson(path.resolve(process.argv[dIdx + 1])) : {};
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const V = (k, ph) => data[k] !== undefined ? esc(data[k]) : `<span class="ph">{{${ph ?? k}}}</span>`;

const themePath = path.join(tenantDir, 'theme', 'theme.css');
if (!fs.existsSync(themePath))
  execFileSync(process.execPath, [rel('tools', 'build-theme.mjs'), path.resolve(tenantYaml), '--out', path.join(tenantDir, 'theme')], { stdio: 'ignore' });
const themeCss = fs.readFileSync(themePath, 'utf-8');

// Les 8 sections de la fiche (structure du profil de référence, généralisée)
const S = (titre, rows) => `<section><h2>${titre}</h2><table><tbody>
${rows.map(([label, key, ph]) => `<tr><th>${label}</th><td>${V(key, ph)}</td></tr>`).join('')}
</tbody></table></section>`;

// MARQUE DE DESTINATAIRE (corollaire de TF-0504, 22/08/2026) : un generateur qui rend un livrable
// pose la marque s'il ne l'herite pas d'un gabarit. Sans elle, la regle R-2 du pilot ne voit pas le
// document et son mauvais rangement passe inapercu — c'est ce qui s'est produit le 22/08. C'est une
// ligne, et elle est ici plutot que dans la memoire du producteur.
const html = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="destinataire" content="humain">
<title>${esc(cfg.tenant.name)} — Fiche sécurité de mise à disposition (DEV)</title><style>${themeCss}
.wrap{max-width:960px;margin:0 auto;padding:24px}h1{font-size:22px}h2{font-size:15px;margin:22px 0 6px;color:var(--accent)}
table{border-collapse:collapse;width:100%}th,td{border:1px solid var(--line);padding:7px 10px;font-size:12.5px;text-align:left;vertical-align:top}
th{background:var(--bg);width:34%}.ph{color:var(--maj);font-family:var(--font-mono);font-size:11.5px}
.muted{color:var(--muted)}.small{font-size:11.5px}
/* ECR-08 — la fiche doit tenir sur UNE page A4. Trois pièges, tous corrigés ici :
   1. hauteur dimensionnée par le CONTENU — pas de min-height:297mm : avec des marges,
      une hauteur forcée pousse TOUJOURS sur une 2e page (à l'impression comme à la capture) ;
   2. @page{margin} explicite — sinon la marge par défaut du dialogue navigateur s'ajoute ;
   3. overflow:visible — ne jamais couper silencieusement le contenu d'un projet volumineux :
      un débordement doit se voir, pas disparaître. */
@media print{
  html,body{background:#fff;margin:0;padding:0}
  @page{size:A4 portrait;margin:8mm}
  .wrap{width:auto;max-width:none;min-height:0;overflow:visible;margin:0;padding:0}
  section{break-inside:avoid}
  /* Rythme vertical compact : les 8 sections renseignées tiennent sur UNE page A4.
     Réglé contre l'oracle de rendu (compte de pages du PDF A4), pas à l'estime. */
  h1{font-size:19px;margin:6px 0}
  h2{margin:9px 0 3px}
  th,td{padding:3px 7px;font-size:10.5px}
  header{font-size:11px}
}
</style></head><body><div class="wrap">
<header><span class="brand">${esc(cfg.tenant.short_code)}</span> <b>${esc(cfg.tenant.name)} — Fiche sécurité de mise à disposition (environnement de développement)</b><br>
<span class="muted small">Réf. ${V('reference', 'TRI-SEC-DEV-AAAAMMJJa')} · validée par ${esc(cfg.roles?.security_officer ?? 'le responsable sécurité')} · accompagne le rapport d'audit · core ${esc(String(cfg.core_version))}</span></header>
<h1>Fiche sécurité — ${V('projet', 'NOM_PROJET')}</h1>
${S('1 · Identification', [['Application / trigramme', 'projet'], ['Objet métier', 'objet'], ['Équipe / responsable', 'equipe'], ['Lien environnement DEV', 'lien_dev']])}
${S('2 · Environnement & hébergement', [['Hébergement', 'hebergement'], ['Environnements actifs', 'environnements'], ['IaC / provisionnement', 'iac']])}
${S('3 · Sensibilité & conformité', [['Classification des données', 'classification'], ['Données personnelles (PII)', 'pii'], ['Juridiction(s) applicable(s)', 'juridictions'], ['Analyses requises (impact, IA)', 'analyses']])}
${S('4 · Criticité', [['Criticité métier', 'criticite'], ['Disponibilité attendue', 'disponibilite'], ["Impact en cas d'incident", 'impact']])}
${S('5 · Exposition', [['Exposition réseau (interne/externe)', 'exposition'], ["Point de contrôle d'entrée", 'point_controle'], ['Authentification', 'authentification']])}
${S('6 · IA / LLM', [["Brique d'IA présente", 'ia_presente'], ['Modèle(s) et usage', 'ia_usage'], ['Garde-fous & supervision humaine', 'ia_gardefous']])}
${S('7 · Contrat de service & observabilité', [['Journalisation & traces', 'observabilite'], ['Alerting', 'alerting'], ['Sauvegardes (RPO/RTO)', 'sauvegardes']])}
${S('8 · FinOps', [['Étiquetage / imputation', 'tags'], ['Budget & alertes de coût', 'budget']])}
<footer class="muted small" style="margin-top:26px;border-top:1px solid var(--line);padding-top:10px">
Généré par AuditCore build-fiche (M9) pour ${esc(cfg.tenant.name)} — 0 placeholder exigé avant diffusion (les champs <span class="ph">{{…}}</span> sont à compléter).</footer>
</div></body></html>`;

// La famille `NN-audit` d'`output\` du produit : reutilisee si elle existe (le numero est
// LOCALEMENT stable, R-39 al. 2), sinon creee au premier numero libre. On ne renumerote jamais une
// famille existante — un chemin qui bouge casse tous les liens deja ecrits.
const familleAudit = (racine) => {
  const output = path.join(path.resolve(racine), 'output');
  const existante = fs.existsSync(output)
    ? fs.readdirSync(output, { withFileTypes: true })
        .filter((e) => e.isDirectory() && /^\d{2}-.*audit/i.test(e.name))
        .map((e) => e.name).sort()[0]
    : null;
  if (existante) return path.join(output, existante);
  const pris = fs.existsSync(output)
    ? new Set(fs.readdirSync(output, { withFileTypes: true })
        .filter((e) => e.isDirectory()).map((e) => e.name.slice(0, 2)))
    : new Set();
  let n = 1;
  while (pris.has(String(n).padStart(2, '0'))) n++;
  return path.join(output, `${String(n).padStart(2, '0')}-audit`);
};

const produitIdx = process.argv.indexOf('--produit');
const slug = cfg.tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
let out;
if (outIdx > -1) out = path.resolve(process.argv[outIdx + 1]);
else if (produitIdx > -1) {
  const racine = process.argv[produitIdx + 1];
  if (!racine || !fs.existsSync(racine)) { console.error(`racine de produit introuvable : ${racine}\n${USAGE}`); process.exit(2); }
  out = path.join(familleAudit(racine), `fiche-securite-${slug}.html`);
} else {
  // Le refus est le correctif. Ecrire « quelque part par defaut » a produit un livrable hors
  // `output\`, invisible au controle, trouve par relecture humaine.
  console.error('destination non dite : un livrable ne nait pas dans le depot de la forge (TF-0505).\n' +
    "Donner `--produit <racine du produit>` pour rendre dans la famille `NN-audit` de son `output\\`, " +
    'ou `--out <fichier.html>` pour un cas particulier.\n' + USAGE);
  process.exit(2);
}
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html, 'utf-8');
console.log(`✔ fiche sécurité: 8 sections ${dIdx > -1 ? '(remplie)' : '(squelette à compléter)'} → ${out}`);

// ---- LES DEUX FORMATS DANS LA MEME PASSE (TF-0506, 23/08/2026) ---------------------------
//
// Le catalogue de la bibliotheque declare deux formats pour cette famille — html ET pdf — et la
// forge n'en produisait qu'un. Ce n'etait pas une omission de documentation : LE JEU DE
// LIVRABLES A ETE REMIS INCOMPLET le 22/08, et c'est LE COMMANDITAIRE qui a du reclamer le
// second format. Le PDF est ce qui circule en piece jointe et ce qui s'imprime ; le HTML est ce
// qui reste sur le poste. Un jeu incomplet ne se remet pas : les deux formats se rendent dans la
// MEME passe, ou la passe le dit.
//
// Aucune dependance, aucun binaire embarque : le moteur d'impression du navigateur DEJA PRESENT
// sur le poste, et la feuille de style du gabarit qui fait foi pour les marges (@page A4).
//
// TROIS GARDE-FOUS, tous les trois payes par un defaut reel du 22/08 :
//   1. le format et le nombre de pages sont RELUS DANS LE PDF PRODUIT, jamais deduits de la
//      commande — un code de retour 0 ne prouve pas qu'un octet a ete ecrit ;
//   2. la FRAICHEUR est verifiee (posterieur au lancement, posterieur a sa source) : c'est ce
//      controle qui attrape le verrou Windows, ou une visionneuse ouverte fait echouer
//      l'ecriture EN SILENCE et laisse revalider l'ancien tirage ;
//   3. SKIP MOTIVE si aucun navigateur n'est present — jamais un PASS silencieux, jamais un
//      echec impute au livrable. C'est deja la doctrine d'oracle-sca chez forge-websec.
const sansPdf = process.argv.includes('--sans-pdf');
const NAVIGATEURS = [
  process.env.FORGE_NAVIGATEUR,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean);

if (sansPdf) {
  // Un ecart DECLARE, pas un oubli : le drapeau existe pour que « HTML seul » soit un choix
  // qu'on lit dans la commande, jamais un silence qu'on decouvre a la remise.
  console.log('— PDF non rendu : --sans-pdf demande. Le jeu remis est INCOMPLET au regard du ' +
    'catalogue (formats html + pdf) — le dire au destinataire fait partie de la remise.');
} else {
  const navigateur = NAVIGATEURS.find((n) => { try { return fs.existsSync(n); } catch { return false; } });
  const pdf = out.replace(/\.html?$/i, '.pdf');
  if (!navigateur) {
    console.error('— PDF NON RENDU : aucun moteur d\'impression trouve. Cherches : ' +
      NAVIGATEURS.join(', ') + '. Poser FORGE_NAVIGATEUR sur le chemin d\'un navigateur ' +
      'Chromium, ou assumer l\'ecart avec --sans-pdf. Le HTML, lui, est ecrit : ' + out);
    process.exit(3);   // ni 0 (le jeu est incomplet) ni 1 (le livrable n'a rien fait de mal)
  }
  const lancement = Date.now();
  // Un ancien tirage encore la fausserait la relecture : on le retire AVANT, et si le retrait
  // echoue c'est deja le verrou — autant le dire tout de suite.
  if (fs.existsSync(pdf)) {
    try { fs.unlinkSync(pdf); } catch (e) {
      console.error(`— PDF NON RENDU : le tirage precedent ne peut pas etre remplace (${e.code}). ` +
        'Sous Windows, un PDF ouvert dans une visionneuse VERROUILLE le fichier : le navigateur ' +
        'echouerait a l\'ecrire sans le dire, et la relecture porterait sur l\'ancien tirage. ' +
        `Fermer la visionneuse et rejouer. HTML ecrit : ${out}`);
      process.exit(1);
    }
  }
  const r = spawnSync(navigateur, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer',
    `--print-to-pdf=${pdf}`, out], { encoding: 'utf-8', timeout: 120000 });
  const verif = spawnSync(process.execPath, [rel('oracles', 'verifier-pdf.mjs'), pdf,
    '--format', 'A4', '--apres', String(lancement), '--source', out, '--json-only'],
    { encoding: 'utf-8' });
  let rapport = null;
  try { rapport = JSON.parse((verif.stdout || '').trim()); } catch { /* illisible : traite plus bas */ }
  if (!rapport || rapport.verdict !== 'PASS') {
    console.error(`— PDF REFUSE (${rapport ? rapport.verdict : 'oracle illisible'}) : ` +
      (rapport ? rapport.findings.filter((f) => f.statut === 'FAIL').map((f) => `${f.regle} ${f.message}`).join(' | ')
               : (verif.stdout || verif.stderr || '').slice(0, 300)) +
      (r.status ? ` [moteur d'impression : code ${r.status}]` : ''));
    process.exit(1);
  }
  const ok = rapport.findings.filter((f) => f.statut === 'PASS').map((f) => f.regle).join('+');
  console.log(`✔ fiche sécurité (PDF) → ${pdf}  [relu dans le fichier : ${ok}]`);
}
