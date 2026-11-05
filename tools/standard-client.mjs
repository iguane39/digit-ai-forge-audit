// AuditCore — porte du STANDARD PUBLIÉ PAR LE CLIENT (TF-2144, RT-44 du retour Produit-84 du 04/11/2026).
//
// LE FAIT. Un client publie parfois son propre standard d'audit (prompt, modèle de rapport, tenant, et une PORTE exécutable
// qui juge le rapport). Le 04/11/2026, un audit complet a été rendu deux fois par le moteur générique avec un tenant
// fabriqué ; la porte du client, jouée ensuite, a refusé en une commande (5 anomalies bloquantes) le rapport que les deux
// portes de ce dépôt déclaraient diffusable. Les portes d'AuditCore jugent le standard d'AuditCore : elles ne savent rien de
// celui d'un client, et rien ne les obligeait à le consulter.
//
// CE QUE FAIT CE MODULE. Le tenant peut DÉCLARER ce standard (`standard_client`, schéma core/schemas/tenant.schema.json) :
//   standard_client:
//     porte: <script de la porte>            # chemin relatif au dossier du tenant, ou absolu
//     arguments: ["{rapport}"]               # optionnel ; `{rapport}` = le rapport HTML jugé (défaut : ["{rapport}"])
// Quand il est déclaré, la porte du client est EXIGÉE avant toute diffusion : `node <porte> <arguments>`, code 0 = conforme,
// tout autre code (ou délai dépassé) = NON CONFORME, et le rapport ne se diffuse pas. Quand il n'est pas déclaré, la
// sortie le DIT (« aucun standard client déclaré ») : un rapport jugé par les seules portes d'AuditCore n'est jamais
// présenté comme jugé par le standard du client.
//
// CE QUE CE MODULE NE FAIT PAS. Il ne CHERCHE pas le standard du client : le désigner (conventions client, projet commun) est
// le travail de la session qui mobilise la forge. Il n'exécute que la porte que le tenant nomme, jamais un fichier découvert.
// Il ne lit aucun `.env` et ne passe aucun secret à la porte.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

export const DELAI_PORTE_MS = 120000;
const LIGNES_RELAYEES = 40;

/**
 * La porte du standard du client déclarée par la configuration du tenant (ou imposée par `--porte`).
 * Rend { declaree: false } quand rien n'est déclaré ; { declaree: true, porte, arguments, origine } sinon. Une porte
 * déclarée dont le fichier n'existe pas LÈVE : un standard annoncé qu'on ne peut pas jouer n'est jamais un « sans objet ».
 */
export function porteDuStandard({ cfg, tenantDir, option } = {}) {
  const decl = cfg?.standard_client;
  const brut = option ?? decl?.porte;
  if (!brut) return { declaree: false };
  const porte = path.resolve(tenantDir ?? process.cwd(), String(brut));
  if (!fs.existsSync(porte) || !fs.statSync(porte).isFile())
    throw new Error(`porte du standard du client introuvable : ${porte} (${option ? 'option --porte' : 'standard_client.porte du tenant'}). `
      + 'Un standard déclaré dont la porte ne se joue pas n\'est pas un standard sans objet : corriger le chemin ou retirer la déclaration.');
  const args = decl?.arguments ?? ['{rapport}'];
  if (!Array.isArray(args) || !args.every((a) => typeof a === 'string'))
    throw new Error('standard_client.arguments : une liste de chaînes est attendue (ex. ["{rapport}"]).');
  return { declaree: true, porte, arguments: args, origine: option ? 'option --porte' : 'standard_client du tenant' };
}

/**
 * Joue la porte du client sur le rapport. Rend { conforme, code, sortie, lignes, relayees, delaiDepasse } ; `sortie` = les
 * dernières lignes (stdout + stderr) relayées telles quelles, `lignes` = le total produit par la porte — la borne se dit.
 */
export function jouerPorteDuStandard(standard, rapport, { delaiMs = DELAI_PORTE_MS } = {}) {
  const args = standard.arguments.map((a) => a.split('{rapport}').join(path.resolve(rapport)));
  const r = spawnSync(process.execPath, [standard.porte, ...args], {
    encoding: 'utf8', timeout: delaiMs, maxBuffer: 1e8, windowsHide: true,
  });
  const delaiDepasse = r.error?.code === 'ETIMEDOUT';
  if (r.error && !delaiDepasse) throw new Error(`la porte du standard du client n'a pas pu être lancée : ${r.error.message}`);
  const lignes = `${r.stdout ?? ''}${r.stderr ?? ''}`.split(/\r?\n/).filter((l) => l.trim() !== '');
  return {
    conforme: !delaiDepasse && r.status === 0,
    code: r.status, delaiDepasse, lignes: lignes.length,
    sortie: lignes.slice(-LIGNES_RELAYEES), relayees: Math.min(lignes.length, LIGNES_RELAYEES),
  };
}

/** Le message d'un verdict non conforme, avec la porte nommée et la borne de relais dite. */
export function messageNonConforme(standard, v) {
  const cause = v.delaiDepasse ? `délai dépassé (${DELAI_PORTE_MS / 1000} s)` : `code de sortie ${v.code}`;
  const bornes = v.lignes > v.relayees ? ` (${v.relayees} dernières lignes sur ${v.lignes})` : '';
  return `NON CONFORME au standard publié par le client — porte ${standard.porte} : ${cause}${bornes}`;
}
