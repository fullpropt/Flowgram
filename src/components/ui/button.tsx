import * as React from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "default" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantClasses: Record<ButtonVariant, string> = {
  default:
    "bg-[linear-gradient(135deg,var(--glow-pink),var(--glow-purple),var(--glow-orange))] text-[var(--primary-foreground)] shadow-[0_10px_24px_rgba(248,87,178,0.35)] hover:-translate-y-[1px] hover:shadow-[0_12px_28px_rgba(248,87,178,0.45)]",
  secondary:
    "bg-[var(--secondary)] text-[var(--foreground)] border border-[var(--border)] hover:bg-[#2e1b49] hover:-translate-y-[1px]",
  outline:
    "border border-[var(--border)] bg-[rgba(23,14,40,0.78)] text-[var(--foreground)] hover:bg-[var(--accent)]",
  ghost: "text-[var(--foreground)] hover:bg-[rgba(255,255,255,0.06)]",
  danger:
    "bg-[linear-gradient(135deg,#ff547d,#ff7a5f)] text-white shadow-[0_8px_22px_rgba(255,84,125,0.35)] hover:-translate-y-[1px]",
};

const sizeClasses: Record<ButtonSize, string> = {
  default: "h-10 px-4 py-2 text-sm",
  sm: "h-8.5 px-3 text-xs",
  lg: "h-11 px-6 text-sm",
  icon: "h-10 w-10",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition duration-200 disabled:pointer-events-none disabled:opacity-50",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
