<!-- AuditCore template v1 — M3 · prompt de vérification/correction du rapport -->
# Prompt de vérification — Contrôle de format du rapport ({{tenant.name}})

> **Usage** : après production de `rapport-data.json` (prompt de conduite, phase 3), boucle
> corrective jusqu'à diffusabilité. À exécuter par l'agent auditeur ou un agent dédié.

## Boucle (jusqu'à exit 0)

1. Exécute : `node verifier-rapport-standalone.mjs rapport-data.json`
2. **Exit 0 → STOP** : le rapport est diffusable ; consigne la sortie du vérificateur comme
   preuve de gate dans le dossier d'audit.
3. Sinon, pour **chaque** erreur listée, corrige **les données uniquement** :
   - placeholder résiduel → renseigner la valeur réelle (jamais la masquer) ;
   - dimension manquante → l'instruire ou la déclarer `off` selon la matrice d'applicabilité
     (motif obligatoire) — **jamais la supprimer du contrat** ;
   - score sans preuve → ajouter la preuve `fichier:ligne` réelle, ou retirer le score et
     rouvrir l'investigation (règle : « pas de score sans preuve ») ;
   - verdict manquant/invalide → instruire la règle ; `sans_objet`/`a_evaluer` exigent un
     motif précis et spécifique (pas de motif générique copié-collé) ;
   - constat sans preuve / action orpheline → compléter la traçabilité constat↔preuve↔règle↔action ;
   - auto-portance → supprimer toute référence à un audit antérieur, reformuler au présent.
4. Relance l'étape 1.

## Interdits absolus

- Modifier les gabarits, le vérificateur ou le moteur de rendu pour « faire passer » le gate.
- Inventer une preuve, un motif ou une valeur pour lever une erreur.
- Dégrader un verdict en `sans_objet` sans justification factuelle vérifiable.

## Condition d'arrêt

**3 échecs consécutifs sur la même erreur** → STOP : rapport d'anomalie à l'humain
(erreur exacte, corrections tentées, hypothèse de cause), sans diffusion du rapport.
