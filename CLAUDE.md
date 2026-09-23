# Villa Rudolf – guest portal

> 🗺️ **Mapa celého systému Villa Rudolf:**
> [`villa-rudolf-site/MAPA-SYSTEMU.md`](https://github.com/pavelkubiznak/villa-rudolf-site/blob/main/MAPA-SYSTEMU.md)
> — **přečti ji dřív, než začneš.**
>
> ⚠️ **Tohle repo NENÍ hlavní systém.** Provozní jádro (web, admin `/sprava/`, evidence hostů,
> migrace databáze) žije v **`villa-rudolf-site`** na villarudolf.com. Role tohohle repa je dnes
> hlavně **zdroj dat o výletech a počasí** (`data/trips.json`, `data/forecast.json`).

Mobilní průvodce pro hosty vily. Statická PWA bez build kroku a bez frameworku:
jeden HTML soubor + JSON data + Supabase pro tokeny hostů. Běží OSTRÝ provoz.

Podrobný přehled architektury a stavu je v `README.md` — přečti si ho, než začneš měnit chování.

## Struktura

- `index.html` — **celá aplikace** (HTML + CSS + JS inline, ~740 řádků). Není build, není bundler.
  - `<style>` od ř. 16, SVG ikony (`<symbol id="i-…">`) od ř. 138, JS od ř. 166.
  - Doporučovací jádro: `partyFlags()`, `eligible()`, `scoreTrip()`, `whyBadges()`, `buildPlan()`.
  - Vykreslení: `render()` (~ř. 561). Mapa: `buildMapSection()` / `renderMapInner()`.
  - Filtrování: chipy + `applyFilter()` na konci souboru.
  - Karta výletu je `.trip`, nadpis `h3` (na tom závisí Umami tracking na konci souboru).
- `data/trips.json` — katalog výletů, **jediný zdroj pravdy**. Objekt s klíči `trips` (53 položek) a `food`.
  Tagy pro jádro: `outdoor`, `indoorOrCovered`, `rainOk`, `lovesHeat`, `needsClearLowWind`,
  `effort`, `stairs`, `minAge`, `bestFor`, `group`, `crossBorderId`, `category`, `zone`,
  `seasons` (`["summer"]`/`["winter"]`, chybí = celoročně; hranice zimy 15. 10. – 31. 3. jako na webu).
- `data/demo-guest.json` — ukázkový host pro `?t=demo`, bez reálných dat.
- `supabase/schema.sql` — tabulky `vr_bookings`, RPC `vr_verify_token` / `vr_update_party`.
  Zdroj pravdy schématu je ale `villa-rudolf-site/supabase/migrations/` — migrace piš tam,
  aplikuj `supabase db query --linked --file …` a pak `notify pgrst, 'reload schema'`
  (bez toho PostgREST novou funkci nevidí a vrací 404).
  Projekt `fpknbrzbqpalguajskut` (sdílený se SINTERA, proto prefix `vr_`).
- `scripts/fetch-forecast.mjs` — sběr počasí z yr.no, běží cronem na Hetzneru. Cron dělá před
  během `git reset --hard origin/main`, takže push z Macu ho nasadí sám; **feature commity
  se ale nasazují jen ručním pushem z Macu** — na začátku session kontroluj `git status -sb`.
- `docs/cenik.json` + `scripts/cenik.mjs` — **ceník = zdroj pravdy pro ceny, min. noci a horizont**
  na Booking/Airbnb/FeWo/e-chalupy. Zadání a runbook auditu i asistovaného zápisu přes Chrome:
  `docs/cenova-parita-2027.md` (API kanálů nejsou, channel manager zamítnut — `docs/kanaly-jedno-misto.md`).
  Snímky auditů v `docs/audit-cen/`. Před zápisem do extranetu vždy `node scripts/cenik.mjs plan`.
  **Podle čeho ceny na 2027/2028** (prázdniny DE/NL/BE/CZ v `data/svatky.json`, `cenik.mjs poptavka`,
  indexace, dny × noci, kontrola): `docs/cenova-logika-2027-2028.md`. Konvence: noc = datum, kdy host spí.
  **Hladiny 13 400 / 14 900 / Vánoce 18 000 / Silvestr 20 000 potvrzeny 21. 9. 2026** (`docs/cenovy-kalendar-2027-2028.md`,
  odkud hosté jezdí `docs/trhy-hostu-2026-09.md`). **Zápis do extranetů ještě NEPROBĚHL — stav a pořadí: `docs/STAV-cenik-2026-09-21.md`.**
- `docs/text-villa-rudolf.md` — **zdroj pravdy pro texty**: hlas a styl (co se smí a co ne),
  ověřená fakta a master text v češtině. Všechno na kanálech i na webu se odvozuje odsud,
  nikdy naopak. Distribuce a stav kanálů je v `docs/popisy-na-kanalech.md`.
- `docs/popisy-na-kanalech.md` — **audit popisů na Airbnb / Bookingu / FeWo / e-chalupách**
  (21. 9. 2026) + jednotné znění textů CZ/EN/DE a otevřené body. Fakta o objektu jsou tam
  potvrzená Pavlem; web `villa-rudolf-site/index.html` je zastaralejší. Booking má **dva objekty**:
  `12558473 Villa Rudolf` (živý) a `353795 Rudolfův dvůr` (zavřený, 4 nepřečtené zprávy) —
  popis si Booking generuje sám z vybavení, volný text je jen profil hostitele a house rules.
  Názvy objektu řeší `docs/nazev-na-kanalech.md`.
- `docs/n8n-booking-ingest.md` — dokumentace n8n workflow „VR – nový host". Pozor: je to
  **webhook, ne automat** (`POST /webhook/vr-new-guest` → `vr_create_booking`). Žádný Gmail
  trigger ani poller kanálů neexistuje — viz „Tokeny se nezakládají samy" níže.
- `sw.js` + `manifest.webmanifest` — PWA vrstva, relativní cesty kvůli GitHub Pages subpath.

## Jak to testovat

Otevři `index.html?t=demo` v prohlížeči — bez Supabase běží demo režim s daty
z `data/demo-guest.json`. Žádný server ani `npm install` není potřeba.

Reálný host se načítá přes `?t=<token>`; v Supabase je uložený jen `sha256(token)`.

## Na co si dát pozor

- **`data/forecast.json` needituj ručně.** Generuje ho cron na Hetzneru (`15 5,15 * * *`,
  `/opt/vr-portal/refresh-weather.sh`) a automaticky commituje. Před prací udělej `git pull`,
  jinak dostaneš konflikt. Commity `chore: refresh forecast.json` v historii jsou tenhle cron,
  ne skutečné změny — při čtení historie je přeskakuj.
- **Žádné PII do repa.** Data hostů patří jen do Supabase (EU). V repu je pouze demo host.
- Stránka má `noindex`, Umami je cookieless. Analytika je na konci `index.html`.
- Doporučovací logika v1 je záměrně jednoduchá. Vážení se ladí podle dat z Umami,
  ne od stolu.

## Stav doručování odkazu (důležité)

README krok 5: odkaz na portál se hostovi vkládá **ručně** do zprávy v extranetu
Booking.com, protože Booking.com nedává e-mail hosta a blokuje bot-odkazy.
**Automatické rozesílání přes WhatsApp v tomhle repu neexistuje** — slovo „whatsapp"
se tu nevyskytuje ani jednou. Pokud se na něm pracuje, je to na straně n8n na Hetzneru,
ne tady. Než začneš cokoliv programovat, ověř, co už v n8n stojí.

### Jak tokeny vznikají doopravdy (ověřeno 15. 9. 2026)

Workflow `VrNewGuestWf001` (webhook `vr-new-guest`) je slepá větev — nic ho nevolá, 0 spuštění.
**Tokeny ale nevznikají tudy.** Živá cesta je ve `villa-rudolf-site`:

1. Kalendář (`villa-booking-calendar`, iCal každé 3 h) publikuje `history.json` → každý pobyt má `uidh`.
2. `/sprava/` ho zobrazí jako „pobyt bez kontaktu“; majitel doplní jméno, jazyk, telefon.
3. `vr_admin_upsert_booking` založí řádek v `vr_bookings` **a vygeneruje token** (48 hex).
   Od 15. 9. 2026 se ukládá i zašifrovaný admin klíčem (`token_enc`), takže odkazy
   `/pruvodce/?t=` a `/registrace/?t=` jdou zobrazit na každém zařízení bez regenerace.
4. Odkaz na průvodce je od 15. 9. 2026 součástí uvítací zprávy (T−7) — dřív se neposílal vůbec.

Stav 15. 9. 2026: všech 25 potvrzených pobytů v kalendáři má rezervaci s tokenem. Šest pobytů
bez rezervace jsou servisní bloky (rekonstrukce schodů) a nepotvrzené termíny bez smlouvy —
podle `verified.json` kalendáře správně bez hosta. Denní e-mail (`VrDailyTasks`) hlásí nový
nespárovaný pobyt od T−35 (potvrzení jde v T−30).

Gmail jako zdroj dat nestačí (ověřeno 12. 9. 2026): Booking mailuje jen číslo rezervace,
Airbnb o rezervacích nemailuje, FeWo posílá vlákna zájemců. Jméno hosta se bere z extranetu
ručně při zakládání ve `/sprava/` — to je jediný ruční krok a zatím není co automatizovat.

**Hosté dostávají `villarudolf.com/pruvodce/?t=…`** (planner v site čte `trips.json` a
`forecast.json` odsud), ne `pavelkubiznak.github.io/villa-rudolf-portal/`. Změny v `index.html`
tohoto repa vidí jen hosté se starým odkazem.

## Jazyk

Kód, komentáře i dokumentace jsou česky. Uživatelské rozhraní je vícejazyčné
(`I18N`, hosté cs/de/en) — texty výletů jsou v `trips.json` jako objekty `{cs, de, en}`.
