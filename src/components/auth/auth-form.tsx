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
        if (result.error === "CredentialsSignin") {
          setErro("Email ou senha invalidos.");
        } else {
          setErro("Falha de autenticacao. Verifique as variaveis NEXTAUTH no Railway.");
          console.error("NextAuth signIn error:", result.error);
        }
        return;
      }

      const sessionResponse = await fetch("/api/auth/session", {
        method: "GET",
        cache: "no-store",
      });
      const sessionBody = (await sessionResponse.json()) as {
        user?: { id?: string };
      };
      if (!sessionBody?.user?.id) {
        setErro(
          "Login efetuado, mas a sessao nao foi persistida. Revise NEXTAUTH_URL/NEXTAUTH_SECRET e cookies do navegador.",
        );
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
    <div className="panel mx-auto w-full max-w-md p-6 md:p-7">
      <div className="mb-5 space-y-2 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">Flowgram</h1>
        <p className="text-sm text-[var(--muted)]">
          Planejador visual de conteudo para Instagram
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl border border-[var(--border)] bg-[rgba(21,13,38,0.8)] p-1">
        <button
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            mode === "login"
              ? "bg-[linear-gradient(135deg,rgba(248,87,178,0.3),rgba(168,60,255,0.28),rgba(255,154,60,0.22))] text-[#ffe3f8] shadow-sm"
              : "text-[#bfa8df]"
          }`}
          onClick={() => setMode("login")}
          type="button"
        >
          Entrar
        </button>
        <button
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            mode === "register"
              ? "bg-[linear-gradient(135deg,rgba(248,87,178,0.3),rgba(168,60,255,0.28),rgba(255,154,60,0.22))] text-[#ffe3f8] shadow-sm"
              : "text-[#bfa8df]"
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
          <p className="rounded-lg border border-[#6c2f5a] bg-[rgba(72,20,55,0.72)] px-3 py-2 text-sm text-[#ff9cc8]">
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
