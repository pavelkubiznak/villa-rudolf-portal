# Cenová logika 2027–2028: prázdniny, inflace, další kritéria, dny × noci, kontrola

Stav k 16. 9. 2026. Navazuje na [`cenova-parita-2027.md`](cenova-parita-2027.md) (ceník, runbook zápisu,
politika sezón) a odpovídá na otázku z 16. 9. 2026: *ceny v extranetech jsou ceny roku 2026 — podle čeho
je nastavit na 2027 a 2028?*

## 0. Krátká odpověď

1. **Kalendáře prázdnin a svátků DE / NL / BE / CZ na 2027 a 2028 jsou v repu** —
   [`data/svatky.json`](../data/svatky.json) (272 rozsahů: 16 spolkových zemí, 3 nizozemské regiony,
   obě belgické komunity, 6 turnusů českých jarních prázdnin + celostátní). Státní svátky včetně
   regionálních počítá skript z pravidel (`node scripts/cenik.mjs svatky 2027`).
2. **Poptávkový přehled po týdnech** (`node scripts/cenik.mjs poptavka`) říká pro každý týden So–So,
   jaká část obyvatel každé země má volno, a staví to vedle sezóny a ceny z ceníku. Výsledek:
   dnešní tři sezóny sedí na léto a Vánoce, ale **zima leden–únor za 14 000 Kč je z pohledu prázdnin
   přestřelená ve většině týdnů a podstřelená ve dvou**, a v mimosezóně je **šest týdnů s poptávkou
   40–50 %** (Velikonoce, 1. máj, podzimní prázdniny), které ceník cení jako obyčejný listopad. Sekce 2.
3. **Inflace:** navrhuju roční indexaci **4 %** od základního roku 2027 (v `cenik.json` jako
   `indexace`, označeno `k_potvrzeni`). Ne 2 % podle celkové inflace — ubytovací služby v ČR zdražují
   6,8 % ročně a služby 4,5 %. Sekce 3.
4. **Další kritéria**, která u 16lůžkové vily dávají smysl: délka pobytu, předstih nákupu, tempo prodeje,
   kurz. Co smysl nedává: víkendové příplatky a dynamické ceny po dnech. Sekce 4.
5. **Dny × noci:** jediná bezpečná konvence je *noc = datum, kdy host tu noc spí* (datum příjezdu
   té noci). Booking, Airbnb i FeWo takhle cenu ukládají (kalendářová buňka = noc začínající tím dnem).
   Kde to ověřené není (e-chalupy, megaubytko), popisuju test na jedné známé rezervaci. Sekce 5.
6. **Spolehlivost správy z jednoho místa:** ano, přes prohlížeč, ale jen jako *asistovaný zápis
   s ověřením po každém uložení* — ne jako automat. Co to drží pohromadě, je kontrolní systém
   (invarianty + re-audit + měsíční rituál). Sekce 6.

Rozhodnutí, která z toho plynou a čekají na Pavla, jsou v sekci 7.

## 1. Kalendáře: co je v datech a jak se z nich počítá poptávka

### 1.1 Zdroje (načteno 16. 9. 2026)

| Země | Co | Zdroj |
|---|---|---|
| DE | školní prázdniny všech 16 zemí, 2026/27 Vánoce, 2027, 2028 | schulferien.org (přepis KMK); podzim 2028 u HB/NI/MV/ST/SH má zdroj sloučené rozsahy → `overit` |
| DE | státní svátky vč. regionálních (Fronleichnam, Reformationstag, Allerheiligen, Buß- und Bettag…) | pravidla ve skriptu |
| NL | schoolvakanties Noord/Midden/Zuid 2026-27 a 2027-28 (adviesdata Rijksoverheid) | medilexonderwijs.nl |
| BE | Vlaanderen 2026-27, 2027-28 (+ Vánoce 2028 `overit`); Fédération Wallonie-Bruxelles 2026-27 až 2028-29 | kampkompas.be, RTBF (arrêté 20. 11. 2025) |
| CZ | MŠMT Organizace školního roku 2026/2027 a 2027/2028 vč. 6 turnusů jarních prázdnin po okresech | msmt.gov.cz |

