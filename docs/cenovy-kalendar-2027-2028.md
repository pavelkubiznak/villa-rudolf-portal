# Cenový kalendář 21. 9. 2026 – léto 2028: návrh podle zadání z 21. 9. 2026

Stav k 21. 9. 2026. Návrh, **nic z toho není zapsané v extranetech ani v živém ceníku** — čísla jsou
v [`cenik-navrh-2026-09-21.json`](cenik-navrh-2026-09-21.json) a počítá je `scripts/cenik.mjs … --cenik docs/cenik-navrh-2026-09-21.json`.
Navazuje na [`cenova-logika-2027-2028.md`](cenova-logika-2027-2028.md) (prázdniny, výjimky, model čistého výnosu)
a na benchmark konkurence ze 17. 9. 2026 (artefakt „Krkonošský cenový benchmark“, airbnb.cz + booking.com, 16 hostů; shrnutí v sekci 4).

## 0. Krátká odpověď: co 13 400 / 14 900 znamená na kanálech

Zadání: **13 400 Kč/noc mimo sezónu, 14 900 Kč/noc v sezóně = cena na e-chalupách = cena pro nás** (bez provize).
Portály musí po provizi vynést totéž, proto je cena pro hosta na portálu = čistý výnos ÷ (1 − provize):

| hladina | čistý výnos = **přímo** (web + e-chalupy) | **Booking.com** (15 %) | **Airbnb** (15,5 %) | **FeWo-direkt** (8 %; host vidí + ~8 % servisní popl.) |
|---|---|---|---|---|
| mimo sezónu | **13 400 Kč** | **641 €** (15 770 Kč) | **15 900 Kč** | **592 €** (host ≈ 639 €) |
| sezóna: léto, zima | **14 900 Kč** | **713 €** (17 540 Kč) | **17 600 Kč** | **658 €** (host ≈ 711 €) |
| špička (zima + 10 %) | 16 400 Kč | 784 € | 19 400 Kč | 725 € (host ≈ 783 €) |
| Vánoce (týden s 24. 12.) | 18 000 Kč | 861 € | 21 300 Kč | 795 € (host ≈ 859 €) |
| Silvestr (týden s 31. 12.) | 20 000 Kč | 956 € | 23 700 Kč | 884 € (host ≈ 955 €) |

Kurz 24,6 Kč/€. Booking nevratný plán = −8 % (sezóna 656 €, tj. čistých 13 700). Po provizi vychází na všech třech
portálech 13 400 / 14 900 ± 0,3 % (`node scripts/cenik.mjs provize 2027 --cenik docs/cenik-navrh-2026-09-21.json`).

Pro hosta je to v sezóně **713 € × 7 = 4 991 €/týden ≈ 277 €/os. při 18 lidech** (skutečný medián skupiny, Pavel 21. 9.; dnes 569 € → 221 €/os.);
mimo sezónu 641 € × 7 = 4 487 € ≈ 249 €/os. Na osobu a noc: 40 € v sezóně, 36 € mimo.

## 1. Co se proti 17. 9. mění a co zůstává

| | 17. 9. 2026 (živý `cenik.json`) | **21. 9. 2026 (tento návrh)** |
|---|---|---|
| čistý výnos mimo / sezóna | 11 900 / 12 900 (ceny 2026) + 4 %/rok → 2027: 12 400 / 13 400 | **13 400 / 14 900**, plošně od teď do března 2028 i pro léto 2028 |
| přímá cena (web + e-chalupy) | Booking × 0,9 → 13 100 / 14 200 (host ušetří 10 %, ~5 % zůstane nám) | **= čistý výnos, 13 400 / 14 900** (host přímo ušetří celou provizi ~15 %) — rozhodnutí A |
| Vánoce | 15 700 čistého (k potvrzení) | **18 000 týden s 24. 12., 20 000 týden s 31. 12.** — rozhodnutí B |
| indexace 4 %/rok | od roku 2027 | až od 2029 (skok +12,6 / +15,5 % pokrývá provizi i ~2 roky indexace) — rozhodnutí C |
| sezóny, min. noci, horizont, výjimky | | **beze změny** (léto 5, Vánoce 5, zima 2, mimo 2, výjimky 2–3); výjimky ze 17. 9. převzaté + doplněné o Velikonoce a máj 2028 |

