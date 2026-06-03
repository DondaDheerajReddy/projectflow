import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isWorkspaceMember, isWorkspaceOwner } from "@/lib/auth/permissions";
import { db } from "@/lib/db/prisma";
import DashboardLayout from "@/components/layout/dashboard-layout";
import MembersClient from "@/components/workspace/members-client";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect("/login");

  const [isMember, isOwner, workspace, members] = await Promise.all([
    isWorkspaceMember(session.user.id, workspaceId),
    isWorkspaceOwner(session.user.id, workspaceId),
    db.workspace.findUnique({ where: { id: workspaceId } }),
    db.membership.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!isMember || !workspace) redirect("/dashboard");

  return (
    <DashboardLayout workspaceId={workspaceId} navTitle="Members">
      <MembersClient
        workspaceId={workspaceId}
        members={members}
        currentUserId={session.user.id}
        isOwner={isOwner}
      />
    </DashboardLayout>
  );
}