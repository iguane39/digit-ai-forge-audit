#!/usr/bin/env node
// promesses-verifiees — ce fichier ADHÈRE au contrôle des promesses de commentaire
// (`oracle-promesses`, règle PR1 du pilot) : une classe ou un attribut nommé dans un commentaire
// ici DOIT exister dans le code. Un générateur de page est l'endroit où une promesse de prose coûte
// le plus cher — elle s'y lit comme une garantie de ce que la page contient. Signé le 23/08/2026,
// choix humain « signer tout ce qui est propre dans les forges » ; joué avant signature, zéro constat.
//
// AuditCore — génère theme.css + header.html depuis la config tenant (PADR-0004 : thème unique).
// Priorité couleurs : DESIGN.md (charte forge) > branding.colors inline.
// Priorité typographie (TF-1000, 14/09/2026) : branding.typography déclarée EXPLICITEMENT dans
// tenant.yaml > DESIGN.md. L'inverse a fait rendre un rapport client dans la police d'une charte
// FICTIVE : un espace de travail réel avait hérité de `design_md: DESIGN.md` (le fichier d'exemple
// livré avec la forge) resté en place alors que `tenant.yaml`, lui, avait été personnalisé — le
// merge faisait gagner le reliquat de scaffold sur la déclaration réelle, sans qu'aucune porte ne
// le voie. DESIGN.md reste la référence pour tout ce que tenant.yaml NE déclare PAS.
// ── TF-1020 (17/09/2026) : LA POLICE DU CORPS VOYAGE AVEC LE LIVRABLE ──────────────────────
// Le nombre de pages d'un tirage dépend de la police que le moteur d'impression SUBSTITUE
// réellement, pas de celle que la CSS nomme. La pile du thème ne nommait que des polices DU POSTE
// (system-ui, Segoe UI, Roboto, Arial) : sous Windows la fiche sécurité tenait sur une page, sur
// le runner Linux — où aucune des quatre n'est installée — le moteur retombait sur DejaVu Sans,
// plus large, et le juge P3 refusait un tirage de DEUX pages (run 34581219111, 11/09/2026). Neuf
// publications rouges d'affilée, et le poste qui produit ne pouvait pas voir le défaut.
// La correction : `theme.css` porte ses `@font-face` en base64 (assets/polices/, licence jointe),
// donc AUCUN téléchargement au rendu et aucun fichier à côté — le HTML reste autoportant.
// Ce qui n'est PAS fait ici, et c'est délibéré : forcer la police embarquée en tête de la pile
// d'un tenant qui a déclaré la sienne. TF-1000 a coûté un rapport rendu dans la police d'une
// charte fictive ; la déclaration du tenant prime, et `tools/verifier.mjs` DIT alors que son
// tirage redevient dépendant du poste au lieu de le laisser croire reproductible.
// Usage: node tools/build-theme.mjs <tenant.yaml> [--out <dir>]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadTenant, frontmatter } from './lib.mjs';

export const RACINE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Les faces embarquées : famille CSS, graisse, fichier versionné sous `assets/polices/`.
 *
 * LE NOM DE FAMILLE EST UN NOM QU'AUCUN POSTE NE PEUT POSSÉDER, et c'est délibéré. Déclarée sous
 * son vrai nom (« Roboto »), la face incorporée cohabiterait avec ce que la machine appelle
 * « Roboto » : mesuré ici le 17/09/2026, sur un poste où Roboto n'est installé NI pour la machine
 * NI pour l'utilisateur, le moteur rend quand même `font-family:Roboto` à une largeur à lui
 * (183,52 px contre 183,64 px pour la face incorporée, sur le même texte). Deux faces sous un même
 * nom, et plus aucun moyen de PROUVER laquelle a servi. Sous « AuditCore Sans », le tirage n'a
 * qu'une résolution possible — celle qui voyage dans le fichier. La police EST Roboto : son fichier,
 * sa licence et sa provenance sont dans `assets/polices/`, rien n'est masqué.
 */
