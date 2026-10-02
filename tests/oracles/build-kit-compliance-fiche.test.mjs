// TF-1351 — le Compliance Pack (part du PROJET AUDITÉ) livrait le canevas de la fiche sécurité en
// `.md` et l'OUTIL d'impression (`fiche-en-pdf.mjs`), mais celui-ci n'accepte QUE du `.html`
// (`node fiche-en-pdf.mjs <fiche.html>`) — aucun moyen, dans le kit, de produire ce `.html` depuis
// le `.md`. Le squelette HTML existait déjà (`tools/build-fiche.mjs --sans-pdf`, consommé par le
// Kit Audit) mais n'était jamais ajouté au Compliance Pack. Décision humaine D-51 (a) du 02/10/2026,
// option (b) de la fiche : fournir directement le modèle dans le format que l'imprimeur accepte, en
// plus de la correction documentaire (méthodologie FR/EN, cf. CHANGELOG).
//
// Lancer : node --test tests/oracles/build-kit-compliance-fiche.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { inflateRawSync } from 'node:zlib';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUTIL = path.join(RACINE, 'tools', 'build-kit.mjs');
const TENANT = path.join(RACINE, 'config', 'tenants', 'exemple', 'tenant.yaml');

// Lecteur ZIP minimal (format écrit par tools/ziplib.mjs : en-têtes locaux séquentiels, tailles
// connues d'avance, sans descripteur de données) — suffisant pour une recette, pas un lecteur général.
function lireZip(buf) {
  const out = [];
  let o = 0;
  while (o + 4 <= buf.length && buf.readUInt32LE(o) === 0x04034b50) {
    const method = buf.readUInt16LE(o + 8);
    const compSize = buf.readUInt32LE(o + 18);
    const nameLen = buf.readUInt16LE(o + 26);
    const extraLen = buf.readUInt16LE(o + 28);
    const nameStart = o + 30;
    const name = buf.toString('utf8', nameStart, nameStart + nameLen);
    const dataStart = nameStart + nameLen + extraLen;
    const raw = buf.subarray(dataStart, dataStart + compSize);
    const data = method === 8 ? inflateRawSync(raw) : Buffer.from(raw);
    out.push({ name, data });
    o = dataStart + compSize;
  }
  return out;
}

test('Compliance Pack : la fiche sécurité part aussi en .html (squelette, format accepté par fiche-en-pdf.mjs) — TF-1351', () => {
  const tmpOut = fs.mkdtempSync(path.join(os.tmpdir(), 'build-kit-compliance-'));
  try {
    const r = spawnSync(process.execPath, [OUTIL, TENANT, '--kind', 'compliance', '--out', tmpOut], { encoding: 'utf8', cwd: RACINE, timeout: 60000 });
    assert.equal(r.status, 0, 'build-kit.mjs --kind compliance doit sortir 0 : ' + r.stderr);
    const zipPath = fs.readdirSync(tmpOut).find(f => f.endsWith('.zip'));
    assert.ok(zipPath, 'aucun zip produit : ' + r.stdout + r.stderr);
    const entries = lireZip(fs.readFileSync(path.join(tmpOut, zipPath)));
    // Les entrées sont préfixées du dossier racine du zip (« <nom du kit>/… ») : on compare la QUEUE
    // du chemin, pas le nom exact.
    const parEnQueue = (suffixe) => entries.find(e => e.name.endsWith('/' + suffixe));
    const noms = entries.map(e => e.name.split('/').slice(1).join('/'));

    assert.ok(noms.includes('fiche-securite.template.md'), 'le canevas .md (référence lisible) doit rester présent');
    assert.ok(noms.includes('fiche-en-pdf.mjs'), 'l\'outil d\'impression doit rester présent');
    assert.ok(noms.includes('fiche-securite.html'),
      'le squelette .html (format accepté par fiche-en-pdf.mjs) doit être livré — sans lui, rien dans le kit ne produit le format que l\'imprimeur accepte');

    const html = parEnQueue('fiche-securite.html').data.toString('utf8');
    assert.match(html, /<html/i, 'fiche-securite.html doit être un document HTML exploitable tel quel');

    const lisezmoi = parEnQueue('LISEZMOI - Compliance Pack.md').data.toString('utf8');
    assert.match(lisezmoi, /fiche-securite\.html/,
      'le LISEZMOI doit nommer fiche-securite.html — sinon le destinataire ne sait toujours pas qu\'il existe');
  } finally {
    fs.rmSync(tmpOut, { recursive: true, force: true });
  }
});

// TF-1351, reste documentaire (option b de la fiche, « en plus de ») : la méthodologie (§4 et §5,
// FR et EN) ne nommait ni le PDF ni fiche-en-pdf.mjs — un destinataire qui s'y fie seule n'y
// apprend jamais que l'outil d'impression existe.
test('méthodologie FR/EN : §4/§5 nomment fiche-en-pdf.mjs (TF-1351, reste documentaire)', () => {
  for (const f of ['methodologie.template.md', 'methodologie.template.en.md']) {
    const texte = fs.readFileSync(path.join(RACINE, 'deliverables', 'templates', f), 'utf8');
    assert.match(texte, /fiche-en-pdf\.mjs/, f + ' ne nomme pas l\'outil d\'impression');
  }
});
