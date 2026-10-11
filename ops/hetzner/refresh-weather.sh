#!/usr/bin/env bash
# Villa Rudolf – obnova počasí pro guest portál.
# Stáhne čerstvou předpověď z yr.no (scripts/fetch-forecast.mjs) a když se data
# změní, commitne a pushne data/forecast.json do repa (GitHub Pages ho pak servíruje).
# Spouští cron 2×/den. Push přes repo-scoped deploy key.
#
# Zdroj pravdy je tato kopie v repu (ops/hetzner/); na serveru leží jako
# /opt/vr-portal/refresh-weather.sh (netrackovaný soubor v klonu). Runbook: ops/hetzner/README.md.
# fetch-forecast.mjs končí exit 2, když met.no nedodá data (vila nebo > 25 % lokalit) a soubor
# nepřepíše – díky `set -e` se pak nic necommitne a hlídač vr-pocasi se neodpíchne.
set -euo pipefail
cd /opt/vr-portal
export GIT_SSH_COMMAND="ssh -i /root/.ssh/vr_deploy_key -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"

# sync na remote (lokální forecast.json se stejně přegeneruje, takže hard reset je bezpečný)
git fetch -q origin main
git reset -q --hard origin/main

# přegeneruj předpověď
node scripts/fetch-forecast.mjs

# nic se nezměnilo → konec
if git diff --quiet -- data/forecast.json; then
  echo "$(date -u +%FT%TZ) no change"
  exit 0
fi

git add data/forecast.json
# e-mail bota = veřejná adresa vily (ne osobní Gmail majitele – repo je veřejné)
git -c user.name="vr-weather-bot" -c user.email="rezervace@villarudolf.com" \
    commit -q -m "chore: refresh forecast.json ($(date -u +%FT%TZ))"
git push -q origin main
echo "$(date -u +%FT%TZ) pushed"
