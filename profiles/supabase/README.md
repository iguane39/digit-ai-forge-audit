# Profil Supabase

Ce profil instancie des contrôles génériques AuditCore sur un produit adossé à Supabase :
Postgres managé, API générée sur les schémas exposés, stockage de fichiers et authentification.
Il couvre l'autorisation par sécurité au niveau ligne (D03), les secrets du dépôt et du client
public (D03), les politiques du stockage (D15), les réglages d'authentification par défaut (D02),
la sauvegarde et la restauration (D16), le filtrage réseau et le chiffrement en transit (D02).

L'audit travaille sur des artefacts exportés et ne se connecte à aucun projet vivant : DDL produit
par `supabase db dump`, `supabase/config.toml`, `supabase/migrations/`, code client et bundle
livré. Les réglages qui ne vivent pas dans le dépôt (restrictions réseau, SSL imposé, plan et
PITR) sont jugés sur la sortie archivée et datée de commandes que le porteur joue lui-même.
`config.toml` décrit la configuration déclarée : tant que l'état servi du projet hébergé n'est
pas lu, le verdict d'un contrôle jugé sur ce seul fichier plafonne à « partiel »
(`docs/MANUEL-ENTREPRISE.md`, étape 2, TF-1395).

7 contrôles sont liés dans bindings.json. Chaque binding cite ses sources par identifiant
(`sources[]`), déclarées en tête du fichier avec leur URL et leur date de lecture.

## Contrôles liés

| Contrôle | Objet | Sources |
|---|---|---|
| CTL-D03-05 | RLS activée sur toute table des schémas exposés, politiques par rôle | S2, S10 |
| CTL-D03-02 | Aucune clé `sb_secret_` ni JWT `service_role` dans l'historique ; `.gitignore` de `supabase/` | S3, S9, S10 |
| CTL-D03-09 | Bundle client sans clé secrète, `SUPABASE_SECRET_KEY` jamais sous préfixe public | S3 |
| CTL-D15-08 | Politiques sur `storage.objects`, bucket public déclaré et justifié | S4, S1 |
| CTL-D02-10 | `enable_signup`, `minimum_password_length`, `enable_confirmations` déclarés et justifiés | S10 |
| CTL-D16-09 | Plan, PITR ou export `db dump` planifié, test de restauration | S5, S1 |
| CTL-D02-14 | `network-restrictions get` et `ssl-enforcement get`, sorties archivées | S6, S7 |

Le profil ne fixe aucun seuil propre. La longueur minimale de mot de passe, par exemple, se juge
contre la baseline de durcissement du tenant ; à défaut, une valeur restée au défaut du gabarit
`supabase init` sans justification écrite est un écart.

## Sources (lues le 2026-10-16)

- S1 — https://supabase.com/docs/reference/cli/introduction
- S2 — https://supabase.com/docs/guides/database/postgres/row-level-security
- S3 — https://supabase.com/docs/guides/api/api-keys
- S4 — https://supabase.com/docs/guides/storage/security/access-control
- S5 — https://supabase.com/docs/guides/platform/backups
- S6 — https://supabase.com/docs/guides/platform/network-restrictions
- S7 — https://supabase.com/docs/guides/platform/ssl-enforcement
- S9 — https://supabase.com/docs/guides/local-development/cli/getting-started
- S10 — https://github.com/supabase/cli/tree/develop (gabarits `config.toml` et `.gitignore`
  de `init`, `apps/cli-go/internal/utils/misc.go`)

## Garantie

Comme les autres profils, celui-ci n'ajoute que de la précision : il ne redéfinit, n'assouplit
ni ne supprime jamais un `criticite`, un `enforcement` ou une `grille_verdict` du contrôle core
(PADR-0001). Sans binding, un contrôle reste vérifiable par ses `actions_audit` génériques.
`node tools/verifier-profils.mjs` juge ce fichier : contrôles connus du core, champs remplis,
sources déclarées et citées, profil chargé par `tools/build-banc.mjs`.
