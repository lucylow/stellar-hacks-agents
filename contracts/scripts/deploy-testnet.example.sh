#!/usr/bin/env bash
# Example: deploy `stellar-agent-market` to Soroban testnet with Stellar CLI.
# Copy to deploy-testnet.sh, fill in ADMIN_SECRET, and run after `cargo build` (see contracts/README.md).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WASM="${ROOT}/target/wasm32-unknown-unknown/release/stellar_agent_market.wasm"
: "${STELLAR_NETWORK:=testnet}"
: "${ADMIN_SECRET:?Set ADMIN_SECRET to your testnet seed (S...) }"

if [[ ! -f "$WASM" ]]; then
  echo "Missing WASM at $WASM — run: pnpm contracts:build (or cargo build --target wasm32-unknown-unknown --release)"
  exit 1
fi

echo "Install WASM blob..."
stellar contract install --network "$STELLAR_NETWORK" --source-account "$ADMIN_SECRET" --wasm "$WASM"

echo "Deploy (paste wasm hash from install output into --wasm-hash if your CLI requires it)..."
echo "stellar contract deploy --network $STELLAR_NETWORK --source-account \"\$ADMIN_SECRET\" --wasm \"$WASM\""
echo "Then invoke initialize once with your admin Address, and set SOROBAN_AGENT_MARKET_CONTRACT_ID on the server."
