// TF-1209 (02/10/2026) — Le runbook d'onboarding faisait écrire l'espace tenant DANS LE DÉPÔT
// DE LA FORGE (`mkdir -p config/tenants/$SLUG/...`), ce que le garde-fou « aucune écriture dans
// un dépôt de forge » interdit à une session produit. L'outil d'hébergement chez le produit
// existait déjà (tout chemin de tenant.yaml est accepté, résolu par loadTenant() relativement à
// son propre dossier) mais le runbook ne le nommait pas : rien n'empêchait un agent de suivre la
// commande à la lettre et de violer le garde-fou.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(HERE, '..', '..');
const doc = fs.readFileSync(path.join(ROOT, 'docs', 'MANUEL-IA-ONBOARDING.md'), 'utf8');

test('TF-1209 — le runbook ne prescrit plus de créer l espace tenant DANS ce dépôt', () => {
  // La commande fautive mesurée : "mkdir -p config/tenants/$SLUG" (chemin relatif au dépôt de
  // la forge, sans dossier d'engagement chez le produit).
  assert.doesNotMatch(doc, /mkdir -p config\/tenants\/\$SLUG/,
    'le runbook ne doit plus écrire l espace tenant sous config/tenants/ DE CE DÉPÔT');
  // Aucune commande du runbook ne doit plus lire/écrire tenant.yaml, merged.json, DESIGN.md ou
  // le rapport d'onboarding à un chemin encore relatif à config/tenants/$SLUG DE CE DÉPÔT.
  assert.doesNotMatch(doc, /config\/tenants\/\$SLUG\/(tenant\.yaml|merged\.json|DESIGN\.md|ONBOARDING-RAPPORT\.md|packs\/)/,
    'aucun artefact tenant ne doit plus être écrit sous config/tenants/$SLUG DE CE DÉPÔT');
});

test('TF-1209 — le runbook nomme explicitement l hébergement chez le produit', () => {
  assert.match(doc, /dépôt d'engagement du client/,
    'le runbook doit nommer où vit réellement l espace tenant d un client réel');
  assert.match(doc, /garde-fou « aucune écriture dans un dépôt de forge »/,
    'le runbook doit citer le garde-fou qu il respecte désormais');
});

test('TF-1209 — les commandes qui écrivent (banc, kits) reçoivent un --out hors de ce dépôt', () => {
  assert.match(doc, /build-banc\.mjs[^\n]*--out "\$TENANT_DIR/,
    'build-banc.mjs doit recevoir un --out pointant chez le produit, sinon il retombe sur deliverables/generated/ DE CE DÉPÔT');
  assert.match(doc, /build-kit\.mjs[^\n]*--out "\$ENGAGEMENT/,
    'build-kit.mjs doit recevoir un --out pointant chez le produit, sinon il retombe sur deliverables/generated/ DE CE DÉPÔT');
});
