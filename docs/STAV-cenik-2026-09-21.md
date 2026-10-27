# Stav ceníku a zápisu do kanálů — handoff 21. 9. 2026

**Rozhodnuto (Pavel 21. 9. 2026), zapsáno v `docs/cenik.json` verze 2026-09-21:**
čistý výnos = přímá cena: mimo 13 400 · sezóna (léto, zima) 14 900 · špičky 16 400 · Vánoce 18 000 · Silvestr 20 000.
Portály přes provizi: Booking 641 / 713 / 784 / 861 / 956 € · Airbnb 15 900 / 17 600 / 19 400 / 21 300 / 23 700 Kč ·
FeWo 592 / 658 / 725 / 795 / 884 €. Kalendář po úsecích: `docs/cenovy-kalendar-2027-2028.md` sekce 2.
Nevratná −10 % (Booking rate plan, Airbnb volba, přímo ve smlouvě). Min. noci: léto 5, Vánoce+Silvestr 6 (5. 10. 2026), zima 2, mimo 2, svátky 3.

**Zápis do extranetů BĚŽÍ (od 5. 10. 2026).** Záloha před zápisem: `docs/audit-cen/2026-10-05.json` + `2026-10-05-zaloha.md`.
Horizont ceníku 24 měsíců (Pavel 5. 10. 2026); měsíční úloha `vr-cenik-mesicni-posun` (1. v měsíci 8:30, read-only audit + plán).

### Zapsáno
- 5. 10. 2026 **Booking Vánoce+Silvestr 2027**: Standard 18.–24. 12. 861 €, 25.–31. 12. 956 €, 1.–7. 1. 2028 784 €
  (Nevratná dopočtená −8 %: 792,12 / 879,52 / 721,28 €); min. noci obou plánů 18.–31. 12. 6, 1.–7. 1. 3. Ověřeno v List view.
  Žádost 27. 12.–2. 1. za 523 €/noc nedotčena.
- 5. 10. 2026 **FeWo Vánoce+Silvestr 2027**: 18.–24. 12. 795 €, 25.–31. 12. 884 €, 1.–7. 1. 2028 725 €; min. pobyt 6 / 6 / 3. Ověřeno v kalendáři.
- 5. 10. 2026 **Airbnb Vánoce+Silvestr 2027**: 21 300 / 23 700 / 19 400 Kč; min. noci 18.–31. 12. 6 (beze změny), 1.–7. 1. 3. Ověřeno přes kalendářní data.
- 5. 10. 2026 **FeWo zima 2027**: 2. 1.–13. 3. 658 €, špičky 6.–12. 2. a 20.–26. 2. 725 €. Ověřeno.
- 5. 10. 2026 **Airbnb zima 2027**: 2. 1.–13. 3. 17 600 Kč, 20.–26. 2. 19 400 Kč (6.–12. 2. je rezervace). Ověřeno.
  Min. noci v zimě beze změny — únorové špičky zůstávají 6–7 (Pavel 5. 10. 2026), ceník tam říká 2.
- Přehled očima hosta na všech kanálech: `docs/audit-cen/2026-10-05-prehled-verejne.md` (e-chalupy CZ/EN/SK, Megaubytko a web mají celé staré ceny; czech-cottages.com má název „Rudolfův Dvůr“).
- 5. 10. 2026 **Booking zima 2027**: Standard 2. 1.–13. 3. 713 €, 6.–12. 2. a 20.–26. 2. 784 € (Nevratná −8 %). Ověřeno v List view.
- 6. 10. 2026 **FeWo léto + Vánoce 2028**: 1. 7.–1. 9. 2028 658 € (dřív 549–589), 23.–29. 12. 795 €, 30.–31. 12. 884 € (dřív 689);
  min. pobyt léto 5 (ověřeno), 23.–31. 12. 6. **Kalendář FeWo končí 31. 12. 2028** — noci 1.–5. 1. 2029 (884 €, min. 6) zapsat, až se otevře leden 2029.
