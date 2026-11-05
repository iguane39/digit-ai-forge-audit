// TF-2139 (RU-6) — le rapport HTML rendu par `rapport-engine.mjs` passe les oracles de design, et c'est jugé à sa production.
// Relevé d'une campagne du 04/11/2026 : `run-oracles-design` (forge-design) rendait FAIL sur le rapport —
// oracle-slop 11 écarts durs (bandeaux latéraux `border-left` de 3 et 4 px, accents #ede9fe #c4b5fd #dbeafe…,
// emoji dans l'interface) ; oracle-tokens 77 écarts durs (35 couleurs en dur, 42 espacements hors échelle 4pt).
// Or le hook de fin de tour exige la critique de tout HTML écrit.
//
// Deux familles de preuves :
//   · statiques (CI-sûres, sans forge-design) : la feuille de style du moteur ne porte AUCUNE couleur littérale hors
//     des blocs de jetons, aucun `border-left` de plus d'1 px, aucun espacement hors de l'échelle 4pt, aucun emoji ;
//   · exécutées (si forge-design est sur le poste) : `run-oracles-design` rend PASS sur les rapports rendus, et
//     `verifier-rapport-html` le joue — FAIL si une couleur en dur est réintroduite, NON JUGÉ dit tout haut si
//     l'oracle n'est pas sur le poste (un runner de CI ne clone pas les forges sœurs).
//
// Lancer : node --test tests/oracles/rapport-design.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');
const node = (args, opts = {}) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 180000, maxBuffer: 1e8, ...opts });
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'design-'));
const DESIGN = process.env.FORGE_DESIGN_ROOT ?? path.resolve(RACINE, '..', 'digit-ai-forge-design');
const designLa = fs.existsSync(path.join(DESIGN, 'oracles', 'run-oracles-design.mjs'));
const sautSansDesign = designLa ? false : 'forge-design absente de ce poste (FORGE_DESIGN_ROOT ou ../digit-ai-forge-design) — contrôle exécuté non jouable ici';

function rendre(nom, fixture) {
  const html = path.join(dossier, `${nom}.html`);
  const r = node([path.join(RACINE, 'tools', 'build-rapport.mjs'), path.join(RACINE, 'tests', 'fixtures', fixture), '--tenant', TENANT, '--out', html]);
  assert.equal(r.status, 0, r.stderr);
  return html;
}
const RAPPORTS = { valide: rendre('valide', 'rapport-data-valid.json'), riche: rendre('riche', 'rapport-data-riche.json') };

/** Les règles CSS d'un document : { selecteur, corps, tokens } — un bloc de jetons ne déclare que des --propriétés. */
function reglesCss(html) {
  const css = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/@font-face\s*\{[^}]*\}/g, '');
  const regles = [];
  for (const m of css.matchAll(/([^{}@][^{}]*)\{([^{}]*)\}/g)) {
    const corps = m[2].trim();
    const decls = corps.split(';').map((d) => d.trim()).filter(Boolean);
    regles.push({ selecteur: m[1].trim(), corps, tokens: decls.length > 0 && decls.every((d) => d.startsWith('--')) });
  }
  return regles;
}
const COULEUR_LITTERALE = /#[0-9a-fA-F]{3,8}\b|\brgba?\(|\bhsla?\(/;
const sansVar = (v) => v.replace(/var\([^()]*(?:\([^()]*\)[^()]*)*\)/g, ' ');

