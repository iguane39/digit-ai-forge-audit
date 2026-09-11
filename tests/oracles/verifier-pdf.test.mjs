// TF-0506 (23/08/2026) — ON RELIT LE FICHIER, ON NE CROIT PAS LA COMMANDE.
//
// Le fait fondateur, mesuré le 22/08 sur une production réelle. Le catalogue déclare deux formats
// pour la fiche sécurité — html ET pdf — et la forge n'en produisait qu'un : le jeu de livrables a
// été remis INCOMPLET, et c'est LE COMMANDITAIRE qui a réclamé le second format. Le PDF a donc été
// généré côté produit, de zéro, et un piège s'est refermé : sous Windows, un PDF ouvert dans une
// visionneuse VERROUILLE le fichier ; le navigateur échoue à l'écrire SANS LE DIRE, et le script a
// revalidé L'ANCIEN TIRAGE en croyant valider le nouveau. Le défaut n'a été vu qu'en comparant
// l'horodatage du fichier à celui du lancement.
//
// D'où les cas figés ici. Trois d'entre eux se jouent sur des PDF FABRIQUÉS À LA MAIN — l'oracle
// lit des octets, il n'a besoin d'aucun navigateur pour être mis en défaut, et le test reste
// hermétique. Le quatrième, la fraîcheur, est celui qui a coûté la demi-journée.
//
// Lancer : node --test tests/oracles/verifier-pdf.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// La dépendance « moteur d'impression » est celle de l'OUTIL, pas une liste recopiée ici (TF-1017).
import { NAVIGATEURS, trouverNavigateur } from '../../tools/fiche-en-pdf.mjs';
import { verdictNavigateur } from '../verdicts.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORACLE = path.join(RACINE, 'oracles', 'verifier-pdf.mjs');

const jouer = (...args) => {
  const r = spawnSync(process.execPath, [ORACLE, ...args, '--json-only'], { encoding: 'utf-8' });
  let rapport = null;
  try { rapport = JSON.parse((r.stdout || '').trim()); } catch { /* laissé à l'assertion */ }
  return { code: r.status, rapport, brut: r.stdout };
};
const regle = (rapport, r) => (rapport.findings || []).find((f) => f.regle === r);

// Un PDF minimal, VALIDE, dont on choisit le format et le nombre de pages. Écrit à la main : ce
// que l'oracle lit, ce sont des octets — le fabriquer prouve qu'il les lit vraiment.
function pdfMinimal(dir, nom, { l = 595.28, h = 841.89, pages = 1, tronque = false } = {}) {
  let corps = '%PDF-1.4\n';
  for (let i = 0; i < pages; i++)
    corps += `${i + 3} 0 obj\n<< /Type /Page /MediaBox [0 0 ${l} ${h}] >>\nendobj\n`;
  corps += `1 0 obj\n<< /Type /Pages /Count ${pages} >>\nendobj\n`;
  corps += 'trailer\n<< /Root 2 0 R >>\n';
  if (!tronque) corps += '%%EOF\n';
  const p = path.join(dir, nom);
  fs.writeFileSync(p, corps, 'latin1');
  return p;
}

