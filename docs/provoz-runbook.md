# Provoz: co běží kde, jak to zkontrolovat a co dělat, když to stojí

Stav k 11. 10. 2026. Časy jsou **UTC** (server i pg_cron běží v UTC; SELČ = +2 h, SEČ = +1 h).
Stav odpovídá sloučení auditní větve 11. 10. 2026.

## 1. Co běží kde

| Co | Kde | Kdy | Stopa |
|---|---|---|---|
| **GitHub Pages** (`pavelkubiznak.github.io/villa-rudolf-portal/`) | GitHub, větev `main` | po každém pushi do `main`, ~1 min | Actions workflow `.github/workflows/pages.yml` publikuje jen allowlist (`index.html`, `app.js`, `track.js`, `sw.js`, `manifest.webmanifest`, `robots.txt`, `icons/`, `data/`, `fonts/`); `docs/`, `scripts/`, `supabase/`, `CLAUDE.md` se na web nedostanou. *Dnes:* legacy build z celé větve. |
| **CI** | GitHub Actions (`ci.yml`; vedle něj `forecast.yml` jen ruční) | každý PR a push | `node scripts/validate-trips.mjs` + parse všech JSON; červené = nenasazovat |
| **Počasí** | Hetzner `sintera-velin` (178.104.207.97), root crontab `15 5,15 * * *` → `/opt/vr-portal/refresh-weather.sh` | 05:15 a 15:15 UTC | `/var/log/vr-weather.log`; commity `chore: refresh forecast.json` od `vr-weather-bot`; hlídač `/etc/hlidac/ulohy.conf` úloha `vr-pocasi` (limit 26 h, `hlidac-pip` po úspěšném běhu) |
| **Deploy key** (push počasí) | GitHub → Settings → Deploy keys: „velin vr-portal (obnoveno 2026-09-30)", ED25519, **se zápisem**; privátní část `/root/.ssh/vr_deploy_key` na velínu | — | jediný klíč, který smí do `main` bez PR |
| **Retence hostů** | Supabase, `pg_cron` job `vr-purge-expired` → `public.vr_purge_expired_cron()` | 04:40 UTC denně | `cron.job_run_details`; migrace `villa-rudolf-site/supabase/migrations/20261011_vr_purge_cron.sql` (nasazeno 11. 10. 2026) |
| ~~Purge na Hetzneru~~ | `/opt/vr-portal/purge-expired.sh`, crontab `40 4 * * *` | — | **zrušen 11. 10. 2026**: od 15. 9. denně padal (anon klíč, 42501). Řádek z crontabu pryč, soubor přesunut do `/root/vr-portal-purge-expired.sh.bak-2026-10-11`, úloha `vr-purge` v `/etc/hlidac/ulohy.conf` zakomentována (viz `ops/hetzner/`) |
| **Záloha serveru** | Hetzner `/opt/backup-critical.sh`, crontab `50 4 * * *` | 04:50 UTC | `/var/log/vr-backup.log`; hlídač `zaloha-kriticka` (pípne až po uploadu na Drive). Od 11. 10. 2026 **všechny archivy šifrované `age`** už při vzniku, klíč `/root/.age/zaloha.key` + kopie u Pavla — kap. 6. Zálohuje i `/opt/vr-portal` (klon repa) |
| **Zálohy Sintery** (doklady, cestovní příkazy) | Hetzner, systemd `doklady-backup.timer` 01:30 UTC a `cp-backup.timer` 03:20 UTC, uživatel `doklady` | denně | hlídače `doklady-backup` a `cp-backup` (pípnou až po uploadu) v ranním e-mailu. Od 12. 10. 2026 **šifrované stejným klíčem `age`** — kap. 6 |
| **Umami** (analytika) | Hetzner, Docker, dashboard `https://178-104-207-97.sslip.io` | živě | cookieless; web villarudolf.com je v Umami pod webem „Villa Rudolf - Kalex (DE)" |
| **n8n** | Hetzner, `127.0.0.1:5678` (zvenku nedostupné) | — | denní e-mail `VrDailyTasks`, platby `VrPaymentWatch001`, konflikty — vše v site, tady nic |
| **Supabase** | projekt `fpknbrzbqpalguajskut`, dashboard `https://supabase.com/dashboard/project/fpknbrzbqpalguajskut` | — | sdílený se SINTERA; schéma v site `supabase/migrations/` |

