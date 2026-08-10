# Contribuer aux oracles projet — règle de non-régression

## Loi : `maj-versions.mjs` ne doit jamais présenter un résultat dégradé comme propre

Le durcissement de l'acquisition de données (exécution de commandes + requêtes réseau) a coûté
**trois versions** (20260720e → f → g) pour verrouiller **une** vulnérabilité transitive, parce que
le seul juge était un **ré-audit manuel sur Windows**. Historique du trou :

- **20260720e** : audit natif cassé → `adm-zip` (transitif, High) manqué.
- **20260720f** : corepack + échelle ajoutés, mais `spawnSync('*.cmd')` sans `shell` (Windows) → `adm-zip` **de nouveau** manqué.
- **20260720g** : enfin capté.

Le juge est désormais la **CI** (CI produit (job `oracles`), matrice `{ubuntu, windows}`) + les tests
`tests/oracles/maj-versions.test.mjs`. Ils **figent** le comportement acquis.

## Ce qui est interdit sans faire échouer la CI

**Toute modification de `runCmd` ou d'un barreau d'échelle de résolution** (ordre des barreaux,
parsing d'audit, `maxBuffer`, `shell` Windows, invocabilité `canRun`, retry réseau, état EOL
ternaire, périmètre `COVERS`) **doit garder ces tests verts**. En particulier :

| Ne jamais recasser | Test garde-fou |
|---|---|
| `shell` Windows sur `.cmd` (défaut 1, EINVAL) | POSITIVE (via natif) — **dure en CI** |
| `maxBuffer: 1e8` (défaut 2, ENOBUFS) | POSITIVE |
| périmètre : transitif couvert par audit natif, pas OSV (défaut 3) | POSITIVE + NÉGATIVE |
| invocabilité réelle `status===0`, pas simple présence PATH (défaut 5) | `runCmd + canRun` |
| échec honnête → « non vérifié » + tentatives, jamais un « 0 » nu (invariant 3 issues) | NÉGATIVE (`MAJVER_TEST_FORCE_SEC_FAIL`) |
| registre injoignable → `non_verifie`, pas `a_jour` (défaut 6) | registre forcé |
| endoflife injoignable → `eol_non_verifies`, pas « pas EOL » (défaut 4) | EOL forcé / unit `eolMajor` |
| déprécié → `remplacant` extrait du message npm, flèche `x→x` masquée (défaut A) | `classer` déprécié + `successorFromDeprecation` |
| source hors-registre (URL/tarball/git/…) → `hors_registre`, pas de faux `reco_correctif` (défaut B) | `classer` hors-registre + fixture `classification` |
| jamais de reco vers une version INFÉRIEURE à l'installé (anti-downgrade) | `classer` anti-downgrade + assertion transverse |
| revue/contrôle manuel jamais dans ANALYSES/COMPOSANTS (l'humain ≠ composant) | `verifier-rapport-audit.mjs` Check 11 + `verifier-rapport-audit.test.mjs` |
| check 10 aligné sur les statuts produits (`hors_registre`/`reco_deprecie`/`non_verifie` = version n/a) | **contrat partagé `STATUTS_VERSION_NA`** (maj-versions ↔ validateur) + fixtures `versions-clean/warn.html` |
| dérive schéma ORM ↔ base (colonne modèle absente en base) = BLOQUANT / NO GO | `verifier-schema-modele.mjs` + `audit-runtime.test.mjs` |
| un 500 sur un parcours critique interdit le GO (jamais présumer 2xx) | `smoke-parcours.mjs` + `audit-runtime.test.mjs` |
| DDL orphelines / pas d'étape de migration pipeline = constat D09 | `verifier-migrations.mjs` + `audit-runtime.test.mjs` |
| chaque point fonctionnel relié à un test EXÉCUTÉ (pas de ✓ sur build/lint/schéma) | `verifier-couverture-fonctionnelle.mjs` + `couverture-fonctionnelle.test.mjs` + `aide-tests-fonctionnels.md` |
| dépendance runtime provisionnée PAR ENV + smoke exécuté sur la ressource réelle (pas un mock) | `verifier-dependances-env.mjs` + `dependances-env.test.mjs` |
| régénérer un livrable reproduit la version validée à l'identique (round-trip) ; éditions réinjectées dans la SOURCE | `verifier-roundtrip.mjs` + `roundtrip.test.mjs` |

> **Round-trip des livrables générés.** Toute édition faite sur une SORTIE (Fiche Sécurité, rapport, kit…) doit être **réinjectée dans la source** — gabarit (structure/libellé) ou données/`repl` (valeur) — jamais laissée sur l'artefact. Avant de régénérer, passer `verifier-roundtrip.mjs --guard` contre la dernière version livrée ; après régénération, l'oracle round-trip doit être **vert** (identique hors version, 0 placeholder). Sinon la génération **détruit** du travail à chaque passe.

> **Sortie propre des outils réseau.** `smoke-parcours.mjs` et `verifier-dependances-env.mjs` consomment le corps des réponses + `Connection: close` et sortent via `process.exitCode` (jamais `process.exit()` brutal) — sinon une assertion libuv Windows (`UV_HANDLE_CLOSING`) fait crasher la sortie pendant la fermeture des sockets `fetch`. Ne pas réintroduire `process.exit()` dans un chemin post-`fetch`.

> **Test fonctionnel = oracle.** Toute évolution/durcissement de comportement s'accompagne du **test fonctionnel exécuté** correspondant (intégration endpoint côté back, e2e de parcours côté front). La remédiation ne *signale* pas un test manquant : elle l'**écrit et le rend vert**. Le non-testable est marqué explicitement (raison + oracle de substitution) — jamais un faux ✓.

> **Contrat partagé.** Le check 10 du validateur **importe** `STATUTS_VERSION_NA` de `maj-versions.mjs` : quand tu ajoutes/retires un statut où `version_actuelle` n'est pas une version registre, mets à jour **cet ensemble** (une seule source) — jamais une regex de chaîne dupliquée. Producteur et checker ne doivent plus rediverger.

### Traçabilité LLM (provenance à trois étapes)

Chaque étape du kit est attribuée au LLM qui l'a exécutée — ne pas retirer ces champs :
- **construction du pack** → `constraints.json` → `build_provenance` (modèle, version, éditeur, date) ;
- **audit** → champ meta **« Moteur d'audit (LLM) »** du rapport (`{{MOTEUR_AUDIT_LLM}}`) ;
- **remédiation** → `execute_par_llm` du suivi (`verifier-remediation.mjs --init`) ; `--status` l'affiche et avertit s'il est vide.

## Avant de pousser

```bash
node --check maj-versions.mjs
node --test tests/oracles/maj-versions.test.mjs      # 14 verts en local (réseau requis pour la POSITIVE)
CI=1 node --test tests/oracles/maj-versions.test.mjs # mode CI : la POSITIVE devient DURE
```

Hooks de test (env, gérés par `maj-versions.mjs`, jamais actifs en usage normal) :
`MAJVER_TEST_FORCE_SEC_FAIL`, `MAJVER_TEST_FORCE_REGISTRY_FAIL`, `MAJVER_TEST_FORCE_EOL_FAIL`.

Si tu retires ou renommes un hook, un fixture, ou le fichier de test : **mets à jour la CI et ce
document dans le même changement**. Un test supprimé rouvre le trou en silence — c'est exactement
ce que ce dispositif existe pour empêcher.
