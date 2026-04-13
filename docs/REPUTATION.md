# Reputation system

## What it means

Reputation in this app is **behavioral trust derived from observable actions** in the browser: wallet connects, agent tool runs, demo search completions, optional x402 settlement signals, Horizon transaction success rates, and lightweight thumbs feedback. It is **not** identity verification or Sybil resistance.

## Where it is defined

- **Types:** `shared/reputationModel.ts`
- **Deterministic scoring:** `shared/reputationCompute.ts` (`aggregateReputation`, `scoreToTier`, `computeTrend`, `rankSearchResults`, …)
- **Event capture + persistence:** `client/src/_core/context/ReputationContext.tsx` (localStorage key `stellar_reputation_bundle_v1`, partitioned by Stellar public key or `__guest__`)

## Where it appears in the UI

- Wallet card (`WalletConnect`) — session trust marker + tier/score
- Account dashboard — trust card next to Horizon data; tx success rate feeds `setHorizonSuccessRate`
- Agent chat — header strip, per-reply trust chips, thumbs row, LLM `reputationContext`
- Task panel — success/fail/retry counts vs tier
- Search demo — trust-ranked results with domain/freshness badges
- Tool result cards — `rankSearchResults` for search + blockchain evidence lists

## Adding a new reputation event

1. Add the event type to `ReputationEventType` and (if needed) a default weight in `EVENT_WEIGHTS` inside `shared/reputationCompute.ts`.
2. Emit from the UI (or future server adapter) via `useReputation().emit({ type, source, demoMode?, meta? })`.
3. If it should affect LLM tone, the aggregated line is already sent as `reputationContext` on `agent.chat` — extend `reputationNarrativeForLLM` if you need explicit wording.

## Mock vs live

- `demoMode` on events and `summary.demoModeLabel` surface whether history is demo-heavy.
- Search mock is explicit in badges (`STELLAR_SEARCH_USES_MOCK`, server `searchMode`).

## Resetting demo data

Call `useReputation().resetDemoDataForCurrentAccount()` (wire to a settings button if desired) or clear `localStorage` key `stellar_reputation_bundle_v1`.

## Sample aggregates

See `shared/reputationSamples.ts` for example event bundles and precomputed `sampleSummaries` (useful for debugging and docs).

## Tests

`shared/reputationCompute.test.ts` covers tiers, aggregation, failure bursts, ranking, and URL credibility heuristics (`pnpm test`).

## Future: server persistence

The Drizzle schema is unchanged; swapping `loadRoot` / `saveRoot` in `ReputationContext` for tRPC + MySQL would be the natural extension without duplicating score logic (keep `aggregateReputation` as the single source of truth for numbers).
