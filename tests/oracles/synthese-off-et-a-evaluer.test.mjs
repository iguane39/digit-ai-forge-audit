// TF-2140 (RU-7) — la synthèse du rapport ne ment ni sur les bloquants ni sur ce qui n'est pas instruit.
// Deux défauts relevés par une campagne du 04/11/2026 sur un rapport réel :
//   1. la dimension D14, hors périmètre (« off », sans score), était rangée parmi les Bloquants ;
//   2. la carte « Règles instruites » concluait « … le reste est conforme » alors que le reste
//      contenait cinq règles à évaluer, fondues avec les cinq conformes.
// Corrections : une dimension off ne pèse jamais dans le décompte des bloquants (ni par un score
// bas, ni par une criticité Fatal héritée) ; la carte nomme chaque état, `a_evaluer` compris, et ne
// dit plus « le reste est conforme ».
//
// Lancer : node --test tests/oracles/synthese-off-et-a-evaluer.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RES } from '../../tools/rapport-engine.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');
const node = (args) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 120000, maxBuffer: 1e8 });
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'synthese-'));
const valide = () => JSON.parse(fs.readFileSync(path.join(RACINE, 'tests', 'fixtures', 'rapport-data-valid.json'), 'utf8'));

function rendre(nom, d) {
  const json = path.join(dossier, `${nom}.json`);
  fs.writeFileSync(json, JSON.stringify(d), 'utf8');
  const html = path.join(dossier, `${nom}.html`);
  const r = node([path.join(RACINE, 'tools', 'build-rapport.mjs'), json, '--tenant', TENANT, '--out', html]);
  assert.equal(r.status, 0, r.stderr);
  return fs.readFileSync(html, 'utf8');
}
const texte = (s) => String(s ?? '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const repere = (html, id) => texte((new RegExp(`class="k-repere" id="${id}">([\\s\\S]*?)</span>`).exec(html) ?? [])[1]);
const valeurKpi = (html, id) => texte((new RegExp(`class="k-valeur" aria-describedby="${id}">([\\s\\S]*?)</span>`).exec(html) ?? [])[1]);

test('TF-2140 ROUGE→VERT — une dimension off (null, Fatal hérité ou score bas) n\'est pas un bloquant, une dimension notée 2 l\'est', () => {
  const d = valide();
  d.dimensions = d.dimensions.map((x) => {
    if (x.id === 'D14') return { id: 'D14', applicability: 'off', score: null, criticite: 'Fatal' };   // off, sans score, criticité Fatal
    if (x.id === 'D13') return { ...x, applicability: 'off', score: 1 };                              // off mais noté bas
    if (x.id === 'D05') return { ...x, score: 2 };                                                    // instruite, notée 2 : bloquante
    return x;
  });
  const html = rendre('off', d);
  assert.equal(valeurKpi(html, 'kr-bloq'), '1', `KPI Bloquants : « ${valeurKpi(html, 'kr-bloq')} » au lieu de 1`);
  assert.match(repere(html, 'kr-bloq'), /D05/, 'la dimension notée 2 doit être nommée');
  assert.doesNotMatch(repere(html, 'kr-bloq'), /D14|D13/, 'une dimension off est nommée parmi les bloquants');
  const m = /<script type="application\/json" id="audit-selftest-data">([\s\S]*?)<\/script>/.exec(html);
  assert.deepEqual(JSON.parse(m[1].replace(/\\u003c/g, '<')).bloquants, ['D05']);
  assert.match(texte(html.match(/<div class="verdict">[\s\S]*?<\/div>/)[0]), /— 1 bloquants,/, 'la phrase de verdict diverge du KPI');
});

test('TF-2140 ROUGE→VERT — la carte des règles nomme les règles à évaluer et ne les fond pas dans « le reste est conforme »', () => {
  const d = valide();
  // 5 conformes au total (1 de la fixture + 4) et 5 à évaluer : le « reste » de l'ancienne phrase en tenait dix.
  for (let i = 1; i <= 4; i++) d.regles.push({ id: `CTL-D08-0${i}`, verdict: 'conforme' });
  for (let i = 1; i <= 5; i++) d.regles.push({ id: `CTL-D09-0${i}`, verdict: 'a_evaluer', motif: 'preuve non communiquée par le projet' });
  const cpt = (v) => d.regles.filter((r) => r.verdict === v).length;
  assert.equal(cpt('a_evaluer'), 5, 'la fixture doit porter exactement 5 règles à évaluer et 5 conformes');
  const html = rendre('a-evaluer', d);
  const carte = repere(html, 'kr-regles');
  assert.doesNotMatch(carte, /le reste est conforme/i, `la carte fond tout dans « conforme » : ${carte}`);
  assert.match(carte, /5 à évaluer/, `les règles à évaluer ne sont pas nommées : ${carte}`);
  assert.match(carte, new RegExp(`${cpt('conforme')} conforme`), `les conformes ne sont pas comptées : ${carte}`);
  assert.match(carte, new RegExp(`${cpt('non_conforme')} non conforme`));
  assert.match(carte, new RegExp(`${cpt('partiel')} partielle`));
  assert.match(carte, new RegExp(`${cpt('sans_objet')} sans objet`));
  // la somme des états nommés égale le total affiché : rien n'est fondu
  const total = Number(valeurKpi(html, 'kr-regles'));
  assert.equal(cpt('conforme') + cpt('non_conforme') + cpt('partiel') + cpt('sans_objet') + cpt('a_evaluer'), total);
});

test('TF-2140 sens vert — sans règle à évaluer, la carte reste exacte et nomme les états', () => {
  const d = valide();
  d.regles = d.regles.filter((r) => r.verdict !== 'a_evaluer');
  const carte = repere(rendre('sans-a-evaluer', d), 'kr-regles');
  assert.match(carte, /0 à évaluer/, carte);
  assert.doesNotMatch(carte, /le reste/i, carte);
});

test('TF-2140 — la version anglaise nomme aussi les règles à évaluer', () => {
  const phrase = RES.en.kpi.regles[2](1, 2, 3, 5, 7);
  assert.match(phrase, /5 to be assessed/);
  assert.match(phrase, /7 compliant/);
  assert.doesNotMatch(phrase, /the rest/i);
});
