# Aide à l'écriture des tests fonctionnels (audit / remédiation)

> Invariant : **un ✓ de conformité fonctionnelle sans test exécuté n'est pas un ✓.** « Le build passe » ≠
> « ça marche ». La remédiation ne *signale* pas les tests manquants : elle les **écrit et les rend verts**.

## Niveau du test = niveau du risque

| Côté | Exiger | Ne PAS se contenter de |
|---|---|---|
| **Back** | test d'**intégration niveau endpoint** : app réelle (`create_app`) + client HTTP + base réelle éphémère. Couvre : nominal, **gardes d'auth** (401/403), **404/400**, invariants métier (upsert, idempotence, anti-collision `business_key`), **jobs protégés par secret** (traitement d'alertes, purge RGPD). | unitaire de **schéma** (Marshmallow/pydantic), qui ne franchit jamais la couche endpoint. |
| **Front** | **e2e de parcours** (navigateur réel, backend **mocké déterministe**) : publier bout-en-bout, modifier, supprimer, import + **téléchargement du template**, filtre avancé appliquer/réinitialiser, alertes. | test de **rendu unitaire** isolé. |

## Discipline de mock (déterminisme, hermétique)

- Mocker au **bon point de couture** les I/O externes : stockage (S3/Blob), e-mail, web push/VAPID, géocodage.
- **Tester d'abord les chemins de garde** qui répondent **avant** tout accès externe (validations, secrets `X-Job-Secret`, RGPD).
- Pour les chemins nominaux, **monkeypatcher** l'envoi externe. Un test qui dépend d'un **service externe réel** (réseau, credentials) est **fragile** → `deps_externes_reelles: true` dans le manifeste (signalé).

## Classer honnêtement le NON-TESTABLE (jamais de faux ✓)

Points sans oracle e2e raisonnable → marquer `non_testable` avec **raison + oracle de substitution** :

| Point | Raison | Oracle de substitution |
|---|---|---|
| Auth par IdP externe (EasyAuth/Entra) | redirection IdP hors navigateur de test | test back des gardes (401/403) + smoke déployé |
| Push navigateur (ServiceWorker/PushManager) | permissions/API navigateur non pilotables | test unitaire de la logique d'abonnement + back `/push-subscriptions` |
| Objet de stockage externe (image S3/Blob) | dépend d'un binaire distant | test back de génération d'URL signée |
| i18n sans sélecteur d'UI | pas de point d'entrée e2e | test unitaire du dictionnaire |

Interdit : compter un non-testable comme couvert, ou fabriquer un test factice.

## Pièges types (défauts réels attrapés en s'exécutant sur la réalité servie)

**Backend**
- `POST create` **n'upserte pas** : la clé métier est **auto-suffixée** en cas de collision (comportement réel ≠ docstring) — vérifier le comportement réel, pas la doc.
- Un **corps JSON vide déclaré `application/json`** fait **lever le parseur → 500** (pas le 400 attendu) selon la gestion d'exception — tester le comportement réel.
- La sortie est en **kebab-case** (conversion kebab↔snake) — asserter la vraie casse.

**Frontend (e2e)**
- Cliquer la **racine d'une carte** sans `onClick` n'ouvre rien → viser le **bouton réel** (« Voir détail »).
- Une requête de détail peut partir **au montage**, pas au clic → ne pas attendre une requête qui ne se reproduira pas.
- Le **nom accessible** d'un bouton inclut l'`aria-label` de son icône (« download Importer ») → **matcher en sous-chaîne**.
- Un champ peut n'être rendu **que sous un seuil responsive** (< 1200px).
- Un **placeholder antd Select** est un `<span>`, pas un attribut d'input.
- Une **case CGU requise** gate la soumission → la cocher avant de soumettre.

## Gate & ratchet (CI)

- La CI **exécute** les tests d'intégration back + e2e front comme **gate bloquant**.
- `verifier-couverture-fonctionnelle.mjs --manifest couverture.json [--source <dir>] [--ratchet baseline.json]` :
  matrice de couverture, rejette les faux ✓ (build/lint/schéma/unit), détecte les endpoints du code absents du
  manifeste, et applique un **ratchet** (la couverture ne peut que monter). Voir `README.md`.
- **Toute évolution/durcissement de comportement s'accompagne du test fonctionnel exécuté correspondant.**

## Colonne « oracle sur la réalité déployée » (par environnement)

Un test **mocké** couvre le **code**, pas l'**environnement**. Pour tout point fonctionnel qui dépend, à
l'exécution, d'un artefact/donnée/config **propre à un env** (blob de stockage, seed/données de référence,
en-tête CSP `connect-src`/`img-src`, var d'env, feature flag, hôte externe), un ✓ n'est valable que s'il
existe un **smoke exécuté PAR ENV sur la ressource réelle** — géré par `verifier-dependances-env.mjs` :
- **P1** provisioning-as-code **idempotent par env** (jamais « chargé une fois à la main en dev ») ;
- **P2** smoke **bloquant par env** sur la ressource servie (blob `exists`, en-tête servi contient l'hôte,
  endpoint clé 200, donnée de référence non vide) — jamais sur un mock ;
- **P4** parité : un env bâti depuis une **branche figée ≠ canonique sans synchro** rate les correctifs ;
- **P5** échecs silencieux : un `fetch` dont l'erreur est avalée (`.catch(()=>{})`, catch log-only) est un
  défaut **doublement invisible** (utilisateur + test) — le faire **remonter visiblement**.

Incident type : bouton « Télécharger le template » → **404 en qualif** (blob provisionné dev-only), CSP
corrigée sur `main` mais pas sur la branche de qualif, erreur `fetch` avalée. Aucun test mocké ne le voyait.
