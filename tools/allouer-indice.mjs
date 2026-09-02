#!/usr/bin/env node
/**
 * allouer-indice — l'ALLOCATION d'indice livrée comme une FONCTION, pas seulement la violation
 * comme un verdict.
 *
 * ── PROVENANCE (copie vendorisée, datée et sourcée) ────────────────────────────────────────
 * Copie fidèle de `scripts/allouer-indice.mjs` du pilot `digit-ai-factory` (TF-0691), prise le
 * 02/09/2026. POURQUOI UNE COPIE PLUTÔT QU'UN IMPORT : AuditCore est un dépôt PUBLIC autonome
 * (MIT) qui se clone seul, et sa CI s'exécute sur des exécuteurs où `../digit-ai-factory`
 * N'EXISTE PAS — un import par chemin relatif au parc rendrait la CI rouge par construction, et
 * les kits distribués (« autoportants, zéro dépendance ») cesseraient de l'être dès qu'un projet
 * audité en ouvrirait le zip. Le contrat est figé côté AuditCore par ses propres fixtures
 * (`tests/oracles/fiche-indice.test.mjs`) : si l'amont évolue, c'est une reprise datée, pas une
 * dérive silencieuse.
 *
 * ── LE FAIT QUI LE REND NÉCESSAIRE ────────────────────────────────────────────────────────
 * Mesuré sur un dépôt de produit le 27/08/2026 : un générateur de fiche portait son nom de sortie
 * dans une CONSTANTE et a réécrit le même fichier quatre fois en 80 minutes — trois contenus
 * différents sous un seul nom, dont deux poussés. Le premier signal reçu a été une question
 * humaine à la relecture (« pourquoi la règle de nouvel indice n'est-elle pas respectée ? »).
 *
 * ── LE CONTRAT (règle « une nouvelle version = un NOUVEAU fichier daté ») ──────────────────
 *   · rien n'existe pour ce jour               → indice `a` ;
 *   · un fichier du jour porte le MÊME contenu → SON indice (une re-génération à contenu
 *     inchangé n'est pas une nouvelle version, sinon l'outil pond un fichier par lancement) ;
 *   · sinon                                    → l'indice SUIVANT le dernier pris.
 *
 * LA COMPARAISON SE FAIT SUR UNE FORME CANONIQUE où l'indice est neutralisé, parce que la
 * référence imprimée DANS le document (`ACM-SEC-DEV-20260902a`) contient l'indice : sans
 * neutralisation, deux contenus identiques différeraient toujours d'une lettre et l'outil
 * allouerait un indice neuf à chaque lancement — le défaut qu'il existe pour fermer.
 *
 * Ce que ce module NE fait PAS, et c'est déclaré :
 *   · il n'écrit RIEN — il rend une lettre, le générateur écrit ;
 *   · il ne juge pas le contenu — l'édition manuelle d'un livrable reste hors de sa portée ;
 *   · il ne voit pas deux générateurs qui écrivent le même nom EN MÊME TEMPS — la fenêtre
 *     existe, comme pour toute allocation par lecture du disque.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const LETTRES = 'abcdefghijklmnopqrstuvwxyz';

/** La forme canonique : chaque occurrence de `<jour><lettre>` perd sa lettre. */
export const canonique = (texte, jour) =>
  String(texte).replaceAll(new RegExp(`${jour}[a-z]`, 'g'), jour);

/**
 * Rend l'indice à employer pour écrire `${prefixe}${jour}<indice>${extension}` dans `dossier`.
 * Voir le contrat en tête de fichier.
 */
export function allouerIndice({ dossier, prefixe, jour, contenu, extension = '.html' }) {
  if (!/^\d{8}$/.test(String(jour))) throw new Error(`jour attendu AAAAMMJJ, reçu « ${jour} »`);
  const motif = new RegExp(
    `^${String(prefixe).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${jour}([a-z])${String(extension).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`);
  const pris = existsSync(dossier)
    ? readdirSync(dossier).map((f) => f.match(motif)).filter(Boolean)
      .map((m) => ({ lettre: m[1], nom: m[0] }))
      .sort((a, b) => a.lettre.localeCompare(b.lettre))
    : [];
  if (!pris.length) return 'a';
  const mienne = canonique(contenu, jour);
  for (const { lettre, nom } of pris) {
    let existant;
    try { existant = readFileSync(join(dossier, nom), 'utf8'); } catch { continue; }
    if (canonique(existant, jour) === mienne) return lettre;
  }
  const derniere = pris[pris.length - 1].lettre;
  const suivant = LETTRES.indexOf(derniere) + 1;
  return suivant < LETTRES.length ? LETTRES[suivant] : 'z';
}
