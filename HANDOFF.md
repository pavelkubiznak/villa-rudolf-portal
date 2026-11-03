# Předávky mezi sessions

Nejnovější nahoře. Bez PII: pobyty termínem a počtem osob, nikdy jménem.

## 2026-11-03 · Ceník a texty v main (PR #21 sloučen), PR #3–#5 zavřeny, web: #54 a #52 sloučeny

**Cíl (Pavel, 3. 11.):** všechny repozitáře dotáhnout, „aby na konci byla tečka“. Session „Jedno řešení – 3. 11. 2026“ (`local_9ae49396-6503-40e7-8aa0-060791eed004`).

**Hotovo a ověřené:** lokální `main` (6 předávek + 1 necommitnutá) přenesen na `origin/main` (33 automatických `forecast.json`) a pushnut; PR #21 sloučen (merge, kontrola validate SUCCESS), větev na GitHubu smazána (lokálně zůstává kvůli worktree staré session); PR #3 a #5 zavřeny s komentářem, #4 byl už sloučený. V portálu není žádný otevřený PR.

**Web (villa-rudolf-site):** sloučeny #54 (zrušené rezervace neblokují kalendář, squash) a #52 (AI fáze 3: podmínky, info, pro koho, srovnání, FAQ ve 6 jazycích, merge); Pages nasazeno, IndexNow odesláno. #51 (volné termíny jako text) byl po tom v konfliktu – přenáší ho pomocná session (výsledek v mapě práce „Web vily – návštěvy z AI a poptávky“). #41 (zprávy T−10/T−2, konflikt od 11. 10.) a #53 (draft) = slepé koleje, doporučeno zavřít; rozhodne Pavel.

**Otevřené pro Pavla:** PR #52 zveřejnil ve všech jazycích větu „záloha 30 % po potvrzení“ (text byl na webu už dřív) – ve skutečnosti se platí celá faktura nebo 50/50; rozhodnout, jestli větu změnit (jedna věta pro session). Zprávy hostům (74,30 € + 2× poděkování): hotové texty v Obsidianu „Villa Rudolf – hosté a pobyty“, odesílá Pavel.

## 2026-10-25 · Vyúčtování Booking 18.–24. 10.: obrázek hotový (74,30 €), zbývá odeslat zprávy

**Cíl (Pavel):** „do vyúčtování mu dej všechna ta nabíjení, ať vidí, že měříme přesně“; poděkování a prosba o 10/10 zvlášť. Platba Revolut `https://revolut.me/pavelhuqh`.

**Hotovo a ověřené (5min příkon okruhu Pergola a kůlna):** 3 dlouhá nabíjení po 19. 10. 10:24–21:29 23,66 kWh; st 21. 10. 18:28 – čt 22. 10. 06:28 27,80 kWh; pá 23. 10. 13:56 – so 24. 10. 00:27 24,15 kWh. 3 krátká dobití (taky auto – stálých 2,3 kW, světla berou desítky W): út 20. 10. 02:30–03:06 1,42; út 20. 10. 08:08–08:40 1,22; so 24. 10. 05:28–06:04 1,45 kWh. Celkem 79,70 kWh × 0,33 € = 26,30 € + taxa 8 × 6 × 1 € = 48 € → **74,30 €**. Pavel chce všech šest nabíjení na obrázku (hotovo).

**Neověřené:** stavy měřáku na obrázku jsou dopočtené zpětně od stavu 24. 10. 19:36 (358,38 kWh), absolutně ±0,2 kWh; spotřeby jednotlivých nabíjení přesné. Kamera kůlna (Tapo) nemá v HA historii, snímky příjezdu auta jsou jen v aplikaci Tapo.

