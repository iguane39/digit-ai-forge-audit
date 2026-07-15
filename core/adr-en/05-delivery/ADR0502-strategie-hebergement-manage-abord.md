---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "architects, FinOps managers"
informed: "product teams"
id: ADR0502
domain: "05"
invariant: false
standards: ["12-Factor — IV. Backing services", "FinOps Foundation — principes de responsabilisation et d'optimisation continue", "NIST SSDF — PO.5", "NIST SP 800-145 (modèles de service — instanciation cloud de l'échelle de délégation)"]
derived_controls: [CTL-D01-09, CTL-D06-07, CTL-D06-08]
profile_bindings: optional
---

# Managed-hosting-first strategy (maximum operational delegation)

## Context and Problem Statement

For every application or infrastructure building block, a team must choose a hosting mode. Without an explicit priority rule, the default reflex often falls on the lowest-level infrastructure, the most costly to operate and secure over time. What choice rule, valid for any hosting provider, reduces the operational burden and the scope of responsibility carried by product teams?

## Decision Drivers

* Reducing operational burden (patching, hardening, high availability)
* Controlling total cost of ownership, not just the sticker price
* Time-to-market: immediate availability of managed services
* Reversibility: not ruling out IaaS when it is genuinely justified

## Considered Options

* Managed-first priority: the most delegated service first (fully third-party-operated service, then an operated execution platform, then raw infrastructure only as a justified last resort)
* Free choice left to each team according to its technical preferences
* IaaS by default, with an internal platform standardized on machines or containers

## Decision Outcome

Chosen option: "Managed-first priority (maximum operational delegation)", because every delegation tier given up transfers operational responsibility (patching, resilience, platform security) to the product team; self-administered infrastructure remains possible but becomes a justified and tracked choice, not a reflex — the rule applies to any hosting mode, cloud or on-premises.

### Consequences

* Good, because the operational burden and the security surface to cover decrease mechanically.
* Good, because every step down in delegation is justified and traceable in architecture review.
* Bad, because of increased dependency on the chosen hosting provider's managed services (reversibility to be assessed separately).
* Neutral, because certain cases (regulatory constraints, extreme performance) legitimately justify IaaS.

### Confirmation

Derived control: CTL-D09-03 (hosting choice documented per building block, any deviation from the managed-first order justified and validated in architecture review). Expected evidence: register of hosting choices per component with justification of exceptions. Rating: compliant = priority followed or deviation justified and validated; partial = unjustified but isolated deviation; non-compliant = systematic IaaS choice without analysis.

## Pros and Cons of the Options

### Managed-first priority
* Good, because it reduces operational burden and time-to-market; a universal rule.
* Bad, because it requires an architecture review for every legitimate exception.

### Free choice per team
* Good, because maximum technical autonomy.
* Bad, because operational skills become scattered, and total cost is not controlled.

### IaaS by default, standardized internal platform
* Good, because fine-grained control of the infrastructure.
* Bad, because the operational and platform-security burden is carried on an ongoing basis.

## More Information

In a cloud context, the delegation scale is instantiated as "SaaS → PaaS → IaaS" (NIST SP 800-145 service models). Instantiations: `profil:azure` → App Service/Functions before AKS before virtual machines; `profil:aws` → equivalent managed services before orchestrated containers before raw compute instances. The profile provides the catalog of eligible managed services; on-premises, the scale becomes managed hosting service → standardized internal platform → dedicated servers.
