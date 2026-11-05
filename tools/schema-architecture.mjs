// AuditCore — schéma d'architecture de la forme POC-to-Prod (TF-2145, décision humaine D-171 (a) du 04/11/2026).
//
// LE FAIT. Le moteur de rendu (`renderArchi` de rapport-engine.mjs) trace une flèche entre deux bandes non voisines en
// ligne droite à travers les nœuds intermédiaires, et deux flèches qui partent du même nœud sur le même tronc : sur le
// rapport de référence du 24/09/2026 (forme POC-to-Prod, Produit-68), la sonde de la mission a compté 11 traversées et
// 18 paires confondues avant que le routage ne soit refait « ports et voies propres à chaque flèche ». Ce module porte
// ce routage dans le dépôt, agnostique, et la MESURE qui le juge.
//
// LA RÈGLE DE ROUTAGE, construite pour qu'une traversée ou une confusion ne puisse pas naître :
//   · chaque flèche a ses PORTS propres sur le bord de ses nœuds (répartis le long du côté, dans l'ordre de l'autre bout) ;
//   · chaque tronçon horizontal a sa VOIE propre dans l'intervalle libre entre deux bandes (jamais dans une rangée de
//     nœuds) ; les voies d'un intervalle s'emboîtent : départs près de la rangée du haut, arrivées près de celle du bas ;
//   · un lien entre deux bandes non voisines descend ou monte par un COULOIR latéral, une colonne propre à chaque lien,
//     hors de la zone des nœuds ; il en sort et y entre par les voies des intervalles qui touchent ses deux nœuds ;
//   · seul un lien entre deux voisins directs d'une même bande reste une droite, entre leurs côtés en vis-à-vis ;
//   · les titres de bande vivent dans une gouttière à gauche des nœuds, à hauteur de leur rangée : aucune voie ni aucun
//     couloir ne les traverse (le schéma de référence les posait au-dessus de la rangée, où une flèche d'arrivée pouvait
//     les couper).
// Une passe de RÉPARATION rejoue la mesure : si deux segments verticaux de liens différents se superposent (ports à la
// même abscisse dans un même intervalle), le port d'arrivée est décalé, puis tout est retracé.
//
// LA MESURE (`mesurerRoutage`, `mesurerRoutageSvg`) — critère binaire de TF-2145 :
//   traversée        un segment d'une flèche coupe l'intérieur d'un nœud qui n'est ni sa source ni sa cible ;
//   paire confondue  deux flèches distinctes ont deux segments colinéaires (écart < 3 px) qui se recouvrent sur plus de
//                    2 px — le lecteur ne peut plus dire laquelle va où.
// `mesurerRoutageSvg` relit le SVG RENDU (nœuds `g#arch-n-*` + `rect`, flèches `polyline[data-de][data-vers]`) : la
// porte juge ce que le lecteur voit, pas la donnée qui l'a produit.
//
// Le module est PUR (aucune E/S) et déterministe : même donnée, même SVG, octet pour octet — le rapport et la
// présentation à l'autorité (TF-2142, « pas de second schéma divergent ») appellent la même fonction.
import { TOKENS_DERIVES_CSS } from './rapport-engine.mjs';

export const SCHEMA_LARGEUR = 1240;
const STYLES = ['purple', 'blue', 'teal', 'coral', 'amber', 'gray'];
const GOUTTIERE = 140;          // largeur des titres de bande
const PAS_COULOIR = 8;          // écart entre deux couloirs latéraux
const PAS_VOIE = 10;            // écart minimal entre deux voies d'un intervalle
const ESPACE_NOEUDS = 28;       // écart visé entre deux nœuds d'une rangée
const LARGEUR_MAX = 230, LARGEUR_MIN = 48;
const CHASSE = { label: 7.0, sub: 5.7, meta: 6.1, bande: 6.6 };   // largeur moyenne d'un caractère (px), par classe de texte

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const idSur = (s) => String(s).replace(/[^\w-]/g, '_');
const arrondi = (v) => Math.round(v * 10) / 10;