- 6. 10. 2026 **Airbnb léto 2028**: 1. 7.–1. 9. 17 600 Kč (dřív 14 450 / 12 900), min. 5 beze změny. Ověřeno.
  **Airbnb Vánoce 2028 NEJDOU**: „Termíny vzdálené více než dva roky ode dneška nemůžeš upravovat.“ Den se dá upravit až ve chvíli,
  kdy se otevře k prodeji (okno 24 měsíců) — 23. 12. 2028 tedy od 23. 12. 2026, a do té doby se otevírá za základ 12 900 Kč.
  Ochrana: základní cenu Airbnb zvednout aspoň na mimosezónu 15 900 Kč (krok 3/4) a Vánoce 2028 zapsat 23. 12. 2026 ráno.
- 6. 10. 2026 **Booking léto 2028**: 1. 7.–16. 8. 2028 Standard 713 € (Nevratná dopočtená 655,96 €), min. 5 na obou plánech. Ověřeno v List view.
  Za 16. 8. 2028 extranet nesahá — 17. 8.–1. 9. 2028 a Vánoce 2028 dopsat, až se kalendář posune.
- 6. 10. 2026 **Booking Plánovač dostupnosti: výchozí cena 529 → 641 €** (16 měsíců / 488 dní, „Aktualizovat také stávající ceny“ VYPNUTO —
  bylo zapnuté a přepsalo by celý kalendář). Ověřeno: Vánoce/Silvestr/zima beze změny.
  **Pozor:** plánovač při otevření nového dne „použije základní cenu“ — léto 2028 (713 €) se otevírá ~2. 3.–16. 4. 2027 a nejspíš spadne
  na 641 €. Měsíční úloha musí léto 2028 po otevření přepsat znovu (nebo na tu dobu dát výchozí cenu 713 €).
- 6. 10. 2026 **Kontrola obsazenosti napříč kanály** (Booking List view, Airbnb, FeWo, Supabase, kalendář rezervací, holdy):
  všechny potvrzené pobyty jsou na Bookingu, Airbnb i FeWo zavřené, KROMĚ **21.–28. 8. 2027 (přímá smlouva, `vr_holds` `hold_until` 25. 9. 2026,
  stav „hold“, platba nezapsaná)** — Booking zavřený, Airbnb a FeWo otevřené. **Vyřešeno 6. 10.:** zaplaceno (Pavel) → hold v Supabase `confirmed`,
  rezervace v e-chalupách 21.–28. 8. 2027, Airbnb i FeWo po importu zavřené (ověřeno). Příčina: kalendář rezervací má od 28. 9.
  `CALENDAR_DRY_RUN=1` → `data/out/*.ics` nestojí na přímých prodejích, propadlý hold zmizel a nový se nepropíše — rozhodne Pavel. Supabase: Airbnb 25.–29. 3. 2027 (host v Supabase) na Airbnb neexistuje = duch; Booking 2.–6. 6. 2027
  a Airbnb 21.–31. 7. 2027 nemají hosta v Supabase (pobyt bez kontaktu). Tabulka po dnech: `docs/audit-cen/2026-10-06-dny.json`
  (bez jmen) + artefakt „Ceny po dnech na všech kanálech“.
- 9. 10. 2026 **e-chalupy (objekt 18852)**: noc letní / zimní / mimo 14 900 / 14 900 / 13 400 Kč (dřív 12 900 / 12 900 / 11 900),
  víkend = 2 × noc 29 800 / 29 800 / 26 800; Vánoce týden 126 000 (18 000/noc), Silvestr týden 140 000 (20 000/noc), v komentáři
  termíny 2027 a min. 6 nocí; vymezení sezón = léto po týdnech So–So v červenci a srpnu (min. 5), zima od Nového roku do poloviny
  března, svátky za cenu sezóny (min. 3); text „Provoz, poplatky, ceny“ s termíny 2027–2028 vč. zimních týdnů 16 400.
  **Formulář má jen jedno minimum nocí (zůstává 2) a tři sezóny** — sezónní minima a 16 400 jsou jen v textu (e-chalupy jsou
  poptávkové, minimum hlídá Pavel u poptávky). Ověřeno v administraci, na veřejné stránce CZ a na echaty.sk. **czech-cottages.com (EN)
  9. 10. po půlnoci ještě staré ceny** (12 900 / 12 900 / 11 900, víkend 25 800 / 22 800) i bez cache — vlastní kopie dat, přenáší se
  se zpožděním (texty „do 24 h“); **zkontrolovat do 10. 10.**, jinak napsat správcům. Diff: 0 úseků pod cenou.
  Záznam a záloha původních hodnot: `docs/audit-cen/2026-10-09-echalupy.md` + `.json`.
