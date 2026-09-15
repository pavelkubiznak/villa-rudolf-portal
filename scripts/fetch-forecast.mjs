// Villa Rudolf – serverový sběr počasí z yr.no (api.met.no).
// Respektuje podmínky met.no: identifikační User-Agent, souřadnice na 4 desetinná místa,
// běží přes cron 1–2× denně (NE z prohlížeče hosta). Výstup: data/forecast.json.
//
// Spuštění:  node scripts/fetch-forecast.mjs
// Cron (Hetzner):  15 5,15 * * *  /opt/vr-portal/refresh-weather.sh  (node + git commit + push, log /var/log/vr-weather.log)
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

// Pražský místní den a hodina pro UTC čas z met.no – Intl řeší CET/CEST samo
// (dřív natvrdo +2 h, v zimě se okno 06–22 posouvalo na 05–21).
const PRAGUE = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit' });
function localDayHour(iso) {
  const p = Object.fromEntries(PRAGUE.formatToParts(new Date(iso)).map(x => [x.type, x.value]));
  return { day: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) % 24 };
}
function dominant(syms) { const n = {}; let b = '', bc = 0; for (const s of syms) { n[s] = (n[s] || 0) + 1; if (n[s] > bc) { bc = n[s]; b = s; } } return b; }

// Kategorie dne. Rozhoduje podíl hodin se srážkami – ne denní suma (ta se mezi dvěma běhy modelu houpe
// kolem 3 mm a den přeskakoval 'rain' <-> 'showers') a ne „nejčastější symbol" (rozmělnil hlasy mezi
// lightrain/rain/rainshowers, takže bouřka za celé léto 2026 nevyhrála ani jednou).
// Klíče musí zůstat stejné jako CAT v index.html.
function category(syms, precip) {
  const s = syms.map(x => (x || '').replace(/_(day|night|polartwilight)$/, ''));
  const n = s.length || 1, share = re => s.filter(x => re.test(x)).length / n;
  if (share(/thunder/) >= 0.2) return 'thunder';
  if (share(/sleet|snow/) >= 0.3) return 'snow';
  if (precip >= 10 || share(/^heavyrain/) >= 0.3) return 'heavyrain';
  const wet = share(/rain|sleet|snow|thunder/);
  if (wet >= 0.5 || precip >= 6) return 'rain';
  if (wet > 0 || precip > 0.4) return 'showers';
  const p = dominant(s);
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
    const { day: ld, hour: lh } = localDayHour(ts.time);
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
      cat: category(v.syms, v.precip),
      // bouřka kdykoli během dne – jádro s ní vyřadí hřebenové výlety (needsClearLowWind), i když
      // v kategorii dne nevyhraje
      thunder: v.syms.some(x => /thunder/.test(x)),
    };
  }
  return daily;
}

async function main() {
  // dny od pražského „dnes" (server běží v UTC; v 05:15 UTC je to totéž, ale ať to nezávisí na čase cronu)
  const stay = [];
  const d0 = localDayHour(new Date().toISOString()).day;
  for (let i = 0; i < DAYS_AHEAD; i++) { const d = new Date(d0 + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() + i); stay.push(d.toISOString().slice(0, 10)); }

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
