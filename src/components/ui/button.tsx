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
    "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[0_6px_18px_rgba(34,75,204,0.24)] hover:-translate-y-[1px] hover:shadow-[0_8px_20px_rgba(34,75,204,0.3)]",
  secondary:
    "bg-[var(--secondary)] text-[var(--foreground)] hover:bg-[#dfe8ff] hover:-translate-y-[1px]",
  outline:
    "border border-[var(--border)] bg-white text-[var(--foreground)] hover:bg-[var(--accent)]",
  ghost: "text-[var(--foreground)] hover:bg-[#f1f5f9]",
  danger: "bg-[var(--danger)] text-white hover:-translate-y-[1px] hover:opacity-95",
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
