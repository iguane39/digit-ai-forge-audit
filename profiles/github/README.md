# Profil GitHub

Ce profil instancie des contrôles génériques AuditCore sur un produit dont le code vit dans un
dépôt GitHub. Il couvre la protection de la branche de référence et la revue par les pairs, avec
CODEOWNERS (D09), l'absence de secret dans le dépôt par le secret scanning et la push protection
(D03), le scan des dépendances et les correctifs par Dependabot (D02), le scan statique par le code
scanning (D02), les portes de fusion qui rendent ces scans bloquants (D09), et le canal de signalement
d'une vulnérabilité par `SECURITY.md` (D12).

L'audit est en lecture seule. Il juge les fichiers du dépôt et des sorties archivées de lectures
d'API que le porteur joue lui-même par `gh api`. Chaque commande écrit `--method GET` : `gh api` lit
par défaut, mais passe en POST dès qu'on lui donne un paramètre (`-f`, `-F`). Aucune commande du
profil n'écrit dans le dépôt audité, et aucun jeton n'est écrit ici : les commandes portent les
espaces réservés `$OWNER`, `$REPO` et `$BRANCHE`, et `gh` emploie la session du porteur.

7 contrôles sont liés dans bindings.json. Chaque binding cite ses sources par identifiant
(`sources[]`), déclarées en tête du fichier avec leur URL et leur date de lecture.

## Contrôles liés

| Contrôle | Objet | Sources |
|---|---|---|
| CTL-D09-06 | Branche par défaut protégée par ruleset ou règle de branche, revue exigée, CODEOWNERS valide, contournements justifiés | G1, G2, G3, G4, G5, G6, G15, G22, G23 |
| CTL-D03-02 | Secret scanning et push protection actifs, 0 alerte ouverte, contournements qualifiés, scan de l'historique par la CI | G7, G8, G9, G10, G15, G22 |
| CTL-D02-03 | Alertes Dependabot actives, plan daté pour chaque alerte critique ou haute | G10, G11, G14, G15, G22 |
| CTL-D02-12 | Correctifs Dependabot actifs et non suspendus, `dependabot.yml`, délai de correction mesuré | G12, G13, G14, G15, G22 |
| CTL-D02-08 | Code scanning configuré (CodeQL ou outil SARIF), alertes critiques traitées, DAST hors de GitHub | G10, G16, G17, G19, G22 |
| CTL-D09-03 | Portes de fusion : règle `code_scanning`, résolution des alertes de secrets, revue des dépendances en statut requis | G1, G2, G5, G8, G10, G18, G22 |
| CTL-D12-10 | `SECURITY.md` et signalement privé de vulnérabilité, entrée de la procédure de réponse | G15, G20, G21, G22 |

## Ce qui dépend de la visibilité du dépôt et de l'offre du compte

La documentation lue le 2026-10-29 sépare deux cas. En dépôt public, le code scanning, le secret
scanning et la push protection sont ouverts sans achat. En dépôt privé, ils exigent GitHub Code
Security ou GitHub Secret Protection, que seules les offres Team et Enterprise peuvent acheter ; les
branches protégées y demandent au moins GitHub Pro. La revue des dépendances (dependency review)
exige GitHub Code Security dans les deux cas. L'auditeur relève donc la visibilité du dépôt et le
bloc `security_and_analysis` avant de juger : une fonction indisponible se déclare comme telle,
avec la voie de remplacement retenue, et ne se confond jamais avec une fonction désactivée.

L'offre GitHub du compte audité n'est pas mesurée par ce profil : elle se relève chez le porteur,
avec le reste de l'état servi.

## Contrôles du cadrage écartés ou reformulés

- **Règles de branche et rulesets.** Le cadrage les citait comme deux familles. Ils se cumulent sur
  une même branche, et un contrôle du cœur ne se lie qu'une fois par profil (P6) : ils forment un
  seul binding, CTL-D09-06, qui lit les règles actives quelle que soit leur origine.
- **CODEOWNERS.** Le cœur n'a pas de contrôle de propriété du code. Le fichier sert la revue par
  les pairs : il entre dans CTL-D09-06, avec l'option « Require review from Code Owners ». La
  matrice RACI de CTL-D12-05 n'est pas le même objet.
