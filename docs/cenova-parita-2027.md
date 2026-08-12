# Cenová parita napříč kanály (léto 2027) — návrh a runbook

Stav k 12. 8. 2026. Problém: ceny na Booking.com, Airbnb a FeWo-direkt se pro léto 2027
rozjely a nastavují se na třech místech ve dvou měnách. Tenhle dokument říká, co jde
a nejde postavit, a definuje nástroj, který se místo „jednoho kalendáře přes API"
opírá o **ceník jako zdroj pravdy + Chrome jako ruce**.

## 0. Přímá odpověď: co nejde a co jde

**Vlastní nástroj, který by ceny nastavil všude přes API, postavit NEJDE.**
Booking.com Connectivity API je jen pro certifikované connectivity partnery,
Airbnb API je pro nové partnery uzavřené, Vrbo/Expedia rovněž. Žádný oficiální
programový přístup k cenám vlastního objektu jako jednotlivec nedostaneme.

**Poznámka k měnám:** to, že „to nejde kvůli měnám", byl limit Lodgify, ne přírodní
zákon. Plnohodnotné channel managery (např. Beds24, Smoobu) umí měnu a koeficient
na kanál. Kdyby ses někdy chtěl vrátit k hotovému řešení, tudy vede cesta.
Tento dokument ale řeší variantu **bez dalšího předplatného**.

**Co jde postavit (a co stavíme):**

| Vrstva | Co dělá | Kdo to dělá |
|---|---|---|
| 0. Ceník | jediný zdroj pravdy: základní cena, min. noci, pravidla na kanál | soubor v repu, plní Pavel |
| 1. Audit | přečte kalendáře extranetů přes Chrome, ukáže tabulku rozdílů | Claude, read-only |
| 2. Zápis | nastaví ceny v extranetech přes Chrome, s potvrzením před každým uložením | Claude + Pavel u počítače |

Proč Chrome a ne server: API jsou uzavřená, n8n na Hetzneru poslouchá jen na
localhostu a hlavně nemá přihlášení do extranetů. Rozšíření `claude-in-chrome`
jede v Pavlově Chrome profilu, takže přihlášení do všech extranetů už tam je
([[chrome-nastroje-na-macu]] v memory).

## 1. Kanály

| Kanál | Měna | Kde se ceny nastavují | Identifikace |
|---|---|---|---|
| Booking.com | CZK | extranet → Kalendář a ceny (hromadná úprava rozsahu dat) | hotel_id 12558473 |
| Airbnb | EUR | kalendář hostitele, výběr rozsahu dat | airbnb.cz/hosting |
| FeWo-direkt (Vrbo) | EUR | ceny/sazby, sezónní pravidla | propertyId 106405316 / FEWO 5510810 |
| e-chalupy.cz | CZK | administrace, sezónní ceník | objekt 18852 |

Poznámky:

- **Booking má cenové plány** (standardní + obvykle nevratná odvozená slevou v %).
  Audit čte oba; v ceníku je sleva zaznamenaná, takže cílová nevratná cena je dopočítatelná.
- **Airbnb Smart Pricing musí být vypnutý**, jinak ceny přepisuje. Audit to ověří.
- **Pozor na zobrazovací měnu:** Airbnb multikalendář zobrazuje ceny v zobrazovací
  měně účtu (ověřeno 12. 8. 2026 — ukazoval Kč, přestože nabídka má být v EUR).
  Audit musí u každého kanálu nejdřív zjistit, v jaké měně čísla čte, jinak je
  normalizace špatně.
- **e-chalupy jsou volitelné** — česká klientela, možná záměrně jiná cenová logika.
  Rozhodnutí viz bod 3.
- iCal mezi kanály synchronizuje jen obsazenost, cen se netýká — proto tenhle
  problém vůbec existuje.

## 2. Ceník — zdroj pravdy

Soubor `docs/cenik-2027.json` (šablona: [`cenik-2027.template.json`](cenik-2027.template.json)).
Cílová cena na kanálu = `noc_zaklad × koeficient × kurz (je-li měna jiná než základní)`,
zaokrouhleno podle kanálu. Audit porovnává s tolerancí (výchozí ±3 %), aby
zaokrouhlení a drobný kurzový drift nesvítily jako chyba.

Ceník záměrně umí vyjádřit **obě paritní strategie** (viz bod 3): stejná cena pro
hosta všude = koeficienty 1,00; stejný čistý výnos = koeficienty podle provizí.

## 3. Rozhodnutí, která musí padnout před prvním zápisem

| # | Otázka | Varianty | Dopad |
|---|---|---|---|
| 1 | Parita hrubá, nebo čistá? | stejná cena pro hosta všude × stejný výnos po provizi | koeficienty kanálů |
| 2 | Základní měna a plánovací kurz | EUR (2 ze 3 kanálů) × CZK; kurz fixní na sezónu | přepočet pro Booking/e-chalupy |
| 3 | Zaokrouhlení | např. 100 Kč / 5 € | kosmetika, ale ať je to všude stejně |
| 4 | e-chalupy zahrnout do parity? | ano × ne (vlastní ceník) | rozsah auditu i zápisu |
| 5 | Min. noci a příjezdové dny jednotně? | ano × per kanál | audit hlásí i restrikce |

