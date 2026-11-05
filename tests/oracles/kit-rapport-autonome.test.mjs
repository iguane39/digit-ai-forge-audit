// TF-2169 (RU-10, retour Produit-84 du 05/11/2026, suite de TF-2145 et de TF-2131) — le rendu de rapport AUTONOME que
// le kit d'audit livre au projet audité sort la MÊME forme que `build-rapport` : la forme POC-to-Prod, rendu par défaut
// depuis 28aa645 (TF-2145). Avant ce correctif, `build-rapport-standalone.mjs` :
//   · rendait encore l'ancienne forme (le moteur par vues, inliné seul) ;
//   · importait `./canevas-modele-donnees.mjs`, que le kit ne livre pas : `ERR_MODULE_NOT_FOUND` hors du dépôt (relevé
//     en TF-2131, masqué jusqu'ici par un banc qui copiait ce voisin à côté de l'autonome) ;
// et le marqueur de la porte pour le schéma d'architecture était son libellé français (`aria-label="Schéma
// d'architecture"`) : un rendu anglais le portait donc en français, parce que la porte l'exigeait.
//
// Preuves, dans l'ordre :
//  1. l'autonome, extrait SEUL dans un dossier hors du dépôt, rend un rapport, octet pour octet celui de `build-rapport`
//     (même donnée, même tenant), et ce rapport passe les deux portes (verifier-rapport-html, verifier-forme-rapport) ;
//  2. le même constat pour un tenant en anglais : le schéma porte le marqueur `data-schema="architecture"`, son
//     libellé accessible est anglais, et les portes passent ;
//  3. À DOUBLE SENS : un rendu dont le schéma perd son marqueur est REFUSÉ par les deux portes, et un rendu dont seul
//     le libellé accessible change de langue est ACCEPTÉ — le marqueur ne dépend pas de la langue.
//
// Lancer : node --test tests/oracles/kit-rapport-autonome.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const tool = (n) => path.join(RACINE, 'tools', n);
const TENANT_FR = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');
const RICHE = path.join(RACINE, 'tests', 'fixtures', 'rapport-data-riche.json');
const node = (args, cwd) => spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 180000, maxBuffer: 1e8, cwd });
const dossier = fs.mkdtempSync(path.join(os.tmpdir(), 'kit-rapport-autonome-'));
process.on('exit', () => { try { fs.rmSync(dossier, { recursive: true, force: true }); } catch { /* jetable */ } });

/** Lecteur ZIP minimal (en-têtes locaux séquentiels, format de tools/ziplib.mjs). */
function lireZip(buf) {
  const out = [];
  let o = 0;
  while (o + 4 <= buf.length && buf.readUInt32LE(o) === 0x04034b50) {
    const methode = buf.readUInt16LE(o + 8), taille = buf.readUInt32LE(o + 18);
    const nomLen = buf.readUInt16LE(o + 26), extraLen = buf.readUInt16LE(o + 28);
    const nom = buf.toString('utf8', o + 30, o + 30 + nomLen);
    const debut = o + 30 + nomLen + extraLen, brut = buf.subarray(debut, debut + taille);
    out.push({ nom: nom.split('/').slice(1).join('/'), data: methode === 8 ? inflateRawSync(brut) : Buffer.from(brut) });
    o = debut + taille;
  }
  return out;
}

/** Fabrique le kit d'audit d'un tenant et rend le SEUL fichier `build-rapport-standalone.mjs`, posé seul dans un dossier neuf. */
function autonomeSeul(tenantYaml, nom) {
  const sortie = path.join(dossier, `kit-${nom}`);
  fs.mkdirSync(sortie, { recursive: true });
  const b = node([tool('build-kit.mjs'), tenantYaml, '--kind', 'audit', '--out', sortie]);
  assert.equal(b.status, 0, `fabrication du kit rouge : ${b.stdout}${b.stderr}`);
  const kit = lireZip(fs.readFileSync(path.join(sortie, fs.readdirSync(sortie).find((f) => f.endsWith('.zip')))));
  const source = kit.find((e) => e.nom === 'build-rapport-standalone.mjs');
  assert.ok(source, 'le kit ne livre pas build-rapport-standalone.mjs');
  const seul = path.join(dossier, `seul-${nom}`);          // hors du dépôt, rien d'autre que l'autonome : aucun voisin importable
  fs.mkdirSync(seul, { recursive: true });
  const script = path.join(seul, 'build-rapport-standalone.mjs');
  fs.writeFileSync(script, source.data);
  return { script, seul };
}

/**
 * Un tenant en anglais : l'exemple copié, `language: fr` → `language: en`. Les caches de build du tenant (fusion des
 * contraintes, thème) ne sont pas copiés : `build-rapport` relit `merged.json` s'il existe, et celui de l'exemple est
 * français — la référence serait alors faussée là où le kit, lui, refusionne dans la langue du tenant.
 */
function tenantAnglais() {
  const dir = path.join(dossier, 'tenant-en');
  fs.cpSync(path.join(RACINE, 'config', 'tenants', 'exemple'), dir, { recursive: true });
  fs.rmSync(path.join(dir, 'merged.json'), { force: true });
  fs.rmSync(path.join(dir, 'theme'), { recursive: true, force: true });
  const ty = path.join(dir, 'tenant.yaml');
  fs.writeFileSync(ty, fs.readFileSync(ty, 'utf8').replace('language: fr', 'language: en'), 'utf8');
  return ty;
}