/** Coupe un texte en au plus `max` lignes de `n` caractères ; la dernière ligne finit par « … » si le texte déborde. */
export function couper(texte, n, max) {
  const mots = String(texte ?? '').trim().split(/\s+/).filter(Boolean);
  if (!mots.length) return [];
  const lignes = [];
  let cur = '';
  for (const m of mots) {
    const essai = cur ? `${cur} ${m}` : m;
    if (essai.length <= n) { cur = essai; continue; }
    if (cur) lignes.push(cur);
    cur = m.length > n ? m.slice(0, Math.max(1, n - 1)) + '…' : m;
  }
  if (cur) lignes.push(cur);
  if (lignes.length <= max) return lignes;
  const garde = lignes.slice(0, max);
  const der = garde[max - 1];
  garde[max - 1] = (der.length >= n ? der.slice(0, Math.max(1, n - 1)) : der) + '…';
  return garde;
}

/** Normalise la donnée `architecture` de rapport-data.json (bandes {key,label} ou {id,title}). */
function normaliser(arch, libelleAutres) {
  const bandes = (arch?.bandes ?? []).map((b) => ({ key: String(b.key ?? b.id ?? ''), label: String(b.label ?? b.title ?? b.key ?? b.id ?? '') }))
    .filter((b) => b.key);
  const connues = new Set(bandes.map((b) => b.key));
  const noeuds = [];
  const ignores = [];
  const vus = new Set();
  for (const n of arch?.nodes ?? []) {
    if (!n || n.id === undefined || n.id === null || vus.has(String(n.id))) { ignores.push({ type: 'noeud', id: n?.id ?? null, motif: 'identifiant absent ou en double' }); continue; }
    vus.add(String(n.id));
    noeuds.push({ ...n, id: String(n.id), bande: connues.has(String(n.bande ?? '')) ? String(n.bande) : '__autres' });
  }
  // Un nœud rattaché à une bande non déclarée n'est pas jeté en silence : il entre dans une bande implicite, visible.
  if (noeuds.some((n) => n.bande === '__autres')) bandes.push({ key: '__autres', label: libelleAutres });
  const parId = new Map(noeuds.map((n) => [n.id, n]));
  const aretes = [];
  (arch?.edges ?? []).forEach((e, i) => {
    const de = String(e?.from ?? ''), vers = String(e?.to ?? '');
    if (!parId.has(de) || !parId.has(vers)) { ignores.push({ type: 'fleche', id: `${de} → ${vers}`, motif: 'extrémité inconnue' }); return; }
    if (de === vers) { ignores.push({ type: 'fleche', id: `${de} → ${vers}`, motif: 'boucle sur un même nœud' }); return; }
    aretes.push({ i, from: de, to: vers, style: e.style === 'coral' || e.style === 'dashed' ? e.style : 'normal', label: e.label ?? '', tip: e.tip ?? '' });
  });
  return { bandes, noeuds, aretes, ignores };
}

/** Ordre horizontal des nœuds de chaque bande : barycentre (4 passes), `rank` explicite prioritaire. */
function ordonner(bandes, noeuds, aretes) {
  const parBande = Object.fromEntries(bandes.map((b) => [b.key, noeuds.filter((n) => n.bande === b.key)]));
  for (let it = 0; it < 4; it++) {
    const desc = it % 2 === 0;
    const ordre = desc ? bandes : [...bandes].reverse();
    for (let bi = 1; bi < ordre.length; bi++) {
      const ref = parBande[ordre[bi - 1].key];
      const rangRef = new Map(ref.map((n, i) => [n.id, i]));
      parBande[ordre[bi].key].forEach((n, i) => {
        const voisins = aretes.filter((e) => (desc ? e.to === n.id : e.from === n.id))
          .map((e) => (desc ? e.from : e.to)).filter((id) => rangRef.has(id));
        if (voisins.length) n._bc = voisins.reduce((s, id) => s + rangRef.get(id), 0) / voisins.length;
        else if (n._bc === undefined) n._bc = i;
      });
      parBande[ordre[bi].key] = [...parBande[ordre[bi].key]].sort((a, b) => (a._bc ?? 0) - (b._bc ?? 0));
    }
  }
  for (const b of bandes) {
    parBande[b.key] = [...parBande[b.key]].sort((a, b2) => {
      const ka = a.rank !== undefined ? Number(a.rank) : (a._bc ?? 0);
      const kb = b2.rank !== undefined ? Number(b2.rank) : (b2._bc ?? 0);
      return ka - kb;
    });
  }
  return parBande;
}

