// TF-1276 (02/10/2026) — le rapport de démonstration (celui que la CI produit depuis
// tests/fixtures/rapport-data-riche.json, cf. .github/workflows/ci.yml) échouait à 21 règles
// BLOQUANTES du socle commun (`check_html.py`) et à 124 bloquants de rendu (`render_page.py`),
// mesuré le 20/09/2026 puis reconfirmé le 02/10/2026 : A4 (titre sans indice daté), A2 (favicon
// absent), L21 (classes `.toc`/`.ch-apprend` sans règle CSS), L16 (onglets dont aria-controls ne
// résout aucun role="tabpanel"), L25 (le manifeste d'écarts absent du sommaire), et surtout V4 :
// le radar par famille est un polygone CONCENTRIQUE — il se chevauche par construction — et
// comptait pour 124/124 des bloquants de rendu faute de paires data-overlap-ok déclarées.
//
// Les scripts du socle (digit-ai-forge-agents/.claude/skills/digit-ai-page-html/scripts/) ne
// sont pas une dépendance de ce dépôt (Python + Playwright) : cette batterie vérifie en JS pur
// les mêmes FAITS structurels que ces scripts jugent, pour rester autoportante et rejouable en CI
// sans dépôt frère ni interpréteur externe.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const BUILD = path.join(RACINE, 'tools', 'build-rapport.mjs');
const FIXTURE = path.join(RACINE, 'tests', 'fixtures', 'rapport-data-riche.json');
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'rapport-socle-'));
const out = path.join(dir, 'rapport-riche.html');
const build = spawnSync(process.execPath, [BUILD, FIXTURE, '--tenant', TENANT, '--out', out], { encoding: 'utf8' });
assert.equal(build.status, 0, `le rapport de démonstration doit se générer : ${build.stderr}`);
const html = fs.readFileSync(out, 'utf8');