export const POLICES_EMBARQUEES = [
  { famille: 'AuditCore Sans', origine: 'Roboto', poids: 400, fichier: 'roboto-latin-400-normal.woff2' },
  { famille: 'AuditCore Sans', origine: 'Roboto', poids: 700, fichier: 'roboto-latin-700-normal.woff2' },
];

/**
 * Les familles réellement embarquables ICI — MESURÉES (le fichier est sur le disque), jamais
 * déclarées : une liste écrite à la main resterait vraie après la disparition du fichier, et le
 * thème se dirait reproductible en ne l'étant plus. Exportée pour que `tools/verifier.mjs` dise
 * la même vérité que ce qu'il embarque.
 */
export function famillesEmbarquees(racine = RACINE) {
  const vues = [];
  for (const p of POLICES_EMBARQUEES) {
    if (!fs.existsSync(path.join(racine, 'assets', 'polices', p.fichier))) continue;
    if (!vues.includes(p.famille)) vues.push(p.famille);
  }
  return vues;
}

/**
 * Le bloc `@font-face` du thème, police incorporée en base64. Un fichier manquant n'est pas
 * comblé en silence : le thème sortirait dépendant des polices du poste sans que rien ne le dise
 * — exactement le défaut TF-1020. On REFUSE de générer.
 */
export function fontFaceEmbarquee(racine = RACINE) {
  return POLICES_EMBARQUEES.map((p) => {
    const chemin = path.join(racine, 'assets', 'polices', p.fichier);
    if (!fs.existsSync(chemin))
      throw new Error(`police embarquée introuvable : ${path.relative(racine, chemin)} — sans elle le `
        + `thème dépendrait des polices du poste et un tirage jugé sur son nombre de pages sortirait `
        + `différemment d'une machine à l'autre (TF-1020). Restaurer le fichier, ou retirer la face de `
        + `POLICES_EMBARQUEES en assumant la dépendance.`);
    const b64 = fs.readFileSync(chemin).toString('base64');
    return `/* ${p.famille} ${p.poids} = ${p.origine}, ${p.fichier} (SIL OFL 1.1) */\n`
      + `@font-face{font-family:'${p.famille}';font-style:normal;font-weight:${p.poids};`
      + `src:url(data:font/woff2;base64,${b64}) format('woff2');}`;
  }).join('\n');
}

