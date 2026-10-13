// TF-1387 (décidé le 13/10/2026, option b de la fiche) — le plan de remédiation déclarait un champ
// `effort` que la chaîne AuditCore ne remplit JAMAIS : 159 actions sur 159 sans effort mesuré sur le
// plan d'un produit, et une présentation obligée d'ajouter une cotation hors de l'audit. Le choix :
// l'audit NE CHIFFRE PAS l'effort, il le déclare (légende du rapport, méthode, schéma) ; le champ
// n'existe dans le YAML que si la mission l'a saisi.
//
// Double sens : VERT — sans effort saisi, le plan affiche « — » et le YAML omet la clé (jamais une
// chaîne vide) ; un effort saisi par la mission traverse. ROUGE — la légende privée de la déclaration
// est refusée par le même motif, en français comme en anglais.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RES, buildPlan, planToActions } from '../../tools/rapport-engine.mjs';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'rapport-data-valid.json'), 'utf8'));
const copie = () => JSON.parse(JSON.stringify(base));

const sansEffort = (d) => {
  for (const r of d.regles ?? []) delete r.effort;
  for (const a of d.actions ?? []) delete a.effort;
  return d;
};

test('VERT — sans effort saisi, le plan affiche « — » et le YAML omet la clé', () => {
  const d = sansEffort(copie());
  const plan = buildPlan(d);
  assert.ok(plan.length > 0, 'la fixture produit un plan');
  assert.ok(plan.every((a) => a.effort === '—'), 'effort non chiffré = « — » au plan');
  const { doc } = planToActions(plan, d, '1.0.0');
  assert.ok(doc.actions.length > 0, 'des actions sont projetées');
  assert.ok(doc.actions.every((a) => !('effort' in a)), 'aucune clé effort (ni vide) dans le YAML de la forge');
});

test('VERT — un effort saisi par la mission traverse jusqu\'au YAML', () => {
  const d = sansEffort(copie());
  const regle = d.regles.find((r) => r.verdict === 'non_conforme');
  assert.ok(regle, 'la fixture porte une règle non conforme');
  regle.effort = 'moyen × court';
  const { doc } = planToActions(buildPlan(d), d, '1.0.0');
  const a = doc.actions.find((x) => x.control_ref === regle.id);
  assert.ok(a, 'l\'action de la règle est projetée');
  assert.equal(a.effort, 'moyen × court');
});

const DECLARATIONS = [
  ['fr', RES.fr.leg.priorites, /L'audit ne chiffre pas l'effort/],
  ['en', RES.en.leg.priorites, /The audit does not size effort/]
];

for (const [langue, legende, motif] of DECLARATIONS) {
  test(`VERT — la légende ${langue} déclare que l'audit ne chiffre pas l'effort`, () => {
    assert.match(legende, motif);
  });
  test(`ROUGE — la légende ${langue} privée de la déclaration est refusée par le même motif`, () => {
    const privee = legende.replace(/ (L'audit ne chiffre|The audit does not size).*$/, '');
    assert.notEqual(privee, legende, 'la déclaration a bien été retirée');
    assert.doesNotMatch(privee, motif);
  });
}

test('VERT — le schéma du plan dit que l\'effort est facultatif et non chiffré par la chaîne', () => {
  const schema = JSON.parse(fs.readFileSync(path.join(ROOT, 'core', 'schemas', 'remediation-actions.schema.json'), 'utf8'));
  const props = schema.properties.actions.items.properties;
  assert.match(props.effort.description, /NE CHIFFRE PAS l'effort/);
  assert.equal(schema.properties.actions.items.required.includes('effort'), false, 'effort reste facultatif');
});
