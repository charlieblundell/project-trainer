import Link from "next/link";
import { clsx } from "@/lib/clsx";

/**
 * The name, set in type and nothing else. Used on the pages a first-time
 * visitor sees, where a gradient app-icon with a heartbeat line reads as a
 * template rather than a product.
 */
export function TypeMark({ className, href = "/" }: { className?: string; href?: string }) {
  return (
    <Link
      href={href}
      className={clsx(
        "font-marketing-display text-[13px] font-extrabold uppercase tracking-[0.14em] text-ink",
        className
      )}
    >
      Your Personal Trainer
    </Link>
  );
}