- 9. 10. 2026 **Megaubytko (objekt 13334)**: 14 ročních sezón místo 6 — TOP 1.–7. 1. 16 400 (min. 3), zima 8. 1.–25. 2. 14 900,
  TOP 26. 2.–3. 3. 16 400, zima 4.–18. 3. 14 900, mimo 19.–24. 3. 13 400, Velikonoce 25. 3.–23. 4. 14 900 (min. 3), svátky 24. 4.–8. 5.
  14 900 (min. 3), mimo 9. 5.–25. 6. 13 400, léto 26. 6.–3. 9. 14 900 (min. 5), mimo 4. 9.–22. 10. 13 400, podzim 23. 10.–5. 11. 14 900
  (min. 3), mimo 6. 11.–17. 12. 13 400, Vánoce 18.–24. 12. 18 000 (min. 6), Silvestr 25.–31. 12. 20 000 (min. 6); jinak min. 2 noci.
  Cenová kategorie 13 400–20 000 Kč za objekt (hlavička inzerátu „od 13 400 Kč“, dřív „od 4 990“), úklid 3 000 → 3 500 Kč.
  Sezóny jsou ROČNÍ: podle kalendáře 2027, kde je 2027 obsazený nebo se roky liší, podle vyšší ceny (Pavel 9. 10. 2026) —
  Velikonoce a květen pokrývají oba roky, proto jsou některé týdny 2027/2028 o 1 500 Kč dražší. **Po Novém roce 2028 posunout
  Vánoce na 23.–29. 12., Silvestr na 30. 12.–5. 1. a TOP na 6.–7. 1.** (jinak noci 1.–5. 1. 2029 vyjdou 16 400 místo 20 000).
  Ověřeno v administraci po znovunačtení, na veřejné stránce a výpočtem předběžné rezervace (dny × noci). Diff: pod cenou jen
  obsazené noci 2027 a 1.–5. 1. 2029. Záznam: `docs/audit-cen/2026-10-09-megaubytko.md` + `.json`.
- **Další v pořadí:** léto 2028 + Vánoce 2028 (Booking jen do ~16. 8. 2028), pak mimosezóna od října 2026 + výjimky;
  czech-cottages.com (EN verze e-chalup) do 10. 10. zkontrolovat, že převzal nové ceny; FeWo okno 24 měsíců až po cenách 2028;
  Booking plánovač výchozí cena 529 → 641 €; nevratná Booking 8 → 10 %.

### Zbývá (poznámky z auditu 5. 10.)
- FeWo „Frühestmögliche Buchung“ 18 → 24 měsíců až PO zápisu FeWo cen duben–říjen 2028 (jinak se otevře za 549–589 €).
- Booking Plánovač dostupnosti: výchozí cena nových dnů 529 € → mimosezóna 641 € (otevírá 16 měsíců dopředu).
- Booking otevřený do 1. 7. 2028; ručně jde nejdál ~16. 8. 2028 (léto 2028 celé zatím ne).
- Megaubytko: po Novém roce 2028 posunout Vánoce/Silvestr/TOP na termíny 2028 (viz Zapsáno 9. 10.); Velikonoce 25. 3.–23. 4. vyhovují 2027 i 2028, v roce 2029 (1. 4.) zkontrolovat.
- e-chalupy: text ceníku jmenuje termíny 2027–2028 → přepsat při každé změně výjimek v ceníku a nejpozději v září 2027
  doplnit sezónu 2028/29 (+ komentář u Vánoc a Silvestru na rok 2028). Podzimní prázdniny 2028 ceník zatím nemá (mimo 13 400),
  vymezení sezón na e-chalupách je obecně slibuje „za cenu sezóny“ — doplnit výjimku do ceníku i termín do textu.

