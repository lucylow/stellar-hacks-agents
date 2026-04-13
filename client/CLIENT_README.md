# Frontend quick reference

## Run the app

From the repository root:

```bash
pnpm install
pnpm dev
```

Vite serves the client; the Express server exposes `/api/trpc`. Use the URL printed in the terminal (often `http://localhost:3000` or similar, depending on your server config).

## Testnet vs mainnet

- **Wallet UI:** Use the **Use mainnet / Use testnet** toggle on the wallet card. The choice is stored in `localStorage` under `stellar_network_mode`.
- **Horizon:** URLs come from `shared/stellarHorizon.ts` (`testnet` → `https://horizon-testnet.stellar.org`, `mainnet` → `https://horizon.stellar.org`).
- **Dashboard queries:** `AccountDashboard` passes the current wallet network into `stellar.getAccountDetails` and related procedures so UI and RPC stay aligned.

## Freighter

Install [Freighter](https://freighter.app) for Chromium or Firefox. Without the extension, the app stays in **demo mode** for chat and tasks; the wallet card explains that Freighter was not detected.

## Mock / demo search

`STELLAR_SEARCH_USES_MOCK` in `shared/const.ts` is `true` when search results are generated on the server for demo purposes. The **Search experience (demo)** section on the home page calls `agent.search` and labels results as mock data. Replacing the implementation in `server/_core/mcpSearch.ts` with a real MCP client is the intended upgrade path.

## Typecheck and tests

```bash
pnpm run check
pnpm test
pnpm run build
```
