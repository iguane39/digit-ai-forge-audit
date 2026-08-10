# `oracles/` — contrôles d'audit exécutés contre le système audité

> Distinction structurante du produit :
> **`tools/`** produit et vérifie les **livrables d'audit** (rapport, catalogue, kit, fiche).
> **`oracles/`** vérifie le **système audité lui-même** — code, base, pipeline, environnements
> déployés. Ces scripts sont autoportants (Node ≥ 18, aucune dépendance externe) et sont
> embarqués dans le kit remis au projet.

Loi commune : *un ✓ sans oracle exécuté n'est pas un ✓*. Le format conforme et un gate CI vert
**ne prouvent pas** que l'application fonctionne — seule l'exécution du parcours contre
l'environnement déployé le prouve.

## Les sept oracles

| Script | Ce qu'il prouve | Sortie non nulle |
|---|---|---|
| `verifier-schema-modele.mjs` | dérive **schéma ORM ↔ base cible** | colonne/table lue par le modèle, absente en base |
| `smoke-parcours.mjs` | **appel réel** des endpoints critiques contre l'env déployé | un 5xx sur un parcours principal (3 = non vérifié) |
| `verifier-migrations.mjs` | le **pipeline applique** les migrations | DDL orphelines, ou aucune étape de migration |
| `verifier-dependances-env.mjs` | dépendances runtime **provisionnées par env** + smokes sur la ressource réelle | dev-only, manuel, smoke absent/échoué, dérive de parité |
| `verifier-couverture-fonctionnelle.mjs` | inventaire fonctionnel → **matrice de couverture** | ✓ adossé à build/lint/unit seul, endpoint orphelin, régression de ratchet |
| `verifier-roundtrip.mjs` | **régénérer reproduit** la version validée à l'identique | delta manqué, placeholder résiduel |
| `maj-versions.mjs` | fraîcheur des dépendances **pilotée par driver** | (rapport d'inventaire, exit 0) |

Chacun documente son usage complet dans son en-tête. Tous écrivent un JSON structuré
(`schema: auditcore.<domaine>/vN`) exploitable par le rapport d'audit.

## Invariant d'acquisition à 3 issues

Toute acquisition de donnée — commande locale **ou** requête réseau — a **exactement trois**
issues, jamais deux :

1. **mesure réelle** sur le périmètre attendu ;
2. **mesure impossible** → `non vérifié` **+ trace des tentatives** (jamais un « 0 » ou un
   « conforme » par défaut) ;
3. **mesure partielle** → **explicitement étiquetée** (`transitif_non_couvert`, `eol_verifie:false`).

Un échec ou une couverture incomplète ne doit **jamais** se présenter comme (1), et ce pour
*chaque* driver — sécurité directe **et** transitive, EOL, version, dépréciation.

## Échelle de résolution des blocages

« Non vérifié » est un **dernier recours**, pas un premier réflexe. Face à un blocage (outil absent
du PATH, service indisponible), descendre les barreaux dans l'ordre, sans en sauter :

1. méthode primaire → 2. **invocation alternative** du même outil → 3. **outil alternatif** →
4. **source alternative** → 5. **provision éphémère** sûre et **hors projet audité** →
6. `non vérifié — tentatives : […]`.

Garde-fous : ne jamais inventer ni mettre « 0/conforme » par défaut ; ne jamais **muter le projet
audité** ; timeout par tentative ; journaliser la voie retenue.

## Preuve

`tests/oracles/*.test.mjs` — **41 tests**, exécutés par la CI produit sur **matrice
{ubuntu, windows}**. La matrice n'est pas décorative : les gardes d'exécution de `runCmd` sont
spécifiques à Windows et une régression y est invisible sur un seul OS.

Règle de contribution : voir [CONTRIBUTING.md](CONTRIBUTING.md). Aide à l'écriture des tests
fonctionnels côté projet audité : [aide-tests-fonctionnels.md](aide-tests-fonctionnels.md).
