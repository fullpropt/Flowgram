import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[110px] w-full rounded-xl border border-[var(--border)] bg-white px-3 py-2 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--ring)] focus:ring-2 focus:ring-[#e6edff]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