**Taktika zpráv (doporučeno, Pavel se ptal):** dvě zprávy přes WhatsApp (ne chat Bookingu, ten blokuje platební odkazy), němčina vyká. 1) Hned: věcné poděkování + vyúčtování s obrázkem a Revolut odkazem, bez prosby o hodnocení. 2) Až přijde platba, nejpozději za 2–3 dny: krátké poděkování a prosba o 10/10 (Booking posílá pozvánku k hodnocení e-mailem). Prosba o hodnocení vedle žádosti o peníze působí jako obchod.

**Další krok:** dát Pavlovi znovu obrázek (`SendUserFile`) a oba texty zpráv k odeslání (zpráva 1 s částkou 74,30 €, „3 Ladevorgänge und 3 kurze Nachladungen, zusammen 79,70 kWh“), počkat na jeho „posláno“, pak Obsidian „Villa Rudolf – hosté a pobyty“ (status, ask) a připomenout zprávu 2.

**Soubory:** obrázek `~/Downloads/villa-rudolf/Ladeprotokoll 18.-24.10.2026.png`, HTML zdroj `~/Downloads/villa-rudolf/ladeprotokoll-18-24-10.html` (render: headless Chrome `--screenshot --force-device-scale-factor=2 --window-size=1280,1130`), verze bez krátkých dobití `…-bez-kratkych.html` (72,95 €). Texty zpráv a časy: sdílené poznámky `side-session-notes/local_fdac4d0e-…/nabijeni-18-24-10.md`.

## 2026-10-24 · Vyúčtování po odjezdu: Booking 18.–24. 10. (taxa + nabíjení auta), poděkování a 10/10

**Cíl (Pavel):** poděkovat („it means the world for us“), požádat o 10/10 na Bookingu, vyúčtovat pobytovou taxu a nabíjení auta, platba přes Revolut `https://revolut.me/pavelhuqh`. Nabíjení „udělej mu tabulku … ať to vypadá jako měřák, profesionálně, všechny dny od kdy do kdy, kolik to bylo, ať nejsou spory“.

**Hotovo a ověřené:** taxa podle knihy hostů (Google Form, 11 zapsaných: 8 dospělých, 3 děti 11–14) = 8 × 6 nocí × 1 € = 48 €. Nabíjení z okruhu „Pergola a kůlna“ (HA `sensor.rudolf_pergola_a_kulna_energie`, mimo nabíjení 0,01 kWh/h), tři nabíjení po ~2,3 kW: 19. 10. ~10:00–21:30 = 23,66 kWh; 21. 10. ~18:00 – 22. 10. ~06:30 = 27,80 kWh; 23. 10. ~13:00 – 24. 10. ~00:30 = 24,15 kWh; celkem 75,61 kWh × 0,33 € = 24,95 € (sazba 0,33 €/kWh = jako elektřina ve smlouvách; Pavel odpověděl „OK“). Celkem 72,95 €. Krátké odběry ~1 kWh (20. 10. 02:00 a 08:00, 24. 10. 05:00; 4,1 kWh) se NEúčtují.

**Neověřené:** přesné časy začátku a konce – mám jen hodinové součty. 5minutové hodnoty drží HA jen 10 dní (do ~29. 10.): `vila_historie` s `co` = „Pergola a kůlna příkon“ (`sensor.rudolf_pergola_a_kulna_prikon`) a krátkými okny kolem začátků a konců.

**Další krok:** zjistit přesné časy z 5min příkonu, vyrobit obrázek „Ladeprotokoll E-Auto“ (vzhled měřidla: stav elektroměru na začátku a konci každého nabíjení, od–do, kWh, Kč/€, součet; plus řádek taxy). Postup jako u obrázků 17. 10.: HTML → headless Chrome `--screenshot`, `~/Downloads/villa-rudolf/`, poslat Pavlovi `SendUserFile`.

