#!/usr/bin/env node
// Troca a origem absoluta do site (canonical, og:url, og:image, JSON-LD, sitemap, robots e manifest).
// Uso, na raiz do repositório: node scripts/definir-dominio.mjs https://novodominio.com.br
// Sem dependências. A origem atual é lida do sitemap.xml.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const nova = (process.argv[2] || '').replace(/\/+$/, '');
if (!/^https:\/\/[a-z0-9.-]+\.[a-z]{2,}$/i.test(nova)) {
  console.error('Informe a nova origem com https e sem barra final, por exemplo: https://rinosono.com.br');
  process.exit(1);
}
const sitemap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
const antiga = (sitemap.match(/<loc>(https?:\/\/[^/<]+)\//) || [])[1];
if (!antiga) { console.error('Origem atual não encontrada no sitemap.xml'); process.exit(1); }
if (antiga === nova) { console.log(`A origem já é ${nova}. Nada a trocar.`); process.exit(0); }

const arquivos = [
  ...fs.readdirSync(ROOT).filter(f => f.endsWith('.html')),
  'sitemap.xml', 'robots.txt', 'site.webmanifest',
];
let total = 0;
for (const f of arquivos) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const txt = fs.readFileSync(p, 'utf8');
  const n = txt.split(antiga).length - 1;
  if (!n) continue;
  fs.writeFileSync(p, txt.split(antiga).join(nova));
  console.log(`${f}: ${n}`);
  total += n;
}
console.log(`\n${total} ocorrência(s) de ${antiga} trocadas por ${nova}.`);
console.log('Rode node scripts/check-site.mjs para conferir.');
