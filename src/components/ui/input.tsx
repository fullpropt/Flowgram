import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[#8f7cae] focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";
