import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { askCoachHref } from "@/lib/ai/client";
import { clsx } from "@/lib/clsx";

/**
 * The coach, from wherever the question comes up. It opens with the question
 * already written, ready to send or to edit first, so the coach isn't only
 * something in the corner you have to remember to go and ask.
 */
export function AskCoachLink({
  question,
  label = "Ask the coach",
  className,
}: {
  question: string;
  label?: string;
  className?: string;
}) {
  return (
    <Link
      href={askCoachHref(question)}
      className={clsx(
        "press inline-flex min-h-[44px] items-center gap-2 text-subhead font-semibold text-accent",
        className
      )}
    >
      <MessageCircle size={17} strokeWidth={2.2} aria-hidden />
      {label}
    </Link>
  );
}
