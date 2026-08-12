# CTL-D02-11 — La sortie réseau (egress) est refusée par défaut avec liste explicite de
# destinations autorisées ; la résolution de noms est gouvernée et journalisée.
# Contrôle core : core/controls/D02.json (dimension D02, ADR0306).
package main

import rego.v1

deny contains msg if {
	some n in input.network_egress
	n.default_action != "deny"
	msg := sprintf(
		"CTL-D02-11: sortie réseau de '%s' non refusée par défaut (default_action=%q) — liste d'autorisations explicite requise",
		[n.resource, n.default_action],
	)
}

deny contains msg if {
	some n in input.network_egress
	n.default_action == "deny"
	count(n.allowed_destinations) == 0
	msg := sprintf(
		"CTL-D02-11: sortie réseau de '%s' refusée par défaut mais aucune destination autorisée déclarée (liste d'autorisations manquante)",
		[n.resource],
	)
}
