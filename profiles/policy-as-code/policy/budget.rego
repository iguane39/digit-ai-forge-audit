# CTL-D07-04 — Un budget est déclaré pour chaque périmètre significatif, avec une alerte
# automatique de dérive à des seuils progressifs (ex. 50 %/80 %/100 %).
# Contrôle core : core/controls/D07.json (dimension D07, ADR0107).
package main

import rego.v1

budget_exists(perimeter) if {
	some b in input.budgets
	b.scope == perimeter
}

deny contains msg if {
	some p in input.perimeters
	not budget_exists(p)
	msg := sprintf("CTL-D07-04: périmètre '%s' sans budget déclaré (obligatoire)", [p])
}

deny contains msg if {
	some b in input.budgets
	count(b.alert_thresholds) < 2
	msg := sprintf(
		"CTL-D07-04: budget du périmètre '%s' sans alerte de dérive à seuils progressifs (%d seuil(s) déclaré(s), 2 minimum attendus)",
		[b.scope, count(b.alert_thresholds)],
	)
}
