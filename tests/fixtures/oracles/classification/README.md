# Fixture — qualité de classification (source hors-registre)

Cas réel de l'audit ACME : **`xlsx`** installé depuis la **CDN SheetJS**
(`https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`). npm a retiré `xlsx` : son
« latest » (0.18.5) est **périmé et inférieur** à l'installé (0.20.3). « Monter » serait un
**downgrade** vers une version vulnérable.

Attendu de `maj-versions.mjs` :

- `xlsx` → `statut = hors_registre`, `reco_flag = —`, **jamais** `reco_correctif`, **jamais** de
  cible `0.18.5` (comparaison au registre inhibée : la source de vérité est l'éditeur).
- `eslint` (spec de registre normale) → traité normalement.

Aucun composant ne doit avoir `reco_flag = Oui` avec `version_actuelle < version_resolue`
(invariant anti-downgrade). La détection « hors-registre » est **basée sur la spec d'install**
(URL/tarball/git/…), donc déterministe même hors-ligne.
