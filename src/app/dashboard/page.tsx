import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/prisma";
import { redirect } from "next/navigation";
import CreateWorkspaceButton from "@/components/workspace/create-workspace-button";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const membership = await db.membership.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  if (membership) redirect(`/workspace/${membership.workspaceId}/board`);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Welcome to ProjectFlow</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          You don't have any workspaces yet. Create one to get started.
        </p>
        <div className="mt-6">
          <CreateWorkspaceButton />
        </div>
      </div>
    </div>
  );
}