Belgie má od 2022 dva různé školní rytmy: Vlámové mají 1 týden krokus a 2 měsíce léta, frankofonní
komunita 2 týdny détente (únor/březen), 2 týdny printemps (**květen**, ne Velikonoce) a léto jen
od začátku července do konce srpna s pozdějším začátkem. Německo má 16 kalendářů; pro vilu jsou nejblíž
Sasko, Berlín, Braniborsko (Zimní prázdniny v únoru, léto od 1. resp. 10. 7. 2027). Nizozemsko
má tři regiony s posunutým létem a jarem. Česko rotuje jarní prázdniny po šesti turnusech
(2027 od 1. 2. do 14. 3., 2028 od 7. 2. do 19. 3.); Trutnov je ve skupině C.

### 1.2 Jak se počítá „poptávka“

Skóre týdne = průměr přes pět pracovních nocí (Ne→Po … Čt→Pá) z podílu obyvatel země, kteří mají
*následující den* volno: víkend se nepočítá (má ho každý), započítávají se školní prázdniny (rozsah
Po–Pá roztažený o přilehlý víkend), státní svátky (regionální jen pro své země) a **mosty** (pondělí
před úterním a pátek po čtvrtečním svátku). Regiony jsou vážené obyvatelstvem; země mají v
`svatky.json` váhy `vahy_zemi` (dnes 1 : 1 : 1 : 1 — **doladit podle skutečného mixu hostů**, viz 7).

Je to ukazatel *možnosti jet*, ne *chuti jet do Krkonoš*: 100 % v srpnu neznamená, že srpen je
nejžádanější týden pro lyžařskou destinaci. Proto se skóre nepřevádí na cenu automaticky —
říká, kde se ceník s kalendářem rozchází, a rozhodnutí zůstává ruční (výjimka v ceníku).

## 2. Co z kalendářů plyne pro ceník

Výstup `node scripts/cenik.mjs poptavka --od 2027-01-01 --do 2028-12-31`, zkráceně:

### 2.1 Léto sedí, okraje ne

| týden od | DE | NL | BE | CZ | mix | ceník |
|---|---|---|---|---|---|---|
| 26. 6. 2027 | 18 % | 0 % | 23 % | 40 % | 20 % | léto 14 000 |
| 3. 7. 2027 | 33 % | 0 % | 100 % | 100 % | 58 % | léto |
| 24. 7. – 21. 8. 2027 | 76–100 % | 100 % | 100 % | 100 % | 80–100 % | léto |
| 28. 8. 2027 | 38 % | 34 % | 23 % | 40 % | 34 % | léto 14 000 |
| 4. 9. 2027 | 29 % | 0 % | 0 % | 0 % | 7 % | mimo 12 900 |

Jádro léta (od poloviny července do ~20. srpna) má sto procent všude — tam je 14 000 Kč spíš dolní
odhad a rešerše konkurence (parita 8) může ukázat prostor výš. **První týden (26. 6.) a poslední
(28. 8.) jsou slabší** — Německo ještě/už učí, Benelux taky. To nemusí znamenat slevu (pravidlo
„radši neprodat“ platí), ale je to místo, kde upsell na celý týden bude nejtěžší a kde dává smysl
min. noci 5 místo 7. Pro 2028 platí totéž (1. 7. jen 47 %, 26. 8. 57 %).

### 2.2 Zima leden–únor: jednotná cena 14 000 neodpovídá kalendáři

| týden od | DE | NL | BE | CZ | mix | pozn. |
|---|---|---|---|---|---|---|
| 2. 1. 2027 | 68 % | 0 % | 0 % | 0 % | 17 % | DE Weihnachtsferien do 8./9. 1. |
| 9. 1. – 30. 1. 2027 | 0–18 % | 0 % | 0 % | 0–20 % | 0–8 % | jen české jarní prázdniny |
| **6. 2. 2027** | 24 % | 0 % | **58 %** | 14 % | 24 % | vlámský krokus + Winterferien SN/BY/MV |
| **20. 2. 2027** | 0 % | **66 %** | **42 %** | 21 % | **32 %** | NL voorjaar Noord+Midden, FWB détente |
| 27. 2. 2027 | 2 % | 0 % | 42 % | 17 % | 15 % | **mimo** 12 900 — FWB détente ještě běží |
| 1. 1. 2028 | 79 % | 100 % | 100 % | 0 % | **70 %** | NL/BE kerst až do 9. 1. 2028 |
| 8. 1. – 19. 2. 2028 | 0–12 % | 0–31 % | 0 % | 14–20 % | 0–13 % | |
| **26. 2. 2028** | 16 % | **69 %** | **100 %** | 15 % | **50 %** | krokus + détente + NL voorjaar |
| 4. 3. 2028 | 4 % | 0 % | 42 % | 21 % | 17 % | **mimo** 13 400 — détente běží do 10. 3. |

