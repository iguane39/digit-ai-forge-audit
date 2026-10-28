# Profil Cloudflare

Ce profil instancie des contrôles génériques AuditCore sur un produit dont la zone DNS, la
périphérie ou l'hébergement des pages sont chez Cloudflare : zone proxifiée, Workers avec
ressources statiques, Pages, Access, Turnstile. Il couvre le chiffrement jusqu'à l'origine (D02),
les en-têtes de sécurité (D02), la mitigation par règles personnalisées du WAF (D02), l'anti-automatisation
des formulaires (D02), l'authentification devant la préproduction (D03), les comptes techniques
à privilèges minimaux (D03) et l'exposition de l'origine par le statut de proxy (D02).

L'audit travaille sur des artefacts exportés et ne se connecte à aucun compte vivant : fichier
`_headers`, configuration Wrangler, code Terraform, code des formulaires, et sorties archivées
de lectures d'API que le porteur joue lui-même, avec un jeton en lecture seule. Aucun jeton,
identifiant de zone ou de compte n'est écrit dans ce profil : les commandes portent les espaces
réservés `$ZONE_ID` et `$CLOUDFLARE_API_TOKEN`. Les réglages de zone (mode SSL/TLS, HSTS, règles
du WAF, enregistrements DNS, politiques d'Access) ne vivent pas dans le dépôt : tant que l'état servi
n'est pas lu, le verdict d'un contrôle jugé sur le seul code plafonne à « partiel »
(`docs/MANUEL-ENTREPRISE.md`, étape 2, TF-1395).

7 contrôles sont liés dans bindings.json. Chaque binding cite ses sources par identifiant
(`sources[]`), déclarées en tête du fichier avec leur URL et leur date de lecture.

## Contrôles liés

| Contrôle | Objet | Sources |
|---|---|---|
| CTL-D02-10 | Mode SSL/TLS « Full (strict) » constaté sur chaque zone proxifiée | C1, C2, C20 |
| CTL-D02-06 | HSTS de la zone et fichier `_headers`, avec la limite des réponses produites par un Worker | C3, C4, C5, C20 |
| CTL-D02-01 | Règles personnalisées du WAF (phase `http_request_firewall_custom`), aucune ressource de Firewall Rules | C6, C7, C8, C9, C21 |
| CTL-D02-04 | Turnstile sur les formulaires publics, jeton validé côté serveur par Siteverify | C10, C11 |
| CTL-D03-01 | Access devant la préproduction et les URL de prévisualisation | C12, C13, C14 |
| CTL-D03-06 | Jetons d'API dédiés, permissions et ressources minimales, pas de clé globale | C15, C16, C17 |
| CTL-D02-14 | Statut de proxy conforme au service : web proxifié, messagerie en DNS seul | C18, C19, C22 |

## Contrôles du cadrage écartés ou reformulés

- **Enregistrement de messagerie proxifié.** Le cadrage visait « aucun enregistrement de messagerie
  proxifié ». La documentation lue le 2026-10-28 dit que seuls les enregistrements A, AAAA et CNAME
  peuvent être proxifiés : un MX ou un TXT est toujours en DNS seul. Le contrôle est gardé sous la
  forme qui a un objet, à savoir les A, AAAA et CNAME qui désignent un serveur de messagerie ou une
  validation DKIM. Le profil y ajoute la moitié inverse, tirée de la même page : un hôte web en DNS
  seul expose l'adresse de l'origine.
- **Firewall Rules.** Il n'a pas de binding propre : il est déprécié (C8, C9). Il apparaît comme
  écart dans CTL-D02-01, parce qu'une règle ou une ressource Terraform qui l'emploie est à migrer.

## Choix de rattachement

Le cœur n'a pas de contrôle propre à la périphérie, au WAF ni à Access. Un contrôle du cœur ne se
lie qu'une fois par profil (`tools/verifier-profils.mjs`, P6) : chaque objet est donc rattaché au
contrôle le plus proche, et ce rattachement est une hypothèse de lecture, pas une équivalence.
Le mode SSL/TLS relève des réglages de production (CTL-D02-10) ; HSTS rejoint les en-têtes de
sécurité (CTL-D02-06), dont le texte nomme déjà le transport strict ; les règles du WAF sont les
mesures de mitigation de la cartographie OWASP (CTL-D02-01) ; Turnstile est l'anti-automatisation
de CTL-D02-04 ; Access porte l'authentification de l'accès humain à la préproduction (CTL-D03-01) ;
le statut de proxy décide de la voie d'exposition (CTL-D02-14).

Le profil ne fixe aucun seuil propre : la durée de HSTS, le contenu d'une politique de sécurité de
contenu ou la durée de vie d'un jeton se jugent contre la baseline de durcissement du tenant.

## Sources (lues le 2026-10-28)

- C1 — https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/
- C2 — https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/full-strict/
- C3 — https://developers.cloudflare.com/ssl/edge-certificates/additional-options/http-strict-transport-security/
- C4 — https://developers.cloudflare.com/workers/static-assets/headers/
- C5 — https://developers.cloudflare.com/pages/configuration/headers/
- C6 — https://developers.cloudflare.com/waf/custom-rules/
- C7 — https://developers.cloudflare.com/waf/custom-rules/create-api/
- C8 — https://developers.cloudflare.com/firewall/
- C9 — https://developers.cloudflare.com/waf/reference/legacy/firewall-rules-upgrade/
- C10 — https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
- C11 — https://developers.cloudflare.com/turnstile/get-started/client-side-rendering/
- C12 — https://developers.cloudflare.com/workers/configuration/cloudflare-access/
- C13 — https://developers.cloudflare.com/pages/configuration/preview-deployments/
- C14 — https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/
- C15 — https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
- C16 — https://developers.cloudflare.com/fundamentals/api/get-started/keys/
- C17 — https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/
- C18 — https://developers.cloudflare.com/dns/proxy-status/
- C19 — https://developers.cloudflare.com/dns/manage-dns-records/how-to/email-records/
- C20 — https://developers.cloudflare.com/api/resources/zones/subresources/settings/methods/get/
- C21 — https://developers.cloudflare.com/api/resources/rulesets/subresources/phases/methods/get/
- C22 — https://developers.cloudflare.com/api/resources/dns/subresources/records/methods/list/

## Garantie

Comme les autres profils, celui-ci n'ajoute que de la précision : il ne redéfinit, n'assouplit
ni ne supprime jamais un `criticite`, un `enforcement` ou une `grille_verdict` du contrôle core
(PADR-0001). Sans binding, un contrôle reste vérifiable par ses `actions_audit` génériques.
`node tools/verifier-profils.mjs` juge ce fichier : contrôles connus du core, champs remplis,
sources déclarées et citées, profil chargé par `tools/build-banc.mjs`.
