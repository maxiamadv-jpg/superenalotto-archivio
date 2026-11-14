// Scarica le estrazioni SuperEnalotto da xamig.com e aggiorna data/estrazioni.json
// Uso: node scripts/aggiorna.mjs            -> aggiorna (anno corrente)
//      node scripts/aggiorna.mjs --completo -> ricostruisce tutto lo storico con SuperStar (dal 2006)
import fs from 'node:fs';
const FILE = new URL('../data/estrazioni.json', import.meta.url);
const UA = { 'User-Agent': 'Mozilla/5.0 (archivio-superenalotto)' };
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function pagina(anno, p) {
  const url = `https://www.xamig.com/superenalotto/${anno}/estrazioni.php${p > 1 ? `?page=${p}` : ''}`;
  const r = await fetch(url, { headers: UA });
  if (!r.ok) return [];
  const h = await r.text();
  const out = [];
  for (const [, row] of h.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g)) {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(m => m[1].replace(/<[^>]+>/g, '').trim()).filter(Boolean);
    if (cells.length < 10 || !/^\d+$/.test(cells[0]) || !/^\d{2}\/\d{2}\/\d{4}$/.test(cells[1])) continue;
    const v = cells.slice(2, 10).map(Number);
    if (v.some(x => !(x >= 1 && x <= 90))) continue;
    const [d, m, y] = cells[1].split('/');
    out.push({ concorso: +cells[0], data: `${y}-${m}-${d}`, numeri: v.slice(0, 6), jolly: v[6], superstar: v[7] });
  }
  return out;
}

async function anno(a, tuttePagine) {
  let tutte = [];
  for (let p = 1; p <= (tuttePagine ? 10 : 1); p++) {
    const r = await pagina(a, p);
    if (!r.length) break;
    tutte = tutte.concat(r);
    await sleep(800);
  }
  return tutte;
}

const completo = process.argv.includes('--completo');
let db = [];
try { db = JSON.parse(fs.readFileSync(FILE, 'utf8')).estrazioni || []; } catch {}
const oggi = new Date().getFullYear();
const anni = completo ? Array.from({ length: oggi - 2006 + 1 }, (_, i) => oggi - i) : [oggi];
const key = e => e.data + '#' + e.concorso;
const mappa = new Map(db.map(e => [key(e), e]));
let nuove = 0;
for (const a of anni) {
  const r = await anno(a, completo);
  console.log(`${a}: ${r.length} estrazioni`);
  for (const e of r) if (!mappa.has(key(e))) { mappa.set(key(e), e); nuove++; }
}
const lista = [...mappa.values()].sort((x, y) => y.data.localeCompare(x.data) || y.concorso - x.concorso);
if (!lista.length) { console.error('Nessun dato scaricato'); process.exit(1); }
fs.writeFileSync(FILE, JSON.stringify({ aggiornato: new Date().toISOString(), fonte: 'xamig.com', totale: lista.length, estrazioni: lista }));
console.log(`Nuove: ${nuove} · Totale: ${lista.length} · Ultima: ${lista[0].data} n.${lista[0].concorso}`);
