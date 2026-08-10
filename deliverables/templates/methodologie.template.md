<!-- AuditCore template v1 — M1 · méthodologie d'organisation d'audit (généralise la méthodologie du profil de référence) -->
# {{tenant.name}} — Méthodologie d'organisation d'un audit

> Document unifié : nomenclature, arborescences, règles impératives. À lire **en premier**
> par tout auditeur (humain ou agent IA). Complète le prompt de conduite
> (`prompt-conduite-audit`) qui, lui, pilote l'exécution.

## 1 · Nomenclature des livrables

`{{tenant.name}} - <TRI> - <Nom Document> - <AAAAMMJJ><indice>.<ext>`
- `<TRI>` : trigramme de l'application auditée.
- Date inversée **vérifiée** (jamais supposée) ; indice `a`, puis `b`, `c`… pour les
  itérations du même jour — **prochain indice libre** en comptant courants **et** `Old/`.
- Pas de « v1/v2 » dans les noms de fichiers.

## 2 · Arborescences normalisées

`input/` (entrants d'audit) : `00 - Cadrage · 01 - Code & dépôt · 02 - Architecture & IaC ·
03 - Sécurité & secrets · 04 - Données · 05 - Tests & CI-CD · 06 - Observabilité ·
07 - Docs & gouvernance`
`output/` (livrables produits) : `00 - Rapport d'audit · 01 - Fiche Sécurité ·
02 - Présentation autorité de décision · 03 - Scans & preuves · 04 - Schémas & annexes · Old/`
Échafaudage : `node init-audit-workspace-standalone.mjs <dossier>` (idempotent).

## 3 · Les 24 règles impératives

1. **Feuille blanche** — aucun résultat d'audit antérieur comme source ni point de départ.
2. **Rapport auto-portant** — aucun renvoi à un audit précédent, statuts au présent.
3. **Evidence-based** — chaque constat/score : preuve `fichier:ligne`, extrait, commande.
4. **Pas de score sans preuve** (invariant du référentiel).
5. **Exhaustivité & intransigeance juste** — toutes les règles applicables instruites,
   aucun faux positif, l'absence de preuve est un écart.
6. **Ne pas modifier le moteur** — seules les **données** changent (gabarits, moteur de
   rendu et vérificateurs sont intouchables).
7. **Vérification obligatoire avant diffusion** — `node verifier-rapport-standalone.mjs
   <rapport-data.json>` doit sortir 0 (puis vérificateur de rendu si HTML produit).
8. **Ne jamais écraser** — nouvelle version = nouvel indice ; l'ancienne part dans `Old/`.
9. **Les projets audités ne créent pas d'ADR** — les décisions vivent dans le corpus core
   et les overlays, jamais dans les livrables d'un audit.
10. **Applicabilité honnête** — dimensions et règles `sans objet`/`à évaluer` toujours
    motivées précisément (les motifs génériques sont refusés).
11. **Opposabilité** — seules les règles `bucket: opposable` de statut accepté produisent
    des bloquants ; le reste se signale.
12. **Communication en clair** — messages aux interlocuteurs humains en texte simple,
    jamais enfouis dans des blocs de code.

Les règles 13 à 24 portent la **preuve exécutée**. Chacune est adossée à un oracle de
`oracles/` : une règle sans oracle est une intention, pas un contrôle.

13. **Cycle de remédiation & porte de clôture** — le plan de remédiation consolide **toutes**
    les actions (dimensions + règles non conformes) avec un **critère de clôture** par action.
    Avant de (re)demander un audit, le projet exécute le contrôle de clôture : chaque action
    **faite avec preuve**. But — qu'un nouvel audit ne retrouve pas d'écarts déjà identifiés.
    *(La feuille blanche reste la règle côté audit ; la clôture est la garantie côté projet.
    Ce n'est jamais une dispense de contrôle.)*
14. **Fraîcheur pilotée par DRIVER, jamais par distance de version** — on monte pour une
    **vulnérabilité**, une **fin de support**, une **dépréciation/yank**, une **incompatibilité**
    ou un **retard patch/minor dans le majeur courant** ; jamais parce que « ce n'est pas la
    dernière ». Rester dans un majeur *supporté* (le risque est la fin de support, pas N-1).
    Majeur sans driver → `veille_majeur`, informationnel, **pas** une action. Jamais de
    pré-version en cible. `version_actuelle` = dernière **stable** du registre faisant foi,
    **ou** « non vérifié (registre inaccessible) » — aucune troisième option, jamais d'estimation.
    Oracle : `oracles/maj-versions.mjs`.
15. **Échelle de résolution — « non vérifié » est un dernier recours** — face à un blocage
    d'exécution, descendre les barreaux dans l'ordre sans en sauter : (1) méthode primaire →
    (2) **invocation alternative** du même outil → (3) **outil alternatif** → (4) **source
    alternative** → (5) **provision éphémère** sûre et **hors projet audité** →
    (6) `non vérifié — tentatives : […]`. Ne jamais inventer, ne jamais mettre « 0/conforme »
    par défaut, ne jamais **muter le projet audité** ; timeout par tentative ; journaliser la
    voie retenue. Distinguer « scanné : 0 » de « non scanné ».
16. **Invariant d'acquisition à 3 issues** — toute acquisition (commande locale **ou** requête
    réseau) a exactement trois issues : **(a)** mesure réelle · **(b)** mesure impossible →
    `non vérifié` + trace des tentatives · **(c)** mesure partielle → **étiquetée** comme telle.
    Un échec ou une couverture incomplète ne se présente **jamais** comme (a), et ce pour
    *chaque* driver — sécurité directe **et** transitive, fin de support, version, dépréciation.
17. **Qualité de classification — jamais un faux actionnable** — (a) source **hors-registre**
    (URL, archive, dépôt git, lien local) → statut informatif : le « latest » du registre n'est
    pas comparable, et « monter » peut être un **downgrade** ; (b) **déprécié** → extraire le
    **successeur nommé** et recommander un *remplacement*, pas une montée ; (c) **garde
    anti-downgrade universelle** : jamais une cible inférieure à la version installée. La
    sécurité reste remontée quel que soit le statut de fraîcheur.
18. **Sémantique des inventaires — l'humain n'est pas un composant** — *analyses* = outillage
    **exécuté** (outil identifiable + version utilisée + sortie) ; *tests* = tests automatisés ;
    *composants* = briques logicielles **versionnées**. Une revue ou un contrôle **manuel** est
    un **constat de dimension** (sévérité, preuves, verdict), jamais une ligne d'inventaire —
    des colonnes de version vides trahissent le mauvais rangement.
19. **Traçabilité LLM** — pour tout livrable, savoir **quel modèle** l'a produit : construction
    du référentiel, réalisation de l'audit, réalisation de la remédiation. Trois points
    d'attribution distincts, chacun horodaté (modèle, identifiant, éditeur, date).
20. **Contrat partagé producteur ↔ vérificateur** — quand deux composants doivent s'accorder,
    le contrat est **matérialisé et testé**, pas re-déduit de part et d'autre. Le vérificateur
    **importe** du producteur l'ensemble des statuts concernés plutôt que de reconnaître des
    chaînes. Ne jamais relabelliser une donnée juste en donnée dégradée pour faire taire un
    avertissement.
21. **Un « GO » sans avoir exercé le parcours principal n'est PAS un GO** — le format conforme
    et un gate CI vert ne prouvent pas que l'application fonctionne. Trois contrôles
    **bloquants** : (1) **dérive schéma ORM ↔ base cible** — une colonne/table lue par le modèle
    et absente de la base interdit le GO, jamais « sous réserve » ; (2) **smoke runtime** des
    parcours critiques contre l'environnement déployé — un 5xx sur un parcours principal
    interdit le GO, un parcours non exercé n'est pas un parcours vert ; (3) **automatisation
    des migrations** — DDL orphelines ou absence d'étape de migration dans le pipeline = constat.
    Oracles : `verifier-schema-modele` · `smoke-parcours` · `verifier-migrations`.
22. **Tests fonctionnels exécutés et passants** — build, lint, typage verts et tests de schéma
    ne prouvent pas que l'application fonctionne. Produire une **matrice de couverture**
    reliant chaque point fonctionnel (parcours d'interface, endpoint de service) à un test
    **exécuté au bon niveau de risque** : service → test d'intégration au niveau endpoint ;
    interface → test de parcours de bout en bout. Un ✓ adossé à build/lint/schéma/unitaire seul
    est un **écart bloquant**. Le **non-testable** est marqué avec sa raison **et** son oracle
    de substitution, jamais un faux ✓ ni un test factice. La couverture ne peut que **monter**.
    Oracle : `verifier-couverture-fonctionnelle` · aide : `oracles/aide-tests-fonctionnels.md`.
23. **Dépendances runtime provisionnées PAR environnement** — une fonctionnalité dépendant à
    l'exécution d'un artefact, d'une donnée ou d'une configuration **propre à un environnement**
    n'est prod-ready que si son **provisioning est codé, idempotent et exécuté au déploiement de
    CHAQUE environnement**, et qu'un **smoke bloquant par environnement** le vérifie **sur la
    ressource réellement servie**. Un test qui mocke la dépendance n'est **pas** un oracle de la
    dépendance. Auditer aussi la **parité des sources** (un environnement bâti depuis une branche
    figée sans synchronisation dérive) et les **échecs silencieux**.
    Oracle : `verifier-dependances-env`.
24. **Round-trip — itérer sur la SOURCE, jamais sur l'artefact** — tout livrable généré naît
    d'un gabarit + de données. Une édition faite sur la **sortie** n'est dans aucun des deux :
    elle sera écrasée à la régénération suivante. Toute édition est **réinjectée** au bon niveau
    (valeur → données ; structure ou libellé → gabarit) ; avant de régénérer, comparer à la
    dernière version livrée et alerter sur tout écart non voulu ; l'oracle exige que **régénérer
    reproduise la version validée à l'identique**, hors référence de version, et **0 placeholder**
    résiduel. Oracle : `verifier-roundtrip` (mode `--guard` pour la garde anti-écrasement).

## 4 · Livrables attendus d'un audit

| Livrable | Emplacement | Gate |
|---|---|---|
| `rapport-data.json` + rapport rendu | `output/00 - Rapport d'audit/` | vérificateurs (données + rendu) |
| Fiche sécurité (8 sections, 0 placeholder) | `output/01 - Fiche Sécurité/` | relecture {{roles.security_officer}} |
| Présentation à {{roles.decision_authority}} | `output/02 - Présentation autorité de décision/` | schéma d'architecture = celui du rapport |
| Scans & preuves (+ manifeste) | `output/03 - Scans & preuves/` | référencés `fichier:ligne` |
| `remediation-actions.yaml` | `output/00 - Rapport d'audit/` | schéma validé (backlog forge) |

## 5 · Outils du kit

`init-audit-workspace-standalone.mjs` · `verifier-rapport-standalone.mjs` ·
`build-rapport-standalone.mjs` · `compliance-skill.md` (agent codeur/CI) ·
`banc-de-preuves.md` · `constraints-merged.json` · `catalogue-adr.html` · `dimensions.yaml`.
