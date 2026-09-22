// La dimension se reconnaît à sa FORME, pas à une liste (TF-1207, décision humaine D-26 (a) du
// 22/09/2026 — retour Produit-61 du 09/09/2026).
//
// LE FAIT : quatre expressions de `tools/rapport-engine.mjs` bornaient la dimension à D16, alors
// que le référentiel fusionné porte D17 et que `tools/validate-config.mjs` l'acceptait déjà. Deux
// fichiers du même dépôt ne s'accordaient pas sur l'étendue du référentiel. Les trois actions de
// gouvernance de l'intelligence artificielle, portées par D17, sortaient « non rattachées » :
// absentes du plan de remédiation remis à la forge de développement, signalées en simple
// avertissement. Une action de gouvernance qui sort du plan ne sera corrigée par personne.
//
// LES DEUX SENS, parce qu'une borne déplacée d'un cran se prouve dans les deux :
//   vert   — une action D17 est rattachée, reçoit l'identifiant `REM-D17-001` et est PROJETÉE
//            dans le contrat de la forge ; c'est le cas qui échouait ;
//   rouge  — une dimension MAL FORMÉE reste non rattachée et hors projection : la correction a
//            élargi la forme reconnue, elle n'a pas supprimé la reconnaissance.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildPlan, planToActions } from '../../tools/rapport-engine.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const base = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests', 'fixtures', 'rapport-data-valid.json'), 'utf8'));

/** Les données de référence, plus UNE action portée par la dimension passée. */
const avecAction = (dimension) => {
  const d = JSON.parse(JSON.stringify(base));
  d.actions = [...(d.actions ?? []), {
    titre: 'Documenter la gouvernance des systèmes apprenants',
    desc: 'Tenir le registre des modèles employés, leur finalité et leur réévaluation.',
    dimension,
    tag: 'prio',
    effort: '2j',
    severite: 'Majeur',
    verification: 'le registre existe, il est daté et il nomme un responsable',
  }];
  return d;
};

test('VERT — une action D17 est RATTACHÉE et entre au plan remis à la forge', () => {
  const d = avecAction('D17');
  const plan = buildPlan(d);
  const a = plan.find(x => x.titre?.startsWith('Documenter la gouvernance'));
  assert.ok(a, "l'action de gouvernance est au plan");
  assert.equal(a.dimension, 'D17', `dimension ${a.dimension} — c'est le défaut mesuré : D17 sortait non rattachée`);
  assert.equal(a.id, 'REM-D17-001', `identifiant ${a.id} — un « REM-NR-… » signe la non-rattachée`);

  const { doc } = planToActions(plan, d, '1.0.0');
  assert.ok(doc.actions.some(x => x.id === 'REM-D17-001'),
    'l\'action D17 n\'est pas PROJETÉE dans le contrat de la forge — c\'est là que les trois écarts se perdaient');
});

test('ROUGE — une dimension MAL FORMÉE reste non rattachée, et hors du contrat de la forge', () => {
  const d = avecAction('IA');
  const plan = buildPlan(d);
  const a = plan.find(x => x.titre?.startsWith('Documenter la gouvernance'));
  assert.ok(a, "l'action reste VISIBLE au plan : rien n'est écarté en silence");
  assert.equal(a.dimension, null, 'une dimension hors forme ne doit pas être reconnue');
  assert.match(a.id, /^REM-NR-/, `identifiant ${a.id} — la non-rattachée doit se nommer`);

  const { doc } = planToActions(plan, d, '1.0.0');
  assert.equal(doc.actions.some(x => String(x.id).startsWith('REM-NR-')), false,
    'une action non rattachée ne doit pas entrer au contrat de la forge sans son identifiant de dimension');
});

// Fusion du 23/09/2026 avec TF-1235 : la validité se lit dans `data.dimensions`. Une dimension
// bien formée mais ABSENTE du référentiel de l'audit n'est pas rattachée, et le reste se voit.
test('ROUGE — une dimension bien formée mais non déclarée (D18, D42) reste non rattachée', () => {
  for (const dim of ['D18', 'D42']) {
    const plan = buildPlan(avecAction(dim));
    const a = plan.find(x => x.titre?.startsWith('Documenter la gouvernance'));
    assert.ok(a, `l'action ${dim} reste VISIBLE au plan`);
    assert.equal(a.dimension, null, `${dim} reconnue alors que le référentiel de l'audit ne la déclare pas`);
  }
});
