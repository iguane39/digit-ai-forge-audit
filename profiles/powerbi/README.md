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

11 contrôles sont liés dans bindings.json.

**Depuis le 07/09/2026 (TF-0862, lot L5 de l'étude d'opportunité du pilot)** : lorsque le
modèle sémantique est un projet Power BI en formats texte (PBIP, définition TMDL — format par
défaut depuis 2025-09), l'introspection ne dépend plus du point de terminaison XMLA :
`node oracles/verifier-modele-semantique.mjs --modele <dossier definition/>` juge les fichiers
et mécanise CTL-D16-01/02, CTL-D05-02/04/10/13/14 et CTL-D01-03 (règles MS1-MS6, verdict à
chaque commit). Les contrôles de portail (certification, propriétaire, accessibilité) restent en
revue outillée, et l'oracle le déclare. Niveau : barre « TabularEditor/BestPracticeRules » du
registre la-barre du pilot.

**Un verdict OK de cet oracle ne vaut PAS « livrable vérifié » (TF-1175, 17/09/2026).** Le
17/09, un projet Power BI généré a passé 22 contrôles de recette et 7 contrôles d'audit, a été
publié sur GO humain, et ne rendait aucun visuel : la référence de source de chaque requête
visuelle était invalide (`SourceRef: {Entity, Name}` au lieu de `SourceRef: {Source: alias}`),
le service acceptait le fichier, et l'export PDF sortait 943 octets et 0 caractère après 560 s.
Aucun contrôle qui LIT le fichier ne voit ce défaut. L'oracle de modèle sémantique déclare donc
désormais le rendu en `non_juge`, nomme les rapports (`*.Report`) du projet qu'il laisse de côté,
et imprime le geste qui manque avec son verdict : publier, exporter en PDF par `ExportTo`,
**télécharger** le fichier, le rendre en image, juger sur durée, octets, texte extrait par page
et absence des libellés d'erreur du service. C'est ce geste — et non le `Succeeded` de l'export —
qui prouve qu'un lecteur voit quelque chose.

**Recette PBIP de la FORME du rapport (TF-1183, 20/09/2026)** — le reste déclaré de TF-1175 : la
forme native des expressions PBIR n'était jugée par AUCUN contrôle, et c'est elle qui a rendu le
rapport invisible. Elle l'est désormais, sur les fichiers du dépôt, sans publication ni capacité de
service : `node oracles/verifier-rapport-pbir.mjs --rapport <dossier *.Report/>` mécanise
CTL-D08-01 (PB1 référence de source résoluble — `{ Source: alias }` résolu dans le `From` de la même
requête, ou `{ Entity }` seul ; jamais `{ Entity, Name }`, la forme d'une entrée de `From` recopiée,
qui est le défaut réel du 17/09 · PB2 alias d'un `From` uniques · PB3 aucune projection
`active: false`) et CTL-D11-01 (PB4 chaque colonne d'un visuel tabulaire porte son en-tête dans
`columnProperties`). Exit 0 exigé avant fusion. Cet oracle juge la FORME : un OK ne vaut toujours
pas « livrable vérifié », et il le dit — le geste de rendu ci-dessus reste dû.