const portes = (fichier) => ({
  html: node([tool('verifier-rapport-html.mjs'), fichier, '--sans-oracles-design']),
  forme: node([tool('verifier-forme-rapport.mjs'), fichier]),
});

for (const [langue, tenant] of [['fr', TENANT_FR], ['en', null]]) {
  test(`TF-2169 — l'autonome du kit (${langue}), extrait seul hors du dépôt, rend EXACTEMENT le rapport par défaut de build-rapport, et il passe les portes`, () => {
    const ty = tenant ?? tenantAnglais();
    const { script, seul } = autonomeSeul(ty, langue);
    const autonome = path.join(seul, 'rapport.html');
    const a = node([script, RICHE, '--out', autonome], seul);
    assert.equal(a.status, 0, `l'autonome ne s'exécute pas hors du dépôt (exit ${a.status}) : ${a.stderr.slice(0, 400)}`);
    const reference = path.join(dossier, `reference-${langue}.html`);
    const r = node([tool('build-rapport.mjs'), RICHE, '--tenant', ty, '--out', reference]);
    assert.equal(r.status, 0, r.stderr);
    const html = fs.readFileSync(autonome, 'utf8');
    assert.match(html, /<meta name="auditcore-forme" content="poc-to-prod">/, 'l\'autonome ne rend pas la forme POC-to-Prod');
    assert.equal(html, fs.readFileSync(reference, 'utf8'), 'l\'autonome et build-rapport rendent deux fichiers différents');
    const p = portes(autonome);
    assert.equal(p.html.status, 0, `verifier-rapport-html : ${p.html.stdout}${p.html.stderr}`.slice(0, 600));
    assert.equal(p.forme.status, 0, `verifier-forme-rapport : ${p.forme.stdout}${p.forme.stderr}`.slice(0, 600));
  });
}

test('TF-2169 — le schéma porte un marqueur indépendant de la langue ; son libellé accessible suit la langue du rendu', () => {
  const rendu = (nom, ty) => {
    const out = path.join(dossier, `${nom}.html`);
    const r = node([tool('build-rapport.mjs'), RICHE, '--tenant', ty, '--out', out]);
    assert.equal(r.status, 0, r.stderr);
    return fs.readFileSync(out, 'utf8');
  };
  const fr = rendu('marqueur-fr', TENANT_FR), en = rendu('marqueur-en', tenantAnglais());
  const svg = (h) => /<svg viewBox="[^"]*"[^>]*data-schema="architecture"[^>]*>/.exec(h)?.[0];
  assert.ok(svg(fr), 'rendu français : le schéma ne porte pas data-schema="architecture"');
  assert.ok(svg(en), 'rendu anglais : le schéma ne porte pas data-schema="architecture"');
  assert.match(svg(fr), /aria-label="Schéma d'architecture"/);
  assert.match(svg(en), /aria-label="Architecture diagram"/);
  assert.doesNotMatch(en, /aria-label="Schéma d'architecture"/, 'le rendu anglais garde le libellé français du schéma');
});

test('TF-2169 — fixture ROUGE : un schéma qui perd son marqueur est refusé par les deux portes ; fixture VERTE : seul le libellé change de langue', () => {
  const out = path.join(dossier, 'porte-fr.html');
  const r = node([tool('build-rapport.mjs'), RICHE, '--tenant', TENANT_FR, '--out', out]);
  assert.equal(r.status, 0, r.stderr);
  const html = fs.readFileSync(out, 'utf8');
  const ok = portes(out);
  assert.equal(ok.html.status, 0, ok.html.stdout + ok.html.stderr);
  assert.equal(ok.forme.status, 0, ok.forme.stdout + ok.forme.stderr);
  // ROUGE : le marqueur retiré (le libellé français reste) — la porte ne doit plus s'y fier
  const sans = path.join(dossier, 'porte-sans-marqueur.html');
  assert.ok(html.includes(' data-schema="architecture"'));
  fs.writeFileSync(sans, html.replace(' data-schema="architecture"', ''), 'utf8');
  const ko = portes(sans);
  assert.equal(ko.html.status, 1, `verifier-rapport-html doit refuser un schéma sans marqueur : ${ko.html.stdout}`);
  assert.match(ko.html.stdout + ko.html.stderr, /schéma d'architecture absent du rendu/);
  assert.notEqual(ko.forme.status, 0, 'verifier-forme-rapport doit refuser un schéma sans marqueur');
  assert.match(ko.forme.stdout + ko.forme.stderr, /F13/);
  // VERT : le libellé accessible traduit, le marqueur conservé — les portes acceptent
  const traduit = path.join(dossier, 'porte-libelle-traduit.html');
  fs.writeFileSync(traduit, html.replace('aria-label="Schéma d\'architecture"', 'aria-label="Architecture diagram"'), 'utf8');
  const vert = portes(traduit);
  assert.equal(vert.html.status, 0, vert.html.stdout + vert.html.stderr);
  assert.equal(vert.forme.status, 0, vert.forme.stdout + vert.forme.stderr);
});
