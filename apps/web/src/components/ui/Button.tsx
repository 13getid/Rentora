import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "dark" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  loading?: boolean;
}

// Level 2 of the intensity ladder: square corners, 2px ink border, hard shadow.
// Hover "presses" the button toward its shadow, which reads as a physical click.
const bold =
  "border-2 border-ink shadow-hard hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-hard-sm active:translate-x-1 active:translate-y-1 active:shadow-none";

const variants: Record<Variant, string> = {
  primary: `bg-amber text-ink ${bold}`,
  danger: `bg-danger text-paper ${bold}`,
  dark: "rounded-lg bg-ink text-paper hover:bg-ink/85",
  ghost: "rounded-lg text-ink hover:bg-sand",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", loading = false, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 px-5 text-[15px] font-bold transition-[transform,box-shadow,background-color] duration-100 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="size-4 motion-safe:animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
});
