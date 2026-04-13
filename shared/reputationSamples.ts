import type { FeedbackEntry, ReputationEvent } from "./reputationModel";
import { aggregateReputation } from "./reputationCompute";

const iso = (offsetMin: number) => new Date(Date.now() - offsetMin * 60_000).toISOString();

/** Brand-new session — no events. */
export function sampleEventsNewUser(): ReputationEvent[] {
  return [];
}

/** A few successful paths, mock search. */
export function sampleEventsEstablished(): ReputationEvent[] {
  return [
    {
      id: "e1",
      type: "wallet_connected",
      at: iso(60 * 24 * 2),
      source: "wallet",
      publicKey: "G...SAMPLE",
      demoMode: true,
    },
    {
      id: "e2",
      type: "search_completed",
      at: iso(60 * 20),
      source: "search",
      publicKey: "G...SAMPLE",
      demoMode: true,
    },
    {
      id: "e3",
      type: "task_succeeded",
      at: iso(10),
      source: "agent_task",
      publicKey: "G...SAMPLE",
      demoMode: true,
      meta: { latencyMs: 4200 },
    },
  ];
}

export function sampleEventsTrusted(): ReputationEvent[] {
  const base = sampleEventsEstablished();
  return [
    ...base,
    {
      id: "e4",
      type: "blockchain_lookup_completed",
      at: iso(8),
      source: "blockchain_lookup",
      publicKey: "G...SAMPLE",
      demoMode: false,
    },
    {
      id: "e5",
      type: "task_succeeded",
      at: iso(5),
      source: "agent_task",
      publicKey: "G...SAMPLE",
      demoMode: true,
      meta: { latencyMs: 3100 },
    },
    {
      id: "e6",
      type: "feedback_positive",
      at: iso(3),
      source: "user_feedback",
      publicKey: "G...SAMPLE",
    },
  ];
}

export function sampleEventsFailures(): ReputationEvent[] {
  return [
    {
      id: "f1",
      type: "wallet_connected",
      at: iso(120),
      source: "wallet",
      publicKey: "G...SAMPLE",
    },
    {
      id: "f2",
      type: "task_failed",
      at: iso(90),
      source: "agent_task",
      publicKey: "G...SAMPLE",
    },
    {
      id: "f3",
      type: "task_failed",
      at: iso(60),
      source: "agent_task",
      publicKey: "G...SAMPLE",
    },
    {
      id: "f4",
      type: "tool_retry",
      at: iso(55),
      source: "agent_task",
      publicKey: "G...SAMPLE",
    },
    {
      id: "f5",
      type: "task_succeeded",
      at: iso(20),
      source: "agent_task",
      publicKey: "G...SAMPLE",
    },
  ];
}

export function sampleFeedbackMixed(): FeedbackEntry[] {
  return [
    { id: "fb1", at: iso(15), stars: 5, useful: true, accurate: true },
    { id: "fb2", at: iso(10), stars: 2, useful: false, accurate: false },
  ];
}

/** Pre-computed summaries for Storybook-style debugging (not used at runtime). */
export const sampleSummaries = {
  newUser: aggregateReputation({ events: sampleEventsNewUser(), feedback: [], onChainSuccessRate: null }),
  established: aggregateReputation({ events: sampleEventsEstablished(), feedback: [], onChainSuccessRate: 0.9 }),
  trusted: aggregateReputation({ events: sampleEventsTrusted(), feedback: [sampleFeedbackMixed()[0]], onChainSuccessRate: 0.95 }),
  failures: aggregateReputation({ events: sampleEventsFailures(), feedback: [], onChainSuccessRate: 0.55 }),
};
