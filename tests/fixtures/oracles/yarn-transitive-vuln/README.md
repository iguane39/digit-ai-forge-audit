# Fixture — vulnérabilité TRANSITIVE yarn classic (figé)

Mini-projet **yarn 1 (classic)** servant de cible de non-régression pour `maj-versions.mjs`.
Il matérialise une vulnérabilité **transitive à ≥ 2 niveaux**, à avis **stable et connu**.

## Avis attendu (à ne jamais laisser disparaître)

| Champ | Valeur |
|---|---|
| Paquet | **adm-zip** |
| Version épinglée | **0.5.0** (vulnérable ; patché en 0.5.2) |
| Avis | **GHSA-xcpc-8h2w-3j85** — *arbitrary file write via archive extraction (Zip Slip)* |
| Gravité | **High** |
| Chaîne de résolution | `@axe-core/cli > chromedriver > adm-zip` (**transitive**, 2 niveaux) |

`adm-zip` **n'est PAS** une dépendance directe : elle n'apparaît pas dans `dependencies`.
Seul un **audit natif** parcourant l'arbre résolu (`corepack yarn audit` / `yarn audit` /
`npm audit`) peut la voir ; un scan OSV « dépendances directes uniquement » la **rate**.

## Épinglage (reproductibilité)

`adm-zip` est forcé à **0.5.0** via `resolutions` dans `package.json`, et **figé dans
`yarn.lock`** (`adm-zip@0.5.0, adm-zip@^0.5.18: version "0.5.0"`). Aucune plage ne peut
donc re-résoudre vers une version patchée : l'avis reste reproductible dans le temps.

`packageManager: yarn@1.22.22` force **yarn classic** (format d'audit NDJSON `auditAdvisory`
attendu par `parseYarnAudit`), indépendamment du yarn installé sur la machine.

## Ce que le test en fait (`../../maj-versions.test.mjs`)

- **Assertion POSITIVE** : `maj-versions.mjs` doit remonter `adm-zip` en `statut=reco_securite`,
  `perimetre=(transitive)`, `resume.transitives_vuln >= 1`, `source_securite.npm.transitif_couvert=true`
  et `via` = un audit **natif** (pas de repli OSV). → prouve défauts **shell (1)**, **maxBuffer (2)**, **périmètre (3)**.
- **Assertion NÉGATIVE** (`MAJVER_TEST_FORCE_SEC_FAIL=1`) : tous les barreaux d'audit échouent →
  `via='non vérifié'`, `tentatives` non vide, `transitives_vuln='non vérifié'` (jamais un `0` nu),
  `securite_non_verifiee=['npm']`. → prouve que l'**échelle échoue honnêtement** (invariant à 3 issues).

> `node_modules` n'est **pas** committé : `yarn audit` (classic) construit l'arbre depuis
> `yarn.lock` seul, sans installation. La CI reste déterministe (voir `ci/maj-versions.yml`).

## Régénérer (si jamais nécessaire)

```bash
corepack yarn@1.22.22 install --ignore-scripts   # avec resolutions adm-zip=0.5.0
corepack yarn@1.22.22 audit --json | grep adm-zip # doit lister GHSA-xcpc-8h2w-3j85
```