**Audit může běžet hned, bez těchto rozhodnutí** — bez vyplněného ceníku porovná
kanály navzájem a ukáže, kde se rozcházejí. Cílové hodnoty do ceníku je nejlepší
vyplnit až nad výsledkem prvního auditu.

## 4. Runbook: audit (read-only)

Spouští se větou typu „spusť audit cen 2027" — Pavel u počítače, Chrome přihlášený
do extranetů.

1. Claude otevře v nových kartách postupně Booking extranet (Kalendář a ceny),
   Airbnb kalendář, FeWo-direkt ceny, případně e-chalupy.
2. Pro období červen–září 2027 si den po dni zapíše: cenu, min. noci,
   otevřeno/zavřeno, u Bookingu i nevratný plán, u Airbnb stav Smart Pricingu.
3. Vše normalizuje do základní měny a srovná (s ceníkem, nebo kanály navzájem).
4. Výstup: **HTML report** — řádky jsou souvislé úseky dat se stejnými hodnotami
   (ne 92 řádků po dnech), sloupce kanály, rozdíly červeně. Snapshot dat se uloží
   do `docs/audit-cen/RRRR-MM-DD.json`, aby šlo příště srovnat „co se změnilo".

Zásady: žádné klikání na cokoli, co ukládá; jen navigace a čtení. Nové karty,
žádné přepínání těch otevřených.

## 5. Runbook: asistovaný zápis

Jen s Pavlem u počítače, po auditu a s vyplněným ceníkem.

1. Claude jde kanál po kanálu. Pro každý kanál nejdřív vypíše **plán změn**
   (úsek dat → stará → nová hodnota) a čeká na souhlas.
2. Nastaví hodnoty v extranetu, ale **před každým uložením formuláře se zastaví
   a řekne, co ukládá** — uložení proběhne až po odsouhlasení.
3. Po každém kanálu krátký souhrn; na konci celkový souhrn a **okamžitý re-audit
   změněných termínů** pro ověření, že se hodnoty skutečně propsaly.

Nejhorší scénář zůstává v záloze: audit ukáže tabulku a Pavel klidně nastaví
všechno ručně — vrstva 2 je pohodlí, ne podmínka.

## 6. Rizika a limity

- **UI extranetů se mění.** Runbook je návod pro Clauda, ne křehký skript — když
  se stránka změní, přizpůsobí se za chodu. Nic tu nemá selhat potichu.
- **Automatiky kanálů** (Smart Pricing, návrhy cen) můžou hodnoty přepsat po nás.
  Audit proto opakovat před otevřením prodeje sezóny a pak namátkově.
- **Kurz EUR/CZK** — parita platí ke dni kurzu v ceníku; při větším pohybu kurzu
  přepočítat a znovu zapsat.
- Booking může mít v extranetu i **víc plánů/obsazeností** (např. cena pro 2 os.
  vs. plná obsazenost) — první audit zmapuje, co přesně je založené, a ceník se
  případně rozšíří.

## 7. Stav

Proveditelnost ověřena 12. 8. 2026 sondou přes `claude-in-chrome` (read-only):

| Kanál | Stav přihlášení | Poznámka |
|---|---|---|
| Airbnb | ✅ přihlášeno | multikalendář se načte, ceny po dnech čitelné |
| FeWo-direkt | ✅ přihlášeno | („Hallo, Pavel"); URL dashboardu najít proklikem, `/px/` je 404 |
| Booking.com | ❌ odhlášeno | před auditem se Pavel musí přihlásit do extranetu |
| e-chalupy | neověřeno | závisí na rozhodnutí č. 4 |

- [x] návrh a runbook (tento dokument)
- [x] šablona ceníku
- [x] sonda proveditelnosti čtení přes Chrome
- [x] první audit 12. 8. 2026 — všechny tři kanály → [`audit-cen/2026-08-12.html`](audit-cen/2026-08-12.html)
  + [`audit-cen/2026-08-12.json`](audit-cen/2026-08-12.json). Klíčové: **Booking i FeWo jedou v EUR,
  Airbnb v CZK** (obráceně, než se čekalo). Jádro léta 2027 srovnané (569/559 €/14 000 Kč, ≤2 %),
  rozjezdy jsou na okrajích sezóny (Booking 569 € už 26.6. a ještě 29.–31.8.), v březnu 2027 (Airbnb
  −8 %) a na podzim/zimě (Booking 499 vs FeWo 529). Nevratná na B = −8 % odvozená; Airbnb last-minute
  −15 %; min. noci B i A jen 2.
- [ ] doměřit Booking: 12.3.–19.6.2027 a **prosinec 2027–únor 2028 (Vánoce!)** + min. noci léta 2027.
  Pozor: extranet po rychlé sérii čtení rate-limituje kalendářní API — číst pomalu, rozsahy zadávat
  klikáním v pickeru (List view + get_page_text; když jsou buňky editovatelné, číst přes read_page).
- [ ] rozhodnutí 1–5 (bod 3) a vyplnění `cenik-2027.json`
- [ ] první asistovaný zápis + ověřovací re-audit
