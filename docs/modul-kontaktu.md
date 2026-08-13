# Modul vkládání kontaktů hostů — implementační zadání — NEPLATNÉ

> ## ⛔ NEPLATNÉ ZADÁNÍ (13. 8. 2026)
>
> **Tohle už existuje a běží.** Modul vkládání kontaktů je `/sprava/` v repu
> [`villa-rudolf-site`](https://github.com/pavelkubiznak/villa-rudolf-site) (`sprava.js`, 1 600+ řádků);
> spojka na kalendář je hotová jako `p_uidh` v `vr_admin_upsert_booking`, seznam pobytů jako
> `vr_admin_list_bookings`, překryvy jako `vr_admin_conflicts`. Evidence hostů běží
> v `/registrace/` nad `vr_persons_*`.
>
> Zadání vzniklo nad zastaralým obrazem v tomhle repu. **Neimplementuj podle něj.**
> Ponecháno kvůli bezpečnostní úvaze (co smí klíč žijící v prohlížeči) a kvůli poučení,
> proč vznikl zmatek — viz `MAPA-SYSTEMU.md`.


Stav k 5. 8. 2026. Rozpracování **varianty A** z [`propojeni-kalendar-portal.md`](propojeni-kalendar-portal.md)
(zápis přímo do Supabase RPC). Zadání pro implementaci; **kód zatím neexistuje**.

## 0. Rozsah v1

**v1 umí jediné: založit kontakt k pobytu, který kontakt ještě nemá.**

Nezahrnuto (a je to záměr, ne opomenutí):

| Mimo v1 | Proč | Kudy zatím |
|---|---|---|
| úprava / smazání existující rezervace | vyžádá si čtení a zápis PII přes secret v prohlížeči | Supabase Studio |
| přepárování pobytu po změně UID | potřebuje `update` RPC | Supabase Studio |
| zobrazení jmen a kontaktů hostů | modul PII zásadně nečte (bod 2) | Supabase Studio |
| automatické rozesílání odkazu | Booking blokuje odkazy od botů | ručně, jako dnes |

Modul tedy smí data **jen přidávat**. Nic, co už v databázi je, nemůže změnit ani přečíst.

## 1. Rozhodnutí a proč

Modul je statická stránka bez backendu. n8n poslouchá jen na `127.0.0.1:5678` a nemá routu
v Caddy, takže na něj prohlížeč nedosáhne. Zvoleno **A**: modul volá Supabase RPC přímo,
autorizuje se **ingest secretem**, který majitel zadá jednou a drží se v jeho `localStorage`.

Nevyžaduje žádnou změnu na serveru a je to stejný vzor, jaký se osvědčil u tokenu v `owner.html`.
n8n workflow zůstává funkční (nesahat na něj) — jen se přestane používat pro zakládání hosta.

## 2. Bezpečnostní model — přečti první

Ingest secret bude v prohlížeči majitele. Návrh je proto postavený tak, aby jeho případný únik
znamenal co nejmenší škodu:

| Co secret umožní | Co NEumožní |
|---|---|
| založit rezervaci (`vr_create_booking`) | **přečíst jména a kontakty hostů** |
| zjistit, které termíny už mají kontakt (`vr_list_stays`) | přečíst tokeny hostů (v DB je jen `sha256`) |
| | mazat nebo měnit existující rezervace |
| | cokoli mimo `vr_*` tabulky |

**Klíčové rozhodnutí: modul PII nikdy nečte, jen zapisuje.** `vr_list_stays` proto vrací pouze
spojovací údaje (termín, `ical_uidh`, `booking_ref`), **žádná jména**. K rozlišení pobytu jméno
netřeba — pobyt se vybírá podle data z kalendáře.

Z toho plyne pro implementaci:

- Modul je **samostatný soubor**, ne součást `index.html` (guest portál).
- **Žádné cizí skripty na té stránce** — hlavně **ne Umami**, které dnes v `index.html` je.
  Cizí skript na stejném originu + write secret v `localStorage` = zbytečné riziko XSS.
- `<meta name="robots" content="noindex, nofollow">`.
- `SERVICE_ROLE` klíč se nepoužije nikdy, za žádných okolností.
- Secret **nesmí být v repu** — zadává ho majitel do formuláře, uloží se jen lokálně.

## 3. Databáze

### 3.1 Spojka na kalendář

```sql
alter table public.vr_bookings
  add column if not exists ical_uidh text
    check (ical_uidh is null or ical_uidh ~ '^[0-9a-f]{16}$');

create unique index if not exists vr_bookings_ical_uidh_uq
  on public.vr_bookings (ical_uidh)
  where ical_uidh is not null;

comment on column public.vr_bookings.ical_uidh is
  'Spojka na kalendář: prvních 16 hex znaků sha256(iCal UID). NULL = pobyt bez protějšku ve feedu.';
```

### 3.2 Rozšíření `vr_create_booking` o `p_ical_uidh`

⚠️ **Definice `vr_create_booking` NENÍ v `supabase/schema.sql`** (viz bod 8). Před úpravou
si ji vytáhni z živé databáze:

```sql
select pg_get_functiondef(oid) from pg_proc where proname = 'vr_create_booking';
```

Pak přidej parametr **s defaultem**, aby staré n8n workflow (které ho neposílá) dál fungovalo:

```
p_ical_uidh text default null
```

a v `insert` doplň sloupec `ical_uidh`. Při porušení unikátního indexu vracet srozumitelnou chybu,
ne surový constraint error:

```sql
exception when unique_violation then
  raise exception 'stay_already_has_contact' using errcode = 'P0001';
```

> **Pozor na PostgREST:** RPC se rozlišuje podle jmen argumentů. Přidání parametru s defaultem je
> bezpečné, ale **nesmí vzniknout druhá varianta funkce se stejným jménem** — overload by volání
> rozbil. Pokud `pg_get_functiondef` vrátí víc řádků, nejdřív to vyřeš.

### 3.3 Nová RPC `vr_list_stays` — přehled bez PII

Autorizace **stejným mechanismem, jaký už používá `vr_create_booking` pro `p_secret`** (převezmi
ho z jeho definice — nevymýšlej nový). Styl podle stávajících funkcí ve `schema.sql`:
`security definer`, `set search_path = public`, `revoke ... from public`, `grant execute to anon`.

```sql
create or replace function public.vr_list_stays(p_secret text)
returns table (
  id          uuid,
  ical_uidh   text,
  booking_ref text,
  arrival     date,
  departure   date,
  lang        text,
  created_at  timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- kontrola p_secret: PŘEVZÍT z vr_create_booking, ne psát vlastní
  if not <stejná kontrola jako ve vr_create_booking> then
    raise exception 'unauthorized' using errcode = 'P0001';
  end if;

  return query
    select b.id, b.ical_uidh, b.booking_ref, b.arrival, b.departure, b.lang, b.created_at
      from public.vr_bookings b
     where b.departure >= current_date - interval '400 days'
     order by b.arrival;
end;
$$;

revoke all on function public.vr_list_stays(text) from public;
grant execute on function public.vr_list_stays(text) to anon;
```

**Žádné `first_name` / `last_name` / `notes` ve výstupu** — to je záměr, ne opomenutí (bod 2).

## 4. Modul

**Soubor:** `kontakty.html` v kořeni portálového repa. Statická stránka, žádný build, styl jako
zbytek projektu (inline CSS+JS, česky).

### 4.1 Obrazovka 1 — odemčení

Pole na ingest secret. Ověří se jedním voláním `vr_list_stays`; při úspěchu se secret uloží do
`localStorage` (`vr_ingest_secret`), při neúspěchu hláška. Tlačítko „odhlásit" secret smaže.

### 4.2 Obrazovka 2 — seznam pobytů

Načte **dva zdroje a spojí je podle `ical_uidh`**:

1. kalendář → `https://pavelkubiznak.github.io/villa-booking-calendar/data/history.json?_=<ts>`
   (veřejný, anonymizovaný, CORS otevřený)
2. Supabase → `vr_list_stays`

Zobrazí nadcházející pobyty (odjezd ≥ dnes) se stavem:

| Stav | Podmínka |
|---|---|
| ⬜ **bez kontaktu** | `uidh` z kalendáře není v Supabase ← *tady je práce* |
| ✅ **má kontakt** | `uidh` v Supabase je |
| ⚠️ **stale** | `stale: true` v kalendáři — ověřit v extranetu |
| ❗ **termín se rozešel** | `uidh` sedí, ale `arrival`/`departure` se liší od kalendáře |
| ➕ **jen v Supabase** | rezervace bez `ical_uidh` (přímá, mimo platformy) |

Řadit podle příjezdu, výchozí filtr „⬜ bez kontaktu".

### 4.3 Obrazovka 3 — formulář

Majitel vybere pobyt → formulář **předvyplněný z kalendáře**:

- `arrival`, `departure`, `platform`, `ical_uidh` — **jen ke čtení**, netypují se
- vyplňuje se: jméno, příjmení, jazyk (cs/de/en/pl), dospělí, děti (věky)

Odeslání:

1. `rawToken = crypto.getRandomValues(new Uint8Array(16))` → 32 hex znaků
   (**ne** `Math.random()`)
2. `token_hash = sha256(rawToken)` přes `crypto.subtle` → hex
3. `POST /rest/v1/rpc/vr_create_booking` s `apikey` + `Authorization: Bearer <anon>`
   (anon klíč je veřejný, je i v `index.html`), tělo obsahuje `p_secret`, `p_ical_uidh`
   a ostatní pole jako dnes n8n
4. RAW token se **nikam neukládá** — vznikne, použije se do odkazu a zmizí

Výsledek: odkaz `…/villa-rudolf-portal/?t=<rawToken>` + uvítací text v jazyce hosta,
obojí s tlačítkem „kopírovat". Odkaz vkládá majitel do zprávy hostovi **ručně**
(Booking blokuje odkazy od botů — viz `n8n-booking-ingest.md`).

⚠️ **Odkaz se po zavření okna už nedá získat.** V DB je jen hash. Modul na to musí upozornit
a nabídnout kopírování dřív, než se dá zavřít.

### 4.4 Uvítací šablony

Texty (DE/CS/EN) jsou dnes v n8n Code nodu, popsané v `n8n-booking-ingest.md`. Modul je bude
mít taky → **dvě kopie téhož textu, které se rozejdou**. Doporučení: až modul pojede,
zakládání hosta z n8n workflow **odstranit** a nechat šablony jen v modulu.
Do té doby při změně textu měnit obě místa.

## 5. Hraniční případy

| Situace | Chování |
|---|---|
| Pobyt už kontakt má | Unikátní index to odmítne → hláška „tenhle pobyt už kontakt má", nabídnout zobrazení stavu |
| Přímá rezervace mimo platformy | Tlačítko „pobyt není v kalendáři" → termín se zadá ručně, `ical_uidh = NULL` |
| Platforma přegenerovala UID | Pobyt se objeví jako ⬜ nový a starý zmizí. Modul nabídne **spárovat s existující rezervací** podle shody `arrival`/`departure` (= `update` na `ical_uidh`; vyžádá si vlastní RPC — **mimo v1**, viz bod 0; zatím ručně ve Studiu) |
| Termín se v kalendáři změnil | Označit ❗, **nepřepisovat automaticky** — host už mohl dostat odkaz se starým datem |
| Pobyt `stale` | Zobrazit s varováním, nezakazovat založení |
| Překryv dvou rezervací | Dva různé `uidh` → **dva samostatné kontakty**, nespojovat |
| Kalendář nedostupný | Formulář nechat použitelný v ručním režimu, stav pobytů skrýt |

## 6. Testovací scénáře

1. **Špatný secret** → RPC vrátí `unauthorized`, modul nic neuloží, secret se neuloží.
2. **Založení nového pobytu** → v `vr_bookings` vznikne řádek s `ical_uidh`; `vr_verify_token`
   s vráceným RAW tokenem vrátí správné jméno a termín.
3. **Dvojí odeslání téhož pobytu** → druhý pokus skončí `stay_already_has_contact`, ne
   duplicitou ani surovou chybou z DB.
4. **Starý n8n webhook beze změny** → `vr_create_booking` bez `p_ical_uidh` musí dál projít
   (regrese na defaultu parametru).
5. **`vr_list_stays` nevrací PII** → v odpovědi nesmí být jméno ani `notes`. Ověřit `curl`em.
6. **Pobyt se stejným termínem na dvou platformách (překryv)** → v seznamu dvě samostatné
   položky, každá s vlastním `uidh`.

## 7. Co NEdělat

1. Nedávat secret ani anon klíč s vyšším oprávněním do repa. `SERVICE_ROLE` nikdy.
2. Nepřidávat na `kontakty.html` Umami ani jiný cizí skript.
3. Nesahat na běžící n8n workflow, dokud modul neběží ověřeně.
4. Nenechat kalendář číst Supabase — úklidový pohled je veřejný, unikla by jména.
   Spojení se dělá **v modulu**, na straně majitele.
5. Nepřepisovat termíny v `vr_bookings` automaticky podle kalendáře (bod 5).

## 8. Nesrovnalosti, které je nutné napřed uklidit

- **`supabase/schema.sql` je pozadu za živou databází** — chybí v něm `vr_create_booking`
  i `vr_purge_expired`, přestože je `n8n-booking-ingest.md` popisuje jako funkční.
  Bez doplnění se migrace píší naslepo. **Udělat jako první krok.**

## 9. Otevřené body

- [x] ~~Má modul umět i opravu existující rezervace?~~ → **NE. v1 = jen zakládání** (rozhodnuto
      5. 8. 2026). Editace by vyžadovala RPC pro čtení a zápis PII, čímž by secret v prohlížeči
      získal přístup ke jménům a kontaktům hostů — to je přesně to, čemu se návrh vyhýbá (bod 2).
      Oprava se zatím dělá přímo v Supabase Studiu. K editaci v modulu se vrátit až tehdy,
      když bude na stole i silnější autentizace než sdílený secret.
- [ ] Kde bude modul viditelně odkazovaný? (Nikde veřejně — majitel si uloží URL.)
- [ ] Rotace secretu: jak a kde se mění, když se prozradí. Sepsat postup.
