# Evidence hostů a poplatek z pobytu — návrh přechodu z Google Formu do databáze

Stav k 30. 7. 2026. Dnes běží evidence v Google Formu → Sheet
„Rudolfův Dvůr, Luční 519… (Responses)" (1 247 záznamů od 1/2024).
Tento dokument popisuje, proč to nestačí, a jak to překlopit do Supabase
vedle stávajících `vr_*` tabulek.

## 1. Co ukázala kontrola stávajících dat

Analýza všech 1 247 registrací (skript v `scripts/kontrola-evidence.mjs`, viz níže):

| Nález | Počet |
|---|---|
| Záznamy s kritickou vadou (nešlo spočítat poplatek) | 103 |
| — z toho automaticky opravitelných překlepů | 25 |
| Zbývá k ruční opravě | 82 |
| Duplicitní registrace téže osoby | 8 |
| Prokazatelně chybné číslo dokladu | 115 |
| Polský OP s **nesedící kontrolní číslicí** | 23 |
| Doklad uložený jako číslo → ztracená vedoucí nula | 328 |

Typické vady, všechny způsobené tím, že formulář nic nevaliduje:

- **Dvouciferný rok** — host napíše `26` místo `2026`, Sheet uloží rok 26 n. l.
- **Překlep v roce příjezdu** — `2014-06-13 → 2024-06-16`, tedy 3 656 nocí.
- **Odjezd před příjezdem** — 20 záznamů, nejhorší −730 478 nocí.
- **Datum narození v budoucnosti** — host vyplní datum pobytu místo narození.
- **Datum narození vepsané do pole „stay from"**.
- **Zástupný text místo dokladu** — 37× `No`, `-`, `123456789`.
- **Čísla dokladů se ztracenou vedoucí nulou** — Google Sheets uloží
  `012345678` jako číslo `12345678`. Týká se hlavně českých OP (9 číslic)
  a je to tichá ztráta dat: v Sheetu už tu nulu nikdo nedohledá.

Konkrétní ukázka toho, proč sis vysloužil pokutu: řádky 108 a 111 jsou dva
členové jedné rodiny s čísly `XDG21****` a `CDG 21****` — **stejné číslo,
jiná série**. Jeden z nich je zjevně přepis toho druhého. Kontrolní číslice
u obou nesedí. Osm řádků kódu to odhalí okamžitě.
(Čísla dokladů jsou zde maskovaná — repo je veřejné. V Sheetu jsou v plném znění.)

## 2. Kontrola čísla dokladu — co je a co není možné

Tohle je jádro tvého problému a odpověď je nepříjemná, ale použitelná.

**Co nejde:** ověřit, že doklad existuje a patří té osobě. Neexistuje veřejný
registr, do kterého by se ubytovatel mohl dotázat, a cizinecká policie
guidelines nevydává (což ti řekli). Nikdo ti nedá seznam „takhle vypadá
polský/nizozemský/belgický doklad".

**Co jde, a je to překvapivě silné — MRZ.** Každý cestovní pas na světě a
**každý občanský průkaz vydaný v EU od 2. 8. 2021** (nařízení EU 2019/1157)
má na spodním okraji strojově čitelnou zónu podle normy ICAO 9303. Ta
obsahuje **kontrolní číslice** pro číslo dokladu, datum narození i platnost.
Algoritmus je jeden pro celý svět (váhy 7-3-1, modulo 10) — nemusíš znát
formát jednotlivých států.

Prakticky: v registračním formuláři necháš hosta opsat (nebo vyfotit) dva
řádky MRZ místo toho, aby číslo vyťukával z hlavy. Systém si číslo z MRZ
vytáhne sám a ověří kontrolní číslici. Typ dokladu i stát vydání jsou v MRZ
také, takže odpadne i dnešní zmatek „Polish/Polska/Poland".

**Co jde bez MRZ:**

- **Kontrolní číslice u zemí, kde je algoritmus veřejný.** Pro polský OP
  (`AAA999999`) je implementovaná a ověřená — na tvých datech projde 85 %
  čísel, takže těch 23 neprocházejících jsou skutečné chyby, ne chyba kontroly.
  Polský pas (`AA9999999`) taky: 13 ze 14.
