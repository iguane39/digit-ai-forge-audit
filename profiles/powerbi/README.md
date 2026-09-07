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

**Depuis le 07/09/2026 (TF-0862, lot L5 de l'étude d'opportunité du pilot)** : lorsque le
modèle sémantique est un projet Power BI en formats texte (PBIP, définition TMDL — format par
défaut depuis 2025-09), l'introspection ne dépend plus du point de terminaison XMLA :
`node oracles/verifier-modele-semantique.mjs --modele <dossier definition/>` juge les fichiers
et mécanise CTL-D16-01/02, CTL-D05-02/04/10/13/14 et CTL-D01-03 (règles MS1-MS6, verdict à
chaque commit). Les contrôles de portail (certification, propriétaire, accessibilité) restent en
revue outillée, et l'oracle le déclare. Niveau : barre « TabularEditor/BestPracticeRules » du
registre la-barre du pilot.
