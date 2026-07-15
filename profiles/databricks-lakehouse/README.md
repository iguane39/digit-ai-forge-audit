# Profil Databricks Lakehouse

Ce profil instancie les contrôles génériques AuditCore de gouvernance des données
(D05 — qualité, lignage, contrats ; D15 — principes Data by Design ; D16 — schéma
et catalogue) sur un lakehouse Databricks gouverné par un catalogue central
(Unity Catalog).

L'architecture cible est structurée en trois couches de raffinement progressif
(bronze brute, argent nettoyée/conforme, or consommable), chacune matérialisée
par un schéma Unity Catalog dédié, avec des contrats documentés entre couches.
Les déploiements (pipelines, jobs, configuration) sont appliqués par des
Databricks Asset Bundles versionnés, offrant une chaîne de migration testable
avec retour arrière.

Les commandes de vérification s'appuient sur le SQL de catalogue (tables
système system.information_schema.*, system.access.*, DESCRIBE TABLE
EXTENDED/HISTORY, SHOW GRANTS, RESTORE TABLE) ainsi que sur le CLI databricks
(bundle, catalogs, pipelines, shares). Elles supposent un accès en lecture au
metastore Unity Catalog du périmètre audité.

15 contrôles sont liés dans bindings.json.