Zima je pro vilu hlavní produkt (skibus, Benelux), takže prázdniny nejsou jediný důvod přijet —
proto politika říká „leden + únor 14 000“. Kalendář ale ukazuje dvě věci:
(a) **týdny 6. 2. a 20. 2. 2027 a 26. 2. 2028 jsou beneluxské špičky** a snesou víc než 14 000,
(b) **hranice zimy 28. 2. je náhodná** — frankofonní détente 2027 běží do 5. 3. a 2028 do 10. 3.,
české jarní prázdniny do 14. resp. 19. 3. Návrh: zimu definovat pravidlem „1. 1. až konec
posledních jarních prázdnin trhů“ (prakticky do poloviny března), nebo první dva březnové týdny
jako výjimky. Sekce 7, rozhodnutí 2.

### 2.3 Mimosezóna: šest týdnů, které ceník podceňuje

`node scripts/cenik.mjs poptavka --navrh --prah 35` vypíše týdny v mimosezóně s mixem ≥ 35 %:

| týden od | mix | důvod | ceník dnes |
|---|---|---|---|
| 27. 3. 2027 | **51 %** | Velikonoce (DE 96 %, BE 66 %) | 12 900 |
| 24. 4. 2027 | 35 % | NL meivakantie 100 % + Koningsdag | 12 900 |
| 1. 5. 2027 | **41 %** | 1. máj (So), FWB printemps, NL mei, DE Himmelfahrt 6. 5. + most | 12 900 |
| 23. 10. 2027 | **42 %** | podzimní prázdniny CZ 60 %, BE 42 %, NL Zuid, DE 32 % | 12 900 |
| 30. 10. 2027 | 38 % | Vlaanderen herfst 100 %, DE Reformation/Allerheiligen | 12 900 |
| 8. 4. 2028 | **46 %** | Velikonoce (DE 85 %) | 13 400 |
| 15. 4. 2028 | 37 % | Ostern DE 87 % | 13 400 |
| 29. 4. 2028 | **48 %** | 1. máj + NL mei 100 % + FWB printemps | 13 400 |

Velikonoce 2027 (27. 3. – 5. 4.) jsou přesně ten příklad, který má `cenik.json` v poznámce k výjimkám.
Návrh: pro tyhle týdny **výjimka s cenou zimy** (14 000, resp. indexovaně 14 600 v 2028) a min. noci 3–4.
Šablonu výjimek vypíše `--navrh`, stačí doplnit cenu a vložit do `vyjimky`.

### 2.4 Vánoce: první vánoční týden je slabší než druhý

Týden 18. 12. 2027 má jen 19 % (školy končí až 22.–24. 12.), týden 25. 12. 2027 100 % a
1. 1. 2028 ještě 70 % (NL/BE kerst do 9. 1.). V 2028 je to jinak: 23. 12. 2028 85 %, 30. 12. 62 %.
Pravidlo „týden s 24. 12. + týden s 31. 12.“ tedy pro 2027 chytá jeden slabší a jeden silný
týden; 17 000 na oba je obhajitelné jen pokud se prodávají dohromady (min. noci 5 to nedělá).
K úvaze: Silvestr výš než Štědrý den, nebo týden 1.–8. 1. 2028 zdražit na vánoční hladinu, protože
Benelux má ještě prázdniny. Není to velký peníz, ale je to přesně případ „zapomněl jsem zdražit“.

## 3. Inflace: roční indexace

