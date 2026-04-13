import fs from "node:fs";
import path from "node:path";

function readContractIdFromFile(): string | null {
  const p = process.env.SOROBAN_AGENT_MARKET_CONTRACT_ID_FILE?.trim();
  if (!p) return null;
  try {
    const abs = path.isAbsolute(p) ? p : path.join(process.cwd(), p);
    const raw = fs.readFileSync(abs, "utf8");
    for (const line of raw.split(/\n/)) {
      const trimmed = line.trim();
      if (trimmed.startsWith("#") || trimmed.length === 0) continue;
      const m = trimmed.match(/^SOROBAN_AGENT_MARKET_CONTRACT_ID\s*=\s*(\S+)/);
      if (m?.[1]) return m[1]!.trim() || null;
    }
    const single = raw.trim();
    if (/^C[A-Z0-9]{55}$/.test(single)) return single;
  } catch {
    return null;
  }
  return null;
}

export type AgentMarketContractIdSource = "env" | "file" | null;

export function getAgentMarketContractIdMeta(): {
  id: string | null;
  source: AgentMarketContractIdSource;
} {
  const envV = process.env.SOROBAN_AGENT_MARKET_CONTRACT_ID?.trim();
  if (envV) return { id: envV, source: "env" };
  const fileId = readContractIdFromFile();
  if (fileId) return { id: fileId, source: "file" };
  return { id: null, source: null };
}

export function getAgentMarketContractId(): string | null {
  return getAgentMarketContractIdMeta().id;
}

export function getSorobanRpcUrlOverride(): string | null {
  const v = process.env.SOROBAN_RPC_URL?.trim();
  return v && v.length > 0 ? v : null;
}
