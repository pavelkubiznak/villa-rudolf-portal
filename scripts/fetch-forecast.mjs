// Villa Rudolf – serverový sběr počasí z yr.no (api.met.no).
// Respektuje podmínky met.no: identifikační User-Agent, souřadnice na 4 desetinná místa,
// běží přes cron 1–2× denně (NE z prohlížeče hosta). Výstup: data/forecast.json.
//
// Spuštění:  node scripts/fetch-forecast.mjs
// Cron (Hetzner):  0 5,15 * * *  cd /opt/vr-portal && node scripts/fetch-forecast.mjs && git ...
//
// Node 18+ (global fetch). Bez závislostí.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const UA = 'villarudolf.com guest-portal (pavel.kubiznak@gmail.com)';
const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(HERE, '..', 'data', 'forecast.json');
const TRIPS = resolve(HERE, '..', 'data', 'trips.json');
const DAYS_AHEAD = 9;

// Souřadnice na 4 desetinná místa (požadavek met.no).
const round4 = n => Math.round(Number(n) * 1e4) / 1e4;

// Lokality = 'villa' + jeden záznam per výlet z trips.json (souřadnice z coords, alt z coords.alt || 500).
// Výstup zůstává stejný: byLocation klíčované 'villa' + id výletů.
function buildLocations() {
  const data = JSON.parse(readFileSync(TRIPS, 'utf8'));
  const locs = { villa: { lat: 50.6255, lon: 15.8136, alt: 516 } };
  for (const t of data.trips || []) {
    if (!t || !t.id || !t.coords) continue;
    locs[t.id] = { lat: round4(t.coords.lat), lon: round4(t.coords.lon), alt: t.coords.alt || 500 };
  }
  return locs;
}
const LOCS = buildLocations();

function addDay(d) { const t = new Date(d + 'T00:00:00Z'); t.setUTCDate(t.getUTCDate() + 1); return t.toISOString().slice(0, 10); }
function dominant(syms) { const n = {}; let b = '', bc = 0; for (const s of syms) { const k = (s || '').replace(/_(day|night|polartwilight)$/, ''); n[k] = (n[k] || 0) + 1; if (n[k] > bc) { bc = n[k]; b = k; } } return b; }

// Jedna kategorie -> sjednocené počasí (musí odpovídat category() ve front-endu).
function category(prefix, precip) {
  const p = prefix || '';
  if (p.includes('thunder')) return 'thunder';
  if (p.includes('sleet') || p.includes('snow')) return 'snow';
  if (p === 'heavyrain' || p === 'heavyrainshowers' || precip >= 10) return 'heavyrain';
  if (p.includes('rain') || p.includes('showers') || precip >= 3) return 'rain';
  if (precip > 0.4) return 'showers';
  if (p === 'clearsky') return 'clear';
  if (p === 'fair') return 'fair';
  if (p === 'partlycloudy') return 'partly';
  if (p === 'fog') return 'fog';
  return 'cloudy';
}

async function getForecast(loc, stayDates) {
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${loc.lat}&lon=${loc.lon}&altitude=${loc.alt}`;
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error('met.no ' + r.status + ' for ' + JSON.stringify(loc));
  const j = await r.json();
  const acc = {};
  for (const ts of j.properties.timeseries) {
    const hh = parseInt(ts.time.slice(11, 13), 10);
    let ld = ts.time.slice(0, 10), lh = hh + 2; // CEST = UTC+2 (léto)
    if (lh >= 24) { lh -= 24; ld = addDay(ld); }
    if (lh < 6 || lh > 22 || !stayDates.includes(ld)) continue;
    const o = acc[ld] || (acc[ld] = { temps: [], precip: 0, syms: [], wind: [] });
    const det = ts.data.instant.details;
    if (det && typeof det.air_temperature === 'number') o.temps.push(det.air_temperature);
    if (det && typeof det.wind_speed === 'number') o.wind.push(det.wind_speed);
    const nx = ts.data.next_1_hours || ts.data.next_6_hours;
    if (nx) { if (nx.details?.precipitation_amount) o.precip += nx.details.precipitation_amount; if (nx.summary) o.syms.push(nx.summary.symbol_code); }
  }
  const daily = {};
  for (const d of Object.keys(acc)) {
    const v = acc[d]; if (!v.temps.length) continue;
    daily[d] = {
      max: Math.round(Math.max(...v.temps)),
      min: Math.round(Math.min(...v.temps)),
      precip: Math.round(v.precip * 10) / 10,
      windKmh: v.wind.length ? Math.round(Math.max(...v.wind) * 3.6) : null,
      cat: category(dominant(v.syms), v.precip),
    };
  }
  return daily;
}

async function main() {
  const today = new Date();
  const stay = [];
  for (let i = 0; i < DAYS_AHEAD; i++) { const d = new Date(today); d.setDate(d.getDate() + i); stay.push(d.toISOString().slice(0, 10)); }

  const byLocation = {};
  for (const [id, loc] of Object.entries(LOCS)) {
    try { byLocation[id] = { coords: loc, daily: await getForecast(loc, stay) }; }
    catch (e) { console.error('skip', id, e.message); byLocation[id] = { coords: loc, daily: {}, error: String(e.message) }; }
    await new Promise(r => setTimeout(r, 200)); // šetrné tempo k met.no
  }

  const out = { generatedAt: new Date().toISOString(), source: 'yr.no / MET Norway', dates: stay, byLocation };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log('wrote', OUT, '–', Object.keys(byLocation).length, 'locations,', stay.length, 'days');
}
main();
