#!/usr/bin/env node
// promesses-verifiees — ce fichier ADHÈRE au contrôle des promesses de commentaire
// (`oracle-promesses`, règle PR1 du pilot) : une classe ou un attribut nommé dans un commentaire
// ici DOIT exister dans le code. Un générateur de page est l'endroit où une promesse de prose coûte
// le plus cher — elle s'y lit comme une garantie de ce que la page contient. Signé le 23/08/2026,
// choix humain « signer tout ce qui est propre dans les forges » ; joué avant signature, zéro constat.
//
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
import { allouerIndice } from './allouer-indice.mjs';

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

// Les 8 sections de la fiche (structure du profil de référence, généralisée).
// Une cellule peut être une FONCTION quand sa valeur se déduit d'autres champs — cf. le couple
// porteur / Business Owner ci-dessous, que le gabarit doit poser plutôt que laisser deviner.
const S = (titre, rows) => `<section><h2>${titre}</h2><table><tbody>
${rows.map(([label, key, ph]) => `<tr><th>${label}</th><td>${typeof key === 'function' ? key() : V(key, ph)}</td></tr>`).join('')}
</tbody></table></section>`;

// PORTEUR ET BUSINESS OWNER — LE GABARIT POSE LA QUESTION (TF-0693, second point).
// Le canevas laissait les deux champs se remplir à l'identique EN SILENCE. Quand les deux rôles
// sont tenus par la même personne, il n'y a AUCUNE relecture croisée entre construire et valider :
// c'est un fait qu'un responsable sécurité devrait LIRE, pas déduire en comparant deux lignes. La
// phrase a dû être ajoutée à la main sur une fiche réelle le 27/08 — elle est ici désormais.
const memePersonne = data.porteur !== undefined && data.business_owner !== undefined
  && String(data.porteur).trim().toLowerCase() === String(data.business_owner).trim().toLowerCase();
const celluleOwner = () => (data.business_owner === undefined
  ? V('business_owner', 'BUSINESS_OWNER — qui VALIDE la mise à disposition ; si c\'est le porteur lui-même, l\'écrire : le dire est le contrôle')
  : esc(data.business_owner) + (memePersonne
    ? ' — <b>même personne que le porteur : aucune relecture croisée entre construire et valider.</b>'
    : ''));

