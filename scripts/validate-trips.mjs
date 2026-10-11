#!/usr/bin/env node
// Kontrola data/trips.json proti data/trips.schema.json + pravidla, která JSON Schema neumí.
// Node 20, bez závislostí (žádné ajv). Schéma je zdroj pravdy pro required/enum/pattern/rozsahy –
// tenhle skript z něj čte podmnožinu JSON Schema (type, required, properties, additionalProperties,
// enum, const, pattern, min/max, minItems/maxItems, uniqueItems, items, $ref, oneOf/anyOf/allOf/not,
// if/then) a navíc hlídá unikátnost id, soubory v data/img, symboly v index.html, i18n duplicity atd.
//
//   node scripts/validate-trips.mjs              kontrola dat (exit 1 při chybě, 0 když jen varování)
//   node scripts/validate-trips.mjs --forecast   navíc data/forecast.json (lokality = villa + všechna id, kategorie, stáří)
//   node scripts/validate-trips.mjs --links      navíc síť: HEAD/GET každé URL (timeout 10 s); 404/410 = chyba, 3xx = varování
//
// Výstup: řádky `CHYBA trips[<id>].cesta.k.poli – zpráva` / `VAROVÁNÍ …` a souhrn.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOREN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = new Set(process.argv.slice(2));
const chyby = [];
const varovani = [];
const chyba = (cesta, zprava) => chyby.push(`${cesta} – ${zprava}`);
const varuj = (cesta, zprava) => varovani.push(`${cesta} – ${zprava}`);

// ---------- načtení ----------
const nacti = (rel) => JSON.parse(fs.readFileSync(path.join(KOREN, rel), 'utf8'));
let schema, data;
try { schema = nacti('data/trips.schema.json'); } catch (e) { console.error(`data/trips.schema.json: ${e.message}`); process.exit(1); }
try { data = nacti('data/trips.json'); } catch (e) { console.error(`data/trips.json: ${e.message}`); process.exit(1); }
const NASE_IMG = 'https://pavelkubiznak.github.io/villa-rudolf-portal/data/img/';
const DNES = new Date().toISOString().slice(0, 10);

// ---------- mini validátor JSON Schema (podmnožina draft 2020-12) ----------
const resolveRef = (ref) => {
  if (!ref.startsWith('#/')) throw new Error(`nepodporovaný $ref ${ref}`);
  return ref.slice(2).split('/').reduce((o, k) => o[k], schema);
};
const typOk = (t, v) => {
  switch (t) {
    case 'object': return v !== null && typeof v === 'object' && !Array.isArray(v);
    case 'array': return Array.isArray(v);
    case 'string': return typeof v === 'string';
    case 'number': return typeof v === 'number' && Number.isFinite(v);
    case 'integer': return Number.isInteger(v);
    case 'boolean': return typeof v === 'boolean';
    case 'null': return v === null;
    default: return false;
  }
};
const popis = (v) => JSON.stringify(v) ?? String(v);

