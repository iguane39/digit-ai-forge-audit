# Polices embarquées dans le thème (TF-1020)

Le nombre de pages d'un livrable imprimé dépend de la police que le moteur d'impression
substitue réellement. Tant que la pile `--font-body` du thème ne nommait que des polices
**du poste** (`system-ui`, `Segoe UI`, `Arial`), la fiche sécurité tenait sur une page sous
Windows et débordait sur deux sous Linux, où aucune des quatre n'est installée : le juge P3
la refusait chez celui qui vérifie, jamais chez celui qui produit (run de CI 34581219111,
11/09/2026). Une police embarquée voyage avec le livrable ; une police du poste, non.

`tools/build-theme.mjs` inline ces fichiers en `@font-face` (`src: url(data:font/woff2;base64,…)`)
en tête de `theme.css`. **Aucun téléchargement réseau au rendu**, et le livrable HTML reste
autoportant — un fichier unique, copiable, imprimable hors ligne.

| Fichier | Famille | Graisse | Empreinte MD5 |
|---|---|---|---|
| `roboto-latin-400-normal.woff2` | Roboto | 400 | `4279528ce0e7dc28919e6f8ce5f0eaa5` |
| `roboto-latin-700-normal.woff2` | Roboto | 700 | `10a07810f28f8ff9a071a88dc2255bbb` |

**Provenance** : paquet `@fontsource/roboto` 5.3.0, sous-ensemble `latin`, recopié depuis le
parc local le 17/09/2026 — aucun téléchargement. **Licence** : SIL Open Font License 1.1,
texte intégral dans `LICENCE-Roboto-OFL-1.1.txt` (© 2011 The Roboto Project Authors).
L'OFL autorise l'incorporation dans un document, y compris commercial ; elle interdit la
vente de la police seule et impose de joindre ce texte — c'est pourquoi il est ici.

Un tenant reste libre de déclarer sa propre pile dans `tenant.yaml` (TF-1000 : sa
déclaration prime). Elle n'est alors **pas** embarquée, et `tools/verifier.mjs` le dit :
son tirage redevient dépendant du poste. Pour l'embarquer à son tour, déposer son `.woff2`
et sa licence ici, puis l'ajouter à `POLICES_EMBARQUEES` de `tools/build-theme.mjs`.
