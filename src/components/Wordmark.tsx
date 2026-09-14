import { clsx } from "@/lib/clsx";

/*
 * The app icon on the page: a white barbell on blue, drawn to the same
 * proportions as the home-screen icon (AppMark), so the mark someone taps to
 * open the app is the one they see while it opens.
 */

/** Width of the whole barbell in design units, as in AppMark. */
const DESIGN_WIDTH = 400;

export function Barbell({ size, inset, animated = false }: { size: number; inset: number; animated?: boolean }) {
  const unit = (size * (1 - inset * 2)) / DESIGN_WIDTH;
  const px = (n: number) => Math.max(1, Math.round(n * unit));
  const plate = (width: number, height: number, className?: string) => (
    <span
      className={clsx("block rounded-[2px] bg-white", className)}
      style={{ width: px(width), height: px(height) }}
    />
  );

  return (
    <span className={clsx("flex items-center", animated && "loader-lift")} style={{ gap: px(6) }}>
      {plate(30, 140, animated ? "loader-plate-outer-left" : undefined)}
      {plate(44, 200, animated ? "loader-plate-inner-left" : undefined)}
      <span className="block rounded-[1px] bg-white" style={{ width: px(220), height: px(22) }} />
      {plate(44, 200, animated ? "loader-plate-inner-right" : undefined)}
      {plate(30, 140, animated ? "loader-plate-outer-right" : undefined)}
    </span>
  );
}

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <div
      aria-hidden
      className="flex flex-shrink-0 items-center justify-center bg-accent"
      style={{ width: size, height: size, borderRadius: size * 0.225 }}
    >
      <Barbell size={size} inset={0.14} />
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
