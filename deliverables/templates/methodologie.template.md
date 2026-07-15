<!-- AuditCore template v1 — M1 · méthodologie d'organisation d'audit (généralise la méthodologie du profil de référence) -->
# {{tenant.name}} — Méthodologie d'organisation d'un audit

> Document unifié : nomenclature, arborescences, règles impératives. À lire **en premier**
> par tout auditeur (humain ou agent IA). Complète le prompt de conduite
> (`prompt-conduite-audit`) qui, lui, pilote l'exécution.

## 1 · Nomenclature des livrables

`{{tenant.name}} - <TRI> - <Nom Document> - <AAAAMMJJ><indice>.<ext>`
- `<TRI>` : trigramme de l'application auditée.
- Date inversée **vérifiée** (jamais supposée) ; indice `a`, puis `b`, `c`… pour les
  itérations du même jour — **prochain indice libre** en comptant courants **et** `Old/`.
- Pas de « v1/v2 » dans les noms de fichiers.

## 2 · Arborescences normalisées

`input/` (entrants d'audit) : `00 - Cadrage · 01 - Code & dépôt · 02 - Architecture & IaC ·
03 - Sécurité & secrets · 04 - Données · 05 - Tests & CI-CD · 06 - Observabilité ·
07 - Docs & gouvernance`
`output/` (livrables produits) : `00 - Rapport d'audit · 01 - Fiche Sécurité ·
02 - Présentation autorité de décision · 03 - Scans & preuves · 04 - Schémas & annexes · Old/`
Échafaudage : `node init-audit-workspace-standalone.mjs <dossier>` (idempotent).

## 3 · Les 12 règles impératives

1. **Feuille blanche** — aucun résultat d'audit antérieur comme source ni point de départ.
2. **Rapport auto-portant** — aucun renvoi à un audit précédent, statuts au présent.
3. **Evidence-based** — chaque constat/score : preuve `fichier:ligne`, extrait, commande.
4. **Pas de score sans preuve** (invariant du référentiel).
5. **Exhaustivité & intransigeance juste** — toutes les règles applicables instruites,
   aucun faux positif, l'absence de preuve est un écart.
6. **Ne pas modifier le moteur** — seules les **données** changent (gabarits, moteur de
   rendu et vérificateurs sont intouchables).
7. **Vérification obligatoire avant diffusion** — `node verifier-rapport-standalone.mjs
   <rapport-data.json>` doit sortir 0 (puis vérificateur de rendu si HTML produit).
8. **Ne jamais écraser** — nouvelle version = nouvel indice ; l'ancienne part dans `Old/`.
9. **Les projets audités ne créent pas d'ADR** — les décisions vivent dans le corpus core
   et les overlays, jamais dans les livrables d'un audit.
10. **Applicabilité honnête** — dimensions et règles `sans objet`/`à évaluer` toujours
    motivées précisément (les motifs génériques sont refusés).
11. **Opposabilité** — seules les règles `bucket: opposable` de statut accepté produisent
    des bloquants ; le reste se signale.
12. **Communication en clair** — messages aux interlocuteurs humains en texte simple,
    jamais enfouis dans des blocs de code.

## 4 · Livrables attendus d'un audit

| Livrable | Emplacement | Gate |
|---|---|---|
| `rapport-data.json` + rapport rendu | `output/00 - Rapport d'audit/` | vérificateurs (données + rendu) |
| Fiche sécurité (8 sections, 0 placeholder) | `output/01 - Fiche Sécurité/` | relecture {{roles.security_officer}} |
| Présentation à {{roles.decision_authority}} | `output/02 - Présentation autorité de décision/` | schéma d'architecture = celui du rapport |
| Scans & preuves (+ manifeste) | `output/03 - Scans & preuves/` | référencés `fichier:ligne` |
| `remediation-actions.yaml` | `output/00 - Rapport d'audit/` | schéma validé (backlog forge) |

## 5 · Outils du kit

`init-audit-workspace-standalone.mjs` · `verifier-rapport-standalone.mjs` ·
`build-rapport-standalone.mjs` · `compliance-skill.md` (agent codeur/CI) ·
`banc-de-preuves.md` · `constraints-merged.json` · `catalogue-adr.html` · `dimensions.yaml`.
