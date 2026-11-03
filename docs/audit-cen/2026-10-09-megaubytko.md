# Megaubytko — zápis ceníku 9. 10. 2026

Zadání Pavla 9. 10. 2026: „Udělej Megaubytko taky podle nového ceníku.“ Tabulku sezón schválil („Ano, uložit“).
Objekt **13334**, administrace `megaubytko.cz/admin/u11972/uprava-objektu-ceny/o13334`, veřejně `megaubytko.cz/villa-rudolf`.
Postup a pasti formuláře: runbook `docs/cenova-parita-2027.md` 5.6.

## Co je zapsané (ověřeno v administraci po znovunačtení i na veřejné stránce)

Sezóny jsou **roční** (den.měsíc), „od–do“ = **noci včetně posledního dne**. Ověřeno: předběžná rezervace 24.–30. 12. 2027
(6 nocí) = 1 × 18 000 + 5 × 20 000 = **118 000 Kč** (bez odeslání).

| sezóna (název na Megaubytku) | noci od–do | Kč / objekt / noc | min. nocí | podle |
|---|---|---|---|---|
| TOP Sezóna | 1. 1. – 7. 1. | 16 400 | 3 | 2028 (2027 obsazeno) |
| Zimní sezóna | 8. 1. – 25. 2. | 14 900 | 2 | zima (únorové špičky 2027 obsazené) |
| TOP Sezóna | 26. 2. – 3. 3. | 16 400 | 2 | špička 2028 |
| Zimní sezóna | 4. 3. – 18. 3. | 14 900 | 2 | zima 2028 do 18. 3. |
| Mimosezóna | 19. 3. – 24. 3. | 13 400 | 2 | |
| Velikonoční pobyt | 25. 3. – 23. 4. | 14 900 | 3 | Velikonoce 2027 (25. 3.–3. 4.) i 2028 (8.–22. 4.) |
| Sezóna | 24. 4. – 8. 5. | 14 900 | 3 | květnové svátky 2027 i 2028 |
| Letní mimosezóna | 9. 5. – 25. 6. | 13 400 | 2 | |
| Letní sezóna | 26. 6. – 3. 9. | 14 900 | 5 | léto 2027 (2028: 1. 7.–1. 9.) |
| Mimosezóna | 4. 9. – 22. 10. | 13 400 | 2 | |
| Sezóna | 23. 10. – 5. 11. | 14 900 | 3 | podzimní prázdniny 2027 |
| Zimní mimosezóna | 6. 11. – 17. 12. | 13 400 | 2 | |
| Vánoční pobyt | 18. 12. – 24. 12. | 18 000 | 6 | Vánoce 2027 |
| Silvestr | 25. 12. – 31. 12. | 20 000 | 6 | Silvestr 2027 |

- Min. osob 1 všude, cena „objekt / noc“.
- Cenová kategorie: **13 400–20 000 Kč** za objekt a noc, 610–20 000 Kč za osobu a noc. Hlavička inzerátu ukazuje „od 13 400 Kč / objekt / noc“.
- Doplatky: úklid **3 500 Kč** (dřív 3 000, fakta v `text-villa-rudolf.md` kap. 3), pes 500 Kč, kauce 5 000 Kč a poplatek obci 25 Kč / osoba (od 18 let) / noc zůstaly beze změny.

## Před zápisem (záloha)

- Sezóny: Zimní sezóna 1. 1.–31. 3. **12 950** (min. 4), Letní mimosezóna 1. 4.–30. 6. **11 950** (min. 2), Letní sezóna
  1. 7.–31. 8. **12 950** (min. 6), Zimní mimosezóna 1. 9.–20. 12. **11 950** (min. 4), Vánoční pobyt 20.–27. 12. **14 500** (min. 7),
  Silvestr 27. 12.–3. 1. **16 500** (min. 7).
- Kategorie 4 990–12 500 Kč za objekt (hlavička „od 4 990 Kč“), 485–12 500 Kč za osobu. Úklid 3 000 Kč.
- Strojově: `pred_zapisem` v `2026-10-09-megaubytko.json`. Starší snímek: `2026-10-05.json`.

## Diff proti ceníku 2026-09-21 (`node scripts/cenik.mjs diff docs/audit-cen/2026-10-09-megaubytko.json --kanal megaubytko`)

**Pod cenou** jsou jen:
- **Obsazené noci 2027.** 1. 1. 2027 je v ceníku za 18 000 a tady 16 400, 6.–12. 2. a 20.–25. 2. 2027 v ceníku 16 400, tady 14 900. Všechny jsou obsazené, prodat se nedají.
- **1.–5. 1. 2029** (Silvestr 2028 za 20 000, tady 16 400). Opravit po Novém roce 2028, viz níž.

**Nad cenou** (o 1 500 Kč, Vánoce a Silvestr o 2 000–4 600) jsou týdny, kde se roky 2027 a 2028 liší a platí vyšší cena:
- **2027:** 27. 2.–3. 3., 14.–18. 3., 4.–23. 4.
- **2028:** 25. 3.–7. 4., 23.–28. 4., 7.–8. 5., 26.–30. 6., 2.–3. 9., 23. 10.–5. 11., 18.–22. 12., 25.–29. 12.
- 18. 12. 2026 (jedna volná noc mezi dvěma pobyty).

Pavel 9. 10. 2026: radši neprodat než prodat pod cenou.

„Má být ZAVŘENO“ za horizontem (od 10/2028): Megaubytko nemá kalendářní horizont, prodává předběžnou rezervací
s potvrzením — každou poptávku potvrzuje Pavel.

## Co zbývá

- **Po Novém roce 2028** posunout Vánoce na 23.–29. 12., Silvestr na 30. 12.–5. 1. a TOP na 6.–7. 1. Mimosezóna 6. 11. pak potřebuje skončit 22. 12.
- **Září 2027** (revize ceníku, indexace 2029): roční sezóny přepočítat podle cenik.json 2028/29.
- Popis inzerátu má pořád obec „Trutnov“ a překlep „Trustnov“. Popis se zápisem cen neměnil, opravit zvlášť (`docs/popisy-na-kanalech.md`).
