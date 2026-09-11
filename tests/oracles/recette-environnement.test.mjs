// TF-1017 / TF-1016 — LA RECETTE REJOUE L'ENVIRONNEMENT, ET LE JOURNAL NE DORT PAS.
//
// LES FAITS, mesurés le 10/09/2026 sur la branche principale.
//  · TF-1017 : HUIT exécutions rouges d'affilée en intégration continue, du 24/08 au 10/09, pendant
//    que `node tools/verifier.mjs` rendait vert — 11 groupes, 101 tests. Le job `batterie` était
//    vert ; les deux jobs `oracles` (ubuntu ET windows) tombaient sur les deux MÊMES tests. Aucune
//    régression de code : la recette rejouait les ÉTAPES du workflow sans rejouer son
//    ENVIRONNEMENT — ni `CI=true`, ni les `env:` déclarés dans le YAML, et avec un moteur
//    d'impression présent sur le poste là où le runner n'en avait pas. Une recette qui joue autre
//    chose que ce qu'elle annonce rassure au lieu de vérifier : c'est le défaut d'origine de
//    TF-0553, retrouvé un cran plus bas.
//  · TF-1016 : `CHANGELOG.md` portait une section « [Non publié] » ouverte depuis le 14/08, dernier
//    enregistrement la touchant le 15/08, et ONZE enregistrements touchant `tools/`, `core/` et
//    `oracles/` s'étaient empilés derrière sans une ligne de journal. Un journal qui dort ne se
//    signale jamais lui-même — il faut une règle qui le réveille.
//
// CHAQUE RÈGLE EST ICI DANS LES DEUX SENS : un cas qui doit VERDIR et un cas qui doit ROUGIR. Une
// règle prouvée d'un seul côté ne prouve pas qu'elle mesure quelque chose.
//
// Lancer : node --test tests/oracles/recette-environnement.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  etapes, blocEnv, nonRejouables, familleRunner, rejouer, shellPosix,
  verdictJournal, PLAFOND_ENREGISTREMENTS_SANS_JOURNAL, CHEMINS_JOURNALISES, JOURNAL,
} from '../../tools/verifier.mjs';
import { verdictEol, verdictNavigateur } from '../verdicts.mjs';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Un environnement de référence SANS `CI` : le test doit rendre le même verdict qu'il soit lui-même
// joué par la recette (qui pose `CI=true`) ou à la main.
const SANS_CI = (() => { const e = { ...process.env }; delete e.CI; return e; })();

// ───────────────── 1. Les `env:` du YAML, aux trois niveaux (TF-1017 a) ─────────────────

const WORKFLOW_ENV = `name: fixture
on: [push]
env:
  NIVEAU: workflow
  SEUL_WORKFLOW: w
jobs:
  a:
    runs-on: ubuntu-latest
    env:
      NIVEAU: job
      SEUL_JOB: j
    steps:
      - name: herite du job
        run: echo un
      - name: env propre AVANT le run
        env:
          NIVEAU: etape
          SEUL_ETAPE: e
        run: |
          echo deux
      - name: env propre APRES le run
        run: echo trois
        env:
          NIVEAU: apres
`;

test('les `env:` sont lus aux TROIS niveaux, l\'étape l\'emportant sur le job sur le workflow', () => {
  const lues = etapes(WORKFLOW_ENV);
  assert.equal(lues.length, 3);
  // Niveau job : l'étape n'a rien déclaré, elle hérite — et le niveau workflow reste visible.
  assert.deepEqual(lues[0].env, { NIVEAU: 'job', SEUL_WORKFLOW: 'w', SEUL_JOB: 'j' });
  // Niveau étape déclaré AVANT le `run:` : il écrase le job, sans effacer ce qui ne l'est pas.
  assert.deepEqual(lues[1].env, { NIVEAU: 'etape', SEUL_WORKFLOW: 'w', SEUL_JOB: 'j', SEUL_ETAPE: 'e' });
  // Niveau étape déclaré APRÈS le `run:` : le YAML est un objet, l'ordre d'écriture ne compte pas.
  assert.equal(lues[2].env.NIVEAU, 'apres');
  // ET la portée se referme : l'`env:` de l'étape 2 ne fuit pas sur l'étape 3.
  assert.equal(lues[2].env.SEUL_ETAPE, undefined);
});

// La fixture ROUGE est le MÊME workflow amputé de ses trois blocs `env:` — écrite en clair, pas
// dérivée par substitution : une fixture qu'on fabrique par regex finit par mesurer la regex.
const WORKFLOW_SANS_ENV = `name: fixture
on: [push]
jobs:
  a:
    runs-on: ubuntu-latest
    steps:
      - name: herite du job
        run: echo un
      - name: env propre AVANT le run
        run: |
          echo deux
      - name: env propre APRES le run
        run: echo trois
`;

