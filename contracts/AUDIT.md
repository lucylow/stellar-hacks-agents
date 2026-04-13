# Contract layer audit (boundary)

## Existing indirect behavior

- **Horizon**: `stellar.getAccountDetails`, `getRecentTransactions`, `getOperations`, `getNetworkInfo` — account and ledger truth, not app business registry.
- **Mocks**: `payments`, `wallet`, `search`, and static `services` catalog — UX placeholders until chain-backed catalog is configured.
- **Agent / reputation UI**: client-side and shared compute modules — not durable onchain until wired to `get_reputation` / events.

## Canonical state

- **Onchain (this workspace)**: `stellar-agent-market` — services, pricing version, access mode, escrow state machine, settlements, reputation counters, typed errors, events.
- **Offchain**: OAuth users, Drizzle/MySQL, MCP search, LLM routing, private keys (except user wallet), and custodial token movements.

## Data placement

| Onchain | Offchain |
|--------|----------|
| Service id, owner, endpoint, description, price, asset, access, status, timestamps | Search ranking, embeddings, crawl cache |
| Escrow / settlement / receipt references | Raw task payloads, MCP responses |
| Reputation aggregates | Detailed feedback text, moderation |
| Price version | Marketing copy, non-authoritative UI hints |

## UI alignment

- **Home / dashboard / tasks**: show registry summary, live price, escrow status, settlement receipt, reputation chip when contract id + RPC are configured.

This file is the working audit note for the smart-contract addition; keep it updated when endpoints change.
