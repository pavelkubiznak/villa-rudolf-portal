# Ochrana osobních údajů hostů — záznam o činnostech, lhůty, postupy

Stav k 11. 10. 2026. Interní dokument (čl. 30 GDPR + postupy). Veřejná informace hostům je
`villarudolf.com/podminky/` (site `podminky/podminky.js`, 4 jazyky) — co se změní tady, musí se promítnout tam.
Nic tu nejsou právní rady; je to seznam toho, co se skutečně děje s daty, a co ještě chybí.

## 1. Správce

**Sintera Czech s.r.o.**, IČO 29130336, Orlická 163/18, 500 03 Hradec Králové. Kontakt pro hosty i pro žádosti:
`rezervace@villarudolf.com` (jediná veřejná adresa; přeposílá se do schránky majitele). Pověřenec není jmenován
(není povinný). Rezervační portály (Booking.com B.V., Airbnb Ireland UC, FeWo-direkt/Vrbo, e-chalupy.cz, Megaubytko)
jsou **samostatní správci** — host jim data dal sám, my od nich dostáváme jméno, termín a kontakt.

## 2. Záznam o činnostech zpracování

| Činnost | Účel | Právní základ | Kategorie údajů | Subjekty | Kde / příjemci | Lhůta |
|---|---|---|---|---|---|---|
| Rezervace a komunikace s hostem | plnění smlouvy o ubytování | čl. 6/1 b) | jméno, jazyk, termín, počet osob, telefon, e-mail, platforma, interní poznámka | hosté (objednatel) | Supabase `vr_bookings`; `/sprava/`; e-mail (Gmail majitele); n8n na Hetzneru (zprávy, úkoly) | kontakt 30 dní po odjezdu (anonymizace), zbytek 6 let |
| Osobní průvodce (`/pruvodce/?t=`) | přizpůsobení tipů (věk dětí, termín, počasí) | oprávněný zájem čl. 6/1 f) + smlouva | token (hash), jméno, termín, věky dětí, zájmy | hosté a jejich party | Supabase RPC `vr_verify_token` (čtení; `vr_update_party` dnes žádný klient nevolá); data o výletech a počasí z tohoto repa (bez PII) | token 14 dní po odjezdu; party 30 dní (anonymizace) |
| Evidence ubytovaných osob, domovní kniha, poplatek obci, hlášení cizinců (UbyPort) | zákonná povinnost | čl. 6/1 c): § 101–102 zák. 326/1999 Sb., § 3g zák. 565/1990 Sb. | jméno, datum narození, adresa, doklad, státní občanství, termín | všechny ubytované osoby | Supabase `vr_persons`, `vr_ubyport_reports`; `/registrace/`; Policie ČR (UbyPort), obec (poplatek) | **6 let** od posledního zápisu; nelze smazat dřív |
| Smlouvy, zálohové faktury, platby | smlouva + účetnictví | čl. 6/1 b), c) | jméno, adresa, částky, VS, bankovní pohyb | přímí hosté | Supabase `vr_contracts`, `vr_holds`, `vr_payments`; iDoklad; Fio (n8n `VrPaymentWatch001`) | účetní doklady podle zákona o účetnictví (5–10 let) |
| Vstupní kódy, chytrá domácnost | plnění smlouvy, ochrana majetku | čl. 6/1 b), f) | kód zámku ke pobytu, čas otevření lednice | hosté | Supabase `door_code`, `vr_door_codes_ha`, `vr_fridge_*`; Home Assistant ve vile (`vr_ha_*`) | kód 30 dní po odjezdu |
| Fotoalbum pobytu | služba hostům | souhlas čl. 6/1 a) (nahrání fotky) | fotografie | hosté | Supabase Storage `vr-album`, Edge Function `album` | do výmazu hostem / podle alba |
| Analytika návštěvnosti | zlepšování webu | oprávněný zájem čl. 6/1 f) | země/region/město z IP (IP se neukládá), stránka, kliknutí na výlet; **bez cookies, bez tokenu** | návštěvníci webu a průvodce | Umami self-hosted na Hetzneru (Sintera) | bez PII, bez lhůty |
| Načtení stránek a dat | provoz | oprávněný zájem | IP adresa v logu hostingu | návštěvníci | GitHub Pages (Fastly), Supabase, Hetzner | logy poskytovatele |

