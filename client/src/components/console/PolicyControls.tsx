import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ApprovalMode, PolicyState } from "@/lib/demoConsoleTypes";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { StatusPill } from "./StatusPill";

type PolicyControlsProps = {
  policy: PolicyState;
  onChange: (next: PolicyState) => void;
};

export function PolicyControls({ policy, onChange }: PolicyControlsProps) {
  return (
    <Card className="app-card border border-[var(--border)] bg-[var(--surface-elevated)]/90 p-4 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Shield className="h-4 w-4 text-[var(--accent-primary)] shrink-0" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-[var(--text)]">Guardrails</h3>
            <p className="text-xs text-[var(--muted-text)] leading-relaxed">
              Spend capped by policy. Explicit approval required before execution when enabled.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 justify-end">
          {policy.automationPaused ? (
            <StatusPill tone="warning" srLabel="Automation paused">
              Paused
            </StatusPill>
          ) : (
            <StatusPill tone="success" srLabel="Automation active">
              Active
            </StatusPill>
          )}
          {policy.humanOverride ? (
            <StatusPill tone="info" srLabel="Human override on">
              Human override
            </StatusPill>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="policy-pause" className="text-xs text-[var(--muted-text)]">
            Pause automation
          </Label>
          <Switch
            id="policy-pause"
            checked={policy.automationPaused}
            onCheckedChange={(v) => onChange({ ...policy, automationPaused: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="policy-override" className="text-xs text-[var(--muted-text)]">
            Human override (force review)
          </Label>
          <Switch
            id="policy-override"
            checked={policy.humanOverride}
            onCheckedChange={(v) => onChange({ ...policy, humanOverride: v })}
          />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="policy-allowlist" className="text-xs text-[var(--muted-text)]">
            Allowlist only (block unknown tools)
          </Label>
          <Switch
            id="policy-allowlist"
            checked={policy.allowlistOnly}
            onCheckedChange={(v) => onChange({ ...policy, allowlistOnly: v })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--text)]" id="approval-mode-label">
          Approval mode
        </p>
        <RadioGroup
          className="grid gap-2"
          value={policy.approvalMode}
          onValueChange={(v) => onChange({ ...policy, approvalMode: v as ApprovalMode })}
          aria-labelledby="approval-mode-label"
        >
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2 text-xs has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--focus-ring)]">
            <RadioGroupItem value="explicit" id="am-explicit" />
            <span>Explicit approval required</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--surface)]/80 px-3 py-2 text-xs has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--focus-ring)]">
            <RadioGroupItem value="auto_under_cap" id="am-auto" />
            <span>Auto under spend cap (still visible in audit log)</span>
          </label>
        </RadioGroup>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <Label className="text-xs text-[var(--muted-text)]">Per-session spend cap (USDC)</Label>
          <span className="text-xs font-mono text-[var(--accent-primary)] tabular-nums">
            {policy.spendCapUsdc.toFixed(3)}
          </span>
        </div>
        <Slider
          value={[policy.spendCapUsdc]}
          min={0.001}
          max={0.05}
          step={0.001}
          onValueChange={(v) => onChange({ ...policy, spendCapUsdc: v[0] ?? policy.spendCapUsdc })}
          aria-label="Spend cap in USDC"
        />
      </div>
    </Card>
  );
}
