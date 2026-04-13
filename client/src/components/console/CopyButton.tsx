import { useState, useCallback } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

type CopyButtonProps = {
  text: string;
  label: string;
  className?: string;
  size?: "sm" | "default";
};

export function CopyButton({ text, label, className, size = "sm" }: CopyButtonProps) {
  const [done, setDone] = useState(false);

  const onCopy = useCallback(() => {
    void navigator.clipboard.writeText(text);
    setDone(true);
    window.setTimeout(() => setDone(false), 1800);
  }, [text]);

  return (
    <Button
      type="button"
      variant="outline"
      size={size === "sm" ? "sm" : "default"}
      className={className}
      onClick={onCopy}
      aria-label={done ? "Copied to clipboard" : label}
      title={label}
    >
      {done ? <Check className="h-3.5 w-3.5" aria-hidden /> : <Copy className="h-3.5 w-3.5" aria-hidden />}
    </Button>
  );
}