Co se **neděje**: žádné profilování pro reklamu, žádné předávání kontaktů třetím stranám za účelem marketingu,
žádné cookies pro sledování, žádné PII v tomto repu (pravidlo porušeno 13. 8.–11. 10. 2026, viz kap. 8).

## 3. Zpracovatelé a příjemci

| Kdo | Co | Kde | Právní titul předání | Smlouva (čl. 28) |
|---|---|---|---|---|
| **Supabase Inc.** | databáze `vr_*`, Storage alba, Edge Function | AWS **eu-west-2 (Londýn, UK)** — projekt sdílený se SINTERA | UK = rozhodnutí Komise o odpovídající ochraně (2021, prodlouženo) | Supabase DPA — <https://supabase.com/legal/dpa>; **k rozhodnutí:** potvrdit/stáhnout v Dashboard → Organization → Legal documents a zapsat datum sem |
| **GitHub Inc. / Fastly** | GitHub Pages: tento repo (data výletů, počasí — bez PII) a villarudolf.com; IP adresa při načtení | USA | SCC / EU-US Data Privacy Framework (GitHub i Fastly jsou certifikované) | GitHub Data Protection Agreement (součást podmínek) |
| **Hetzner Online GmbH** | server `sintera-velin`: Umami, n8n (zprávy hostům, denní e-mail, platby), zálohy, cron počasí | DE | EU | Hetzner AVV (DPA, součást účtu Sintera) |
| **Google LLC** | Gmail majitele (komunikace s hosty), Google Drive (zálohy ze serveru — **od 11. 10. 2026 šifrované `age` před uploadem**, Google vidí jen šifrované soubory; klíč jen na serveru + offline u majitele), Google Fonts na site `/pruvodce/` (IP při načtení fontu) | USA | EU-US Data Privacy Framework | Google Workspace DPA. Zálohy vyřešeno (`provoz-runbook.md` kap. 6); **k rozhodnutí:** fonty na webu self-hostovat (tento repo už má `fonts/`) |
| **MET Norway (yr.no)** | zdroj počasí | NO | žádné osobní údaje (volá server, ne host) | — |
| **Policie ČR, obec Svoboda nad Úpou** | UbyPort, poplatek z pobytu | CZ | zákonná povinnost | — |
| **Fio banka, iDoklad (Solitea)** | platby, faktury | CZ | smlouva | podmínky služeb |
| Rezervační portály | zdroj rezervací | EU/NL/IE/US | samostatní správci | — |

## 4. Technická a organizační opatření

- Token hosta: 48 hex znaků z `gen_random_bytes(24)`; v DB jen `sha256` + `token_enc` (pgp_sym_encrypt admin klíčem,
  aby šel odkaz znovu ukázat ve `/sprava/`). Odkaz posílá majitel ručně (Booking blokuje bot-odkazy).
- Supabase: RLS na všech `vr_*` tabulkách, 0 policies, tabulkové granty pro anon odebrány (11. 10. 2026) → přístup jen přes
  SECURITY DEFINER RPC s `search_path=public`; admin RPC ověřují hash klíče + rate limit; purge jen vlastník DB / service_role.
- `vr_verify_token` vrací hostovi jen jméno, jazyk, termín a party — interní poznámka majitele (`notes`) se od 11. 10. 2026 neposílá.
- Veřejné repo: secret scanning + push protection zapnuté; žádný service_role, admin klíč ani jména hostů (kap. 8).
- Demo průvodce v tomto repu Supabase nevolá; hosty s tokenem přesměruje na villarudolf.com (od 11. 10. 2026).
- Hetzner: root přístup jen klíčem; n8n jen na localhostu; skript s anon klíčem a starým purge secretem (`purge-expired.sh`) byl 11. 10. 2026 z `/opt/vr-portal` odstraněn (záloha jen pro root).
- Zálohy: `backup-critical.sh` 04:50 UTC → Drive, od 11. 10. 2026 každý archiv šifrovaný `age` už při vzniku (klíč `/root/.age/zaloha.key`
  jen pro root + kopie u majitele offline; z balíku vyjmuty `/root/.ssh`, staré secrety a token na Drive). Rotace 7 dní lokálně,
  30 dní na Drive. Supabase vlastní zálohy podle plánu projektu (ověřit v Dashboard → Database → Backups).

## 5. Lhůty (jedno číslo pro každou věc)

