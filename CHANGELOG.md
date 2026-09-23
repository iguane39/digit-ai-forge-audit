# Changelog — AuditCore core

Versionnement SemVer (PADR-0005) : MAJEUR = rupture de schéma / retrait de contrôle ·
MINEUR = nouveaux contrôles/ADR · PATCH = corrections. Chaque release liste les standards
sources mis à jour.

## [Non publié]

### Ajouté
- **TF-1319** (décision humaine D-13 (a) du 23/09/2026, temps 2 du verdict O3 de l'étude du pilot
  du 19/08 sur le méta-oracle d'enclenchement) — **`oracles/decouvrir-oracles.mjs` : la liste des
  oracles de la forge, lue sur le disque, au contrat commun du parc `digit-ai/decouverte-oracles@1`.**
  Le juge d'enclenchement du pilot l'appelle pour confronter ce que la forge porte aux verdicts
  consignés au ledger d'un run. Mesuré avant : `oracles/` porte 12 scripts, le tableau de son README
  en décrit 9, la CI en nomme 2 — trois listes écrites à la main, aucune complète. La règle est le
  DOSSIER (premier niveau d'`oracles/`), pas un préfixe de nom ; les `verifier-*` de `tools/`, qui
  jugent les livrables, sont laissés dehors et nommés au `non_juge`. Recette à double sens :
  `tests/oracles/decouvrir-oracles.test.mjs`, ajoutée à la batterie de la CI.

- **TF-1235** (mandat humain du 22/09/2026 sur les verdicts d'opportunité favorables, rang 1) —
  **le schéma des actions de remédiation devient un CONTRAT D'INTERFACE versionné (1.1.0), et le
  rapport exporte son COMPAGNON : la liste des contrôles évalués.** Le schéma
  `core/schemas/remediation-actions.schema.json` n'était déclaré nulle part comme consommable par un
  tiers ; il porte désormais `x-contrat` — version, clés de jonction (`control_ref`, `finding_ref`),
  règle d'évolution, consommateurs. Et `tools/build-rapport.mjs` écrit, à côté du YAML,
  `<rapport>.controles-evalues.json` (schéma `core/schemas/controles-evalues.schema.json`) : chaque
  règle de la donnée avec sa dimension et son verdict, même `audit_ref` que le YAML. *Le plan dit ce
  qui échoue ; rien ne disait ce qui a été joué* — un écart absent du plan était indiscernable d'un
  contrôle jamais évalué, et c'est pourtant cette liste qui trace la frontière entre une remédiation
  (écart à une norme, citée par son identifiant) et une amélioration (écart à une ambition). Une règle
  sans verdict sort en `a_evaluer`, terme du vocabulaire fermé de `build-kit.mjs`, jamais omise.

- **TF-0940** (part forge-audit, décision humaine D-4 (b) du 20/09/2026 — **étape 0**) — **le chemin
  ERD du moteur de rapport entre sous contrôle automatique.** Mesuré avant : `rapport-data-valid.json`,
  la fixture jouée par la CI, ne porte AUCUN `db_schema` ; `rapport-data-riche.json`, la seule qui en
  porte un, n'était consommée par personne (zéro occurrence dans tout le dépôt). Le schéma de base de
  données et son dictionnaire se rendaient donc sans juge — et le contrôle de cohérence
  ERD/dictionnaire de `verifier-rapport-html.mjs` ne s'exerçait sur rien. La fixture riche est bâtie
  et **jugée par le gate de rendu** au même titre que l'autre, avec deux assertions neutres au moteur
  (la vue « Architecture & BDD » existe, le marquage PII est présent) : elles survivent à la bascule
  de moteur qui suit, et c'est le « avant » qu'aucune bascule n'avait.

### Corrigé
- **TF-1207 / TF-1235** (22/09/2026) — **la dimension D17 n'était rattachée nulle part.** Quatre
  expressions de `tools/rapport-engine.mjs` et le motif d'identifiant du schéma bornaient les
  dimensions à `D(0\d|1[0-6])`, soit D00 à D16, quand le référentiel en porte dix-huit et que la
  donnée d'audit les déclare toutes. Mesuré sur le moteur d'avant : une action de la dimension D17
  recevait `REM-NR-D17`, sortait du YAML par `non_projete` et comptait parmi les actions « non
  rattachées » du rapport — pour une dimension parfaitement valide. La validité se lit désormais
  dans `data.dimensions` (`dimensionsConnues`, `estIdActionRattache`) et le motif du schéma admet
  toute dimension `Dnn` : *une borne numérique écrite dans un motif est un second domicile du
  référentiel, et elle dérive à la première dimension ajoutée*. Élargissement compatible : tout
  identifiant valide en 1.0.0 le reste. N'est PAS modifié, et à dessein : le texte de
  `tools/importer-doctrine.mjs` qui cite `D00`–`D16` décrit la RÉFÉRENCE importée, qui s'arrête bien
  à D16 — D17 est un ajout local « sans source dans la référence » (`doctrine-ecarts.md`).
  Recette : quatre cas neufs dans `tests/oracles/remediation.test.mjs`, chacun avec son jumeau
  rouge (D17 projetée / dimension non déclarée rejetée ; schéma admet D17 / refuse `REM-D1-001` ;
  export conforme / verdict hors vocabulaire refusé) — 20/20.

### Changé
- **TF-0940** (part forge-audit, décision humaine D-4 (b) du 20/09/2026 — **bascule**) — **le rapport
  d'audit CONSOMME le canevas qui fait foi ; `renderERD` n'est plus un moteur, c'est un appel.** Deux
  moteurs de schéma de base de données coexistaient : le canevas du skill `digit-ai-schemas` (cartes
  HTML + calque SVG, badges PK/UK/FK/NN, arêtes ancrées colonne à colonne, mise à l'échelle) et un
  `renderERD` en SVG pur écrit dans `rapport-engine.mjs`, plus pauvre, qui se déclarait lui-même
  « non faisant foi » depuis `ae3dfd8`. **Déclarer ne suffisait pas** : le rapport rendait toujours le
  moteur pauvre. Il rend désormais le canevas.
  - **Copie conforme, pas import** (`tools/canevas-modele-donnees.mjs`) : les scripts d'AuditCore sont
    embarqués dans le kit remis au projet audité, qui n'a aucun dépôt frère sous la main — une
    dépendance d'exécution était exclue. La copie est **déclarée** dans `HERITAGE.json` (source,
    version du skill, empreinte sha256) et sa dérive est mesurée par `tools/verifier-heritage.mjs`,
    qui compare quand le dépôt frère est là et se déclare **SKIP nommé** quand il ne l'est pas —
    toujours le cas d'un runner. Un dépôt absent n'est pas un rouge d'environnement. **L'empreinte est
    normalisée** (fins de ligne ramenées à LF, bloc de polices base64 exclu) : sous Windows avec
    `core.autocrlf=true` et sans `.gitattributes`, une empreinte brute aurait crié à la dérive au
    premier passage du fichier par un outil local. L'auto-test le prouve — même contenu en CRLF, même
    empreinte — et joue la dérive dans les deux sens sans aucun dépôt frère.
  - **Deux deltas de copie seulement, déclarés** : `CSSV` lit un jeton du module au lieu d'appeler
    `getComputedStyle` (le rendu se fait côté Node, il n'y a pas de document) ; `fitSchema` vérifie que
    son hôte expose `querySelector` avant de l'appeler (le gate du rapport exécute le moteur dans un
    DOM minimal qui ne l'expose pas — un garde d'hôte, jamais un assouplissement).
  - **Contrat de données étendu**, volet A de la décision : `db_schema` accueille `role`, `style`,
    `card`, `tip` (plus `engine` pour le nom accessible du dessin), **tous facultatifs**. Un audit qui
    ne les renseigne pas reste rendable, et le repli est **déclaré, jamais deviné** — une table sans
    `style` est rendue sans liseré de couleur et son infobulle dit « classification non renseignée ».
    Un `style` hors palette est en revanche **refusé** par `tools/verifier-rapport.mjs` : ramené
    silencieusement au neutre, il ferait croire à une classification que personne n'a faite. Le champ
    `label` d'une relation, que le moteur remplacé n'a jamais lu, alimente désormais l'infobulle.
  - **Ce que le rapport garde** : son dictionnaire en **tableau filtrable**. Le canevas le rend en
    cartes ; au-delà de 8 lignes le gate du rapport exige un tableau qui se trie et se filtre (RL-5).
    Prendre les cartes aurait échangé un moteur de dessin contre une régression de restitution.
  - **Le contrôle de cohérence schéma↔dictionnaire a changé de marquage, pas de force** :
    `verifier-rapport-html.mjs` regarde `db-card` au lieu de `erd-t`, et une fixture rouge sur un
    rapport riche réellement généré exige toujours l'exit 1 quand le marquage PII disparaît.
  - Mesures : batterie des oracles **141 → 151 tests** ; recette locale **12 → 13 étapes**, toutes
    vertes. Rapport de démonstration jugé avant et après par `verifier-rapport-html.mjs` (exit 0 des
    deux côtés) et par les contrôles de page du socle installé — **21 bloquants statiques avant, 21
    après, identiques ; 124 bloquants de rendu avant, 124 après, identiques en nature et en nombre** :
    aucune régression, et aucun des bloquants préexistants ne touche le schéma.

- **TF-1183** (part forge-audit, reste déclaré de TF-1175 / RF-21 (2), 20/09/2026) — **la forme
  native des expressions PBIR est jugée**, par `oracles/verifier-rapport-pbir.mjs`. C'était le
  reste : le 17/09, 29 contrôles PASS sur un rapport Power BI qui ne rendait AUCUN visuel, parce
  qu'aucun contrôle ne lisait le fichier de RAPPORT — `verifier-modele-semantique.mjs` lit le
  MODÈLE (TMDL) et nommait le `*.Report` comme non jugé, ce qui était honnête mais laissait le
  défaut passer. Quatre règles, chacune nommant le contrôle AuditCore qu'elle mécanise :
  **PB1** toute référence de source est résoluble (CTL-D08-01) — deux sens : un
  `SourceRef: { Source: alias }` dont l'alias n'est déclaré par aucun `From` en portée est
  bloquant, et un `SourceRef` portant à la fois `Entity` et `Name` l'est aussi, parce que c'est la
  forme d'une ENTRÉE DE `From` recopiée à la place d'une référence de source — le défaut réel du
  17/09 ; un `SourceRef: { Entity }` seul reste licite, sinon la règle condamnerait la forme émise
  par Power BI Desktop et ne serait que du bruit. **PB2** les alias d'un `From` sont uniques
  (CTL-D08-01). **PB3** aucune projection `active: false` (CTL-D05-10) : le champ est déclaré dans
  la requête et ne parvient jamais au lecteur. **PB4** chaque colonne d'un visuel tabulaire porte
  son en-tête dans `columnProperties` (CTL-D11-01, majeur) : sans lui, le lecteur d'écran reçoit le
  nom technique du champ. Chaque constat est localisé fichier + pointeur JSON. Recette PBIP-native :
  elle se joue sur les fichiers du dépôt, sans publication, sans capacité de service, avant fusion.
  Fixtures à double sens (`tests/fixtures/oracles/rapport-pbir/{verte,rouge}`) — et surtout, la
  fixture du défaut RÉEL déposée par TF-1175 (`modele-semantique/projet-pbip/Exemple.Report/`),
  que personne ne lisait, sort désormais BLOQUANT. Le profil `powerbi` lie CTL-D08-01 (nouveau
  binding) et étend CTL-D11-01 — 10 → 11 contrôles liés, profil 1.1.0 → 1.2.0. Batterie des
  oracles 135 → 141 tests. Périmètre inchangé sur le rendu : cet oracle juge la FORME, son OK ne
  vaut pas davantage « livrable vérifié », et il le déclare avec le geste qui reste dû.

- **TF-1175** (part forge-audit, retour Produit-62 RF-21, 17/09/2026) — **un OK de
  `oracles/verifier-modele-semantique.mjs` ne se lit plus « livrable vérifié ».** Le 17/09, un
  projet Power BI généré a passé 22 contrôles de recette et 7 contrôles d'audit, a été publié sur
  GO humain, et ne rendait AUCUN visuel : la référence de source de chaque requête visuelle était
  invalide (`SourceRef: {Entity, Name}` au lieu de `SourceRef: {Source: alias}`), le service
  acceptait le fichier, et l'export PDF sortait 943 octets et 0 caractère après 560 s. 29 contrôles
  PASS sur un livrable invisible, deux jours de mandat et deux diagnostics faux. Aucun contrôle qui
  LIT le fichier ne voit ce défaut. L'oracle déclare désormais le RENDU en `non_juge`, en TÊTE de
  liste, NOMME les rapports (`*.Report`) du projet PBIP qu'il laisse de côté — et seulement quand
  ils existent, rien n'est deviné — et imprime le geste manquant avec sa ligne de verdict (publier,
  `ExportTo` PDF, TÉLÉCHARGER le fichier, le rendre en image, juger durée / octets / texte extrait
  par page / libellés d'erreur du service). Aucun verdict ni code de sortie n'est modifié : le
  périmètre de l'oracle était légitime, c'est sa réserve qui manquait. Fixture à double sens
  (`tests/fixtures/oracles/modele-semantique/projet-pbip/`) : un projet dont le modèle est
  irréprochable et dont le rapport porte le défaut réel recopié — l'oracle rend OK, et c'est le
  texte de sa réserve qui est jugé. 3 → 5 tests. Périmètre : la part forge-audit du retour ; l'oracle
  de rendu proposé en (1) revient à forge-data, la règle de forme PBIR (2) n'est pas outillée ici.

- **TF-1020** (17/09/2026) — **la police du corps voyage désormais DANS le livrable.** Le thème
  porte ses `@font-face` incorporés en base64 (`assets/polices/`, Roboto sous SIL OFL 1.1, licence
  et provenance jointes) : aucun téléchargement au rendu, aucun fichier à côté, le HTML reste
  autoportant. Défaut d'origine (run de CI 34581219111, 11/09) : la pile `--font-body`
  (`system-ui, Segoe UI, Roboto, Arial`) ne nommait que des polices DU POSTE ; la fiche sécurité
  tenait sur une page sous Windows et sortait sur DEUX sur le runner Linux, où son propre juge P3
  la refusait — neuvième publication rouge d'affilée, invisible depuis la machine qui produit.
  La famille déclarée est `AuditCore Sans` et non `Roboto` : mesuré ici, un poste sans Roboto
  installé rend quand même `font-family:Roboto` à 0,12 px près de la face incorporée, si bien
  qu'aucune fixture ne pouvait plus prouver laquelle servait. Sous un nom qu'aucun poste ne
  possède, la mesure tranche. Un tenant qui déclare sa propre pile garde la main (TF-1000) ;
  `tools/verifier.mjs` DIT alors que son tirage redevient dépendant du poste, et dit aussi la face
  embarquée — la seule condition de sa liste qui soit redevenue rejouable. Fixtures à double sens
  dans `tools/build-theme.mjs --self-test` (5/5), `tests/oracles/recette-environnement.test.mjs`
  (23 tests) et un cas de banc qui MESURE dans le moteur d'impression que la face résolue est bien
  l'incorporée (`tests/oracles/fiche-securite.test.mjs`, 13 tests). Reste hors de portée de ce
  poste : la preuve sur un vrai runner Linux, qui demande une publication humaine.

- **TF-1102** (constat né en clôturant TF-1089, décidé sous mandat le 14/09/2026) — les DEUX autres
  champs du bloc doctrinal TF-0563 (« Restriction d'accès effective », « Comptes externes / invités
  en portée ») restaient sans règle après TF-1089, qui n'avait couvert que « Population
  effectivement admise » (FS8). Les trois champs existent pour la MÊME raison (3 128 comptes
  invités admis sans que la fiche le dise) : aucun n'est plus optionnel que les deux autres.
  Règles sœurs FS10 et FS11 ajoutées à `oracles/verifier-fiche-securite.mjs` (factorisées avec FS8
  dans un helper commun `champDuBloc`, bilingue FR/EN comme FS8) ; les deux champs rendus par
  `tools/build-fiche.mjs` (section 5 · Exposition). Fixtures rouges dédiées (une ligne SUPPRIMÉE par
  règle), self-test 14/14 → 16/16. La fiche complète (5 champs du bloc, tous remplis) tient
  toujours sur UNE page A4 — prouvé par le test bout en bout réel (impression Edge + relecture PDF,
  `tests/oracles/fiche-securite.test.mjs`), sans retente supplémentaire du rythme vertical au-delà
  de celle déjà faite pour TF-1089.

- **TF-1095** (restes archivés TF-0690, TF-0702, relevé P-2 du 14/09/2026) — la fiche sécurité rend
  désormais VISIBLEMENT son gabarit et sa version en pied de page (`Gabarit :
  gd-fiche-securite-auditcore · version du gabarit 1.0.0`, `tools/build-fiche.mjs`), même
  convention que la règle G4 d'`oracle-gabarits-documents.mjs` du pilot. Défaut d'origine (TF-0690,
  Produit-11, 27/08) : « ni gd-fiche-securite, ni version » — une instance périmée était invisible
  sur l'artefact, sans registre pour la dater, y compris reçue par courriel hors de tout dépôt.
  Règle FS9 ajoutée à `oracles/verifier-fiche-securite.mjs` : une fiche qui ne rend pas ce couple
  est refusée. Fixture rouge dédiée, self-test 13/13 → 14/14. AUCUNE option `--gabarit` ajoutée à
  `build-fiche.mjs` — la proposition originale de TF-0702 (accepter un gabarit HTML fourni par le
  produit, une porte de sortie qui aurait contourné la cause plutôt que la mesurer) a été
  délibérément écartée au profit de la mesure, conformément au dossier de campagne du 14/09
  (« remplacer --gabarit par une mesure »).

- **TF-1089** — `oracles/verifier-fiche-securite.mjs` : nouvelle règle FS8, la présence ET le
  remplissage du champ « Population effectivement admise » (TF-0563, l'incident des 3 128 comptes
  invités admis sans que la fiche le dise). Mesuré le 14/09/2026 (preuve de couverture P-1) : une
  instance remplie SANS ce champ rendait déjà PASS sur FS1 à FS7 — ni le contrôle des placeholders
  (FS1) ni celui des 8 sections (FS2) ne voient une LIGNE de champ supprimée à l'intérieur d'une
  section par ailleurs complète. Fixtures à double sens : ligne absente (FAIL) et ligne présente
  mais vide (FAIL), self-test 11/11 → 13/13.
  **Écart constaté en le faisant** : `tools/build-fiche.mjs` (le seul générateur dont la sortie est
  réellement jugée par cet oracle, `tests/oracles/fiche-securite.test.mjs`) n'avait JAMAIS reçu ce
  champ — seul `deliverables/templates/fiche-securite.template.md` (le canevas markdown des kits
  client, TF-0563/d8bb934) l'avait. Sans corriger aussi le générateur, FS8 aurait rendu invérifiable
  toute fiche produite par cette forge. Champ `population_admise` ajouté à la section « 5 ·
  Exposition » ; rythme vertical du tirage retendu (une ligne de table de plus suffisait à faire
  déborder sur une 2e page — mesuré et corrigé localement, `tests/oracles/fiche-securite.test.mjs`
  « TF-0700 — bout en bout », toujours 1 page).

- **TF-1020 (diagnostic, NON CLOS)** — `tools/verifier.mjs` mesure désormais, dans les deux sens,
  quelles polices de la pile `--font-body` du tenant de référence sont réellement présentes sur le
  poste qui rejoue la recette (`policesPresentes`, fichier standard par plateforme, jamais deviné).
  Fait qui motive cette mesure : le job `oracles (ubuntu-latest)` refuse la fiche sécurité sur P3
  (2 pages pour 1 maximum, run 34581219111 du 11/09) alors que `oracles (windows-latest)` la rend
  `ok` — la pile `system-ui, Segoe UI, Roboto, Arial` n'a AUCUNE police nommée installée sur ce
  runner Linux, le navigateur y retombe sur DejaVu Sans (plus large) et le tirage déborde. Mesuré
  ICI (poste Windows) : Segoe UI et Arial présentes, **Roboto absente même sur ce poste** — la
  cause n'est donc pas hypothétique. LE CORRECTIF (police embarquée en `@font-face`, ou
  `fonts-roboto` installée dans `.github/workflows/ci.yml` job `oracles`) N'EST PAS APPLIQUÉ ici :
  aucun runner Linux disponible sur ce poste pour en prouver l'effet, aucun fichier de police
  librement licencié disponible localement à embarquer sans deviner — appliquer l'un ou l'autre
  sans preuve locale serait exactement le défaut que TF-1017 a coûté trois versions à corriger.
  Fixtures à double sens (présente/absente/non mesurable) dans
  `tests/oracles/recette-environnement.test.mjs` (+3, 127 → 130 tests, nombre mis à jour dans
  `.github/workflows/ci.yml`).

### Corrigé
- **TF-1001** — `tools/verifier-rapport.mjs` : six champs que `rapport-engine.mjs` sait rendre
  (`projet`, `date`, `indice`, `auditeur`, `syntheses`, `reprise`) pouvaient rester vides sans
  qu'aucune porte machine ne le dise — le rapport les affichait blancs/« — », le plan de
  remédiation embarqué portait `date: null`, et le manifeste d'écarts du rapport déclarait déjà
  deux absences que personne ne lisait. Portés en AVERTISSEMENT nommé (non bloquant : légitimement
  absents pour certains audits). Ajout d'une règle BLOQUANTE distincte : un `projet`/`titre` qui
  répète le libellé de document que le moteur ajoute déjà (« Rapport d'audit ») dédouble le titre
  rendu (mesuré : `Digit-AI - Rapport d'audit - Rapport d'audit - Produit-61`) — refusé. Fixture
  rouge dédiée `tests/fixtures/rapport-data-titre-duplique.json`, câblée dans le job `batterie`
  aux côtés des fixtures valide/invalide existantes ; `STR` exporté de `rapport-engine.mjs` pour
  partager les libellés FR/EN entre moteur et vérificateur (source unique, pas de chaîne dupliquée).

- **TF-1000** — `tools/build-theme.mjs` : la typographie d'un DESIGN.md (reliquat de scaffold,
  potentiellement la charte d'exemple fictive livrée avec la forge) écrasait silencieusement une
  `branding.typography` pourtant déclarée EXPLICITEMENT dans `tenant.yaml` — un rapport client a
  été rendu dans la police d'un tenant fictif. Priorité inversée pour la typographie (le tenant
  déclaré l'emporte, DESIGN.md ne comble que ce qui manque) ; auto-test à double sens
  `node tools/build-theme.mjs --self-test`, câblé dans `.github/workflows/ci.yml` (job `batterie`).
  Mesuré sur le tenant `exemple` : `--font-body` passe de `system-ui, Segoe UI, Roboto, Arial,
  sans-serif` (DESIGN.md fictif) à `system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif`
  (déclaration réelle du tenant).

## [1.18.0] — 2026-09-11

> **MINEUR** au sens de PADR-0005 : cette version apporte de NOUVEAUX contrôles — portes machine de
> la fiche sécurité, parité FR/EN des gabarits, cohérence du plan de remédiation, couverture
> `couverte_par`, oracle de modèle sémantique, recette qui rejoue la CI — sans rupture de schéma ni
> retrait de contrôle. Numéro choisi en suite du dernier repère posé, `v1.17.0` (18/08/2026).
>
> **RATTRAPAGE DE JOURNAL (TF-1016).** Le journal dormait. La section « [Non publié] » était ouverte
> depuis le **14/08**, le dernier enregistrement la touchant date du **15/08** (`e979c0f`), et
> **onze** enregistrements touchant `tools/`, `core/` et `oracles/` se sont empilés derrière **sans
> une ligne** — jusqu'au 10/09. Chacun est **nommé ci-dessous** (empreinte courte + objet) ; aucun
> n'est résumé par un « divers ». Deux constats sont consignés avec eux, parce qu'ils expliquent la
> dérive plutôt que de la masquer :
>
> 1. les repères `v1.8.0` → `v1.17.0` (14/08 → 18/08) ont été posés **sans entrée de journal** ; ce
>    rattrapage ne les reconstitue pas — il reprend le fil à partir du dernier enregistrement
>    journalisé (`e979c0f`) et couvre tout ce qui suit ;
> 2. `package.json` déclarait encore `1.0.0` sous des repères allant jusqu'à `v1.17.0`. Il est aligné
>    sur **1.18.0** par cette version.
>
> **CE QUI EMPÊCHE LA RÉCIDIVE** : la recette porte désormais une règle de journal. Au-delà de
> `PLAFOND_ENREGISTREMENTS_SANS_JOURNAL` (constante nommée, **5**) enregistrements touchant `tools/`,
> `core/` ou `oracles/` depuis la dernière modification de `CHANGELOG.md`, `node tools/verifier.mjs`
> sort **ROUGE** et **NOMME** les enregistrements à rattraper. Un journal qui dort ne se signale
> jamais lui-même : il fallait une règle qui le réveille.
>
> Le contenu qui était sous « [Non publié] — 2026-08-14 » (qualifié PATCH) est figé ici, sans
> retouche, sous « Contenu de la section « [Non publié] » du 14/08 ».

### Ajouté
- **Pack de doctrine par dimension** (TF-1014, 11/09) : `core/dimensions/doctrine.yaml` (17 dimensions, 152 thèmes, 109 types de preuve, 131 livrables, 17 barèmes) versé mécaniquement par `tools/importer-doctrine.mjs` depuis une extraction de référence pseudonymisée (garde-fou de noms interdits, appariement par identifiant seul), écarts consignés dans `core/dimensions/doctrine-ecarts.md` ; schéma `core/schemas/doctrine.schema.json` ; rendu par `tools/build-referentiel.mjs` (bloc périmètre / preuves / livrables / barème, pack facultatif) ; juge `tools/verifier-referentiel.mjs` (une dimension applicable sans doctrine est incomplète) avec fixtures rouge/verte (`tests/oracles/verifier-referentiel.test.mjs`, 5 tests).
- **Neuf ADR et neuf contrôles dérivés** (TF-1014) : ADR0307, ADR0510, ADR0623 à ADR0627, ADR0629, ADR0709 (FR et EN), marqués `a_completer` là où la source ne cite aucune norme ; contrôles CTL-D02-14, D09-08, D05-17, D05-18, D16-10, D16-11, D15-10, D15-11, D01-16 — 175 → 184 contrôles, 75 → 84 ADR, `invariants.json` inchangé.

- **`bffcc52`** (23/08) — *fiche sécurité : les DEUX formats dans la même passe, et le PDF est RELU*
  (TF-0506). Nouvel oracle `oracles/verifier-pdf.mjs` : le tirage est **relu dans le fichier**
  (P1 intégrité, P2 format, P3 pagination, P4 fraîcheur) au lieu d'être cru sur le retour de la
  commande — le piège du 22/08, un PDF verrouillé par une visionneuse et un ancien tirage revalidé.
  `tools/build-fiche.mjs` rend les deux formats dans la même passe.
- **`d8bb934`** (24/08) — *fiche-securite : le canevas demande QUI est admis et ce qu'un engagement
  engage — et la parité FR/EN cesse d'être une confiance*. Nouvel oracle
  `oracles/verifier-parite-gabarits.mjs` (TF-0563) : un champ présent d'un seul côté est un champ
  absent, et c'est la génération qui échoue.
- **`1d8b57b`** (24/08) — *TF-0553 : `npm test` rejoue la CI en la LISANT — et les deux ensembles
  étaient disjoints DANS LES DEUX SENS*. Nouvel outil `tools/verifier.mjs` : il lit
  `.github/workflows/*.yml` et rejoue ses blocs `run:`, au lieu de tenir une liste recopiée qui
  dérive au premier ajout.
- **`bfe6d6f`** (25/08) — *la porte machine juge désormais la COHÉRENCE du plan, pas seulement sa
  forme* (`tools/rapport-engine.mjs`, +77 lignes de contrôle).
- **`8c90381`** (02/09) — *le PDF de la fiche sécurité est IMPRIMÉ, et il a enfin une porte*
  (TF-0700, TF-0701). Nouveaux `oracles/verifier-fiche-securite.mjs` et `tools/fiche-en-pdf.mjs` :
  le PDF est **imprimé** par le protocole DevTools (drapeau `preferCSSPageSize` mesuré par
  l'auto-test), jamais capturé ; `tools/build-kit.mjs` distribue l'outil au projet audité.
- **`03ec225`** (07/09) — *TF-0862 (GO A-26) : `oracles/verifier-modele-semantique.mjs`*. Le modèle
  sémantique décisionnel est jugé **sur ses fichiers de définition tabulaire**, sans point de
  terminaison d'interrogation : mesure définie une seule fois, relations non ambiguës, table de
  dates marquée, mode de stockage déclaré, rôles de sécurité (MS1–MS6). Mécanise `CTL-D16-01/02`,
  `CTL-D05-02/04/10/13/14`, `CTL-D01-03` ; bindings du profil `powerbi` en 1.1.0 ; recette
  `node --test` 3/3 câblée en CI.
- **`53ca664`** (10/09) — *plan de remédiation : une action peut COUVRIR plusieurs règles*
  (`couverte_par`, D-7 (a)). Moteur de couverture dans `tools/rapport-engine.mjs` (+31) et
  `tools/verifier-rapport.mjs` (+15), avec sa porte `tests/oracles/couverture-plan.test.mjs` : la
  batterie d'oracles passe de **94 à 101 tests**.
- **TF-1017** (11/09) — *la recette rejoue l'ENVIRONNEMENT de la CI, plus seulement ses étapes*.
  `tools/verifier.mjs` pose `CI=true` sur chaque étape rejouée, lit et pose les blocs `env:` du YAML
  aux **trois** niveaux (workflow, job, étape — l'étape l'emportant sur le job, le job sur le
  workflow), et **DIT** chaque condition qu'il ne peut pas reproduire, une ligne `[non rejouable] …`
  par condition : plateformes de la matrice, actions `uses:`, version de Node imposée, valeurs
  `${{ … }}` résolues côté serveur, moteur d'impression, accès réseau aux registres. Le fait
  fondateur, mesuré le 10/09 : **huit exécutions rouges d'affilée** du 24/08 au 10/09 pendant que la
  recette locale rendait vert. Fixtures à double sens : `tests/oracles/recette-environnement.test.mjs`
  (18 tests) et les décisions pures de `tests/verdicts.mjs`.
- **TF-1016** (11/09) — *règle de journal dans la recette* : `PLAFOND_ENREGISTREMENTS_SANS_JOURNAL`,
  `CHEMINS_JOURNALISES`, `verdictJournal()` et `releveJournal()` dans `tools/verifier.mjs`, avec
  fixtures à double sens (au plafond → vert ; plafond + 1 → rouge, les enregistrements nommés ;
  journal en cours d'écriture → vert).

### Modifié

- **`01bf62b`** (21/08) — *TF-0438 : gardes de chiffre sur quatre assertions numériques*
  (`tools/verifier-rapport-html.mjs`).
- **`b1c7899`** (22/08) — *build-fiche : un livrable ne naît plus dans le dépôt de la forge, et il
  porte sa marque* (TF-0505, `tools/build-fiche.mjs`).
- **`14543d0`** (23/08) — *les générateurs de page ADHÈRENT au contrôle des promesses de commentaire*
  (choix humain « 1c ») : une classe ou un attribut nommé dans un commentaire de ces fichiers doit
  exister dans leur code. Signataires : `build-catalogue`, `build-fiche`, `build-referentiel`,
  `build-slides`, `build-theme`, `rapport-engine`. Adhésion volontaire par fichier, chacun joué
  avant signature.
- **`0a172f3`** (02/09) — *la fiche cesse de réserver un tiers de page à ses intitulés, et son NOM
  porte enfin un indice* (TF-0697, TF-0693) : `tools/build-fiche.mjs` refondu, nouvel outil
  `tools/allouer-indice.mjs`.
- **TF-1017** (11/09) — `tests/oracles/verifier-pdf.test.mjs` : le test **déclare** sa dépendance au
  moteur d'impression au lieu de la deviner. Il re-listait lui-même six chemins de navigateurs quand
  `tools/fiche-en-pdf.mjs` en cherche dix ; il demande maintenant à l'outil (`trouverNavigateur`) et,
  surtout, lit la **sortie** de l'outil — code 3 + motif écrit = dépendance absente, donc **SKIP
  motivé sur tous les runners**. Verdict inchangé quand le moteur d'impression est là.
  `.github/workflows/ci.yml` : la batterie d'oracles est recomptée en la JOUANT — **104 tests**
  avant ce lot, **122** après (le nom de l'étape annonçait encore 101, périmé de trois depuis
  `03ec225` ; un intitulé qui compte à la main dérive, exactement comme une liste d'étapes recopiée).

### Corrigé

- **TF-1017** (11/09) — `tests/oracles/maj-versions.test.mjs` : le volet EOL n'a plus **qu'un seul
  verdict par situation**. Il portait un `IN_CI` qui transformait un SKIP en ÉCHEC — « aucun
  composant à statut de fraîcheur » sautait le test en local et le faisait échouer en intégration
  continue, sur une hypothèse écrite en clair dans le message (« registre injoignable ? »). L'une des
  deux causes des huit exécutions rouges. Mesuré le 11/09, l'hypothèse était **fausse** : le registre
  répond, et l'absence de composant à statut de fraîcheur vient de la fixture elle-même (ses deux
  composants sortent en `reco_correctif` et `reco_deprecie`). La situation vaut désormais **SKIP
  motivé partout**, le motif écrit avec ce qui a été MESURÉ — nombre de composants, statuts observés,
  composants non vérifiés — et non avec une cause supposée. Ce qui reste jugé partout, et qui est le
  vrai contrôle (défaut 4) : dès qu'un composant porte un statut de fraîcheur, `eol_non_verifies`
  doit être ≥ 1 et aucun de ces composants ne doit être présenté comme vérifié côté EOL.

### Contenu de la section « [Non publié] » du 14/08, figé ici

> Repris sans retouche, note d'origine comprise. La qualification **PATCH** de cette note vaut pour
> ce seul contenu ; la version 1.18.0 est MINEURE du fait des contrôles ajoutés listés plus haut.

> Numéro de version à figer à la release. **PATCH** au sens de PADR-0005 : corrections de
> citations et complétion d'un corpus de traduction — aucun contrôle ajouté ni retiré, aucun
> schéma touché.

#### Corrigé
- **Migration des citations `standards[]` vers ASVS 5.0.0** (TF-0221, PADR-0010). Les 22
  citations `OWASP ASVS 5.0 — Vxx` employaient la numérotation de chapitres d'**ASVS 4.0.x** :
  **21 réécrites** vers leur cible 5.0.0 réelle, **1 supprimée** (`CTL-D02-01` — 4.0.3 V1
  n'a aucun successeur en 5.0.0), **0 laissée** en 4.0.x. Chaque cible est suivie *exigence par
  exigence* dans le fichier officiel `mapping_v4.0.3_to_v5.0.0.yml`, jamais par translation de
  chapitre : une exigence éclatée donne une **citation multiple**. Quatre citations étaient
  **fausses dans les deux versions** (`ADR0303` TLS, `ADR0305`, `ADR0706` et `CTL-D02-04`
  limitation de débit) — corrigées **et** signalées comme erronées dans le corps de l'ADR
  porteur (FR et EN). Détail par classe et preuves :
  `docs/CORRESPONDANCE-ASVS-4.0.x-5.0.0.md` §6, `docs/MAPPING-CONTROLES-ASVS.md` §7 bis.
  Contrôles porteurs d'une citation ASVS : 10 → **9**.

#### Ajouté
- **Le rapport d'audit se lit par VUES** — doctrine « restitution lisible » portée dans le
  moteur de rendu (TF-0235 volet P4, référentiel `REFERENTIEL-RESTITUTION.md` de forge-design,
  famille `rapport`). Le livrable, c'est le GÉNÉRATEUR : la refonte entre dans
  `tools/rapport-engine.mjs` et `tools/verifier-rapport-html.mjs`, jamais dans un HTML produit.
  Les onglets à plat deviennent **7 vues naviguées**, une question par vue, servant trois
  lecteurs nommés — commanditaire, metteur en œuvre, expert : *Synthèse · Plan d'action ·
  Constats par dimension · Toutes les règles · Architecture & BDD · Données analysées ·
  Méthode & lecture*. Une vue sans donnée n'existe pas et son absence se **déclare**.
  Composants du référentiel : `<body data-restitution="rapport">` ; navigation `[data-vue]`
  tenant aussi le rôle de sommaire du socle (annonce `.toc-d`) ; **routeur à ancres** — un
  renvoi vers `#D05` ouvre la vue qui contient D05 avant d'y défiler, sans quoi les 22 liens
  internes du rapport seraient des affordances mortes ; **4 KPI complets** (valeur, définition,
  repère de lecture, lien d'action) là où trois chiffres s'affichaient nus ; **2 figures à
  question interrogative** (répartition par famille, répartition des verdicts, segments
  juxtaposés et jamais superposés) ; **chemins d'entrée par lecteur** ; **manifeste d'écarts
  calculé** sur l'état réel de la mission — « aucun écart » se déclare aussi.
  **Iso-contenu strict, mesuré** : aucune valeur des données d'audit n'est perdue (relevé
  jeton à jeton sur les deux fixtures) ; le générique — barèmes de score, définitions des
  verdicts, des criticités et des priorités, provenance — quitte les onglets pour vivre **une
  seule fois** en vue Méthode, où les chiffres y renvoient par `aria-describedby`. Deux
  reformulations assumées : la colonne « Note » du dictionnaire ERD devient « Remarque »
  (ce n'est pas une colonne calculée), et la légende ERD cite ses mots-clés SQL en `<code>`.
- **Tableaux longs exploitables** : au-delà de 8 lignes, tout tableau du rapport porte le
  composant de filtres de colonne du socle (asset vendoré `tools/table-filters.mjs`,
  checklist G1-G6 : `data-filterable`, `id`, `<thead>`, compteur `aria-live`, réaffichage des
  lignes filtrées à l'impression) et une recherche libre qui **se compose** avec les filtres
  au lieu de les écraser. Un tableau qui ne doit pas être filtré porte son motif — sans motif,
  ce n'est pas une exemption.
- **Le gate de rendu contrôle le contrat de restitution** (`verifier-rapport-html.mjs`) avec la
  même exigence de preuve que le reste : famille déclarée, KPI complets et reliés à leur repère,
  **appariement exact sommaire ↔ vues** (une vue sans entrée de sommaire est un chapitre perdu,
  une entrée sans section un lien mort — les deux font échouer la génération), figures
  interrogatives, chemins de lecteur, manifeste non vide, câblage des tableaux longs. Le moteur
  est toujours COMPILÉ puis EXÉCUTÉ, et **chaque vue déclarée est pilotée** comme au clic.
  Batterie des oracles : 55 → **62 tests**, chaque règle nouvelle ayant sa fixture rouge.
- **Corpus EN complété, pack anglais de nouveau émis** (TF-0220, PADR-0011) :
  `core/controls-en/D17.json` créé (4 contrôles de gouvernance IA) et `CTL-D07-08`/`CTL-D07-09`
  ajoutés à `core/controls-en/D07.json`. `assemble-core.mjs` refusait d'émettre
  `controls-core-v1.en.json` depuis l'ajout de D17 (169/175) : les **deux packs sortent à
  nouveau** (175 FR + 175 EN), parité FR/EN vérifiée contrôle à contrôle.

## [1.7.0] — 2026-08-12

> TF-0110 : gouvernance IA, policy-as-code, réalignement FinOps, pilier soutenabilité.

### Ajouté
- **Dimension `D17 · Gouvernance IA`** (18e dimension, famille `securite`) : classification du
  risque des systèmes IA, dérive de modèle, supervision humaine, documentation de conformité
  (ISO/IEC 42001, NIST AI RMF, EU AI Act) — `ADR0109`, 4 contrôles `CTL-D17-01..04` (PADR-0009,
  évolution additive, MINEURE). `control.schema.json`/`tenant.schema.json` étendent leur regex de
  dimension (`D00`–`D16` → `D00`–`D17`).
- **`CTL-D07-08`** (maturité FinOps Crawl/Walk/Run par capacité et par périmètre de dépense) et
  **`CTL-D07-09`** (impact environnemental des décisions d'hébergement, extension qualitative du
  pilier soutenabilité — `ADR0110`) : 175 contrôles au total.
- **Démonstrateur policy-as-code** (`profiles/policy-as-code/`) : 3 règles Rego (OPA/conftest)
  sur un sous-ensemble de contrôles (`CTL-D07-01`, `CTL-D07-04`, `CTL-D02-11`), fixtures IaC
  verte/rouge, exécutées via `conftest` (preuve, pas de migration du corpus).

### Modifié
- `ADR0107` (gouvernance des coûts) réaligné sur le FinOps Framework 2025/2026 (Scopes,
  Domaines/Capacités, Personas, maturité Crawl/Walk/Run par capacité) — les contrôles existants
  `CTL-D07-01..07` restent inchangés.
- `tools/assemble-core.mjs` : le nombre de dimensions n'est plus codé en dur, il se lit dans
  `dimensions.yaml` (évite la dérive documentaire signalée par TF-0113).

## [1.6.0] — 2026-07-15

> Découplage produit/tenant (RAF-027..030) : AuditCore devient un dépôt autonome
> (`digit-ai-forge-auditcore`, nommé `digit-ai-auditcore` à la date de cette release) qui ne
> connaît AUCUN tenant réel — l'espace de l'engagement
> historique (overlay, mapping, baseline d'iso-test, plan, registre) vit dans le dépôt client.

### Ajouté
- **Tenant `exemple`** (`config/tenants/exemple/`, ACME 100 % fictif) : base d'onboarding
  documentée — valide, kits compliance (8 entrées) + audit (32 entrées) générables.
- **Golden-test synthétique** (`tests/test-golden-buckets.mjs`, 9 assertions) : buckets
  `binding_authorities` + bascule de juridiction prouvés en CI sur `tests/fixtures/pack-fixture.json`
  (10 contraintes fictives) — plus aucune dépendance à un tenant réel dans la batterie.
- **Lint agnosticité v2** : niveau N0 repo-wide — aucun nom de tenant réel toléré dans le
  dépôt produit (gate CI, termes construits par concaténation pour rester auto-vérifiable).

### Modifié
- `merge-packs.mjs` : `--derive-pack` et `--iso-test` exigent `--baseline/--pack/--tenant`
  en flags (plus aucun défaut pointant un tenant) ; l'alias historique de dérivation du pack
  du tenant de référence est retiré. L'iso-comportement 91/91 se rejoue dans le dépôt de l'engagement.
- Fixtures `rapport-data-*.json` : tenant fictif ACME.
- Documentation produit neutralisée : les exemples pointent le tenant `exemple` ;
  le tenant historique n'est plus nommé (« tenant de référence »).

### Retiré
- `config/tenants/<tenant-réel>/` (overlay, packs, mapping 91→core, thème) — déplacé dans
  le dépôt d'engagement (`tenants/`), avec `STATUS`, `KIT-PARITE`, `RESTE-A-FAIRE`,
  `SEPARATION-PRODUIT-TENANT` (docs d'engagement) ; `deliverables/generated/` purgé (RAF-028).

## [1.5.0] — 2026-07-12

> Exécution des catégories A, C, D, E du registre RESTE-A-FAIRE (B — étapes humaines — inchangée).

### Ajouté
- **Domaine 09 · UX & Accessibilité** (PADR-0008) : OPTIONNEL → évolution MINEURE (00–08 requis,
  09 permis) ; ADR0901/0902 rédigés, contrôles D11/D13-05 rattachés — **couverture 73/73 ADRs**.
- **8 ADRs** (RAF-007/008) : incident (ADR0210), vulnérabilités (ADR0211), gouvernance sécurité
  (ADR0212), notification de violation (ADR0213), réversibilité (ADR0108), souveraineté (ADR0612),
  accessibilité (ADR0901), gouvernance UX (ADR0902) + **7 contrôles dérivés** (162 → 169).
- **Juridictions** (RAF-011) : champ `jurisdiction` (12 contrôles D04 « eu »), manifestes
  `profiles/jurisdictions/` (eu + démo), fusion → `sans_objet` motivé hors juridiction active
  (prouvé dans les deux sens) ; contrôle AI Act art. 26-27 (RAF-009, CTL-D04-11).
- **Moteur v1.5** (RAF-005) : ERD BDD (bandes, PII 🔒, FK/références logiques, dictionnaire) +
  schéma d'architecture auto-layout (barycentre) — onglet « Architecture & BDD » ; hérités par
  les kits standalone. **Double gate de rendu** (RAF-006) : `verifier-rapport-html.mjs`.
- **Générateurs** : `build-referentiel` (M4, 310 Ko consultable), `build-slides` (M6, 5 diapos),
  `build-fiche` (M9, 8 sections) + gabarit `methodologie.template.md` (M1) — kit audit **32 entrées** ;
  **PARITÉ 15/15 avec le kit tenant.**
- **i18n EN** (RAF-012) : corpus traduit (73 ADRs `adr-en/`, 169 contrôles `controls-en/` →
  pack `controls-core-v1.en.json` émis, 5 gabarits `.en`), moteur bilingue (STR), labels EN
  (17 dimensions + 6 familles), sélection automatique par `tenant.language` — **kit anglais
  prouvé E2E 6/6** (ACME en).
- **CI** (RAF-019) : `.github/workflows/ci.yml` — lint agnosticité + batterie complète en gate.
- **Gouvernance** (RAF-017) : `docs/GOUVERNANCE-STANDARDS.md` (checklist semestrielle, revue n°1).
- **Bindings azure étendus** (RAF-010) : couverture élargie au-delà des 42 Fatal/Bloquant.

### Modifié / hygiène
- Graphe de connaissance ré-étendu (RAF-021) : 901 → **1 064 nœuds**, 53 communautés.
- `rtk trust` appliqué (RAF-020) ; zip doublon supprimé, `tools/rtk.zip` conservé documenté (RAF-023).
- Exclusions E re-vérifiées : DORA-réglementaire, portage 1:1 moteur tenant, retrofit legacy — tracées.

## [1.4.0] — 2026-07-12

### Ajouté
- **M5 v1** — moteur de rendu du rapport : `tools/rapport-engine.mjs` (fonction pure
  données+config→HTML : bandeau gate, KPIs calculés, radar SVG par famille, onglets
  familles→dimensions avec matrice de traçabilité, constats/actions triés, onglet
  « Toutes les règles » filtrable, reprise, impression) + CLI `build-rapport.mjs` +
  **variante standalone bakée dans le kit audit** (thème, dimensions, index des 253 règles
  inlinés — zéro dépendance). Hors v1 (→ v1.5) : ERD BDD, schéma d'architecture auto-layout.
- **M7** — `tools/build-catalogue.mjs` : catalogue HTML navigable des 65 ADRs (filtre par
  domaine, recherche, standards et règles dérivées par carte), généré par tenant et
  **embarqué dans le kit audit**.
- Kits audit : 27 → **29 entrées** (`build-rapport-standalone.mjs` + `catalogue-adr.html`).
  **Plus aucun manquant bloquant à la parité** (KIT-PARITE : 10 ✅ · 3 🟠 · 0 ❌ · 1 ⚪).
- `docs/RESTE-A-FAIRE.md` — registre consolidé du reste-à-faire (26 items RAF-001..026,
  5 catégories, preuve d'exhaustivité par source) : LE point d'entrée des reprises de session.
- **Bascule du kit tenant officiel** : kit `20260712a` du tenant de référence (espace engagement) +
  `Kit Compliance Pack` désormais produits par `build-kit` (RAF-022) ; le kit manuel
  `20260710i` est archivé dans `output/old/`.

### Corrigé
- `build-catalogue`/`build-rapport` : le chemin du yaml tenant n'est plus supposé s'appeler
  `tenant.yaml` (les fixtures/kits marque-blanche à nom libre fonctionnent).

## [1.3.0] — 2026-07-12

### Ajouté
- **12 contrôles** matérialisant l'intention des ADRs orphelins (EXTENSION-CORPUS §1) :
  D01 (zonage, tiers de confiance API/fichiers, retrait d'API), D02 (egress), D03 (clients
  publics sans secret), D05 ×6 (restitution BI : modèle sémantique, source unique,
  transformations, dimension temps, modes d'accès, certification) — **150 → 162, couverture
  ADR 65/65, 0 orphelin** ; + 2 rattachements (ADR0805→CTL-D11-05, ADR0602→CTL-D16-03).
- **M2** `templates/prompt-conduite-audit.template.md` (prompt de conduite générique — parité
  avec le prompt tenant : règles d'or, 3 phases, sortie `rapport-data.json` + backlog forge).
- **M3** `templates/prompt-verification-rapport.template.md` (boucle corrective de gate).
- **M8** `templates/compliance-skill.template.md` + génération substituée par `build-kit`
  dans les deux kits (0 placeholder).

### Modifié
- Relabel D05 → « Données, qualité & restitution » (absorbe le domaine BI, recommandation
  EXTENSION §1) ; renommage `DORA` → `DORA (Accelerate)` (30 occ., lève l'ambiguïté avec le
  règlement UE 2022/2554) ; kits du tenant de référence `20260712c` (compliance 8 · audit 27 entrées), ACME `b`.

## [1.2.0] — 2026-07-12

### Ajouté
- **Documentation produit** (`docs/`) : KIT-PARITE (matrice 15/15 vs kit tenant `20260710i`,
  9 manquants M1–M9, backlog v1.2/v1.3), ONBOARDING-ENTRANTS (27 entrants mappés 1:1 sur le
  schéma, checklist client), MANUEL-IA-ONBOARDING (runbook 10 étapes, 3 gates + HITL client),
  MANUEL-ENTREPRISE (parcours complet, non technique), AUDIT-AGNOSTICITE, EXTENSION-CORPUS.
- **lint-agnostic** (`tools/lint-agnostic.mjs`) : gate CI d'agnosticité du core (denylist N1
  ~40 termes + motifs N2, frontières Unicode, corps ADRs + champs des contrôles).

### Modifié
- **Audit d'agnosticité 65/65** : 5 ADRs reformulés (ADR0101 « zonage cloisonné », ADR0103,
  ADR0201 (retrait produits OSS de l'exemplaire), ADR0502 « délégation d'exploitation
  maximale » + NIST SP 800-145 en standard, ADR0805 énumération ouverte) — lint 0 finding,
  iso-test 91/91 maintenu, kits du tenant de référence régénérés (`20260712b`).

## [1.1.0] — 2026-07-12

### Ajouté
- **build-kit** (`tools/build-kit.mjs`) : kits marque-blanche distribuables en zip par tenant —
  `--kind compliance` (part du projet audité : contraintes fusionnées, banc de preuves, **vérificateur
  autonome zéro dépendance**, gabarit fiche sécurité, thème) et `--kind audit` (équipe d'audit :
  + dimensions, 13 gabarits, schémas, init-workspace autonome). Indice de version quotidien auto (a, b, c…).
- **ziplib** (`tools/ziplib.mjs`) : écriture ZIP native Node (deflate `node:zlib`, CRC-32), zéro dépendance.
- Kits générés et vérifiés pour 2 tenants (tenant de référence : compliance 7 entrées + audit 23 ; ACME : compliance 7) —
  intégrité testée, vérificateur autonome exécuté hors kit avec verdicts corrects.

## [1.0.0] — 2026-07-11

Première release du core générique (exécution du plan [PLAN/](../PLAN/README.md)).

### Ajouté
- **Modèle 3 couches** core > profil > overlay, décisions PADR-0001…0007.
- **Corpus ADR core** : ~65 ADR de principe (MADR), 9 domaines, chacun mappé à ≥ 1 standard
  (ISO/IEC 25010 · 27001/27002:2022 · 27701 · NIST CSF/SSDF/800-63B/800-207 · OWASP ASVS 5.0/SAMM ·
  CIS · DORA · 12-Factor · SLSA · SemVer · OpenAPI · WCAG 2.2 · RGPD · AI Act · DMBOK · Kimball).
- **Référentiel de contrôles** : 17 dimensions D00–D16 (6 familles), ~140 contrôles CTL sourcés,
  applicabilité par type de projet (web-app, api, data, mobile, ml, infra).
- **Moteurs conservés** du terrain : scoring 1–5 « pas de score sans preuve », criticité 4 niveaux,
  verdicts 5 états, enforcement 4 niveaux, gates 1a/1b, matrice de traçabilité, banc de preuves.
- **Schémas** : tenant.yaml, control, remediation-actions (JSON Schema draft-07).
- **Outils** : validate-config · build-theme · merge-packs (+ test iso 91/91) · verifier-rapport ·
  init-audit-workspace · forge-adapter (formats forge vérifiés sur le dépôt digit-ai-forge-development,
  nommé `digit-ai-saas-forge` à la date de cette release).
- **Profils** : azure, databricks-lakehouse, powerbi, elastic. **Overlay de référence** : le tenant historique (espace engagement depuis 1.6.0).

### Standards sources (état à la release)
OWASP ASVS 5.0 · WCAG 2.2 · ISO/IEC 27002:2022 · NIST SSDF v1.1 · DORA (Accelerate) ·
RGPD (2016/679) · AI Act (2024/1689) · SLSA v1.0 · DMBOK v2.