Co tenhle repo **nedělá**: nezakládá tokeny (to `/sprava/` v site), neposílá zprávy hostům (n8n + `/sprava/`),
nečte kalendář. Průvodce hostů běží na `villarudolf.com/pruvodce/`; `index.html` tady je demo a přesměrování.

## 2. Pravidelné kontroly (stačí jednou týdně, 5 minut)

**Počasí je čerstvé** (má být mladší než ~12 h):

```bash
curl -s -H 'Cache-Control: no-cache' https://pavelkubiznak.github.io/villa-rudolf-portal/data/forecast.json \
  | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const j=JSON.parse(s);const h=(Date.now()-Date.parse(j.generatedAt))/36e5;console.log(j.generatedAt, h.toFixed(1)+" h", Object.keys(j.byLocation).length+" lokalit", Object.values(j.byLocation).filter(x=>x.error).length+" chyb")})'
```

**Log na velínu** (poslední běhy; purge řádky zmizí, až se skript smaže):

```bash
ssh root@178.104.207.97 'tail -n 40 /var/log/vr-weather.log'
ssh root@178.104.207.97 'crontab -l | grep vr-portal'
```

**Retence v DB** (SQL editor Supabase, read-only; stejné dotazy jsou v hlavičce migrace `20261011_vr_purge_cron.sql`):

```sql
select jobid, schedule, command, active from cron.job where jobname = 'vr-purge-expired';
select status, return_message, start_time from cron.job_run_details
 where jobid = (select jobid from cron.job where jobname = 'vr-purge-expired')
 order by start_time desc limit 5;
select count(*) filter (where anonymized_at is not null) as anonymizovano,
       count(*) filter (where departure < current_date - 30 and anonymized_at is null) as ceka
  from public.vr_bookings;
```

`ceka` má být 0 (nebo pobyty z posledních 30 dní). `return_message` má vypadat `{"deleted_after_6y":0,"anonymized":N,...}`.

**Pages a CI:** GitHub → Actions: poslední běh „pages" i „CI" zelený. `curl -sI …/data/trips.json | grep -i 'cache-control\|access-control'`
má vrátit `max-age=600` a `access-control-allow-origin: *`.

**Nenasazené commity:** `git status -sb` na Macu — `ahead N` znamená, že feature commity leží jen lokálně
(cron pushuje jen forecast).

## 3. Když…

**…je forecast starý (> 14 h) nebo ho host hlásí jako zastaralý**
1. `tail /var/log/vr-weather.log` — hledej `wrote …/forecast.json` a `[remote rejected]` / `met.no 4xx`.
2. `[remote rejected] main -> main` byl 8. 10. 2026 incident GitHubu; **další běh to opraví sám** (skript dělá
   `git fetch` + `reset --hard origin/main` před prací). Když se opakuje: `git -C /opt/vr-portal fetch && git -C /opt/vr-portal reset --hard origin/main`
   a spustit `/opt/vr-portal/refresh-weather.sh` ručně.
3. `met.no 403/429` → User-Agent (konstanta `UA` v `scripts/fetch-forecast.mjs`) musí identifikovat provozovatele;
   met.no vyžaduje kontakt. Dnes je tam osobní e-mail majitele — při změně na `rezervace@villarudolf.com` zachovat tvar.
4. Pages servíruje starý soubor, i když commit prošel → Actions → „pages" → re-run; cache Pages je 10 min.
5. Hlídač `vr-pocasi` s limitem 26 h **jeden neúspěšný běh ze dvou denních nezachytí** (pip se zapíše po každém
   úspěchu). Kontrola z pohledu konzumenta (`generatedAt` z Pages) je spolehlivější — příkaz v kap. 2.

**…CI na PR svítí červeně**
`node scripts/validate-trips.mjs` lokálně, oprava dat podle `datovy-kontrakt.md`. Nikdy neobcházet mergem bez CI —
chybný `trips.json` rozbije `/pruvodce/`, `/vylety/` i TV.

