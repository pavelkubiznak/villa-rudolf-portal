# Cenová parita napříč kanály (léto 2027) — návrh a runbook

Stav k 12. 8. 2026. Problém: ceny na Booking.com, Airbnb a FeWo-direkt se pro léto 2027
rozjely a nastavují se na třech místech ve dvou měnách. Tenhle dokument říká, co jde
a nejde postavit, a definuje nástroj, který se místo „jednoho kalendáře přes API"
opírá o **ceník jako zdroj pravdy + Chrome jako ruce**.

## 0. Přímá odpověď: co nejde a co jde

> Varianty „jedno místo na správu cen i kalendářů" (channel manager, jeho API, migrace)
> rozebírá [`kanaly-jedno-misto.md`](kanaly-jedno-misto.md). Tenhle dokument popisuje
> variantu bez dalšího předplatného, která běží teď.

**Vlastní nástroj, který by ceny nastavil všude přes API napřímo, postavit NEJDE.**
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
| 5 | ~~Min. noci a příjezdové dny~~ | **rozhodnuto 13. 8. 2026, viz 7.2** (léto 5, zima 2, nikdy 1) | audit hlásí i restrikce |

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

## 7. Cenová politika a obrana proti „zapomněl jsem zdražit"

**Rozhodnuto Pavlem 12.–13. 8. 2026. Na kanálech zatím NEPROVEDENO** — tohle je zadání pro zápis.

**Kořen problému:** kanály otevírají nové termíny automaticky v *základní* ceně (Airbnb okno až
24 měsíců, Booking ~18, FeWo dál). Prémiové období, které nikdo včas nezdraží, se prodává levně.
Druhý důsledek: host koupí pobyt o dva roky dopředu za dnešní cenovou hladinu, zatímco energie,
úklid a prádelna mezitím zdraží — cena je zafixovaná, náklady ne.

### 7.1 Sezóny a cílové ceny

Pravidla platí napořád, hranice se z nich pro každý rok **spočítají**, nevymýšlejí:

- **léto** = všechny týdny So–So zasahující do 1. 7.–31. 8. → pro 2027 vychází 26. 6.–4. 9.
- **zima** = leden + únor
- **Vánoce** = týden obsahující 24. 12. + týden obsahující 31. 12. → pro 2027 18. 12.–1. 1.,
  pro 2028 23. 12.–6. 1. 2029

Cíl: léto ≈ **14 000 Kč/noc**, zima **totéž**, dva vánoční týdny **extra nad tím**.
Preference: radši termín neprodat, než ho prodat pod cenou.
(Podle tohoto pravidla má Booking hranice léta 2027 blíž pravdě než FeWo a Airbnb, které začínají až 3. 7.)

### 7.2 Minimální délka pobytu

- **Tvrdé dno všude a vždy: 2 noci.** Jedna noc nikde a nikdy — nedává smysl.
- **Léto: min. 5 nocí na kanálech**, i když ideál je So–So (7 nocí). Sedmička by ubrala poptávky;
  pětka nechá dveře otevřené a zbytek je práce prodeje: na poptávku 5 nocí Pavel nabídne roztažení
  na celý týden („je hlavní sezóna, škoda těch dvou dnů") — úspěšnost zhruba 1 : 1.
- **Zima (leden, únor): min. 2 noci.** Hosté jezdí čt/pá–ne/po; delší minimum by prodej zabilo.
- Ostatní období: 2–3 noci, k doladění, nízké riziko.
- **Doprodej zbylých dnů se slevou:** když se z pětinoci nedá udělat týden, nabídnout dva zbylé dny
  levněji. Marginální náklad je energie, ne další úklid → i polovina ceny za noc je lepší než prázdno
  (a lepší, než tam pustit druhou skupinu s dalším úklidem). Pravidlo: **jen jako prodloužení
  existující rezervace, nikdy jako veřejná cena, dno 50 % ceny za noc.**
- **Asymetrie kanálů, na kterou pozor:** na Airbnb chodí žádost o rezervaci, takže jde nepotvrdit.
  Na Booking.com je rezervace platná okamžitě — tam je min. noci **jediná** reálná ochrana a upsell
  probíhá až nad potvrzenou rezervací. Minimum proto nastavit tak, aby i nejkratší povolený pobyt
  dával smysl sám o sobě.
- **Stav dnes je špatný: Booking i Airbnb mají min. noci = 2 i v létě 2027** (audit 12. 8.). Kdokoli
  dnes může koupit dvě noci uprostřed prázdninového týdne a rozbít celý týden. Pravděpodobně
  nejlevnější oprava z celého dokumentu.
- K ověření v extranetech při zápisu: (a) min. noci podle rozsahu dat (léto × zima), (b) omezení dne
  příjezdu (Booking CTA, Airbnb vlastní pravidla pro rozsah dat) — jestli v létě tlačit sobotní
  příjezdy, (c) výjimka „pobyt, který přesně zaplní mezeru mezi rezervacemi" (Airbnb ji podle všeho
  umí, ověřit) — to je přesně na ty dva zbylé dny.