for (const [nom, fichier] of Object.entries(RAPPORTS)) {
  const html = fs.readFileSync(fichier, 'utf8');

  test(`TF-2139 statique (${nom}) — aucune couleur littérale hors des blocs de jetons (feuille de style ET attributs style)`, () => {
    const fautes = [];
    for (const r of reglesCss(html)) {
      if (r.tokens) continue;
      for (const d of r.corps.split(';')) {
        const m = /^\s*(color|background|background-color|border[\w-]*|outline[\w-]*|fill|stroke|caret-color|accent-color|text-decoration-color)\s*:\s*(.+)$/i.exec(d);
        if (m && COULEUR_LITTERALE.test(sansVar(m[2]))) fautes.push(`${r.selecteur.slice(0, 50)} { ${d.trim()} }`);
      }
    }
    for (const m of html.matchAll(/\sstyle="([^"]*)"/g)) {
      const dehors = sansVar(m[1]);
      if (COULEUR_LITTERALE.test(dehors) && /(color|background|border|fill|stroke)/i.test(dehors)) fautes.push(`style="${m[1].slice(0, 60)}"`);
    }
    assert.deepEqual(fautes, [], `${fautes.length} couleur(s) en dur : ${fautes.slice(0, 6).join(' | ')}`);
  });

  test(`TF-2139 statique (${nom}) — aucun bandeau latéral (border-left de plus d'1 px), aucun emoji dans l'interface`, () => {
    const bandeaux = reglesCss(html).filter((r) => /border-left\s*:\s*([2-9]|\d\d)\d*(\.\d+)?px/.test(r.corps)).map((r) => r.selecteur);
    assert.deepEqual(bandeaux, [], `bandeau(x) latéral(aux) : ${bandeaux.join(' | ')}`);
    const corps = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '').replace(/<link[^>]*>/g, '');
    const emojis = [...new Set(corps.match(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu) ?? [])];
    assert.deepEqual(emojis, [], `emoji(s) dans le document rendu : ${emojis.join(' ')} — utiliser une icône SVG dessinée`);
  });

  test(`TF-2139 statique (${nom}) — espacements en px sur l'échelle 4pt (margin, padding, gap), feuille de style et attributs style`, () => {
    const fautes = [];
    const verifie = (selecteur, corps) => {
      for (const m of corps.matchAll(/(?:^|[;{\s])(margin|padding|gap|row-gap|column-gap)(-top|-right|-bottom|-left|-block|-inline)?\s*:\s*([^;]+)/gi)) {
        if (/var\(|calc\(|clamp\(|auto|%/.test(m[3])) continue;
        for (const px of m[3].matchAll(/(-?[\d.]+)px/g)) {
          const v = Math.abs(parseFloat(px[1]));
          if (v !== 0 && v % 4 !== 0) fautes.push(`${selecteur.slice(0, 40)} ${m[1]}${m[2] ?? ''}:${px[0]}`);
        }
      }
    };
    for (const r of reglesCss(html)) verifie(r.selecteur, r.corps);
    for (const m of html.matchAll(/\sstyle="([^"]*)"/g)) verifie('style=""', m[1]);
    assert.deepEqual(fautes, [], `${fautes.length} espacement(s) hors 4pt : ${fautes.slice(0, 8).join(' | ')}`);
  });

  test(`TF-2139 exécuté (${nom}) — run-oracles-design rend PASS sur le rapport rendu`, { skip: sautSansDesign }, () => {
    const r = node([path.join(DESIGN, 'oracles', 'run-oracles-design.mjs'), fichier, '--json-only']);
    const rapport = JSON.parse(r.stdout);
    const durs = rapport.oracles.filter((o) => o.verdict === 'FAIL').map((o) => `${o.oracle} (${o.ecarts_durs} écarts durs : ${(o.findings ?? []).filter((f) => f.sev !== 'info' && f.sev !== 'avertissement').slice(0, 3).map((f) => f.msg).join(' ; ')})`);
    assert.equal(r.status, 0, `run-oracles-design ${rapport.verdict} sur le rapport ${nom} : ${durs.join(' | ')}`);
  });
}

// ── La couleur du moteur se DÉRIVE du tenant : un autre tenant, une autre palette, zéro littéral de plus ────
test('TF-2139 — la palette du schéma d\'architecture et du canevas suit les jetons du tenant (aucune teinte fixe)', () => {
  const html = fs.readFileSync(RAPPORTS.riche, 'utf8');
  const bloc = reglesCss(html).filter((r) => r.tokens).map((r) => r.corps).join(';');
  assert.match(bloc, /--c-blue-bg\s*:\s*color-mix\(/, 'les jetons du canevas ne sont pas dérivés des jetons du tenant');
  assert.match(html, /\.a-blue rect\s*\{[^}]*var\(--c-blue-bg\)/, 'la palette du schéma d\'architecture ne passe pas par les jetons dérivés du tenant');
  // un tenant dont l'accent change : l'accent du thème change, la dérivation reste en var()/color-mix
  const autre = path.join(dossier, 'autre-tenant.yaml');
  fs.writeFileSync(autre, fs.readFileSync(TENANT, 'utf8').replace('accent: "#3B5BDB"', 'accent: "#0B7A75"'), 'utf8');
  fs.cpSync(path.join(RACINE, 'config', 'tenants', 'exemple', 'DESIGN.md'), path.join(dossier, 'DESIGN.md'), { force: true });
  const out = path.join(dossier, 'autre.html');
  const r = node([path.join(RACINE, 'tools', 'build-rapport.mjs'), path.join(RACINE, 'tests', 'fixtures', 'rapport-data-riche.json'), '--tenant', autre, '--out', out]);
  assert.equal(r.status, 0, r.stderr);
  assert.match(fs.readFileSync(out, 'utf8'), /--accent:#0B7A75/i, 'le tenant n\'a pas imposé son accent');
});

// ── Le branchement : verifier-rapport-html joue run-oracles-design ───────────────────────────────────
const verifier = (html, ...extra) => node([path.join(RACINE, 'tools', 'verifier-rapport-html.mjs'), html, ...extra]);

test('TF-2139 branchement — rapport conforme : verifier-rapport-html le dit jugé par les oracles de design', { skip: sautSansDesign }, () => {
  const r = verifier(RAPPORTS.valide, '--design-root', DESIGN);
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /oracles de design/i, 'le verdict ne dit pas que les oracles de design ont été joués');
});

test('TF-2139 branchement — une couleur en dur réintroduite dans la feuille de style est REFUSÉE (oracle-tokens)', { skip: sautSansDesign }, () => {
  const sale = path.join(dossier, 'couleur-en-dur.html');
  fs.writeFileSync(sale, fs.readFileSync(RAPPORTS.valide, 'utf8').replace('</style>', '.faute{background:#123456}</style>'), 'utf8');
  const r = verifier(sale, '--design-root', DESIGN);
  assert.equal(r.status, 1, `accepté (exit ${r.status}) : ${r.stdout}`);
  assert.match(r.stderr, /oracle-tokens/);
  assert.match(r.stderr, /#123456/);
});

test('TF-2139 branchement — un bandeau latéral réintroduit est REFUSÉ (oracle-slop)', { skip: sautSansDesign }, () => {
  const sale = path.join(dossier, 'bandeau.html');
  fs.writeFileSync(sale, fs.readFileSync(RAPPORTS.valide, 'utf8').replace('</style>', '.faute{border-left:4px solid var(--accent)}</style>'), 'utf8');
  const r = verifier(sale, '--design-root', DESIGN);
  assert.equal(r.status, 1, `accepté (exit ${r.status}) : ${r.stdout}`);
  assert.match(r.stderr, /oracle-slop/);
});

test('TF-2139 branchement — forge-design introuvable : racine donnée = erreur (2), racine implicite absente = NON JUGÉ dit tout haut', async () => {
  const lib = await import(`file:///${path.join(RACINE, 'tools', 'oracles-design.mjs').replace(/\\/g, '/')}`);
  const absent = path.join(dossier, 'inexistant');
  // racine EXPLICITE (option) introuvable : on a demandé un contrôle précis, on ne le saute pas en silence
  const r = verifier(RAPPORTS.valide, '--design-root', absent);
  assert.equal(r.status, 2, `racine explicitement donnée et introuvable : exit ${r.status} au lieu de 2 (${r.stderr})`);
  assert.match(r.stderr, /introuvable/);
  // résolution : option > variable d'environnement > dépôt voisin ; rien de trouvé = SKIP motivé (cas d'un runner de CI)
  // TF-2178 : le cas SANS dépôt voisin se joue sur tout poste, y compris celui qui l'a (racine donnée vers le vide : null + erreur)
  const donneeAbsente = lib.trouverRacineDesign({ option: absent, env: undefined, voisin: absent });
  assert.equal(donneeAbsente.racine, null, 'une racine donnée et introuvable doit rendre racine === null, pas undefined');
  assert.notEqual(donneeAbsente.erreur, undefined, 'une racine donnée et introuvable doit porter son erreur');
  // le cas AVEC voisin ne se joue que là où il existe
  if (designLa) assert.equal(lib.trouverRacineDesign({ option: DESIGN, env: undefined, voisin: absent }).racine, DESIGN);
  else assert.equal(lib.trouverRacineDesign({ option: DESIGN, env: undefined, voisin: absent }).racine, null, 'sans forge-design, la racine rendue est null');
  const rien = lib.trouverRacineDesign({ option: undefined, env: undefined, voisin: absent });
  assert.equal(rien.racine, null);
  assert.match(rien.motif, /digit-ai-forge-design|FORGE_DESIGN_ROOT/);
  assert.equal(lib.trouverRacineDesign({ option: undefined, env: absent, voisin: absent }).erreur !== undefined, true, 'une variable d\'environnement qui pointe dans le vide est une erreur de réglage');
  // refus explicite, dit tout haut
  const sans = verifier(RAPPORTS.valide, '--sans-oracles-design');
  assert.equal(sans.status, 0, sans.stderr);
  assert.match(sans.stderr, /NON JUGÉ.*oracles de design/s);
  assert.doesNotMatch(sans.stdout, /oracles de design.*jou/i, 'le verdict ne doit pas se dire jugé par ce qui n\'a pas été joué');
});

test('TF-2139 branchement — le point de branchement est documenté dans l\'en-tête de verifier-rapport-html', () => {
  const src = fs.readFileSync(path.join(RACINE, 'tools', 'verifier-rapport-html.mjs'), 'utf8');
  assert.match(src, /run-oracles-design/);
  assert.match(src, /FORGE_DESIGN_ROOT/);
  assert.match(src, /--design-root/);
});