**…Pages neběží / 404**
GitHub → Settings → Pages musí být „GitHub Actions" (přepnuto 11. 10. 2026) a workflow `pages.yml` zelený; při legacy buildu
Jekyll občas selže na souboru s `{{` — re-run. Zkontrolovat, že `.nojekyll` / allowlist nezměnil cesty `data/…`.

**…pg_cron job neběží nebo vrací chybu**
`cron.job_run_details` výše. `permission denied` = někdo změnil granty funkce `vr_purge_expired_cron` (musí ji volat
vlastník DB, nikdo jiný EXECUTE nemá). Oprava = znovu aplikovat `20261011_vr_purge_cron.sql` (idempotentní).
Rozšíření `pg_cron` musí být zapnuté: Dashboard → Database → Extensions.

**…host napíše, že odkaz na průvodce nefunguje**
Token platí **odjezd + 14 dní** a po anonymizaci (30 dní) je znehodnocený — to je správně. Nový pobyt téhož hosta =
nový token ve `/sprava/`. Starý odkaz `pavelkubiznak.github.io/villa-rudolf-portal/?t=…` se od 11. 10. 2026 přesměruje
na `villarudolf.com/pruvodce/?t=…` (`app.js`, funkce `presmerujHosta`).

**…je podezření na kompromitaci velínu nebo deploy keye**
Deploy key má zápis do `main` — útočník by mohl podvrhnout `trips.json` (odkazy `links[].url` jdou do `href` na webu i TV).
1. GitHub → Settings → Deploy keys → smazat „velin vr-portal".
2. Zkontrolovat `git log origin/main` na cizí commity (bot dělá jen `chore: refresh forecast.json` s jedním souborem);
   cizí commit → `git revert`, ne přepis historie.
3. Nový klíč: na velínu `ssh-keygen -t ed25519 -f /root/.ssh/vr_deploy_key -N '' -C 'velin vr-portal <datum>'`,
   veřejnou část nahrát jako deploy key **s právem zápisu** (jiná cesta pro push počasí dnes není), `chmod 600`.
4. Zvážit variantu bez klíče na serveru: počasí jako GitHub Action (`workflow_dispatch` + cron) — pak deploy key zaniká.

**…se přepsala historie repa (filter-repo kvůli PII)** — provedeno 11. 10. 2026 21:30 UTC
Jak: čistý klon z GitHubu, `git filter-repo --sensitive-data-removal --replace-text <náhrady> --prune-empty never`
(235 z 341 commitů, hashe od `a81eb3a` = 12. 8. 2026 jsou nové; stromy mimo `docs/` ověřeny shodné u všech commitů),
pak `git push --force-with-lease=refs/heads/<větev>:<staré SHA>` pro každou větev (15). Co musí následovat:
1. Velín (cron by se srovnal sám, ale staré objekty by zůstaly na disku a v zálohách):
   `ssh sintera-velin 'cd /opt/vr-portal && export GIT_SSH_COMMAND="ssh -i /root/.ssh/vr_deploy_key -o IdentitiesOnly=yes" && git fetch --prune origin && git reset --hard origin/main && git reflog expire --expire=now --all && git gc --prune=now'`
   — bez `GIT_SSH_COMMAND` končí fetch na `Permission denied (publickey)`. Pak ruční běh `/opt/vr-portal/refresh-weather.sh` ověří push.
2. Mac: `git fetch --prune` a v každém worktree `git reset --hard origin/<větev>`, nakonec
   `git reflog expire --expire=now --all && git gc --prune=now`. Cizí sessions nesmí force-pushnout starý stav větve.