### 7.3 Horizont: co má být naceněné a otevřené

Původní návrh „roční rituál v září" **zamítnut** — velká část léta 2027 je prodaná už dnes; čekat na
jedno datum v roce znamená mít měsíce zavřené nebo naceněné naslepo. Místo toho:

- **Klouzavý horizont 15–18 měsíců, posouvaný po měsících.** Vždy začátkem měsíce nacenit a otevřít
  jeden další měsíc na konci horizontu. Skokem po měsíci, ne po dni. (12 měsíců nestačí — v lednu
  by si nikdo nemohl koupit druhou půlku srpna, a přitom se příští léto kupuje ~rok dopředu.)
- **Prémiová období předbíhají frontu.** Vánoce + Silvestr, leden–únor a léto musí být naceněné
  a otevřené vždy **aspoň dvě sezóny dopředu**, i kdyby ležely za klouzavým oknem. Ostatní (březen–červen,
  podzim) počkají, až k nim okno dojde — tam se dopředu stejně nekupuje.
- Kontrola k 13. 8. 2026: okno do konce února 2028 pokrývá Vánoce 2026 i 2027, zimu 2027 i 2028
  a léto 2027. Léto 2028 do okna spadne v srpnu 2027, což sedí na roční předstih nákupu.
  Skutečnost: FeWo je napřed (2028 naceněné a otevřené), **Booking má otevřeno jen do února 2028**,
  Airbnb má od 16. 1. 2028 jen 13 200 Kč (pod cílem zimy).

### 7.4 Co není naceněné, je zavřené

Všechno za naceněným horizontem blokovat a otevírat až **PO** zapsání ceny (pořadí vždy: cena → otevřít).
Zapomenutí pak znamená „neprodává se", ne „prodalo se levně".

**Invariant, který to celé drží: ceník musí být vyplněný vždy aspoň o měsíc dál, než sahá nejvzdálenější
otevřený den.** Je to důležitější, než vypadá — okno dostupnosti na Airbnb se posouvá samo každý den,
nový den se otevře bez tvého vědomí a jediná ochrana je, že tam cena už je napsaná.

Implementace: Booking = close room na rozsah dat; Airbnb = okno dostupnosti (jedno nastavení, ne
blokování po dnech) plus případný pevný blok; FeWo = blok. Konkrétní podobu ověřit při prvním zápisu.

### 7.5 Kontrola: jeden měsíční rituál

Měsíční kadence otevírání (7.3) a měsíční audit jsou totéž — slít do jednoho úkonu, ~15–20 minut:

1. audit podle runbooku v bodě 4 (Chrome, asistovaně),
2. každý prodejný den prémiového období pod cílem svítí červeně,
3. nacenit a otevřít další měsíc na konci horizontu,
4. opravit nálezy.

Navíc: **před otevřením prodeje prémiové sezóny** a **re-audit po každém hromadném zápisu**.
Denní alarm nemá cenu — chyba „zapomněl jsem nacenit" vzniká v měsíčním rytmu, ne denním, a denní
hlášení „nic se nestalo" jen otupí pozornost.

Serverový scraping veřejných cen zůstává zamítnutý, ale ne kvůli frekvenci (1–2× měsíčně by bot
ochrany zvládly): asistovaná session v Chrome vidí navíc **zavřené termíny, restrikce a min. noci**,
což z veřejného webu nevyčteš, a nepotřebuje údržbu, když se UI změní.

Připomínku lze založit jako scheduled task (např. první pondělí v měsíci ráno).

### 7.6 Slevy

Automatické slevy dnes tečou i tam, kde nemají: Airbnb **last-minute −15 %** (0–10 dní → z 14 000
dělá 11 900) a Booking **Nevratná −8 %** (z 569 € dělá 523 €).

Logika, kterou mají pokrýt — neprodaný týden v zajímavém období, kde nižší cena za osobu pomůže
menší skupině — je legitimní, ale je to **rozhodnutí, ne pravidlo**. Automat ji vypálí i na termín,
který by se prodal za plnou cenu. Návrh: v prémiových obdobích automatické slevy vypnout a doprodej
řešit ručně (Airbnb speciální nabídka, Booking snížení sazby na konkrétní rozsah). Nevratná sazba je
jiný případ — host si za ni kupuje jistotu; jen ať je vědomé, že dno je 0,92 × cena.

