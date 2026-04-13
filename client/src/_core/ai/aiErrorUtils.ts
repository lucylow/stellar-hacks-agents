export type MappedChatError = { title: string; body: string; dev?: string; retryable: boolean };

export function mapChatError(err: unknown): MappedChatError {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("OPENAI") || msg.includes("API_KEY") || msg.includes("LLM")) {
    return {
      title: "Agent service unavailable",
      body: "The agent could not reach the LLM. Check BUILT_IN_FORGE_API_KEY on the server.",
      dev: msg,
      retryable: true,
    };
  }
  return {
    title: "Message failed",
    body: "Something went wrong sending your message. Try again in a moment.",
    dev: msg,
    retryable: true,
  };
}
