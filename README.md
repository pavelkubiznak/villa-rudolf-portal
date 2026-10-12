# Villa Rudolf – portal

Datový sklad pro systém Villy Rudolf (Svoboda nad Úpou, Krkonoše) a demo průvodce pro hosty.
Žádný build, žádný framework, žádné npm závislosti. Veřejné repo, GitHub Pages:
`https://pavelkubiznak.github.io/villa-rudolf-portal/`.

Kde co v celém systému běží, říká [`villa-rudolf-site/MAPA-SYSTEMU.md`](https://github.com/pavelkubiznak/villa-rudolf-site/blob/main/MAPA-SYSTEMU.md).
Pravidla pro práci v tomhle repu: [`CLAUDE.md`](CLAUDE.md). Index dokumentace: [`docs/README.md`](docs/README.md).

## Co tu žije

| Co | Soubory | Kdo to čte |
|---|---|---|
| Katalog výletů a restaurací (4 jazyky, tagy pro doporučení) | `data/trips.json`, fotky `data/img/` | villarudolf.com `/pruvodce/`, `/vylety/`, homepage, `/tv/`, `/k/`; demo tady |
| Počasí pro vilu a každý výlet (9 dní, yr.no) | `data/forecast.json` ← `scripts/fetch-forecast.mjs` (cron 2× denně) | totéž |
| Ceník — ceny, min. noci, horizont, výjimky pro všechny kanály | `docs/cenik.json`, `scripts/cenik.mjs`, prázdniny `data/svatky.json` | web (`site/tools/gen-cenik-web.mjs`), runbook zápisu do extranetů |
| Texty objektu a stav na kanálech | `docs/text-villa-rudolf.md`, `docs/popisy-na-kanalech.md`, `docs/nazev-na-kanalech.md` | Airbnb / Booking / FeWo / e-chalupy ručně, `site/tv/texty.js` |
| Snímky auditů cen | `docs/audit-cen/` | `scripts/cenik.mjs diff` |
| Demo průvodce (PWA) | `index.html`, `app.js`, `track.js`, `sw.js`, `manifest.webmanifest`, `fonts/`, `icons/` | kdokoli na `?t=demo`; host s reálným tokenem je přesměrován na `villarudolf.com/pruvodce/?t=…` |

Průvodce, který hosté skutečně používají, je `villarudolf.com/pruvodce/` (site `assets/planner.js`). Tady je jeho
demo a druhá kopie doporučovacího jádra (`partyFlags` → `eligible` → `scoreTrip` → `whyBadges` → `buildPlan`).

## Jak tečou data

```
platformy (Booking · Airbnb · FeWo · e-chalupy · Megaubytko)
   │ iCal
   ▼
villa-booking-calendar ── history.json (uidh, termín, platforma; bez jmen) ──▶ villa-rudolf-site /sprava/
                                                                                 │ jméno, kontakt, token (48 hex)
                                                                                 ▼
                                                                           Supabase vr_* (PII, EU-West-2)
                                                                                 ▲ vr_verify_token / vr_update_party
                                                                                 │
villa-rudolf-portal  data/trips.json + data/forecast.json ──────────────▶ villarudolf.com /pruvodce/ /vylety/ /tv/ /k/
                     docs/cenik.json ──(gen-cenik-web.mjs, build)──────▶ villarudolf.com homepage (ceny)
```

Tenhle repo nic ze site ani z kalendáře nečte a do Supabase nezapisuje. Retenci dat hostů dělá pg_cron v DB
(anonymizace 30 dní po odjezdu, výmaz po 6 letech) — nasazeno ze site 11. 10. 2026.

## Spuštění dema

```bash
python3 -m http.server 8767
open http://localhost:8767/?t=demo
```

`fetch()` a service worker potřebují http; z `file://` se data nenačtou. Bez Supabase, bez instalace.

## Validace dat

```bash
node scripts/validate-trips.mjs          # trips.json proti data/trips.schema.json (totéž běží v CI)
node --check app.js                      # po každé změně JS
node scripts/cenik.mjs plan              # před zápisem cen do extranetu
```

Co je v datech povinné, jaké hodnoty smí mít a co se nesmí přejmenovat: [`docs/datovy-kontrakt.md`](docs/datovy-kontrakt.md).
`data/forecast.json` se needituje ručně a nepatří do PR (generuje bot).

## Nasazení

`main` = produkce. Push do `main` spustí GitHub Actions, které na Pages publikují jen allowlist
(`index.html`, `app.js`, `track.js`, `sw.js`, `manifest.webmanifest`, `robots.txt`, `icons/`, `data/`, `fonts/`);
`docs/`, `scripts/`, `supabase/` a `CLAUDE.md` na web nejdou. CI před tím validuje `trips.json` a parsuje všechny JSON.
Změny jdou přes větev a PR. Cron počasí pushuje `chore: refresh forecast.json` přímo do `main` 2× denně —
před prací `git pull`. Hosté vidí změnu dat se zpožděním až ~6 h (cache webu), viz datový kontrakt.

## Provoz

Co běží kde (Pages, cron počasí na Hetzneru, pg_cron v Supabase, zálohy, hlídač), týdenní kontroly a postupy
„když…" (forecast zestárl, push odmítnut, Pages neběží, rotace deploy keye, přepis historie):
[`docs/provoz-runbook.md`](docs/provoz-runbook.md).

## Bezpečnost a GDPR

- Co je veřejné záměrně (anon klíč, Umami id, `data/` jako API), co do repa nikdy nepatří, model tokenu a rotace
  klíčů: [`SECURITY.md`](SECURITY.md). Hlášení: `rezervace@villarudolf.com`.
- Správce, záznam o činnostech, zpracovatelé (Supabase UK, GitHub/Fastly, Hetzner, Google), lhůty
  (token 14 dní po odjezdu, kontakt 30 dní, evidence 6 let), žádosti hostů a postup při incidentu:
  [`docs/ochrana-udaju.md`](docs/ochrana-udaju.md).
- **Žádné PII v repu.** Jména hostů, která se tu od 12. 8. 2026 objevila v auditech cen a cenových poznámkách, byla
  11. 10. 2026 odstraněna (`b199822`) a tentýž den byla **přepsána historie všech větví** (`git filter-repo`), takže v repu
  nejsou ani zpětně. Staré commity drží jen cache GitHubu do vyřízení ticketu u GitHub Support (`docs/ochrana-udaju.md` kap. 7).
- Licence: kód, texty a data © Sintera Czech s.r.o. / Pavel Kubizňák, všechna práva vyhrazena; fotky CC BY / CC BY-SA 4.0,
  písma SIL OFL — [`LICENSE.md`](LICENSE.md).