/** Génère theme.css + header.html pour un tenant. Retourne {outDir, css, header, domains}. */
export function genererTheme(file, outArg) {
  const { cfg, tenantDir, resolveRef } = loadTenant(file);
  const outDir = outArg ? path.resolve(outArg) : path.join(tenantDir, 'theme');

  let colors = { ...(cfg.branding?.colors ?? {}) };
  const typographieExplicite = { ...(cfg.branding?.typography ?? {}) };
  let typography = { ...typographieExplicite };
  if (cfg.branding?.design_md) {
    const dm = resolveRef(cfg.branding.design_md);
    if (fs.existsSync(dm)) {
      const fm = frontmatter(dm) ?? {};
      colors = { accent: fm.colors?.primary, ink: fm.colors?.ink, ...colors, ...(fm.colors ?? {}) };
      // TF-1000 : DESIGN.md ne comble que ce que tenant.yaml n'a PAS déclaré explicitement.
      typography = { ...(fm.typography ?? {}), ...typographieExplicite };
    }
  }
  const c = (k, d) => colors[k] ?? d;
  const domains = cfg.domains ?? [];

  const css = `/* AuditCore theme — généré pour ${cfg.tenant.name} (ne pas éditer à la main, PADR-0004) */
/* Polices INCORPORÉES (TF-1020) — assets/polices/, SIL OFL 1.1, licence jointe au dépôt.
   En base64 : aucun téléchargement au rendu, aucun fichier à côté, tirage identique sur tout
   poste. Sans elles, le nombre de pages d'un tirage dépend de ce qui est installé sur la
   machine qui imprime, et le juge de pages refuse chez celui qui vérifie. */
${fontFaceEmbarquee()}
:root{
  --bg:${c('panel-bg', c('background', '#f4f6f9'))}; --panel:#fff; --line:#dce3ec;
  --txt:${c('ink', '#1b2733')}; --muted:#5f7081;
  --accent:${c('accent', c('primary', '#2563eb'))};
  --fatal:${c('fatal', '#a3231c')}; --bloq:${c('bloquant', '#9a4a06')};
  --maj:${c('majeur', '#8a6500')}; --std:${c('standard', '#136e34')};
${domains.map(d => `  --dom-${d.key}:${d.color ?? 'var(--accent)'};`).join('\n')}
  --font-body:${typography.body ?? typography.heading ?? 'Roboto, system-ui, sans-serif'};
  --font-mono:${typography.mono ?? 'JetBrains Mono, Consolas, monospace'};
}
body{font-family:var(--font-body);color:var(--txt);background:var(--bg);}
code,pre{font-family:var(--font-mono);}
.brand{background:${c('brand-bg', '#1A1A1A')};color:#fff;font-weight:700;border-radius:6px;
  display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;}
.badge-fatal{color:var(--fatal)}.badge-bloq{color:var(--bloq)}.badge-maj{color:var(--maj)}.badge-std{color:var(--std)}
`;

  const header = `<!-- AuditCore header — généré pour ${cfg.tenant.name} -->
<header class="ac-header">
  <span class="brand">${cfg.tenant.short_code}</span>
  <span class="ac-title">${cfg.tenant.name} — {{document.titre}}</span>
  <span class="ac-meta">core {{core_version}} · {{date}}{{indice}}</span>
</header>
`;

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'theme.css'), css, 'utf-8');
  fs.writeFileSync(path.join(outDir, 'header.html'), header, 'utf-8');
  return { outDir, css, header, domains };
}

function principal(argv) {
  const file = argv[0];
  if (!file) { console.error('Usage: node tools/build-theme.mjs <tenant.yaml> [--out <dir>]'); return 2; }
  const outIdx = argv.indexOf('--out');
  const outArg = outIdx > -1 ? argv[outIdx + 1] : undefined;
  const { outDir, css, domains } = genererTheme(file, outArg);
  console.log(`✔ thème généré → ${outDir} (theme.css ${css.length} o, header.html) — ${domains.length} couleurs de domaines`);
  return 0;
}

