import { cn } from "@/lib/utils";

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#513070] bg-[rgba(34,20,56,0.82)] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#e9d8ff]",
        className,
      )}
    >
      {children}
    </span>
  );
}