test('ROUGE si l\'on ne lisait pas les `env:` : le même workflow sans eux ne porte plus rien', () => {
  const lues = etapes(WORKFLOW_SANS_ENV);
  assert.equal(lues.length, 3);
  // La fixture rouge : aucune variable à poser. Si le lecteur d'`env:` régressait, la fixture verte
  // ci-dessus rendrait CE résultat-là — et l'écart entre les deux est ce que la règle mesure.
  for (const e of lues) assert.deepEqual(e.env, {});
});

test('blocEnv : guillemets dénudés, commentaire YAML hors valeur, fin de bloc à l\'indentation', () => {
  const l = ['env:', '  A: "un deux"', "  B: 'trois'", '  C: quatre # un commentaire', 'autre: 1'];
  const { paires, fin } = blocEnv(l, 0);
  assert.deepEqual(paires, { A: 'un deux', B: 'trois', C: 'quatre' });
  assert.equal(fin, 3, 'le bloc s\'arrête au retour d\'indentation');
});

// ───────────── 2. `CI=true` et les `env:` sont POSÉS sur l'étape rejouée (TF-1017 a) ─────────────

test('CI=true est posé sur chaque étape rejouée — et sans lui, la même étape ROUGIT', (t) => {
  const sh = shellPosix();
  if (!sh) { t.skip('aucun shell POSIX sur ce poste — le rejeu d\'étape n\'est pas jugeable ici'); return; }
  const script = 'test "$CI" = "true"';
  // VERT : la recette pose `CI=true`, comme GitHub Actions.
  assert.equal(rejouer({ script, env: {} }, sh, { base: SANS_CI }).vert, true,
    'la recette doit poser CI=true');
  // ROUGE : la même étape, jouée sans la pose, échoue. C'est exactement l'écart qui a produit huit
  // exécutions rouges pendant que la recette rendait vert.
  const nu = spawnSync(sh, ['-c', script], { env: SANS_CI, encoding: 'utf8' });
  assert.notEqual(nu.status, 0, 'sans CI posé, l\'étape ne joue pas la même chose');
});

test('les `env:` du YAML sont posés sur l\'étape — et sans eux, la même étape ROUGIT', (t) => {
  const sh = shellPosix();
  if (!sh) { t.skip('aucun shell POSIX sur ce poste — le rejeu d\'étape n\'est pas jugeable ici'); return; }
  const script = 'test "$JETON_TF1017" = "vert"';
  assert.equal(rejouer({ script, env: { JETON_TF1017: 'vert' } }, sh, { base: SANS_CI }).vert, true);
  assert.equal(rejouer({ script, env: {} }, sh, { base: SANS_CI }).vert, false);
});

test('un `env:` du YAML peut surcharger CI — c\'est le YAML qui fait foi, pas la recette', (t) => {
  const sh = shellPosix();
  if (!sh) { t.skip('aucun shell POSIX sur ce poste'); return; }
  assert.equal(rejouer({ script: 'test "$CI" = "faux"', env: { CI: 'faux' } }, sh, { base: SANS_CI }).vert, true);
});

// ───────────── 3. Les conditions non rejouables sont DITES, pas tues (TF-1017 a) ─────────────

const WF_ECART = `name: fixture
on: [push]
jobs:
  o:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
    runs-on: \${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: controle
        run: node --test
`;