**Původně:** Zápis do extranetů NEPROBĚHL. Jde jen asistovaně přes Chrome s Pavlem u počítače (API nejsou, channel manager
zamítnut — `docs/kanaly-jedno-misto.md`); e-chalupy CZ+EN a Megaubytko vždy ručně. Odhad: 3 portály ~1 h, e-chalupy + Megaubytko ~30 min.

## Pořadí zápisu (podle rizika) — každý krok = jedna relace, runbook `docs/cenova-parita-2027.md` sekce 5

1. **Booking: Vánoce + Silvestr 2027** (18.–24. 12. 861 €, 25.–31. 12. 956 €, 1.–7. 1. 2028 784 €; oba plány; nevratná −10 %).
   Pozor: visí žádost 27. 12.–2. 1. za 523 €/noc — nepotvrzovat. Pak FeWo (795/884/725 €) a Airbnb (21 300/23 700/19 400).
2. Zima 2027 (2. 1.–13. 3.) vč. špiček 6.–12. 2. a 20.–26. 2. na všech třech portálech.
3. Léto 2028 (1. 7.–1. 9.) + Vánoce 2028 (23. 12. 2028–6. 1. 2029) — Booking až kalendář dosáhne.
4. Mimosezóna od října 2026 + výjimky (Velikonoce, máj, podzim 2027; zima 2028 vč. špičky 26. 2.–3. 3.).
5. ✅ e-chalupy 9. 10. 2026 (CZ + echaty.sk ověřeno, czech-cottages.com zatím staré ceny — kontrola do 10. 10.) — sezónní ceník 13 400 / 14 900 / 18 000 / 20 000;
   ✅ Megaubytko 9. 10. 2026 — 14 ročních sezón 13 400 / 14 900 / 16 400 / 18 000 / 20 000, ID 13334 v ceníku.
6. Nastavení: Booking nevratná 8 → 10 %; Airbnb nevratná volba zapnout, last-minute −15 % v prémiových obdobích vypnout, Smart Pricing off.
7. Re-audit každého zapsaného rozsahu → `docs/audit-cen/RRRR-MM-DD.json`, `node scripts/cenik.mjs diff <snapshot>`.

Plán pro konkrétní kanál: `node scripts/cenik.mjs plan --kanal booking|airbnb|fewo|echalupy --jen cena` (a `--jen min_noci`).

## Otevřené (nespěchá, rozhodne Pavel)
- Dvě mimosezónní hladiny: listopad–polovina března (mimo prázdniny) na 12 400? (`docs/trhy-hostu-2026-09.md` sekce 3)
- Květen–červen jako sezóna 14 900 (německé svátky, 22 z 34 pobytů) — dnes jen výjimka 24. 4.–8. 5.
- Polsko do `data/svatky.json` + váhy trhů DE 3 : CZ 2,5 : PL 1,5 : NL 1 : BE 0,5.
- Ověřit: provize Airbnb 15,5 % po 13. 10., Payments by Booking ve faktuře (dny × noci na Megaubytku ověřeno 9. 10.: noci včetně)
  (e-chalupy: ceník je bez kalendáře, text od 9. 10. říká „termíny jsou od příjezdu do odjezdu“).
- e-chalupy mají prázdné týdenní ceny sekcí „jarní prázdniny“ a „Velikonoce“ — vyplnit = objekt se ukáže i v těch sekcích
  (např. Velikonoce čt–po 4 × 14 900 = 59 600 Kč). Nevyplněno, rozhodne Pavel.
- Necommitnuté změny v repu: `git status` — commitnout po kontrole.