// ── Auto-test à double sens (TF-1000) ───────────────────────────────────────────────────────
// ROUGE : le scénario réel du 09/09 rejoué en fixture — tenant.yaml déclare une police EXPLICITE,
// DESIGN.md (scaffold resté en place) en déclare une autre. Sans la correction, DESIGN.md gagnait
// toujours et le rapport se serait rendu dans la police fictive.
// VERT : sans déclaration explicite au tenant, DESIGN.md comble toujours le vide (repli intact).
function selfTest() {
  const casse = [];
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-theme-st-'));
  fs.writeFileSync(path.join(dir, 'DESIGN.md'),
    '---\nname: Fictif\nversion: 1.0.0\ncolors: { primary: "#3B5BDB" }\n'
    + 'typography: { body: "Segoe UI, Arial, sans-serif" }\n---\n# fictif\n', 'utf-8');

  const tenantExplicite = path.join(dir, 'tenant-explicite.yaml');
  fs.writeFileSync(tenantExplicite,
    'schema_version: 1\ncore_version: "1.0.x"\ntenant: { name: "T", short_code: "T", language: fr }\n'
    + 'branding:\n  design_md: DESIGN.md\n  colors: { accent: "#000" }\n'
    + '  typography: { body: "DM Sans, system-ui" }\ndomains: []\n', 'utf-8');
  const outA = genererTheme(tenantExplicite, path.join(dir, 'out-a')).outDir;
  const cssA = fs.readFileSync(path.join(outA, 'theme.css'), 'utf-8');
  if (!cssA.includes('--font-body:DM Sans, system-ui;'))
    casse.push(`typographie explicite du tenant écrasée par DESIGN.md : ${cssA.match(/--font-body:[^;]+/)?.[0]}`);
  if (cssA.includes('Segoe UI'))
    casse.push('le theme.css porte encore la police du DESIGN.md fictif alors que le tenant en déclare une explicitement (défaut TF-1000)');

  const tenantSansTypo = path.join(dir, 'tenant-sans-typo.yaml');
  fs.writeFileSync(tenantSansTypo,
    'schema_version: 1\ncore_version: "1.0.x"\ntenant: { name: "T", short_code: "T", language: fr }\n'
    + 'branding:\n  design_md: DESIGN.md\n  colors: { accent: "#000" }\ndomains: []\n', 'utf-8');
  const outB = genererTheme(tenantSansTypo, path.join(dir, 'out-b')).outDir;
  const cssB = fs.readFileSync(path.join(outB, 'theme.css'), 'utf-8');
  if (!cssB.includes('--font-body:Segoe UI, Arial, sans-serif;'))
    casse.push(`sans typographie déclarée au tenant, le repli sur DESIGN.md est cassé : ${cssB.match(/--font-body:[^;]+/)?.[0]}`);

  // ── TF-1020 · LA POLICE VOYAGE AVEC LE LIVRABLE ────────────────────────────────────────────
  // VERT : chaque face déclarée sort en @font-face INCORPORÉ — base64, jamais une URL. Une URL
  // ferait dépendre le tirage du réseau du poste qui imprime, au lieu de ses polices : le même
  // défaut déplacé d'un cran.
  const familles = famillesEmbarquees();
  if (familles.length !== 1 || familles[0] !== 'AuditCore Sans')
    casse.push(`familles embarquées mesurées : ${familles.join(', ') || '(aucune)'} — attendu `
      + `« AuditCore Sans » (fichiers sous assets/polices/)`);
  for (const p of POLICES_EMBARQUEES) {
    const re = new RegExp(`@font-face\\{font-family:'${p.famille}';font-style:normal;font-weight:${p.poids};`
      + `src:url\\(data:font/woff2;base64,[A-Za-z0-9+/=]{5000,}\\) format\\('woff2'\\);\\}`);
    if (!re.test(cssA)) casse.push(`la face ${p.famille} ${p.poids} n'est pas incorporée en base64 dans le thème`);
  }
  if (/@font-face[\s\S]{0,200}url\((?!data:)/.test(cssA))
    casse.push('une face du thème pointe une URL au lieu d\'être incorporée : le tirage dépendrait du '
      + 'réseau du poste qui imprime');
  // ROUGE : la police disparue, le thème REFUSE de sortir. Sans ce refus il sortirait dépendant
  // des polices du poste sans que rien ne le dise — le défaut TF-1020 lui-même, en silence.
  let refus = null;
  try { fontFaceEmbarquee(path.join(dir, 'racine-sans-polices')); } catch (e) { refus = e.message; }
  if (!refus) casse.push('un thème SANS police embarquée est généré en silence : le tirage redeviendrait '
    + 'dépendant du poste sans que rien ne le signale (défaut TF-1020)');
  else if (!/TF-1020/.test(refus)) casse.push(`le refus ne dit pas de quel défaut il protège : ${refus}`);

  fs.rmSync(dir, { recursive: true, force: true });
  console.log(casse.length
    ? 'SELF-TEST FAIL : ' + casse.join(' · ')
    : "Self-test build-theme : 5/5 PASS — typographie explicite du tenant priorisée sur un DESIGN.md "
      + "de scaffold (TF-1000) · repli sur DESIGN.md intact quand rien n'est déclaré · "
      + `${POLICES_EMBARQUEES.length} face(s) incorporée(s) en base64, aucune URL (TF-1020) · `
      + 'police manquante = génération REFUSÉE, jamais un thème muet');
  return casse.length ? 1 : 0;
}

const args = process.argv.slice(2);
if (path.resolve(process.argv[1] ?? '') === path.resolve(fileURLToPath(import.meta.url))) {
  process.exit(args[0] === '--self-test' ? selfTest() : principal(args));
}