test('ROUGE (écarts présents) : matrice, actions, version de Node et expressions sont TOUTES dites', () => {
  const lignes = nonRejouables(WF_ECART, {
    plateforme: 'linux', nodeVersion: 'v24.1.0', navigateur: null, navigateursCherches: ['/usr/bin/chromium'],
  });
  const dit = (motif) => lignes.filter((l) => motif.test(l));
  // La plateforme qui N'EST PAS celle-ci est dite ; celle qui l'est ne l'est pas.
  assert.equal(dit(/plateforme « windows-latest »/).length, 1);
  assert.equal(dit(/plateforme « ubuntu-latest »/).length, 0, 'ce poste EST ubuntu : rien à déclarer');
  assert.equal(dit(/action « actions\/checkout@v4 »/).length, 1);
  assert.equal(dit(/action « actions\/setup-node@v4 »/).length, 1);
  assert.equal(dit(/Node 22 imposé par le workflow, Node 24 ici/).length, 1);
  assert.equal(dit(/matrix\.os/).length, 1, 'une expression résolue par le runner n\'a pas d\'équivalent local');
  assert.equal(dit(/aucun moteur d'impression/).length, 1);
  assert.equal(dit(/accès réseau aux registres/).length, 1);
});

const WF_SANS_ECART = `name: fixture
on: [push]
jobs:
  o:
    runs-on: ubuntu-latest
    steps:
      - name: controle
        run: node --test
`;

test('VERT (aucun écart évitable) : ni plateforme, ni action, ni version de Node à déclarer', () => {
  const lignes = nonRejouables(WF_SANS_ECART, {
    plateforme: 'linux', nodeVersion: 'v22.0.0', navigateur: '/usr/bin/chromium', navigateursCherches: ['/usr/bin/chromium'],
  });
  assert.equal(lignes.filter((l) => /plateforme «/.test(l)).length, 0);
  assert.equal(lignes.filter((l) => /action «/.test(l)).length, 0);
  assert.equal(lignes.filter((l) => /imposé par le workflow/.test(l)).length, 0);
  // Les deux conditions d'environnement, elles, restent dites DANS LES DEUX SENS : un moteur
  // d'impression PRÉSENT ici est tout aussi non reproductible qu'un moteur absent.
  assert.equal(lignes.filter((l) => /moteur d'impression présent ici/.test(l)).length, 1);
  assert.equal(lignes.filter((l) => /accès réseau aux registres/.test(l)).length, 1);
});

test('familleRunner : la plateforme Node se lit en famille de runner', () => {
  assert.equal(familleRunner('win32'), 'windows');
  assert.equal(familleRunner('linux'), 'ubuntu');
  assert.equal(familleRunner('darwin'), 'macos');
});

test('le workflow RÉEL du dépôt reste lisible : des étapes, et chacune avec son environnement', () => {
  const brut = fs.readFileSync(path.join(RACINE, '.github', 'workflows', 'ci.yml'), 'utf8');
  const lues = etapes(brut);
  assert.ok(lues.length >= 10, `au moins 10 étapes de contrôle attendues, lues : ${lues.length}`);
  for (const e of lues) assert.equal(typeof e.env, 'object', `${e.nom} : l'environnement doit être porté`);
  // Les deux jobs du workflow sont bien distingués — sans quoi `--job` filtrerait tout.
  assert.deepEqual([...new Set(lues.map((e) => e.job))].sort(), ['batterie', 'oracles']);
});

// ───────────── 4. Le journal ne dort pas : plafond nommé, liste au rouge (TF-1016 c) ─────────────

const faux = (n) => Array.from({ length: n }, (_, i) => `abc${1000 + i} un enregistrement`);

test('VERT : au plafond exactement, la règle passe', () => {
  const v = verdictJournal({ journalModifie: false, enregistrements: faux(PLAFOND_ENREGISTREMENTS_SANS_JOURNAL) });
  assert.equal(v.verdict, 'ok');
  assert.match(v.message, new RegExp(`${PLAFOND_ENREGISTREMENTS_SANS_JOURNAL}/${PLAFOND_ENREGISTREMENTS_SANS_JOURNAL}`));
});

test('ROUGE : un enregistrement de plus que le plafond, et la liste est NOMMÉE dans le constat', () => {
  const liste = faux(PLAFOND_ENREGISTREMENTS_SANS_JOURNAL + 1);
  const v = verdictJournal({ journalModifie: false, enregistrements: liste });
  assert.equal(v.verdict, 'rouge');
  for (const e of liste) assert.ok(v.message.includes(e), `le constat doit nommer « ${e} »`);
  assert.match(v.message, new RegExp(`plafond ${PLAFOND_ENREGISTREMENTS_SANS_JOURNAL}`));
  assert.ok(v.message.includes(JOURNAL) && v.message.includes(CHEMINS_JOURNALISES[0]));
});

test('VERT : le journal en cours d\'écriture neutralise la règle — elle demande exactement ça', () => {
  const v = verdictJournal({ journalModifie: true, enregistrements: faux(42) });
  assert.equal(v.verdict, 'ok');
  assert.match(v.message, /en cours d'écriture/);
});

test('le plafond est une constante NOMMÉE, pas un nombre perdu dans une condition', () => {
  assert.equal(PLAFOND_ENREGISTREMENTS_SANS_JOURNAL, 5);
  assert.deepEqual(CHEMINS_JOURNALISES, ['tools', 'core', 'oracles']);
});

// ───────────── 5. Un verdict par situation, le même sur tous les runners (TF-1017 b et c) ─────────────

test('EOL : rien à juger → SKIP MOTIVÉ ; conforme en silence → ÉCHEC ; correctement marqué → JUGE', () => {
  // SKIP : la fixture ne produit aucun composant à statut de fraîcheur — la situation du 10/09. Le
  // motif DIT ce qui a été mesuré (statuts observés, composants non vérifiés) et n'invente pas la
  // cause : « registre injoignable ? » était une hypothèse, et la mesure du 11/09 l'a démentie.
  const rienAJuger = {
    composants: { a: { nom: 'a', statut: 'reco_correctif' }, b: { nom: 'b', statut: 'reco_deprecie' } },
    resume: { non_verifies: 0, eol_non_verifies: 0 },
  };
  const vs = verdictEol(rienAJuger);
  assert.equal(vs.verdict, 'SKIP');
  assert.match(vs.motif, /reco_correctif, reco_deprecie/, 'le motif nomme les statuts MESURÉS');
  assert.match(vs.motif, /ne dépend ni de la machine ni de l'intégration continue/);

  // ROUGE 1 : un composant à statut de fraîcheur présenté comme EOL vérifié, registre pourtant KO.
  const enSilence = {
    composants: { a: { nom: 'a', statut: 'a_jour', eol_verifie: true } },
    resume: { non_verifies: 0, eol_non_verifies: 1 },
  };
  const ve = verdictEol(enSilence);
  assert.equal(ve.verdict, 'ECHEC');
  assert.match(ve.motif, /comme EOL vérifié/);
  assert.ok(ve.motif.includes('a'), 'le constat NOMME le composant fautif');

  // ROUGE 2 : le volet EOL n'est pas marqué non vérifié du tout — « pas EOL » silencieux.
  const nonMarque = {
    composants: { a: { nom: 'a', statut: 'veille_majeur', eol_verifie: false } },
    resume: { non_verifies: 0, eol_non_verifies: 0 },
  };
  assert.equal(verdictEol(nonMarque).verdict, 'ECHEC');

  // VERT : il y a de quoi juger, et tout est correctement marqué.
  const jugeable = {
    composants: { a: { nom: 'a', statut: 'a_jour', eol_verifie: false } },
    resume: { non_verifies: 0, eol_non_verifies: 1 },
  };
  const vj = verdictEol(jugeable);
  assert.equal(vj.verdict, 'JUGE', vj.motif);
  assert.equal(vj.composants.length, 1);
});

test('EOL : le verdict NE DÉPEND PAS de CI — c\'est tout l\'objet de TF-1017', () => {
  const cas = {
    composants: { a: { nom: 'a', statut: 'reco_correctif' } },
    resume: { non_verifies: 0, eol_non_verifies: 0 },
  };
  const avant = process.env.CI;
  try {
    process.env.CI = 'true';
    const sousCI = verdictEol(cas);
    delete process.env.CI;
    const horsCI = verdictEol(cas);
    assert.deepEqual(sousCI, horsCI, 'la même situation doit rendre le même verdict des deux côtés');
    assert.equal(sousCI.verdict, 'SKIP');
  } finally { if (avant === undefined) delete process.env.CI; else process.env.CI = avant; }
});

test('moteur d\'impression : 0 → JUGE · 3 motivé → SKIP · 3 MUET → ÉCHEC · autre → ÉCHEC', () => {
  assert.equal(verdictNavigateur({ status: 0, stderr: '', navigateur: '/usr/bin/chromium' }).verdict, 'JUGE');

  const skip = verdictNavigateur({ status: 3, stderr: "— PDF NON RENDU : aucun moteur d'impression trouvé." });
  assert.equal(skip.verdict, 'SKIP');
  assert.match(skip.motif, /PDF NON RENDU/, 'le SKIP répète le motif écrit par l\'outil');

  // ROUGE : une dégradation SANS motif est un silence, et un silence n'est pas un SKIP.
  assert.equal(verdictNavigateur({ status: 3, stderr: '' }).verdict, 'ECHEC');
  // ROUGE : un échec franc reste un échec, il ne se déguise pas en dépendance manquante.
  assert.equal(verdictNavigateur({ status: 1, stderr: 'boum' }).verdict, 'ECHEC');
});

test('moteur d\'impression : le verdict NE DÉPEND PAS de CI ni du poste', () => {
  const cas = { status: 3, stderr: "— PDF NON RENDU : aucun moteur d'impression trouvé." };
  const avant = process.env.CI;
  try {
    process.env.CI = 'true';
    const sousCI = verdictNavigateur(cas);
    delete process.env.CI;
    assert.deepEqual(sousCI, verdictNavigateur(cas));
  } finally { if (avant === undefined) delete process.env.CI; else process.env.CI = avant; }
});
