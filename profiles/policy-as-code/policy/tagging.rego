# CTL-D07-01 — Une taxonomie de tags minimale (application, environnement, domaine, propriétaire)
# est définie, publiée et appliquée dès la création de toute ressource facturable.
# Contrôle core : core/controls/D07.json (dimension D07, ADR0102).
package main

import rego.v1

required_tags := {"application", "environment", "domain", "owner"}

deny contains msg if {
	some r in input.resources
	present := {k | some k, _ in r.tags}
	missing := required_tags - present
	count(missing) > 0
	msg := sprintf(
		"CTL-D07-01: ressource '%s' (%s) sans taxonomie de tags complète — tag(s) manquant(s): %v",
		[r.id, r.type, missing],
	)
}
