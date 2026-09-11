// tests/verdicts.mjs — LE VERDICT D'UN CONTRÔLE NE DÉPEND PAS DU RUNNER QUI LE JOUE (TF-1017).
//
// LE FAIT, mesuré le 10/09/2026. Huit exécutions rouges d'affilée sur la branche principale, du
// 24/08 au 10/09, pendant que la recette locale rendait vert — 11 groupes, 101 tests. Aucune
// régression de code : deux contrôles rendaient simplement DEUX verdicts pour UNE MÊME situation,
// selon que `CI` était posée ou non, et selon qu'un moteur d'impression traînait sur le poste.
//   · le volet EOL : « aucun composant à statut de fraîcheur » valait SKIP en local et ÉCHEC en
//     intégration continue, alors que la cause est la même des deux côtés — le registre de
//     fraîcheur ne répond pas ;
//   · le volet PDF : le test re-listait LUI-MÊME les chemins de navigateurs au lieu de demander à
//     l'outil, si bien que sa notion de « dépendance présente » pouvait diverger de celle de
//     l'outil qu'il pilote.
//
// D'où ces deux fonctions PURES, sorties des fichiers de test : elles prennent un état observé et
// rendent un verdict, sans lire `process.env`, sans toucher au disque, sans réseau. C'est ce qui
// rend la règle démontrable dans les deux sens par une fixture — et c'est ce qui garantit qu'un
// runner sans réseau et un poste avec réseau ne répondent pas deux choses différentes à la même
// question. Un contrôle sauté n'est pas un contrôle vert : le SKIP porte toujours son motif écrit.

/** Les statuts qui SUPPOSENT une réponse du registre de fraîcheur : sans eux, rien à juger côté EOL. */
export const STATUTS_FRAICHEUR = ['a_jour', 'veille_majeur', 'couvert_plage'];

/**
 * Le verdict du volet « fins de support », endoflife forcé injoignable, sur un rapport de versions.
 *  · SKIP  — aucun composant ne porte de statut de fraîcheur : il n'y a rien à juger côté EOL, et
 *            c'est vrai ici comme sur n'importe quel runner. Le motif DIT ce qui a été mesuré — le
 *            nombre de composants, leurs statuts, et si le registre de versions a répondu. Il
 *            n'invente pas la cause : « registre injoignable ? » était une hypothèse, pas un fait,
 *            et c'est cette hypothèse posée en ÉCHEC qui a rougi huit exécutions ;
 *  · JUGE  — des composants portent un statut de fraîcheur, et AUCUN n'est présenté comme vérifié
 *            côté EOL : le volet est correctement marqué non vérifié ;
 *  · ECHEC — des composants portent un statut de fraîcheur mais le rapport les présente comme
 *            silencieusement conformes : c'est le défaut 4, et il échoue partout.
 * Aucune branche ne lit l'environnement : le même rapport rend le même verdict partout.
 */
export function verdictEol(rapport = {}) {
  const composants = Object.values(rapport.composants ?? {});
  const fraicheur = composants.filter((c) => STATUTS_FRAICHEUR.includes(c && c.statut));
  const resume = rapport.resume ?? {};
  if (!fraicheur.length) {
    const statuts = [...new Set(composants.map((c) => (c && c.statut) || '(sans statut)'))];
    return { verdict: 'SKIP', composants: [],
      motif: `aucun des ${composants.length} composant(s) ne porte de statut de fraîcheur `
        + `(${STATUTS_FRAICHEUR.join(', ')}) — observé : ${statuts.join(', ') || '—'} ; `
        + `${Number(resume.non_verifies ?? 0)} en « non vérifié ». Le volet EOL n'a rien à juger, `
        + `et ce constat ne dépend ni de la machine ni de l'intégration continue.` };
  }
  const manques = [];
  if (!(Number(resume.eol_non_verifies ?? 0) >= 1))
    manques.push('le volet EOL n\'est pas marqué non vérifié (eol_non_verifies = '
      + `${Number(resume.eol_non_verifies ?? 0)})`);
  const conformesEnSilence = fraicheur.filter((c) => c.eol_verifie !== false).map((c) => c.nom);
  if (conformesEnSilence.length)
    manques.push(`présenté(s) comme EOL vérifié alors que le registre a été forcé injoignable : `
      + conformesEnSilence.join(', '));
  if (manques.length) return { verdict: 'ECHEC', composants: fraicheur, motif: manques.join(' · ') };
  return { verdict: 'JUGE', composants: fraicheur,
    motif: `${fraicheur.length} composant(s) à statut de fraîcheur, tous marqués EOL non vérifié` };
}

/**
 * Le verdict du volet « les deux formats dans la même passe » sur la sortie de `build-fiche`.
 * La dépendance est DÉCLARÉE par l'outil lui-même (code 3 + motif écrit), jamais devinée par une
 * liste de chemins recopiée dans le test.
 *  · JUGE  — code 0 : le PDF a été rendu ET relu, les assertions s'appliquent ;
 *  · SKIP  — code 3 AVEC son motif écrit : dépendance absente, déclarée, sur n'importe quel runner ;
 *  · ECHEC — tout le reste, y compris un code 3 MUET : une dégradation sans motif est un silence.
 */
export function verdictNavigateur({ status, stderr = '', navigateur = null } = {}) {
  if (status === 0)
    return { verdict: 'JUGE',
      motif: `moteur d'impression disponible${navigateur ? ` (${navigateur})` : ''} — le rendu PDF est jugé` };
  if (status === 3) {
    const motif = String(stderr).split(/\r?\n/).find((l) => /PDF NON RENDU/.test(l));
    if (!motif)
      return { verdict: 'ECHEC',
        motif: 'code 3 (dégradation) SANS motif écrit : un contrôle qui se dégrade sans le dire '
          + 'est un contrôle absent' };
    return { verdict: 'SKIP', motif: `dépendance déclarée absente — ${motif.trim()}` };
  }
  return { verdict: 'ECHEC',
    motif: `build-fiche sort ${status} : ni un rendu complet (0) ni une dégradation déclarée (3)` };
}