/** Vrátí seznam chyb [cesta, zpráva]; prázdný = platné. */
function validuj(s, v, cesta) {
  const out = [];
  if (typeof s === 'boolean') return s ? out : [[cesta, 'nepovoleno']];
  if (s.$ref) out.push(...validuj(resolveRef(s.$ref), v, cesta));
  if (s.type) {
    const typy = Array.isArray(s.type) ? s.type : [s.type];
    if (!typy.some(t => typOk(t, v))) { out.push([cesta, `má být ${typy.join('|')}, je ${popis(v)}`]); return out; }
  }
  if (s.enum && !s.enum.some(e => e === v)) out.push([cesta, `${popis(v)} není v povoleném výčtu ${s.enum.join('|')}`]);
  if ('const' in s && s.const !== v) out.push([cesta, `má být ${popis(s.const)}, je ${popis(v)}`]);
  if (typeof v === 'string') {
    if (s.minLength !== undefined && v.length < s.minLength) out.push([cesta, `kratší než ${s.minLength} znaků`]);
    if (s.maxLength !== undefined && v.length > s.maxLength) out.push([cesta, `delší než ${s.maxLength} znaků`]);
    if (s.pattern && !new RegExp(s.pattern).test(v)) out.push([cesta, `${popis(v.length > 80 ? v.slice(0, 77) + '…' : v)} neodpovídá vzoru ${s.pattern}`]);
  }
  if (typeof v === 'number') {
    if (s.minimum !== undefined && v < s.minimum) out.push([cesta, `${v} je menší než ${s.minimum}`]);
    if (s.maximum !== undefined && v > s.maximum) out.push([cesta, `${v} je větší než ${s.maximum}`]);
  }
  if (Array.isArray(v)) {
    if (s.minItems !== undefined && v.length < s.minItems) out.push([cesta, `méně než ${s.minItems} položek`]);
    if (s.maxItems !== undefined && v.length > s.maxItems) out.push([cesta, `více než ${s.maxItems} položek`]);
    if (s.uniqueItems && new Set(v.map(x => JSON.stringify(x))).size !== v.length) out.push([cesta, 'položky se opakují']);
    if (s.items) v.forEach((x, i) => out.push(...validuj(s.items, x, `${cesta}[${i}]`)));
  }
  if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
    for (const k of s.required || []) if (!(k in v)) out.push([cesta, `chybí povinné pole „${k}“`]);
    for (const [k, sub] of Object.entries(s.properties || {})) if (k in v) out.push(...validuj(sub, v[k], `${cesta}.${k}`));
    if (s.additionalProperties === false) for (const k of Object.keys(v)) if (!(s.properties && k in s.properties)) out.push([`${cesta}.${k}`, 'neznámé pole (překlep? doplň do schématu)']);
  }
  for (const sub of s.allOf || []) out.push(...validuj(sub, v, cesta));
  if (s.anyOf && !s.anyOf.some(sub => validuj(sub, v, cesta).length === 0)) out.push([cesta, `neodpovídá žádné z variant anyOf (${s.anyOf.map(x => x.$ref || JSON.stringify(x)).join(' / ')})`]);
  if (s.oneOf) {
    const vysledky = s.oneOf.map(sub => validuj(sub, v, cesta));
    const ok = vysledky.filter(r => r.length === 0).length;
    if (ok !== 1) {
      const nej = vysledky.slice().sort((a, b) => a.length - b.length)[0];
      out.push([cesta, ok === 0 ? `neodpovídá žádné z variant oneOf: ${nej.map(([c, z]) => `${c.slice(cesta.length) || '.'} ${z}`).join('; ')}` : 'odpovídá více variantám oneOf']);
    }
  }
  if (s.not && validuj(s.not, v, cesta).length === 0) out.push([cesta, `${popis(v)} je zakázaná hodnota`]);
  if (s.if) {
    const plati = validuj(s.if, v, cesta).length === 0;
    if (plati && s.then) out.push(...validuj(s.then, v, cesta).map(([c, z]) => [c, `${z} (podmínka: ${JSON.stringify(s.if)})`]));
    if (!plati && s.else) out.push(...validuj(s.else, v, cesta));
  }
  return out;
}

// cesty trips[3] → trips[<id>], ať se v nich dá číst
const jmena = { trips: (data.trips || []).map(t => t && t.id), food: (data.food || []).map(t => t && t.id) };
const hezky = (cesta) => cesta.replace(/^(trips|food)\[(\d+)\]/, (m, pole, i) => `${pole}[${jmena[pole][i] || i}]`);
for (const [c, z] of validuj(schema, data, '')) chyba(hezky(c.replace(/^\./, '')), z);

// ---------- pravidla nad rámec schématu ----------
const trips = Array.isArray(data.trips) ? data.trips : [];
const food = Array.isArray(data.food) ? data.food : [];
const vse = [...trips.map(t => ['trips', t]), ...food.map(t => ['food', t])];
const sch = schema.$defs;

// symboly v index.html vs. enum icon ve schématu (seznam se nesmí rozejít)
try {
  const html = fs.readFileSync(path.join(KOREN, 'index.html'), 'utf8');
  const symboly = [...html.matchAll(/<symbol id="i-([a-z0-9-]+)"/g)].map(m => m[1]);
  const enumIkon = sch.trip.properties.icon.enum;
  const chybiVeSchematu = symboly.filter(s => !enumIkon.includes(s));
  const chybiVHtml = enumIkon.filter(s => !symboly.includes(s));
  if (chybiVeSchematu.length) chyba('schema.$defs.trip.icon', `index.html má symboly, které v enumu chybí: ${chybiVeSchematu.join(', ')}`);
  if (chybiVHtml.length) chyba('schema.$defs.trip.icon', `enum má ikony, které v index.html nejsou: ${chybiVHtml.join(', ')}`);
  const chybiLink = sch.linkIcon.enum.filter(s => !symboly.includes(s));
  if (chybiLink.length) chyba('schema.$defs.linkIcon', `ikony odkazů bez symbolu v index.html: ${chybiLink.join(', ')}`);
} catch { varuj('index.html', 'nenalezen – symboly ikon nekontrolovány'); }