Poznámka k proporcím: tohle je nejmenší z pěti položek. Podceněná zima (≈ 1 000 Kč/noc přes leden
a únor dvou let) je řádově větší peníz než last-minute sleva, která u 16členné skupiny stejně
skoro nikdy nenaskočí.

### 7.7 Nálezy z auditu, které pod tuto politiku spadají

Zima 2027 i 2028 je všude pod cílem (529 €/12 900–13 200 Kč ≈ o 1 000 Kč méně); okraje léta 2027
na FeWo+Airbnb; léto 2028 na Airbnb ověřit; anomálie Booking (11. 9. 2026 za 319 €,
17.–20. 7. 2027 za 529 €); min. noci 2 v létě (viz 7.2).

## 8. Konkurence očima hosta — zadání rešerše (zatím NESPUŠTĚNO)

Otázka, na kterou to má odpovědět: **co si můžeme dovolit?** Ceník podle bodu 2 umí držet parity,
ale výši základní ceny z něj nevyčteš. Dnes ji drží zkušenost; tohle má být druhý zdroj.

**Persona:** skupina **16+ osob z Beneluxu** (BE/NL, případně přilehlé Německo — vzdálenosti v rámci
Beneluxu jsou zanedbatelné), která se rozhoduje **Krkonoše × Alpy**, zima. Nesrovnávat jen cenu domu.

**Srovnávací jednotka: € na osobu a týden**, ne cena za noc. Dnešní cíl 14 000 Kč/noc = 98 000 Kč/týden
≈ 4 000 € ≈ **250 €/os./týden při 16 lidech**. To je číslo, které taková skupina porovnává.

**Co sledovat u konkurence:**

- kapacita 16+ pod jednou střechou, **výhradní pronájem celého domu** × dům rozdělený mezi víc skupin
- doprava k vleku: skibus zdarma × parkování u sjezdovky (kolik stojí, jak daleko), nutnost řetězů
  a zimní výbavy, sjízdnost příjezdu
- vybavení areálu, na který dům navazuje, a možnost přejíždět mezi areály bez auta
- wellness (sauna), vlastní pozemek, parkování zdarma
- cena celkem za týden a přepočet na osobu; kolik z ceny je „povinné navíc" (úklid, ložní prádlo,
  turistický poplatek, kauce)

**Naše silné stránky, které mají být v porovnání explicitně oceněné** (tohle je vstup, ne závěr):

1. **Skibus zdarma** — hlavní hodnota není „zdarma", ale že vysadí u sjezdovky: žádné hledání
   parkování a placení za něj, a skupina se může rozdělit na víc areálů bez logistiky aut.
2. **Bez sněžných řetězů** — příjezd k domu po rovině, stoupá se až skibusem, hosté nemusí řídit
   do kopců ani mít zimní výbavu navíc.
3. **Celý dům jen pro jednu skupinu** — když někdo v noci dělá bordel, vyřeší si to skupina mezi
   sebou; ve velkém domě s víc skupinami to nejde.
4. Sauna, vlastní pozemek, parkování zdarma.

**Poziční hypotéza k ověření:** nejsme první liga (Špindlerův Mlýn, Pec pod Sněžkou), ale jsme
bezstarostná varianta bez auta. Otázka zní, kolik ta bezstarostnost unese v ceně.

**Metoda:** veřejné weby (Booking/Airbnb/Vrbo/chalet portály pro Alpy) + stránky areálů, sběr
strukturovaný do tabulky, výstup do `docs/konkurence-benelux.md`. Bez přihlášení, jen veřejná data.
Rešerše dá **rozpětí, ne číslo** — tvrdší důkaz o cenové hladině zůstává vlastní: jak rychle se
termíny za 14 000 Kč prodávají.

## 9. Stav

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
- [x] cenová politika, min. noci, horizont a kontrola rozhodnuty (bod 7) — 13. 8. 2026
- [ ] rozhodnutí 1–4 (bod 3) a vyplnění `cenik-2027.json` podle politiky v bodě 7
      (včetně `min_nocí` a hranic sezón dopočítaných na 2027–2029)
- [ ] **min. noci v létě 2027 zvednout na 5** (Booking i Airbnb mají dnes 2) — nejrychlejší oprava
- [ ] první asistovaný zápis + ověřovací re-audit
- [ ] měsíční rituál (audit + otevření dalšího měsíce) jako scheduled task — termín určit
- [ ] rešerše konkurence z pohledu beneluxské skupiny (bod 8) → `docs/konkurence-benelux.md`
