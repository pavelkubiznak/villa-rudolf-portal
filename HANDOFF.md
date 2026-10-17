# Předávky mezi sessions

Nejnovější nahoře. Bez PII: pobyty termínem a počtem osob, nikdy jménem.

## 2026-10-17 · Hlášení cizinců: nová registrace z lednice a čtečka dokladu

**Cíl (Pavel):** cizince hlásit na cizineckou policii (UbyPort) co nejvíc bez Pavla; další skupina (příjezd 18. 10., Booking, 9 dosp. + 3 děti, DE) už novou cestou.

**Hotové a ověřené**
- Pobyt 10.–17. 10. (13 Němců) nahlášen 14. 10. 23:40, doručenka 13/13 přijato; na Disku `ubyport/2026/<objednatel> 10.-17.10.2026` (PDF, UNL, snímek výpadku UbyPortu). Data byla ve starém Google Formu (lednice má pořád starý QR).
- 17. 10. zveřejněno na villarudolf.com (Pavel výslovně schválil): villa-rudolf-site #48 (kontrola čísla dokladu podle státu, datum narození na 3 políčka) a #49 (čtečka dokladu foťákem, **pro hosty schovaná**, zapíná se jen `?ctecka=1`). Pages nasazeno, `doklady.js`, `ctecka.js`, `vendor/tesseract/` vrací 200. Testy `tools/test-doklady.mjs` (350) a `tools/test-mrz.mjs` (35) OK.
- Denní e-mail (n8n VrDailyTasks) registraci a lhůtu hlídá správně — chyba byla jen v tom, že data šla do Google Formu.

**Hotové, neověřené**
- Migrace `20261013_vr_persons_birth_limit.sql` (mez 110 let) z #48 **není aplikovaná** v živé DB (volitelná).
- Čtečka nikdy nezkoušena na skutečném telefonu se skutečným dokladem.

**Další krok:** poslat Pavlovi odkaz `https://villarudolf.com/registrace/?ctecka=1&lang=cs` a postup zkoušky čtečky na jeho telefonu s vlastní občankou/pasem (zadá kód od dveří pobytu od 18. 10.; osobu NEODESÍLAT, jen zkontrolovat přečtené údaje). Podle výsledku zapnout čtečku pro hosty (odstranit podmínku `SCAN_ON` v `registrace/registrace.js` ~ř. 792) nebo nechat schovanou.

**Otevřené otázky pro Pavla (pořadí, doporučení)**
1. Kód od dveří u pobytu 18. 10. není uložený v /sprava/ (fallback = posledních 5 číslic telefonu; HA tabulka `vr_door_codes_ha` je prázdná, kódy v Yale nastavuje ručně). Doporučuju: uložit skutečný kód z Yale do /sprava/, jinak se hosté z lednice nezaregistrují.
2. Vytisknout `~/Downloads/Villa-Rudolf-registrace-QR-lednice.pdf` (QR → villarudolf.com/registrace) a vylepit na lednici — Pavel to chtěl udělat v sobotu.
3. Zavřít starý Google Form (`1PWePidQH5XHgA-ZWWt1nlvIjhiJKt8CqIKMROflHlYE`) se zprávou ve 4 jazycích „registrujte se na villarudolf.com/registrace, zadejte kód od dveří“ — přes Chrome, jen na Pavlovo ano. Doporučuju ano (pojistka pro starý QR).
4. WS_UBY (odesílání policii bez přihlašování): policie nic neposlala; PDF `~/Downloads/RegUpWS_23903562_…_2026_09_23.pdf` nejspíš nikdy neodešlo datovou schránkou Sintery na `ybndqw9`. Zeptat se, případně připravit znovu (odeslání DS = NEVRATNÉ).
- Nad tím otevřený villa-rudolf-site #41 (nové zprávy hostům T−10/T−2) čeká na Pavlův merge; registraci nemění.

**Soubory:** paměť `memory/ubyport-unl-hlaseni.md`, `memory/evidence-hostu-google-form.md`; site `registrace/`, `sprava/sprava.js` (UNL ~ř. 2370–2510), `n8n/VrDailyTasks/`, CLAUDE.md sekce „Hlášení cizinců (UbyPort)“.
