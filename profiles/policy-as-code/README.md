# Profil policy-as-code (démonstrateur OPA/Rego + conftest)

**Périmètre : démonstrateur, pas une migration.** Ce profil instancie **3 des 175 contrôles**
core (`CTL-D07-01`, `CTL-D07-04`, `CTL-D02-11`) en règles [Open Policy Agent](https://www.openpolicyagent.org/)
(Rego) exécutables via [conftest](https://www.conftest.dev/), pour prouver qu'un contrôle
déclaratif du core peut devenir une **gate CI exécutée sur l'IaC réelle** — pas pour migrer les
172 contrôles restants d'un coup (TF-0110, item 2 : « sur un SOUS-ENSEMBLE de contrôles »).

## Contenu

```
policy-as-code/
├── policy/
│   ├── tagging.rego   # CTL-D07-01 — taxonomie de tags obligatoire
│   ├── budget.rego     # CTL-D07-04 — budget déclaré + alertes multi-seuils
│   └── egress.rego     # CTL-D02-11 — sortie réseau refusée par défaut
├── fixtures/
│   ├── iac-verte.json  # conforme aux 3 règles → conftest PASS (0 échec)
│   └── iac-rouge.json  # viole les 3 règles → conftest FAIL (échec par règle)
└── bindings.json        # mapping contrôle core → commande de vérification (même forme que profiles/azure)
```

Les fixtures ne représentent pas la syntaxe d'un outil IaC particulier : c'est un manifeste JSON
neutre (`resources`, `perimeters`, `budgets`, `network_egress`) qui rend le démonstrateur
indépendant de tout format propriétaire — cohérent avec l'agnosticité du core (`docs/AUDIT-AGNOSTICITE.md`).
Un tenant qui adopte cette voie adapte l'extraction de ses ressources réelles (Terraform plan
JSON, export cloud, etc.) vers cette même forme d'entrée, ou réécrit les règles pour lire son
format natif directement.

## Exécuter la preuve

```bash
# fixture verte : doit passer (exit 0)
conftest test profiles/policy-as-code/fixtures/iac-verte.json -p profiles/policy-as-code/policy

# fixture rouge : doit échouer (exit 1), un message par violation, CTL cité
conftest test profiles/policy-as-code/fixtures/iac-rouge.json -p profiles/policy-as-code/policy
```

Sans `conftest` installé localement, l'image officielle suffit :

```bash
docker run --rm -v "<chemin-absolu-du-repo>/profiles/policy-as-code":/project -w /project \
  openpolicyagent/conftest test fixtures/iac-verte.json -p policy
```

**Résultat exécuté (TF-0110, 2026-08-12)** : `iac-verte.json` → `5 tests, 5 passed, 0 failures`
(exit 0) ; `iac-rouge.json` → `5 tests, 0 passed, 5 failures` (exit 1), une ligne par violation
citant l'id `CTL-Dxx-nn` en clair (ex. `CTL-D02-11: sortie réseau de 'app-x-prod-net' non refusée
par défaut...`). Les deux fixtures ont été exécutées par `conftest` réel (image
`openpolicyagent/conftest`), pas simulées.

## Garantie et limites (héritées de `profiles/azure/README.md`)

Ce profil n'ajoute que de la précision d'instanciation : il ne redéfinit, n'assouplit ni ne
supprime jamais un `criticite`, un `enforcement` ou une `grille_verdict` du contrôle core
(PADR-0001). Sans binding, un contrôle reste vérifiable via ses `actions_audit` génériques.

**Non fait ici, explicitement hors périmètre v0** : intégration dans `.github/workflows/ci.yml`
(décision humaine — ce profil ne doit pas devenir un gate bloquant sans mandat explicite),
couverture des 172 autres contrôles, lecture directe d'un format IaC propriétaire (Terraform plan
JSON, ARM/Bicep, etc. — actuellement un manifeste neutre intermédiaire).
