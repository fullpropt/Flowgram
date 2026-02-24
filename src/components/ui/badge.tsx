import { cn } from "@/lib/utils";

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-[#d9e5ff] bg-[#f3f7ff] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-[#3353b8]",
        className,
      )}
    >
      {children}
    </span>
  );
}
