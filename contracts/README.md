# Soroban contracts workspace

Rust workspace root: `contracts/Cargo.toml`  
Primary contract crate: `contracts/stellar-agent-market/`

## What it stores

- **Service registry**: owner, endpoint, metadata, `access_mode`, `status`, versioned **price** and **asset** string (e.g. `native` or `CODE:issuer`).
- **Escrow**: logical state machine (`Open` → `Locked` → `PendingVerify` → `Verified` → `Released` or `Refunded`). Token custody is coordinated offchain or via SAC; this contract is the durable workflow record.
- **Settlement & receipts**: per-`request_id` amounts, parties, status, and `tx_ref` bytes for Horizon/ RPC correlation.
- **Reputation**: compact counters and a bounded score, updated only by **admin** through `record_reputation_event`.
- **Errors & events**: typed `ContractError` and publishable events for indexing.

## Toolchain

- **Rust**: `rustup` + `wasm32-unknown-unknown` (used by `pnpm contracts:build`). Newer Stellar CLI builds may emit `target/wasm32v1-none/release/*.wasm` instead; the deploy script accepts either path.
- **Stellar CLI**: install from [Developer tools](https://developers.stellar.org/docs/tools/developer-tools). Used for `stellar contract build` (optional) and **testnet deploy**.

Local checks from the repo root:

```bash
pnpm contracts:diagnose         # informational JSON + blockers on stderr (exit 0)
pnpm contracts:diagnose:strict  # exit 1 if WASM / CLI / rust targets are missing
```

## Build & test

```bash
rustup target add wasm32-unknown-unknown
pnpm contracts:test
pnpm contracts:build
```

With Stellar CLI installed you can instead build from the crate directory:

```bash
cd contracts/stellar-agent-market && stellar contract build
```

Release artifact (cargo path): `contracts/target/wasm32-unknown-unknown/release/stellar_agent_market.wasm`.

## Deploy (testnet-first)

Official flow: funded identity → build WASM → `stellar contract deploy` → save contract id → invoke `initialize` once. See [Deploy to testnet](https://developers.stellar.org/docs/build/smart-contracts/getting-started/deploy-to-testnet).

1. **Identity** (example name `alice`):

   ```bash
   stellar keys generate alice --network testnet --fund
   stellar keys address alice
   ```

2. **Deploy and write env file** (from repo root):

   ```bash
   export SOURCE_ACCOUNT=alice
   # optional: auto-call initialize(admin = alice’s address)
   # export RUN_INIT=1
   pnpm contracts:deploy:testnet
   ```

   This runs `contracts/scripts/deploy-testnet.sh`, which prefers `stellar contract build` when available, then deploys with `--alias stellar_agent_market` and writes `contracts/deploy/testnet-contract-id.env` (gitignored). Copy the `SOROBAN_AGENT_MARKET_CONTRACT_ID` line into the server `.env`, **or** set:

   `SOROBAN_AGENT_MARKET_CONTRACT_ID_FILE=/absolute/path/to/contracts/deploy/testnet-contract-id.env`

3. **Initialize** (if you did not use `RUN_INIT=1`):

   ```bash
   stellar contract invoke \
     --id YOUR_CONTRACT_ID \
     --source-account alice \
     --network testnet \
     --send=yes \
     -- \
     initialize \
     --admin $(stellar keys address alice)
   ```

4. Optional: `SOROBAN_RPC_URL` to override defaults in `shared/stellarSoroban.ts`.

Mainnet uses the same pattern with a funded mainnet key, mainnet network flag, and mainnet Soroban RPC.

Committed template: `contracts/deploy/testnet-contract-id.env.example`.

## Backend usage

The Express/tRPC server loads the onchain spec via `Client.from` (`@stellar/stellar-sdk/contract`) using `SOROBAN_AGENT_MARKET_CONTRACT_ID` and simulates read methods. Procedures live under the `agentMarket` router (`config`, `listServices`, `getService`, `getEscrow`, `getSettlement`, `getActionReceipt`, `getReputation`, …).

Writes (`register_service`, `set_price`, escrow transitions, etc.) must be signed by the appropriate accounts (owner, payer, admin). Build unsigned transactions with the same SDK client or Stellar CLI and submit via Freighter or ops tooling.

## Interpreting errors

Numeric `ContractError` values match `AgentMarketContractErrorCode` in `shared/agentMarketContract.ts`. The server maps simulation failures to `TRPCError` messages prefixed with `agent_market:`.

## Extending safely

- Add fields only with a new storage key or versioned struct; avoid changing existing entry layouts in place.
- Keep one responsibility per entrypoint; prefer new small functions over expanding existing flows.
- Keep heavy ranking or search offchain; store only verifiable facts onchain.

See `AUDIT.md` for how this layer relates to the rest of the app.
