import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => {
  return (
    <input
      className={cn(
        "flex h-10 w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--ring)] focus:ring-2 focus:ring-[#e6edff]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";
