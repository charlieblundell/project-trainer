import { clsx } from "@/lib/clsx";

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center rounded-[9px]"
      style={{
        width: size,
        height: size,
        background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
      }}
    >
      <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 24 24" fill="none">
        <path
          d="M2 13h4l2.5-7 4 14 2.5-9 2 2H22"
          stroke="white"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function Wordmark({
  className,
  size = 28,
  iconOnly = false,
}: {
  className?: string;
  size?: number;
  iconOnly?: boolean;
}) {
  return (
    <div className={clsx("flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {!iconOnly && (
        <span className="font-display text-[15px] font-bold leading-[1.1] tracking-tight text-ink">
          Your Personal
          <br />
          Trainer
        </span>
      )}
    </div>
  );
}
