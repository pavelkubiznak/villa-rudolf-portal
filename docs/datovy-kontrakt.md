# Datový kontrakt: `data/trips.json`, `data/forecast.json`, `data/demo-guest.json`, `docs/cenik.json`

Stav k 11. 10. 2026. Soubory v `data/` tohoto repa jsou **veřejné API** pro villarudolf.com a pro TV ve vile.
Cokoli se tu přejmenuje nebo smaže, rozbije web bez varování. Tenhle dokument říká, kdo co čte,
jaká pole jsou povinná, jaké hodnoty smí mít, a jak se dělá změna bezpečně.

Ověřování: `node scripts/validate-trips.mjs` proti `data/trips.schema.json` (běží i v CI
před každým nasazením). Dokud validátor neexistuje, aspoň `node -e 'JSON.parse(require("fs").readFileSync("data/trips.json","utf8"))'`.

## 1. Kdo čte co

Základ URL: `https://pavelkubiznak.github.io/villa-rudolf-portal/data/` (GitHub Pages,
`Access-Control-Allow-Origin: *`, `Cache-Control: max-age=600`).

| Konzument | Soubor | Co z něj bere | Cache na straně konzumenta |
|---|---|---|---|
| `villa-rudolf-site/assets/planner.js` (`/pruvodce/`, `/vylety/#planovac`) | `trips.json`, `forecast.json`, `demo-guest.json` | celý katalog (+ vlastní `EXTRA_TRIPS` a `TRIP_PHOTOS` lokálně), jádro doporučení, předpověď | `sessionStorage` `vr_trips_v1`, TTL 6 h |
| `villa-rudolf-site/assets/site.js` (homepage) | `trips.json` | jen `zone` a `seasons` → počty výletů | `localStorage` `vr_trips_v3`, TTL 6 h |
| `villa-rudolf-site/tv/tv.js` (`/tv/`, WebView `cz.villarudolf.tv`) | `trips.json`, `forecast.json` | katalog, předpověď, `walkMin`, `driveMin`, `links[].urlByLang`, `photo`, `warn`, `checked` | `cache: 'no-cache'`, obnova každé 3 h, záložní kopie `tv/data/` vedle stránky |
| `villa-rudolf-site/k/index.html` (QR z TV) | `trips.json` | `id`, `links[].icon`, `links[].url`, `links[].urlByLang` | žádná |
| `villa-rudolf-site/tools/gen-cenik-web.mjs` (build webu) | `docs/cenik.json` + výstup `node scripts/cenik.mjs kalendar --json` | ceny a min. noci na homepage v 6 jazycích | build-time, nečte se za běhu |
| `villa-rudolf-site/tv/texty.js` | `docs/text-villa-rudolf.md` | fakta o domě (kap. 3) — **přepisuje se ručně** | — |
| tohle repo: `app.js` (demo průvodce) | `trips.json`, `forecast.json`, `demo-guest.json` | totéž co planner.js | service worker `sw.js` (stale-while-revalidate) |
| tohle repo: `scripts/fetch-forecast.mjs` | `trips.json` | `id` + `coords` → lokality předpovědi | — |
| tohle repo: `scripts/fotky.py` | `trips.json` | `photo` | — |

Opačným směrem nic neteče: portál ze site ani z kalendáře nic nečte.

Pravidla, která z tabulky plynou:

- Soubory v `data/` a `docs/cenik.json` se **nepřejmenovávají a nepřesouvají**; repo se nepřejmenovává
  (GitHub by přesměroval, ale URL v site a v TV jsou natvrdo).
- Změna dorazí k hostům se zpožděním (sekce 7). Nejde slíbit „opraveno hned".

## 2. `data/trips.json`

Nejvyšší úroveň: `{ "_comment": string, "trips": Trip[], "food": Food[] }`. Počet položek se nepíše natvrdo (viz `_comment`)
(počet se nepíše natvrdo nikam do dokumentace — `node -e` jednořádek nebo `site.js` `loadTripCounts()`).

### 2.1 Lokalizované texty

Všechna textová pole hosta jsou objekty `{ "cs": …, "de": …, "en": …, "pl": … }` a **všechny čtyři jazyky
jsou povinné** (fallback v klientech je `cs`, ale polští hosté jsou 16 % pobytů). Platí i pro vnořené:
`links[].label` (smí být i prostý string, např. doména webu), `warn`.

