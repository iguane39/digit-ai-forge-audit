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
import { EventEmitter } from 'node:events';
import * as outil from '../../tools/fiche-en-pdf.mjs';

const { imprimer, DELAI_PORT_DEFAUT_MS, NAVIGATEURS, trouverNavigateur, trouverNavigateurs } = outil;
// TF-2088 : le repli est appelé par l'espace de noms, pour qu'un export absent tombe en rouge
// sur CE test et non sur la résolution du module entier.
const lancerAvecRepli = (...a) => outil.lancerAvecRepli(...a);
const candidatsMoteurs = (...a) => outil.candidatsMoteurs(...a);

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

// ── TF-2088 (RÉCIDIVE de TF-1408) · UN MOTEUR QUI NE DÉMARRE PAS N'EST PAS LE DERNIER MOT ────────
// Mesuré le 29-30/10/2026 : Edge, premier de la liste, n'annonçait pas son port en 30 s (sortie 3)
// pendant que Chrome, présent sur le même poste, aurait imprimé en quelques secondes. TF-1408 avait
// classé le cas en « non vérifié » ; il n'avait pas essayé les AUTRES moteurs trouvés. Un moteur
// simulé (le lanceur est injecté) rend le repli prouvable sans navigateur : le premier ne répond
// jamais, le second annonce son port.
const fauxLanceur = (comportements) => {
  const vus = [];
  const lanceur = (exe) => {
    const p = new EventEmitter();
    p.stderr = new EventEmitter();
    p.killed = false;
    p.kill = () => { p.killed = true; };
    vus.push({ exe, p });
    const c = comportements[exe];
    if (c === 'annonce') setImmediate(() => p.stderr.emit('data', 'DevTools listening on ws://127.0.0.1:9222/devtools/browser/x\n'));
    if (c === 'erreur') setImmediate(() => p.emit('error', Object.assign(new Error(`spawn ${exe} ENOENT`), { code: 'ENOENT' })));
    return p; // 'muet' : ne dit jamais rien, comme Edge bloqué
  };
  return { lanceur, vus };
};

test('TF-2088 — le premier moteur ne répond pas : le suivant est essayé, et le premier est tué', async () => {
  const { lanceur, vus } = fauxLanceur({ edge: 'muet', chrome: 'annonce' });
  const debut = Date.now();
  const r = await lancerAvecRepli(['edge', 'chrome'], { delaiMs: 100, lanceur });
  assert.equal(r.navigateur, 'chrome', 'le repli n\'a pas retenu le second moteur');
  assert.match(r.url, /^ws:\/\//);
  assert.deepEqual(vus.map((v) => v.exe), ['edge', 'chrome'], 'les moteurs doivent être essayés dans l\'ordre, une fois chacun');
  assert.equal(vus[0].p.killed, true, 'le moteur bloqué est resté vivant : il garderait son profil et sa mémoire');
  assert.equal(r.echecs.length, 1);
  assert.equal(r.echecs[0].navigateur, 'edge');
  assert.ok(Date.now() - debut < 5000, 'le repli ne doit pas attendre le délai par défaut');
  fs.rmSync(r.profil, { recursive: true, force: true });
});

test('TF-2088 — un moteur qui ne se lance pas (binaire inexécutable) cède aussi la place au suivant', async () => {
  const { lanceur } = fauxLanceur({ edge: 'erreur', chrome: 'annonce' });
  const r = await lancerAvecRepli(['edge', 'chrome'], { delaiMs: 100, lanceur });
  assert.equal(r.navigateur, 'chrome');
  assert.equal(r.echecs[0].portBloque, false, 'une erreur de lancement ne doit pas être classée « port bloqué »');
  fs.rmSync(r.profil, { recursive: true, force: true });
});

test('TF-2088 — sens rouge : tous les moteurs bloqués → portBloque, avec la liste de ceux qui ont été essayés', async () => {
  const { lanceur, vus } = fauxLanceur({ edge: 'muet', chrome: 'muet' });
  await assert.rejects(lancerAvecRepli(['edge', 'chrome'], { delaiMs: 100, lanceur }), (e) => {
    assert.equal(e.portBloque, true, 'tous bloqués = NON VÉRIFIÉ (3), pas un échec');
    assert.deepEqual(e.essayes, ['edge', 'chrome']);
    return true;
  });
  assert.ok(vus.every((v) => v.p.killed), 'un moteur bloqué est resté vivant après l\'abandon');
});

test('TF-2088 — sens rouge : aucun moteur ne se lance → erreur ordinaire (échec), jamais « non vérifié »', async () => {
  const { lanceur } = fauxLanceur({ edge: 'erreur', chrome: 'erreur' });
  await assert.rejects(lancerAvecRepli(['edge', 'chrome'], { delaiMs: 100, lanceur }), (e) => {
    assert.notEqual(e.portBloque, true, 'deux binaires inexécutables ne sont pas un point « non vérifié »');
    return true;
  });
});

test('TF-2088 — un moteur CHOISI (--navigateur ou FORGE_NAVIGATEUR) est le seul essayé : un choix explicite est une décision', () => {
  assert.deepEqual(candidatsMoteurs('X'), ['X'], '--navigateur doit exclure tout repli');
  const avant = process.env.FORGE_NAVIGATEUR;
  process.env.FORGE_NAVIGATEUR = process.execPath;
  try { assert.deepEqual(candidatsMoteurs(), [process.execPath], 'FORGE_NAVIGATEUR doit exclure tout repli'); }
  finally { if (avant === undefined) delete process.env.FORGE_NAVIGATEUR; else process.env.FORGE_NAVIGATEUR = avant; }
});

test('TF-2088 — sans choix explicite, tous les moteurs trouvés sont des candidats, sans doublon et dans l\'ordre de la liste', () => {
  const avant = process.env.FORGE_NAVIGATEUR;
  delete process.env.FORGE_NAVIGATEUR;
  try {
    const trouves = trouverNavigateurs();
    assert.deepEqual(candidatsMoteurs(), trouves);
    assert.equal(new Set(trouves).size, trouves.length, 'un moteur listé deux fois serait essayé deux fois');
    assert.ok(trouves.every((n) => NAVIGATEURS.includes(n)));
    assert.equal(trouverNavigateur(), trouves[0] ?? null, 'trouverNavigateur doit rester le premier des moteurs trouvés');
  } finally { if (avant !== undefined) process.env.FORGE_NAVIGATEUR = avant; }
});
