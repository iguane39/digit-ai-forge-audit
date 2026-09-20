// AuditCore — asset VENDORÉ : canevas « modèle de données » du skill digit-ai-schemas
// (digit-ai-forge-agents · .claude/skills/digit-ai-schemas/assets/template-modele-donnees.html).
//
// TF-0940, décision humaine D-4 (b) du 20/09/2026. DEUX moteurs de schéma de base de données
// coexistaient : celui-ci, qui FAIT FOI (cartes HTML + calque SVG, badges PK/UK/FK/NN, arêtes
// ancrées colonne à colonne, mise à l'échelle), et le `renderERD` en SVG pur de rapport-engine,
// plus pauvre, qui se déclarait lui-même « non faisant foi » depuis ae3dfd8. Le rapport d'audit
// consomme désormais celui-ci.
//
// Copie figée, comme tools/table-filters.mjs : le rapport d'audit est un livrable autonome et les
// scripts du dépôt restent autoportants — AUCUN import d'un dépôt frère à l'exécution.
// NE PAS ÉDITER ICI : toute correction remonte au canevas amont, puis on re-vendore et on met à
// jour HERITAGE.json. La dérive copie↔source est mesurée par `node tools/verifier-heritage.mjs`,
// qui compare quand le dépôt frère est présent sur le poste et se déclare SKIP nommé sinon.
//
// ── LES DEUX SEULS DELTAS DE LA COPIE (déclarés aussi dans HERITAGE.json) ────────────────────
// H1 · `CSSV` lit un jeton d'une table de ce module au lieu d'appeler `getComputedStyle`. Motif :
//      le canevas est une PAGE de navigateur, ce module rend le même balisage côté Node, à la
//      construction du rapport — il n'y a pas de document à interroger. La table des jetons et la
//      projection CSS ci-dessous sortent de la MÊME source (`JETONS`) : une source, deux
//      projections, comme le canevas le fait lui-même pour ses thèmes.
// H2 · `fitSchema` teste que son hôte sait faire `querySelector` avant de l'appeler. Motif : le
//      gate `tools/verifier-rapport-html.mjs` EXÉCUTE le moteur du rapport dans un DOM minimal
//      qui n'expose pas cette méthode. Sans ce test, le moteur lèverait à l'initialisation et le
//      rapport serait refusé — un garde d'hôte, jamais un assouplissement de contrôle.
//
// Le reste — `renderDbSchema`, `renderDbLegend`, la géométrie, les classes CSS — est recopié tel
// quel. Ce qui N'EST PAS repris, et pourquoi : `renderDbDictionary` du canevas rend des CARTES,
// là où le rapport d'audit doit un TABLEAU filtrable (règle RL-5 de son gate, au-delà de 8
// lignes). Le rapport garde donc son dictionnaire tabulaire et ne prend du canevas que le DESSIN
// et sa légende. `monterSchema` et l'infobulle de page ne sont pas repris non plus : le balisage
// est rendu à la construction, pas monté au chargement.

/**
 * Les jetons de couleur du canevas. UNE source, DEUX projections : le CSS embarqué dans le
 * rapport (`CANEVAS_CSS`) et la lecture côté Node (`CSSV`). Le thème du tenant ne les définit
 * pas — mesuré : `tools/build-theme.mjs` n'en émet aucun — donc le module les porte, ce que la
 * décision D-4 (b) autorise explicitement (« jetons ajoutés au thème OU repli porté par le
 * module »). Valeurs reprises du canevas amont.
 */
export const JETONS = {
  '--c-purple-bg': '#ede9fe', '--c-purple-fg': '#5b21b6', '--c-purple-stroke': '#c4b5fd',
  '--c-blue-bg': '#dbeafe', '--c-blue-fg': '#1d4ed8', '--c-blue-stroke': '#93c5fd',
  '--c-teal-bg': '#ccfbf1', '--c-teal-fg': '#0f766e', '--c-teal-stroke': '#5eead4',
  '--c-coral-bg': '#fee2e2', '--c-coral-fg': '#b91c1c', '--c-coral-stroke': '#fca5a5',
  '--c-amber-bg': '#fef3c7', '--c-amber-fg': '#92400e', '--c-amber-stroke': '#fcd34d',
  '--c-gray-bg': '#f1f3f7', '--c-gray-fg': '#374151', '--c-gray-stroke': '#cbd2dd',
};