**Otevřené pro Pavla (doporučení):** jedna, nebo dvě zprávy? Doporučuju **dvě**: dnes věcné poděkování + vyúčtování s obrázkem (bez hodnocení), zítra nebo po zaplacení zvlášť krátké poděkování s prosbou o 10/10 (prosba o hodnocení vedle žádosti o peníze působí jako obchod). Němčina **vyká** (host netyká). Posílat přes **WhatsApp** (telefon je ve `vr_bookings`), chat Bookingu odkazy na platbu mimo Booking blokuje.

**Soubory:** vzor obrázků z 17. 10. ve scratchpadu staré session (`…/868fd352-…/scratchpad/abrechnung.html`, `zaehler.html`); paměť `doplatky-hostu-pres-revolut.md`; Obsidian „Villa Rudolf – hosté a pobyty“ (status čeká na Pavla).

## 2026-10-23 · Kódy hostů v Seamu: jména doplněna, trvalé kódy vráceny

**Cíl (Pavel):** „zapiš všechny ty kódy a jména hostů do zámku“, ale „mělo by se to omezit na ten jejich pobyt“ (trvalé kódy nechce).

**Hotovo a ověřené:** Seam dává time_bound kód do zámku až těsně před `starts_at` (podle dokumentace, nejde vynutit). Zkusil jsem 12 kódů převést na ongoing (trvalé, hned v zámku); Pavel to odmítl → všech 12 vráceno `/access_codes/update` na time_bound s původními časy. Kontrola 23. 10. večer: 23 kódů, všechny time_bound, čísla i časy shodné se zálohou, stav „unset“ (v zámku zatím nejsou, Seam je tam dá před příjezdem). Názvy od prosince: „Jméno Příjmení D. M. RRRR · vr:<uidh>“ (jména jen v Seamu/Yale, ne v repu). Seam má per-device limit na update → měnit po jednom za minutu. Záloha seznamu: scratchpad session `32d5f6e4-…/codes-zaloha.json`.

**Důsledek:** po zrušení Seamu (~3. 11.) se kódy od prosince do zámku samy nedostanou → Matter musí fungovat dřív, jinak Seam o měsíc prodloužit nebo kódy s časem zadat v Yale Home ručně.

**Další krok:** Pavel na vile (~2. 11.): párovací kód Matter → `matter/commission` {"code", "network_only": true}, ověřit PIN přes Matter, automatizace v HA (kód založit při příjezdu, smazat při odjezdu). Při rušení Seamu kódy nemazat ručně.

## 2026-10-23 · Kódy všech hostů v Seamu, zámek do Matteru (párování na vile přes Bluetooth)

**Cíl (Pavel):** „zapiš v Seamu úplně všechny hosty“ (trial ještě ~10 dní) a „zařídit, aby to šlo přes Matter“.

**Hotovo a ověřené**
- Seam (klíč `~/jablotron - topení/.env`): 22 budoucích pobytů 24. 10. 2026 – 1. 11. 2027, kód = posl. 5 číslic telefonu, 15:00–10:00 místního času, všechny „unset“ bez chyb. Názvy bez jmen: „Kanál D. M. RRRR · vr:<uidh>“ (formát, který čte `custom_templates/zamek.jinja`). Bez kódu: přímý pobyt 30. 6.–3. 7. 2027 (chybí telefon).
- HA 2026.10.2: služby `matter.set_lock_user` / `set_lock_credential` / `get_lock_info` existují; integrace `matter` běží (jen 2 zásuvky Tapo). `lock.vila_zamek` je z integrace `yale` (cloud) → přes Matter zatím nic.
- Yale Home: řádek „Matter“ je šedý „Požadováno Bluetooth připojení“ → párovací kód se dá vytvořit jen s telefonem u zámku.

**Neověřené:** zda L2 v Matteru hlásí podporu PIN (feature USR/PIN) – ukáže až `matter.get_lock_info` po spárování. Seam po konci trialu (~3. 11.) nejspíš kódy do zámku nezapíše.

