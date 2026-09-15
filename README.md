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
- `supabase/schema.sql` — tabulka `vr_bookings` + token RPC `vr_verify_token` / `vr_update_party`.

Demo: otevři `index.html?t=demo`.

## Architektura
Rezervace (extranet) → **token** v **Supabase** (`vr_bookings`, jen hash tokenu; dnes se
zakládá ručně, viz níže) → **statická stránka** (GitHub Pages) čte přes token →
**jádro** (počasí × věk × skupina × sezóna) → výpis. Počasí dodává **cron** (`forecast.json`),
návštěvy/kliky měří **Umami**. Ruční kroky: založení tokenu a vložení odkazu do zprávy hostovi.

## Kroky k ostrému provozu
1. **Hosting:** nasaď tuto složku na GitHub Pages nebo Cloudflare Pages (doména je na Cloudflare).
2. **Supabase:** HOTOVO (2026-07-05) — schéma `vr_bookings` + `vr_verify_token`/`vr_update_party`
   běží v projektu `fpknbrzbqpalguajskut` (sdílený, vr_ prefix); CFG v `index.html` je zapojené.
3. **Počasí cron:** HOTOVO (2026-07-05) — `/opt/vr-portal/refresh-weather.sh` na Hetzneru,
   cron `15 5,15 * * *`, push přes deploy key, log `/var/log/vr-weather.log`.
4. **Ingest tokenů: NENÍ automatický** (ověřeno 12. 9. 2026). Workflow „VR – nový host" je jen
   webhook bez volajícího a Gmail jako zdroj nestačí (Booking neposílá jméno ani termín, Airbnb
   nemailuje vůbec) — podrobně v `CLAUDE.md`. Tokeny se zakládají ručně přes `vr_create_booking`;
   budoucí ingest musí brát data z extranetu, ne z mailu.
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
