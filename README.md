# AuditCore — framework d'audit & remédiation générique (by Digit-AI)

> Produit issu de l'exécution du plan [PLAN/](../PLAN/README.md) : un framework d'audit
> **agnostique** (technologies, langages, BDD, cloud), **marque-blanche** et **multi-tenant**,
> couplé à la forge [digit-ai-forge-development](https://github.com/iguane39/digit-ai-forge-development)
> pour la remédiation. Le comportement actuel du tenant de référence est reproduit par
> Le produit ne contient AUCUN tenant réel : `config/tenants/exemple/` (ACME, fictif) sert de
> base d'onboarding, et la logique de fusion est prouvée par le golden-test synthétique
> (`tests/test-golden-buckets.mjs`). L'iso-comportement d'un tenant réel (`--iso-test`) se
> rejoue dans le dépôt de son engagement.

**Version du core : 1.0.0** (SemVer — décision PADR-0005). Nom produit : **AuditCore** (PADR-0007).

## Catalogue de services

> Section proposée par la campagne « catalogues » du pilot (2026-08-13) — générée depuis
> la source unique `catalogues/catalogue.jsonl` du pilot (v1.6.0, challengée état de
> l'art le 12/08/2026). **prouvé** = preuve exécutée ; *déclaré* = méthode documentée seulement.

| Service | Intention (« je veux… ») | Point d'entrée | Statut |
|---|---|---|---|
| **Référentiel d'audit POC-to-Prod** | auditer la gouvernance et l'architecture de mon produit vers la production | `core\ (adr, controls, dimensions, invariants.json) — dépôt public MIT, marque blanche AuditCore` | prouvé (production) |
| **Oracles d'audit** | vérifier mécaniquement parcours et couverture fonctionnelle | `node oracles\smoke-parcours.mjs · node oracles\verifier-couverture-fonctionnelle.mjs` | prouvé (production) |
| **Engagement d'audit par tenant** | mener un engagement client isolé consommant le référentiel | `dépôt d'engagement privé par client, consommant le produit en submodule pinné — sur mandat humain` | prouvé (production) |
| **Policy-as-code (démonstrateur OPA)** | transformer des contrôles déclaratifs en gate exécuté sur l'IaC | `profiles\policy-as-code\ (conftest via Docker)` | prouvé (experimental) |

Le catalogue consolidé des dix forges vit chez le pilot :
[digit-ai-factory/catalogues/CATALOGUES.md](https://github.com/iguane39/digit-ai-factory/blob/main/catalogues/CATALOGUES.md).

## Arborescence

```
auditcore/
├── docs/decisions/          # ADRs du produit (PADR — décisions actées)
├── core/                    # LA couche générique invariante, versionnée
│   ├── adr/<domaine>/       # 75 ADR de principe (MADR), 10 domaines (09 UX optionnel) — + miroir EN adr-en/
│   ├── controls/            # 175 contrôles CTL-Dxx-nn (+ pack EN controls-core-v1.en.json)
│   ├── dimensions/          # 18 dimensions D00–D17, 6 familles, applicabilité par type
│   └── schemas/             # JSON Schemas : tenant, contrôle, actions de remédiation
├── profiles/                # packs technologiques (azure, databricks-lakehouse, powerbi, elastic,
│                             #   policy-as-code — démonstrateur OPA/Rego sur 3 contrôles, TF-0110)
├── config/tenants/<tenant>/ # overlays entreprise (branding, packs, aliases) — exemple = ACME fictif
├── deliverables/templates/  # gabarits des livrables (rapport, banc, matrices, + 6 nouveaux)
├── tools/                   # validate-config · build-theme · merge-packs · verifier · init · forge-adapter
│                            #   · build-fiche (nom date, indice alloue) · fiche-en-pdf (imprime, jamais capture)
└── tests/                   # fixtures invalides (validateur), test iso, exemple adaptateur forge
```

## Démarrage

```bash
node tools/validate-config.mjs config/tenants/exemple/tenant.yaml # valider un tenant
node tools/build-theme.mjs   config/tenants/exemple/tenant.yaml   # générer theme.css + en-tête
node tools/merge-packs.mjs   config/tenants/exemple/tenant.yaml   # fusion core+profils+overlay
node tools/merge-packs.mjs   --iso-test                           # preuve d'iso-comportement (91/91)
node tools/init-audit-workspace.mjs <dossier> --tenant exemple    # espace de travail d'audit
node tools/forge-adapter.mjs tests/fixtures/remediation-actions.example.yaml --out <repo-cible>
node tools/build-kit.mjs     config/tenants/exemple/tenant.yaml --kind both # kits zip distribuables
node tools/build-fiche.mjs   config/tenants/exemple/tenant.yaml --produit <racine>  # fiche securite : HTML **ET PDF**
#   les DEUX formats dans la MEME passe (TF-0506) : le catalogue en declare deux, un jeu incomplet
#   ne se remet pas — c'est le commanditaire qui avait du reclamer le PDF le 22/08. Rendu par le
#   moteur d'impression du navigateur du poste (Edge sinon Chrome), la feuille de style du gabarit
#   faisant foi pour les marges. Aucune dependance, aucun binaire embarque.
#   `--sans-pdf` assume l'ecart et le DIT ; sans navigateur : code 3 et motif ecrit, jamais un
#   PASS silencieux.
#   NOM DATE ET INDICE ALLOUE (TF-0693) : `fiche-securite-<tenant>-<AAAAMMJJ><indice>.html`, et la
#   REFERENCE imprimee DANS la fiche derive du meme couple — plus deux sources a tenir d'accord.
#   Meme contenu regenere -> meme indice ; contenu different -> indice suivant. Quatre ecrasements
#   du meme nom en 80 minutes, dont deux pousses, avaient ete payes faute de cette lettre.
node tools/fiche-en-pdf.mjs  <fiche.html> [--out <fiche.pdf>] [--pages-max 1]
#   LE PDF EST IMPRIME DEPUIS LE HTML, JAMAIS CAPTURE (TF-0700). Pilote le moteur d'impression
#   d'un navigateur deja present, par le protocole DevTools : media `print`, fonds imprimes, et
#   surtout TAILLE DE PAGE PRISE DANS LA CSS — sans ce dernier reglage le moteur impose ses
#   propres format et marges et IGNORE le @page du gabarit (mesure : 612x792 pt, US Letter,
#   contre 595x842 pt). Le PDF porte le MEME indice que son HTML, sinon il REFUSE. Requiert
#   Node >= 22 (WebSocket natif) ; sinon SKIP motive, jamais un PASS silencieux.
node oracles/verifier-fiche-securite.mjs <fiche.html> [--seuil-texte 300] [--sans-pdf]
#   LA PORTE BLOQUANTE DE LA FICHE (TF-0701), symetrique de celle du rapport : la fiche n'est
#   CONFORME (diffusable) que si exit code = 0. FS1 zero placeholder · FS2 les 8 sections ·
#   FS3/FS3bis reference <TRI>-SEC-DEV-<AAAAMMJJ><indice> identique en-tete/pied et egale a
#   l'indice du NOM · FS4 lien DEV · FS5 colonne d'intitules <= 25 % et table-layout fixe
#   (TF-0697) · FS6 PDF present et de meme indice · FS7 TEXTE EXTRACTIBLE au-dessus d'un seuil —
#   un PDF de fiche sans texte est une CAPTURE : muette pour un lecteur d'ecran, non
#   recherchable, non controlable, ~5x plus lourde. `--self-test` : 11 cas a double sens.
node oracles/verifier-pdf.mjs <fichier.pdf> --format A4 --apres <ms> --source <html>
#   ON RELIT LE FICHIER, ON NE CROIT PAS LA COMMANDE. P1 complet (%%EOF) · P2 format lu dans
#   /MediaBox · P3 pages comptees · P4 FRAICHEUR — c'est P4 qui attrape le verrou Windows, ou une
#   visionneuse ouverte fait echouer l'ecriture EN SILENCE et laisse revalider l'ancien tirage.
node tools/build-catalogue.mjs config/tenants/exemple/tenant.yaml           # catalogue ADR navigable (M7)
node tools/build-rapport.mjs <rapport-data.json> --tenant config/tenants/exemple/tenant.yaml # rendu rapport (M5)
#   --kind compliance : la part du PROJET AUDITÉ (contraintes fusionnées, banc, vérificateur AUTONOME,
#                       fiche sécurité, thème) · --kind audit : la part de l'équipe qui conduit l'audit
#   indice de version auto (a, b, c… par jour) · zip natif sans dépendance (tools/ziplib.mjs)
```

## Invariants (rappel — [PLAN/01](../PLAN/01-modele-abstraction.md))

Précédence `core > profil > overlay` · un overlay ajoute/durcit/nomme/habille, jamais n'affaiblit un
`invariant: true` · « pas de score sans preuve » · aucun nom d'éditeur/produit/cloud dans `core/` ·
chaque contrôle cite ≥ 1 standard · le taux d'automatisation forge est mesuré, jamais objectivé.
