import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { PostStudio } from "@/components/studio/post-studio";
import { authOptions } from "@/lib/auth-options";
import { canAccessStudio } from "@/lib/feature-access";

export default async function StudioPage() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (!canAccessStudio(email)) {
    redirect("/ideas");
  }

  return <PostStudio />;
}

