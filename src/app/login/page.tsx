import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AuthForm } from "@/components/auth/auth-form";
import { authOptions } from "@/lib/auth-options";

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.id) {
    redirect("/ideas");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-4 py-8">
      <AuthForm />
    </div>
  );
}
