import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[var(--background)] px-4 py-8">
      <div className="pointer-events-none absolute -left-24 top-[-8rem] h-72 w-72 rounded-full bg-[rgba(248,87,178,0.25)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-6rem] top-[-5rem] h-72 w-72 rounded-full bg-[rgba(168,60,255,0.22)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-7rem] left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[rgba(255,154,60,0.16)] blur-3xl" />
      <AuthForm />
    </div>
  );
}