- **Formát a délka podle státu.** Odchytí `No`, `1234`, `Nr 6/22`.
- **Typ dokladu.** Dnešní pole „PASSPORT/ID CARD NUMBER" je jedno pole pro
  dva různé formáty — bez rozlišení typu nelze validovat nic.

**Čeho tím dosáhneš:** vyloučíš překlepy a nesmysly a budeš schopen doložit,
že jsi kontrolu prováděl. To je maximum, které je v pozici ubytovatele
dosažitelné — a je to podstatně víc než dnes.

**Na co pozor:** kopie občanských průkazů si bez souhlasu držitele ukládat
nemůžeš. Návrh proto počítá s tím, že se MRZ zpracuje a **uloží se z něj jen
číslo a kontrolní příznak, fotka se zahodí**. Než to nasadíš, ověř si to
u úřadu — tohle je návrh architektury, ne právní stanovisko.

## 3. Cílové schéma (Supabase, prefix `vr_`)

Navazuje na stávající `vr_bookings`. Rezervace zůstává, přibývá evidence osob.

```sql
-- číselník států (ISO 3166-1 alpha-2) kvůli konzistenci a validaci dokladů
create table public.vr_countries (
  code        char(2) primary key,
  name_cs     text not null,
  doc_rules   jsonb default '{}'::jsonb   -- regexy a algoritmy pro daný stát
);

create table public.vr_stay_guests (
  id            uuid primary key default gen_random_uuid(),
  booking_id    uuid not null references public.vr_bookings(id) on delete cascade,

  surname       text not null,
  given_name    text not null,
  birth_date    date not null,
  nationality   char(2) not null references public.vr_countries(code),

  doc_type      text not null check (doc_type in ('P','I','D')),  -- pas / ID / řidičák
  doc_number    text not null,
  doc_number_norm text generated always as
                  (upper(regexp_replace(doc_number, '[^A-Za-z0-9]', '', 'g'))) stored,
  doc_check     text not null default 'unknown'
                  check (doc_check in ('ok','failed','unknown')),
  visa_number   text,

  home_address  text not null,
  purpose       text default 'turistika',

  arrival       date not null,
  departure     date not null,
  nights        int generated always as (departure - arrival) stored,

  ubyport_sent_at timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  -- tvrdé zábrany proti tomu, co je dnes v Sheetu
  constraint vr_sg_dates      check (departure > arrival),
  constraint vr_sg_maxstay    check (departure - arrival <= 30),
  constraint vr_sg_born_first check (birth_date < arrival),
  constraint vr_sg_born_sane  check (birth_date > date '1900-01-01'),
  constraint vr_sg_doc_len    check (length(doc_number_norm) between 5 and 12)
);

create unique index vr_sg_dedup
  on public.vr_stay_guests (booking_id, lower(surname), lower(given_name), birth_date);

create index vr_sg_arrival on public.vr_stay_guests (arrival);
```

`vr_sg_maxstay` je 30 dnů, ne 7 — zákonná hranice je 60 dnů a nechceš, aby ti
DB odmítla legitimní výjimku. Pobyty nad 7 nocí ale hlásí kontrolní pohled
jako podezřelé.

### Výpočet poplatku přímo v databázi

Klíčové je, že se poplatek počítá **po jednotlivých dnech**, ne paušálně za
pobyt. Zákon 565/1990 Sb. říká, že základem je počet započatých dnů pobytu
**s výjimkou dne počátku**, a od poplatku je osvobozena osoba mladší 18 let.
Pobyt přes půlnoc čtvrtletí se tak správně rozdělí a host, který během pobytu
dovrší 18 let, se zpoplatní jen za dny po narozeninách.

```sql
create or replace view public.vr_tax_days as
select g.id as guest_id,
       g.booking_id,
       d::date                                   as den,
       (d::date - g.birth_date) >= 18 * 365      as approx_adult,  -- viz pozn.
       extract(year  from d)::int                as rok,
       extract(quarter from d)::int              as ctvrtleti
  from public.vr_stay_guests g
  cross join lateral
       generate_series(g.arrival + 1, g.departure, interval '1 day') d;
```

