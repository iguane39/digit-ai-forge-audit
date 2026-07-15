# Profil Azure

Ce profil instancie les contrôles génériques du core AuditCore (`core/controls/controls-core-v1.json`) sur la stack de référence Azure : APIM, Key Vault, Entra ID, Landing Zones, Azure DevOps, Container Apps, Azure Monitor, complétée par Terraform pour l'IaC.

## Contenu

`bindings.json` associe **42 bindings** (sur ~150 contrôles core) à un `control` (id `CTL-Dxx-nn`) : `instanciation` (réalisation concrète sur Azure), `verification_command` (commande `az`/`gh`/`terraform`/`git` exécutable en audit) et `evidence` (preuve produite).

Sélection : tous les Fatal/Bloquant de D01, D02, D03, D07, D09, D10, D12, D16, plus les contrôles d'autres dimensions dont la vérification se rattache sans ambiguïté à un service cloud (résidence des données, quotas APIM, tests de charge, autoscaling, gates de revue). D00/D13, organisationnels, ne sont pas instanciés faute de commande outillable.

## Consommation par l'outillage

Au merge (`core > profil > overlay`, PADR-0001), le moteur de rapport enrichit chaque contrôle applicable avec son `instanciation` — affichée dans le banc de preuves — puis exécute (ou propose à l'auditeur) le `verification_command` pour collecter l'`evidence`. Sans binding, le contrôle reste vérifiable via ses `actions_audit` génériques du core.

## Garantie

Ce profil n'ajoute que de la précision : il ne redéfinit, n'assouplit ni ne supprime jamais un `criticite`, un `enforcement` ou une `grille_verdict` du contrôle core (PADR-0001). Toute dérogation reste tracée au niveau overlay (tenant), jamais au niveau profil.
