// CTL-D09-09 — « aucune donnée personnelle de production en clair hors production, source déclarée ».
// Recette à double sens du contrôle neuf (TF-2014, décision R-58 du 29/10/2026, option a).
//
// LE FAIT. La règle n'existait qu'en conséquence : ADR0506 (« jeu de données représentatif mais non
// sensible pour les environnements amont »), une ligne de doctrine (« Données de test représentatives
// en recette ») et CTL-D16-04, qui classe les colonnes personnelles sans juger leur présence hors
// production. Aucun contrôle opposable ne refusait la donnée personnelle de production en clair dans une
// base de recette. Un contrôle documentaire n'a pas d'exécutable ; ce qui se prouve ici, ce sont les
// propriétés qui le rendent opposable et qui se perdent en silence :
//   H1 le contrôle est valide au schéma ;           H2 il a pour source ADR0506 ;
//   H3 il renvoie à CTL-D16-04 pour les colonnes ;   H4 il exige la source déclarée, l'absence de donnée
//   personnelle en clair, et dit qu'une pseudonymisation laisse une donnée personnelle ;
//   H5 il ne prescrit ni n'interdit l'extrait anonymisé (décision D-91 du porteur, en attente) ;
//   H6 sa version anglaise porte les mêmes champs de décision ;
//   H7 les packs assemblés ne dérivent pas de leur source (TF-0151) ;
//   H8 les deux miroirs d'ADR0506 le nomment dans derived_controls ;
//   H9 les profils azure et supabase l'instancient, et l'instanciation azure ne prend pas le masquage
//   dynamique pour une anonymisation.
//
// LES DEUX SENS : le VERT juge le dépôt tel qu'il est et ne rend aucun écart ; chaque cas ROUGE
// dégrade une copie en mémoire (jamais un fichier) et doit rendre le code d'écart attendu, et lui seul.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, '..', '..');
const ID = 'CTL-D09-09';
const lire = (...p) => fs.readFileSync(path.join(RACINE, ...p), 'utf-8');
const json = (...p) => JSON.parse(lire(...p));
const copie = (o) => JSON.parse(JSON.stringify(o));
const trouver = (pack, id) => (pack.controls ?? pack.constraints).find((c) => c.id === id);
const derives = (md) => (/^derived_controls:\s*\[(.*?)\]/m.exec(md)?.[1] ?? '').split(',').map((s) => s.trim()).filter(Boolean);

const ajv = new Ajv({ allErrors: true, strict: false });
const valide = ajv.compile(json('core', 'schemas', 'control.schema.json'));

/** Les entrées du juge, lues sur le dépôt : le vert les juge telles quelles, le rouge en dégrade une. */
function entrees() {
  return {
    fr: copie(trouver(json('core', 'controls', 'D09.json'), ID)),
    en: copie(trouver(json('core', 'controls-en', 'D09.json'), ID)),
    // sources intactes, pour H7 : un cas rouge qui dégrade fr/en ne doit pas faire dériver les packs
    srcFr: copie(trouver(json('core', 'controls', 'D09.json'), ID)),
    srcEn: copie(trouver(json('core', 'controls-en', 'D09.json'), ID)),
    packFr: copie(trouver(json('core', 'controls', 'controls-core-v1.json'), ID) ?? null),
    packEn: copie(trouver(json('core', 'controls', 'controls-core-v1.en.json'), ID) ?? null),
    adrFr: lire('core', 'adr', '05-delivery', 'ADR0506-separation-promotion-environnements.md'),
    adrEn: lire('core', 'adr-en', '05-delivery', 'ADR0506-separation-promotion-environnements.md'),
    azure: copie(json('profiles', 'azure', 'bindings.json')),
    supabase: copie(json('profiles', 'supabase', 'bindings.json')),
  };
}