/**
 * Calcule la géométrie du schéma : rangées, nœuds, ports, voies, couloirs et tracés. Rend
 * { largeur, hauteur, bandes[], noeuds[], aretes[], ignores[] } — `aretes[].points` est la polyligne de chaque flèche.
 */
export function calculerSchema(arch, { libelleAutres = 'Autres' } = {}) {
  const W = SCHEMA_LARGEUR;
  const { bandes, noeuds, aretes, ignores } = normaliser(arch, libelleAutres);
  const parBande = ordonner(bandes, noeuds, aretes);
  const indexBande = Object.fromEntries(bandes.map((b, i) => [b.key, i]));
  const B = bandes.length;
  const noeud = new Map(noeuds.map((n) => [n.id, n]));
  const rang = (n) => parBande[n.bande].indexOf(n);
  const centreRelatif = (n) => (rang(n) + 0.5) / parBande[n.bande].length;

  // ── 1. Le PLAN de chaque flèche : sa forme et les intervalles qu'elle traverse. L'intervalle k est AU-DESSUS de la
  //       bande k (k = B : sous la dernière bande). Zones d'une voie dans son intervalle : 0 près de la rangée du haut,
  //       1 au milieu, 2 près de la rangée du bas.
  const plans = aretes.map((e) => {
    const de = noeud.get(e.from), vers = noeud.get(e.to);
    const f = indexBande[de.bande], t = indexBande[vers.bande];
    const p = { e, de, vers, f, t, troncons: [] };
    if (f === t && Math.abs(rang(de) - rang(vers)) === 1) {
      p.type = 'voisins'; p.cd = rang(vers) > rang(de) ? 'droite' : 'gauche'; p.ca = p.cd === 'droite' ? 'gauche' : 'droite';
    } else if (f === t) {
      p.type = 'bande'; p.cd = p.ca = 'bas';
      p.troncons.push({ g: f + 1, role: 'unique', zone: 0 });
    } else if (Math.abs(t - f) === 1) {
      p.type = 'adjacentes';
      const descend = t > f;
      p.cd = descend ? 'bas' : 'haut'; p.ca = descend ? 'haut' : 'bas';
      p.troncons.push({ g: descend ? t : f, role: 'unique', zone: 1 });
    } else {
      p.type = 'couloir';
      const descend = t > f;
      p.cote = (centreRelatif(de) + centreRelatif(vers)) / 2 < 0.5 ? 'gauche' : 'droite';
      p.cd = descend ? 'bas' : 'haut'; p.ca = descend ? 'haut' : 'bas';
      p.troncons.push({ g: descend ? f + 1 : f, role: 'sortie', zone: descend ? 0 : 2 });
      p.troncons.push({ g: descend ? t : t + 1, role: 'entree', zone: descend ? 2 : 0 });
    }
    return p;
  });

  // ── 2. Les couloirs : une colonne par lien long, hors de la zone des nœuds.
  const couloirs = { gauche: plans.filter((p) => p.type === 'couloir' && p.cote === 'gauche'), droite: plans.filter((p) => p.type === 'couloir' && p.cote === 'droite') };
  const L = couloirs.gauche.length, R = couloirs.droite.length;
  couloirs.gauche.forEach((p, k) => { p.xCouloir = 8 + PAS_COULOIR * k; });
  couloirs.droite.forEach((p, k) => { p.xCouloir = W - 8 - PAS_COULOIR * k; });
  const xTitre = (L ? 8 + PAS_COULOIR * L : 8) + 6;
  const x0 = xTitre + GOUTTIERE + 16;
  const x1 = W - (R ? 8 + PAS_COULOIR * R + 14 : 20);

  // ── 3. Les nœuds : largeur, texte coupé, hauteur ; la rangée prend la hauteur de son plus grand nœud.
  const rangees = bandes.map((b) => {
    const liste = parBande[b.key];
    const n = liste.length || 1;
    const pas = (x1 - x0) / n;
    const w = Math.max(LARGEUR_MIN, Math.min(LARGEUR_MAX, pas - ESPACE_NOEUDS >= 110 ? pas - ESPACE_NOEUDS : pas - 12));
    liste.forEach((nd, i) => {
      nd._w = w; nd._cx = x0 + pas * i + pas / 2; nd._x = nd._cx - w / 2;
      const nl = Math.max(4, Math.floor((w - 16) / CHASSE.label)), ns = Math.max(4, Math.floor((w - 16) / CHASSE.sub)), nm = Math.max(4, Math.floor((w - 16) / CHASSE.meta));
      nd._lignes = { label: couper(nd.label ?? nd.id, nl, 2), sub: couper(nd.sub, ns, 2), meta: couper(nd.meta, nm, 1) };
      nd._h = Math.max(52, 14 + nd._lignes.label.length * 15 + nd._lignes.sub.length * 13 + nd._lignes.meta.length * 13 + 8);
    });
    const titre = couper(String(b.label).toUpperCase(), Math.floor(GOUTTIERE / CHASSE.bande), 3);
    const h = Math.max(52, ...liste.map((nd) => nd._h), titre.length * 13 + 10);
    return { key: b.key, label: b.label, titre, h, liste };
  });

  // ── 4. La hauteur de chaque intervalle suit le nombre de voies qu'il porte.
  const voiesParIntervalle = Array.from({ length: B + 1 }, () => []);
  for (const p of plans) for (const tr of p.troncons) voiesParIntervalle[tr.g].push({ p, tr });
  const hauteurIntervalle = (k) => {
    const n = voiesParIntervalle[k].length;
    if (k === 0) return n ? (n + 1) * PAS_VOIE + 12 : 16;
    if (k === B) return n ? (n + 1) * PAS_VOIE + 12 : 16;
    return Math.max(40, (n + 1) * PAS_VOIE + 20);
  };
  const intervalles = [];
  let y = 0;
  for (let k = 0; k <= B; k++) {
    const h = hauteurIntervalle(k);
    intervalles.push({ haut: y, bas: y + h });
    y += h;
    if (k < B) {
      const r = rangees[k];
      r.y = y;
      for (const nd of r.liste) { nd._y = y + (r.h - nd._h) / 2; nd._cy = nd._y + nd._h / 2; }
      y += r.h;
    }
  }
  const H = Math.ceil(y);

  // ── 5. Les voies : une par tronçon, réparties dans son intervalle, emboîtées par zone.
  const attribuerVoies = () => {
    intervalles.forEach((iv, k) => {
      const liste = voiesParIntervalle[k];
      const xDe = (o) => (o.tr.role === 'entree' ? o.p.xCouloir : o.p.depart[0]);
      const xVers = (o) => (o.tr.role === 'sortie' ? o.p.xCouloir : o.p.arrivee[0]);
      const long = (o) => Math.abs(xDe(o) - xVers(o));
      const gauche = (o) => Math.min(xDe(o), xVers(o));
      const cle = (o) => (o.tr.zone === 0 ? long(o) : o.tr.zone === 2 ? -long(o) : gauche(o));
      liste.sort((a, b) => a.tr.zone - b.tr.zone || cle(a) - cle(b) || a.p.e.i - b.p.e.i);
      const haut = iv.haut + 6, bas = iv.bas - 6;
      liste.forEach((o, j) => { o.tr.y = arrondi(haut + (j + 1) * (bas - haut) / (liste.length + 1)); });
    });
  };

  // ── 6. Les ports : les liens d'un même côté d'un nœud se répartissent sur ce côté, dans l'ordre de leur autre bout.
  const decalages = new Map();   // réparation : décalage d'un port, par lien et par rôle (« i|depart », « i|arrivee »)
  const attribuerPorts = () => {
    const ports = new Map();
    const attacher = (n, cote, p, role, vers, zone) => {
      const k = `${n.id}|${cote}`;
      if (!ports.has(k)) ports.set(k, { n, cote, liste: [] });
      ports.get(k).liste.push({ p, role, vers, zone });
    };
    for (const p of plans) {
      const versD = p.type === 'couloir' ? p.xCouloir : p.vers._cx;
      const versA = p.type === 'couloir' ? p.xCouloir : p.de._cx;
      const zD = p.troncons.find((t) => t.role === 'unique' || t.role === 'sortie')?.zone;
      const zA = p.troncons.find((t) => t.role === 'unique' || t.role === 'entree')?.zone;
      attacher(p.de, p.cd, p, 'depart', versD, zD);
      attacher(p.vers, p.ca, p, 'arrivee', versA, zA);
    }
    for (const { n, cote, liste } of ports.values()) {
      if (cote === 'bas' || cote === 'haut') {
        // un lien dont la voie est plus loin du bord prend le port extérieur à son sens de marche : les tracés s'emboîtent
        const prof = (l) => (cote === 'bas' ? (l.zone ?? 1) : 2 - (l.zone ?? 1)) * 10000 + Math.abs(l.vers - n._cx);
        const g = liste.filter((l) => l.vers < n._cx - 1).sort((a, b) => prof(a) - prof(b) || a.p.e.i - b.p.e.i);
        const a = liste.filter((l) => Math.abs(l.vers - n._cx) <= 1).sort((x, z) => x.p.e.i - z.p.e.i);
        const d = liste.filter((l) => l.vers > n._cx + 1).sort((x, z) => prof(z) - prof(x) || x.p.e.i - z.p.e.i);
        liste.splice(0, liste.length, ...g, ...a, ...d);
        const k = liste.length;
        const pas = Math.max(4, Math.min(22, (n._w * 0.8) / Math.max(k, 1)));
        liste.forEach((l, j) => {
          const dec = decalages.get(`${l.p.e.i}|${l.role}`) ?? 0;
          const x = Math.min(n._x + n._w - 4, Math.max(n._x + 4, n._cx + (j - (k - 1) / 2) * pas + dec));
          l.p[l.role] = [arrondi(x), arrondi(cote === 'bas' ? n._y + n._h : n._y)];
        });
      } else {
        liste.sort((a, b) => a.vers - b.vers || a.p.e.i - b.p.e.i);
        const k = liste.length;
        liste.forEach((l, j) => {
          l.p[l.role] = [arrondi(cote === 'droite' ? n._x + n._w : n._x), arrondi(n._cy + (j - (k - 1) / 2) * 8)];
        });
      }
    }
    // Un lien entre bandes voisines dont l'arrivée est SEULE sur son côté se tire droit quand l'abscisse de départ tombe
    // dans le bord de la cible : la baïonnette inutile disparaît. La réparation reste juge de ce qui en résulte.
    for (const p of plans) {
      if (p.type !== 'adjacentes' || decalages.has(`${p.e.i}|arrivee`)) continue;
      const seule = (ports.get(`${p.vers.id}|${p.ca}`)?.liste.length ?? 0) === 1;
      const xd = p.depart[0];
      if (seule && xd >= p.vers._x + 6 && xd <= p.vers._x + p.vers._w - 6) p.arrivee = [xd, p.arrivee[1]];
    }
  };

  // ── 7. Les tracés.
  const tracer = () => {
    for (const p of plans) {
      const [xd, yd] = p.depart, [xa, ya] = p.arrivee;
      const yDe = (role) => p.troncons.find((t) => t.role === role)?.y;
      if (p.type === 'voisins') { p.e.points = [[xd, yd], [xa, yd]]; continue; }
      if (p.type === 'bande' || p.type === 'adjacentes') {
        const yv = yDe('unique');
        p.e.points = (p.type === 'adjacentes' && Math.abs(xd - xa) < 1) ? [[xd, yd], [xa, ya]] : [[xd, yd], [xd, yv], [xa, yv], [xa, ya]];
        continue;
      }
      p.e.points = [[xd, yd], [xd, yDe('sortie')], [p.xCouloir, yDe('sortie')], [p.xCouloir, yDe('entree')], [xa, yDe('entree')], [xa, ya]];
    }
  };

  const geometrie = () => ({
    noeuds: noeuds.map((n) => ({ id: n.id, x1: n._x, y1: n._y, x2: n._x + n._w, y2: n._y + n._h })),
    aretes: aretes.map((e) => ({ i: e.i, de: e.from, vers: e.to, points: e.points })),
  });

  attribuerPorts(); attribuerVoies(); tracer();
  // ── 8. Réparation : deux segments verticaux de liens différents qui se superposent sont séparés en décalant, de 5 px,
  //       le port du second lien qui porte le segment fautif (départ s'il s'agit de son premier segment, arrivée sinon),
  //       puis tout est retracé. Bornée : au-delà, la mesure dira ce qui reste — jamais un schéma déclaré propre à tort.
  const parIndex = new Map(aretes.map((e) => [e.i, e]));
  for (let tour = 0; tour < 60; tour++) {
    const { confondues } = mesurerRoutage(geometrie());
    if (!confondues.length) break;
    const { a, b } = confondues[0];
    const sa = segmentsDe(parIndex.get(a).points), sb = segmentsDe(parIndex.get(b).points);
    const k = sb.findIndex((s) => sa.some((t) => colineaires(s, t)));
    const role = k === 0 ? 'depart' : 'arrivee';
    const cle = `${b}|${role}`;
    decalages.set(cle, (decalages.get(cle) ?? 0) + 5);
    attribuerPorts(); attribuerVoies(); tracer();
  }

  return {
    largeur: W, hauteur: H, xTitre,
    bandes: rangees.map((r) => ({ key: r.key, label: r.label, titre: r.titre, y: r.y, h: r.h })),
    noeuds: noeuds.map((n) => ({ id: n.id, bande: n.bande, label: n.label ?? n.id, sub: n.sub ?? '', meta: n.meta ?? '', tip: n.tip ?? '',
      style: STYLES.includes(n.style) ? n.style : 'gray', x: arrondi(n._x), y: arrondi(n._y), w: arrondi(n._w), h: arrondi(n._h), cx: arrondi(n._cx), cy: arrondi(n._cy), lignes: n._lignes })),
    aretes: aretes.map((e) => ({ i: e.i, from: e.from, to: e.to, style: e.style, label: e.label, tip: e.tip, points: e.points })),
    ignores,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MESURE — sur la géométrie calculée, ou sur le SVG rendu.
// ─────────────────────────────────────────────────────────────────────────────
const segmentsDe = (pts) => pts.slice(1).map((p, i) => [pts[i], p]);
/** Un segment (horizontal, vertical ou quelconque) coupe-t-il l'INTÉRIEUR d'un rectangle ? (bord touché : non) */
function coupe(seg, r) {
  const [[xa, ya], [xb, yb]] = seg;
  if (xa === xb || ya === yb) return Math.max(xa, xb) > r.x1 && Math.min(xa, xb) < r.x2 && Math.max(ya, yb) > r.y1 && Math.min(ya, yb) < r.y2;
  // segment oblique (géométrie tierce) : échantillonnage fin, suffisant pour une mesure de rendu
  for (let s = 1; s < 50; s++) {
    const x = xa + (xb - xa) * s / 50, y = ya + (yb - ya) * s / 50;
    if (x > r.x1 && x < r.x2 && y > r.y1 && y < r.y2) return true;
  }
  return false;
}
function colineaires(s, t) {
  const [[a1, b1], [a2, b2]] = s, [[c1, d1], [c2, d2]] = t;
  if (a1 === a2 && c1 === c2 && Math.abs(a1 - c1) < 3) return Math.min(Math.max(b1, b2), Math.max(d1, d2)) - Math.max(Math.min(b1, b2), Math.min(d1, d2)) > 2;
  if (b1 === b2 && d1 === d2 && Math.abs(b1 - d1) < 3) return Math.min(Math.max(a1, a2), Math.max(c1, c2)) - Math.max(Math.min(a1, a2), Math.min(c1, c2)) > 2;
  return false;
}

/** { traversees: [{ arete, noeud }], confondues: [{ a, b }] } — `arete`, `a`, `b` : index de la flèche. */
export function mesurerRoutage({ noeuds, aretes }) {
  const traversees = [], confondues = [];
  for (const e of aretes) {
    const segs = segmentsDe(e.points ?? []);
    for (const n of noeuds) {
      if (n.id === e.de || n.id === e.vers) continue;
      if (segs.some((s) => coupe(s, n))) traversees.push({ arete: e.i, de: e.de, vers: e.vers, noeud: n.id });
    }
  }
  for (let i = 0; i < aretes.length; i++) {
    for (let j = i + 1; j < aretes.length; j++) {
      const si = segmentsDe(aretes[i].points ?? []), sj = segmentsDe(aretes[j].points ?? []);
      if (si.some((s) => sj.some((t) => colineaires(s, t)))) confondues.push({ a: aretes[i].i, b: aretes[j].i });
    }
  }
  return { traversees, confondues };
}

/** Relit un SVG rendu : nœuds (`g` d'id `arch-n-…` et leur `rect`) et flèches (`polyline` avec `data-de`, `data-vers`). */
export function lireSchemaSvg(svg) {
  const decode = (v) => String(v).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
  const attrs = (balise) => Object.fromEntries([...balise.matchAll(/([\w:-]+)="([^"]*)"/g)].map((m) => [m[1], decode(m[2])]));
  const noeuds = [];
  for (const m of String(svg).matchAll(/<g\b[^>]*\bid="arch-n-([^"]+)"[^>]*>[\s\S]*?<rect\b([^>]*)\/?>/g)) {
    const a = attrs(m[2]);
    const x = Number(a.x), y = Number(a.y), w = Number(a.width), h = Number(a.height);
    if ([x, y, w, h].every(Number.isFinite)) noeuds.push({ id: m[1], x1: x, y1: y, x2: x + w, y2: y + h });
  }
  const aretes = [];
  [...String(svg).matchAll(/<polyline\b([^>]*)>/g)].forEach((m, i) => {
    const a = attrs(m[1]);
    if (a['data-de'] === undefined || a['data-vers'] === undefined) return;
    const points = String(a.points ?? '').trim().split(/\s+/).filter(Boolean).map((p) => p.split(',').map(Number));
    aretes.push({ i, de: idSur(a['data-de']), vers: idSur(a['data-vers']), points });
  });
  return { noeuds, aretes };
}

/** Mesure du routage sur le SVG rendu (porte de conformité de la forme). */
export function mesurerRoutageSvg(svg) {
  const g = lireSchemaSvg(svg);
  return { ...mesurerRoutage(g), noeuds: g.noeuds.length, fleches: g.aretes.length };
}

// ─────────────────────────────────────────────────────────────────────────────
// RENDU SVG.
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Le schéma, en SVG autonome. Classes partagées avec la feuille `SCHEMA_CSS` (palette `--c-*` dérivée des jetons du
 * tenant, TF-2139). Chaque flèche déclare, en PAIRE, les éléments dont sa boîte englobante recouvre la boîte sans que
 * son tracé les touche (`data-overlap-ok`, socle digit-ai-page-html, TF-1146) : une boîte de flèche coudée recouvre des
 * nœuds qu'elle ne traverse pas. Une flèche qui traverse vraiment un nœud n'est PAS déclarée.
 */
export function renderSchemaArchitecture(arch, { ariaLabel = "Schéma d'architecture", desc = '', libelleAutres = 'Autres' } = {}) {
  if (!(arch?.nodes ?? []).length) return '';
  const s = calculerSchema(arch, { libelleAutres });
  const titres = s.bandes.map((b) => {
    const y0 = b.y + 14;
    return `<text class="erd-band" id="arch-b-${idSur(b.key)}" x="${s.xTitre}" y="${y0}">`
      + b.titre.map((l, i) => `<tspan x="${s.xTitre}" dy="${i ? 13 : 0}">${esc(l)}</tspan>`).join('') + '</text>';
  }).join('');
  const boite = (pts) => ({ x1: Math.min(...pts.map((p) => p[0])), y1: Math.min(...pts.map((p) => p[1])), x2: Math.max(...pts.map((p) => p[0])), y2: Math.max(...pts.map((p) => p[1])) });
  const recouvre = (a, b) => Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1) > 0 && Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1) > 0;
  const obstacles = s.noeuds.map((n) => ({ id: `arch-n-${idSur(n.id)}`, noeud: n.id, x1: n.x, y1: n.y, x2: n.x + n.w, y2: n.y + n.h }))
    .concat(s.bandes.map((b) => ({ id: `arch-b-${idSur(b.key)}`, noeud: null, x1: s.xTitre, y1: b.y + 2, x2: s.xTitre + GOUTTIERE, y2: b.y + 14 + b.titre.length * 13 })));
  const fleches = s.aretes.map((e) => ({ e, id: `arch-e-${e.i}`, boite: boite(e.points), segs: segmentsDe(e.points) }));
  for (const f of fleches) {
    const extremite = (o) => o.noeud !== null && (o.noeud === f.e.from || o.noeud === f.e.to);
    f.ok = obstacles.filter((o) => recouvre(f.boite, o) && (extremite(o) || !f.segs.some((sg) => coupe(sg, o)))).map((o) => o.id)
      .concat(fleches.filter((g) => g !== f && recouvre(f.boite, g.boite) && !f.segs.some((sg) => g.segs.some((t) => colineaires(sg, t)))).map((g) => g.id));
  }
  const tip = (t) => (t ? ` data-tip="${esc(t)}"` : '');
  const flechesSvg = fleches.map((f) => {
    const { e } = f;
    const cls = `a-e${e.style === 'dashed' ? ' dashed' : ''}${e.style === 'coral' ? ' coral' : ''}`;
    const titre = e.label || e.tip || `${e.from} → ${e.to}`;
    return `<polyline id="${f.id}" class="${cls}" data-de="${esc(e.from)}" data-vers="${esc(e.to)}" points="${e.points.map((p) => p.join(',')).join(' ')}"`
      + ` marker-end="url(#${e.style === 'coral' ? 'aArrCoral' : 'aArr'})"${tip(e.tip || e.label)}${f.ok.length ? ` data-overlap-ok="${f.ok.join(' ')}"` : ''}><title>${esc(titre)}</title></polyline>`;
  }).join('');
  const noeudsSvg = s.noeuds.map((n) => {
    const l = n.lignes;
    const total = l.label.length * 15 + l.sub.length * 13 + l.meta.length * 13;
    let yy = n.cy - total / 2 + 11;
    const lignes = [];
    for (const t of l.label) { lignes.push(`<text x="${n.cx}" y="${arrondi(yy)}" text-anchor="middle" class="a-t">${esc(t)}</text>`); yy += 15; }
    for (const t of l.sub) { lignes.push(`<text x="${n.cx}" y="${arrondi(yy - 1)}" text-anchor="middle" class="a-s">${esc(t)}</text>`); yy += 13; }
    for (const t of l.meta) { lignes.push(`<text x="${n.cx}" y="${arrondi(yy - 1)}" text-anchor="middle" class="a-m">${esc(t)}</text>`); yy += 13; }
    const titre = [n.label, n.sub, n.meta].filter(Boolean).join(' — ');
    return `<g class="a-${n.style}" id="arch-n-${idSur(n.id)}"${tip(n.tip || [n.label, n.sub, n.meta].filter(Boolean).join(' | '))}><title>${esc(titre)}</title>`
      + `<rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="8"/>${lignes.join('')}</g>`;
  }).join('');
  return `<svg viewBox="0 0 ${s.largeur} ${s.hauteur}" xmlns="http://www.w3.org/2000/svg" class="schema-archi" role="img" aria-label="${esc(ariaLabel)}">`
    + (desc ? `<desc>${esc(desc)}</desc>` : '')
    + '<defs><marker id="aArr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="a-marker"/></marker>'
    + '<marker id="aArrCoral" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0,0 L10,5 L0,10 z" class="a-marker coral"/></marker></defs>'
    + titres + flechesSvg + noeudsSvg + '</svg>';
}