// id unikátní napříč trips + food
{
  const videno = new Map();
  for (const [pole, t] of vse) {
    if (typeof t.id !== 'string') continue;
    if (videno.has(t.id)) chyba(`${pole}[${t.id}].id`, `duplicitní id (už je v ${videno.get(t.id)})`);
    videno.set(t.id, pole);
  }
}

const JAZYKY = sch.i18n.required;
const kontrolaI18n = (cesta, obj, { mistniNazev = false } = {}) => {
  if (!obj || typeof obj !== 'object') return;
  const hodnoty = JAZYKY.filter(l => typeof obj[l] === 'string').map(l => [l, obj[l].trim()]);
  for (let i = 0; i < hodnoty.length; i++) for (let j = i + 1; j < hodnoty.length; j++) {
    const [la, a] = hodnoty[i], [lb, b] = hodnoty[j];
    if (a !== b) continue;
    if (mistniNazev || !/\s/.test(a)) continue; // název místa nebo doména/jedno slovo – stejný text je v pořádku
    varuj(`${cesta}`, `stejný text v jazycích ${la} a ${lb}: „${a.length > 60 ? a.slice(0, 57) + '…' : a}“`);
  }
};

const isoPlatne = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
const rozmeryJpeg = (buf) => {
  // SOF0/SOF1/SOF2 marker: FF C0/C1/C2, délka(2), přesnost(1), výška(2), šířka(2)
  let i = 2;
  while (i < buf.length - 9) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m === 0xc0 || m === 0xc1 || m === 0xc2) return { height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
    if (m === 0xd8 || m === 0x01 || (m >= 0xd0 && m <= 0xd7)) { i += 2; continue; }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
};

