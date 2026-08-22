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
import { execFileSync } from 'node:child_process';
import { rel, loadTenant, loadJson } from './lib.mjs';

const tenantYaml = process.argv[2];
const USAGE = 'Usage: node tools/build-fiche.mjs <tenant.yaml> [--data <fiche-data.json>] (--produit <racine> | --out <fichier.html>)';
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