**Data (ČSÚ, srpen 2026):** inflace 1,9 % meziročně, průměr za 12 měsíců 2,0 %; **ubytovací služby
+6,8 %**, stravovací +3,9 %, služby celkem +4,5 %; elektřina −11,2 %, plyn −4,8 %, teplo +1,5 %,
vodné/stočné +3,9 %. Eurozóna 3,3 % (Německo 2,9 %) — hosté z Beneluxu a Německa vidí vyšší
inflaci než my, takže zdražení v EUR o 3–4 % pro ně není znát.

**Proč ne 2 %:** cena vily se neporovnává se spotřebním košem, ale s ostatním ubytováním — a to
zdražuje třikrát rychleji. Zafixovat cenu léta 2028 na dnešní hladině znamená prodat ho o 6–7 %
levněji, než bude v tu dobu trh.

**Proč ne 6,8 %:** je to jedno číslo z jednoho měsíce, tažené hotely ve velkých městech;
energie (největší variabilní náklad) letos klesají.

**Návrh: 4 %/rok, základní rok 2027**, zaokrouhleno na stovky: 14 000 → 14 600 (2028),
12 900 → 13 400, 17 000 → 17 700. V EUR při kurzu 24,6: 569 → 593 €. Zapsáno v
`cenik.json` jako `indexace` (`k_potvrzeni`); skript už s ním počítá (`plan` ukáže 2028 indexovaně,
`--bez-indexace` bez). Přehodnotit vždy v září s novým číslem ČSÚ — je to jeden údaj v JSON, ne
přepisování cen. Indexace se skládá s kurzem: při posunu kurzu o víc než 3 % (dnes tolerance) se
přepočítává i tak.

## 4. Další kritéria: co u 16lůžkové vily dává smysl

Ceník má dnes tři páky: sezóna, min. noci, horizont. Co lze přidat a co ne:

| Kritérium | Dává smysl? | Proč / jak |
|---|---|---|
| **Délka pobytu** | ano | dnes jen min. noci; přidat *cenu za týden* (7 nocí So–So za cenu 6,5 noci) jako druhý produkt v létě — nebo naopak příplatek za krátký pobyt v prémiové sezóně. Airbnb má týdenní slevu jako pole, Booking a FeWo ne (jen restrikce) → jednodušší varianta je **příplatek 10 % na 5–6 nocí v létě** ručně přes cenu úseku |
| **Předstih nákupu (lead time)** | ano, ale ne slevou | pobyt koupený 18 měsíců dopředu za dnešní cenu = ztráta indexace. Řeší to sekce 3 (cena roku, ne cena dneška), ne cenová křivka podle předstihu |
| **Tempo prodeje (pace)** | ano, jako signál | jediný tvrdý důkaz o hladině: když se týdny za 14 000 prodají rok dopředu, je cena nízko. Měřit z rezervací (datum vzniku × datum pobytu) — data jsou v `vr_bookings` a kalendáři; report zatím neexistuje (sekce 8) |
| **Obsazenost okolo** | ano, ručně | prázdná mezera 2–3 noci mezi rezervacemi: doprodej jen jako prodloužení, dno 50 % (politika 7.2). Sirotčí noci uprostřed prémiové sezóny neotvírat levně |
| **Kurz Kč/€** | ano, už je | plánovací kurz v ceníku, přepočet při pohybu > 3 % |
| **Náklady (energie, úklid)** | nepřímo | do indexace; nemá smysl je promítat do ceny po dnech. Výjimka: topná sezóna má vyšší marginální náklad prázdné noci → nepodporuje slevy v zimě |
| **Den v týdnu** | ne | dům se prodává celý na 5–7 nocí; víkendový příplatek jen rozbíjí jednotnost cen mezi kanály. Výjimka: zima min. 2 noci Čt–Ne — tam se řeší min. noci a příjezdový den, ne cena |
| **Dynamické ceny po dnech (Smart Pricing, PriceLabs)** | ne | tržní modely jsou kalibrované na apartmány pro 2–4 osoby; pro celý dům s 3 kanály a ručním zápisem to přidá chaos, ne výnos. Smart Pricing zůstává vypnutý |
| **Velikost skupiny** | k úvaze | cena je dnes za dům bez ohledu na počet lidí. Cena „od 12 osob + X Kč/os.“ funguje na Bookingu (occupancy pricing) i FeWo, na Airbnb hůř. Zvedá výnos z plných skupin, ale komplikuje paritu → až po rešerši konkurence |
| **Události v regionu** | okrajově | Krkonoše nemají akci, která by naplnila 16lůžkový dům sama; nesledovat |
| **Sníh** | ne | nedá se naplánovat; last-minute reakce jen ručně |

