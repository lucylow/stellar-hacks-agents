/**
 * Local toolchain + env checks for Soroban deploy and server wiring.
 * Run: pnpm contracts:diagnose
 */
import "dotenv/config";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contractsRoot = path.join(repoRoot, "contracts");
const wasmCandidates = [
  path.join(contractsRoot, "target/wasm32v1-none/release/stellar_agent_market.wasm"),
  path.join(contractsRoot, "target/wasm32-unknown-unknown/release/stellar_agent_market.wasm"),
  path.join(contractsRoot, "stellar-agent-market/target/wasm32v1-none/release/stellar_agent_market.wasm"),
  path.join(contractsRoot, "stellar-agent-market/target/wasm32-unknown-unknown/release/stellar_agent_market.wasm"),
];

function findWasm(): string | null {
  for (const p of wasmCandidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function stellarCli(): { ok: boolean; detail: string } {
  const r = spawnSync("stellar", ["--version"], { encoding: "utf8" });
  if (r.error && "code" in r.error && (r.error as NodeJS.ErrnoException).code === "ENOENT") {
    return { ok: false, detail: "stellar CLI not found on PATH" };
  }
  if (r.status !== 0) {
    return { ok: false, detail: r.stderr?.trim() || "stellar --version failed" };
  }
  return { ok: true, detail: r.stdout.trim() };
}

function rustTargetInstalled(target: string): boolean {
  const r = spawnSync("rustup", ["target", "list", "--installed"], { encoding: "utf8" });
  if (r.status !== 0) return false;
  return r.stdout.split(/\n/).some(line => line.trim() === target);
}

const wasm = findWasm();
const stellar = stellarCli();
const hasWasm32Unknown = rustTargetInstalled("wasm32-unknown-unknown");
const hasWasm32v1 = rustTargetInstalled("wasm32v1-none");

const report = {
  repoRoot,
  releaseWasm: wasm
    ? { ok: true as const, path: wasm }
    : {
        ok: false as const,
        hint: "Run pnpm contracts:build or (from contracts/stellar-agent-market) stellar contract build",
      },
  stellarCli: stellar,
  rustTargets: {
    wasm32_unknown_unknown: hasWasm32Unknown,
    wasm32v1_none: hasWasm32v1,
  },
  serverEnv: {
    SOROBAN_AGENT_MARKET_CONTRACT_ID: Boolean(process.env.SOROBAN_AGENT_MARKET_CONTRACT_ID?.trim()),
    SOROBAN_AGENT_MARKET_CONTRACT_ID_FILE: process.env.SOROBAN_AGENT_MARKET_CONTRACT_ID_FILE ?? null,
    SOROBAN_RPC_URL: Boolean(process.env.SOROBAN_RPC_URL?.trim()),
  },
};

console.log(JSON.stringify(report, null, 2));

const blockers: string[] = [];
if (!wasm) blockers.push("release WASM missing");
if (!stellar.ok) blockers.push("Stellar CLI missing or broken");
if (!hasWasm32Unknown && !hasWasm32v1) blockers.push("no wasm rust target installed (rustup target add …)");
if (blockers.length) {
  console.error("\nBlockers:\n- " + blockers.join("\n- "));
  if (process.argv.includes("--strict")) {
    process.exitCode = 1;
  }
}
