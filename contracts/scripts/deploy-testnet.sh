#!/usr/bin/env bash
# Deploy stellar-agent-market to Soroban testnet and write contract id for the app.
# Prereqs: Stellar CLI (https://developers.stellar.org/docs/tools/developer-tools), Rust + wasm target.
#
# Usage:
#   export SOURCE_ACCOUNT=alice          # stellar keys name, or use ADMIN_SECRET below
#   ./contracts/scripts/deploy-testnet.sh
# Optional:
#   RUN_INIT=1           — invoke initialize(admin) after deploy (admin = source account address)
#   STELLAR_NETWORK=testnet
#
# Secrets: never commit seeds. Prefer named keys: stellar keys generate alice --network testnet --fund
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CRATE_DIR="$ROOT/stellar-agent-market"
STELLAR_NETWORK="${STELLAR_NETWORK:-testnet}"
DEPLOY_ENV_OUT="${DEPLOY_ENV_OUT:-$ROOT/deploy/testnet-contract-id.env}"
SOURCE_ACCOUNT="${SOURCE_ACCOUNT:-${ADMIN_KEY_NAME:-}}"

resolve_wasm() {
  for candidate in \
    "$ROOT/target/wasm32v1-none/release/stellar_agent_market.wasm" \
    "$ROOT/target/wasm32-unknown-unknown/release/stellar_agent_market.wasm" \
    "$CRATE_DIR/target/wasm32v1-none/release/stellar_agent_market.wasm" \
    "$CRATE_DIR/target/wasm32-unknown-unknown/release/stellar_agent_market.wasm"; do
    if [[ -f "$candidate" ]]; then
      echo "$candidate"
      return 0
    fi
  done
  return 1
}

build_with_cargo() {
  echo "==> Building WASM (cargo, wasm32-unknown-unknown release)..."
  (cd "$ROOT/.." && cargo build --manifest-path contracts/Cargo.toml -p stellar-agent-market \
    --target wasm32-unknown-unknown --release)
}

build_wasm() {
  if command -v stellar >/dev/null 2>&1; then
    echo "==> Building WASM (stellar contract build)..."
    (cd "$CRATE_DIR" && stellar contract build)
  else
    echo "Stellar CLI not found; using cargo."
    build_with_cargo
  fi
}

WASM_PATH="$(resolve_wasm || true)"
if [[ -z "${WASM_PATH:-}" ]]; then
  build_wasm
  WASM_PATH="$(resolve_wasm)" || {
    echo "Could not find stellar_agent_market.wasm under $ROOT/target (wasm32v1-none or wasm32-unknown-unknown)."
    exit 1
  }
fi

if ! command -v stellar >/dev/null 2>&1; then
  echo "Stellar CLI (stellar) is required for deploy. Install from Stellar docs, then re-run."
  echo "WASM is ready at: $WASM_PATH"
  exit 1
fi

if [[ -z "${SOURCE_ACCOUNT}" && -n "${ADMIN_SECRET:-}" ]]; then
  SOURCE_ACCOUNT="$ADMIN_SECRET"
fi
if [[ -z "${SOURCE_ACCOUNT}" ]]; then
  echo "Set SOURCE_ACCOUNT to a stellar key name (recommended) or ADMIN_SECRET (S... seed)."
  exit 1
fi

echo "==> Deploying to $STELLAR_NETWORK..."
DEPLOY_LOG="$(mktemp)"
set +e
stellar contract deploy \
  --wasm "$WASM_PATH" \
  --source-account "$SOURCE_ACCOUNT" \
  --network "$STELLAR_NETWORK" \
  --alias stellar_agent_market 2>&1 | tee "$DEPLOY_LOG"
DEPLOY_STATUS=$?
set -e
if [[ "$DEPLOY_STATUS" -ne 0 ]]; then
  echo "Deploy failed (exit $DEPLOY_STATUS). See log above."
  rm -f "$DEPLOY_LOG"
  exit "$DEPLOY_STATUS"
fi

CID="$(grep -oE 'C[A-Z0-9]{55}' "$DEPLOY_LOG" | head -1 || true)"
rm -f "$DEPLOY_LOG"
if [[ -z "$CID" ]]; then
  echo "Could not parse contract id from CLI output. Deploy may have succeeded; check stellar CLI output for id starting with C."
  exit 1
fi

mkdir -p "$(dirname "$DEPLOY_ENV_OUT")"
umask 077
cat >"$DEPLOY_ENV_OUT" <<EOF
# Written by contracts/scripts/deploy-testnet.sh — do not commit real ids if private.
# Server: export vars below or set SOROBAN_AGENT_MARKET_CONTRACT_ID_FILE to this file path.
SOROBAN_AGENT_MARKET_CONTRACT_ID=$CID
EOF
chmod 600 "$DEPLOY_ENV_OUT" 2>/dev/null || true

echo ""
echo "==> Contract id: $CID"
echo "==> Wrote: $DEPLOY_ENV_OUT"
echo "    Point the server at it: SOROBAN_AGENT_MARKET_CONTRACT_ID_FILE=$DEPLOY_ENV_OUT"
echo "    Or copy SOROBAN_AGENT_MARKET_CONTRACT_ID into .env"

if [[ "${RUN_INIT:-0}" == "1" ]]; then
  echo "==> Invoking initialize (admin = source account)..."
  ADMIN_ADDR="$(stellar keys address "$SOURCE_ACCOUNT" 2>/dev/null || true)"
  if [[ -z "$ADMIN_ADDR" ]]; then
    echo "Could not resolve admin address from SOURCE_ACCOUNT; run initialize manually."
    exit 0
  fi
  stellar contract invoke \
    --id "$CID" \
    --source-account "$SOURCE_ACCOUNT" \
    --network "$STELLAR_NETWORK" \
    --send=yes \
    -- \
    initialize \
    --admin "$ADMIN_ADDR"
  echo "initialize complete."
fi