/**
 * Feuille de style du schéma : la palette `--c-<famille>-*` vient des jetons DÉRIVÉS du tenant (`TOKENS_DERIVES_CSS`,
 * TF-2139) ; le fond d'une boîte est un FOND (`fill` du `rect`) et son libellé sa couleur de texte, une paire de la même
 * famille (retour du 24/09/2026 : la mise au socle avait pris le `fill` d'une forme pour une couleur de texte).
 */
export const SCHEMA_CSS = `${TOKENS_DERIVES_CSS}
.schema-archi{min-width:900px}
.erd-band{font-size:10px;font-weight:700;letter-spacing:.08em;fill:var(--muted);text-transform:uppercase}
.a-t{font-weight:700;font-size:12px}.a-s{font-size:10.5px}.a-m{font-size:10px;font-family:var(--font-mono)}
${STYLES.map((f) => `.a-${f} rect{fill:var(--c-${f}-bg);stroke:var(--c-${f}-stroke);stroke-width:1.5}.a-${f} text{fill:var(--c-${f}-fg)}`).join('\n')}
.a-e{fill:none;stroke:var(--muted);stroke-width:1.5}.a-e.dashed{stroke-dasharray:5 3;stroke:color-mix(in srgb,var(--muted) 60%,var(--panel))}.a-e.coral{stroke:var(--fatal)}
.a-marker{fill:var(--muted)}.a-marker.coral{fill:var(--fatal)}`;