// MARQUE DE DESTINATAIRE (corollaire de TF-0504, 22/08/2026) : un generateur qui rend un livrable
// pose la marque s'il ne l'herite pas d'un gabarit. Sans elle, la regle R-2 du pilot ne voit pas le
// document et son mauvais rangement passe inapercu — c'est ce qui s'est produit le 22/08. C'est une
// ligne, et elle est ici plutot que dans la memoire du producteur.
const htmlAvec = (jour, indice) => {
  // LA RÉFÉRENCE EST CALCULÉE, JAMAIS SAISIE (TF-0693). Elle l'était par un champ de données :
  // le nom du fichier et la référence imprimée DANS la fiche divergeaient donc en silence, et la
  // divergence ne se voit qu'en ouvrant les deux. Elle se dérive maintenant du MÊME couple
  // (jour, indice) que le nom de sortie — il n'y a plus deux sources à tenir d'accord.
  const ref = `${cfg.tenant.short_code}-SEC-DEV-${jour}${indice}`;
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="destinataire" content="humain">
<title>${esc(cfg.tenant.name)} — Fiche sécurité de mise à disposition (DEV)</title><style>${themeCss}
.wrap{max-width:960px;margin:0 auto;padding:24px}h1{font-size:22px}h2{font-size:15px;margin:22px 0 6px;color:var(--accent)}
/* LARGEUR DE LA COLONNE D'INTITULÉS (TF-0697, 27/08/2026) — mesuré avant correction : 34 %
   de la page réservés à des intitulés courts pendant que la colonne de droite porte des
   paragraphes entiers. Deux corrections, et la seconde est celle qu'on oublie :
     · width:20% — une seule contrainte réelle existait, l'intitulé le plus long, qui passe
       désormais sur deux lignes : une ligne coûtée à UNE cellule au lieu d'en coûter à toutes ;
     · table-layout:fixed — sans lui la largeur déclarée n'est qu'un VŒU, le moteur ré-élargit
       la colonne dès qu'un libellé s'allonge, et la déclaration ment ;
     · overflow-wrap:break-word — une URL sans espace ne doit pas rouvrir la table de force. */
table{border-collapse:collapse;width:100%;table-layout:fixed}
th,td{border:1px solid var(--line);padding:7px 10px;font-size:12.5px;text-align:left;vertical-align:top}
th{background:var(--bg);width:20%}td{overflow-wrap:break-word}
.ph{color:var(--maj);font-family:var(--font-mono);font-size:11.5px}
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
<span class="muted small">Réf. ${ref} · validée par ${esc(cfg.roles?.security_officer ?? 'le responsable sécurité')} · accompagne le rapport d'audit · core ${esc(String(cfg.core_version))}</span></header>
<h1>Fiche sécurité — ${V('projet', 'NOM_PROJET')}</h1>
${S('1 · Identification', [['Application / trigramme', 'projet'], ['Objet métier', 'objet'], ['Équipe / responsable', 'equipe'], ['Porteur (construit)', 'porteur'], ['Business Owner (valide)', celluleOwner], ['Lien environnement DEV', 'lien_dev']])}
${S('2 · Environnement & hébergement', [['Hébergement', 'hebergement'], ['Environnements actifs', 'environnements'], ['IaC / provisionnement', 'iac']])}
${S('3 · Sensibilité & conformité', [['Classification des données', 'classification'], ['Données personnelles (PII)', 'pii'], ['Juridiction(s) applicable(s)', 'juridictions'], ['Analyses requises (impact, IA)', 'analyses']])}
${S('4 · Criticité', [['Criticité métier', 'criticite'], ['Disponibilité attendue', 'disponibilite'], ["Impact en cas d'incident", 'impact']])}
${S('5 · Exposition', [['Exposition réseau (interne/externe)', 'exposition'], ["Point de contrôle d'entrée", 'point_controle'], ['Authentification', 'authentification']])}
${S('6 · IA / LLM', [["Brique d'IA présente", 'ia_presente'], ['Modèle(s) et usage', 'ia_usage'], ['Garde-fous & supervision humaine', 'ia_gardefous']])}
${S('7 · Contrat de service & observabilité', [['Journalisation & traces', 'observabilite'], ['Alerting', 'alerting'], ['Sauvegardes (RPO/RTO)', 'sauvegardes']])}
${S('8 · FinOps', [['Étiquetage / imputation', 'tags'], ['Budget & alertes de coût', 'budget']])}
<footer class="muted small" style="margin-top:26px;border-top:1px solid var(--line);padding-top:10px">
Réf. ${ref} — généré par AuditCore build-fiche (M9) pour ${esc(cfg.tenant.name)}. 0 placeholder exigé avant diffusion : les champs affichés en <span class="ph">chasse fixe</span> restent à compléter.
<!-- La phrase ci-dessus ne CITE pas la syntaxe de gabarit : un littéral à doubles accolades dans
     le texte de pied ferait échouer la règle « 0 placeholder résiduel » du vérificateur sur une
     fiche pourtant complète — le document se signalerait lui-même comme un trou à combler.
     C'est la même leçon que la règle P0 du lint d'agnosticité, et elle a mordu ici le 02/09. -->
Porte de diffusion : <code>node oracles/verifier-fiche-securite.mjs &lt;cette fiche&gt;</code> → exit 0. Le PDF de diffusion est IMPRIMÉ depuis ce HTML, jamais capturé.</footer>
</div></body></html>`;
};

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

// ---- L'INDICE EST ALLOUÉ, PAS ESPÉRÉ (TF-0693, 27/08/2026) --------------------------------
//
// LE FAIT. Le gabarit décrivait la MISE EN PAGE d'une fiche ; rien dans la famille ne disait
// comment nommer ses itérations successives, alors qu'une fiche est régénérée plusieurs fois
// dans la journée où on l'écrit. Mesuré sur un produit : QUATRE ÉCRASEMENTS du même nom en
// 80 minutes, dont deux poussés — et le premier signal reçu a été une question humaine à la
// relecture (« pourquoi la règle de nouvel indice n'est-elle pas respectée ? »). La question
// portait sur le NOM du livrable, pas sur son contenu : personne ne voyait les pertes.
//
// LE CONTRAT (`tools/allouer-indice.mjs`) : rien pour ce jour → `a` ; MÊME contenu qu'un
// fichier du jour → SON indice (une régénération à contenu inchangé n'est pas une nouvelle
// version) ; sinon → l'indice suivant. La comparaison neutralise l'indice, sans quoi la
// référence imprimée DANS la fiche ferait différer deux contenus identiques d'une lettre.
const produitIdx = process.argv.indexOf('--produit');
const slug = cfg.tenant.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
const auj = new Date();
const jourDuJour = `${auj.getFullYear()}${String(auj.getMonth() + 1).padStart(2, '0')}${String(auj.getDate()).padStart(2, '0')}`;
let out, jour = jourDuJour, indice = 'a';
if (outIdx > -1) {
  // `--out` reste honoré TEL QUEL (build-kit.mjs en dépend, et il rend dans un temporaire).
  // Si le nom donné est daté, son indice fait foi ; sinon la référence porte le jour et `a`.
  out = path.resolve(process.argv[outIdx + 1]);
  const m = /(\d{8})([a-z])(?=\.[A-Za-z0-9]+$)/.exec(path.basename(out));
  if (m) { jour = m[1]; indice = m[2]; }
} else if (produitIdx > -1) {
  const racine = process.argv[produitIdx + 1];
  if (!racine || !fs.existsSync(racine)) { console.error(`racine de produit introuvable : ${racine}\n${USAGE}`); process.exit(2); }
  const famille = familleAudit(racine);
  const prefixe = `fiche-securite-${slug}-`;
  indice = allouerIndice({ dossier: famille, prefixe, jour, contenu: htmlAvec(jour, 'a'), extension: '.html' });
  out = path.join(famille, `${prefixe}${jour}${indice}.html`);
} else {
  // Le refus est le correctif. Ecrire « quelque part par defaut » a produit un livrable hors
  // `output\`, invisible au controle, trouve par relecture humaine.
  console.error('destination non dite : un livrable ne nait pas dans le depot de la forge (TF-0505).\n' +
    "Donner `--produit <racine du produit>` pour rendre dans la famille `NN-audit` de son `output\\`, " +
    'ou `--out <fichier.html>` pour un cas particulier.\n' + USAGE);
  process.exit(2);
}
const html = htmlAvec(jour, indice);
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html, 'utf-8');
console.log(`✔ fiche sécurité: 8 sections ${dIdx > -1 ? '(remplie)' : '(squelette à compléter)'} `
  + `— réf. ${cfg.tenant.short_code}-SEC-DEV-${jour}${indice} → ${out}`);

// ---- LES DEUX FORMATS DANS LA MEME PASSE (TF-0506) — ET LE PDF EST *IMPRIMÉ* (TF-0700) ----
//
// Le catalogue de la bibliotheque declare deux formats pour cette famille — html ET pdf — et la
// forge n'en produisait qu'un. Ce n'etait pas une omission de documentation : LE JEU DE
// LIVRABLES A ETE REMIS INCOMPLET le 22/08, et c'est LE COMMANDITAIRE qui a du reclamer le
// second format. Un jeu incomplet ne se remet pas : les deux formats se rendent dans la MEME
// passe, ou la passe le dit.
//
// CE QUI CHANGE LE 02/09 (TF-0700). L'impression vit desormais dans UN SEUL outil,
// `tools/fiche-en-pdf.mjs`, que ce generateur appelle et que le kit distribue au projet audite.
// Deux raisons, et la seconde est la vraie :
//   1. le tirage exige `preferCSSPageSize` — sans ce reglage, le moteur impose SES format et
//      marges et IGNORE le `@page{size:A4;margin:8mm}` du gabarit (mesure du 02/09 sur la fiche
//      d'exemple : 612x792 pt, soit US Letter, contre 595x842 pt avec) ;
//   2. surtout, le kit ne fournissait AUCUN moyen de produire le format REELLEMENT DIFFUSE.
//      Un format qu'aucun outil ne produit est un format qu'on refait a la main, quand on y
//      pense : le PDF parti a l'equipe securite le 24/07 etait une CAPTURE rasterisee — 0
//      caractere extractible, 9 images, 653 Ko contre 124 Ko imprime, muette pour un lecteur
//      d'ecran — et d'un indice anterieur au HTML depose a cote.
//
// Les garde-fous restent, et ils sont dans l'outil : le tirage est RELU dans le fichier (format,
// pages, fraicheur — c'est la fraicheur qui attrape le verrou Windows), l'indice du PDF est
// celui du HTML par construction, et l'absence de moteur d'impression rend un SKIP MOTIVE
// (code 3), jamais un PASS silencieux.
const sansPdf = process.argv.includes('--sans-pdf');
if (sansPdf) {
  // Un ecart DECLARE, pas un oubli : le drapeau existe pour que « HTML seul » soit un choix
  // qu'on lit dans la commande, jamais un silence qu'on decouvre a la remise.
  console.log('— PDF non rendu : --sans-pdf demande. Le jeu remis est INCOMPLET au regard du ' +
    'catalogue (formats html + pdf) — le dire au destinataire fait partie de la remise.');
} else {
  const r = spawnSync(process.execPath, [rel('tools', 'fiche-en-pdf.mjs'), out, '--pages-max', '1'],
    { encoding: 'utf-8', stdio: 'inherit' });
  if (r.status !== 0) {
    if (r.status === 3) console.error(`  Le HTML, lui, est ecrit : ${out}. Assumer l'ecart avec --sans-pdf.`);
    process.exit(r.status ?? 1);
  }
}