Pořadí přínosu podle odhadu: (1) indexace, (2) zima podle kalendáře, (3) výjimky Velikonoce/máj/podzim,
(4) min. noci/týdenní produkt v létě, (5) occupancy pricing.

## 5. Dny × noci: konvence a ověření

### 5.1 Jedna konvence pro všechno v repu

**Noc je identifikovaná datem, kdy host tu noc spí** (datem příjezdu té noci). Pobyt pá–ne = noci
pá a so = 2 noci; neděle je odjezd, nic se za ni neplatí a v ceníku ani auditu se neobjeví.
`cenik.mjs` už tak pracuje: rozsah `od`–`do` jsou noci včetně, odjezd = `do + 1`
(sezóna léto 2027 = noci 26. 6. – 3. 9., odjezd 4. 9.). iCal má DTEND *exkluzivní* (= den odjezdu),
takže z něj noci vzniknou jako `DTSTART … DTEND − 1`.

### 5.2 Co který kanál ukládá do buňky s datem

| Kanál | Buňka kalendáře s datem D | Rozsah v UI/URL | Stav ověření |
|---|---|---|---|
| Booking.com | cena/restrikce za **noc začínající D**; den odjezdu je volný k prodeji | List view `from`/`until` a Bulk edit „From“ / „Up to and including“ = noci | ověřeno 15. 9. 2026 (min. noci 26. 6. – 3. 9. = noci, 3. 9. poslední noc) |
| Airbnb | cena za **noc začínající D**; multikalendář zobrazuje noci, den odjezdu volný | `edit-selected-dates/OD/DO` = noci včetně | ověřeno 15. 9. 2026 |
| FeWo-direkt / Vrbo | cena za **noc začínající D**; rezervace zobrazená jako blok příjezd→odjezd, den odjezdu půlený | `rail/minimumStay?selectionStart&selectionEnd` = noci | ověřeno 15. 9. 2026 pro min. pobyt; cenu ověřit stejně |
| e-chalupy.cz | sezónní ceník „od–do“ — **neověřeno**, zda hranice sezóny je noc nebo den pobytu; obsazenost zobrazuje dny | administrace, sezónní ceník | **ověřit** (test 5.3) |
| megaubytko.cz | **neověřeno** | — | **ověřit** (test 5.3) |

Zásada pro audit: **snapshot v `docs/audit-cen/` má u každého kanálu pole `klic: "noc"`** a číslo
ceny je vždy *cena noci začínající tím datem*. Když se u kanálu zjistí, že UI myslí dny pobytu,
převod se udělá při čtení (den odjezdu se zahodí) a `klic` zůstane „noc“ — do ceníku ani diffu
se cizí konvence nesmí dostat.

### 5.3 Test, který to rozhodne (5 minut v Chrome, read-only)

Vzít jednu známou rezervaci, např. **Simon 16 os., 19.–25. 9. 2026** (příjezd 19., odjezd 25. → noci
19.–24., šest nocí), a na každém kanálu se podívat, jak je označené **25. 9.**:

- buňka 25. 9. je *volná / prodejná* → kanál pracuje s nocemi (konvence sedí),
- buňka 25. 9. je *obsazená* → kanál zobrazuje dny pobytu (odjezdový den se při čtení zahazuje;
  při zápisu ceny pro noci A–B je třeba vyplnit A až B+1? — ověřit i směr zápisu),
- popup rezervace ukazuje počet nocí × cenu → přímé potvrzení.

Totéž pro sezónní ceník e-chalup: zadat testovací sezónu (nebo přečíst existující) a porovnat
hranici s tím, kolik nocí platí host s příjezdem den před hranicí. Výsledek zapsat do tabulky 5.2.

### 5.4 Kde chyba dny × noci reálně vzniká

- **Hranice sezón:** „léto do 31. 8.“ — je 31. 8. poslední noc, nebo den odjezdu? V ceníku je to
  noc (odjezd 1. 9.). Při zápisu do extranetu se hranice vždy zadává jako *poslední noc*.
