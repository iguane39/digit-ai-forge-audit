# Doctrine par dimension — écarts d'appariement et de lecture

> Généré par `tools/importer-doctrine.mjs` le 2026-09-11. Source : extraction d'un référentiel
> d'audit de référence (empreinte `sha256:31c2e9d5087a3c3a…`), pseudonymisée à l'import.
> Ce fichier liste ce qui **n'a pas pu être apparié ou recoupé**, avec son motif. Rien n'y est deviné :
> une dimension sans source n'a pas de doctrine inventée, elle a une ligne ici.

**Appariement** : 12 dimension(s) appariée(s) libellé pour libellé, 5 par identifiant
(libellé généralisé côté pack courant), 1 sans correspondance.

| Dimension | Libellé | Motif |
|---|---|---|
| `D09` | CI/CD & DevOps | le pack courant déclare 7 thème(s) pour cette dimension, la doctrine en porte 8 — le compte de dimensions.yaml n'est pas modifié (pack invariant), l'écart est consigné |
| `D17` | Gouvernance IA | dimension du pack courant sans source dans la référence — aucune doctrine importée ; elle reste à écrire (jamais devinée) |

## Règle d'appariement appliquée

Une dimension de la référence entre au pack par son **identifiant** (`D00`–`D16`), jamais par
ressemblance de libellé : le fichier d'écart fourni en entrée porte les mêmes identifiants et les
comptes mesurés par dimension, qui servent de recoupement. Un libellé différent de part et d'autre
ne bloque pas l'appariement (il est consigné comme `par_identifiant` dans le pack) ; un identifiant
absent le bloque, et la dimension sort ici.