/** Les attributs d'une balise ouvrante, en objet — extraction légère, pas un parseur DOM. */
function attrs(balise) {
  const a = {};
  for (const m of balise.matchAll(/([a-zA-Z_:][-\w:]*)\s*=\s*"([^"]*)"/g)) a[m[1]] = m[2];
  return a;
}
/** Les balises ouvrantes d'un tag donné, avec leurs attributs. */
function balises(html, tag) {
  return [...html.matchAll(new RegExp(`<${tag}\\b[^>]*>`, 'gi'))].map((m) => attrs(m[0]));
}
/** Tous les id déclarés dans le document (pour résoudre aria-controls / aria-labelledby). */
function idsDeclares(html) {
  return new Set([...html.matchAll(/\bid\s*=\s*"([^"]+)"/g)].map((m) => m[1]));
}
/** L'élément (attributs) portant un id donné, s'il existe. */
function parId(html, id) {
  const m = new RegExp(`<[a-zA-Z][-\\w]*\\b[^>]*\\bid\\s*=\\s*"${id}"[^>]*>`).exec(html);
  return m ? attrs(m[0]) : null;
}

// ── A4 : le titre porte un indice de version DATÉ ───────────────────────────────────────────
test('TF-1276 (A4) — le <title> porte un indice de version daté, pas seulement « V1 »', () => {
  const titre = /<title>(.*?)<\/title>/.exec(html)?.[1] ?? '';
  assert.match(titre, /\d{4}-\d{2}-\d{2}|\d{8}[a-z]?\b/,
    `le titre « ${titre} » ne porte aucun indice de version daté (ISO ou socle {AAAAMMJJ}{indice})`);
});

// ── A2 : favicon-lettre en data: URI ─────────────────────────────────────────────────────────
test('TF-1276 (A2) — un favicon SVG en data: URI est posé', () => {
  const liens = balises(html, 'link').filter((a) => (a.rel || '').split(/\s+/).includes('icon'));
  assert.ok(liens.length, 'aucun <link rel="icon"> trouvé');
  assert.match(liens[0].href || '', /^data:image\/svg\+xml/, 'le favicon doit être embarqué en data: URI, pas un fichier externe');
});

// ── L21 : les classes de la charte employées portent toutes une règle CSS ───────────────────
test('TF-1276 (L21) — .toc et .ch-apprend portent chacune au moins une règle CSS', () => {
  const style = /<style>([\s\S]*?)<\/style>/.exec(html)?.[1] ?? '';
  for (const cl of ['toc', 'ch-apprend']) {
    assert.match(style, new RegExp(`\\.${cl}\\b`), `aucune règle CSS ne vise la classe « .${cl} » employée dans le marquage`);
  }
});

// ── L16 : chaque role="tab" résout un role="tabpanel", et réciproquement ────────────────────
test('TF-1276 (L16) — chaque onglet (role="tab") résout un panneau (role="tabpanel") existant, et réciproquement', () => {
  const ids = idsDeclares(html);
  const tabs = balises(html, 'a').filter((a) => a.role === 'tab');
  assert.ok(tabs.length >= 2, 'au moins deux onglets attendus (vues du rapport)');
  for (const t of tabs) {
    const cible = t['aria-controls'];
    assert.ok(cible && ids.has(cible), `onglet sans aria-controls résolu : ${JSON.stringify(t)}`);
    const panneau = parId(html, cible);
    assert.equal(panneau?.role, 'tabpanel', `aria-controls="${cible}" ne vise pas un role="tabpanel"`);
  }
  const panels = balises(html, 'section').filter((a) => a.role === 'tabpanel');
  assert.ok(panels.length >= 2, 'au moins deux panneaux attendus');
  for (const p of panels) {
    const etiq = p['aria-labelledby'];
    assert.ok(etiq && ids.has(etiq), `panneau sans aria-labelledby résolu : ${JSON.stringify(p)}`);
    const onglet = parId(html, etiq);
    assert.equal(onglet?.role, 'tab', `aria-labelledby="${etiq}" ne vise pas un role="tab"`);
  }
});

// ── L25 : le manifeste d'écarts a son entrée dans le sommaire ───────────────────────────────
test('TF-1276 (L25) — le manifeste d\'écarts (chapitre à <h2>) a sa propre entrée dans le sommaire', () => {
  assert.match(html, /<footer class="ecarts">/, 'le manifeste d\'écarts doit exister');
  assert.match(html, /<nav class="toc vues"[^>]*>[\s\S]*?<a href="#v-ecarts">/,
    'le sommaire (nav.toc) doit porter une ancre vers le manifeste d\'écarts');
  assert.ok(parId(html, 'v-ecarts'), 'aucun élément ne porte l\'id "v-ecarts" visé par le sommaire');
});

// ── V4 : le radar (polygones concentriques) déclare ses paires de chevauchement ─────────────
test('TF-1276 (V4) — chaque forme du radar déclare, en PAIRE, les autres formes avec lesquelles elle se chevauche par construction', () => {
  const radar = /<svg[^>]*class="radar"[^>]*>([\s\S]*?)<\/svg>/.exec(html)?.[1] ?? '';
  assert.ok(radar, 'le radar par famille doit exister (fixture riche : plusieurs dimensions applicables)');
  const formes = [...balises(radar, 'polygon'), ...balises(radar, 'text')];
  assert.ok(formes.length >= 6, `au moins 6 formes attendues (5 anneaux + 1 polygone de données), trouvé ${formes.length}`);
  const tousLesIds = new Set(formes.map((f) => f.id).filter(Boolean));
  for (const f of formes) {
    assert.ok(f.id, `une forme du radar n'a pas d'id : ${JSON.stringify(f)}`);
    const paire = (f['data-overlap-ok'] || '').trim().split(/\s+/).filter(Boolean);
    assert.ok(paire.length, `${f.id} ne déclare aucune paire data-overlap-ok — un recouvrement du radar serait jugé comme une vraie collision`);
    for (const autre of tousLesIds) {
      if (autre === f.id) continue;
      assert.ok(paire.includes(autre), `${f.id} ne déclare pas ${autre} dans sa paire data-overlap-ok`);
    }
  }
});

fs.rmSync(dir, { recursive: true, force: true });