- **Min. noci na dnech:** restrikce „min. 5 nocí“ na datu D platí pro pobyt *s příjezdem D* (Booking,
  Airbnb i FeWo). Aby platila pro celé léto, musí být zapsaná na všech nocích sezóny; noc před
  sezónou s min. 2 pak umožní příjezd 25. 6. na 2 noci přes hranici — je to známé a přijatelné.
- **iCal DTEND:** exkluzivní. Skript, který by z iCalu počítal obsazenost po nocích, nesmí DTEND
  započítat (relevantní pro budoucí report tempa prodeje).
- **Audit napříč kanály:** porovnávat se smí jen po převodu na noci; rozdíl o jeden den na hranici
  úseku je nejčastěji právě tohle, ne cenová chyba.

## 6. Spolehlivost správy z jednoho místa a kontrolní systém

### 6.1 Co je reálné

- **API:** Booking Connectivity, Airbnb i Vrbo/Expedia jen pro certifikované partnery; e-chalupy a
  megaubytko API nemají. Channel manager zamítnut 13. 8. 2026 ([`kanaly-jedno-misto.md`](kanaly-jedno-misto.md)).
  Jediná cesta k jednomu místu je tedy **ceník v repu + zápis přes Chrome** — a ta funguje: 15. 9. 2026
  se min. noci 5 zapsaly na tři kanály za jednu session a ověřily.
- **Není to automat.** Vstupy do Airbnb chodí se zpožděním a ztrácejí se v sérii; Booking po rychlém
  čtení rate-limituje kalendářní API a špatná URL zneplatní session; FeWo má rozjetou hlavičku měsíce.
  Každý z těch tří problémů by tichý skript nechal projít jako „hotovo“. Proto zápis jen s Pavlem u
  počítače, po jednom kroku, s potvrzením před uložením a **kontrolou po uložení**.
- **Pracnost:** měsíční rituál (audit + otevření dalšího měsíce + oprava) ~20–30 minut; hromadný
  zápis nové sezóny na tři kanály ~1 hodina. Bez channel manageru to nejde stlačit níž; s ním by
  odpadla jen část (e-chalupy a megaubytko stejně ručně).

### 6.2 Kontrolní systém: čtyři invarianty a kdy se kontrolují

| # | Invariant | Kontrola | Kdy |
|---|---|---|---|
| I1 | Každá prodejná noc v prémiové sezóně má na každém kanálu cenu ≥ cíl − 3 % | `cenik.mjs diff <snapshot>` → řádky „POD CENOU“ | měsíčně + po každém zápisu |
| I2 | Za naceněným horizontem není nic otevřené; ceník sahá aspoň měsíc za nejvzdálenější otevřený den | `diff` → „má být ZAVŘENO“; `plan` → stav | měsíčně |
| I3 | Min. noci: nikde 1; léto a Vánoce ≥ 5 na všech plánech (Booking oba rate plans) | audit čte restrikce (Booking List view „Restrictions“, Airbnb rozsah, FeWo rail) | měsíčně + před otevřením sezóny |
| I4 | Automatiky vypnuté: Airbnb Smart Pricing off, last-minute sleva v prémiových obdobích off; Booking nevratná = −8 %, ne víc | audit `nastaveni` v snapshotu | měsíčně |

Postup zápisu, který dělá z „asistovaného“ „spolehlivé“:

1. **Plán před zápisem** — `cenik.mjs plan --kanal X --jen cena` (nebo `--jen min_noci`) → tabulka
   úseků. Uložit jako `docs/audit-cen/zapis-RRRR-MM-DD.md` se sloupci *úsek · kanál · stará · nová · uloženo · ověřeno*.
2. **Zápis po úsecích**, každé uložení odsouhlasené. Úsek = řádek plánu; nikdy neslučovat úseky s
   různou hodnotou do jednoho bulk editu.
3. **Ověření hned po uložení stejným čtením, jaké dělá audit** (Booking List view s `from/until`,
   Airbnb `edit-selected-dates` panel, FeWo `rail/manage`), ne z potvrzovací hlášky. Do tabulky
   zapsat *ověřeno* až podle přečtené hodnoty.
