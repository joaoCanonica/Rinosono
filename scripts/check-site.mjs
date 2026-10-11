#!/usr/bin/env node
// Verificação do site estático (Node 18+, sem dependências).
// Uso, na raiz do repositório: node scripts/check-site.mjs
// O teste de contraste usa Playwright se estiver instalado (npx/global); sem ele, é pulado com aviso.
// Sai com código 1 se algum item falhar.
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const pages = fs.readdirSync(ROOT).filter(f => f.endsWith('.html')).sort();
const errors = [], warnings = [];
const fail = (f, m) => errors.push(`${f}: ${m}`);
const warn = (f, m) => warnings.push(`${f}: ${m}`);
const decode = s => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const text = s => decode(s.replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const meta = (h, attr, name) => {
  const m = h.match(new RegExp(`<meta\\s+${attr}="${name.replace(/[:.]/g, '\\$&')}"\\s+content="([^"]*)"`, 'i'));
  return m ? decode(m[1]) : null;
};

const sitemap = read('sitemap.xml');
const ORIGIN = (sitemap.match(/<loc>(https?:\/\/[^/<]+)\//) || [])[1];
if (!ORIGIN) fail('sitemap.xml', 'origem não encontrada');
const robotsTxt = read('robots.txt');
const vercel = read('vercel.json');
const html = Object.fromEntries(pages.map(p => [p, read(p)]));
const robotsMeta = Object.fromEntries(pages.map(p => [p, meta(html[p], 'name', 'robots') || '']));
// Modo revisão: todas as páginas com o mesmo "noindex,nofollow". Páginas excluídas de verdade (404) usam outro valor.
const reviewValue = 'noindex,nofollow';
const reviewMode = Object.values(robotsMeta).some(v => v === reviewValue);
const excluded = pages.filter(p => /noindex/.test(robotsMeta[p]) && robotsMeta[p] !== reviewValue);
const indexable = pages.filter(p => !excluded.includes(p));
const pageUrl = p => (p === 'index.html' ? `${ORIGIN}/` : `${ORIGIN}/${p}`);

// ---------- head, títulos, imagens, ids, links
const descriptions = new Map();
const ids = {};
for (const p of pages) {
  const h = html[p];
  ids[p] = new Set([...h.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]));
  const all = [...h.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  const dup = all.filter((x, i) => all.indexOf(x) !== i);
  if (dup.length) fail(p, `id duplicado: ${[...new Set(dup)].join(', ')}`);
}
for (const p of pages) {
  const h = html[p];
  const title = text((h.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
  const desc = meta(h, 'name', 'description');
  if (!title) fail(p, 'sem <title>'); else if (title.length > 60) fail(p, `title com ${title.length} caracteres (máx. 60)`);
  if (!desc) fail(p, 'sem meta description');
  else {
    if (desc.length > 155) fail(p, `description com ${desc.length} caracteres (máx. 155)`);
    if (descriptions.has(desc)) fail(p, `description repetida de ${descriptions.get(desc)}`);
    descriptions.set(desc, p);
  }
  if (!excluded.includes(p)) {
    const canon = (h.match(/<link rel="canonical" href="([^"]+)">/) || [])[1];
    if (!canon) fail(p, 'sem canonical');
    else if (canon !== pageUrl(p)) fail(p, `canonical ${canon} deveria ser ${pageUrl(p)}`);
  }
  for (const k of ['og:type', 'og:locale', 'og:site_name', 'og:title', 'og:description', 'og:url', 'og:image', 'og:image:width', 'og:image:height', 'og:image:alt', 'og:image:type'])
    if (!meta(h, 'property', k)) fail(p, `sem ${k}`);
  if (meta(h, 'property', 'og:title') !== title) fail(p, 'og:title diferente do title');
  if (meta(h, 'property', 'og:description') !== desc) fail(p, 'og:description diferente da description');
  if (!(meta(h, 'property', 'og:image') || '').startsWith('https://')) fail(p, 'og:image não é absoluta');
  if (meta(h, 'name', 'twitter:card') !== 'summary_large_image') fail(p, 'twitter:card deve ser summary_large_image');
  for (const k of ['twitter:title', 'twitter:description', 'twitter:image']) if (!meta(h, 'name', k)) fail(p, `sem ${k}`);

  const body = h.slice(h.indexOf('<body'));
  const h1 = (body.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) fail(p, `${h1} elementos <h1> (deve haver 1)`);
  for (const m of body.matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/g)) {
    if (/<br\s*\/?>/i.test(m[2])) fail(p, `<br> dentro de <${m[1]}>: "${text(m[2])}"`);
    if (!text(m[2])) fail(p, `<${m[1]}> vazio`);
  }
  for (const m of body.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) fail(p, `<img> sem alt: ${m[0].slice(0, 80)}`);
  if (/\sstyle="/.test(h)) fail(p, 'atributo style="" inline');
  for (const m of body.matchAll(/\shref="([^"]+)"/g)) {
    const href = decode(m[1]);
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    const [file, hash] = href.split('#');
    const target = file ? file.replace(/^\//, '') : p;
    if (target && !fs.existsSync(path.join(ROOT, target))) { fail(p, `link quebrado: ${href}`); continue; }
    if (hash && target.endsWith('.html') && !ids[target]?.has(hash)) fail(p, `âncora inexistente: ${href}`);
  }
  for (const m of body.matchAll(/\ssrc="([^"]+)"/g)) {
    if (/^https?:/.test(m[1])) continue;
    if (!fs.existsSync(path.join(ROOT, m[1].replace(/^\//, '')))) fail(p, `arquivo inexistente: ${m[1]}`);
  }
  // Origem única
  for (const m of h.matchAll(/https?:\/\/[^\s"'<>]*rinosono[^\s"'<>/]*\.(?:app|com|br|net)[^\s"'<>]*/gi))
    if (!m[0].startsWith(ORIGIN) && !/instagram\.com/.test(m[0])) fail(p, `origem diferente de ${ORIGIN}: ${m[0]}`);
}

// ---------- dados estruturados
let faqPages = [];
for (const p of pages) {
  const blocks = [...html[p].matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  if (!blocks.length) { if (!excluded.includes(p)) fail(p, 'sem JSON-LD'); continue; }
  const nodes = [];
  for (const b of blocks) {
    let data;
    try { data = JSON.parse(b[1]); } catch (e) { fail(p, `JSON-LD inválido: ${e.message}`); continue; }
    nodes.push(...(data['@graph'] || [data]));
  }
  const defined = new Set(), refs = [];
  const forbidden = ['Review', 'AggregateRating', 'Offer'];
  const walk = (o, key = '') => {
    if (Array.isArray(o)) return o.forEach(x => walk(x, key));
    if (o && typeof o === 'object') {
      const keys = Object.keys(o);
      if (o['@id'] && keys.length === 1) refs.push(o['@id']);
      else if (o['@id']) defined.add(o['@id']);
      const types = [].concat(o['@type'] || []);
      for (const t of types) if (forbidden.includes(t)) fail(p, `tipo proibido no schema: ${t}`);
      for (const k of ['priceRange', 'geo', 'acceptsInsurance', 'aggregateRating', 'review']) if (k in o) fail(p, `propriedade proibida no schema: ${k}`);
      for (const [k, v] of Object.entries(o)) walk(v, k);
      return;
    }
    if (typeof o === 'string' && ['@id', 'url', 'image', 'logo', 'thumbnailUrl', 'contentUrl', 'item', 'hasMap', 'sameAs'].includes(key)) {
      if (!/^https:\/\//.test(o)) fail(p, `URL relativa no schema (${key}): ${o}`);
      else if (!o.startsWith(ORIGIN) && !['sameAs', 'hasMap'].includes(key)) fail(p, `URL fora da origem no schema (${key}): ${o}`);
    }
  };
  walk(nodes);
  for (const r of refs) if (!defined.has(r)) fail(p, `@id referenciado e não definido: ${r}`);
  const faq = nodes.find(n => [].concat(n['@type']).includes('FAQPage'));
  if (faq) {
    faqPages.push(p);
    const visible = [...html[p].matchAll(/<details><summary>([\s\S]*?)<\/summary><p>([\s\S]*?)<\/p><\/details>/g)]
      .filter(m => html[p].lastIndexOf('class="wrap faq"', m.index) !== -1)
      .map(m => [text(m[1]), text(m[2])]);
    const schema = faq.mainEntity.map(q => [q.name, q.acceptedAnswer.text]);
    if (JSON.stringify(visible) !== JSON.stringify(schema)) fail(p, 'FAQPage do schema difere do FAQ visível');
  }
}
if (faqPages.length > 1) fail('schema', `FAQPage em mais de uma página: ${faqPages.join(', ')}`);
// Perguntas repetidas entre páginas
const seenQ = new Map();
for (const p of pages) for (const m of html[p].matchAll(/class="wrap faq"[\s\S]*?<\/section>/g))
  for (const q of m[0].matchAll(/<summary>([\s\S]*?)<\/summary>/g)) {
    const t = text(q[1]);
    if (seenQ.has(t)) fail(p, `pergunta repetida em ${seenQ.get(t)}: ${t}`); else seenQ.set(t, p);
  }

// ---------- sitemap e robots
const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]).sort();
const expected = indexable.map(pageUrl).sort();
if (JSON.stringify(locs) !== JSON.stringify(expected)) fail('sitemap.xml', `lista ${locs.join(' ')}; esperado ${expected.join(' ')}`);
for (const l of locs) if (!l.startsWith(ORIGIN)) fail('sitemap.xml', `origem diferente: ${l}`);
const robotsDisallowAll = /^\s*Disallow:\s*\/\s*$/m.test(robotsTxt);
if (reviewMode) {
  warn('robots', 'modo revisão: páginas com noindex,nofollow e robots.txt bloqueando. O commit go-live libera a indexação.');
} else {
  if (robotsDisallowAll) fail('robots.txt', 'bloqueia todos os crawlers, mas as páginas estão liberadas para indexação');
  for (const bot of ['GPTBot', 'Google-Extended', 'PerplexityBot', 'ClaudeBot', 'CCBot'])
    if (new RegExp(`User-agent:\\s*${bot}[\\s\\S]*?Disallow:\\s*/`, 'i').test(robotsTxt)) fail('robots.txt', `bloqueia ${bot}`);
  if (/X-Robots-Tag/i.test(vercel)) fail('vercel.json', 'X-Robots-Tag ainda presente com páginas indexáveis');
  if (!robotsTxt.includes(`Sitemap: ${ORIGIN}/sitemap.xml`)) fail('robots.txt', 'sem a linha Sitemap com a origem atual');
}
for (const f of ['robots.txt', 'site.webmanifest'])
  for (const m of read(f).matchAll(/https?:\/\/[^\s"]+/g)) if (!m[0].startsWith(ORIGIN)) fail(f, `origem diferente: ${m[0]}`);

// ---------- blocos compartilhados idênticos
const block = (h, name) => {
  const m = h.match(new RegExp(`<!-- ${name}:inicio -->([\\s\\S]*?)<!-- ${name}:fim -->`));
  return m ? m[1].replace(/ aria-current="page"/g, '') : null;
};
for (const name of ['cabecalho', 'rodape']) {
  const ref = block(html['index.html'], name);
  for (const p of pages) {
    const b = block(html[p], name);
    if (b === null) fail(p, `marcadores <!-- ${name} --> ausentes`);
    else if (b !== ref) fail(p, `${name === 'cabecalho' ? 'cabeçalho/menu' : 'rodapé'} difere de index.html`);
  }
}
for (const p of pages) {
  const cur = [...(block(html[p], 'cabecalho') !== null ? html[p].match(/<!-- cabecalho:inicio -->[\s\S]*?<!-- cabecalho:fim -->/)[0].matchAll(/href="([^"]+)" aria-current="page"/g) : [])].map(m => m[1]);
  const own = cur.every(h => h === p) && (p === 'index.html' || NAVPAGES().includes(p) ? cur.length === 2 : cur.length === 0);
  if (!own) fail(p, `aria-current incorreto no menu: ${cur.join(', ') || 'nenhum'}`);
}
function NAVPAGES() { return ['index.html', 'clinica.html', 'atendimento.html', 'equipe.html', 'convenios.html', 'contato.html']; }

// ---------- contraste (Playwright opcional)
async function contrast() {
  let chromium;
  try { ({ chromium } = await import('playwright')); } catch {
    try { // instalação global (npm i -g playwright)
      const { execSync } = await import('node:child_process');
      const g = execSync('npm root -g', { encoding: 'utf8' }).trim();
      ({ chromium } = await import(path.join(g, 'playwright', 'index.mjs')));
    } catch { warn('contraste', 'Playwright não encontrado; teste de contraste pulado'); return; }
  }
  const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
  const server = http.createServer((req, res) => {
    const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]).replace(/^\/$/, '/index.html'));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
  }).listen(0);
  const port = server.address().port;
  let browser;
  try { browser = await chromium.launch(); } catch (e) { warn('contraste', `navegador indisponível (${e.message.split('\n')[0]}); teste pulado`); server.close(); return; }
  for (const width of [390, 1440]) {
    const pg = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
    await pg.route(/^https?:\/\/(?!127\.0\.0\.1)/, r => r.abort());
    for (const p of pages) {
      await pg.goto(`http://127.0.0.1:${port}/${p}`, { waitUntil: 'load' });
      const bad = await pg.evaluate(() => {
        const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { r: v[0], g: v[1], b: v[2], a: v[3] ?? 1 }; };
        const lum = ({ r, g, b }) => [r, g, b].map(x => { x /= 255; return x <= .03928 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4; }).reduce((s, x, i) => s + x * [.2126, .7152, .0722][i], 0);
        const blend = (top, bottom) => ({ r: top.r * top.a + bottom.r * (1 - top.a), g: top.g * top.a + bottom.g * (1 - top.a), b: top.b * top.a + bottom.b * (1 - top.a), a: 1 });
        const bgOf = el => {
          const layers = [];
          for (let e = el; e; e = e.parentElement) {
            const cs = getComputedStyle(e);
            if (cs.backgroundImage !== 'none' && !/gradient/.test(cs.backgroundImage)) return null;
            const c = parse(cs.backgroundColor);
            if (c && c.a > 0) { layers.push(c); if (c.a >= 1) break; }
            if (e.tagName === 'DIALOG' && !e.open) return null;
          }
          let out = { r: 255, g: 255, b: 255, a: 1 };
          for (const l of layers.reverse()) out = blend(l, out);
          return out;
        };
        const out = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        const seen = new Set();
        while (walker.nextNode()) {
          const n = walker.currentNode, el = n.parentElement;
          if (!n.textContent.trim() || seen.has(el)) continue;
          seen.add(el);
          if (el.closest('noscript,script,style,dialog:not([open]),[hidden],.skip,svg,.video-card')) continue;
          const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
          const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
          const fg = parse(cs.color), bg = bgOf(el); if (!fg || !bg) continue;
          const f = blend(fg, bg), L1 = lum(f), L2 = lum(bg);
          const ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
          const size = parseFloat(cs.fontSize), bold = +cs.fontWeight >= 700;
          const min = size >= 24 || (bold && size >= 18.66) ? 3 : 4.5;
          if (ratio < min) out.push(`${ratio.toFixed(2)}:1 (mín. ${min}) "${n.textContent.trim().slice(0, 50)}"`);
        }
        return out;
      });
      for (const b of bad) fail(`${p} @${width}px`, `contraste ${b}`);
    }
    await pg.close();
  }
  await browser.close(); server.close();
}
await contrast();

for (const w of warnings) console.log('AVISO  ' + w);
for (const e of errors) console.log('ERRO   ' + e);
console.log(errors.length ? `\n${errors.length} erro(s).` : `\nOK: ${pages.length} páginas verificadas (origem ${ORIGIN}).`);
process.exit(errors.length ? 1 : 0);
