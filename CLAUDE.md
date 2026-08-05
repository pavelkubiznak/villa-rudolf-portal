# Villa Rudolf – guest portal

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
- `data/trips.json` — katalog výletů, **jediný zdroj pravdy**. Objekt s klíči `trips` (49 položek) a `food`.
  Tagy pro jádro: `outdoor`, `indoorOrCovered`, `rainOk`, `lovesHeat`, `needsClearLowWind`,
  `effort`, `stairs`, `minAge`, `bestFor`, `group`, `crossBorderId`, `category`, `zone`.
- `data/demo-guest.json` — ukázkový host pro `?t=demo`, bez reálných dat.
- `supabase/schema.sql` — tabulky `vr_bookings`, RPC `vr_verify_token` / `vr_update_party`.
  Projekt `fpknbrzbqpalguajskut` (sdílený se SINTERA, proto prefix `vr_`).
- `scripts/fetch-forecast.mjs` — sběr počasí z yr.no, běží cronem na Hetzneru.
- `docs/n8n-booking-ingest.md` — dokumentace n8n workflow (Booking.com → Gmail → token).
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

## Jazyk

Kód, komentáře i dokumentace jsou česky. Uživatelské rozhraní je vícejazyčné
(`I18N`, hosté cs/de/en) — texty výletů jsou v `trips.json` jako objekty `{cs, de, en}`.
