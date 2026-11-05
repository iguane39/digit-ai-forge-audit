#!/usr/bin/env node
// AuditCore — porte du STANDARD PUBLIÉ PAR LE CLIENT (TF-2144). Joue la porte que le tenant déclare (`standard_client`) sur
// un rapport HTML. Logique et contrat : tools/standard-client.mjs.
//
// Usage: node tools/verifier-standard-client.mjs <rapport.html> --tenant <tenant.yaml> [--porte <script>]
//   0  la porte du client est conforme, OU aucun standard client n'est déclaré (la sortie le dit : le rapport n'est alors
//      jugé que par les portes d'AuditCore)
//   1  la porte du client déclare le rapport NON CONFORME — il ne se diffuse pas
//   2  usage, tenant illisible, ou porte déclarée introuvable / non exécutable
import fs from 'node:fs';
import { loadTenant, valeurFichierOuUsage } from './lib.mjs';
import { porteDuStandard, jouerPorteDuStandard, messageNonConforme } from './standard-client.mjs';

const USAGE = 'Usage: node tools/verifier-standard-client.mjs <rapport.html> --tenant <tenant.yaml> [--porte <script>]';
const rapport = process.argv[2];
if (!rapport || rapport.startsWith('-')) { console.error(USAGE); process.exit(2); }
if (!process.argv.includes('--tenant')) { console.error(USAGE); process.exit(2); }
const tenantArg = valeurFichierOuUsage(process.argv, '--tenant', USAGE);
const porteArg = valeurFichierOuUsage(process.argv, '--porte', USAGE);
if (!fs.existsSync(rapport)) { console.error(`ERREUR: rapport introuvable : ${rapport}`); process.exit(2); }

let standard;
try {
  const { cfg, tenantDir } = loadTenant(tenantArg);
  standard = porteDuStandard({ cfg, tenantDir, option: porteArg });
} catch (e) { console.error(`ERREUR: ${e.message}`); process.exit(2); }

if (!standard.declaree) {
  console.log('AUCUN STANDARD CLIENT DÉCLARÉ (standard_client absent du tenant, pas d\'option --porte) : le rapport n\'est jugé que par les portes d\'AuditCore. '
    + 'Si le client publie son standard d\'audit (conventions client, projet commun), le déclarer dans le tenant avant diffusion.');
  process.exit(0);
}
let verdict;
try { verdict = jouerPorteDuStandard(standard, rapport); } catch (e) { console.error(`ERREUR: ${e.message}`); process.exit(2); }
for (const l of verdict.sortie) console.log(`  | ${l}`);
if (!verdict.conforme) { console.error(`✖ ${messageNonConforme(standard, verdict)}`); process.exit(1); }
console.log(`✔ conforme au standard publié par le client — porte ${standard.porte} (${standard.origine}), code 0`);
