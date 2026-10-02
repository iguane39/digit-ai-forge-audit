// TF-1344 (02/10/2026) — verifier-schema-modele.mjs : trois faux positifs mesurés sur un retour
// UIA (RX du 23/09), tous les trois sur un cas réel Prisma ↔ pg_dump :
//
//   1 · un nom de table QUALIFIÉ par pg_dump (`public."User"`) n'était jamais reconnu — la table
//       sortait « absente de la base » quelle que soit la réalité ;
//   2 · le nom du modèle Prisma, pour tout modèle SANS @@map, retombait sur le PREMIER `model X {`
//       du fichier (typiquement `User`) : les colonnes de Notification et AuditLog s'empilaient
//       dans User au lieu de rester dans leur propre table ;
//   3 · une relation INVERSE IMPLICITE (champ dont le type est un autre modèle, sans aucun
//       attribut — ex. `posts Post[]`, ou le côté sans FK d'une 1-1) était comptée comme colonne.
//
// Ensemble, les trois défauts prononçaient une dérive ORM↔base INEXISTANTE — contredite par
// `prisma migrate diff` — et faisaient sortir le Gate 1b en NO GO à tort.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const ORACLE = path.join(RACINE, 'oracles', 'verifier-schema-modele.mjs');

// ── Fixtures : un cas Prisma ↔ pg_dump réaliste, QUATRE modèles, aucun @@map ─────────────────
const PRISMA = `
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int    @id @default(autoincrement())
  title    String
  author   User   @relation(fields: [authorId], references: [id])
  authorId Int
}

model Notification {
  id     Int    @id @default(autoincrement())
  body   String
  user   User   @relation(fields: [userId], references: [id])
  userId Int
}

model AuditLog {
  id      Int    @id @default(autoincrement())
  action  String
  actor   User   @relation(fields: [actorId], references: [id])
  actorId Int
}
`;

// pg_dump réel : schéma qualifié ET table quotée (\`public."User"\`), colonnes quotées camelCase.
const PG_DUMP = `
CREATE TABLE public."User" (
    id integer NOT NULL,
    email character varying(255) NOT NULL
);

CREATE TABLE public."Post" (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    "authorId" integer NOT NULL
);

CREATE TABLE public."Notification" (
    id integer NOT NULL,
    body text NOT NULL,
    "userId" integer NOT NULL
);

CREATE TABLE public."AuditLog" (
    id integer NOT NULL,
    action character varying(255) NOT NULL,
    "actorId" integer NOT NULL
);
`;

function fixtures() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'schema-modele-'));
  const model = path.join(dir, 'schema.prisma');
  const schema = path.join(dir, 'dump.sql');
  const out = path.join(dir, 'drift.json');
  fs.writeFileSync(model, PRISMA, 'utf8');
  fs.writeFileSync(schema, PG_DUMP, 'utf8');
  return { dir, model, schema, out };
}
const jouer = (model, schema, out) => spawnSync(process.execPath,
  [ORACLE, '--model', model, '--schema', schema, '--out', out], { encoding: 'utf8' });

test('TF-1344 — un schéma Prisma à 4 modèles sans @@map, comparé à un dump pg_dump qualifié, ne dérive PAS à tort', () => {
  const { dir, model, schema, out } = fixtures();
  try {
    const r = jouer(model, schema, out);
    assert.equal(r.status, 0, `faux NO GO : ${r.stdout}${r.stderr}`);
    const rapport = JSON.parse(fs.readFileSync(out, 'utf8'));

    // Défaut 1 — table qualifiée par pg_dump reconnue : aucune des 4 tables n'est « absente ».
    assert.deepEqual(rapport.tables_modele_absentes_de_la_base, [],
      `table(s) qualifiée(s) pg_dump non reconnue(s) : ${JSON.stringify(rapport.tables_modele_absentes_de_la_base)}`);

    // Défaut 2 — chaque modèle garde SES colonnes : aucune dérive bloquante du tout.
    assert.deepEqual(rapport.drift_modele_absent_de_la_base, [],
      `dérive fausse (colonnes mal attribuées ou table non reconnue) : ${JSON.stringify(rapport.drift_modele_absent_de_la_base)}`);
    assert.equal(rapport.resume.tables_modele, 4, 'les 4 modèles doivent être vus comme 4 tables distinctes');
    assert.equal(rapport.resume.ecarts_bloquants, 0);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('TF-1344 défaut 2, isolé — Notification et AuditLog ne versent plus leurs colonnes dans User', () => {
  const { dir, model, schema, out } = fixtures();
  try {
    jouer(model, schema, out);
    const rapport = JSON.parse(fs.readFileSync(out, 'utf8'));
    // Le JSON de sortie ne porte pas le modèle parsé tel quel ; on le vérifie indirectement par
    // l'ABSENCE de toute dérive touchant `user` à cause d'une colonne de Notification/AuditLog
    // (si le bug 2 revenait, « notification »/« auditlog » n'existeraient plus comme tables
    // déclarées par le modèle et sortiraient de `tables_modele`, ou `user` porterait des
    // colonnes en trop rejetées par la base).
    assert.equal(rapport.resume.tables_modele, 4,
      'si les colonnes de Notification/AuditLog retombaient dans User, le modèle ne déclarerait plus que 2 tables (user, post)');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('TF-1344 défaut 3, isolé — les relations (explicites ET inverses implicites) ne comptent jamais comme colonnes', () => {
  const { dir, model, schema, out } = fixtures();
  try {
    // La base ne porte NI `posts` (relation inverse implicite de User) NI `author`/`user`/`actor`
    // (champs-objet des relations explicites) comme colonnes : si l'oracle les comptait comme
    // colonnes du modèle, elles sortiraient en dérive bloquante (absentes de la base).
    const r = jouer(model, schema, out);
    const rapport = JSON.parse(fs.readFileSync(out, 'utf8'));
    const colonnesEnDerive = rapport.drift_modele_absent_de_la_base.map((d) => d.column);
    for (const c of ['posts', 'author', 'user', 'actor'])
      assert.ok(!colonnesEnDerive.includes(c), `« ${c} » est une relation, pas une colonne — comptée à tort : ${r.stdout}`);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('TF-1344 — un vrai écart (colonne réellement absente de la base) reste détecté : le correctif n\'aveugle pas le contrôle', () => {
  const { dir, model, schema, out } = fixtures();
  try {
    // On ampute le dump d'une vraie colonne scalaire : le contrôle doit toujours le voir.
    const sansColonne = PG_DUMP.replace('    email character varying(255) NOT NULL\n', '');
    fs.writeFileSync(schema, sansColonne, 'utf8');
    const r = jouer(model, schema, out);
    assert.equal(r.status, 1, 'une vraie colonne manquante doit rester bloquante');
    const rapport = JSON.parse(fs.readFileSync(out, 'utf8'));
    assert.ok(rapport.drift_modele_absent_de_la_base.some((d) => d.table === 'user' && d.column === 'email'),
      'la colonne réellement absente (user.email) doit être nommée');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
