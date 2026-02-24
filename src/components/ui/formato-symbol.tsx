"use client";

import {
  Clock3,
  Image as ImageIcon,
  Images,
  Play,
  Printer,
  type LucideIcon,
} from "lucide-react";
import { formatoLabel } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { Formato } from "@/types/models";

const formatoIcon: Record<Formato, LucideIcon> = {
  Carrossel: Images,
  Reels: Play,
  Print: Printer,
  "Imagem unica": ImageIcon,
  Story: Clock3,
};

interface FormatoSymbolProps {
  formato: Formato;
  className?: string;
}

export function FormatoSymbol({ formato, className }: FormatoSymbolProps) {
  const Icon = formatoIcon[formato];
  const label = formatoLabel[formato];

  return (
    <span
      aria-label={label}
      className={cn("inline-flex items-center justify-center", className)}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </span>
  );
}