4. **Re-audit celého změněného rozsahu do snapshotu** (`docs/audit-cen/RRRR-MM-DD.json`) a
   `cenik.mjs diff` → musí být 0 řádků POD CENOU v tom rozsahu. Snapshot je zároveň důkaz pro příště.
5. **Rozdíl mezi snapshoty** („co se změnilo od minule“) odhalí cizí zásah: automatiku kanálu,
   ruční změnu, nebo cenu, kterou otevřel posun okna Airbnb. To je ta část, kterou jednorázová
   kontrola nezachytí a měsíční rituál ano.

Denní hlídání nemá cenu (parita 7.5): chyba vzniká v měsíčním rytmu. Co ale stojí za připomínku
mimo rituál: **září** (nové číslo ČSÚ → indexace; nové kalendáře prázdnin na další rok — MŠMT vydává
v létě, KMK a Rijksoverheid dřív), **před otevřením prodeje léta** (srpen, 11 měsíců dopředu)
a **před Vánocemi** (kontrola, že Silvestr má cenu).

### 6.3 Co zbývá, aby to bylo spolehlivé i bez Pavla

Nic z toho není podmínka provozu; je to pořadí, ve kterém by se z „asistovaného“ dalo ubírat:

1. skript pro čtení snapshotu z uložených HTML/JSON extranetů místo ručního přepisu (dnes dělá Claude ručně),
2. report tempa prodeje z `vr_bookings` (sekce 4),
3. teprve pak zvážit, jestli zápis min. nocí a otevírání měsíce nemůže běžet bez potvrzování —
   cena nikdy.

## 7. Rozhodnutí pro Pavla

1. **Indexace 4 %/rok od 2027** (sekce 3) — potvrdit, změnit, nebo 0. Dopad: léto 2028 14 600 místo 14 000.
2. **Zima podle kalendáře** (2.2): (a) nechat 14 000 plošně leden–únor, (b) prodloužit zimu do
   poloviny března (pravidlo „do konce jarních prázdnin trhů“), (c) přidat příplatek na beneluxské
   týdny 6. 2. a 20. 2. 2027, 26. 2. 2028. Doporučuju **b + c**.
3. **Výjimky v mimosezóně** (2.3): Velikonoce, 1. máj, podzimní prázdniny na cenu zimy a min. noci 3.
   Doporučuju ano — `poptavka --navrh` dá šablonu, doplní se cena.
4. **Vánoce** (2.4): 17 000 na oba týdny, nebo Silvestr výš a týden 1.–8. 1. 2028 na vánoční hladinu.
5. **Váhy trhů** v `svatky.json` (`vahy_zemi`): dnes 1:1:1:1. Podle rezervací posledních dvou let
   odhadnout skutečný mix (např. DE 2 : NL 2 : BE 2 : CZ 1) — mění to jen sloupec „mix“, ne data.
6. **Test dny × noci** (5.3) na e-chalupách a megaubytku — 5 minut v Chrome, read-only, při příštím auditu.
7. Nezměněno a dál čeká: cena Vánoc 17 000, mimosezóna 12 900, koeficient e-chalup 0,9 (parita 3).

## 8. Stav a další kroky

- [x] kalendáře prázdnin DE/NL/BE/CZ 2027–2028 v `data/svatky.json`, státní svátky z pravidel (16. 9. 2026)
- [x] `cenik.mjs svatky` a `cenik.mjs poptavka` (týdny, mix, `--navrh`, `--json`)
- [x] indexace v `cenik.json` + ve skriptu (`k_potvrzeni`)
- [x] konvence noc = datum příjezdu noci zapsaná (5.1), tabulka kanálů (5.2)
- [ ] rozhodnutí 1–5 → zapsat do `cenik.json` (sezóna zima / výjimky / indexace / váhy)
- [ ] test dny × noci na e-chalupách a megaubytku (5.3) při příštím auditu
- [ ] ověřit podzim 2028 DE (`overit` v datech) na kmk.org před naceňováním podzimu 2028; Vánoce 2028 NL (zatím chybí) a BE/CZ (`overit`)
- [ ] první asistovaný zápis cen podle plánu (parita 5) + re-audit → invarianty I1–I4
- [ ] report tempa prodeje z `vr_bookings` (sekce 4)
- [ ] měsíční rituál jako scheduled task (parita 7.5)
