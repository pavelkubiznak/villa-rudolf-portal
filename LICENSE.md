# Licence

Tohle **není open-source repozitář.** Je veřejný proto, aby z něj GitHub Pages mohly servírovat data
pro villarudolf.com a TV ve vile, ne proto, aby se obsah přebíral.

## Kód, texty a data

© 2026 Sintera Czech s.r.o. / Pavel Kubizňák. **Všechna práva vyhrazena.**

Platí pro `index.html`, `app.js`, `track.js`, `sw.js`, `scripts/`, `supabase/`, `docs/` (včetně `docs/cenik.json`
a `docs/text-villa-rudolf.md`), `data/trips.json` (texty a tagy výletů ve čtyřech jazycích), `data/svatky.json`,
`data/demo-guest.json`, `icons/` a `manifest.webmanifest`.

Bez písemného souhlasu nesmí nikdo tyhle soubory kopírovat, upravovat, šířit ani provozovat jinde než
v rámci systému Villa Rudolf. Čtení, forkování pro účely pull requestu do tohoto repa a odkazování
na `https://pavelkubiznak.github.io/villa-rudolf-portal/data/…` z vlastních stránek Villy Rudolf je v pořádku.

Pokud by Pavel chtěl kód pustit pod otevřenou licencí (např. MIT), stačí tenhle oddíl přepsat — jádro
doporučení je v site repu stejně jen „převzatá sémantika", ne kopie souboru.

## Výjimka: fotografie v `data/img/`

Fotky výletů jsou z Wikimedia Commons pod licencemi Creative Commons a **zůstávají pod nimi**.
Zmenšené na šířku 1024 px (jinak beze změny) skriptem `scripts/fotky.py`. Autoři a odkazy na originál:
[`data/img/FOTKY.md`](data/img/FOTKY.md) a pole `photo` v `data/trips.json`.

| Soubor | Autor | Licence | Změny |
|---|---|---|---|
| `data/img/baumwipfelpfad.jpg` | Susankovav (Wikimedia Commons) | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) | zmenšeno na 1024 px |
| `data/img/janske-hallenbad.jpg` | ŠJů (Wikimedia Commons) | [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) | zmenšeno na 1024 px |

Kdo fotku zobrazuje (site `planner.js`, `tv/tv.js`), musí u ní uvést autora, licenci (s odkazem) a že je upravená —
`photo.credit` v `trips.json` to nese. Nová fotka = nový řádek v `FOTKY.md` i tady, a jen CC BY / CC BY-SA / CC0.

## Výjimka: písma ve `fonts/`

Spectral a Instrument Sans (dřív načítané z Google Fonts, od 11. 10. 2026 self-hostované ve `fonts/`)
jsou pod [SIL Open Font License 1.1](https://openfontlicense.org/). Soubory licence jsou u písem ve `fonts/`.

## Data třetích stran

- Počasí v `data/forecast.json` pochází z MET Norway (api.met.no / yr.no), licence
  [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — uvedení zdroje je v průvodci v patičce
  („počasí: yr.no") a v poli `source` souboru.
- Prázdniny v `data/svatky.json` jsou veřejné údaje ministerstev školství (DE, NL, BE, CZ), zpracované ručně.