3. Otevřené PR se **nerebasují**: přepisuje se celý graf, merge-base zůstává; stačí `gh pr list` (stav konfliktů se nemění).
4. GitHub drží staré commity přes přímé URL a v `refs/pull/*/head` i zavřených PR → ticket na <https://support.github.com>
   (ze svého účtu). Šablona (EN):
   > Subject: Remove cached commits after a sensitive-data history rewrite (pavelkubiznak/villa-rudolf-portal)
   > On 2026-10-11 I rewrote the full history of the public repository pavelkubiznak/villa-rudolf-portal with git filter-repo
   > to remove personal data (guest names) from documentation files under docs/, and force-pushed all branches.
   > Please remove cached views and the pull request refs (refs/pull/*/head, refs/pull/*/merge, PRs #1–#16) that still
   > reference the old commits, and garbage-collect so the old objects are no longer reachable.
   > First changed commit (old): efc858d5cb1101b36d883b2aa8c10b3e64d17e1a. Example old commit still reachable:
   > c8f61af5f5e6f269b55f78cefebd475dc3995b43. The data was never credentials, only names.
5. Zálohy `/opt/backup-critical.sh` (Disk) před 12. 10. 2026 obsahují původní `.git` — rotace je rozhodnutí v `ochrana-udaju.md` kap. 9.

**…velín shoří**
Počasí: stačí jakýkoli stroj s Node 20 a deploy keyem — `git clone`, `node scripts/fetch-forecast.mjs`, commit, push
(kopie `refresh-weather.sh`, crontab a popis velínu jsou v `ops/hetzner/`; bez stroje jde počasí spustit i ručně přes
`.github/workflows/forecast.yml` – `workflow_dispatch`, commituje GITHUB_TOKENem bez deploy keye). Retence běží v DB, nic neztrácí. Umami a n8n jsou věc site/Sintery;
jejich zálohy leží na Drive jako `.age` a otevře je jen klíč z Klíčenky Pavlova Macu (kap. 6).

## 4. Nasazení změn z tohoto repa

1. Větev `claude/…` → PR → CI zelená → merge do `main`. **Žádný přímý push do `main`** kromě bota.
2. Před další prací `git pull` (bot commituje 2× denně).
3. Pages nasadí do minuty; hosté vidí změnu dat podle `datovy-kontrakt.md` kap. 9 (až ~6 h).
4. Změna `sw.js` nebo potřeba okamžitého vyčištění cache u hostů = zvýšit `CACHE` v `sw.js` (`vr-v4` → `vr-v5`).
5. `data/forecast.json` do PR nepatří; při konfliktu `git checkout --theirs data/forecast.json` nebo `git pull` znovu.
6. Nikdy necommitovat `.DS_Store` ani `.claude/settings.local.json` (jsou v `.gitignore`).

## 5. Přístupy (kde jsou, nikdy ne v repu)

| Co | Kde |
|---|---|
| Admin klíč `/sprava/` | u Pavla (Disk); v DB jen `vr_admin_config.admin_key_sha256`; rotace = nový hash do configu + nový klíč do prohlížeče |
| Deploy key počasí | velín `/root/.ssh/vr_deploy_key` + GitHub Deploy keys |
| Supabase `service_role` | jen Dashboard → Settings → API; nikam do skriptů na velínu |
| Anon klíč Supabase | veřejný záměrně (v site `planner.js`); chrání ho RLS + SECURITY DEFINER RPC |
| Purge secret | **už není potřeba** — pg_cron volá funkci bez parametru; `vr_purge_expired(p_secret)` zůstává jen pro service_role |
| SSH na velín | root, klíč na Macu Pavla; tailnet `sintera-radar` |
| Klíč `age` k zálohám velínu | velín `/root/.age/zaloha.key` (root, 600) + **kopie v Klíčence na Macu Pavla** (Keychain Access → login → „age klíč zálohy velín“); bez něj jsou zálohy na Drive trvale nečitelné (kap. 6) |

## 6. Zálohy velínu (od 11. 10. 2026 šifrované)

`/opt/backup-critical.sh` (root crontab `50 4 * * *` UTC, log `/var/log/vr-backup.log`) balí Umami (pg_dump), n8n (volume
+ SQLite s credentials), doklady, radar, konfigurace stacků, `/root`, `/etc` a aplikace v `/opt` včetně `/opt/vr-portal`.
Lokálně `/opt/backups/<datum>/` 7 dní, na Drive `gdrive:Backups/sintera-radar/<datum>/` 30 dní (`rclone delete --min-age 30d`).
Dumpy DB intranetu (`intranet/*.age`) šifruje už intranet, jejich klíč na velínu není.

**Šifrování:** každý archiv vzniká rovnou jako `.age` (`tar | gzip | age -R /root/.age/recipients.txt`), nešifrovaný archiv
neexistuje ani lokálně, ani na Drive (jen SQLite snapshot `.tmp` na pár sekund). Klíč `/root/.age/zaloha.key`, veřejná část
`/root/.age/recipients.txt`. **Záložní kopie klíče je v Klíčence na Macu Pavla** (Keychain Access, klíčenka „login“, položka
„age klíč zálohy velín“, uloženo 12. 10. 2026 rovnou ze serveru; v poznámce položky je i veřejný klíč a postup obnovy). Nikde jinde
není, Google ho nemá. Mac dnes nemá funkční Time Machine, takže ideálně ještě papírová kopie řádku `AGE-SECRET-KEY-1…` do trezoru.

Ze `system.tar.gz` jsou vyjmuty `/root/.ssh` (deploy key a klíč k intranetu → při obnově nové, kap. 3), `/root/*.bak-*`
(staré secrety), `/root/.age` (klíč k téhle záloze) a `/root/.config/rclone` (token na Drive → při obnově `rclone config` znovu;
bez něj se k záloze stejně nedostaneš, takže v ní nepomůže).

Skript před prací ověří, že klíč k příjemcům sedí (jinak skončí, než vyrobí nečitelnou zálohu), před uploadem odmítne cokoli,
co nekončí `.age`, a `hlidac-pip zaloha-kriticka` zapíše až po úspěšném `rclone copy --checksum` (do 11. 10. to dělal `&&` v crontabu).
Ruční test do oddělené složky: `STAMP=2026-10-12-test /opt/backup-critical.sh` (pak složku lokálně i na Drive smazat).

**Kontrola** (týdně, spolu s počasím):

```bash
ssh sintera-velin 'tail -n 4 /var/log/vr-backup.log; cat /var/lib/hlidac/zaloha-kriticka; rclone lsf --files-only -R gdrive:Backups/sintera-radar | grep -v "\.age$"'
```

Poslední příkaz nemá vypsat nic — na Drive smí být jen `.age`. Hlídač: úloha `zaloha-kriticka` (26 h) v ranním e-mailu.

**Obnova** souboru (na velínu; na Macu `brew install age` a klíč z Klíčenky — Keychain Access → login → „age klíč zálohy velín“ →
Show password — uložit jako soubor `zaloha.key` s `chmod 600`):

```bash
rclone cat gdrive:Backups/sintera-radar/2026-10-12/umami-db.sql.gz.age | age -d -i /root/.age/zaloha.key | gunzip > umami-db.sql
rclone cat gdrive:Backups/sintera-radar/2026-10-12/system.tar.gz.age | age -d -i /root/.age/zaloha.key | tar xzf - -C /obnova
```

Bez serveru: složku stáhnout z Drive (web, nebo `rclone` s vlastním přihlášením) a dešifrovat stejně.

**Když se klíč na serveru ztratí** (reinstalace, smazaný `/root` jako 30. 9. 2026): vrátit řádek `AGE-SECRET-KEY-1…` z Klíčenky
do `/root/.age/zaloha.key` (700/600) a `age-keygen -y zaloha.key > recipients.txt`. Když chybí i kopie v Klíčence, jsou dosavadní
zálohy pryč: `age-keygen -o /root/.age/zaloha.key`, nový `recipients.txt`, kopii hned do Klíčenky
(`ssh sintera-velin 'grep ^AGE-SECRET-KEY- /root/.age/zaloha.key'` → `security add-generic-password …`) — od další noci jsou zálohy zase čitelné.

První noční šifrovaný běh 12. 10. 2026 04:50 UTC proběhl zeleně (10 souborů `.age`, hlídač pípl po uploadu). Nešifrované složky
na Drive z doby před přepnutím (13. 9.–11. 10. 2026, 29 složek) byly 12. 10. 2026 přesunuty do koše Drive (`rclone purge`, vratné
30 dní). Lokální nešifrované složky na velínu odrotují do 19. 10. 2026.

### 6.1 Zálohy Sintery: doklady a cestovní příkazy (od 12. 10. 2026 šifrované stejným klíčem)

Obě služby běží jako uživatel `doklady` přes systemd: `doklady-backup.timer` 01:30 UTC → `/opt/doklady/backup_data.sh`,
`cp-backup.timer` 03:20 UTC → `/opt/doklady/cp_backup.py` (ten od 12. 10. 2026 zase běží — chyběl service_role klíč
v `/etc/doklady/cp.env`). Remote `gdrive_pavel:` (conf `/opt/doklady/data/rclone.conf`, **ne** `gdrive:`), cíl
`SINTERA/ÚČETNICTVÍ Sintera/Zálohy/`. Šifrují veřejnou částí klíče záloh velínu: `/etc/doklady/age-recipients.txt`
(root 644, kopie `/root/.age/recipients.txt`; `/etc/doklady` má group `doklady`, aby ho služba přečetla). Uživatel `doklady`
umí jen šifrovat; dešifruje root na velínu (`/root/.age/zaloha.key`) nebo Pavel klíčem z Klíčenky. **Při výměně klíče
aktualizovat obě kopie veřejné části.**

- **Doklady:** do 11. 10. 2026 `rclone sync` zrcadla `aktualni/` v plaintextu. Teď denně celý `/opt/doklady/data` jako
  `doklady/archivy/doklady-<den>.tar.gz.age` (~0,4 GB, 30 dní) a jen JSON stavy `doklady/snapshoty/stavy-<den>.tar.gz.age` (90 dní).
  Vyjmuto: `rclone.conf`, `sessions.json`, e-mailová cache, náhledy PDF, `*.tmp`, `*.bak.*`. Běh trvá ~15 min (archiv 25 s,
  upload na Drive ~0,5 MB/s), limit služby 60 min.
- **Cestovní příkazy:** `cestovni-prikazy/cestovni-prikazy-<den>.json.age` + vždy přepsaný `nejnovejsi.json.age`.
- **Pojistky** jako u velínu: kontrola klíče před startem, nic bez `.age` se nenahraje, jakákoli chyba = exit 1 → `ExecStartPost`
  `hlidac-pip` nepípne a `doklady-alert@` pošle e-mail. Hlídač: `doklady-backup`, `cp-backup` (26 h).
- Ruční test mimo ostrou složku: `DOKLADY_BACKUP_DEST="gdrive_pavel:…/Zálohy/doklady-test" sudo -u doklady /opt/doklady/backup_data.sh`,
  u cestovních příkazů `CP_BACKUP_DEST=…` (pak složku na Drive smazat). Původní skripty: `/opt/doklady/*.bak.20261012-075731`.
- Plaintext na Drive (`aktualni/` 508 souborů, 70 starých snapshotů, 2 JSONy z prvního běhu cp-backup) přesunut 12. 10. 2026
  do koše Drive (vratné 30 dní).

**Kontrola** (přidat k týdenní):

```bash
ssh sintera-velin 'cat /var/lib/hlidac/doklady-backup /var/lib/hlidac/cp-backup; rclone --config /opt/doklady/data/rclone.conf lsf --files-only -R "gdrive_pavel:SINTERA/ÚČETNICTVÍ Sintera/Zálohy" | grep -v "\.age$"'
```

**Obnova** (na velínu jako root; na Macu s klíčem z Klíčenky stejně jako výše):

```bash
rclone --config /opt/doklady/data/rclone.conf cat "gdrive_pavel:SINTERA/ÚČETNICTVÍ Sintera/Zálohy/doklady/archivy/doklady-2026-10-12.tar.gz.age" | age -d -i /root/.age/zaloha.key | tar xzf - -C /obnova
rclone --config /opt/doklady/data/rclone.conf cat "gdrive_pavel:SINTERA/ÚČETNICTVÍ Sintera/Zálohy/cestovni-prikazy/nejnovejsi.json.age" | age -d -i /root/.age/zaloha.key > nejnovejsi.json
```
