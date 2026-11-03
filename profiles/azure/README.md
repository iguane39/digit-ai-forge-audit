# Profil Azure

Ce profil instancie les contrôles génériques du core AuditCore (`core/controls/controls-core-v1.json`) sur la stack de référence Azure : APIM, Key Vault, Entra ID, Landing Zones, Azure DevOps, Container Apps, Azure Monitor, complétée par Terraform pour l'IaC.

## Contenu

`bindings.json` associe **42 bindings** (sur ~150 contrôles core) à un `control` (id `CTL-Dxx-nn`) : `instanciation` (réalisation concrète sur Azure), `verification_command` (commande `az`/`gh`/`terraform`/`git` exécutable en audit) et `evidence` (preuve produite).

Sélection : tous les Fatal/Bloquant de D01, D02, D03, D07, D09, D10, D12, D16, plus les contrôles d'autres dimensions dont la vérification se rattache sans ambiguïté à un service cloud (résidence des données, quotas APIM, tests de charge, autoscaling, gates de revue). D00/D13, organisationnels, ne sont pas instanciés faute de commande outillable.

## Consommation par l'outillage

Au merge (`core > profil > overlay`, PADR-0001), le moteur de rapport enrichit chaque contrôle applicable avec son `instanciation` — affichée dans le banc de preuves — puis exécute (ou propose à l'auditeur) le `verification_command` pour collecter l'`evidence`. Sans binding, le contrôle reste vérifiable via ses `actions_audit` génériques du core.

## Secrets et appel payant (TF-2112, décision D-163 (a))

Aucune `verification_command` n'écrit une clé, un jeton ou un mot de passe dans la ligne : elle le lit dans une variable d'environnement que l'auditeur définit avant de jouer la commande, si bien que rien n'entre dans l'historique du shell. Variables employées : `AZURE_OPENAI_API_KEY` (CTL-D14-04), `AZURE_PG_ADMIN_PASSWORD` (les commandes `az postgres flexible-server execute`), `AZURE_SQL_ADMIN_PASSWORD` et `AZURE_STORAGE_KEY` (CTL-D01-15), `SONAR_TOKEN` (CTL-D08-05). `tools/verifier-profils.mjs`, règle P12, refuse toute commande de profil qui écrit un identifiant en clair.

Un contrôle envoie un appel payant. Le test d'injection de CTL-D14-04 poste une requête au déploiement Azure OpenAI du client, et le client en paie les jetons. Il ne se joue qu'avec l'accord écrit du client, consigné au dossier d'audit dans `input/00 - Cadrage`, sous le nom `<client> - <TRI> - Accord appel IA - <AAAAMMJJ><indice>.<ext>` (convention de nommage des livrables de la méthodologie). La commande, jouée dans un shell bash depuis la racine du dossier d'audit, constate la présence de ce fichier avant l'appel. Sans accord, elle s'arrête après le relevé de configuration des filtres, aucun appel ne part, et le test est noté « non joué : accord absent ». La règle P13 de `tools/verifier-profils.mjs` refuse toute commande de profil qui appelle un fournisseur de modèle sans mentionner l'accord avant l'appel.

## Garantie

Ce profil n'ajoute que de la précision : il ne redéfinit, n'assouplit ni ne supprime jamais un `criticite`, un `enforcement` ou une `grille_verdict` du contrôle core (PADR-0001). Toute dérogation reste tracée au niveau overlay (tenant), jamais au niveau profil.
