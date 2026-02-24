"use client";

import { Clock3, Images, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Canal } from "@/types/models";

interface CanalSymbolProps {
  canal: Canal;
  className?: string;
}

export function CanalSymbol({ canal, className }: CanalSymbolProps) {
  const label = `Canal: ${canal}`;

  return (
    <span
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
      title={label}
    >
      {canal === "Reels" ? (
        <Play className="h-3.5 w-3.5" />
      ) : canal === "Story" ? (
        <Clock3 className="h-3.5 w-3.5" />
      ) : (
        <Images className="h-3.5 w-3.5" />
      )}
    </span>
  );
}