| Co | Lhůta | Kde se vymáhá |
|---|---|---|
| Odkaz na průvodce (token) | **odjezd + 14 dní** | `expires_at` z `vr_admin_upsert_booking` (site `20260915_vr_token_enc.sql`) |
| Kontakt hosta (telefon, e-mail, kód, poznámky, `token_enc`) | **anonymizace 30 dní po odjezdu** | `pg_cron` `vr-purge-expired` 04:40 UTC (`20261011_vr_purge_cron.sql`); jméno, termín, platforma, počty zůstávají jako historie pobytů |
| Evidence osob (`vr_persons`), UbyPort | **6 let** | `vr_purge_expired_cron` maže pobyt až po 6 letech (cascade) |
| Účetní doklady | podle zákona o účetnictví | iDoklad, účetní |
| Analytika (Umami) | bez PII | — |
| Zálohy na Drive | **30 dní** (lokálně na velínu 7 dní); od 11. 10. 2026 šifrované `age`, nešifrované složky z doby před tím smazány 12. 10. 2026 (koš Drive, vratné 30 dní) | `backup-critical.sh` (`rclone delete --min-age 30d`) |
| Data v prohlížeči hosta | `localStorage` jen u hosta: site `vrGuide` (navštívené výlety, nastavení wizardu), `vrLang`; cache katalogu 6 h. Demo průvodce tady: jen demo party. Žádná PII hosta se v prohlížeči nedrží (od 11. 10. 2026; starý `index.html` ukládal jméno a `notes` do `vr-guest-<token>` bez expirace) | host sám (vymazání dat webu) |

Do 11. 10. 2026 retence **neběžela** (26 dní; Hetzner skript volal funkci anon klíčem). Hostům se v demo průvodci
navíc říkalo „odkaz platí 30 dní po odjezdu" — správně je 14. Obojí opraveno 11. 10. 2026.

## 6. Práva subjektů — postup

Host může chtít přístup, opravu, výmaz, omezení, přenositelnost nebo námitku. Lhůta **30 dní** od doručení.

1. **Příjem:** žádost dorazí na `rezervace@villarudolf.com` (nebo přes zprávu na portálu — odpovědět e-mailem).
   Zapsat datum doručení.
2. **Ověření totožnosti:** odpovědět na e-mail/telefon z rezervace, nebo chtít číslo rezervace + termín. Bez ověření nic neposílat.
3. **Přístup / přenositelnost:** ve `/sprava/` otevřít pobyt → opsat jméno, termín, kontakt, počty, poznámku pro úklid,
   evidované osoby (`/registrace/`); poslat jako prostý text/PDF. Umami o konkrétní osobě nic neví (nelze dohledat).
4. **Oprava:** přímo ve `/sprava/` (upsert) nebo `/registrace/`.
5. **Výmaz:** **nepoužívat „Smazat pobyt"** ve `/sprava/` — `vr_persons` mají `ON DELETE CASCADE` a smazal by se
   zákonný záznam. Postup: ve `/sprava/` vynulovat telefon, e-mail, poznámky (upsert s prázdnými poli), kód zámku;
   token zneplatnit (nový pobyt = nový token, starý se dá znehodnotit jen SQL). Evidenci osob **nelze** smazat dřív než
   po 6 letech — hostovi to sdělit s odkazem na § 101 zák. 326/1999 Sb. / § 3g zák. 565/1990 Sb. (text je i v `/podminky/`).
   Fotky v albu smazat ze Storage. Požádat portál, přes který host rezervoval, nejde — tam je host sám.
   **K rozhodnutí:** jednotlačítková RPC `vr_admin_anonymize_booking` v site (totéž, co dělá pg_cron, jen hned).
6. **Námitka proti analytice:** nic k vypnutí — Umami neidentifikuje osobu. Vysvětlit.
7. **Odpověď** hostovi e-mailem, zapsat datum vyřízení (soukromá evidence majitele, ne repo).

## 7. Postup při incidentu (únik, ztráta, neoprávněný přístup)

