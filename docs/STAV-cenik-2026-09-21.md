# Stav ceníku a zápisu do kanálů — handoff 21. 9. 2026

**Rozhodnuto (Pavel 21. 9. 2026), zapsáno v `docs/cenik.json` verze 2026-09-21:**
čistý výnos = přímá cena: mimo 13 400 · sezóna (léto, zima) 14 900 · špičky 16 400 · Vánoce 18 000 · Silvestr 20 000.
Portály přes provizi: Booking 641 / 713 / 784 / 861 / 956 € · Airbnb 15 900 / 17 600 / 19 400 / 21 300 / 23 700 Kč ·
FeWo 592 / 658 / 725 / 795 / 884 €. Kalendář po úsecích: `docs/cenovy-kalendar-2027-2028.md` sekce 2.
Nevratná −10 % (Booking rate plan, Airbnb volba, přímo ve smlouvě). Min. noci: léto 5, Vánoce+Silvestr 5, zima 2, mimo 2, svátky 3.

**Zápis do extranetů NEPROBĚHL.** Jde jen asistovaně přes Chrome s Pavlem u počítače (API nejsou, channel manager
zamítnut — `docs/kanaly-jedno-misto.md`); e-chalupy CZ+EN a Megaubytko vždy ručně. Odhad: 3 portály ~1 h, e-chalupy + Megaubytko ~30 min.

## Pořadí zápisu (podle rizika) — každý krok = jedna relace, runbook `docs/cenova-parita-2027.md` sekce 5

1. **Booking: Vánoce + Silvestr 2027** (18.–24. 12. 861 €, 25.–31. 12. 956 €, 1.–7. 1. 2028 784 €; oba plány; nevratná −10 %).
   Pozor: visí žádost 27. 12.–2. 1. za 523 €/noc — nepotvrzovat. Pak FeWo (795/884/725 €) a Airbnb (21 300/23 700/19 400).
2. Zima 2027 (2. 1.–13. 3.) vč. špiček 6.–12. 2. a 20.–26. 2. na všech třech portálech.
3. Léto 2028 (1. 7.–1. 9.) + Vánoce 2028 (23. 12. 2028–6. 1. 2029) — Booking až kalendář dosáhne.
4. Mimosezóna od října 2026 + výjimky (Velikonoce, máj, podzim 2027; zima 2028 vč. špičky 26. 2.–3. 3.).
5. e-chalupy (CZ + anglická verze) a Megaubytko: sezónní ceník 13 400 / 14 900 / 18 000 / 20 000; doplnit ID Megaubytka do ceníku.
6. Nastavení: Booking nevratná 8 → 10 %; Airbnb nevratná volba zapnout, last-minute −15 % v prémiových obdobích vypnout, Smart Pricing off.
7. Re-audit každého zapsaného rozsahu → `docs/audit-cen/RRRR-MM-DD.json`, `node scripts/cenik.mjs diff <snapshot>`.

Plán pro konkrétní kanál: `node scripts/cenik.mjs plan --kanal booking|airbnb|fewo|echalupy --jen cena` (a `--jen min_noci`).

## Otevřené (nespěchá, rozhodne Pavel)
- Dvě mimosezónní hladiny: listopad–polovina března (mimo prázdniny) na 12 400? (`docs/trhy-hostu-2026-09.md` sekce 3)
- Květen–červen jako sezóna 14 900 (německé svátky, 22 z 34 pobytů) — dnes jen výjimka 24. 4.–8. 5.
- Polsko do `data/svatky.json` + váhy trhů DE 3 : CZ 2,5 : PL 1,5 : NL 1 : BE 0,5.
- Ověřit: provize Airbnb 15,5 % po 13. 10., Payments by Booking ve faktuře, dny × noci na e-chalupách a Megaubytku.
- Necommitnuté změny v repu: `git status` — commitnout po kontrole.
