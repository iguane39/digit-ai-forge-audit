// TF-1395 (décidé le 13/10/2026) — la méthode d'audit (docs/MANUEL-ENTREPRISE.md, § Étape 2 · Audit)
// jugeait un réglage d'infrastructure sur la lecture du code. Fait mesuré le 24/09/2026 : la règle
// RC-22 d'un produit rendue « ALIGNÉ » sur infra/appservice.tf:35, alors que l'état servi n'avait pas
// le réglage clientSecretSettingName exigé par la documentation de l'éditeur, partait en
// response_type=id_token (flux implicite) et posait le justificatif sur l'identité système.
// Recette à double sens : la méthode actuelle porte les trois exigences, et la même méthode privée de
// son paragraphe les perd (les motifs ne passent pas à vide).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const MANUEL = fs.readFileSync(path.join(RACINE, 'docs', 'MANUEL-ENTREPRISE.md'), 'utf8');

const EXIGENCES = [
  ['le titre pose que le réglage se juge sur l\'état servi', /se juge sur l'état SERVI, pas sur le code/],
  ['la méthode prescrit de relire le réglage servi par la plateforme', /relit le réglage\s*\n?\s*servi par la plateforme/],
  ['la preuve cite la sortie de l\'état servi horodatée, comparée à la documentation datée', /la sortie de l'état servi, horodatée, comparée à la\s*\n?\s*documentation de l'éditeur datée/],
  ['sans lecture de l\'état servi, le verdict ne dépasse pas « partiel »', /ne dépasse pas « partiel » et la preuve écrit « état servi non lu »/],
  ['un verdict fondé sur la seule lecture du code est irrecevable', /fondé sur la seule lecture du code n'est pas recevable/]
];

for (const [libelle, motif] of EXIGENCES) {
  test(`TF-1395 vert — ${libelle}`, () => {
    assert.match(MANUEL, motif, libelle);
  });
}

test('TF-1395 rouge — privée de son paragraphe, la méthode échoue sur CHAQUE exigence', () => {
  const debut = MANUEL.indexOf('**Un réglage d\'infrastructure se juge sur l\'état SERVI');
  const fin = MANUEL.indexOf('**Les 18 dimensions');
  assert.ok(debut > 0 && fin > debut, 'le paragraphe doit être borné par le titre et la section suivante');
  const privee = MANUEL.slice(0, debut) + MANUEL.slice(fin);
  for (const [libelle, motif] of EXIGENCES) {
    assert.doesNotMatch(privee, motif, `le motif « ${libelle} » ne doit pas passer sans le paragraphe`);
  }
});
