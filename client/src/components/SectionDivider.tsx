export function SectionDivider({ variant = "default" }: { variant?: "default" | "wave" | "diagonal" }) {
  if (variant === "wave") {
    return (
      <div className="relative h-20 bg-gradient-to-b from-background to-card/20 overflow-hidden">
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,50 Q300,0 600,50 T1200,50 L1200,120 L0,120 Z"
            fill="currentColor"
            className="text-card/40"
          />
        </svg>
      </div>
    );
  }

  if (variant === "diagonal") {
    return (
      <div className="relative h-24 bg-gradient-to-b from-background to-card/20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-cyan-500/5" />
        <svg
          className="absolute w-full h-full"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <polygon
            points="0,0 1200,0 1200,60 0,120"
            fill="currentColor"
            className="text-card/30"
          />
        </svg>
      </div>
    );
  }

  return (
    <div className="relative h-12 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
      <div className="relative bg-background px-4">
        <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400" />
      </div>
    </div>
  );
}