/** Les styles de carte que le canevas SAIT rendre (une classe `.db-card.s-<style>` existe). */
export const STYLES_CANEVAS = ['gray', 'blue', 'coral', 'teal', 'dashed'];
/**
 * Le style par défaut quand la donnée d'audit n'en déclare pas. Il ne correspond à AUCUNE règle
 * `.db-card.s-*` : la carte est rendue sans liseré de couleur. C'est le point dur de la décision
 * D-4 (b) — « pas de teinte devinée » : une classification absente se voit absente, elle ne
 * s'invente pas en couleur.
 */
export const STYLE_NEUTRE = 'neutre';

// ── H1 · lecture d'un jeton, côté Node ───────────────────────────────────────
const CSSV = n => JETONS[n] ?? '';

// ── recopié du canevas ───────────────────────────────────────────────────────
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const DB_CLASS = { gray: 'Référentiel', blue: 'Interne', coral: 'Confidentiel · PII', teal: 'Pilotage', dashed: 'Externe (non contraint)' };

export function renderDbSchema(data) {
  const COLW = 252, ROW = 19, HEAD = 34, GAPY = 26, GAPX = 58, PADX = 30, TOP = 46;
  const bi = {}; data.bandes.forEach((b, i) => bi[b.id] = i);
  const colY = {}; data.bandes.forEach(b => colY[b.id] = TOP);
  const pos = {};
  data.tables.forEach(t => {
    const h = HEAD + t.columns.length * ROW;
    pos[t.id] = { x: PADX + bi[t.bande] * (COLW + GAPX), y: colY[t.bande], w: COLW, h, cols: t.columns, band: bi[t.bande] };
    colY[t.bande] += h + GAPY;
  });
  const bandBottom = i => { const b = data.bandes[i]; return colY[b.id] - GAPY; };
  const W = PADX * 2 + data.bandes.length * COLW + (data.bandes.length - 1) * GAPX;
  let H = Math.max(...Object.values(colY)) + PADX;

  // Ancrage : y de la ligne de la colonne nommée (fallback : milieu de l'en-tête)
  const rowY = (p, colName) => {
    const i = p.cols.findIndex(c => c.n === colName);
    return i >= 0 ? p.y + HEAD + i * ROW + ROW / 2 : p.y + HEAD / 2;
  };
  // Centre du couloir vertical situé APRÈS la bande i
  const corridor = i => PADX + (i + 1) * COLW + i * GAPX + GAPX / 2;

  const bandTitles = data.bandes.map((b, i) =>
    `<div class="db-bandtitle" style="left:${PADX + i * (COLW + GAPX)}px;width:${COLW}px"><span>${esc(b.title)}</span></div>`).join('');

  const cards = data.tables.map(t => {
    const p = pos[t.id];
    const rows = t.columns.map(c => {
      const badges = (c.k ? `<span class="dbf-badge b-${c.k.toLowerCase()}">${c.k}</span>` : '') + (c.nn ? `<span class="dbf-badge b-nn">NN</span>` : '');
      return `<div class="dbf-row"><span class="dbf-name${c.pii ? ' pii' : ''}">${c.pii ? '🔒 ' : ''}${esc(c.n)}</span><span class="dbf-type">${esc(c.t)}</span>${badges}</div>`;
    }).join('');
    const tip = t.tip || `${t.name} — ${t.role} | ${t.columns.length} colonnes | ${DB_CLASS[t.style] || 'Interne'}`;
    return `<div class="db-card s-${t.style}" style="left:${p.x}px;top:${p.y}px;width:${p.w}px" data-tip="${esc(tip)}"><div class="db-card-head">${esc(t.name)}<span class="db-role">${esc(t.role)}</span></div>${rows}</div>`;
  }).join('');

  const cFk = CSSV('--c-blue-fg') || '#1d4ed8', cLog = CSSV('--c-amber-fg') || '#92400e';
  const edges = data.relations.map(r => {
    const s = pos[r.from], t = pos[r.to]; if (!s || !t) return '';
    const sy = rowY(s, r.fromCol), ty = rowY(t, r.toCol);
    const col = r.enforced ? cFk : cLog, dash = r.enforced ? '' : 'stroke-dasharray="6 4"';
    const marker = r.enforced ? 'dbarrowFk' : 'dbarrowLog';
    const db = t.band - s.band;
    let d, lx, ly;
    if (db === 0) { // même bande : détour par la marge gauche
      const x0 = Math.max(s.x - 20, 8);
      d = `M ${s.x} ${sy} H ${x0} V ${ty} H ${t.x}`; lx = x0 + 4; ly = (sy + ty) / 2;
    } else if (Math.abs(db) === 1) { // bandes adjacentes : L via le couloir intermédiaire
      const sx = db > 0 ? s.x + s.w : s.x, ex = db > 0 ? t.x : t.x + t.w, mx = corridor(Math.min(s.band, t.band));
      d = `M ${sx} ${sy} H ${mx} V ${ty} H ${ex}`; lx = mx; ly = (sy + ty) / 2 - 5;
    } else { // saut de bande : couloirs + voie horizontale SOUS les cartes intermédiaires
      const lo = Math.min(s.band, t.band), hi = Math.max(s.band, t.band);
      let laneY = 0; for (let i = lo; i <= hi; i++) laneY = Math.max(laneY, bandBottom(i));
      laneY += 18; H = Math.max(H, laneY + PADX);
      const c1 = corridor(db > 0 ? s.band : s.band - 1), c2 = corridor(db > 0 ? t.band - 1 : t.band);
      const sx = db > 0 ? s.x + s.w : s.x, ex = db > 0 ? t.x : t.x + t.w;
      d = `M ${sx} ${sy} H ${c1} V ${laneY} H ${c2} V ${ty} H ${ex}`;
      lx = (c1 + c2) / 2; ly = laneY - 5;
    }
    const tip = esc(r.tip || `${r.from}.${r.fromCol} → ${r.to}.${r.toCol}`);
    /* DEUX ARETES QUI SE CROISENT NE SONT PAS UN DEFAUT DE MISE EN PAGE (TF-0941, 08/09/2026).
       Dans un graphe relationnel, deux liens peuvent devoir passer par le meme couloir : le
       croisement est une propriete du GRAPHE, pas du placement — aucune disposition ne
       l'evite en general. Le socle juge V4 sur les freres d'un meme parent, et il offre
       precisement `data-overlap-ok` pour ce cas. La declaration est posee sur les ARETES
       SEULES : les cartes, elles, ne doivent jamais se recouvrir, et V4 continue de le mesurer. */
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="1.6" ${dash} marker-end="url(#${marker})" data-overlap-ok data-tip="${tip}"></path>`
      + `<text x="${lx}" y="${ly}" class="db-card-rel" data-overlap-ok fill="${col}" text-anchor="${db === 0 ? 'start' : 'middle'}">${esc(r.card || '')}</text>`;
  }).join('');

  const mk = (id, c) => `<marker id="${id}" markerWidth="9" markerHeight="9" refX="8" refY="3" orient="auto"><path d="M0,0 L8,3 L0,6 Z" fill="${c}"></path></marker>`;
  return `<div class="db-schema" style="width:${W}px;height:${H}px">`
    + `<svg class="db-edges" width="${W}" height="${H}" role="img" aria-label="Schéma relationnel : ${esc(data.engine)}">`
    + `<defs>${mk('dbarrowFk', cFk)}${mk('dbarrowLog', cLog)}</defs>${edges}</svg>`
    + `${bandTitles}${cards}</div>`;
}

export function renderDbLegend() {
  const sw = c => `<span class="sw" style="background:${CSSV(c)}"></span>`;
  const line = (dash, c) => `<svg width="34" height="10" role="img" aria-label="exemple de trait"><line x1="1" y1="5" x2="33" y2="5" stroke="${CSSV(c)}" stroke-width="2" ${dash ? 'stroke-dasharray="6 4"' : ''}/></svg>`;
  return `<div class="db-legend">`
    + `<span class="lg">${sw('--c-gray-fg')}Référentiel</span>`
    + `<span class="lg">${sw('--c-blue-fg')}Transactionnel</span>`
    + `<span class="lg">${sw('--c-coral-fg')}🔒 Contient des données personnelles</span>`
    + `<span class="lg"><span class="sw" style="border:1px dashed var(--c-gray-stroke);background:var(--bg)"></span>Table externe / autre schéma</span>`
    + `<span class="lg">${line(false, '--c-blue-fg')}FK contrainte</span>`
    + `<span class="lg">${line(true, '--c-amber-fg')}Référence logique (pas de FK)</span>`
    + `</div>`;
}

// ── ADAPTATEUR — contrat de données du rapport → données du canevas ──────────
// Décision D-4 (b), volet A : `db_schema` est ÉTENDU de `role`, `style`, `card`, `tip`, tous
// FACULTATIFS. Un audit qui ne les renseigne pas reste RENDABLE, et la valeur de repli est
// DÉCLARÉE, jamais devinée — c'est la règle dure de la décision.
//
// Ce qui se dérive sans rien inventer :
//   • `from`/`to` du rapport valent « table.colonne » : le canevas veut la table et la colonne
//     séparées, elles en sortent par découpage — aucune donnée nouvelle n'est requise ;
//   • `label` de relation existait dans le contrat et n'était lu par AUCUN moteur (le `renderERD`
//     remplacé l'ignorait) : il alimente désormais l'infobulle, plutôt que de rester mort.
// Ce qui se DÉCLARE absent quand il l'est : le style (carte sans liseré), le rôle, la
// cardinalité, le moteur — chacun avec une mention explicite dans l'infobulle ou le nom
// accessible. Une mention « non renseigné » est une information ; une teinte devinée est un
// mensonge.
export function adapterDbSchema(db) {
  const bandes = (db.bandes?.length ? db.bandes : [{ key: '_', label: '' }])
    .map(b => ({ id: b.key, title: b.label ?? '' }));
  const tables = (db.tables ?? []).map(t => {
    const name = t.label ?? t.id;
    const role = t.role ?? '';
    const style = STYLES_CANEVAS.includes(t.style) ? t.style : STYLE_NEUTRE;
    const columns = (t.columns ?? []).map(c => ({ ...c, t: c.t ?? '' }));
    const tip = t.tip ?? [
      `${name}${role ? ` — ${role}` : ' — rôle non renseigné'}`,
      `${columns.length} colonne(s)`,
      style === STYLE_NEUTRE ? 'classification non renseignée' : DB_CLASS[style],
      ...(t.note ? [t.note] : []),
    ].join(' | ');
    return { id: t.id, bande: t.bande ?? '_', name, role, style, tip, columns };
  });
  const coupe = (ref) => {
    const s = String(ref ?? '');
    const i = s.indexOf('.');
    return i < 0 ? { table: s, col: '' } : { table: s.slice(0, i), col: s.slice(i + 1) };
  };
  const relations = (db.relations ?? []).map(r => {
    const a = coupe(r.from), b = coupe(r.to);
    return {
      from: a.table, fromCol: a.col, to: b.table, toCol: b.col,
      card: r.card ?? '', enforced: r.enforced !== false,
      tip: r.tip ?? [
        r.label || null,
        `${r.from} → ${r.to}`,
        r.enforced === false ? 'référence logique (pas de clé étrangère)' : 'clé étrangère appliquée',
        r.card ? `cardinalité ${r.card}` : 'cardinalité non renseignée',
      ].filter(Boolean).join(' | '),
    };
  });
  return { engine: db.engine ?? 'moteur non renseigné', bandes, tables, relations };
}

// ── CSS du canevas, recopié ──────────────────────────────────────────────────
// Les jetons sont émis depuis `JETONS` (H1 : une source, deux projections). Le canevas porte
// aussi une projection sombre ; le rapport d'audit n'a AUCUN thème sombre — mesuré :
// `data-theme` et `prefers-color-scheme` sont absents de rapport-engine et de build-theme — elle
// n'est donc pas reprise, et ce silence est un constat, pas un oubli.
export const CANEVAS_CSS = `
/* Canevas « modèle de données » vendoré (TF-0940) — voir HERITAGE.json. */
.db-schema-hote { ${Object.entries(JETONS).map(([k, v]) => `${k}:${v};`).join(' ')} }
#dbSchemaMount { overflow:hidden; }
.db-scaler { transform-origin:top left; }
.db-schema { position:relative; }
.db-edges { position:absolute; left:0; top:0; pointer-events:none; }
.db-edges path[data-tip] { pointer-events:stroke; cursor:help; }
.db-bandtitle { position:absolute; top:6px; display:flex; justify-content:center; }
.db-bandtitle span { background:var(--bg,#fff); border:1px solid var(--line,#d8dbe2); border-radius:999px; padding:4px 16px;
  font-weight:700; font-size:11px; letter-spacing:.08em; text-transform:uppercase; white-space:nowrap; }
.db-card { position:absolute; background:var(--bg,#fff); border:1px solid var(--line,#d8dbe2); border-radius:8px;
  box-shadow:0 1px 3px rgba(0,0,0,.06); font-size:12px; overflow:hidden; cursor:help; }
.db-card.s-gray  { border-top:3px solid var(--c-gray-fg); }
.db-card.s-blue  { border-top:3px solid var(--c-blue-fg); }
.db-card.s-coral { border-top:3px solid var(--c-coral-fg); }
.db-card.s-teal  { border-top:3px solid var(--c-teal-fg); }
.db-card.s-dashed { border:1px dashed var(--c-gray-stroke); background:var(--bg-soft,#f7f8fa); }
.db-card-head { font-weight:600; font-size:12px; padding:8px 12px;
  border-bottom:1px solid var(--line-soft,#eceef2); display:flex; justify-content:space-between; align-items:baseline; gap:8px; }
.db-role { font-weight:400; font-size:10px; text-align:right; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:48%; flex:0 1 auto; }
.dbf-row { display:flex; align-items:center; gap:8px; padding:0 12px; height:19px; border-bottom:1px solid var(--line-soft,#eceef2); }
.dbf-row:last-child { border-bottom:none; }
.dbf-name { white-space:nowrap; overflow:hidden; text-overflow:ellipsis; font-size:11px; }
.dbf-name.pii { color:var(--c-coral-fg); font-weight:700; }
.dbf-type { margin-left:auto; font-size:10px; white-space:nowrap; }
.dbf-badge { font-size:9px; padding:0 4px; border-radius:3px; font-weight:700; line-height:1.6; }
.b-pk { background:#1a1a1a; color:#fff; }
.b-uk { background:var(--c-purple-fg); color:#fff; }
.b-fk { background:var(--c-blue-fg); color:#fff; }
.b-nn { background:var(--line-soft,#eceef2); }
.db-card-rel { font-size:9.5px; font-weight:600; paint-order:stroke; stroke:var(--bg-soft,#f7f8fa); stroke-width:3px; }
.db-legend { display:flex; flex-wrap:wrap; gap:12px 20px; margin-top:16px; font-size:13px; }
.db-legend .lg { display:flex; align-items:center; gap:8px; }
.db-legend .sw { width:14px; height:14px; border-radius:3px; display:inline-block; }
.db-legend svg { display:inline-block; vertical-align:middle; }
@media print { .db-scaler { transform:none !important; margin-left:0 !important; } }
`;

// ── H2 · la mise à l'échelle, seule part qui a besoin d'un navigateur ────────
// Recopiée du canevas, enveloppée pour ne rien déclarer au global du rapport (le moteur du
// rapport a déjà ses propres `esc`/`CSSV`), et gardée contre un hôte sans `querySelector` :
// le gate du rapport EXÉCUTE ce moteur dans un DOM minimal qui n'en a pas.
export const CANEVAS_FIT_JS = String.raw`
/* Canevas « modèle de données » vendoré (TF-0940) — mise à l'échelle. Voir HERITAGE.json. */
(function () {
  'use strict';
  function fitSchema(forceWidth, mountId) {
    var mount = document.getElementById(mountId || 'dbSchemaMount');
    if (!mount || typeof mount.querySelector !== 'function') return;   /* H2 : hôte sans DOM complet */
    var scaler = mount.querySelector('.db-scaler');
    if (!scaler) return;
    var inner = scaler.querySelector && scaler.querySelector('.db-schema');
    if (!inner) return;
    var W = parseFloat(inner.style.width), H = parseFloat(inner.style.height);
    if (!W || !H) return;
    var avail = forceWidth || mount.clientWidth || W;
    var sc = Math.min(1, avail / W);
    scaler.style.width = W + 'px';
    scaler.style.transform = 'scale(' + sc + ')';
    scaler.style.marginLeft = Math.max(0, (avail - W * sc) / 2) + 'px';
    mount.style.height = (H * sc) + 'px';
  }
  fitSchema();
  window.addEventListener('resize', function () { fitSchema(); });
  window.addEventListener('beforeprint', function () { fitSchema(700); });
  window.addEventListener('afterprint', function () { fitSchema(); });
})();
`;
