# Velín (Hetzner) – co tam pro Villa Rudolf běží

Server `sintera-velin` (Hetzner, Ubuntu, běží v UTC, sdílený s projekty SINTERA – radar, doklady,
n8n, hlídač). Přístup `ssh sintera-velin` jako root. Pro portál na něm běží **jediná** věc:
sběr počasí. Stav ověřen a uklizen 11. 10. 2026 (viz sekce o mazání rezervací).

## Sběr počasí (`refresh-weather.sh`)

| co | kde |
| --- | --- |
| klon repa | `/opt/vr-portal` (větev `main`, remote `git@github.com:pavelkubiznak/villa-rudolf-portal.git`) |
| skript | `/opt/vr-portal/refresh-weather.sh` – **netrackovaný** soubor v klonu; zdroj pravdy je kopie [`refresh-weather.sh`](refresh-weather.sh) tady |
| cron | `15 5,15 * * *` (root, viz [`crontab.txt`](crontab.txt)) = 07:15 a 17:15 SELČ |
| log | `/var/log/vr-weather.log` (append, bez logrotate – ~26 kB za 3 měsíce) |
| hlídač | úloha `vr-pocasi` v `/etc/hlidac/ulohy.conf`, limit 26 h, úroveň `chyba`; značka `/var/lib/hlidac/vr-pocasi` (zapisuje `hlidac-pip vr-pocasi` až po úspěšném doběhnutí skriptu) |
| deploy key | `/root/.ssh/vr_deploy_key` (ED25519, v GitHubu „velin vr-portal (obnoveno 2026-09-30)“, **se zápisem do main**) |
| Node | v20.20.2 (systémové `node`), bez npm závislostí |
| záloha | `/opt/backup-critical.sh` (04:50 UTC) balí i `/opt/vr-portal` a tento skript; od 11. 10. 2026 jsou archivy šifrované `age` (klíč `/root/.age/zaloha.key` + kopie u Pavla), `/root/.ssh` s deploy keyem se nezálohuje — [`docs/provoz-runbook.md`](../../docs/provoz-runbook.md) kap. 6 |

Co skript dělá: `git fetch` + `git reset --hard origin/main` (každý push do main se tím na server
nasadí sám), `node scripts/fetch-forecast.mjs` (54 lokalit = vila + výlety z `data/trips.json`,
9 dní, api.met.no), a když se `data/forecast.json` změnil, commit jako `vr-weather-bot` + push přes
deploy key. Commity `chore: refresh forecast.json (…)` v historii repa jsou tenhle cron.

Kopie v repu se od serverového souboru (stav 11. 10. 2026) liší jen hlavičkovým komentářem a
e-mailem bota v commitu (`rezervace@villarudolf.com` místo osobního Gmailu). Při příští návštěvě
serveru soubor přepsat kopií z repa, nebo rovnou symlinkovat:
`ln -sf /opt/vr-portal/ops/hetzner/refresh-weather.sh /opt/vr-portal/refresh-weather.sh`
(po `git reset --hard` symlink přežije, protože na něj git nesahá).

### Když selže met.no

`fetch-forecast.mjs` od 11. 10. 2026 **nepřepíše** `forecast.json`, když nedodá data vila nebo víc
než 25 % lokalit (exit 2; každý požadavek má timeout 20 s a 3 pokusy při 429/5xx). Díky `set -e`
skript skončí, nic se necommitne, hosté dál vidí poslední platnou předpověď a `hlidac-pip` se
nezavolá → ranní e-mail hlídače (07:15 Praha) ohlásí `vr-pocasi` po limitu. Nic dalšího není
potřeba dělat, další běh za 10 h to zkusí znovu.

## Ruční spuštění a diagnostika

```sh
ssh sintera-velin
tail -n 30 /var/log/vr-weather.log            # poslední běhy („wrote … 54 locations“ + „pushed“ / „no change“)
cat /var/lib/hlidac/vr-pocasi                 # čas posledního úspěchu
/opt/vr-portal/refresh-weather.sh             # ruční běh (commitne a pushne, když se něco změnilo)
cd /opt/vr-portal && node scripts/fetch-forecast.mjs --only villa && git checkout -- data/forecast.json   # jen test API
```

Z Macu bez serveru: `node scripts/fetch-forecast.mjs` v repu (zapíše `data/forecast.json`,
**necommitovat** – `git checkout -- data/forecast.json`).

## Když forecast zestárne (`generatedAt` starší než ~12 h)

1. `tail /var/log/vr-weather.log` – hledej `skip …`, `forecast: … NEPŘEPISUJI` (met.no), nebo
   `[remote rejected]` / `Permission denied (publickey)` (push, deploy key).
2. `cd /opt/vr-portal && git status -sb && git log --oneline -3` – klon musí být na `main...origin/main`.
   Když se rozešel, `git fetch origin && git reset --hard origin/main` (skript to dělá sám).
3. Push odmítnut: ověř, že deploy key v GitHubu (Settings → Deploy keys) existuje a má zápis;
   `ssh -i /root/.ssh/vr_deploy_key -T git@github.com` má odpovědět „Hi pavelkubiznak/villa-rudolf-portal!“.
4. GitHub incident (7. 10. 2026 15:15 UTC `fatal error in commit_refs`) – nic nedělat, další běh projde.
5. Hosté: web villarudolf.com/pruvodce/ i portál čtou `data/forecast.json` z GitHub Pages
   (cache max-age 600 s), takže po úspěšném pushi je předpověď živá do 10 minut.

## Mazání prošlých rezervací – na serveru zrušeno 11. 10. 2026

`/opt/vr-portal/purge-expired.sh` (cron `40 4 * * *`, hlídač `vr-purge`) volal RPC
`vr_purge_expired` anon klíčem; od lockdownu 15. 9. 2026 končil denně chybou 42501 a nic nemazal.
Od 11. 10. 2026 retenci dělá **pg_cron job `vr-purge-expired` přímo v Supabase** (migrace v repu
`villa-rudolf-site`, `20261011_vr_purge_cron.sql`). Na serveru je od 11. 10. 2026 řádek z crontabu pryč,
skript přesunutý do `/root/vr-portal-purge-expired.sh.bak-2026-10-11` (obsahuje anon klíč a starý secret –
proto nikdy nebyl v repu) a úloha `vr-purge` v hlídači zakomentovaná; podrobnosti v [`crontab.txt`](crontab.txt).
Kontrola běhů: `select status, return_message, start_time from cron.job_run_details where jobid =
(select jobid from cron.job where jobname = 'vr-purge-expired') order by start_time desc limit 5;`

## Rizika, o kterých se ví

- Deploy key **se zápisem do main** leží na serveru sdíleném s jinými projekty. Kompromitace
  serveru = možnost podvrhnout `index.html` / `trips.json`, které čte i villarudolf.com.
  Plánované řešení: nahradit cron GitHub Actions workflow (sběr počasí přímo v Actions), pak key
  smazat a `/opt/vr-portal` zrušit.
- Skript na serveru není pod gitem – proto tahle složka. Po reinstalaci serveru: naklonovat repo
  do `/opt/vr-portal`, zkopírovat `refresh-weather.sh`, vygenerovat nový deploy key, přidat řádek
  z `crontab.txt` a úlohu `vr-pocasi` do `/etc/hlidac/ulohy.conf`. Zálohy z Drive otevře jen klíč `age`
  z Pavlova 1Password (`/root/.age/zaloha.key`), deploy key v nich záměrně není.
