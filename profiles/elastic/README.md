# Profil Elastic (observabilité)

Ce profil instancie les contrôles génériques AuditCore d'observabilité (D10 —
logs structurés, traces, alertes sur SLO, rétention, redaction), de journal
d'audit (D03) et de gestion des incidents (D12) sur une plateforme
d'observabilité unifiée bâtie autour d'Elasticsearch/Kibana, avec un schéma de
champs commun (Elastic Common Schema, ECS) partagé par tous les producteurs de
signaux.

Les commandes de vérification interrogent directement l'API REST de la
plateforme : Elasticsearch pour les politiques de cycle de vie (_ilm/policy),
les mappings d'index, les pipelines d'ingestion (_ingest/pipeline) et la
sécurité (_security), et Kibana pour les SLO, l'alerting, les connecteurs
d'astreinte et la gestion de cas (api/observability, api/alerting,
api/actions, api/cases).

Les commandes lisent l'utilisateur et le mot de passe dans les variables d'environnement
`ELASTIC_USER` et `ELASTIC_PASSWORD` (`curl -u`), jamais écrits dans la ligne
(`tools/verifier-profils.mjs`, règle P12, TF-2112).

10 contrôles sont liés dans bindings.json.