1. **Zastavit:** rotovat klíč (deploy key, admin klíč, service_role v Supabase), odstranit data z veřejného místa.
2. **Zapsat** (datum zjištění, co uniklo, kolik subjektů, odkud, kdo ví): tabulka níže.
3. **Posoudit riziko** pro hosty (jen jména/termíny = nízké; telefony/e-maily/kódy zámku = vyšší).
4. **Do 72 h** od zjištění oznámit ÚOOÚ (<https://uoou.gov.cz>), pokud riziko není nepravděpodobné.
5. **Informovat hosty**, pokud je riziko vysoké (kontakty + kódy zámku ano; křestní jména v auditu ne).
6. **Náprava** a zápis, co se změnilo, aby se to neopakovalo.

| Datum | Co | Rozsah | Riziko | Opatření | Oznámeno |
|---|---|---|---|---|---|
| 11. 10. 2026 | Křestní (2× celá) jména hostů + termíny + počty osob ve veřejném repu (`docs/audit-cen/2026-08-12.*`, `docs/cenova-logika-2027-2028.md`, `docs/cenovy-kalendar-2027-2028.md`, `docs/uklid-ical-2026-08.md` — dnes v `docs/archiv/`), od 13. 8. 2026 | ~10 osob, bez kontaktů | nízké | jména odstraněna commitem `051c9c0`; v git historii zůstávají (veřejné) — **rozhodnutí Pavla: `git filter-repo` + force-push + reset klonu na velínu** (postup v `provoz-runbook.md`) | ÚOOÚ ne (nízké riziko) |
| 11. 10. 2026 | Retence neběžela 15. 9.–11. 10. 2026 (purge 42501), 5 rezervací s prošlým tokenem, 3 bez anonymizace po 30 dnech | 30 rezervací s kontakty v DB déle, než slibují podmínky | nízké (data nikam neunikla) | pg_cron `vr-purge-expired` 11. 10. 2026 | ne |
| 11. 10. 2026 | Veřejný anon klíč četl tři SINTERA views (security_invoker off) | data jiného správce, 0 cizích volání v logu | nízké | site `20261011_vr_portal_hardening.sql` bod 5 | ne (věc SINTERA) |

## 8. Co je záměrně veřejné (není to únik)

- Supabase **anon klíč** (JWT role `anon`) v site `planner.js` — chráněný RLS a RPC; jediné, co přes něj jde, je ověřit
  vlastní token a uložit vlastní party.
- **Umami website-id** ve skriptu analytiky.
- `data/trips.json`, `data/forecast.json`, `data/demo-guest.json` — otevřené API pro web a TV, žádná PII.
- `docs/cenik.json`, cenové audity (po redakci jmen), texty objektu.
- Hash tokenu v DB je tajný; token samotný zná jen host a majitel (`/sprava/`).

## 9. Co chybí / rozhodnutí pro Pavla

1. **DPA Supabase** potvrdit v dashboardu a zapsat datum do kap. 3. Zvážit vlastní projekt v `eu-central-1` (Frankfurt)
   místo sdíleného UK projektu — odpadne „UK" i sdílení se SINTERA; migrace jsou v site, anon klíč se změní v planner.js.
2. **`/podminky/`** říká „datová centra v EU" — správně je Spojené království (eu-west-2) s rozhodnutím o odpovídající ochraně;
   doplnit lhůty z kap. 5 (14 / 30 dní / 6 let), větu o Umami a seznam zpracovatelů. Průvodce na site `/pruvodce/`
   na `/podminky/` neodkazuje — doplnit odkaz do patičky.
3. ~~**Zálohy na Google Drive**: šifrovat před uploadem a dát jim rotaci.~~ **Hotovo 11. 10. 2026** (`age`, rotace 30 dní byla
   už dřív; `provoz-runbook.md` kap. 6). Kopie klíče v Klíčence na Macu majitele, staré nešifrované složky na Drive smazány 12. 10. 2026.
   Doporučení: ještě papírová kopie klíče (Mac nemá funkční Time Machine).
4. **Historie repa**: `git filter-repo` ano/ne (kap. 7). Pokud ne, zapsat sem „ponecháno vědomě, nízké riziko".
5. **RPC pro anonymizaci na žádost** (`vr_admin_anonymize_booking`) ve `/sprava/`, ať se výmaz nedělá „Smazat pobyt".
6. **Google Fonts** na site `/pruvodce/` → self-host (tento repo má `fonts/`), ať se IP hosta neposílá Googlu.
7. **Osobní e-mail majitele** v User-Agentu `scripts/fetch-forecast.mjs` (veřejné repo) → `rezervace@villarudolf.com`.
8. Evidence žádostí subjektů a incidentů vést mimo repo (Disk), tady jen anonymní řádky jako v kap. 7.
