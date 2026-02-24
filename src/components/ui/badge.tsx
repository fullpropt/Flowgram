import { cn } from "@/lib/utils";

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[#eef3ff] px-2.5 py-1 text-xs font-semibold text-[#2d4ca8]",
        className,
      )}
    >
      {children}
    </span>
  );
}