/** Juge les entrées ; rend la liste des codes d'écart (vide = rien à reprocher). */
export function juger(e) {
  const ecarts = [];
  const f = (code, motif) => ecarts.push({ code, motif });
  const { fr, en } = e;

  if (!fr) { f('H1', `${ID} absent de core/controls/D09.json`); return ecarts; }
  if (!valide(fr)) f('H1', ajv.errorsText(valide.errors));
  if (!fr.adr_source?.includes('ADR0506')) f('H2', 'adr_source ne contient pas ADR0506');

  const texte = `${fr.regle} ${fr.verification}`;
  if (!/CTL-D16-04/.test(fr.regle) || !/CTL-D16-04/.test(fr.verification)) f('H3', 'la règle et la vérification doivent renvoyer à CTL-D16-04 pour les colonnes personnelles');

  if (!/déclare la source de ses données/.test(fr.regle)) f('H4', 'la règle n\'exige pas la source déclarée');
  if (!/donnée personnelle issue de la production en clair/.test(fr.regle)) f('H4', 'la règle n\'exige pas l\'absence de donnée personnelle de production en clair');
  if (!/pseudonymisation \(hachage, table de correspondance, clé\) laisse une donnée personnelle/.test(fr.regle)) f('H4', 'la règle ne dit pas qu\'une pseudonymisation laisse une donnée personnelle');
  if (!/aucune source déclarée/.test(fr.grille_verdict) || !/partiel =/.test(fr.grille_verdict) || !/non conforme =/.test(fr.grille_verdict)) f('H4', 'la grille ne distingue pas conforme, partiel et non conforme');

  // H5 : le contrôle laisse la décision D-91 ouverte. Une phrase qui parle de l'extrait et le proscrit
  // ou l'impose rend le contrôle caduc dans l'un des deux cas de la décision.
  const phrases = `${texte} ${fr.grille_verdict}`.split(/(?<=[.;])\s+/);
  const tranche = phrases.filter((p) => /extrait/i.test(p) && /interdi|prohib|proscri|exclu(?!s)|n'est pas admis|doit être admis|obligatoirement/i.test(p) && !/ne tranche pas/i.test(p));
  if (tranche.length) f('H5', `tranche l'admission de l'extrait : « ${tranche[0].slice(0, 80)}… »`);
  if (!/ne tranche pas l'admission d'un extrait/.test(fr.verification)) f('H5', 'la vérification ne dit pas qu\'elle ne tranche pas l\'admission d\'un extrait anonymisé');

  // H6 : la version anglaise tient les champs de décision, et n'est pas le français recopié.
  if (!en) f('H6', `${ID} absent de core/controls-en/D09.json`);
  else {
    for (const champ of ['adr_source', 'dimension_audit', 'criticite', 'profil', 'mode_de_controle', 'enforcement', 'applicabilite', 'standards', 'derogation']) {
      if (JSON.stringify(en[champ]) !== JSON.stringify(fr[champ])) f('H6', `champ « ${champ} » différent entre FR et EN`);
    }
    if (en.actions_audit?.length !== fr.actions_audit?.length) f('H6', 'nombre d\'actions_audit différent entre FR et EN');
    if (en.regle === fr.regle || !/CTL-D16-04/.test(en.regle) || /[éèà]/.test(en.regle)) f('H6', 'la règle anglaise est absente, recopiée du français ou ne renvoie pas à CTL-D16-04');
    if (!/non-compliant =/.test(en.grille_verdict)) f('H6', 'la grille anglaise ne porte pas « non-compliant = »');
  }

  // H7 : les packs assemblés sont l'image de leur source.
  if (JSON.stringify(e.packFr) !== JSON.stringify(e.srcFr)) f('H7', 'controls-core-v1.json ne porte pas le contrôle à l\'identique de D09.json (assemble-core à rejouer)');
  if (JSON.stringify(e.packEn) !== JSON.stringify(e.srcEn)) f('H7', 'controls-core-v1.en.json ne porte pas le contrôle à l\'identique de controls-en/D09.json (assemble-core à rejouer)');

  // H8 : ADR0506, côté français et côté anglais.
  if (!derives(e.adrFr).includes(ID)) f('H8', 'derived_controls de l\'ADR0506 français ne nomme pas le contrôle');
  if (!derives(e.adrEn).includes(ID)) f('H8', 'derived_controls de l\'ADR0506 anglais ne nomme pas le contrôle');

  // H9 : instanciations.
  for (const [nom, profil] of [['azure', e.azure], ['supabase', e.supabase]]) {
    const liens = (profil.bindings ?? []).filter((b) => b.control === ID);
    if (liens.length !== 1) f('H9', `le profil ${nom} lie ${ID} ${liens.length} fois (une attendue)`);
  }
  const az = (e.azure.bindings ?? []).find((b) => b.control === ID);
  if (az && !(/masquage dynamique/i.test(az.instanciation) && /ne prouve pas l'anonymisation/.test(`${az.instanciation} ${az.evidence}`))) f('H9', 'l\'instanciation azure ne dit pas que le masquage dynamique ne prouve pas l\'anonymisation');
  return ecarts;
}

const codes = (ecarts) => [...new Set(ecarts.map((x) => x.code))].sort();

test('VERT — le dépôt tel qu\'il est ne laisse aucun écart sur CTL-D09-09', () => {
  const ecarts = juger(entrees());
  assert.deepEqual(ecarts, [], JSON.stringify(ecarts));
});

const rouges = [
  ['H1', 'valeur hors schéma (bucket)', (e) => { e.fr.bucket = 'autre'; }],
  ['H2', 'ADR0506 retiré des sources', (e) => { e.fr.adr_source = []; e.en.adr_source = []; }],
  ['H3', 'renvoi à CTL-D16-04 retiré de la règle', (e) => { e.fr.regle = e.fr.regle.replace('CTL-D16-04', 'le dictionnaire de données'); }],
  ['H4', 'clause de pseudonymisation retirée', (e) => { e.fr.regle = e.fr.regle.replace(/; une pseudonymisation.*$/, '.'); }],
  ['H4', 'déclaration de la source retirée', (e) => { e.fr.regle = e.fr.regle.replace('déclare la source de ses données', 'existe'); }],
  ['H5', 'l\'extrait anonymisé est interdit dans la vérification', (e) => { e.fr.verification += ' Tout extrait de production anonymisé est interdit.'; }],
  ['H5', 'la réserve sur la décision du tenant est retirée', (e) => { e.fr.verification = e.fr.verification.replace("ne tranche pas l'admission d'un extrait", 'admet un extrait'); }],
  ['H6', 'version anglaise absente', (e) => { e.en = undefined; }],
  ['H6', 'criticité anglaise divergente', (e) => { e.en.criticite = 'Majeur'; }],
  ['H7', 'pack assemblé périmé (contrôle absent)', (e) => { e.packFr = null; }],
  ['H7', 'pack anglais assemblé périmé (texte différent)', (e) => { e.packEn.regle += ' '; }],
  ['H8', 'miroir anglais d\'ADR0506 non réconcilié', (e) => { e.adrEn = e.adrEn.replace(', CTL-D09-09]', ']'); }],
  ['H9', 'profil supabase sans binding', (e) => { e.supabase.bindings = e.supabase.bindings.filter((b) => b.control !== ID); }],
  ['H9', 'masquage dynamique pris pour une preuve d\'anonymisation', (e) => {
    const b = e.azure.bindings.find((x) => x.control === ID);
    b.instanciation = b.instanciation.replace(/ne prouve pas l'anonymisation/g, 'prouve l\'anonymisation');
    b.evidence = b.evidence.replace(/ne prouve pas l'anonymisation/g, 'prouve l\'anonymisation');
  }],
];

for (const [attendu, titre, degrader] of rouges) {
  test(`ROUGE ${attendu} — ${titre}`, () => {
    const e = entrees();
    degrader(e);
    const obtenus = codes(juger(e));
    assert.deepEqual(obtenus, [attendu], `attendu ${attendu} seul, obtenu ${JSON.stringify(obtenus)}`);
  });
}
