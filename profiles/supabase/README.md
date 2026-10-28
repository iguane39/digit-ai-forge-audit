# Profil Supabase

Ce profil instancie des contrôles génériques AuditCore sur un produit adossé à Supabase :
Postgres managé, API générée sur les schémas exposés, stockage de fichiers et authentification.
Il couvre l'autorisation par sécurité au niveau ligne (D03), les secrets du dépôt et du client
public (D03), les politiques du stockage (D15), les réglages d'authentification par défaut (D02),
la sauvegarde et la restauration (D16), le filtrage réseau et le chiffrement en transit (D02), et depuis
la version 1.1.0 la MFA (D03), la durée des sessions, les limites de débit d'Auth, les Edge Functions
sans vérification de JWT, les URL de redirection, le SMTP propre, les advisors et le retrait des suites
TLS en mode CBC.

L'audit travaille sur des artefacts exportés et ne se connecte à aucun projet vivant : DDL produit
par `supabase db dump`, `supabase/config.toml`, `supabase/migrations/`, code client et bundle
livré. Les réglages qui ne vivent pas dans le dépôt (restrictions réseau, SSL imposé, plan et
PITR) sont jugés sur la sortie archivée et datée de commandes que le porteur joue lui-même.
`config.toml` décrit la configuration déclarée : tant que l'état servi du projet hébergé n'est
pas lu, le verdict d'un contrôle jugé sur ce seul fichier plafonne à « partiel »
(`docs/MANUEL-ENTREPRISE.md`, étape 2, TF-1395).

15 contrôles sont liés dans bindings.json. Chaque binding cite ses sources par identifiant
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
| CTL-D03-01 | MFA activée (TOTP, téléphone) et exigée par une politique RLS restrictive `aal2` | S11, S13, S20, S21 |
| CTL-D02-05 | `jwt_expiry` déclaré et justifié, rotation des jetons de rafraîchissement, durée de session | S12, S20, S21 |
| CTL-D02-04 | Limites de débit d'Auth constatées et justifiées (`[auth.rate_limit]`, `rate_limit_*`) | S13, S20, S21 |
| CTL-D01-12 | `verify_jwt = false` des Edge Functions : registre de dérogations, vérification de remplacement | S14, S15, S21, S22 |
| CTL-D01-04 | `site_url` et URL de redirection autorisées propres à chaque environnement | S16, S20, S21 |
| CTL-D06-02 | SMTP propre pour les e-mails d'Auth, quota d'envoi connu | S13, S17, S20, S21, S23 |
| CTL-D02-12 | Advisors de sécurité et de performance, constats traités ou acceptés par écrit | S18, S21 |
| CTL-D01-14 | Retrait des suites TLS 1.2 en mode CBC annoncé pour le 2026-11-10 au plus tôt | S19 |

## Rattachements des contrôles ajoutés en 1.1.0

Le cœur n'a pas de contrôle propre à Supabase, et un contrôle ne se lie qu'une fois par profil
(`tools/verifier-profils.mjs`, P6). Trois des huit ajouts se rattachent à un contrôle dont le texte les
recouvre bien : la MFA à CTL-D03-01, l'expiration des sessions à CTL-D02-05, les limites de débit à
CTL-D02-04. Les cinq autres sont des hypothèses de lecture que chaque instanciation déclare en tête :
`verify_jwt` à CTL-D01-12 (le cœur n'a pas de contrôle « chaque point d'entrée authentifie son appelant »),
les URL de redirection à CTL-D01-04 (cloisonnement des environnements), le SMTP à CTL-D06-02 (quota d'une
dépendance externe), les advisors à CTL-D02-12 (un seul de leurs contrôles vise le socle d'exécution) et
le retrait TLS à CTL-D01-14 (échéance publiée de retrait). Le retour arrière des migrations, écarté le 2026-10-16 faute de
source, n'a pas été réexaminé le 2026-10-28.

Le profil ne fixe aucun seuil propre. La longueur minimale de mot de passe, par exemple, se juge
contre la baseline de durcissement du tenant ; à défaut, une valeur restée au défaut du gabarit
`supabase init` sans justification écrite est un écart.

## Sources (S1 à S10 lues le 2026-10-16)

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

Ajoutées en 1.1.0 (lues le 2026-10-28) :

- S11 — https://supabase.com/docs/guides/auth/auth-mfa
- S12 — https://supabase.com/docs/guides/auth/sessions
- S13 — https://supabase.com/docs/guides/auth/rate-limits
- S14 — https://supabase.com/docs/guides/functions/function-configuration
- S15 — https://supabase.com/docs/guides/functions/auth-headers
- S16 — https://supabase.com/docs/guides/auth/redirect-urls
- S17 — https://supabase.com/docs/guides/auth/auth-smtp
- S18 — https://supabase.com/docs/guides/observability/advisors
- S19 — https://supabase.com/docs/guides/security/tls
- S20 — https://supabase.com/docs/guides/local-development/cli/config
- S21 — https://api.supabase.com/api/v1-json (spécification OpenAPI de l'API de gestion)
- S22 — https://supabase.com/docs/guides/functions/auth
- S23 — https://supabase.com/docs/guides/local-development/managing-config

## Garantie

Comme les autres profils, celui-ci n'ajoute que de la précision : il ne redéfinit, n'assouplit
ni ne supprime jamais un `criticite`, un `enforcement` ou une `grille_verdict` du contrôle core
(PADR-0001). Sans binding, un contrôle reste vérifiable par ses `actions_audit` génériques.
`node tools/verifier-profils.mjs` juge ce fichier : contrôles connus du core, champs remplis,
sources déclarées et citées, profil chargé par `tools/build-banc.mjs`.
