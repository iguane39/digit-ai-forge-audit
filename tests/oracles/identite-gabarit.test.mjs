// TF-1752 — le document généré PORTE son gabarit et sa version, visiblement.
//
// Le fait (lot Produit-76 du 25/09/2026, RA-3) : sur les deux livrables issus du kit — rapport
// d'audit POC-to-Prod et fiche sécurité — `grep -io "gd-[a-z0-9-]*"` ne rendait rien, et aucune
// version de gabarit n'apparaissait. La règle R-46 du pilot fait reporter ce couple dans chaque lot
// de retours : le produit ne pouvait l'écrire que de mémoire.
//
// La forme attendue est celle du marqueur G4 de `oracles/oracle-gabarits-documents.mjs` du pilot :
// `Gabarit : gd-… · version du gabarit x.y.z`, dans le RENDU, jamais seulement en commentaire. Les
// deux motifs ci-dessous en sont la copie ; ce marqueur reste en français dans un livrable anglais,
// comme dans la fiche : c'est un repère machine, lu par le même contrôle partout.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RAPPORT_GABARIT_ID, RAPPORT_GABARIT_VERSION } from '../../tools/rapport-engine.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TPL = path.join(ROOT, 'deliverables', 'templates');
const ID = /gabarit\s*:\s*(gd-[a-z0-9-]+)/i;
const VER = /version[_ ]du[_ ]gabarit\s*:?\s*(\d+\.\d+\.\d+)/i;
const sansCommentaires = (t) => t.replace(/<!--[\s\S]*?-->/g, '');
/** Le couple rendu, ou null : la règle G4 du pilot, rejouée ici. */
const couple = (texte) => {
  const t = sansCommentaires(texte);
  const id = ID.exec(t), v = VER.exec(t);
  return id && v ? { id: id[1], version: v[1] } : null;
};

// Les consignes adressées à un agent (prompts, skill de conformité) ne sont pas des documents
// remis à un lecteur : R-46 ne les vise pas. Exclusion DÉCLARÉE, jamais tacite.
const HORS_LIVRABLES = /^(prompt-|compliance-skill\.)/;
const livrables = fs.readdirSync(TPL).filter((f) => /\.template(\.en)?\.md$/.test(f) && !HORS_LIVRABLES.test(f));

test('TF-1752 — le contrôle mord : un document sans le couple, ou le couple en commentaire seul, est refusé', () => {
  assert.equal(couple('# Rapport\n\nAucun repère.\n'), null);
  assert.equal(couple('<!-- Gabarit : gd-x · version du gabarit 1.0.0 -->\n# Rapport\n'), null);
  assert.deepEqual(couple('Gabarit : gd-x · version du gabarit 1.2.3'), { id: 'gd-x', version: '1.2.3' });
});

test('TF-1752 — chaque gabarit de livrable du kit rend son identifiant gd-… et sa version', () => {
  assert.ok(livrables.length >= 14, // 14 mesurés le 15/10/2026 : une baisse signale un gabarit perdu
`liste des gabarits de livrables anormalement courte (${livrables.length})`);
  const sans = livrables.filter((f) => !couple(fs.readFileSync(path.join(TPL, f), 'utf8')));
  assert.deepEqual(sans, [], 'gabarits sans couple gabarit + version rendu');
});

test('TF-1752 — une variante anglaise porte le MÊME couple que sa base, et les identifiants sont uniques', () => {
  const vus = new Map();
  for (const f of livrables.filter((x) => !x.includes('.template.en.'))) {
    const c = couple(fs.readFileSync(path.join(TPL, f), 'utf8'));
    assert.ok(c, f);
    assert.ok(!vus.has(c.id), `${c.id} porté par ${vus.get(c.id)} et ${f}`);
    vus.set(c.id, f);
    const en = f.replace('.template.', '.template.en.');
    if (fs.existsSync(path.join(TPL, en)))
      assert.deepEqual(couple(fs.readFileSync(path.join(TPL, en), 'utf8')), c, `${en} diverge de ${f}`);
  }
});

test('TF-1752 — le gabarit de la fiche porte le couple que build-fiche émet (une seule identité)', () => {
  const src = fs.readFileSync(path.join(ROOT, 'tools', 'build-fiche.mjs'), 'utf8');
  const id = /GABARIT_ID = '([^']+)'/.exec(src)[1], version = /GABARIT_VERSION = '([^']+)'/.exec(src)[1];
  assert.deepEqual(couple(fs.readFileSync(path.join(TPL, 'fiche-securite.template.md'), 'utf8')), { id, version });
});

for (const lang of ['fr', 'en']) {
  test(`TF-1752 — le rapport généré (${lang}) rend son gabarit et sa version`, () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `tf1752-${lang}-`));
    try {
      // La langue du rapport vient du tenant : une copie du tenant d'exemple, langue posée.
      const tenantDir = path.join(tmp, 'tenant');
      fs.cpSync(path.join(ROOT, 'config', 'tenants', 'exemple'), tenantDir, { recursive: true });
      const ty = path.join(tenantDir, 'tenant.yaml');
      fs.writeFileSync(ty, fs.readFileSync(ty, 'utf8').replace('language: fr', `language: ${lang}`), 'utf8');
      const out = path.join(tmp, 'rapport.html');
      const r = spawnSync(process.execPath, [path.join(ROOT, 'tools', 'build-rapport.mjs'),
        path.join(ROOT, 'tests', 'fixtures', 'rapport-data-valid.json'), '--tenant', ty, '--out', out],
      { encoding: 'utf8', timeout: 60000 });
      assert.equal(r.status, 0, r.stderr);
      const html = fs.readFileSync(out, 'utf8');
      assert.match(html, new RegExp(`<html lang="${lang}"`), 'la langue du tenant n\'a pas été prise');
      assert.deepEqual(couple(html), { id: RAPPORT_GABARIT_ID, version: RAPPORT_GABARIT_VERSION });
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  });
}