## 2. Kalendář po úsecích (noci; odjezd = poslední noc + 1)

Sloupec „období“ říká, odkud cena plyne (sezóna z pravidla, nebo výjimka z prázdnin DE/NL/BE/CZ). „ZAVŘENO“ = leží za
18měsíčním horizontem a otevře se měsíčním rituálem, až k němu okno dojede (léto 2028 je prémiové, proto otevřené už teď).

| noci od | do | nocí | období | přímo Kč | Booking € | Airbnb Kč | FeWo € | min. | stav |
|---|---|---|---|---|---|---|---|---|---|
| 21. 9. 2026 | 18. 12. 2026 | 89 | mimo | 13 400 | 641 | 15 900 | 592 | 2 | otevřeno |
| 19. 12. 2026 | 1. 1. 2027 | 14 | Vánoce 2026 — **prodáno** (Mandy + blok) | 18 000 | 861 | 21 300 | 795 | 5 | — |
| 2. 1. 2027 | 5. 2. 2027 | 35 | zima 2027 | 14 900 | 713 | 17 600 | 658 | 2 | otevřeno |
| 6. 2. 2027 | 12. 2. 2027 | 7 | špička: krokus VL + Winterferien SN/BY/MV (**prodáno** Richard 12 os.) | 16 400 | 784 | 19 400 | 725 | 2 | — |
| 13. 2. 2027 | 19. 2. 2027 | 7 | zima 2027 | 14 900 | 713 | 17 600 | 658 | 2 | otevřeno |
| 20. 2. 2027 | 26. 2. 2027 | 7 | špička: voorjaar NL + détente FWB | 16 400 | 784 | 19 400 | 725 | 2 | otevřeno |
| 27. 2. 2027 | 28. 2. 2027 | 2 | zima 2027 | 14 900 | 713 | 17 600 | 658 | 2 | otevřeno |
| 1. 3. 2027 | 13. 3. 2027 | 13 | zima prodloužená (détente FWB, jarní prázdniny CZ) | 14 900 | 713 | 17 600 | 658 | 2 | otevřeno |
| 14. 3. 2027 | 24. 3. 2027 | 11 | mimo | 13 400 | 641 | 15 900 | 592 | 2 | otevřeno |
| 25. 3. 2027 | 3. 4. 2027 | 10 | Velikonoce (Velký pátek 26. 3., Ostern DE, paasvakantie VL) | 14 900 | 713 | 17 600 | 658 | 3 | otevřeno |
| 4. 4. 2027 | 23. 4. 2027 | 20 | mimo | 13 400 | 641 | 15 900 | 592 | 2 | otevřeno |
| 24. 4. 2027 | 8. 5. 2027 | 15 | meivakantie NL, printemps FWB, 1. máj, Himmelfahrt + most | 14 900 | 713 | 17 600 | 658 | 3 | otevřeno |
| 9. 5. 2027 | 25. 6. 2027 | 48 | mimo | 13 400 | 641 | 15 900 | 592 | 2 | otevřeno |
| 26. 6. 2027 | 3. 9. 2027 | 70 | léto 2027 — **prakticky prodáno** (zbylé 1–2 noci) | 14 900 | 713 | 17 600 | 658 | 5 | otevřeno |
| 4. 9. 2027 | 22. 10. 2027 | 49 | mimo | 13 400 | 641 | 15 900 | 592 | 2 | otevřeno |
| 23. 10. 2027 | 5. 11. 2027 | 14 | podzimní prázdniny CZ/NL Zuid/FWB/VL + Reformationstag, Allerheiligen | 14 900 | 713 | 17 600 | 658 | 3 | otevřeno |
| 6. 11. 2027 | 17. 12. 2027 | 42 | mimo | 13 400 | 641 | 15 900 | 592 | 2 | otevřeno |
| 18. 12. 2027 | 24. 12. 2027 | 7 | **Vánoce 2027** | 18 000 | 861 | 21 300 | 795 | 5 | otevřeno |
| 25. 12. 2027 | 31. 12. 2027 | 7 | **Silvestr 2027** | 20 000 | 956 | 23 700 | 884 | 5 | otevřeno |
| 1. 1. 2028 | 7. 1. 2028 | 7 | kerstvakantie NL/BE do 9. 1. (poptávka 70 %) — zima + 10 % | 16 400 | 784 | 19 400 | 725 | 3 | otevřeno |
| 8. 1. 2028 | 25. 2. 2028 | 49 | zima 2028 | 14 900 | 713 | 17 600 | 658 | 2 | otevřeno |
| 26. 2. 2028 | 3. 3. 2028 | 7 | špička: krokus + détente + voorjaar NL | 16 400 | 784 | 19 400 | 725 | 2 | otevřeno |
| 4. 3. 2028 | 18. 3. 2028 | 15 | zima prodloužená (détente FWB do 10. 3., jarní prázdniny CZ do 19. 3.) | 14 900 | 713 | 17 600 | 658 | 2 | otevřeno |
| 19. 3. 2028 | 7. 4. 2028 | 20 | mimo | 13 400 | 641 | 15 900 | 592 | 2 | ZAVŘENO (od 10/2026) |
| 8. 4. 2028 | 22. 4. 2028 | 15 | Velikonoce 2028 (Velký pátek 14. 4., Ostern DE) | 14 900 | 713 | 17 600 | 658 | 3 | ZAVŘENO (od 11/2026) |
| 23. 4. 2028 | 28. 4. 2028 | 6 | mimo | 13 400 | 641 | 15 900 | 592 | 2 | ZAVŘENO |
| 29. 4. 2028 | 6. 5. 2028 | 8 | 1. máj + meivakantie NL + printemps FWB | 14 900 | 713 | 17 600 | 658 | 3 | ZAVŘENO |
| 7. 5. 2028 | 30. 6. 2028 | 55 | mimo | 13 400 | 641 | 15 900 | 592 | 2 | ZAVŘENO |
| **1. 7. 2028** | **1. 9. 2028** | 63 | **léto 2028** (odjezd 2. 9.) | 14 900 | 713 | 17 600 | 658 | 5 | otevřeno (prémiová) |