- **Revue des dépendances.** Elle n'a pas de binding propre : elle exige GitHub Code Security, et
  elle apparaît comme porte possible dans CTL-D09-03.
- **DAST.** Le code scanning est un scan statique. Le volet dynamique de CTL-D02-08 se juge hors de
  GitHub, et sans lui le verdict plafonne à « partiel ».
- **Dépôt tenu par une seule personne.** Une revue par un pair suppose une seconde personne qui a
  l'écriture. Le profil ne fait pas passer un contournement d'administrateur pour une revue :
  l'écart se déclare par une dérogation datée.

## Choix de rattachement

Un contrôle du cœur ne se lie qu'une fois par profil (`tools/verifier-profils.mjs`, P6) : chaque
objet est rattaché au contrôle le plus proche, et ce rattachement est une hypothèse de lecture, pas
une équivalence. La protection de branche est l'objet même de CTL-D09-06 ; le secret scanning sert
l'absence de secret dans l'historique (CTL-D03-02) ; les alertes Dependabot sont le scan SCA de
CTL-D02-03, et ses correctifs le délai de correction de CTL-D02-12 ; le code scanning est le volet
SAST de CTL-D02-08 ; les règles de ruleset qui refusent une fusion sont les portes bloquantes de
CTL-D09-03 ; `SECURITY.md` est l'entrée de la procédure de réponse de CTL-D12-10, qui ne couvre ni la
qualification ni le confinement.

Le profil ne fixe aucun seuil propre : le nombre d'approbations, le délai de correction par
sévérité ou la liste des contrôles requis se jugent contre la baseline du tenant.

## Sources (lues le 2026-10-29)

- G1 — https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/about-rulesets
- G2 — https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets
- G3 — https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches
- G4 — https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners
- G5 — https://docs.github.com/en/rest/repos/rules
- G6 — https://docs.github.com/en/rest/branches/branch-protection
- G7 — https://docs.github.com/en/code-security/secret-scanning/introduction/about-secret-scanning
- G8 — https://docs.github.com/en/code-security/secret-scanning/introduction/about-push-protection
- G9 — https://docs.github.com/en/rest/secret-scanning/secret-scanning
- G10 — https://docs.github.com/en/get-started/learning-about-github/about-github-advanced-security
- G11 — https://docs.github.com/en/code-security/dependabot/dependabot-alerts/about-dependabot-alerts
- G12 — https://docs.github.com/en/code-security/dependabot/dependabot-security-updates/about-dependabot-security-updates
- G13 — https://docs.github.com/en/code-security/dependabot/dependabot-version-updates/about-dependabot-version-updates
- G14 — https://docs.github.com/en/rest/dependabot/alerts
- G15 — https://docs.github.com/en/rest/repos/repos
- G16 — https://docs.github.com/en/code-security/code-scanning/introduction-to-code-scanning/about-code-scanning
- G17 — https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning
- G18 — https://docs.github.com/en/code-security/code-scanning/managing-your-code-scanning-configuration/set-code-scanning-merge-protection
- G19 — https://docs.github.com/en/rest/code-scanning/code-scanning
- G20 — https://docs.github.com/en/code-security/getting-started/adding-a-security-policy-to-your-repository
- G21 — https://docs.github.com/en/code-security/security-advisories/working-with-repository-security-advisories/configuring-private-vulnerability-reporting-for-a-repository
- G22 — https://cli.github.com/manual/gh_api
- G23 — https://docs.github.com/en/rest/commits/commits

## Garantie

Comme les autres profils, celui-ci n'ajoute que de la précision : il ne redéfinit, n'assouplit
ni ne supprime jamais un `criticite`, un `enforcement` ou une `grille_verdict` du contrôle core
(PADR-0001). Sans binding, un contrôle reste vérifiable par ses `actions_audit` génériques.
`node tools/verifier-profils.mjs` juge ce fichier : contrôles connus du core, champs remplis,
sources déclarées et citées, profil chargé par `tools/build-banc.mjs`.
