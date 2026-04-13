export function getAgentMarketContractId(): string | null {
  const v = process.env.SOROBAN_AGENT_MARKET_CONTRACT_ID?.trim();
  return v && v.length > 0 ? v : null;
}

export function getSorobanRpcUrlOverride(): string | null {
  const v = process.env.SOROBAN_RPC_URL?.trim();
  return v && v.length > 0 ? v : null;
}