Vánoce 2028 podle pravidla: 23. 12. 2028 – 6. 1. 2029 (18 000 / 20 000), otevřít společně s létem 2028.
Podzim 2028 před naceněním ověřit DE prázdniny (`overit` v `svatky.json`).

## 3. Proč tyhle hladiny (a ne jiné)

- **Mimo sezónu 13 400 / sezóna 14 900** je zadání; poměr sezóna : mimo je 1,11 (dřív 1,08). Rozdíl 1 500 Kč/noc
  je pořád malý na to, aby mimosezónní cena „prodávala“ — hlavní páka mimo sezónu je horizont a min. noci, ne cena.
- **Výjimky zůstávají relativní k sezónám** (`jako: zima, koef 1.0/1.1`), takže se přepočítaly samy: Velikonoce, máj,
  podzimní prázdniny a březen na 14 900, beneluxské špičky na 16 400. Nic z toho nevyžaduje novou úvahu — kalendář prázdnin
  se nezměnil, jen hladina.
- **Vánoce 18 000 = 14 900 × 1,21**, stejný poměr, který ceník měl (15 700 : 12 900). Držet 15 700 při sezóně 14 900
  by znamenalo Vánoce jen +5 % nad obyčejný lednový týden — to neodpovídá ničemu, co benchmark ukázal.
- **Silvestr 20 000 zvlášť**: benchmark 17. 9. — na Silvestra 2026 zbývá v celém regionu **17 objektů pro 16+ ze ~140**
  a Airbnb doplňuje výsledky z Polska; ceny jsou 2–3× březnové (Saunový zámek Vítkovice 49 958 → 152 014 Kč/týden).
  Ty sám jsi u toho řekl, že Silvestr je „opravdu nízko a na příští rok ho musíme hodně zvýšit“. 20 000 čistého = 23 700 Kč
  na Airbnb = 166 000 Kč/týden: v silvestrovském žebříčku 2026 by to bylo 6. místo z 11 (nad Saunovým zámkem 152 tis.,
  pod polskými domy 164–208 tis.). Vzhledem k tomu, že jsme jediný 5,0★ objekt s bazénem, saunou a 5 koupelnami,
  je to obhajitelné; ještě výš (25 000+) bych šel až s daty z prodeje Silvestra 2027.
