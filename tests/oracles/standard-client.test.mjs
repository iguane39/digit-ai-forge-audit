// TF-2144 (RT-44, retour Produit-84 du 04/11/2026) — la mobilisation d'AuditCore EXIGE la porte du standard publié par le
// client quand il existe. Le fait : un audit complet rendu deux fois par le moteur générique, avec un tenant fabriqué ; la
// porte du client, jouée ensuite en une commande, a refusé (5 anomalies bloquantes) ce que les deux portes de ce dépôt
// déclaraient diffusable. Les portes d'AuditCore jugent le standard d'AuditCore, et rien ne les obligeait à consulter celui
// d'un client.
//
// Le tenant déclare le standard (`standard_client.porte`, schéma tenant) ; `tools/verifier-standard-client.mjs` et l'option
// `--tenant` de `verifier-rapport-html.mjs` jouent la porte et refusent ce qu'elle refuse. Sans déclaration, la sortie le DIT.
//
// Les portes de ce banc sont des FIXTURES écrites ici (le standard d'un vrai client n'est pas dans ce dépôt). Elles jugent une
// propriété du rapport lu — la présence d'une balise que le « client » exige —, pour prouver que le bon fichier arrive à la porte :
//   rapport rendu par build-rapport (sans la balise)  → la porte du client refuse (ROUGE pour la bonne raison) ;
//   le même rapport avec la balise posée              → la porte accepte (VERT).
// Hypothèse non vérifiée ici : le contrat d'appel de la vraie porte d'un client (`node <porte> <rapport.html>`, code 0 = conforme) ;
// `standard_client.arguments` le rend réglable sans toucher au code.
//
// Lancer : node --test tests/oracles/standard-client.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tool = (n) => path.join(RACINE, 'tools', n);
const TENANT_EXEMPLE = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');
const RICHE = path.join(RACINE, 'tests', 'fixtures', 'rapport-data-riche.json');
const node = (args) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 180000, maxBuffer: 1e8 });
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'standard-client-'));
process.on('exit', () => { try { fs.rmSync(dossier, { recursive: true, force: true }); } catch { /* jetable */ } });
const ecrire = (nom, contenu) => { const p = path.join(dossier, nom); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, contenu, 'utf8'); return p; };

const BALISE = '<meta name="modele-client" content="poc-to-prod-20261019a">';
// La porte du « client » : refuse un rapport sans la balise du modèle client, dit ses anomalies, code 1. `indice` = position du chemin dans argv.
const porteDuClient = (indice = 2) => `import fs from 'node:fs';
const h = fs.readFileSync(process.argv[${indice}], 'utf8');
if (!h.includes('${BALISE}')) { console.log('ANOMALIE 1 : balise du modèle client absente'); console.error('ANOMALIE 2 : forme non conforme au modèle client'); process.exit(1); }
console.log('modèle client reconnu'); process.exit(0);
`;
const porteBavarde = `for (let i = 1; i <= 100; i++) console.log('anomalie ' + i); process.exit(1);\n`;

/** Un tenant = l'exemple + un bloc `standard_client` (ou aucun), posé dans un dossier propre au cas. */
function tenant(nom, standardClient) {
  const base = fs.readFileSync(TENANT_EXEMPLE, 'utf8');
  ecrire(`${nom}/DESIGN.md`, fs.readFileSync(path.join(path.dirname(TENANT_EXEMPLE), 'DESIGN.md'), 'utf8'));   // la charte du tenant, lue par la validation et le thème
  return ecrire(`${nom}/tenant.yaml`, standardClient === undefined ? base : `${base}\nstandard_client:\n${standardClient}\n`);
}
const rapportAuditCore = (() => {
  const out = path.join(dossier, 'rapport.html');
  const r = node([tool('build-rapport.mjs'), RICHE, '--tenant', TENANT_EXEMPLE, '--out', out]);
  assert.equal(r.status, 0, r.stderr);
  return out;
})();
const rapportAvecBalise = (() => {
  const h = fs.readFileSync(rapportAuditCore, 'utf8');
  assert.ok(h.includes('</head>'));
  return ecrire('rapport-client.html', h.replace('</head>', `${BALISE}</head>`));
})();
const porteRouge = ecrire('portes/porte-client.mjs', porteDuClient(2));
const cli = (rapport, ...args) => node([tool('verifier-standard-client.mjs'), rapport, ...args]);
const sortie = (r) => `${r.stdout}${r.stderr}`;

