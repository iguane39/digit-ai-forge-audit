# Profil Power BI

Ce profil instancie les contrôles génériques AuditCore de modélisation et de
gouvernance de la restitution sur la plateforme Power BI : modèle sémantique
en étoile (D16), source unique de vérité et dimension de temps gouvernée
(D05), homogénéité des modes de stockage et chaîne de promotion (D01), ainsi
que l'accessibilité des rapports (D11).

La vérification s'appuie en priorité sur l'introspection du modèle tabulaire
via les DMV exposées par le point de terminaison XMLA (TMSCHEMA_TABLES,
TMSCHEMA_RELATIONSHIPS, TMSCHEMA_PARTITIONS, interrogeables via DAX Studio ou
SSMS) et sur les règles Best Practice Analyzer (Tabular Editor). Lorsqu'aucun
outillage programmatique n'est disponible (gouvernance de certification,
accessibilité), le contrôle bascule en revue outillée explicite au sein de
Power BI Desktop ou du portail Power BI Service.

10 contrôles sont liés dans bindings.json.
