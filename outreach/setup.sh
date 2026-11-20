#!/usr/bin/env bash
# Sets up Sellbird (client outreach) for ShipKaro. Safe to run again.
#   cd outreach && ./setup.sh
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SB="$HERE/sellbird"

if [ ! -d "$SB" ]; then
  echo "Missing $SB. Unzip sellbird-main.zip there first:"
  echo "  unzip ~/Downloads/sellbird-main.zip -d \"$HERE\" && mv \"$HERE/sellbird-main\" \"$SB\""
  exit 1
fi

PY="$(command -v python3.13 || command -v python3.12 || command -v python3.11 || true)"
[ -z "$PY" ] && { echo "Need Python 3.11+ (brew install python@3.13)"; exit 1; }

[ -d "$SB/.venv" ] || "$PY" -m venv "$SB/.venv"
"$SB/.venv/bin/pip" install -q -e "$SB"

# Config, with absolute paths for the ShipKaro handoff bridge
sed -e "s#__VENV_PYTHON__#$SB/.venv/bin/python#" -e "s#__BRIDGE__#$HERE/shipkaro_bridge.py#" \
  "$HERE/sellbird.local.yaml" > "$SB/sellbird.local.yaml"

if [ ! -f "$SB/.env" ]; then
  cp "$SB/.env.example" "$SB/.env"
  printf '\n# --- ShipKaro handoff (outreach/shipkaro_bridge.py) ---\nSHIPKARO_URL=https://shipkaro-omega.vercel.app\nSHIPKARO_OUTREACH_TOKEN=%s\n' \
    "$(openssl rand -hex 24)" >> "$SB/.env"
  echo "Created $SB/.env with a new SHIPKARO_OUTREACH_TOKEN."
  echo "Put the same value in ShipKaro's .env.local and Vercel as OUTREACH_TOKEN."
fi

echo "Sellbird is ready. Next: cd \"$SB\" && source .venv/bin/activate && sellbird status"