### 2.2 Pole výletu (`trips[]`)

Povinná (mají je všechny záznamy):

| Pole | Typ | Význam / hodnoty |
|---|---|---|
| `id` | string `^[a-z0-9-]{1,40}$` | **trvalý veřejný klíč** — viz sekce 3 |
| `icon` | enum | `mountain` `fort` `tree` `waves` `flame` `zap` `bike` `play` `route` `cloud-rain` `map` `info` — musí existovat jako `<symbol id="i-…">` v SVG spritu `index.html` i v `SPRITE` v site `planner.js`; neznámá ikona = prázdné místo |
| `accent` | string `#rrggbb` | barva karty |
| `coords` | `{lat, lon, alt}` | WGS84; `alt` v m (fetch-forecast dosadí 500, když chybí — radši vyplnit) |
| `travelMin` | int | dojezd od vily v minutách (auto, nebo pěšky u `byFoot`) |
| `byFoot` | bool | start pěšky od vily (bonus v jádru) |
| `outdoor`, `indoorOrCovered`, `rainOk`, `lovesHeat`, `needsClearLowWind` | bool | tagy pro jádro: hezky → ven, déšť → pod střechu, hřeben jen za jasna a bez větru |
| `effort` | enum | `easy` \| `medium` \| `hard`. `moderate` se nepoužívá (sjednoceno na `medium` 11. 10. 2026, validátor ji odmítne); jádro rozlišuje jen `easy` a `hard` |
| `stairs` | bool | schody/kočárek (malus pro batolata) |
| `crossBorderId` | bool | potřeba doklad (Polsko) |
| `minAge` | int | minimální věk (0 = bez omezení) |
| `bestFor` | string[] | podmnožina `toddler` `child` `teen` `adult` |
| `group` | `{groupTariffMin: int\|null, reservation: bool, capacity: int\|bool\|null}` | skupinová sazba od N osob, nutnost rezervace, kapacita (hodnota `true/false` = „ano/ne bez čísla") |
| `name`, `tagline`, `desc`, `openNote`, `price` | i18n objekt | texty hosta |
| `links` | `Link[]` | viz níže |
| `category` | enum | `viewpoint` `culture` `water` `adrenalin` `kids` `animals` `rain` `walk` (filtry a chipy) |
| `zone` | enum | `villa` \| `near` \| `far` — **délka výletu, ne dojezd**: `villa` = start pěšky od vily; `near` = půlden a dojezd ≤ 35 min; `far` = celý den (nebo dojezd > 35 min). Proto je safari (29 min) i Malá Úpa (30 min) ve `far` — správně. Web ukazuje zóny jako „Pěšky od vily / V okolí do 30 minut / Na celý den" |

`Link`: `{ icon: 'globe'|'pin'|'ticket'|'route', label: string|i18n, url: https URL, urlByLang?: {de?, en?, pl?} }`.
`urlByLang` = web v jazyce hosta (TV a `/k/` ho upřednostní), `url` je fallback. `pin` = mapa (Mapy.cz trasa).

Nepovinná (klient je musí umět ignorovat):

| Pole | Typ | Význam |
|---|---|---|
| `seasons` | `("summer"\|"winter")[]` | chybí = celoroční; viz sekce 4 |
| `interests` | `("moto")[]` | zájmový bonus; whitelist je i v DB (`vr_update_party`) |
| `interestOnly` | bool | bez toho zájmu výlet z plánu vypadne (v katalogu zůstává) |
| `photo` | `{url, credit, source, original}` | `url` **absolutní https** na `…/villa-rudolf-portal/data/img/<id>.jpg` (TV testuje `/^https:\/\//`); `credit` = „autor · Wikimedia Commons · licence"; `source` = stránka na Commons; `original` = plný originál. Licence a autoři: `data/img/FOTKY.md`, `LICENSE.md` |
| `walkMin`, `driveMin` | int | čas pěšky / autem pro detail na TV (od PR #6) |
| `warn` | i18n objekt | upozornění (sanitární den, zavřeno…) — TV i web ho ukážou výrazně |
| `checked` | `YYYY-MM-DD` | kdy byly otevírací doba a ceny naposledy ověřené |

### 2.3 Restaurace (`food[]`)

`{ id, coords{lat,lon}, travelMin, byFoot, name, tagline, desc, openNote, links }` — stejná pravidla pro i18n.
Site planner je zobrazuje až při `CFG.SHOW_FOOD = true` (dnes `false`, majitel je neověřil); demo průvodce je ukazuje.

## 3. `id` je trvalý veřejný klíč

Kde se `id` používá mimo katalog:

- `forecast.json` → `byLocation[id]` (54 lokalit = `villa` + 53 výletů);
- QR na TV → `villarudolf.com/k/?v=<id>&l=<lang>` (regex `^[a-z0-9-]{1,40}$`), `k/index.html` hledá `x.id === id`;
- odkazy `#<id>` a `:target` v demo průvodci;
- `localStorage` `vrGuide.visited[id]` v site planneru („už jsme byli");
- `tv.js`: prefix před pomlčkou = „stejné místo" (seskupení);
- **natvrdo v jádru** (`scoreTrip`, `whyBadges` — v `app.js` tohoto repa i v site `planner.js`):
  `bobsled-pec`, `ebikes`, `snezka-cablecar` (teenageři), `janske-hallenbad`, `baumwipfelpfad`,
  `aqua-vrchlabi`, `aquapark-karpacz`, `hricky-buky` (malé děti). Validátor má hlídat, že všech osm existuje.

Pravidlo: **`id` se nikdy nepřejmenovává.** Přejmenování = nový záznam s novým `id` a starý zůstává (nebo se
smaže až po odstranění ze všech míst výše). Smazání výletu = nejdřív pryč z kódu (site planner, app.js, TV),
pak z dat; forecast si sám přegeneruje lokality při dalším běhu cronu.

## 4. Sezóna výletů

Hranice sezón pro katalog výletů (lyže vs. koupání), **ne** pro ceník:

- `winter` = **1. 12. – 31. 3.**
- `summer` = **1. 4. – 14. 10.**
- **15. 10. – 30. 11.** se ukazují jen celoroční výlety (bez pole `seasons`).

Výlet se zobrazí, když nemá `seasons`, nebo když průnik jeho `seasons` s obdobím pobytu není prázdný
(pobyt přes hranici = obě sezóny). Dvě místa, která hranici znají: `app.js` (`seasonOf`) v tomhle repu
a site `planner.js` (`seasonOf`/`seasonOk`, po sloučení PR #43). Sezóna VÝLETŮ je záměrně jiná než sezóna
WEBU v site `assets/season.js` (zima od 15. 10. – řídí ceny, vzhled a přepínač Léto/Zima na `/vylety/`);
do 11. 10. 2026 měl portál i planner hranici 15. 10. jako web, takže v říjnu a listopadu doporučoval lyžařské
areály. Při změně hranic výletů se mění `app.js` + `planner.js` v jednom dni; `season.js` se nemění.

## 5. `data/forecast.json`

Generuje jen `scripts/fetch-forecast.mjs` (cron na Hetzneru, 05:15 a 15:15 UTC, zdroj api.met.no). **Ručně se needituje**
a do PR se nepřidává (konflikty s botem).

```
{
  "generatedAt": ISO 8601 UTC,
  "source": "yr.no / MET Norway",
  "dates": ["YYYY-MM-DD" × 9],                 // od pražského „dnes"
  "byLocation": {
    "villa" | <trip id>: {
      "coords": { "lat", "lon", "alt" },
      "daily": { "YYYY-MM-DD": { "max": int °C, "min": int °C, "precip": mm (1 des.),
                                 "windKmh": int | null, "cat": Cat, "thunder": bool } },
      "error"?: string                           // lokalita selhala, daily je {}
    }
  }
}
```

`Cat` (10 hodnot, pořadí podle „mokrosti"): `thunder` `heavyrain` `rain` `showers` `snow` `fog` `cloudy` `partly` `fair` `clear`.
Den má kategorii podle podílu hodin se srážkami mezi 6 a 22 h pražského času; `thunder: true` = bouřka kdykoli během dne
(jádro vyřadí hřebenové výlety i když kategorie dne vyhrála jiná). Klienti ignorují neznámou kategorii jako „bez dat".

**Změna enumu `cat` = změna na čtyřech místech ve stejný den:** `scripts/fetch-forecast.mjs` (`category()`),
`app.js` (`CAT`), site `assets/planner.js` (`CAT`), site `tv/tv.js`.

Jádro doporučení existuje ve dvou kopiích (`app.js` tady, `planner.js` v site) a hosté používají tu v site.
Změna `eligible` / `scoreTrip` / `WIND_LIMIT_KMH` se dělá v obou, jinak se rozejdou (11. 10. 2026: site má
vítr 45 km/h a jen počasí u vily, tady 35 km/h a počasí v místě výletu + `thunder`).

## 6. `data/demo-guest.json`

`{ "token": "demo", "name": {first,last}, "lang", "arrival", "departure", "party": { "adults": int, "children": int[] } }`
— smyšlený host pro `?t=demo`. Klienti si data přepisují na „zítra až za 5 dní" (`rollDates` v planneru),
takže termín v souboru nerozhoduje. Pole `notes` je nepoužívané (vr_verify_token ho od 11. 10. 2026 nevrací)
a při příští úpravě se vypustí.

## 7. `docs/cenik.json` a `node scripts/cenik.mjs kalendar --json` (build-time kontrakt pro web)

`villa-rudolf-site/tools/gen-cenik-web.mjs` čte přímo z `cenik.json`: `verze`, `sezony.{vanoce,leto,zima,mimo}.{noc,min_noci}`,
`vyjimky[].{od,do,jako}` (pole `koef` a `min_noci` výjimek čte jen `scripts/cenik.mjs`); a z výstupu `kalendar --json`: `kanaly[<klíč>].primy` (právě jeden kanál `primy: true`),
`dny[].{d, s, ceny[<kanál>], min}`. Přejmenování těchto klíčů nebo změna tvaru `kalendar --json` rozbije ceny na homepage
ve všech jazycích — test je v site `tools/test-cenik-web.mjs` (ručně). Úplný seznam klíčů: `docs/cenik.json` (`_pozn` u každého).

## 8. Jak měnit bezpečně

| Změna | Postup |
|---|---|
| **Přidat pole** | OK v jednom PR: nepovinné, klienti ho ignorují. Zapsat sem ve stejném commitu. |
| **Přidat výlet** | nové `id`, všechna povinná pole, 4 jazyky, `coords.alt`; forecast ho dostane při dalším běhu cronu (do 12 h) |
| **Přejmenovat / smazat pole nebo hodnotu enumu** | nejdřív PR v site (planner.js, tv.js, k/index.html), pak tady; nikdy obráceně |
| **Přejmenovat `id`** | nedělá se — viz sekce 3 |
| **Změnit `cat` nebo CAT** | čtyři místa, viz sekce 5 |
| **Změnit klíč v `cenik.json`** | zároveň `scripts/cenik.mjs` a site `tools/gen-cenik-web.mjs` + `test-cenik-web.mjs` |

Validátor `scripts/validate-trips.mjs` + `data/trips.schema.json` (lokálně i v CI) hlídá: povinná pole a typy, enumy
z tohoto dokumentu, čtyři jazyky všude, `id` unikátní a ve tvaru regexu, osm `id` z jádra existuje, `photo.url` https
na `data/img/`, `checked` ve tvaru data. Co validátor nehlídá, hlídá tenhle dokument.

## 9. Latence: kdy změnu host uvidí

- GitHub Pages: `max-age=600` → do 10 min po nasazení.
- `/pruvodce/` a `/vylety/`: `sessionStorage` 6 h (planner) / `localStorage` 6 h (homepage) → host s otevřenou stránkou vidí
  změnu až po **~6 h 10 min** a reloadu.
- TV: do 3 h (a jen online; offline běží zabalená kopie).
- Demo průvodce (PWA): service worker dává starou verzi a stáhne novou na pozadí → změna až při druhém otevření.

## 10. Co je v plánu (není hotové)

- `photo.url` relativní (`data/img/…`) místo absolutní — až to budou umět tv.js i planner.js (dnes TV absolutní vyžaduje).
- Hardcoded seznamy `id` v jádru nahradit tagy v datech (`category: kids` + `bestFor: toddler` → bonus), aby jádro
  nemuselo znát konkrétní výlety.
- Site `planner.js` přepnout `TRIP_PHOTOS` na `trips.json.photo`, ať je kredit fotky na jednom místě.
- Jedna kopie jádra (např. `data/core.js` načítaný oběma klienty) místo dvou.
