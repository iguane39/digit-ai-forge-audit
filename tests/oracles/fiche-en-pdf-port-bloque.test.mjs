// TF-1220 / TF-1408 (02/10/2026) — « moteur d'impression présent ici (msedge.exe) » puis la
// production du PDF échoue : le cas « présent MAIS BLOQUÉ » (le moteur est lancé, il ne répond
// simplement pas à temps sur son port DevTools) n'était distingué d'un échec réel que dans un
// commentaire — à l'écran, `imprimer()` rejetait une erreur ordinaire, `fiche-en-pdf.mjs` sortait
// 1 (ÉCHEC) et l'auto-test plantait sans message. Sur un poste lent, ce FAUX échec se lit comme
// une régression du tirage alors que rien n'a été tiré. Et le délai d'attente était en dur à
// TROIS endroits (port DevTools, chargement HTML dans `imprimer`, chargement HTML dans `mesurer`).
//
// Preuve : un « navigateur » qui existe (donc PRÉSENT, pas « aucun moteur ») mais n'annonce
// jamais son port — ici, `node` lui-même reçoit les arguments Chromium et sort aussitôt en
// erreur, sans jamais écrire `ws://` sur stderr. Avec un `--delai-port` court, la mesure est
// rapide : pas besoin d'attendre les 30 s par défaut pour prouver le défaut.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { imprimer, DELAI_PORT_DEFAUT_MS } from '../../tools/fiche-en-pdf.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUTIL = path.join(RACINE, 'tools', 'fiche-en-pdf.mjs');
const FAUX_NAVIGATEUR = process.execPath; // existe toujours ; sort en erreur sur les flags Chromium.

const htmlTemporaire = () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fiche-pdf-bloque-'));
  const html = path.join(dir, 'ACM - Fiche Securite - Dev - 20261002a.html');
  fs.writeFileSync(html, '<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>t</title>'
    + '</head><body>x</body></html>', 'utf8');
  return { dir, html };
};

test('TF-1220 — un moteur PRÉSENT mais qui n\'annonce jamais son port rejette avec portBloque, pas une erreur ordinaire', async () => {
  const { dir, html } = htmlTemporaire();
  try {
    await assert.rejects(
      imprimer(html, { navigateur: FAUX_NAVIGATEUR, delaiMs: 200 }),
      (e) => {
        assert.equal(e.portBloque, true, 'le cas « présent mais bloqué » doit porter le marqueur portBloque');
        assert.equal(e.delaiMs, 200, 'le délai effectivement utilisé doit être rapporté');
        return true;
      });
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('TF-1220 — le délai d\'attente est PARAMÉTRABLE : 200 ms ne dure pas 30 s', async () => {
  const { dir, html } = htmlTemporaire();
  try {
    const debut = Date.now();
    await assert.rejects(imprimer(html, { navigateur: FAUX_NAVIGATEUR, delaiMs: 200 }));
    const duree = Date.now() - debut;
    assert.ok(duree < DELAI_PORT_DEFAUT_MS / 2,
      `avec --delai-port 200, le rejet a mis ${duree} ms — le délai en dur (${DELAI_PORT_DEFAUT_MS} ms) n'a pas été raccourci`);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('TF-1408 — en CLI, « présent mais bloqué » sort en NON VÉRIFIÉ (3), jamais en ÉCHEC (1)', () => {
  const { dir, html } = htmlTemporaire();
  try {
    const r = spawnSync(process.execPath,
      [OUTIL, html, '--navigateur', FAUX_NAVIGATEUR, '--delai-port', '200'], { encoding: 'utf8' });
    assert.equal(r.status, 3, `exit ${r.status} au lieu de 3 (NON VÉRIFIÉ) — sortie : ${r.stderr}`);
    assert.match(r.stderr, /NON VÉRIFIÉ/, 'le motif doit nommer le verdict « non vérifié »');
    assert.match(r.stderr, /PDF NON RENDU/, 'le motif doit suivre la même famille de message que « aucun moteur »');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('TF-1220 — l\'auto-test de fiche-en-pdf ne plante plus sur un moteur présent mais bloqué : SKIP motivé, exit 0', () => {
  // FORGE_NAVIGATEUR prime sur la recherche (cf. NAVIGATEURS) : le self-test bascule donc sur le
  // faux moteur, qui n'annoncera jamais son port — exactement le cas mesuré le 24/09 et le 02/10.
  const r = spawnSync(process.execPath, [OUTIL, '--self-test'],
    { encoding: 'utf8', env: { ...process.env, FORGE_NAVIGATEUR: FAUX_NAVIGATEUR, FORGE_DELAI_PORT_MS: '200' } });
  assert.equal(r.status, 0, `l'auto-test doit rester vert sur un étage non vérifié : ${r.stdout}${r.stderr}`);
  assert.match(r.stdout, /SKIP MOTIVÉ/, 'le cas « présent mais bloqué » doit être dit, pas planter en silence');
  assert.match(r.stdout, /NON VÉRIFIÉ/, 'le motif doit nommer le verdict « non vérifié », pas un échec de tirage');
});
