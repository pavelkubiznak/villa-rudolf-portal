# Bezpečnost

## Kam hlásit

Zranitelnost nebo podezření na únik dat: **rezervace@villarudolf.com**. Nepište to do veřejných issues.
Ozveme se do 3 pracovních dnů. Postup na naší straně je v [`docs/ochrana-udaju.md`](docs/ochrana-udaju.md) kap. 7.

## Co je veřejné záměrně (prosím nehlásit)

- **Supabase anon klíč** (JWT s rolí `anon`) ve `villa-rudolf-site/assets/planner.js` a v historii tohoto repa.
  Je to veřejný klientský klíč: všechny `vr_*` tabulky mají RLS bez policy a tabulkové granty pro `anon` jsou odebrané,
  takže s klíčem jde volat jen dvě RPC pro hosta (`vr_verify_token`, `vr_update_party`) s vlastním tokenem
  a veřejné formuláře s rate limitem. Kontrakt: [`supabase/schema.sql`](supabase/schema.sql).
- **Umami website-id** v `track.js` (analytika bez cookies).
- `data/trips.json`, `data/forecast.json`, `data/demo-guest.json` — otevřené API pro villarudolf.com a TV ve vile
  (`Access-Control-Allow-Origin: *`). Žádná osobní data; demo host je smyšlený.
- `docs/cenik.json`, cenové audity a texty objektu — obchodní podklady, ne tajemství.

## Co do repa nikdy nepatří

- `service_role` klíč, admin klíč `/sprava/`, purge secret, deploy key, hesla (Wi-Fi, extranety), SMTP údaje.
- **Jména, kontakty, termíny konkrétních hostů** — ani v auditech cen, ani v poznámkách o úklidu.
  Rezervaci popisuj termínem a počtem osob. Před commitem: `git diff | grep -iE 'rezervace [A-ZÁ-Ž][a-zá-ž]+'`.
- `data/forecast.json` v ručním commitu (generuje bot).

GitHub má zapnuté secret scanning s push protection; to chrání jen před známými tvary klíčů, ne před jmény.

## Model tokenu hosta

- 48 hex znaků z `gen_random_bytes(24)`, zakládá ho `/sprava/` (`vr_admin_upsert_booking` v site).
- V DB `sha256(token)` pro ověření a `token_enc` (pgp_sym_encrypt admin klíčem) pro opětovné zobrazení odkazu.
- Platí do **odjezd + 14 dní**; 30 dní po odjezdu pg_cron kontakt anonymizuje a token znehodnotí.
- Host dostává `villarudolf.com/pruvodce/?t=<token>`. Tento repo hosty s tokenem jen přesměruje tam
  (nic do Supabase nevolá) a sám zobrazuje demo.
- `vr_verify_token` vrací jméno, jazyk, termín a party — ne interní poznámky.

## Hosting a hlavičky

GitHub Pages neumí nastavit HTTP hlavičky; CSP je proto `<meta http-equiv="Content-Security-Policy">` v `index.html`
(povolené zdroje: vlastní origin, Umami host, fonty z `fonts/`). Pages dává HSTS a `max-age=600`.
Nasazuje se přes GitHub Actions jen allowlist souborů — `docs/`, `scripts/`, `supabase/`, `CLAUDE.md` na web nejdou.

## Rotace klíčů

| Klíč | Kde žije | Rotace |
|---|---|---|
| Admin klíč `/sprava/` | u majitele; v DB jen `vr_admin_config.admin_key_sha256` | nový hash do configu (SQL v site), nový klíč do prohlížeče; `token_enc` starých pobytů je šifrovaný starým klíčem → po rotaci je nelze zobrazit (nový token = upsert) |
| Deploy key počasí (zápis do `main`) | GitHub Deploy keys + `/root/.ssh/vr_deploy_key` na Hetzneru | postup v [`docs/provoz-runbook.md`](docs/provoz-runbook.md) kap. 3; při podezření smazat klíč na GitHubu jako první |
| Purge | **žádný secret** — retence běží v DB přes pg_cron (`vr_purge_expired_cron()` bez parametru, EXECUTE nemá nikdo) | nic k rotaci; starý `purge-expired.sh` na Hetzneru smazat |
| Supabase `service_role` | jen Supabase Dashboard | Dashboard → Settings → API → regenerate; používá ho n8n v site |

## Známá rizika (vědomě přijatá / k rozhodnutí)

- Deploy key se zápisem do `main` leží na serveru sdíleném s dalšími projekty Sintery. Kompromitace serveru = možnost
  podvrhnout `trips.json` (odkazy jdou do `href` na webu i TV). Alternativa: počasí jako GitHub Action bez klíče na serveru.
- Supabase projekt je sdílený se SINTERA (jedno `public` schéma). Chyba v SECURITY DEFINER funkci jednoho projektu
  otevírá data druhého. Alternativa: vlastní projekt (`docs/ochrana-udaju.md` kap. 9).
- Jména hostů jsou v git historii do 11. 10. 2026 (odstraněno v `051c9c0`); přepis historie je rozhodnutí majitele.
