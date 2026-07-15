#!/usr/bin/env node
// AuditCore — génère theme.css + header.html depuis la config tenant (PADR-0004 : thème unique).
// Priorité couleurs : DESIGN.md (charte forge) > branding.colors inline.
// Usage: node tools/build-theme.mjs <tenant.yaml> [--out <dir>]
import fs from 'node:fs';
import path from 'node:path';
import { loadTenant, frontmatter } from './lib.mjs';

const file = process.argv[2];
if (!file) { console.error('Usage: node tools/build-theme.mjs <tenant.yaml> [--out <dir>]'); process.exit(2); }
const outIdx = process.argv.indexOf('--out');
const { cfg, tenantDir, resolveRef } = loadTenant(file);
const outDir = outIdx > -1 ? path.resolve(process.argv[outIdx + 1]) : path.join(tenantDir, 'theme');

let colors = { ...(cfg.branding?.colors ?? {}) };
let typography = { ...(cfg.branding?.typography ?? {}) };
if (cfg.branding?.design_md) {
  const dm = resolveRef(cfg.branding.design_md);
  if (fs.existsSync(dm)) {
    const fm = frontmatter(dm) ?? {};
    colors = { accent: fm.colors?.primary, ink: fm.colors?.ink, ...colors, ...(fm.colors ?? {}) };
    typography = { ...typography, ...(fm.typography ?? {}) };
  }
}
const c = (k, d) => colors[k] ?? d;
const domains = cfg.domains ?? [];

const css = `/* AuditCore theme — généré pour ${cfg.tenant.name} (ne pas éditer à la main, PADR-0004) */
:root{
  --bg:${c('panel-bg', c('background', '#f4f6f9'))}; --panel:#fff; --line:#dce3ec;
  --txt:${c('ink', '#1b2733')}; --muted:#5f7081;
  --accent:${c('accent', c('primary', '#2563eb'))};
  --fatal:${c('fatal', '#a3231c')}; --bloq:${c('bloquant', '#9a4a06')};
  --maj:${c('majeur', '#8a6500')}; --std:${c('standard', '#136e34')};
${domains.map(d => `  --dom-${d.key}:${d.color ?? 'var(--accent)'};`).join('\n')}
  --font-body:${typography.body ?? typography.heading ?? 'Roboto, system-ui, sans-serif'};
  --font-mono:${typography.mono ?? 'JetBrains Mono, Consolas, monospace'};
}
body{font-family:var(--font-body);color:var(--txt);background:var(--bg);}
code,pre{font-family:var(--font-mono);}
.brand{background:${c('brand-bg', '#1A1A1A')};color:#fff;font-weight:700;border-radius:6px;
  display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;}
.badge-fatal{color:var(--fatal)}.badge-bloq{color:var(--bloq)}.badge-maj{color:var(--maj)}.badge-std{color:var(--std)}
`;

const header = `<!-- AuditCore header — généré pour ${cfg.tenant.name} -->
<header class="ac-header">
  <span class="brand">${cfg.tenant.short_code}</span>
  <span class="ac-title">${cfg.tenant.name} — {{document.titre}}</span>
  <span class="ac-meta">core {{core_version}} · {{date}}{{indice}}</span>
</header>
`;

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'theme.css'), css, 'utf-8');
fs.writeFileSync(path.join(outDir, 'header.html'), header, 'utf-8');
console.log(`✔ thème généré → ${outDir} (theme.css ${css.length} o, header.html) — ${domains.length} couleurs de domaines`);