const pouziteFotky = new Set();
for (const [pole, t] of vse) {
  const p = `${pole}[${t.id}]`;
  for (const k of ['name', 'tagline', 'desc', 'openNote', 'price', 'warn']) if (k in t) kontrolaI18n(`${p}.${k}`, t[k], { mistniNazev: k === 'name' });
  for (const [i, l] of (Array.isArray(t.links) ? t.links : []).entries()) {
    const lp = `${p}.links[${i}]`;
    if (l && typeof l.label === 'object') kontrolaI18n(`${lp}.label`, l.label);
    if (l && typeof l.url === 'string') {
      if (/^http:\/\//.test(l.url)) varuj(`${lp}.url`, `http:// místo https:// (${l.url}) – web bez platného certifikátu? ověřit a přepnout, až půjde`);
      let host = null; try { host = new URL(l.url).host; } catch { chyba(`${lp}.url`, `nejde rozebrat jako URL: ${l.url}`); }
      const popisky = typeof l.label === 'object' ? Object.values(l.label) : [l.label];
      if (host === 'mapy.com' && popisky.some(x => /Mapy\.cz/.test(x))) varuj(`${lp}.label`, 'popisek říká Mapy.cz, URL je na mapy.com');
      if (host && /(^|\.)mapy\.cz$/.test(host)) varuj(`${lp}.url`, `doména ${host} – sjednotit na mapy.com`);
    }
  }
  if (pole === 'food') continue;

  // byFoot ⇔ zone villa (výjimka interestOnly okruhy), travelMin
  if (t.byFoot === true) {
    if (!('walkMin' in t)) varuj(`${p}.walkMin`, 'výlet pěšky od vily bez walkMin (kolik minut chůze?)');
  } else if (t.byFoot === false) {
    if (t.interestOnly === true) {
      if (t.zone === 'villa') chyba(`${p}.zone`, 'okruh od vily (interestOnly) má mít zone near, ne villa – kroužek na mapě znamená „pěšky od vily“');
    } else if (t.travelMin === 0) chyba(`${p}.travelMin`, 'byFoot false, ale travelMin 0 (dojezd autem chybí)');
  }
  if (t.zone === 'far' && Number.isInteger(t.travelMin) && t.travelMin < 25 && t.effort !== 'hard') varuj(`${p}.zone`, `far při ${t.travelMin} min a effort ${t.effort} – je to opravdu celodenní výlet?`);
  if (t.outdoor === false && t.indoorOrCovered === false) chyba(`${p}.outdoor`, 'ani outdoor, ani indoorOrCovered – jádro výlet nikdy nenabídne');

  // checked
  if ('checked' in t) {
    if (!isoPlatne(t.checked)) chyba(`${p}.checked`, `${popis(t.checked)} není platné datum YYYY-MM-DD`);
    else if (t.checked > DNES) chyba(`${p}.checked`, `${t.checked} je v budoucnu`);
    else if ((Date.parse(DNES) - Date.parse(t.checked)) / 864e5 > 365) varuj(`${p}.checked`, `ověřeno ${t.checked} – starší než rok, zkontrolovat ceny a otevírací dobu`);
  }
  if ('warn' in t) varuj(`${p}.warn`, `dočasné upozornění – má datum konce? po termínu smazat (cs: „${String(t.warn && t.warn.cs).slice(0, 60)}…“)`);

  // photo
  const f = t.photo;
  if (f && typeof f === 'object') {
    const fp = `${p}.photo`;
    if (typeof f.url === 'string' && f.url.startsWith(NASE_IMG)) {
      const soubor = decodeURIComponent(f.url.slice(NASE_IMG.length));
      pouziteFotky.add(soubor);
      const cesta = path.join(KOREN, 'data/img', soubor);
      if (!/^[a-z0-9-]+\.jpg$/.test(soubor) || !fs.existsSync(cesta)) chyba(`${fp}.url`, `soubor data/img/${soubor} neexistuje`);
      else {
        const buf = fs.readFileSync(cesta);
        const r = rozmeryJpeg(buf);
        if (!r) chyba(`${fp}.url`, `data/img/${soubor} nejde přečíst jako JPEG`);
        else if (r.width !== f.width || r.height !== f.height) chyba(`${fp}.width`, `v JSON ${f.width}×${f.height}, soubor má ${r.width}×${r.height} (spusť scripts/fotky.py --zapsat)`);
        if (buf.length > 300 * 1024) varuj(`${fp}.url`, `data/img/${soubor} má ${Math.round(buf.length / 1024)} kB – zvážit menší variantu`);
      }
      if (typeof f.credit === 'string' && /CC BY/.test(f.credit) && !/zmenšeno/.test(f.credit)) chyba(`${fp}.credit`, 'CC BY / BY-SA vyžaduje uvést úpravu – chybí „zmenšeno“ (scripts/fotky.py --zapsat)');
    } else if (typeof f.url === 'string') varuj(`${fp}.url`, 'fotka mimo náš web – zkopírovat k nám přes scripts/fotky.py --zapsat');
    if (f.alt) kontrolaI18n(`${fp}.alt`, f.alt);
  }
}
// osiřelé soubory v data/img
try {
  for (const soubor of fs.readdirSync(path.join(KOREN, 'data/img'))) {
    if (/\.(jpe?g|png|webp)$/i.test(soubor) && !pouziteFotky.has(soubor)) varuj(`data/img/${soubor}`, 'žádný výlet na soubor neodkazuje (osiřelý)');
  }
} catch { /* bez složky img nic */ }

// ---------- --forecast ----------
if (args.has('--forecast')) {
  let fc = null;
  try { fc = nacti('data/forecast.json'); } catch (e) { chyba('data/forecast.json', e.message); }
  if (fc) {
    const KAT = ['thunder', 'heavyrain', 'rain', 'showers', 'snow', 'fog', 'cloudy', 'partly', 'fair', 'clear']; // = klíče CAT v index.html
    const ocekavane = new Set(['villa', ...trips.map(t => t.id)]);
    const klice = new Set(Object.keys(fc.byLocation || {}));
    for (const k of ocekavane) if (!klice.has(k)) varuj(`forecast.byLocation.${k}`, 'lokalita chybí (nový výlet? doplní se dalším během cronu)');
    for (const k of klice) if (!ocekavane.has(k)) varuj(`forecast.byLocation.${k}`, 'lokalita bez výletu (smazaný výlet?)');
    for (const [k, loc] of Object.entries(fc.byLocation || {})) {
      for (const [den, d] of Object.entries(loc.daily || {})) {
        if (!isoPlatne(den)) chyba(`forecast.byLocation.${k}.daily.${den}`, 'klíč není datum');
        if (!KAT.includes(d.cat)) chyba(`forecast.byLocation.${k}.daily.${den}.cat`, `${popis(d.cat)} není v ${KAT.join('|')}`);
        for (const n of ['max', 'min', 'precip', 'windKmh']) if (typeof d[n] !== 'number') chyba(`forecast.byLocation.${k}.daily.${den}.${n}`, 'chybí číslo');
      }
    }
    const stari = (Date.now() - Date.parse(fc.generatedAt)) / 36e5;
    if (!Number.isFinite(stari)) chyba('forecast.generatedAt', `neplatné datum ${popis(fc.generatedAt)}`);
    else if (stari > 36) varuj('forecast.generatedAt', `předpověď je ${Math.round(stari)} h stará – běží cron na Hetzneru?`);
  }
}

// ---------- --links ----------
async function overOdkazy() {
  const urls = new Map(); // url -> [cesty]
  for (const [pole, t] of vse) for (const [i, l] of (t.links || []).entries()) {
    const pridej = (u, c) => { if (typeof u === 'string') urls.set(u, [...(urls.get(u) || []), c]); };
    pridej(l.url, `${pole}[${t.id}].links[${i}].url`);
    for (const [lang, u] of Object.entries(l.urlByLang || {})) pridej(u, `${pole}[${t.id}].links[${i}].urlByLang.${lang}`);
  }
  for (const t of trips) if (t.photo) for (const k of ['source', 'original', 'licenseUrl']) if (t.photo[k]) urls.set(t.photo[k], [...(urls.get(t.photo[k]) || []), `trips[${t.id}].photo.${k}`]);
  const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
  const dotaz = async (url, method) => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 10_000);
    try { return await fetch(url, { method, redirect: 'manual', signal: ac.signal, headers: { 'User-Agent': UA, 'Accept-Language': 'cs,de;q=0.8,en;q=0.7,pl;q=0.6' } }); }
    finally { clearTimeout(t); }
  };
  const jenJazyk = (a, b) => { // mapy.com přesměrovává /turisticka → /en/turisticka a /fnc/v1/route → plánovač – není to chyba dat
    try {
      const x = new URL(a), y = new URL(b);
      if (x.host !== y.host) return false;
      if (x.host === 'mapy.com' && x.pathname.startsWith('/fnc/')) return true;
      return y.pathname.replace(/^\/[a-z]{2}\//, '/') === x.pathname.replace(/^\/[a-z]{2}\//, '/') && x.search === y.search;
    } catch { return false; }
  };
  const fronta = [...urls.entries()];
  let hotovo = 0;
  const pracovnik = async () => {
    while (fronta.length) {
      const [url, cesty] = fronta.shift();
      let r = null, pozn = '';
      try {
        r = await dotaz(url, 'HEAD');
        if (r.status >= 400 || r.status === 405) r = await dotaz(url, 'GET');
      } catch (e) { pozn = e.name === 'AbortError' ? 'timeout 10 s' : (e.cause && e.cause.code) || e.message; }
      hotovo++;
      const kde = cesty.join(', ');
      if (!r) { varuj(kde, `${url} – nedostupné (${pozn})`); continue; }
      if (r.status >= 200 && r.status < 300) continue;
      if (r.status >= 300 && r.status < 400) {
        const cil = r.headers.get('location') ? new URL(r.headers.get('location'), url).href : '?';
        if (!jenJazyk(url, cil)) varuj(kde, `${url} → ${r.status} ${cil}`);
        continue;
      }
      if (r.status === 404 || r.status === 410) chyba(kde, `${url} → ${r.status} (mrtvý odkaz)`);
      else varuj(kde, `${url} → ${r.status} (${r.status === 403 || r.status === 400 ? 'blokuje roboty? ověřit ručně' : 'ne-2xx'})`);
    }
  };
  await Promise.all(Array.from({ length: 6 }, pracovnik));
  console.log(`--links: ověřeno ${hotovo} unikátních URL`);
}
if (args.has('--links')) await overOdkazy();

// ---------- výstup ----------
for (const z of chyby) console.log(`CHYBA ${z}`);
for (const z of varovani) console.log(`VAROVÁNÍ ${z}`);
console.log(`\n${trips.length} výletů, ${food.length} tipů na jídlo – ${chyby.length} chyb, ${varovani.length} varování`);
process.exit(chyby.length ? 1 : 0);
