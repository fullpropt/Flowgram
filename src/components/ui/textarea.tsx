import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[110px] w-full rounded-xl border border-[var(--border)] bg-[rgba(19,12,36,0.84)] px-3 py-2 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[#8f7cae] focus:border-[var(--ring)] focus:ring-2 focus:ring-[rgba(249,87,192,0.22)]",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";
