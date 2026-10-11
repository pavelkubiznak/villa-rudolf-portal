# docs/ — index

Status: **živý** = popisuje dnešní stav, drž ho aktuální · **runbook** = postup, podle kterého se pracuje ·
**data** = zdroj pravdy čtený skripty nebo webem · **archiv** = historie, podle které se nic nestaví.

| Soubor | Status | Co to je |
|---|---|---|
| [`datovy-kontrakt.md`](datovy-kontrakt.md) | živý | kdo čte `trips.json` / `forecast.json` / `cenik.json`, povinná pole, enumy, sezóny, `id` jako trvalý klíč, latence |
| [`provoz-runbook.md`](provoz-runbook.md) | runbook | co běží kde (Pages, cron počasí, pg_cron, zálohy), kontroly, co dělat když…, přístupy |
| [`ochrana-udaju.md`](ochrana-udaju.md) | živý | správce, záznam o činnostech, zpracovatelé, lhůty, žádosti subjektů, incidenty, rozhodnutí pro Pavla |
| [`cenik.json`](cenik.json) | **data** | ceník = zdroj pravdy pro ceny, min. noci, horizont a výjimky na všech kanálech; čte `scripts/cenik.mjs` a web (`site/tools/gen-cenik-web.mjs`) |
| [`STAV-cenik-2026-09-21.md`](STAV-cenik-2026-09-21.md) | živý ⚠️ | stav zápisu cen do extranetů. **Na `main` zastaralý** („zápis neproběhl") — zápis běží od 5. 10. 2026 a aktuální verze je ve větvích PR #4 (`claude/echalupy-cenik-932db6`) a #5 (`claude/megaubytko-cenik`) do jejich sloučení |
| [`cenova-parita-2027.md`](cenova-parita-2027.md) | runbook | audit a asistovaný zápis cen přes Chrome (sekce 4–5 jsou postup; sekce 0–3, 7–8 jsou rozhodnutí z 8.–9. 2026, čísla překonána ceníkem 21. 9.) |
| [`cenova-logika-2027-2028.md`](cenova-logika-2027-2028.md) | živý | podle čeho ceny 2027/2028: prázdniny DE/NL/BE/CZ, indexace, dny × noci, kontrola, model čistého výnosu |
| [`cenovy-kalendar-2027-2028.md`](cenovy-kalendar-2027-2028.md) | živý | rozhodnutí A–D z 21. 9. 2026 a referenční tabulka úseků (sekce 2) |
| [`trhy-hostu-2026-09.md`](trhy-hostu-2026-09.md) | živý | odkud hosté jezdí (agregáty z domovní knihy) a jejich alternativy |
| [`text-villa-rudolf.md`](text-villa-rudolf.md) | živý | zdroj pravdy pro texty: hlas, fakta o domě, master text CZ+EN+DE. **Opravený půdorys je v PR #3** (`claude/texty-hlas-webu`); verze na `main` má chybné „podkrovní apartmán" |
| [`popisy-na-kanalech.md`](popisy-na-kanalech.md) | živý | audit popisů na Airbnb / Booking / FeWo / e-chalupy, mapování bloků na pole kanálů, stav distribuce (6a) |
| [`nazev-na-kanalech.md`](nazev-na-kanalech.md) | živý | název objektu na kanálech — rozhodnuto 21. 9. 2026, Airbnb zapisuje Pavel |
| [`kanaly-jedno-misto.md`](kanaly-jedno-misto.md) | živý (sekce 1–2) | rozhodnutí „channel manager zamítnut" (13. 8. 2026), provize a měny kanálů; sekce 3 (iCal hub) je historie |
| [`cenik-2027.template.json`](cenik-2027.template.json) | archiv | původní šablona ceníku, nic ji nečte; jen pro srovnání s pravidlovým formátem `cenik.json` |
| `audit-cen/` | data | snímky auditů cen (`<datum>.json/.html`, `konkurence-regiony-…json`) + nástroj `build-prehled.mjs` / `prehled.tpl.html` (`node docs/audit-cen/build-prehled.mjs 2026-08-12`). Bez jmen hostů (redakce 11. 10. 2026) |
| `archiv/` | archiv | viz níže |

## archiv/

Každý soubor má na začátku banner, co konkrétně neplatí a kde je živý stav. Nic z toho neimplementuj.

| Soubor | Platilo | Nahrazeno |
|---|---|---|
| [`archiv/n8n-booking-ingest.md`](archiv/n8n-booking-ingest.md) | nikdy neběželo (0 spuštění) | tokeny z `/sprava/` v site (`vr_admin_upsert_booking`) |
| [`archiv/modul-kontaktu.md`](archiv/modul-kontaktu.md) | návrh 5. 8. 2026 | `/sprava/` v site |
| [`archiv/propojeni-kalendar-portal.md`](archiv/propojeni-kalendar-portal.md) | návrh 4. 8. 2026 | spojka `uidh` ve `/sprava/` |
| [`archiv/uklid-ical-2026-08.md`](archiv/uklid-ical-2026-08.md) | 13. 8. – 17. 9. 2026 | výstupní feedy `villa-booking-calendar` (site STAV.md) |
| [`archiv/evidence-hostu-a-poplatek.md`](archiv/evidence-hostu-a-poplatek.md) | návrh 30. 7. 2026 | `/registrace/` + `vr_persons`, UbyPort, poplatek v site |

## Pravidla pro docs/

- **Žádná jména hostů** — ani v auditech, ani v poznámkách. Rezervace = termín + počet osob. Před commitem
  `git diff | grep -iE 'rezervace [A-ZÁ-Ž][a-zá-ž]+'`.
- Nový dokument = řádek sem a status. Dokument, který přestal platit, jde do `archiv/` s bannerem, ne do koše.
- Datum v názvu souboru jen u snímků (`audit-cen/2026-08-12.json`). Živé dokumenty mají datum v hlavičce
  („Stav k …"), ne v názvu — `STAV-cenik-2026-09-21.md` je výjimka k přejmenování po sloučení PR #4/#5.
- Čísla řádků a počty (53 výletů…) se nepíšou natvrdo; odkazuj na funkce a soubory.
