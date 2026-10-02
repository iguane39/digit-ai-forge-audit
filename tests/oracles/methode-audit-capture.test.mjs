// TF-1397 (02/10/2026) — la méthode d'audit (docs/MANUEL-ENTREPRISE.md, § Étape 2 · Audit)
// ne disait rien du cas d'un réglage de sécurité capturé pendant des écritures CONCURRENTES.
// Fait mesuré le 23/09/2026 : une authentification forcée d'UIA, capturée une seule fois vers
// 15h11 UTC, au milieu de quatre écritures d'un autre compte (15h07 à 15h16 UTC) — le rapport
// affirmait un réglage déjà faux dès 15h16 UTC. La méthode ne lisait pas le journal d'activité
// sur la fenêtre d'audit et ne recapturait pas à la remise.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MANUEL = fs.readFileSync(path.join(RACINE, 'docs', 'MANUEL-ENTREPRISE.md'), 'utf8');

test('TF-1397 — la méthode d\'audit prescrit la lecture du journal d\'activité sur la fenêtre mesurée', () => {
  assert.match(MANUEL, /journal d'activité sur TOUTE la\s*\n?\s*fenêtre mesurée/,
    'la méthode doit prescrire la lecture du journal d\'activité sur la fenêtre d\'audit, pour un réglage capturé en direct');
});

test('TF-1397 — la méthode d\'audit prescrit une seconde capture à la remise', () => {
  assert.match(MANUEL, /recapture le\s*\n?\s*réglage une seconde fois, À LA REMISE/,
    'la méthode doit prescrire une seconde capture au moment de la remise, pas une seule photo en cours d\'audit');
});

test('TF-1397 — la méthode cite les DEUX horodatages dans la preuve attendue', () => {
  assert.match(MANUEL, /cite les deux horodatages dans la preuve/,
    'les deux instants de capture doivent être exigés dans la preuve, pas seulement mesurés en coulisse');
});