> Pozn.: v produkci použij přesný věk `age(d::date, g.birth_date) >= interval '18 years'`,
> ne aproximaci přes 365 dnů — kvůli přestupným rokům.

```sql
create or replace view public.vr_tax_summary as
select rok, ctvrtleti,
       count(*) filter (where approx_adult)              as zpoplatnenych_dnu,
       count(distinct guest_id) filter (where approx_adult) as osob,
       count(*) filter (where approx_adult) * 25         as kc   -- sazba z konfigurace
  from public.vr_tax_days
 group by rok, ctvrtleti
 order by rok, ctvrtleti;
```

Sazbu (25 Kč) drž v konfigurační tabulce, ne natvrdo — obec ji může změnit
vyhláškou a historická čtvrtletí se musí počítat starou sazbou.

## 4. Registrační formulář

Google Form nahradí stránka v portálu na existujícím tokenu (`?t=<token>`),
takže host nic nezakládá a záznam se rovnou váže na rezervaci — odpadne
dnešní ruční párování podle e-mailu a jména.

Validace **na vstupu**, ne až při zpracování:

- Datum výhradně přes `<input type="date">` s `min`/`max` odvozeným z rezervace.
  Tím zmizí celá kategorie chyb s roky (`26`, `1024`, `2014`).
- `birth_date` s `max` = datum příjezdu. Zmizí „narození po příjezdu".
- Stát z rolovátka (číselník), ne volný text.
- Typ dokladu jako volba pas / OP / řidičák.
- Číslo dokladu se kontroluje **hned při psaní**: formát podle státu a typu,
  u PL kontrolní číslice, u MRZ ICAO 9303. Host uvidí chybu, dokud je u toho —
  ne ty za tři měsíce od cizinecké policie.
- Pole je `type="text"` s `inputmode`, nikdy ne `type="number"` — jinak se
  zopakuje dnešní ztráta vedoucích nul.

## 5. Návaznosti

- **UbyPort.** Ubytování cizince se hlásí policii do 3 pracovních dnů
  (§ 102 zák. 326/1999 Sb.); doklady nahrazující domovní knihu se uchovávají
  6 let. Schéma na to má `ubyport_sent_at`, takže půjde hlídat, co ještě
  nebylo odesláno. Zda má smysl napojit se na UbyPort strojově, nebo dál
  vyplňovat formulář ručně, se rozhodne až podle toho, co UbyPort dnes
  nabízí za rozhraní — to jsem neověřoval.
- **Export pro městský úřad.** Pohled `vr_tax_summary` + jmenný seznam,
  jedním dotazem, bez ručního počítání.
- **Mazání.** Stávající `vr_purge_expired` řeší rezervace. Evidence hostů má
  ale jinou retenci (6 let kvůli domovní knize) — nesmí se mazat spolu
  s rezervací. Proto `on delete cascade` v návrhu **není** správně a před
  nasazením se musí změnit na `on delete set null` plus vlastní úklidová
  úloha po 6 letech.

## 6. Migrace

1. Vyexportovat Sheet, projet kontrolním skriptem, opravit 82 vadných záznamů
   (u nedohledatelných zapsat, že údaj chybí — to je lepší doložitelné než
   vymyšlené číslo).
2. Naimportovat do `vr_stay_guests`; constrainty odmítnou to, co je pořád
   rozbité. Odmítnuté řešit ručně.
3. Zapnout nový formulář, Google Form přepnout na jen pro čtení.
4. Sheet nechat rok jako archiv, pak smazat — je v něm PII a leží na
   osobním Disku.

## 7. Co je potřeba doplnit

- **Sazba a splatnost z OZV č. 2/2023.** PDF na webu města má text
  v subsetovaném fontu, strojově se nepřečetl. Sazba 25 Kč je převzatá
  z tvého zadání, splatnost je odhad podle obvyklé praxe. Obojí ověř.
- **Jestli jsou v Sheetu úplně všichni hosté.** Kontrola umí najít nesmysly
  v tom, co zapsáno je; nepozná pobyt, který se nezaregistroval vůbec.
  To půjde teprve po napojení na `vr_bookings`, kde jsou známé termíny.