// ── Le schéma du tenant ───────────────────────────────────────────────────────────────────────────
test('TF-2144 — le schéma du tenant accepte standard_client {porte, arguments} et refuse une déclaration malformée', () => {
  const valide = tenant('schema-ok', `  porte: ../portes/porte-client.mjs\n  arguments: ["{rapport}"]`);
  const v = node([tool('validate-config.mjs'), valide]);
  assert.equal(v.status, 0, sortie(v).slice(0, 500));
  for (const [nom, bloc, motif] of [
    ['sans-porte', `  arguments: ["{rapport}"]`, /porte/],
    ['cle-inconnue', `  porte: p.mjs\n  mot-de-passe: x`, /additional|mot-de-passe/i],
    ['arguments-non-liste', `  porte: p.mjs\n  arguments: "{rapport}"`, /array|arguments/i],
  ]) {
    const r = node([tool('validate-config.mjs'), tenant(`schema-${nom}`, bloc)]);
    assert.notEqual(r.status, 0, `${nom} : une déclaration malformée doit être refusée`);
    assert.match(sortie(r), motif, `${nom} : ${sortie(r).slice(0, 300)}`);
  }
});

// ── L'outil ───────────────────────────────────────────────────────────────────────────────────────
test('TF-2144 — aucun standard déclaré : la sortie le DIT (exit 0), jamais un silence', () => {
  const r = cli(rapportAuditCore, '--tenant', tenant('sans-standard'));
  assert.equal(r.status, 0, sortie(r));
  assert.match(r.stdout, /AUCUN STANDARD CLIENT DÉCLARÉ/);
  assert.match(r.stdout, /portes d'AuditCore/);
});

test('TF-2144 — ROUGE : la porte du client refuse le rapport (exit 1), son verdict est relayé et le refus nomme la porte', () => {
  const r = cli(rapportAuditCore, '--tenant', tenant('porte-rouge', `  porte: ../portes/porte-client.mjs`));
  assert.equal(r.status, 1, sortie(r));
  assert.match(r.stdout, /ANOMALIE 1 : balise du modèle client absente/, 'le verdict de la porte n\'est pas relayé');
  assert.match(r.stdout, /ANOMALIE 2/,'le flux d\'erreur de la porte n\'est pas relayé');
  assert.match(r.stderr, /NON CONFORME au standard publié par le client/);
  assert.ok(r.stderr.includes(porteRouge), 'le refus ne nomme pas la porte qui l\'a prononcé');
});

test('TF-2144 — VERT : le même rapport, posé conforme au modèle du client, passe sa porte (le bon fichier arrive à la porte)', () => {
  const r = cli(rapportAvecBalise, '--tenant', tenant('porte-verte', `  porte: ../portes/porte-client.mjs`));
  assert.equal(r.status, 0, sortie(r));
  assert.match(r.stdout, /modèle client reconnu/);
  assert.match(r.stdout, /conforme au standard publié par le client/);
});

test('TF-2144 — une porte déclarée introuvable est une ERREUR (exit 2), pas un « sans objet »', () => {
  const r = cli(rapportAuditCore, '--tenant', tenant('porte-absente', `  porte: ../portes/n-existe-pas.mjs`));
  assert.equal(r.status, 2, sortie(r));
  assert.match(r.stderr, /porte du standard du client introuvable/);
});

test('TF-2144 — `arguments` règle l\'appel : `["--rapport", "{rapport}"]` place le chemin du rapport où la porte l\'attend', () => {
  ecrire('portes/porte-option.mjs', porteDuClient(3));
  const t = tenant('porte-arguments', `  porte: ../portes/porte-option.mjs\n  arguments: ["--rapport", "{rapport}"]`);
  assert.equal(cli(rapportAvecBalise, '--tenant', t).status, 0);
  assert.equal(cli(rapportAuditCore, '--tenant', t).status, 1);
});

test('TF-2144 — `--porte` impose une porte sans déclaration au tenant ; la borne de relais se dit (40 lignes sur 100)', () => {
  const sans = tenant('porte-option');
  const rouge = cli(rapportAuditCore, '--tenant', sans, '--porte', ecrire('portes/porte-bavarde.mjs', porteBavarde));
  assert.equal(rouge.status, 1, sortie(rouge));
  assert.match(rouge.stderr, /40 dernières lignes sur 100/, 'la borne de relais n\'est pas dite');
  assert.match(rouge.stdout, /anomalie 100/);
  assert.doesNotMatch(rouge.stdout, /anomalie 59\b/, 'plus de 40 lignes relayées');
  const verte = cli(rapportAvecBalise, '--tenant', sans, '--porte', porteRouge);
  assert.equal(verte.status, 0, sortie(verte));
  assert.match(verte.stdout, /option --porte/);
});

test('TF-2144 — usage : rapport ou tenant manquant, rapport introuvable : exit 2', () => {
  assert.equal(node([tool('verifier-standard-client.mjs')]).status, 2);
  assert.equal(node([tool('verifier-standard-client.mjs'), rapportAuditCore]).status, 2, 'sans --tenant');
  assert.equal(cli(path.join(dossier, 'inexistant.html'), '--tenant', tenant('usage')).status, 2);
});

// ── La porte de rendu l'EXIGE ──────────────────────────────────────────────────────────────────────
const gate = (rapport, ...args) => node([tool('verifier-rapport-html.mjs'), rapport, '--sans-oracles-design', ...args]);

test('TF-2144 — verifier-rapport-html --tenant : la porte du client déclarée est EXIGÉE (refus = rendu non diffusable)', () => {
  const t = tenant('gate-declare', `  porte: ../portes/porte-client.mjs`);
  assert.equal(gate(rapportAuditCore).status, 0, 'sans --tenant, le rapport passe les portes d\'AuditCore (comportement inchangé)');
  const ko = gate(rapportAuditCore, '--tenant', t);
  assert.equal(ko.status, 1, `le rapport que la porte du client refuse a été déclaré diffusable : ${sortie(ko)}`);
  assert.match(ko.stderr, /NON CONFORME au standard publié par le client/);
  assert.match(ko.stderr, /rendu NON diffusable/);
  const ok = gate(rapportAvecBalise, '--tenant', t);
  assert.equal(ok.status, 0, sortie(ok));
  assert.match(ok.stdout, /porte du standard du client conforme/);
});

test('TF-2144 — verifier-rapport-html --tenant sans standard déclaré : « NON JUGÉ » dit tout haut, le verdict d\'AuditCore reste', () => {
  const r = gate(rapportAuditCore, '--tenant', tenant('gate-sans'));
  assert.equal(r.status, 0, sortie(r));
  assert.match(r.stderr, /NON JUGÉ: standard publié par le client — aucun standard_client déclaré/);
  assert.doesNotMatch(gate(rapportAuditCore).stderr, /standard publié par le client/, 'sans --tenant, rien à dire');
});

test('TF-2144 — verifier-rapport-html --tenant : une porte déclarée introuvable refuse (exit 2), elle ne se saute pas', () => {
  const r = gate(rapportAuditCore, '--tenant', tenant('gate-absente', `  porte: ../portes/n-existe-pas.mjs`));
  assert.equal(r.status, 2, sortie(r));
  assert.match(r.stderr, /porte du standard du client introuvable/);
});

// ── La chaîne de rendu le rappelle ──────────────────────────────────────────────────────────────────
test('TF-2144 — build-rapport rappelle la porte du client : exigée si déclarée, « aucun standard déclaré » sinon', () => {
  const rendre = (t) => node([tool('build-rapport.mjs'), RICHE, '--tenant', t, '--out', path.join(dossier, 'rappel.html')]);
  const decl = rendre(tenant('rappel-declare', `  porte: ../portes/porte-client.mjs`));
  assert.equal(decl.status, 0, decl.stderr);
  assert.match(decl.stdout, /porte du client\s+: node tools\/verifier-standard-client\.mjs .*EXIGÉE avant diffusion/);
  const sans = rendre(tenant('rappel-sans'));
  assert.equal(sans.status, 0, sans.stderr);
  assert.match(sans.stdout, /porte du client\s+: aucun standard_client déclaré/);
});
