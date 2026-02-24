"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AccountFormState {
  name: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export default function AccountSettingsPage() {
  const [form, setForm] = useState<AccountFormState>({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      setLoading(true);
      setMessage(null);

      try {
        const response = await fetch("/api/account", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        const data = (await response.json()) as { name?: string; email?: string; message?: string };

        if (!response.ok) {
          throw new Error(data.message || "Falha ao carregar dados da conta.");
        }

        if (!active) return;
        setForm((prev) => ({
          ...prev,
          name: data.name ?? "",
          email: data.email ?? "",
        }));
      } catch (error) {
        if (!active) return;
        setMessage({
          type: "error",
          text: error instanceof Error ? error.message : "Falha ao carregar dados da conta.",
        });
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadAccount();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setMessage(null);

    if (!form.name.trim()) {
      setMessage({ type: "error", text: "Informe o nome da conta." });
      return;
    }

    if (form.newPassword || form.confirmNewPassword || form.currentPassword) {
      if (!form.currentPassword) {
        setMessage({ type: "error", text: "Informe a senha atual para trocar a senha." });
        return;
      }
      if (!form.newPassword) {
        setMessage({ type: "error", text: "Informe a nova senha." });
        return;
      }
      if (form.newPassword !== form.confirmNewPassword) {
        setMessage({ type: "error", text: "A confirmacao da nova senha nao confere." });
        return;
      }
    }

    setSaving(true);

    try {
      const response = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const data = (await response.json()) as {
        name?: string;
        email?: string;
        message?: string;
        passwordChanged?: boolean;
      };

      if (!response.ok) {
        throw new Error(data.message || "Falha ao salvar configuracoes da conta.");
      }

      setForm((prev) => ({
        ...prev,
        name: data.name ?? prev.name,
        email: data.email ?? prev.email,
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      }));
      setMessage({
        type: "success",
        text: data.passwordChanged
          ? "Conta atualizada. Nome e senha foram alterados."
          : "Conta atualizada com sucesso.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Falha ao salvar configuracoes da conta.",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <section className="panel p-5 md:p-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
          Conta
        </p>
        <h2 className="mt-1 text-xl font-bold text-[var(--foreground)]">
          Configuracao de Conta
        </h2>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Atualize o nome exibido e altere a senha de acesso.
        </p>
      </section>

      <section className="panel-soft p-4 md:p-5">
        {loading ? (
          <p className="text-sm text-[var(--muted)]">Carregando dados da conta...</p>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  Nome da conta
                </label>
                <Input
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  value={form.name}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                  Email
                </label>
                <Input disabled value={form.email} />
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[rgba(18,11,33,0.7)] p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted-soft)]">
                Alterar senha
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Preencha apenas se quiser trocar a senha.
              </p>

              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs text-[var(--muted)]">Senha atual</label>
                  <Input
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                    }
                    type="password"
                    value={form.currentPassword}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-[var(--muted)]">Nova senha</label>
                  <Input
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, newPassword: event.target.value }))
                    }
                    type="password"
                    value={form.newPassword}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-[var(--muted)]">Confirmar nova senha</label>
                  <Input
                    onChange={(event) =>
                      setForm((prev) => ({ ...prev, confirmNewPassword: event.target.value }))
                    }
                    type="password"
                    value={form.confirmNewPassword}
                  />
                </div>
              </div>
            </div>

            {message ? (
              <div
                className={
                  message.type === "success"
                    ? "rounded-xl border border-[#3b7f62] bg-[rgba(20,58,42,0.4)] px-3 py-2 text-sm text-[#b7ffd8]"
                    : "rounded-xl border border-[#8a3c58] bg-[rgba(72,20,36,0.35)] px-3 py-2 text-sm text-[#ffd1dd]"
                }
              >
                {message.text}
              </div>
            ) : null}

            <div className="flex justify-end">
              <Button disabled={saving} type="submit">
                {saving ? "Salvando..." : "Salvar configuracoes"}
              </Button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}

