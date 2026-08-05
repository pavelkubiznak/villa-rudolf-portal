# Propojení kalendáře a portálu — zadání

Stav k 4. 8. 2026. Zadání pro modul vkládání kontaktů hostů, aby nevznikla třetí evidence
téhož pobytu. Analýza a rozhodnutí; **není to hotový kód**.

Související: [`n8n-booking-ingest.md`](n8n-booking-ingest.md) (jak dnes vzniká host),
[`evidence-hostu-a-poplatek.md`](evidence-hostu-a-poplatek.md) (evidence a poplatek),
kalendář: repo `pavelkubiznak/villa-booking-calendar`, jeho `CLAUDE.md` a `docs/CLAUDE-HANDOFF.md`.

## 1. Problém: pobyt existuje dvakrát a nic ho nespojuje

| | Kalendář `data/history.json` | Portál `vr_bookings` |
|---|---|---|
| Odkud | automaticky z iCal, Action každé 3 h | ručně — majitel spustí n8n webhook |
| Klíč | `uidh` = prvních 16 hex znaků `sha256(UID)` | `booking_ref`, `token_hash` |
| Obsah | `start`, `end`, `platform`, `stale` | jméno, jazyk, termín, dospělí, děti |
| Jména hostů | **žádná** (schválně anonymizováno) | ano (PII, jen v Supabase) |
| Spojka na to druhé | ❌ | ❌ |

Důsledky, které to dnes působí:

1. **Dvojí zadávání.** Termín přijde do kalendáře sám; do n8n ho majitel přepisuje ručně.
2. **Rozejití.** Host posune termín na Bookingu → iCal se opraví, `vr_bookings` zůstane starý.
   Portál pak hostovi ukazuje špatné datum a registrační formulář by měl špatné `min`/`max`.