**Další krok:** až Pavel pošle párovací kód Matter (11 číslic nebo text QR „MT:…“) z vily, hned spárovat: `python3 ha.py` → WS `matter/commission` {"code": …, "network_only": true} (kód platí jen pár minut). Pak `matter.get_lock_info` / `get_lock_users`, zkušební kód přes `set_lock_user` + `set_lock_credential` (credential_type pin), ověřit v Yale Home, smazat. Když projde: kódy pobytů po 2. 11. přes Matter a smazat je v Seamu (duplicitní číslo zámek odmítne); pro časovou platnost automatizace v HA (založit při příjezdu, smazat při odjezdu).

**Otevřené pro Pavla:** kdy bude na vile (párování chce Bluetooth u zámku) – doporučeno při nejbližší cestě, nejpozději do 2. 11.

**Soubory:** poznámky `~/Library/Application Support/Claude/side-session-notes/local_51ef0a59-…/zamek-matter-2026-10-23.md` a `…/local_0bb649d7-…/zamek-matter.md` (20. 10.); `~/jablotron - topení/homeassistant/packages/zamek_kody.yaml`; Obsidian „Kódy do zámku bez placené služby“.

## 2026-10-23 · Uvítací zprávy 24. 10.–2. 11. a kódy zámku přes Matter místo Seamu

**Cíl (Pavel):** uvítací zprávy všem hostům konce října a začátku listopadu, kódy ke dveřím v zámku. Seam (po trialu 5 $/měsíc) **nepoužívat** – kódy nahrávat přes **Matter** (zdarma; HA už má `matter.lock`).

**Hotové a ověřené**
- 3 pobyty: 24.–26. 10. (Airbnb, 14 osob), 28.–30. 10. (Airbnb, 16 + 2 batolata), 30. 10.–2. 11. (FeWo, 13). Uvítací zprávy odeslány 23. 10. přes Airbnb/FeWo i WhatsApp (texty a pravidla: paměť `uvitaci-zprava-rijen-2026.md`).
- Kódy = posledních 5 číslic telefonu (`vr_bookings.phone`), platnost příjezd 15:00 – odjezd 10:00. Hostům už poslané, **nesmí se změnit**.
- V Seamu (`~/jablotron - topení/.env` SEAM_API_KEY, device `bdeae4f7-…`): kód pobytu 24. 10. naplánovaný od 9. 10., kódy pobytů 28. 10. a 30. 10. jsem založil 23. 10. (stav „unset“ = čeká na začátek). HA automatizace `zamek_kody_pro_hosty_ze_spravy_pobytu` je vypnutá.

**Neověřené:** jestli Matter v HA umí u Yale Linus L2 zakládat PIN kódy (služby `matter.set_lock_user`/`set_lock_credential` apod., časové omezení asi ne → založit a smazat automatizací). Co Seam udělá s kódy po konci trialu (~3. 11.).

**Další krok:** v HA (`python3 ha.py` v `~/jablotron - topení`) ověřit, že Matter umí zapsat kód do zámku; když ano, založit přes Matter 3 kódy výše (stejná čísla, kód pro 24. 10. hned – host přijíždí zítra v 15:00), ověřit je v zámku a teprve pak smazat kódy v Seamu (jinak duplicitní kód, viz chyba `duplicate_code_on_device` 20. 10.). Když Matter neumí, nechat Seam do 2. 11. a říct Pavlovi.

**Otevřené pro Pavla:** zápis do `vr_bookings`/`vr_admin_config` (heslo Wi-Fi, tokeny průvodce) pojistka nepovolila – doplnit ve /sprava/ ručně, nebo povolit SQL konektor. Doporučení: heslo Wi-Fi vložit ve /sprava/ → Nastavení.

**Soubory:** `~/jablotron - topení/homeassistant/packages/zamek_kody.yaml`, `custom_templates/zamek.jinja`, HANDOFF tam (20. 10. „zámek bez Seamu“); paměť `zamek-kody-ha-nezaklada.md`, `uvitaci-zprava-rijen-2026.md`.

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
