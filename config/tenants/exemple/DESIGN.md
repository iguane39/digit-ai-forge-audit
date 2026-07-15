---
name: ACME — charte livrables d'audit (exemple fictif, RAF-030)
version: 1.0.0
colors:
  primary: "#3B5BDB"
  ink: "#1b2733"
  background: "#f5f6fa"
  muted: "#5f7081"
  danger: "#a3231c"
  warning: "#9a4a06"
  success: "#136e34"
typography:
  body: "system-ui, Segoe UI, Roboto, Arial, sans-serif"
  mono: "JetBrains Mono, Consolas, monospace"
---

# ACME — charte graphique (FICTIVE)

> Ce document illustre le format attendu de `branding.design_md` pour un tenant réel :
> une page Markdown avec frontmatter, remise par la DirCom du client (souvent convertie
> depuis un PDF/PPT de charte), qui sert de référence aux rendus HTML et à la forge.

## Couleurs

| Usage | Hex | Note |
|---|---|---|
| Accent principal | `#3B5BDB` | Boutons, liens, radar |
| Fond de panneau | `#f5f6fa` | Cartouches, encarts |
| Marque (fond sombre) | `#1A1A2E` | En-tête de rapport |

Les criticités (fatal `#a3231c`, bloquant `#9a4a06`, majeur `#8a6500`, standard `#136e34`)
suivent la palette produit par défaut — un tenant peut les surcharger dans `tenant.yaml`.

## Typographies

- Corps : pile système (`system-ui, Segoe UI, Roboto, Arial`).
- Code / identifiants : `JetBrains Mono, Consolas`.

## Ton éditorial

Sobriété, phrases courtes, vouvoiement. Les rapports d'audit ACME s'adressent à un comité
de direction : pas de jargon sans définition, chaque verdict cite sa preuve.
