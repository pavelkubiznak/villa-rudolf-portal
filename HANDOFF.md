# Předávky mezi sessions

Nejnovější nahoře. Bez PII: pobyty termínem a počtem osob, nikdy jménem.

## 2026-10-17 · Umami: heslo a návštěvy z AI vs. objednávky

**Cíl (Pavel):** zjistit, kolik lidí přišlo na villarudolf.com standardně a kolik přes ChatGPT, Claude či jinou AI, a jestli to jde dát do souvislosti s objednávkami.

**Hotové a ověřené**
- Heslo do Umami (`https://178-104-207-97.sslip.io`, uživatel `admin`) si Pavel 17. 10. nastavil sám skriptem (scratchpad, heslo nikde neuloženo); přihlášení funguje.
- Návštěvy villarudolf.com 7.–17. 10. 2026 (první stránka návštěvy): ChatGPT 187 (7: 5, 8: 62, 9: 73, 10.: 47), vyhledávače 71 (hlavně google.com), sociální sítě 16, jiné weby 13, bez zdroje ~565. Claude, Perplexity, Gemini, Copilot: 0.
- Lidé z ChatGPT jdou na `#rezervace`/`podminky` v 18 % návštěv, ostatní v 7–8 %. Délka (21 % nad 1 min) a počet stránek (1,5) jsou podobné.
- Supabase: `vr_requests` (formulář na webu) má jen **1 poptávku** (9. 8., DE, mobil, Umami bez zdroje). 3 přímé rezervace, ostatní z portálů. `vr_bookings.created_at` = čas importu, ne objednávky → souvislost s objednávkami zatím nejde spočítat.
- Skupina „bez zdroje“ obsahuje Pavlovy vlastní návštěvy, hosty z odkazů v e-mailech (`/pruvodce/`) a část z aplikace ChatGPT bez utm.

**Další krok:** Pavlovi srozumitelně ukázat čísla výše (neviděl je, předchozí tah skončil jen okénkem) a zeptat se na **jedno**: zařídit ve villa-rudolf-site měření zdroje poptávky (Umami event při odeslání formuláře + sloupec `source` ve `vr_requests` z utm_source/referreru + zobrazení ve /sprava/). Doporučení: ano, jinak se souvislost s objednávkami nikdy nezjistí. Volitelně se hostů ve zprávě/registraci ptát „jak jste nás našli“.

**Soubory a dotazy:** Umami SQL přes `ssh root@178.104.207.97` + `docker exec -i umami-db sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"'` (SQL na stdin), tabulka `website_event` (hostname, utm_source, referrer_domain, visit_id); Supabase projekt `fpknbrzbqpalguajskut`, tabulky `vr_requests`, `vr_holds`, `vr_bookings`. Paměť `memory/umami-chatgpt-mereni.md`.

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
