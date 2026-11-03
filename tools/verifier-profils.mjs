#!/usr/bin/env node
/**
 * verifier-profils.mjs — juge les profils technologiques (`profiles/<clé>/bindings.json`).
 *
 * LE FAIT QUI A PRODUIT CET OUTIL (16/10/2026, ajout du profil `supabase`) : cinq profils
 * existaient, chargés par `tools/build-banc.mjs` dès qu'un tenant les déclare dans `profiles[]`,
 * et AUCUN contrôle ne jugeait leur contenu. Un binding pointant un contrôle core disparu, un
 * `evidence` vide ou un profil absent de l'index du README passaient sans bruit : le banc de
 * preuves perdait l'instanciation sans le dire.
 *
 * Ce qu'il juge, profil par profil (tout dossier de `profiles/` qui porte un `bindings.json`) :
 *   P1 `profile` = nom du dossier (c'est la clé que le tenant écrit dans `profiles[]`) ;
 *   P2 `version` SemVer ;
 *   P3 `bindings` non vide ;
 *   P4 chaque binding porte `control`, `instanciation`, `verification_command`, `evidence` non vides ;
 *   P5 `control` existe au pack core (`core/controls/controls-core-v1.json`), `manual[]` compris ;
 *   P6 un contrôle n'est lié qu'une fois (build-banc ne garde que le premier) ;
 *   P7 `README.md` présent ;
 *   P8 si le profil déclare `sources[]` (id, url https, lu_le AAAA-MM-JJ), chaque binding en cite
 *      au moins une, et seulement des ids déclarés ;
 *   P9 (mode dépôt) le profil est nommé dans l'arborescence `profiles/` du README racine ;
 *   P10 (mode dépôt) le profil est APPELÉ : build-banc, lancé sur un tenant qui ne déclare que lui,
 *      rend autant d'instanciations que le profil a de bindings ;
 *   P11 si le profil déclare `sources[]`, son README dit la même chose que son bindings.json : chaque
 *      contrôle lié y est cité, chaque source y est listée avec son URL, et le nombre de contrôles
 *      qu'il annonce (« N contrôles sont liés ») est le nombre de bindings. Le README est la page que
 *      lit un auditeur : étendre un profil sans le relire le laisse annoncer l'ancien compte.
 *   P12 (TF-2112, D-163 (a)) aucune `verification_command` n'écrit une clé, un jeton ou un mot de
 *      passe en clair dans la ligne : en-tête `api-key:` ou `Authorization:`, option `--password`,
 *      `--storage-key`, `--token`…, `curl -u`, identifiants dans l'URL ou paramètre `key=` doivent
 *      lire une variable d'environnement (`$NOM`). Le message ne reproduit jamais la valeur trouvée ;
 *   P13 (TF-2112, D-163 (a)) une `verification_command` qui appelle un fournisseur de modèle (appel
 *      facturé : Azure OpenAI, OpenAI, Gemini, Anthropic, Mistral, Cohere, Bedrock…) mentionne
 *      l'accord écrit du client AVANT l'appel.
 *
 * LE FAIT QUI A PRODUIT P12 ET P13 (03/11/2026) : la commande de CTL-D14-04 du profil azure envoyait
 * un POST payant au déploiement Azure OpenAI du client avec `-H "api-key: <key>"`, le README la disait
 * « exécutable en audit », et ce fichier JSON n'était lu par aucun oracle de dépense. Relevé du même
 * jour sur les 8 profils : 21 commandes écrivaient un identifiant en clair dans la ligne (azure 11,
 * elastic 10), qui se retrouve dans l'historique du shell.
 *
 * Ce qu'il ne juge pas : la justesse technique d'une commande de vérification, ni la fidélité
 * d'un binding à sa source (lecture humaine). P12 et P13 lisent la FORME de la ligne : la liste des
 * options et des fournisseurs est fermée (un fournisseur absent de la liste passe), et une mention
 * d'accord devant l'appel ne prouve pas que le test de présence du fichier d'accord fonctionne.
 *
 * Usage : node tools/verifier-profils.mjs [<dossier-profils>] [--self-test]
 * Exit : 0 = PASS · 1 = FAIL (au moins un écart) · 2 = usage ou entrée illisible.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { ROOT, rel, loadJson } from './lib.mjs';

const CHAMPS = ['control', 'instanciation', 'verification_command', 'evidence'];
const SEMVER = /^\d+\.\d+\.\d+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export function controlesCore() {
  return new Set(loadJson(rel('core', 'controls', 'controls-core-v1.json')).constraints.map(c => c.id));
}

/** Une valeur qui LIT l'environnement : `$NOM`, `${NOM}`, `${NOM:?…}`, `%NOM%` ou `$env:NOM`. */
const LIT_ENVIRONNEMENT = /\$\{?[A-Za-z_][A-Za-z0-9_]*|%[A-Za-z_][A-Za-z0-9_]*%|\$env:[A-Za-z_]/;
const OPTIONS_SECRETES = ['--admin-password', '--password', '--passwd', '--storage-key', '--account-key',
  '--access-key', '--secret-key', '--client-secret', '--sas-token', '--token', '--api-key'];
const RE_OPTION_SECRETE = new RegExp(`(?:^|\\s)(${OPTIONS_SECRETES.join('|')})(?:\\s+|=)("[^"]*"|'[^']*'|\\S+)`, 'gi');
const RE_ENTETE_CLE = /\b(api-key|x-api-key|ocp-apim-subscription-key)\s*:\s*([^"'\r\n]*)/gi;
const RE_ENTETE_AUTORISATION = /\bAuthorization\s*:\s*([^"'\r\n]*)/gi;
const RE_UTILISATEUR_CURL = /(?:^|\s)(?:-u|--user)\s+("[^"]*"|'[^']*'|\S+)/g;
const RE_URL_IDENTIFIANTS = /https?:\/\/[^\/\s:@"']+:([^\/\s@"']+)@/g;
const RE_PARAMETRE_CLE = /[?&](key|api[_-]?key|access_token|sas_token|sig|subscription-key)=([^&\s"']+)/gi;

/** Les appels facturés à un fournisseur de modèle : hôte et chemin d'inférence (liste fermée). */
const APPELS_MODELE = [
  ['Azure OpenAI', /\.openai\.azure\.com\/openai\/deployments\/[^\s"']*\/(?:chat\/completions|completions|embeddings|responses|images\/generations|audio\/\w+)/i],
  ['OpenAI', /api\.openai\.com\/v1\/(?:chat\/completions|completions|embeddings|responses|images|audio)/i],
  ['Gemini', /generativelanguage\.googleapis\.com\/[^\s"']*:(?:generateContent|streamGenerateContent|embedContent|predict)/i],
  ['Vertex AI', /aiplatform\.googleapis\.com\/[^\s"']*:(?:generateContent|streamGenerateContent|predict|rawPredict)/i],
  ['Anthropic', /api\.anthropic\.com\/v1\/(?:messages|complete)/i],
  ['Mistral', /api\.mistral\.ai\/v1\/(?:chat|embeddings|fim)/i],
  ['Cohere', /api\.cohere\.(?:ai|com)\/v\d\/(?:chat|embed|generate)/i],
  ['Bedrock', /bedrock-runtime\.[\w-]+\.amazonaws\.com\/model\/[^\s"']*\/(?:invoke|converse)|bedrock-runtime\s+(?:invoke-model|converse)/i],
];

/**
 * TF-2112 — juge UNE ligne de commande : P12 (identifiant littéral) et P13 (appel de modèle sans
 * mention d'accord avant l'appel). Rend [{ code, message }] ; la valeur trouvée n'est jamais reprise.
 */
export function jugerCommande(cmd) {
  const trouves = [];
  const litteral = (valeur) => valeur.trim() !== '' && !LIT_ENVIRONNEMENT.test(valeur);
  const p12 = (ou) => {
    const message = `${ou} en clair dans la ligne (valeur non reproduite) : lire une variable d'environnement, par exemple $NOM_DE_LA_CLE`;
    if (!trouves.some(t => t.message === message)) trouves.push({ code: 'P12', message });
  };
  for (const m of cmd.matchAll(RE_OPTION_SECRETE)) if (litteral(m[2])) p12(`option ${m[1]} : secret`);
  for (const m of cmd.matchAll(RE_ENTETE_CLE)) if (litteral(m[2])) p12(`en-tête ${m[1]} : clé`);
  for (const m of cmd.matchAll(RE_ENTETE_AUTORISATION)) if (litteral(m[1].replace(/^(?:Bearer|Basic|Token)\b\s*/i, ''))) p12('en-tête Authorization : jeton ou identifiants');
  if (/\bcurl\b/.test(cmd)) for (const m of cmd.matchAll(RE_UTILISATEUR_CURL)) if (litteral(m[1])) p12('option -u/--user de curl : identifiants');
  for (const m of cmd.matchAll(RE_URL_IDENTIFIANTS)) if (litteral(m[1])) p12('URL à identifiants intégrés : mot de passe');
  for (const m of cmd.matchAll(RE_PARAMETRE_CLE)) if (litteral(m[2])) p12(`paramètre d'URL ${m[1]}= : clé`);
  // Le premier appel de modèle de la ligne : l'accord doit être mentionné avant lui.
  const appels = APPELS_MODELE.map(([nom, re]) => ({ nom, m: re.exec(cmd) })).filter(a => a.m).sort((a, b) => a.m.index - b.m.index);
  if (appels.length && !/accord/i.test(cmd.slice(0, appels[0].m.index))) {
    trouves.push({ code: 'P13', message: `appel facturé à un fournisseur de modèle (${appels[0].nom}) sans mention d'accord écrit du client avant l'appel : tester la présence du fichier d'accord dans le dossier d'audit, puis appeler` });
  }
  return trouves;
}

/** Juge un dossier de profils ; `depot` active P9/P10 (index du README et appel par build-banc). */
export function verifierProfils(racine, { depot = false } = {}) {
  const core = controlesCore();
  const findings = [];
  const f = (profil, code, message) => findings.push({ profil, code, message });
  const profils = [];
  for (const nom of fs.readdirSync(racine).sort()) {
    const dir = path.join(racine, nom);
    if (!fs.statSync(dir).isDirectory() || !fs.existsSync(path.join(dir, 'bindings.json'))) continue;
    let b;
    try { b = JSON.parse(fs.readFileSync(path.join(dir, 'bindings.json'), 'utf-8')); }
    catch (e) { f(nom, 'P0', `bindings.json illisible : ${e.message}`); continue; }
    profils.push({ nom, b });
    if (b.profile !== nom) f(nom, 'P1', `profile « ${b.profile} » ≠ dossier « ${nom} »`);
    if (!SEMVER.test(String(b.version ?? ''))) f(nom, 'P2', `version « ${b.version} » non SemVer`);
    const liste = Array.isArray(b.bindings) ? b.bindings : [];
    if (!liste.length) f(nom, 'P3', 'bindings vide ou absent');
    const vus = new Set();
    const sources = Array.isArray(b.sources) ? b.sources : null;
    const ids = new Set();
    if (sources) for (const s of sources) {
      if (!s?.id || !/^https:\/\//.test(s.url ?? '') || !DATE.test(s.lu_le ?? '')) f(nom, 'P8', `source mal formée : ${JSON.stringify(s)}`);
      else ids.add(s.id);
    }
    liste.forEach((x, i) => {
      const ou = `bindings[${i}]${x?.control ? ` (${x.control})` : ''}`;
      for (const c of CHAMPS) if (typeof x?.[c] !== 'string' || !x[c].trim()) f(nom, 'P4', `${ou} : champ « ${c} » vide ou absent`);
      if (x?.control && !core.has(x.control)) f(nom, 'P5', `${ou} : contrôle inconnu du core`);
      if (x?.control && vus.has(x.control)) f(nom, 'P6', `${ou} : contrôle déjà lié plus haut`);
      if (x?.control) vus.add(x.control);
      if (typeof x?.verification_command === 'string') for (const g of jugerCommande(x.verification_command)) f(nom, g.code, `${ou} : ${g.message}`);
      if (sources) {
        const cites = Array.isArray(x?.sources) ? x.sources : [];
        if (!cites.length) f(nom, 'P8', `${ou} : aucune source citée alors que le profil en déclare`);
        for (const s of cites) if (!ids.has(s)) f(nom, 'P8', `${ou} : source « ${s} » non déclarée`);
      }
    });
    for (const m of b.manual ?? []) if (!core.has(m.control)) f(nom, 'P5', `manual (${m.control}) : contrôle inconnu du core`);
    if (!fs.existsSync(path.join(dir, 'README.md'))) f(nom, 'P7', 'README.md absent');
    else if (sources) {
      const readme = fs.readFileSync(path.join(dir, 'README.md'), 'utf-8');
      for (const x of liste) if (x?.control && !readme.includes(x.control)) f(nom, 'P11', `README.md ne cite pas le contrôle ${x.control}`);
      for (const s of sources) if (s?.url && !readme.includes(s.url)) f(nom, 'P11', `README.md ne liste pas la source ${s.id} (${s.url})`);
      const annonce = /(\d+) contrôles? (?:sont|est) liés?/.exec(readme);
      if (annonce && Number(annonce[1]) !== liste.length) f(nom, 'P11', `README.md annonce ${annonce[1]} contrôle(s) lié(s), bindings.json en porte ${liste.length}`);
    }
  }
  if (depot) {
    const readme = fs.readFileSync(rel('README.md'), 'utf-8').split(/\r?\n/);
    const i0 = readme.findIndex(l => /profiles\/\s+#/.test(l));
    const bloc = i0 < 0 ? '' : readme.slice(i0, i0 + 4).join(' ');
    for (const { nom, b } of profils) {
      if (!new RegExp(`(?<![\\w-])${nom.replace(/[-]/g, '\\-')}(?![\\w-])`).test(bloc)) f(nom, 'P9', 'profil absent de l\'arborescence profiles/ du README racine');
      const attendu = (b.bindings ?? []).filter(x => core.has(x.control)).length;
      const obtenu = instanciationsParBuildBanc(nom);
      if (obtenu !== attendu) f(nom, 'P10', `build-banc rend ${obtenu} instanciation(s) pour un tenant qui ne déclare que « ${nom} », ${attendu} attendue(s)`);
    }
  }
  return { profils: profils.map(p => p.nom), findings };
}

/** Lance le vrai chargeur (build-banc) sur un tenant jetable qui ne déclare que ce profil. */
function instanciationsParBuildBanc(nom) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'profil-'));
  try {
    const tenant = path.join(tmp, 'tenant.yaml');
    fs.writeFileSync(tenant, [
      'schema_version: 1', 'core_version: "1.0.x"', 'tenant: { name: "Fictif", short_code: "FI", language: fr }',
      'constraint_packs: [ "core/controls/controls-core-v1.json" ]', `profiles: [ ${nom} ]`, '',
    ].join('\n'));
    const r = spawnSync(process.execPath, [rel('tools', 'build-banc.mjs'), tenant, '--out', path.join(tmp, 'banc.md')], { cwd: ROOT, encoding: 'utf-8' });
    const m = /(\d+) instanciations profils/.exec(r.stdout ?? '');
    return m ? Number(m[1]) : -1;
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

function rendre({ profils, findings }, titre) {
  console.log(`${titre} : ${profils.length} profil(s) jugé(s) — ${profils.join(', ')}`);
  for (const x of findings) console.log(`  ✖ [${x.code}] ${x.profil} — ${x.message}`);
  console.log(findings.length ? `FAIL : ${findings.length} écart(s)` : 'PASS : 0 écart');
}

/**
 * TF-2112 — cas de P12/P13 à double sens : [libellé, ligne de commande, codes attendus].
 * Les valeurs sont fictives. Chaque rouge a son remède joué juste à côté, qui doit PASSER.
 */
const GARDE_ACCORD = '{ compgen -G "input/00 - Cadrage/* - Accord appel IA - *" >/dev/null || { echo "Accord écrit du client absent : appel non joué" >&2; false; }; }';
export const CAS_COMMANDES = [
  ['Azure OpenAI, clé et sans accord (état d\'avant de CTL-D14-04)', 'az cognitiveservices account show --name <aoai-name> --resource-group <rg> --query \'properties.contentFilters\' && curl -s -X POST "https://<aoai-name>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=2024-06-01" -H "api-key: <key>" -d @prompt-injection-test.json', ['P12', 'P13']],
  ['Azure OpenAI, clé par variable mais sans accord', 'curl -s -X POST "https://<aoai-name>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=2024-06-01" -H "api-key: $AZURE_OPENAI_API_KEY" -d @prompt-injection-test.json', ['P13']],
  ['Azure OpenAI, accord constaté puis clé par variable (remède)', `az cognitiveservices account show --name <aoai-name> --resource-group <rg> && ${GARDE_ACCORD} && curl -s -X POST "https://<aoai-name>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=2024-06-01" -H "api-key: $AZURE_OPENAI_API_KEY" -d @prompt-injection-test.json`, []],
  ['Azure OpenAI, accord cité seulement APRÈS l\'appel', 'curl -s -X POST "https://<aoai-name>.openai.azure.com/openai/deployments/<deployment>/chat/completions?api-version=2024-06-01" -H "api-key: $AZURE_OPENAI_API_KEY" -d @t.json ; echo "accord du client ?"', ['P13']],
  ['Azure OpenAI, lecture de configuration seule (aucun appel de modèle)', 'az rest --method GET --uri "https://<aoai-name>.openai.azure.com/openai/evaluations" --resource https://cognitiveservices.azure.com', []],
  ['OpenAI, jeton littéral et sans accord', 'curl -s https://api.openai.com/v1/chat/completions -H "Authorization: Bearer sk-fictif-0000" -d @t.json', ['P12', 'P13']],
  ['OpenAI, accord puis jeton par variable (remède)', `${GARDE_ACCORD} && curl -s https://api.openai.com/v1/chat/completions -H "Authorization: Bearer $OPENAI_API_KEY" -d @t.json`, []],
  ['Gemini, clé dans l\'URL et sans accord', 'curl -s "https://generativelanguage.googleapis.com/v1beta/models/m:generateContent?key=AIzaFictive0000" -d @t.json', ['P12', 'P13']],
  ['Gemini, accord puis clé par variable (remède)', `${GARDE_ACCORD} && curl -s "https://generativelanguage.googleapis.com/v1beta/models/m:generateContent?key=$GEMINI_API_KEY" -d @t.json`, []],
  ['Anthropic, clé par variable mais sans accord', 'curl -s https://api.anthropic.com/v1/messages -H "x-api-key: $ANTHROPIC_API_KEY" -d @t.json', ['P13']],
  ['mot de passe d\'administration littéral', 'az postgres flexible-server execute --name <server-name> --admin-user <admin> --admin-password <pwd> --database-name <db-name> --querytext "SELECT 1;"', ['P12']],
  ['mot de passe d\'administration par variable (remède)', 'az postgres flexible-server execute --name <server-name> --admin-user <admin> --admin-password "$AZURE_PG_ADMIN_PASSWORD" --database-name <db-name> --querytext "SELECT 1;"', []],
  ['clé de stockage littérale, option collée par =', 'az storage blob list --account-name <a> --container-name <c> --account-key=<key>', ['P12']],
  ['clé de stockage par variable (remède)', 'az storage blob list --account-name <a> --container-name <c> --account-key "$AZURE_STORAGE_KEY"', []],
  ['--storage-key-type n\'est pas une clé', 'az sql db export --storage-key-type StorageAccessKey --storage-key "$AZURE_STORAGE_KEY" --storage-uri <uri>', []],
  ['curl -u, jeton en nom d\'utilisateur', 'curl -s -u <sonar-token>: "https://sonarcloud.io/api/measures/component?component=<project-key>&metricKeys=complexity"', ['P12']],
  ['curl -u par variables (remède)', 'curl -s -u "$SONAR_TOKEN:" "https://sonarcloud.io/api/measures/component?component=<project-key>&metricKeys=complexity"', []],
  ['curl -u, utilisateur et mot de passe littéraux', 'curl -s -u <user>:<pass> "https://<host>:9200/_ilm/policy/<policy>"', ['P12']],
  ['identifiants dans l\'URL', 'curl -s https://admin:motdepasse@<host>/api', ['P12']],
  ['identifiants de l\'URL par variables (remède)', 'curl -s https://$API_USER:$API_PASS@<host>/api', []],
  ['-u hors curl n\'est pas un identifiant', 'git push -u origin main', []],
  ['recherche d\'un en-tête d\'autorisation dans le code', 'grep -rn \'Authorization: Bearer\' src/', []],
  ['recherche d\'un secret dans l\'historique', 'git grep -nE \'sb_secret_\' $(git rev-list --all)', []],
  ['jeton lu par variable (profil cloudflare)', 'curl -s "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/settings/ssl" --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN"', []],
];

function selfTest() {
  const base = rel('tests', 'fixtures', 'profils');
  const vert = verifierProfils(path.join(base, 'vert'));
  const rouge = verifierProfils(path.join(base, 'rouge'));
  const codes = new Set(rouge.findings.map(x => x.code));
  const attendus = ['P1', 'P4', 'P5', 'P6', 'P7', 'P8', 'P11', 'P12', 'P13'];
  const manquants = attendus.filter(c => !codes.has(c));
  rendre(vert, 'fixture verte');
  rendre(rouge, 'fixture rouge');
  const fauxCas = [];
  for (const [libelle, cmd, codesAttendus] of CAS_COMMANDES) {
    const obtenus = [...new Set(jugerCommande(cmd).map(g => g.code))].sort();
    const bon = obtenus.join() === codesAttendus.join();
    if (!bon) fauxCas.push(`${libelle} : attendu [${codesAttendus}], obtenu [${obtenus}]`);
  }
  console.log(fauxCas.length ? `cas de commandes : ${fauxCas.length} écart(s) sur ${CAS_COMMANDES.length}` : `cas de commandes : ${CAS_COMMANDES.length} sur ${CAS_COMMANDES.length} conformes (P12 et P13, rouges et remèdes)`);
  for (const x of fauxCas) console.log(`  ✖ ${x}`);
  const ok = vert.findings.length === 0 && vert.profils.length > 0 && manquants.length === 0 && fauxCas.length === 0;
  console.log(ok ? `self-test PASS : verte sans écart, rouge détectée sur ${attendus.join(', ')}, ${CAS_COMMANDES.length} cas de commandes conformes`
    : `self-test FAIL : verte ${vert.findings.length} écart(s) ; codes rouges non détectés : ${manquants.join(', ') || 'aucun'} ; cas de commandes en écart : ${fauxCas.length}`);
  return ok ? 0 : 1;
}

if (process.argv[1]?.endsWith('verifier-profils.mjs')) {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) process.exit(selfTest());
  const cible = args.find(a => !a.startsWith('--'));
  const racine = cible ? path.resolve(cible) : rel('profiles');
  if (!fs.existsSync(racine)) { console.error(`dossier introuvable : ${racine}`); process.exit(2); }
  const res = verifierProfils(racine, { depot: !cible });
  rendre(res, 'profils');
  process.exit(res.findings.length ? 1 : 0);
}
