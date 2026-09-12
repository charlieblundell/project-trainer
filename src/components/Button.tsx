import { ButtonHTMLAttributes } from "react";
import { clsx } from "@/lib/clsx";

type Variant = "primary" | "secondary" | "ghost" | "danger";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={clsx(
        "w-full rounded-[20px] py-4 text-[15px] font-semibold transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" && "bg-ink text-background hover:opacity-90",
        variant === "secondary" &&
          "bg-surface text-ink hover:border-ink/30",
        variant === "ghost" && "bg-transparent text-muted hover:text-ink",
        variant === "danger" && "border border-line bg-transparent text-warning hover:bg-warning-soft",
        className
      )}
      {...props}
    />
  );
}