- **Léto 2028 na 14 900 bez indexace** (rozhodnutí C): 2028 se prodává během 2027, hladina 14 900 je proti dnešním
  12 900 už +15,5 %. Alternativa 15 500 (× 1,04) je jeden údaj v JSON (`rok_zaklad: 2027`).

## 4. Kde bychom stáli proti konkurenci (benchmark 17. 9. 2026)

Srovnání pro **týden 13.–20. 3. 2027, 16 hostů, airbnb.cz** (18 volných objektů 16+ v okolí):

| | dnes | návrh |
|---|---|---|
| Villa Rudolf na Airbnb | 12 800 Kč/noc = 89 600 Kč/týden, **4. z 18** | 13.–13. 3. zima 17 600, od 14. 3. mimo 15 900 → ≈ **113 000 Kč/týden, 2. z 18** |
| nad námi | Křenov 62 (114 741), U Dvou vleků Interhome (109 548), Kouzelná Bouda (89 820) | jen Křenov 62 (13 lůžek, 8 koupelen, 5,0★/9) |
| medián trhu | ≈ 67 000 Kč/týden | beze změny |

Březen je z pohledu benchmarku nejtvrdší test — je to mimosezóna s velkou nabídkou. V něm bychom byli druzí nejdražší,
ale s nejlepším poměrem hodnocení × vybavení (jediný 5,0★ nad 80 tis.). V zimě (leden–únor, 17 600 Kč → 123 000/týden)
a hlavně o Vánocích je trh napjatý (Booking: 86 % ubytování ve Svobodě obsazeno na březnový týden, 94 % na Silvestra) a cena
se tam obhajuje sama. Kontrolní číslo, které to rozhodne, není benchmark, ale **tempo prodeje** zimy 2027 za 713 €
(report z `vr_bookings` zatím není — `cenova-logika` sekce 4).

Pro hosta z Beneluxu: 312 €/os./týden v sezóně je pořád pod Sauerlandem (80–157 tis. Kč/týden, 173 km od Düsseldorfu)
i Allgäu (91–335 tis.); prodáváme 900–1 000 km cesty za skibus bez řetězů, celý dům pro jednu skupinu a bazén.

## 5. Dnešní extranety proti návrhu (audit 12. 8. 2026 + zápis 15. 9.)

`node scripts/cenik.mjs diff docs/audit-cen/2026-08-12.json --cenik docs/cenik-navrh-2026-09-21.json`:

| kanál | dnes | návrh | rozdíl |
|---|---|---|---|
| Booking léto 2027 | 569 € | 713 € | +25 % (po provizi dnes jen 11 900 čistého) |
| Booking zima 2027 | 499–529 € | 713 € (špičky 784 €) | +35–57 % |
| Booking mimo 9/2026–12/2027 | 499–529 € | 641 € | +21–28 % |
| Booking Vánoce 2027 | 529 € (nevratná 487 €) | 861 € / Silvestr 956 € | +63–81 % |
| Airbnb zima 2027 / 2028 | 12 900 / 13 200 Kč | 17 600 Kč | +33–36 % |
| Airbnb mimo | 11 900–12 900 Kč | 15 900 Kč | +23–34 % |
| Airbnb Vánoce 2027 | 15 700 Kč | 21 300 / 23 700 Kč | +36–51 % |
| FeWo léto 2027 / 2028 | 559 / 589 € | 658 € | +18 / +12 % |
| FeWo zima 2027 / 2028 | 529 / 549 € | 658 € | +24 / +20 % |
| FeWo Vánoce 2027 | 639 € | 795 / 884 € | +24–38 % |

Dvě věci, které z toho plynou hned:

