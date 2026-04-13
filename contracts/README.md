# Soroban contracts workspace

Rust workspace root: `contracts/Cargo.toml`  
Primary contract crate: `contracts/stellar-agent-market/`

## What it stores

- **Service registry**: owner, endpoint, metadata, `access_mode`, `status`, versioned **price** and **asset** string (e.g. `native` or `CODE:issuer`).
- **Escrow**: logical state machine (`Open` → `Locked` → `PendingVerify` → `Verified` → `Released` or `Refunded`). Token custody is coordinated offchain or via SAC; this contract is the durable workflow record.
- **Settlement & receipts**: per-`request_id` amounts, parties, status, and `tx_ref` bytes for Horizon/ RPC correlation.
- **Reputation**: compact counters and a bounded score, updated only by **admin** through `record_reputation_event`.
- **Errors & events**: typed `ContractError` and publishable events for indexing.

## Build & test

Requires a standard Rust toolchain with the `wasm32-unknown-unknown` target:

```bash
rustup target add wasm32-unknown-unknown
cd contracts
cargo test -p stellar-agent-market
cargo build -p stellar-agent-market --target wasm32-unknown-unknown --release
```

The optimized WASM artifact is written under `contracts/target/wasm32-unknown-unknown/release/stellar_agent_market.wasm`.

## Deploy (testnet-first)

1. Build the WASM (above).
2. Use [Stellar CLI](https://developers.stellar.org/docs/tools/developer-tools) (`stellar contract deploy`) against Soroban testnet RPC.
3. Call `initialize` once with the admin `Address` you control.
4. Set server env `SOROBAN_AGENT_MARKET_CONTRACT_ID` to the deployed contract id (starts with `C` on future networks / contract addresses per Stellar conventions).
5. Optional: `SOROBAN_RPC_URL` to override defaults in `shared/stellarSoroban.ts`.

Mainnet uses the same flow with mainnet RPC, passphrase, and funding; keep testnet as the default development path.

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
