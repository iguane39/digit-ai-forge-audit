// Non-régression du canevas « modèle de données » vendoré et de son adaptateur (TF-0940,
// décision humaine D-4 (b) du 20/09/2026).
//
// Ce que ces cas protègent, et pourquoi ils existent : la décision autorisait l'extension du
// contrat `db_schema` à `role`, `style`, `card`, `tip` À UNE CONDITION DURE — un audit qui ne les
// renseigne pas doit rester RENDABLE, avec une valeur de repli DÉCLARÉE et jamais devinée. Une
// teinte inventée serait pire qu'une absence : elle ferait croire à une classification que
// personne n'a faite. Les deux sens sont donc joués sur le rendu réel du canevas.
//
// Lancer :  node --test tests/oracles/canevas-modele-donnees.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  adapterDbSchema, renderDbSchema, renderDbLegend, STYLES_CANEVAS, STYLE_NEUTRE,
} from '../../tools/canevas-modele-donnees.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');

/** Un schéma NU : aucun des attributs ajoutés par la décision D-4 (b). Le cas historique. */
const NU = {
  bandes: [{ key: 'metier', label: 'Métier' }],
  tables: [{
    id: 'users', bande: 'metier', label: 'users', note: 'comptes',
    columns: [{ n: 'id', t: 'uuid', k: 'PK', nn: true }, { n: 'email', t: 'text', pii: true }],
  }, {
    id: 'orgs', bande: 'metier', label: 'orgs',
    columns: [{ n: 'id', t: 'uuid', k: 'PK' }],
  }],
  relations: [{ from: 'users.org_id', to: 'orgs.id', enforced: true }],
};

/** Le même schéma RENSEIGNÉ. */
const RENSEIGNE = {
  ...NU,
  engine: 'PostgreSQL 16',
  tables: [
    { ...NU.tables[0], role: 'Comptes utilisateurs', style: 'coral' },
    { ...NU.tables[1], role: 'Organisations', style: 'gray' },
  ],
  relations: [{ from: 'users.org_id', to: 'orgs.id', enforced: true, card: 'N–1' }],
};

test('schéma NU : il rend, et rien n\'est deviné — style neutre, absences DITES', () => {
  const html = renderDbSchema(adapterDbSchema(NU));
  assert.match(html, /class="db-card s-neutre"/, 'une table sans style doit être rendue en style neutre');
  for (const s of STYLES_CANEVAS)
    assert.doesNotMatch(html, new RegExp(`class="db-card s-${s}"`), `teinte « ${s} » DEVINÉE sur un schéma qui n'en déclare aucune`);
  assert.match(html, /rôle non renseigné/, 'un rôle absent doit se dire absent, pas se taire');
  assert.match(html, /classification non renseignée/, 'une classification absente doit se dire absente');
  assert.doesNotMatch(html, /undefined/, 'un attribut absent ne doit jamais s\'imprimer « undefined »');
  // Le dessin reste complet : cartes, badges de clé, marquage PII, arête.
  assert.match(html, /class="dbf-badge b-pk"/, 'les badges de clé du canevas ont disparu');
  assert.match(html, /class="dbf-name pii"/, 'le marquage PII du canevas a disparu');
  assert.match(html, /<path d="M /, 'aucune arête rendue');
});

test('schéma RENSEIGNÉ : la grammaire du canevas est servie — teintes, rôles, cardinalité', () => {
  const html = renderDbSchema(adapterDbSchema(RENSEIGNE));
  assert.match(html, /class="db-card s-coral"/);
  assert.match(html, /class="db-card s-gray"/);
  assert.match(html, /Comptes utilisateurs/);
  assert.match(html, />N–1</, 'la cardinalité déclarée doit être rendue sur l\'arête');
  assert.match(html, /aria-label="Schéma relationnel : PostgreSQL 16"/);
});

test('sans moteur déclaré, le nom accessible dit l\'absence plutôt que de rester vide', () => {
  const html = renderDbSchema(adapterDbSchema(NU));
  assert.match(html, /aria-label="Schéma relationnel : moteur non renseigné"/,
    'un nom accessible vide est un défaut ; une mention d\'absence est une information');
});

test('adaptateur : « table.colonne » se scinde, et l\'arête s\'ancre sur la LIGNE de la colonne', () => {
  const d = adapterDbSchema(NU);
  assert.deepEqual(
    d.relations.map(r => [r.from, r.fromCol, r.to, r.toCol]),
    [['users', 'org_id', 'orgs', 'id']],
  );
  // Ancrage réel : la cible `orgs.id` est la 1re colonne, son y vaut top + HEAD + ROW/2 ≠ mi-en-tête.
  const html = renderDbSchema(d);
  assert.doesNotMatch(html, /V 63 H/, 'l\'arête retombe au milieu de l\'en-tête : l\'ancrage colonne à colonne est perdu');
});

test('adaptateur : le champ « label » d\'une relation, mort dans le moteur remplacé, est rendu', () => {
  const d = adapterDbSchema({
    ...NU,
    relations: [{ from: 'users.org_id', to: 'orgs.id', enforced: false, label: 'héritage, pas de FK' }],
  });
  assert.match(d.relations[0].tip, /héritage, pas de FK/);
  assert.match(d.relations[0].tip, /référence logique/, 'le caractère non contraint de l\'arête doit être dit');
});

test('un style hors palette est ramené au neutre par l\'adaptateur ET REFUSÉ par le gate de données', () => {
  const d = adapterDbSchema({ ...NU, tables: [{ ...NU.tables[0], style: 'turquoise-fonce' }] });
  assert.equal(d.tables[0].style, STYLE_NEUTRE, 'une valeur inconnue ne doit jamais atteindre le rendu');
  // Et le silence de l'adaptateur ne suffit pas : le contrat de données, lui, REFUSE.
  const r = spawnSync(process.execPath, [
    path.join(ROOT, 'tools', 'verifier-rapport.mjs'),
    path.join(ROOT, 'tests', 'fixtures', 'rapport-data-db-schema-invalid.json'),
    '--tenant', path.join(ROOT, 'config', 'tenants', 'exemple', 'tenant.yaml'),
  ], { encoding: 'utf8', timeout: 60000 });
  assert.equal(r.status, 1, 'un style hors palette doit rendre le rapport NON diffusable');
  assert.match(r.stderr, /style « turquoise-fonce » hors palette/);
  assert.match(r.stderr, /« role » doit être une chaîne/);
});

test('un schéma dont les extrémités n\'ont pas de colonne reste RENDABLE (audit existant)', () => {
  const html = renderDbSchema(adapterDbSchema({ ...NU, relations: [{ from: 'users', to: 'orgs', enforced: true }] }));
  assert.match(html, /<path d="M /, 'un audit antérieur au contrat étendu doit continuer à rendre');
});

test('la légende du canevas porte la couleur ET le style de trait (jamais la couleur seule)', () => {
  const l = renderDbLegend();
  assert.match(l, /stroke-dasharray="6 4"/, 'la référence logique doit se distinguer autrement que par la couleur');
  assert.match(l, /FK contrainte/);
  assert.match(l, /role="img"/, 'les traits d\'exemple doivent porter un nom accessible');
});
