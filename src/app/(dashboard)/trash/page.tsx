"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/store/app-store";

export default function TrashPage() {
  const hydrated = useAppStore((state) => state.hydrated);
  const trashedCards = useAppStore((state) => state.trashedCards);
  const restoreTrashedCard = useAppStore((state) => state.restoreTrashedCard);
  const purgeTrashedCard = useAppStore((state) => state.purgeTrashedCard);

  return (
    <div className="space-y-4">
      <section className="panel p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
              Lixeira temporaria
            </p>
            <h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">
              Recuperacao em ate 7 dias
            </h2>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Cards excluidos podem ser restaurados antes da expiracao.
            </p>
          </div>

          <span className="rounded-full border border-[var(--border)] bg-[rgba(20,12,34,0.85)] px-3 py-1 text-xs font-semibold text-[#d9c6f8]">
            {trashedCards.length} item(ns)
          </span>
        </div>
      </section>

      {!hydrated ? (
        <div className="panel p-5 text-sm text-[var(--muted)]">Carregando lixeira...</div>
      ) : null}

      {hydrated && trashedCards.length > 0 ? (
        <section className="panel-soft p-4">
          <div className="space-y-3">
            {trashedCards.map((item) => (
              <div
                className="rounded-xl border border-[var(--border)] bg-[rgba(18,11,33,0.82)] p-3"
                key={`${item.card.id}-${item.deletedAt}`}
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                      {item.card.titulo}
                    </p>
                    <p className="mt-1 text-xs text-[var(--muted)]">
                      Excluido em {format(new Date(item.deletedAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      {" • "}expira em{" "}
                      {format(new Date(item.expiresAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => restoreTrashedCard(item.card.id)}
                      size="sm"
                      variant="outline"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restaurar
                    </Button>
                    <Button
                      onClick={() => purgeTrashedCard(item.card.id)}
                      size="sm"
                      variant="danger"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir permanente
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hydrated && trashedCards.length === 0 ? (
        <section className="panel-soft p-10 text-center text-sm text-[var(--muted)]">
          Nenhum card na lixeira no momento.
        </section>
      ) : null}
    </div>
  );
}
