"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { clsx } from "@/lib/clsx";

/*
 * The grouped list: a title-case header, a white card on the grouped grey, and
 * rows separated by a hairline that starts where the text starts rather than
 * running the full width. It's the single most recognisable shape in iOS, and
 * getting it right costs nothing in a settings screen that was going to be
 * label-and-value rows anyway.
 */

export function ListSection({
  header,
  footer,
  className,
  children,
}: {
  header?: string;
  /** Explanatory text under the group, the way iOS explains a switch. */
  footer?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={clsx("mb-6", className)} aria-label={header}>
      {header && <h2 className="mb-1.5 px-4 text-footnote font-medium text-muted">{header}</h2>}
      <div className="overflow-hidden rounded-[20px] bg-surface shadow-card">{children}</div>
      {footer && <p className="mt-1.5 px-4 text-footnote leading-relaxed text-muted">{footer}</p>}
    </section>
  );
}

/** A row that shows something. `value` sits right, secondary, the way iOS does it. */
export function ListRow({
  label,
  value,
  className,
}: {
  label: string;
  value?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex min-h-[44px] items-center justify-between gap-6 px-4 py-2.5",
        "border-b border-line/40 last:border-b-0",
        className
      )}
    >
      <span className="flex-shrink-0 text-body text-ink">{label}</span>
      {value !== undefined && (
        <span className="text-right text-body text-muted">{value}</span>
      )}
    </div>
  );
}

/** A row that goes somewhere, with the chevron that says so. */
export function ListLink({
  href,
  onClick,
  title,
  detail,
  accessory,
  destructive,
}: {
  href?: string;
  onClick?: () => void;
  title: string;
  detail?: string;
  /** Shown before the chevron — a current value, usually. */
  accessory?: React.ReactNode;
  destructive?: boolean;
}) {
  const inner = (
    <>
      <span className="min-w-0">
        <span className={clsx("block text-body", destructive ? "text-warning" : "text-ink")}>
          {title}
        </span>
        {detail && <span className="mt-0.5 block text-footnote leading-relaxed text-muted">{detail}</span>}
      </span>
      <span className="flex flex-shrink-0 items-center gap-1.5">
        {accessory && <span className="text-body text-muted">{accessory}</span>}
        <ChevronRight size={17} strokeWidth={2.2} className="text-faint" />
      </span>
    </>
  );

  const className =
    "press flex min-h-[44px] w-full items-center justify-between gap-4 border-b border-line/40 px-4 py-2.5 text-left last:border-b-0 active:bg-fill";

  return href ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <button onClick={onClick} className={className}>
      {inner}
    </button>
  );
}

/** A single full-width action inside its own group — Log out, Delete account. */
export function ListButton({
  onClick,
  children,
  destructive,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  destructive?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "min-h-[48px] w-full px-4 text-center text-body font-normal active:bg-fill disabled:opacity-50",
        destructive ? "text-warning" : "text-accent"
      )}
    >
      {children}
    </button>
  );
}
