# Villa Rudolf – portal (data o výletech a počasí, ceník, texty; demo průvodce)

> 🗺️ **Mapa celého systému Villa Rudolf:**
> [`villa-rudolf-site/MAPA-SYSTEMU.md`](https://github.com/pavelkubiznak/villa-rudolf-site/blob/main/MAPA-SYSTEMU.md)
> — **přečti ji dřív, než začneš.**
>
> ⚠️ **Tohle repo NENÍ hlavní systém.** Provozní jádro (web, `/sprava/`, `/registrace/`, `/pruvodce/`,
> migrace databáze, n8n) žije ve **`villa-rudolf-site`** na villarudolf.com.

## Role repa (od 10/2026): datový a rozhodovací sklad

1. **Katalog výletů a počasí** `data/trips.json`, `data/forecast.json`, `data/demo-guest.json` — veřejné API pro
   villarudolf.com (`/pruvodce/`, `/vylety/`, homepage, `/tv/`, `/k/`) i pro demo tady. Kontrakt: `docs/datovy-kontrakt.md`.
2. **Ceník** `docs/cenik.json` + `scripts/cenik.mjs` + `data/svatky.json` — zdroj pravdy pro ceny, min. noci
   a horizont na Booking / Airbnb / FeWo / e-chalupy / Megaubytko; web si z něj generuje ceny (`site/tools/gen-cenik-web.mjs`).
3. **Texty objektu** `docs/text-villa-rudolf.md` + stav kanálů (`docs/popisy-na-kanalech.md`, `docs/nazev-na-kanalech.md`)
   a **snímky cenových auditů** `docs/audit-cen/`.
4. **`index.html` + `app.js` = demo/ukázka průvodce** (`?t=demo`, lišta „toto je ukázka"). Host s reálným tokenem
   (`?t=` jiný než demo, nebo token v `localStorage` z dřívější PWA) se **přesměruje na
   `https://villarudolf.com/pruvodce/?t=<token>`**, kde žije udržovaný průvodce. Supabase se odsud nevolá.

Statická PWA bez buildu, bez frameworku, bez npm závislostí; Node 20 jen pro skripty. Běží ostrý provoz
(data čte web, který hosté používají). Index dokumentace: `docs/README.md`.

## Struktura

- `index.html` — HTML + CSS (`<style>` hned za `<head>`, SVG sprite `<symbol id="i-…">`), CSP přes
  `<meta http-equiv="Content-Security-Policy">` (Pages hlavičky neumí), lišta demo režimu.
- `app.js` — veškerý JS: konfigurace `CFG`, `I18N` (cs/de/en/pl), `CAT` (kategorie počasí), **doporučovací jádro**
  `partyFlags()` → `eligible()` → `scoreTrip()` → `whyBadges()` → `buildPlan()`, vykreslení `render()`, mapa
  `buildMapSection()` / `renderMapInner()`, filtry (chipy + `applyFilter()`), přesměrování hostů s tokenem.
  Karta výletu je `.trip`, nadpis `h3` — na tom závisí tracking.
- `track.js` — Umami (cookieless, `data-exclude-search` ať se token nikdy nezapíše) + event „Link-Klick".
- `sw.js` + `manifest.webmanifest` — PWA, relativní cesty kvůli subpath na Pages. Při změně `sw.js` zvýšit `CACHE`.
- `fonts/` — Spectral a Instrument Sans self-hostované (SIL OFL), žádný Google Fonts.
- `data/` — `trips.json` (jediný zdroj pravdy katalogu; objekt `{trips, food}`), `forecast.json` (**needitovat**,
  generuje cron), `demo-guest.json` (smyšlený host), `svatky.json` (prázdniny DE/NL/BE/CZ pro ceník),
  `img/` (fotky výletů, licence v `img/FOTKY.md` a `LICENSE.md`).
- `scripts/` — `fetch-forecast.mjs` (počasí z yr.no, běží cronem), `cenik.mjs` (ceník → plán na kanály, audit, kalendář),
  `validate-trips.mjs` (validace katalogu proti `data/trips.schema.json`, běží v CI), `fotky.py` (zmenšení fotek, Pillow).
- `supabase/schema.sql` — **jen kontrakt pro čtení**: sloupce `vr_bookings` a dvě RPC, které průvodce volá.
  Zdroj pravdy schématu je `villa-rudolf-site/supabase/migrations/`.
- `docs/` — viz `docs/README.md` (status každého souboru). Historie v `docs/archiv/` s bannery.
- `.github/workflows/` — `pages.yml` (Pages jen z allowlistu), `ci.yml` (validace dat, parse JSON, kontroly),
  `forecast.yml` (počasí jako GitHub Action – jen ruční `workflow_dispatch`; schedule se zapne, až se vypne cron na velínu).

**Jádro existuje ve dvou kopiích:** `app.js` tady a `villa-rudolf-site/assets/planner.js` (to používají hosté).
Změna `eligible` / `scoreTrip` / `WIND_LIMIT_KMH` / `CAT` se dělá v obou, nebo se vyčlení. Vážení se ladí
podle dat z Umami, ne od stolu; v1 je záměrně jednoduchá (hezky → ven, déšť → pod střechu, pár tvrdých pravidel).

## Jak to testovat

```bash
python3 -m http.server 8767      # v kořeni repa
open http://localhost:8767/?t=demo
```

`fetch()` i service worker potřebují http — z `file://` se data nenačtou a stránka zůstane na „…".
Bez tokenu nebo s `?t=demo` běží demo z `data/demo-guest.json`; s jiným tokenem stránka přesměruje na villarudolf.com.

Data: `node scripts/validate-trips.mjs` (totéž, co CI) a `node -e 'JSON.parse(require("fs").readFileSync("data/trips.json","utf8"))'`.
Po každé změně JS `node --check app.js`.

## Datový kontrakt (přečti před změnou `data/`)

`docs/datovy-kontrakt.md`. Zkratka: `id` výletu je trvalý veřejný klíč (QR na TV, forecast, hardcoded v jádru) —
nikdy se nepřejmenovává; `effort` = `easy|medium|hard`; `zone` = `villa|near|far` (délka výletu, ne dojezd);
texty vždy `{cs, de, en, pl}`; sezóna výletů `winter` 1. 12.–31. 3., `summer` 1. 4.–14. 10., mezi tím jen celoroční;
přidat pole = OK, přejmenovat/smazat = nejdřív PR v site. Soubory v `data/` se nepřejmenovávají, repo také ne.

## Nasazení a provoz

- **`main` = produkce.** Push do `main` → GitHub Actions nasadí na Pages **jen allowlist**
  (`index.html`, `app.js`, `track.js`, `sw.js`, `manifest.webmanifest`, `robots.txt`, `icons/`, `data/`, `fonts/`);
  `docs/`, `scripts/`, `supabase/`, `CLAUDE.md` se na web nedostanou. CI validuje `trips.json` a parsuje všechny JSON.
- Změny jdou přes větev a PR; **feature commity se nasazují až mergem/pushem z Macu** — na začátku session
  `git status -sb` a `git pull` (bot commituje 2× denně).
- **Počasí:** cron na Hetzneru `15 5,15 * * *` **UTC** (`/opt/vr-portal/refresh-weather.sh`: `git reset --hard origin/main`,
  `node scripts/fetch-forecast.mjs`, commit `chore: refresh forecast.json`, push deploy keyem přímo do `main`).
  Tyhle commity při čtení historie přeskakuj: `git log --invert-grep --grep='refresh forecast'`.
  Hetzner cron dělá **jen počasí** — purge tam byl 11. 10. 2026 zrušen (`ops/hetzner/`).
- Runbook (kontroly, co dělat když, klíče): `docs/provoz-runbook.md`.

## Tokeny hostů a data v DB (ověřeno 11. 10. 2026)

- Token **vzniká ve `/sprava/`** (site, `vr_admin_upsert_booking`): 48 hex z `gen_random_bytes(24)`;
  v DB `sha256(token)` pro ověření + `token_enc` (pgp_sym_encrypt admin klíčem) pro opětovné zobrazení odkazu;
  `expires_at = departure + 14 dní`. Host dostává `villarudolf.com/pruvodce/?t=…` v uvítací zprávě (T−7).
- `vr_verify_token(text)` vrací jméno, jazyk, termín, party — **bez `notes`** (od 11. 10. 2026).
  `vr_update_party(text,int,int[],text[])` (dnes ji nic nevolá – planner.js party jen čte; nechána pro budoucí
  úpravu party na webu); tříparametrová varianta je smazaná. Kontrakt: `supabase/schema.sql`.
- **Retence běží v DB přes pg_cron** `vr-purge-expired` 04:40 UTC: 30 dní po odjezdu anonymizace kontaktu
  (phone/email/door_code/notes/cleaning_note/token_enc pryč, token znehodnocen), výmaz pobytu po 6 letech
  (evidence osob ze zákona). Migrace `villa-rudolf-site/supabase/migrations/20261011_vr_purge_cron.sql`, nasazeno 11. 10. 2026.
  Kontrolní SQL v `docs/provoz-runbook.md`.
- Migrace se píšou do site, aplikují `supabase db query --linked --file …` (nebo konektor) a pak
  `notify pgrst, 'reload schema'` — bez toho PostgREST novou funkci nevidí (404). Projekt `fpknbrzbqpalguajskut`,
  sdílený se SINTERA (prefix `vr_`), region eu-west-2 (Londýn).
- Rozesílání zpráv hostům, denní e-mail, párování plateb řeší `/sprava/` a n8n v site; tady nic.
  Workflow `VrNewGuestWf001` (webhook) nikdy nic nevolalo — `docs/archiv/n8n-booking-ingest.md`.

## PII — pravidlo a co se stalo

**Žádné PII do repa.** Data hostů patří jen do Supabase. Platí i pro snímky auditů cen, poznámky o úklidu
a cenové dokumenty: rezervaci popisuj **termínem a počtem osob, nikdy jménem**. Před commitem
`git diff | grep -iE 'rezervace [A-ZÁ-Ž][a-zá-ž]+'`. Stránka má `noindex`, Umami je cookieless a token nezapisuje.

11. 10. 2026: audit našel křestní (2× celá) jména hostů v `docs/audit-cen/2026-08-12.*`, `docs/cenova-logika-2027-2028.md`,
`docs/cenovy-kalendar-2027-2028.md` a `docs/uklid-ical-2026-08.md` (dnes v `docs/archiv/`), od 13. 8. 2026. Odstraněno commitem `051c9c0`;
**v git historii veřejného repa zůstávají** — rozhodnutí o `git filter-repo` + force-push (a `reset --hard` klonu na Hetzneru)
je Pavlovo. Postup a incident: `docs/ochrana-udaju.md`, `SECURITY.md`.

## Ceník, texty, kanály

- **Ceník** `docs/cenik.json` + `scripts/cenik.mjs` (`plan`, `diff`, `poptavka`, `kalendar`). Před zápisem do extranetu
  vždy `node scripts/cenik.mjs plan`. Runbook auditu a asistovaného zápisu přes Chrome: `docs/cenova-parita-2027.md`
  sekce 4–5 (API kanálů nejsou, channel manager zamítnut — `docs/kanaly-jedno-misto.md`). Podle čeho ceny 2027/2028
  (prázdniny v `data/svatky.json`, indexace, dny × noci): `docs/cenova-logika-2027-2028.md`. Konvence: noc = datum, kdy host spí.
  **Hladiny 13 400 / 14 900 / Vánoce 18 000 / Silvestr 20 000 potvrzeny 21. 9. 2026** (`docs/cenovy-kalendar-2027-2028.md`,
  odkud hosté jezdí `docs/trhy-hostu-2026-09.md`).
- **Zápis do extranetů proběhl 5.–9. 10. 2026** (Booking/FeWo/Airbnb Vánoce + Silvestr + zima 2027 a léto 2028,
  e-chalupy a Megaubytko 9. 10.; mimosezóna na portálech zatím stará). **Živý stav je jen ve větvích PR #4
  (`claude/echalupy-cenik-932db6`) a PR #5 (`claude/megaubytko-cenik`)** — na `main` je `docs/STAV-cenik-2026-09-21.md`
  i `docs/cenik.json` (horizont, min. noci 6 o Vánocích, id Megaubytka) **zastaralý do jejich sloučení**. Pořadí: PR #3 → #4 → #5,
  #4 nerebasovat. Pasti zápisu (Booking plánovač přepisuje ceny, Airbnb 2 roky, FeWo konec kalendáře) jsou ve STAV na větvích.
- **Texty**: `docs/text-villa-rudolf.md` je zdroj pravdy (hlas, názvosloví, fakta, master text CZ+EN+DE v blocích A–L);
  všechno na kanálech se odvozuje odsud. Vzorem hlasu je web villarudolf.com (apartmá Suite, Pokoj 1–4, altán; DE tyká).
  **Opravený půdorys je v PR #3** (`claude/texty-hlas-webu`): apartmá **není v podkroví** (půlka 1. patra + 2 ložnice
  v podkroví), Pokoje 1–3 jsou v přízemí, obě kuchyně plnohodnotné — verze na `main` to má špatně.
- **Kanály**: audit popisů a stav distribuce `docs/popisy-na-kanalech.md` (Booking má dva objekty: `12558473 Villa Rudolf`
  živý, `353795 Rudolfův dvůr` zavřený), názvy `docs/nazev-na-kanalech.md`.

## Jazyk

Kód, komentáře i dokumentace česky. UI hostů cs/de/en/pl (`I18N` v `app.js`, fallback `de`); texty výletů
v `trips.json` jako `{cs, de, en, pl}`, všechny čtyři povinné. Piš pro Pavla: krátké věty, fakta, žádné marketingové fráze.
