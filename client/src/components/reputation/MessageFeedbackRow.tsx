import { Button } from "@/components/ui/button";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useReputation } from "@/_core/context/ReputationContext";

type Props = {
  messageId: string;
};

/**
 * Lightweight outcome signal — feeds reputation without feeling like a survey.
 */
export function MessageFeedbackRow({ messageId }: Props) {
  const { recordFeedback } = useReputation();

  return (
    <div
      className="mt-2 flex flex-wrap items-center gap-2 border-t border-purple-500/15 pt-2"
      role="group"
      aria-label="Rate this assistant reply"
    >
      <span className="text-[10px] uppercase tracking-wide text-slate-500">Helpful?</span>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-emerald-400 hover:bg-emerald-950/30"
        aria-label="Mark reply as useful"
        onClick={() => recordFeedback({ stars: 0, useful: true, accurate: null, relatedMessageId: messageId })}
      >
        <ThumbsUp className="w-3.5 h-3.5" aria-hidden />
      </Button>
      <Button
        type="button"
        size="sm"
        variant="ghost"
        className="h-7 px-2 text-amber-400 hover:bg-amber-950/25"
        aria-label="Mark reply as not useful"
        onClick={() => recordFeedback({ stars: 0, useful: false, accurate: null, relatedMessageId: messageId })}
      >
        <ThumbsDown className="w-3.5 h-3.5" aria-hidden />
      </Button>
    </div>
  );
}
