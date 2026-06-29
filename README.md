# Villa Rudolf – guest portal (Fáze 1)

Mobilní, osobní průvodce pro hosty. Generuje se z dat (1 šablona, žádné HTML per host),
počasí živě z yr.no (serverově cachované), doporučovací jádro řadí výlety podle
**počasí × věku dětí × velikosti skupiny**, analytika přes self-hosted Umami.

## Co je hotové (běží hned v demo režimu)
- `index.html` — mobilní aplikace průvodce (čte `?t=<token>`; bez Supabase = demo).
- `data/trips.json` — katalog výletů + tagy pro jádro (jeden zdroj pravdy).
- `data/forecast.json` — počasí z yr.no (generuje `scripts/fetch-forecast.mjs`).
- `data/demo-guest.json` — ukázkový host (`?t=demo`), žádná reálná data.
- `scripts/fetch-forecast.mjs` — serverový sběr počasí (cron, respektuje ToS met.no).
- `supabase/schema.sql` — tabulka `bookings` + token RPC `verify_token` / `update_party`.

Demo: otevři `index.html?t=demo`.

## Architektura
Booking.com → Gmail → **n8n** (parse + token + návrh zprávy) → **Supabase** (`bookings`,
jen hash tokenu) → **statická stránka** (Cloudflare/GitHub Pages) čte přes token →
**jádro** (počasí × věk × skupina) → výpis. Počasí dodává **cron** (`forecast.json`),
návštěvy/kliky měří **Umami**. Jediný ruční krok: vložení odkazu do zprávy na Booking.com.

## Kroky k ostrému provozu
1. **Hosting:** nasaď tuto složku na GitHub Pages nebo Cloudflare Pages (doména je na Cloudflare).
2. **Supabase:** založ projekt v EU, spusť `supabase/schema.sql`. Do `index.html` → `CFG`
   doplň `SUPABASE_URL` a `SUPABASE_ANON_KEY` (anon key, RLS chrání data).
3. **Počasí cron:** na Hetzneru `node scripts/fetch-forecast.mjs` přes cron 2×/den a
   výsledný `forecast.json` publikuj (commit do repa nebo servíruj přes Caddy s CORS).
4. **n8n ingest:** workflow na Gmail trigger (Booking.com): naparsuj jméno/termín/počty,
   vyrob `RAW_TOKEN`, ulož `sha256(token)` do `bookings`, sestav URL `…/?t=RAW_TOKEN`
   a **připrav uvítací zprávu v jazyce hosta** (Gmail draft / tlačítko v owner dashboardu).
5. **Doručení odkazu:** vlož odkaz do zprávy hostovi v extranetu Booking.com (1 copy-paste),
   nebo QR karta ve vile. (Booking.com nedává e-mail hosta a blokuje bot-odkazy — proto ruční vložení.)

## Doporučovací jádro (kde co měnit)
- Tagy výletů: `data/trips.json` (`outdoor`, `indoorOrCovered`, `rainOk`, `lovesHeat`,
  `needsClearLowWind`, `effort`, `stairs`, `minAge`, `bestFor`, `group`, `crossBorderId`).
- Logika skóre a tvrdé filtry: `scoreTrip()` / `eligible()` v `index.html`.
- v1 je záměrně jednoduchá (hezky→ven, déšť→pod střechu + pár tvrdých pravidel);
  vážení dolaď podle dat z Umami.

## Bezpečnost / GDPR
- Hostova data jen v Supabase (EU), v repu žádné PII. Ukládá se jen hash tokenu.
- `expires_at` (departure + 30 dní) → odkaz po pobytu přestane platit; cron maže staré.
- Stránka má `noindex`; Umami je cookieless.
