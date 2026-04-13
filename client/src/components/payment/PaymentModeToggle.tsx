import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Pref = "auto" | "per_request" | "prepaid_credits" | "session_streaming" | "demo_free";

type Props = {
  demoFree: boolean;
  preferredMode: Pref;
  onDemoFreeChange: (v: boolean) => void;
  onPreferredModeChange: (m: Pref) => void;
};

export function PaymentModeToggle({ demoFree, preferredMode, onDemoFreeChange, onPreferredModeChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px]">
      <div className="flex items-center gap-2 rounded-md border border-slate-600/40 bg-slate-950/50 px-2 py-1">
        <Switch
          id="pay-demo-free"
          checked={demoFree}
          onCheckedChange={(c) => onDemoFreeChange(Boolean(c))}
          className="scale-90"
        />
        <Label htmlFor="pay-demo-free" className="text-slate-400 cursor-pointer">
          Demo free
        </Label>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-slate-500 uppercase tracking-wide">Mode</span>
        <Select value={preferredMode} onValueChange={(v) => onPreferredModeChange(v as Pref)}>
          <SelectTrigger className="h-7 w-[9.5rem] text-[10px] border-slate-600/50 bg-slate-950/50">
            <SelectValue placeholder="auto" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="auto">Auto (server router)</SelectItem>
            <SelectItem value="per_request">Per-request</SelectItem>
            <SelectItem value="prepaid_credits">Prepaid credits</SelectItem>
            <SelectItem value="session_streaming">Session / stream</SelectItem>
            <SelectItem value="demo_free">Force demo free</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Badge variant="outline" className="text-[9px] border-cyan-500/35 text-cyan-200/90">
        Data-driven
      </Badge>
    </div>
  );
}
