"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AuthMode = "login" | "register";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setErro("");
    setLoading(true);

    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nome, email, senha }),
        });

        if (!response.ok) {
          const body = (await response.json()) as { message?: string };
          setErro(body.message ?? "Nao foi possivel criar sua conta.");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password: senha,
        redirect: false,
      });

      if (result?.error) {
        setErro("Email ou senha invalidos.");
        return;
      }

      router.push("/ideas");
      router.refresh();
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--border)] bg-white p-6 shadow-sm">
      <div className="mb-5 space-y-2 text-center">
        <h1 className="text-2xl font-bold text-slate-900">Flowgram</h1>
        <p className="text-sm text-slate-500">
          Planejador visual de conteudo para Instagram
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
        <button
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            mode === "login" ? "bg-white shadow-sm" : "text-slate-600"
          }`}
          onClick={() => setMode("login")}
          type="button"
        >
          Entrar
        </button>
        <button
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            mode === "register" ? "bg-white shadow-sm" : "text-slate-600"
          }`}
          onClick={() => setMode("register")}
          type="button"
        >
          Criar conta
        </button>
      </div>

      <form className="space-y-3" onSubmit={onSubmit}>
        {mode === "register" ? (
          <Input
            onChange={(event) => setNome(event.target.value)}
            placeholder="Seu nome"
            value={nome}
          />
        ) : null}
        <Input
          autoComplete="email"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="voce@exemplo.com"
          required
          type="email"
          value={email}
        />
        <Input
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          onChange={(event) => setSenha(event.target.value)}
          placeholder="Sua senha"
          required
          type="password"
          value={senha}
        />

        {erro ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {erro}
          </p>
        ) : null}

        <Button className="w-full" disabled={loading} type="submit">
          {loading ? "Carregando..." : mode === "login" ? "Entrar" : "Criar conta"}
        </Button>
      </form>
    </div>
  );
}
