---
status: "proposed"
date: 2026-07-11
decision-makers: "{roles.decision_authority}"
consulted: "{roles.security_officer}, architects"
informed: "product teams"
id: ADR0703
domain: "07"
invariant: true
standards: ["OWASP ASVS 5.0 — V2.10 (secrets côté client)", "OAuth2 BCP (Best Current Practice)", "ISO/IEC 27002:2022 — 8.24 (usage de la cryptographie)"]
derived_controls: [CTL-D03-09]
---

# API Consumption from Clients Without Secret Exposure

## Context and Problem Statement

A public client (mobile application, browser-based application, distributed script) that
embeds an API key or application secret exposes that secret to anyone who inspects the
client. How can public clients be allowed to consume protected APIs without ever
entrusting them with a secret they cannot keep confidential?

## Decision Drivers

* No static secret should reside in a client controlled by the end user
* End-user authentication distinct from application authentication
* Immediate revocation of a compromised access without redeploying the client
* Compatibility with multiple public clients (web, mobile, desktop)

## Considered Options

* Authorization delegation via short-lived tokens, with no static client secret
* Static API key embedded in the client, sent with every call
* Shared secret distributed out of band (documentation, delivered configuration file)

## Decision Outcome

Chosen option: "Authorization delegation via short-lived tokens", because it is the only
option that does not rest security on any secret the client cannot protect, allows
immediate revocation, and applies uniformly to any type of public client.

### Consequences

* Good, because no client secret can be compromised by inspecting the device, the app, or the traffic.
* Good, because revocation and short lifetimes limit the exploitation window of a stolen token.
* Bad, because a token acquisition and renewal flow must be implemented per client.
* Neutral, because of dependency on an identity provider for token issuance.

### Confirmation

Derived controls: CTL-D02-03 (no static secret detected in a public client — automatic
mode), CTL-D01-03 (authorization delegation flow documented and tested for each client —
review mode). Expected evidence: client artifact inspection report (0 secrets) +
delegation flow configuration. Scoring: compliant = 0 client secrets detected and token
flow active; partial = active flow with a non-exploitable residue; non-compliant =
exploitable static secret detected.

## Pros and Cons of the Options

### Short-Lived Tokens, No Static Secret
* Good, because there is no secret to protect on the client side; immediate revocation is possible.
* Bad, because of the complexity of the token acquisition and renewal flow.

### Embedded Static API Key
* Good, because implementation on the client side is trivial.
* Bad, because the secret is exposed from the first inspection of the client; revocation requires redeployment.

### Out-of-Band Distributed Shared Secret
* Good, because it requires no token issuance infrastructure.
* Bad, because distribution becomes uncontrollable once the secret is communicated; no targeted revocation is possible.

## More Information

Instantiations: `profil:azure` → central identity provider issuing tokens + PKCE for
public clients; other profiles → equivalent OpenID Connect provider. Generalizes the
secret-free API consumption decision from the reference profile.