1. **Silvestr 2027 se právě teď prodává za starou cenu.** Na Bookingu visela 15. 9. žádost 27. 12. 2027 – 2. 1. 2028
   za 523 €/noc, na FeWo je „Sandra B.“ 27. 12.–3. 1. jako tentativní (16 hostů). Pokud se kterákoli potvrdí, je Silvestr
   2027 pryč za ~11 000 čistého. **Vánoce + Silvestr 2027 zapsat jako první**, ještě před zimou.
2. **Podzim 2026 (od teď do 18. 12.)** je na Airbnb z větší části blokovaný nebo prodaný (audit: říjen–prosinec „blok“ +
   rezervace Sabine, Frederika). Zvýšení na 641 € tam tedy skoro nic neriskuje; volných nocí je málo.

Pořadí zápisu (podle rizika, ne podle kalendáře): Vánoce + Silvestr 2027 → zima 2027 (leden–březen, včetně špiček) →
léto 2028 + Vánoce 2028 → mimosezóna 2026–2027 a výjimky → zima 2028. Runbook zápisu zůstává `cenova-parita-2027.md` sekce 5.

## 6. Rozhodnutí k potvrzení

- **A. Přímá cena = čistý výnos (13 400 / 14 900), nebo Booking × 0,9 (14 100 / 15 700)?** Zadání 21. 9. říká první
  (e-chalupy = cena pro nás). Host přímo pak ušetří ~15 %, ne 10 % jako v modelu ze 17. 9. Návrh počítá s první variantou
  (`model.primo: "cisty_vynos"`); druhá je změna jednoho klíče.
- **B. Vánoce 18 000 + Silvestr 20 000** (návrh), nebo zachovat 15 700 na oba týdny (Booking 747 €, Airbnb 18 600, FeWo 691 €)?
- **C. Léto 2028 za 14 900** (návrh), nebo indexovat na 15 500?
- **D. Výjimky** (Velikonoce, máj, podzim, březen na 14 900; beneluxské týdny a 1.–7. 1. 2028 na 16 400; min. noci 3 u svátků) —
  převzaté ze 17. 9., dosud nepotvrzené. Nově doplněné Velikonoce a máj 2028 leží za horizontem, nespěchají.
- Beze změny a dál čeká: váhy trhů v `svatky.json`, test dny × noci na e-chalupách, ověření provize Airbnb po 13. 10. a
  Payments by Booking ve faktuře, DPH z provizí.

## 7. Jak s tím pracovat

```bash
node scripts/cenik.mjs provize 2027 2028 --cenik docs/cenik-navrh-2026-09-21.json   # hladiny → kanály
node scripts/cenik.mjs kalendar --od 2026-09-21 --do 2028-09-02 --cenik docs/cenik-navrh-2026-09-21.json   # den po dni
node scripts/cenik.mjs plan --kanal booking --cenik docs/cenik-navrh-2026-09-21.json   # plán zápisu na kanál
node scripts/cenik.mjs diff docs/audit-cen/2026-08-12.json --cenik docs/cenik-navrh-2026-09-21.json   # dnešek × návrh
```

Po potvrzení A–D: obsah návrhu přepsat do `docs/cenik.json` (verze, `model.primo`, sezóny, `indexace.rok_zaklad`, `vyjimky`),
návrh a `cenik-navrh-vyjimky.json` smazat, a zapisovat do extranetů v pořadí ze sekce 5.

- [x] hladiny 13 400 / 14 900 přepočtené na Booking / Airbnb / FeWo / přímo (sekce 0)
- [x] kalendář 21. 9. 2026 – 2. 9. 2028 po úsecích včetně výjimek, Vánoc a Silvestra (sekce 2)
- [x] `scripts/cenik.mjs --cenik <soubor>` a `model.primo: "cisty_vynos"` (přímá cena = čistý výnos)
- [ ] rozhodnutí A–D → `docs/cenik.json`
- [ ] zápis do extranetů (nejdřív Vánoce + Silvestr 2027) + re-audit
- [ ] report tempa prodeje zimy 2027 za novou cenu