3. **Neúplná evidence.** `vr_bookings` obsahuje jen pobyty, kterým majitel vyrobil token.
   Úplný seznam pobytů má **kalendář** — a ten je potřeba pro doložení poplatku z pobytu
   (viz `evidence-hostu-a-poplatek.md`, bod 7: „pobyt, který se nezaregistroval vůbec").

## 2. Rozdělení pravdy

Nesjednocovat do jedné databáze. Rozdělit podle toho, kdo daný fakt zná spolehlivěji:

| Fakt | Vlastník | Proč |
|---|---|---|
| **KDY** — termín, platforma | kalendář (iCal) | přichází automaticky z platforem, nikdo to nepřepisuje |
| **KDO** — jméno, kontakt, jazyk, složení skupiny, token, evidence osob | Supabase `vr_*` | ruční / od hosta, PII, musí být privátní |
| **KOLIK** — ceny, tržby | `owner.html` (šifrovaně) | zůstává, kam patří; sem nezasahovat |

Spojka: **`ical_uidh`** v `vr_bookings`.

`uidh` je deterministický a jednosměrný (`sha256(UID)[:16]`), takže se dá počítat na obou
stranách nezávisle a **neprozrazuje** původní UID ani hosta. Je proto bezpečné mít ho
i ve veřejném `history.json` — což už tam je.

## 3. Datový model

```sql
alter table public.vr_bookings
  add column if not exists ical_uidh text
    check (ical_uidh is null or ical_uidh ~ '^[0-9a-f]{16}$');

-- jeden pobyt z kalendáře = nejvýš jedna rezervace v portálu
create unique index if not exists vr_bookings_ical_uidh_uq
  on public.vr_bookings (ical_uidh)
  where ical_uidh is not null;

comment on column public.vr_bookings.ical_uidh is
  'Spojka na kalendář: prvních 16 hex znaků sha256(iCal UID). NULL = pobyt bez protějšku ve feedu.';
```

**Nullable schválně** — přímá rezervace, kterou platforma nezná, portál mít může.

**Termín se v `vr_bookings` nechává** (`arrival` / `departure`), aby portál a `vr_verify_token`
fungovaly samostatně bez čtení kalendáře. Je to ale **kopie pořízená při založení**, ne pravda:
při neshodě vyhrává kalendář a modul to musí nahlásit (bod 6).

## 4. Jak modul čte kalendář

Kalendář je statický a veřejný, GitHub Pages posílá `Access-Control-Allow-Origin: *`:

```
https://pavelkubiznak.github.io/villa-booking-calendar/data/history.json
```

Formát položky (anonymizovaný, bez PII — proto ho smí číst i veřejná stránka):

```json
{ "uidh": "30fa80afc7c4aae6", "start": "2028-05-25", "end": "2028-05-28",
  "platform": "E-chalupy", "firstSeen": "2026-08-04", "lastSeen": "2026-08-04", "stale": false }
```

- `start` = příjezd, `end` = **odjezd** (poslední noc je `end-1`), počet nocí = `end − start`.
- `platform` ∈ `Airbnb | Booking.com | E-chalupy | Fewo-direkt`.
- `stale: true` = záznam už není v živém feedu (zrušený, propadlý — **nebo** ho hub odmítl
  uložit kvůli překryvu). Ve výběru pobytů je **zobrazit odlišeně, ne skrýt**.

**Cache:** `raw.githubusercontent` ~5 min, Pages ~10 min. Číst přes Pages URL s `?_=<timestamp>`.

## 5. Průběh zadání kontaktu (cílový)

```
1. Modul načte history.json  →  seznam nadcházejících pobytů
2. Majitel VYBERE pobyt      →  „25.–28. 5. 2028 · E-chalupy · 3 noci"
                                 (termín, platforma a uidh se doplní samy)
3. Majitel vyplní jen         →  jméno, jazyk, kontakt, dospělí/děti
4. Zápis do Supabase          →  vr_bookings včetně ical_uidh
5. Modul vrátí                →  odkaz ?t=<rawToken> + uvítací text (jako dnes n8n)
```

Tím zmizí dvojí psaní i rozejití: **termín se nikdy netypuje ručně.**

Seznam pobytů ať rovnou ukazuje stav, ne jen datum:

- ✅ **má kontakt** — `ical_uidh` už v `vr_bookings` je
- ⬜ **bez kontaktu** — pobyt v kalendáři je, evidence chybí ← tady je práce
- ⚠️ **stale** — v živém feedu chybí, ověřit v extranetu
- ❗ **termín se rozešel** — kalendář má jiná data než `vr_bookings`

## 6. Kudy modul zapisuje — ROZHODNUTO: varianta A (5. 8. 2026)

> **Rozpracované implementační zadání: [`modul-kontaktu.md`](modul-kontaktu.md).**

**Překážka (ověřeno 4. 8. 2026):** n8n poslouchá jen na `127.0.0.1:5678` a nemá routu v Caddy.
**Stránka běžící v prohlížeči se na dnešní webhook nedostane.** Bez vyřešení tohohle bodu
modul nemůže nic zapsat. Tři cesty:

| | Varianta | Pro | Proti |
|---|---|---|---|
| **A** ⭐ | Modul volá **Supabase RPC přímo** (`vr_create_booking`), ingest secret zadá majitel jednou a drží se v jeho `localStorage` | žádná změna na serveru; stejný vzor jako token v `owner.html`; funguje z mobilu i odkudkoli | secret žije v prohlížeči majitele (blast radius: jen zakládání rezervací) |
| **B** | Vystavit n8n webhook přes Caddy na HTTPS + auth | logika zůstane v n8n, jedno místo | otevírá n8n do internetu, nutná autentizace a údržba |
| **C** | Modul jen na tailnetu (jako radar) | nic není veřejné | n8n je na `127.0.0.1`, i tailnet potřebuje proxy; nefunguje mimo tvá zařízení |

**Zvoleno: A.** Modul je statická stránka bez backendu — stejná situace jako `owner.html`,
kde se tenhle vzor osvědčil. n8n zůstane pro jiné automatizace; zakládání hosta se přesune
do modulu. Pokud A, je potřeba **`vr_create_booking` rozšířit o `p_ical_uidh`**.

## 7. Hraniční případy

| Situace | Chování |
|---|---|
| Pobyt v kalendáři chybí (přímá rezervace) | Založit s `ical_uidh = NULL`, ručně zadaný termín. Povoleno. |
| Platforma přegeneruje UID | `uidh` se změní → starý pobyt zmizí, nový přibude bez kontaktu. Modul nabídne **spárovat s existující rezervací** podle shody `start`/`end`/`platform`. |
| Termín se v kalendáři změnil | Nepřepisovat automaticky. Označit ❗ a nechat majitele potvrdit — host už mohl dostat odkaz se starým datem. |
| Pobyt je `stale` | Zobrazit s varováním, nezakazovat. Stale ≠ zrušeno (hub odmítá import přes překryv). |
| **Překryv dvou rezervací** | Dva různé `uidh` na stejné noci → **dvě samostatné evidence hostů**, ne jedna. Nespojovat. |
| Rezervace zrušena | Kontakt v Supabase nechat (evidence hostů má retenci 6 let), jen označit. Viz `vr_purge_expired`. |

## 8. Návaznost na evidenci hostů a poplatek

Až bude `ical_uidh` na místě, dá se **jedním pohledem doložit úplnost evidence**:
seznam pobytů z kalendáře `LEFT JOIN` evidence → „tyhle pobyty nemají registrované hosty".
To je přesně díra, kterou `evidence-hostu-a-poplatek.md` v bodě 7 označuje jako
dnes nezjistitelnou.

⚠️ **Kalendář ale ještě není spolehlivý zdroj úplnosti.** Čte se jen feed od e-chalup, které
fungují jako hub a **odmítají uložit rezervaci překrývající existující** — platná rezervace
z jiného kanálu se tak do feedu nedostane vůbec (doloženo: 3.–10. 7. 2027, Booking.com).
Než se kalendář použije jako podklad pro poplatek, musí proběhnout krok
**„číst 4 feedy zvlášť místo hubu"** (viz `CLAUDE.md` kalendáře). **Tohle je společný základ
obou projektů, ne kosmetika kalendáře.**

## 9. Nesrovnalosti nalezené při analýze

- **`supabase/schema.sql` je pozadu za živou databází.** Nejsou v něm `vr_create_booking`
  ani `vr_purge_expired`, přestože je `n8n-booking-ingest.md` popisuje jako funkční.
  Doplnit, jinak schéma v repu neodpovídá realitě a migrace se budou psát naslepo.
- **Klon portálu byl 4. 8. 2026 dvanáct commitů pozadu** s rozpracovanými změnami
  v `data/trips.json` a `index.html`. Před prací `git pull` (cron s počasím commituje sám).

## 10. Co ověřit

- [x] ~~Rozhodnout variantu zápisu z bodu 6~~ → **A**, rozpracováno v `modul-kontaktu.md`.
- [ ] Doplnit `vr_create_booking` / `vr_purge_expired` do `schema.sql`.
- [ ] Ověřit, že `vr_create_booking` jde rozšířit o `p_ical_uidh` bez rozbití n8n workflow
      (starý workflow parametr neposílá → musí mít default `null`).
- [ ] Rozmyslet, zda má modul umět i **opravu** existující rezervace, nebo jen zakládání.

## 11. Zásady, které tímhle nesmí padnout

1. **Žádné PII do žádného repa.** Kalendář je veřejný a anonymizovaný; jména hostů patří
   výhradně do Supabase. `uidh` je jednosměrný hash — sdílet ho lze, původní UID ne.
2. **Kalendář nesmí začít číst Supabase.** Úklidový pohled je veřejný; kdyby sahal na
   rezervace s PII, unikla by jména. Spojení se dělá **v modulu / na straně majitele**.
3. Supabase neumí číst `history.json` — join probíhá v klientovi, ne v databázi.
   Počítat s tím při návrhu (žádný SQL `join` napříč systémy neexistuje).
