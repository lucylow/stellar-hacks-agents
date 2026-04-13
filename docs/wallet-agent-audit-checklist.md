# Wallet & agent flow audit (April 2026)

## Findings (pre-refactor)

| Area | Issue | Severity |
|------|--------|----------|
| Wallet state | `Home` and `WalletConnect` each called `useStellarWallet()` → **two independent states**; header `showApp` + `connectWallet` could desync from sidebar wallet | Critical |
| Horizon | Client hook hardcoded **mainnet** Horizon while UI said "Testnet"; new accounts on testnet 404 on mainnet | High |
| Auto-reconnect | `useEffect` called `connectWallet()` on mount with **empty deps** → stale closure / double connect risk | Medium |
| Refresh errors | Balance refresh failures only `console.error` — no user-visible state; could silently show stale balance | Medium |
| Agent chat | Server returned **`toolCalls: []`** always — LLM tool path not executed; tool UI never reflected reality | High |
| AgentTaskPanel | **Random interval simulator** unrelated to chat; no shared vocabulary with agent | Medium |
| Account dashboard | **No error UI** when `getAccountDetails` fails; `accountQuery.data` null leaves empty card; `substring` on optional fields risky | Medium |
| Demo vs live | Mock search had **no UI label**; LLM failures surfaced as generic errors | Medium |

## State transitions (target)

- **Wallet**: `idle` → `detecting` → (`error` \| `disconnected`) → `connecting` → `connected`; refresh preserves `connected` on transient Horizon errors.
- **Agent (UI)**: events from chat drive task panel (`tool_called`, `tool_returned`, `task_completed`, …).
- **Search**: `mock` until MCP is wired; badge always shown when mock.

## Files touched (priority)

1. `client/src/_core/context/StellarWalletContext.tsx` + hook export (single source of truth)
2. `client/src/_core/hooks/useStellarWallet.ts` (implementation used by provider)
3. `shared/*` types + `stellarAccountFormat` + `stellarHorizon`
4. `server/routers/stellar.ts`, `server/routers/agent.ts`, `server/_core/llm.ts`
5. `WalletConnect.tsx`, `AccountDashboard.tsx`, `AgentChat.tsx`, `AgentTaskPanel.tsx`, `Home.tsx`
6. `client/src/components/ui/*` helpers as needed