test('un PDF A4 complet et frais → PASS, et le verdict DIT ce qu\'il a relu', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-vert-'));
  const p = pdfMinimal(dir, 'ok.pdf');
  const { code, rapport } = jouer(p, '--format', 'A4', '--apres', String(Date.now() - 60_000));
  assert.equal(rapport.verdict, 'PASS');
  assert.equal(code, 0);
  assert.match(regle(rapport, 'P2').message, /A4 portrait/);
  assert.match(regle(rapport, 'P2').message, /lu dans le fichier/);
  assert.match(regle(rapport, 'P4').message, /posterieur au lancement/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('LE PIÈGE DU 22/08 : un tirage antérieur au lancement est REFUSÉ, et le message nomme le verrou', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-vieux-'));
  const p = pdfMinimal(dir, 'ancien.pdf');
  // Le fichier existe, il est valide, il est A4 : tout est vert SAUF qu'il date d'avant la
  // demande. C'est exactement l'état qu'un verrou Windows laisse derrière lui — et c'est le seul
  // contrôle qui l'attrape.
  const vieux = new Date(Date.now() - 3_600_000);
  fs.utimesSync(p, vieux, vieux);
  const { code, rapport } = jouer(p, '--apres', String(Date.now()));
  assert.equal(rapport.verdict, 'FAIL');
  assert.equal(code, 1);
  const p4 = regle(rapport, 'P4');
  assert.match(p4.message, /ANTERIEUR au lancement/);
  assert.match(p4.message, /verrouille le fichier/);
  assert.match(p4.message, /SANS LE DIRE/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('un tirage antérieur à SA SOURCE est refusé — le livrable ne reflète plus ce qu\'il rend', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-source-'));
  const p = pdfMinimal(dir, 'tirage.pdf');
  const src = path.join(dir, 'fiche.html');
  fs.writeFileSync(src, '<!DOCTYPE html><html><body>modifiée après le tirage</body></html>', 'utf-8');
  const vieux = new Date(Date.now() - 600_000);
  fs.utimesSync(p, vieux, vieux);
  const { rapport } = jouer(p, '--source', src);
  assert.equal(rapport.verdict, 'FAIL');
  assert.match(regle(rapport, 'P4').message, /ANTERIEUR a sa source/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('un format hors A4 est refusé, et le constat renvoie à la FEUILLE DE STYLE, pas à la commande', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-format-'));
  const p = pdfMinimal(dir, 'letter.pdf', { l: 612, h: 792 });
  const { rapport } = jouer(p, '--format', 'A4', '--apres', String(Date.now() - 60_000));
  assert.equal(rapport.verdict, 'FAIL');
  assert.match(regle(rapport, 'P2').message, /hors A4 portrait/);
  assert.match(regle(rapport, 'P2').message, /612×792 pt/);
  assert.match(regle(rapport, 'P2').message, /feuille de style du gabarit fait foi/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('un tirage TRONQUÉ (pas de %%EOF) est refusé — écriture interrompue en cours', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-tronque-'));
  const p = pdfMinimal(dir, 'coupe.pdf', { tronque: true });
  const { rapport } = jouer(p, '--apres', String(Date.now() - 60_000));
  assert.equal(rapport.verdict, 'FAIL');
  assert.match(regle(rapport, 'P1').message, /TRONQUE/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('un fichier ABSENT n\'est pas une absence bénigne : c\'est le cas du verrou, et il échoue', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-absent-'));
  const { code, rapport } = jouer(path.join(dir, 'jamais-ecrit.pdf'));
  assert.equal(rapport.verdict, 'FAIL');
  assert.equal(code, 1);
  assert.match(regle(rapport, 'P1').message, /vient de rendre 0/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('sans --apres ni --source, la fraîcheur est DÉCLARÉE non jugée — jamais tue', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf-sansdate-'));
  const p = pdfMinimal(dir, 'ok.pdf');
  const { code, rapport } = jouer(p);
  assert.equal(rapport.verdict, 'PASS');
  assert.equal(code, 0);
  const p4 = regle(rapport, 'P4');
  assert.equal(p4.statut, 'SKIP');
  // Un contrôle qui se taît sans le dire est un contrôle absent : le SKIP dit ce qui a manqué le
  // 22/08, et il dit que le donner ne coûte rien.
  assert.match(p4.message, /manque le 22\/08/);
  fs.rmSync(dir, { recursive: true, force: true });
});

// TF-1017 (11/09/2026) — CE TEST DÉCLARE SA DÉPENDANCE, IL NE LA DEVINE PLUS.
//
// Il re-listait LUI-MÊME six chemins de navigateurs, quand `tools/fiche-en-pdf.mjs` en cherche dix.
// Deux listes pour une seule dépendance : sur un runner porteur d'un chemin connu de l'outil et
// inconnu du test, le test croyait la dépendance absente et exigeait le code 3, tandis que l'outil
// la trouvait et rendait 0 — rouge sur le runner, vert ici, huit exécutions d'affilée du 24/08 au
// 10/09. La dépendance est donc DEMANDÉE à l'outil (`trouverNavigateur`), et surtout : c'est la
// SORTIE de l'outil qui la déclare — code 3 + motif écrit = dépendance absente, sur tous les
// runners. Le verdict devient SKIP MOTIVÉ, jamais un PASS silencieux ni un ÉCHEC de circonstance.
// Quand le moteur d'impression est là, RIEN ne change : les mêmes assertions s'appliquent, et
// c'est le runner qui en a un qui tient la garantie pour les autres.
test('les DEUX formats dans la même passe : build-fiche rend le PDF et le RELIT (SKIP motivé sans moteur d\'impression)', (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fiche-duo-'));
  const html = path.join(dir, 'fiche.html');
  const r = spawnSync(process.execPath, [path.join(RACINE, 'tools', 'build-fiche.mjs'),
    path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml'), '--out', html],
    { encoding: 'utf-8', timeout: 180_000 });
  assert.ok(fs.existsSync(html), 'le HTML est écrit dans tous les cas');

  const v = verdictNavigateur({ status: r.status, stderr: r.stderr, navigateur: trouverNavigateur() });
  if (v.verdict === 'SKIP') {
    // Le moteur d'impression manque : le générateur l'a DIT avec un code distinct — ni 0 (le jeu
    // serait incomplet sans le dire) ni 1 (le livrable n'a rien fait de mal). Le test le répète.
    fs.rmSync(dir, { recursive: true, force: true });
    t.skip(v.motif + ` (cherchés : ${NAVIGATEURS.join(', ')})`);
    return;
  }
  assert.equal(v.verdict, 'JUGE', `${v.motif} — sortie : ${r.stderr}`);
  const pdf = path.join(dir, 'fiche.pdf');
  assert.ok(fs.existsSync(pdf), 'le PDF est rendu dans la MÊME passe — un jeu incomplet ne se remet pas');
  assert.match(r.stdout, /relu dans le fichier : P1\+P2\+P3\+P4/);
  fs.rmSync(dir, { recursive: true, force: true });
});
