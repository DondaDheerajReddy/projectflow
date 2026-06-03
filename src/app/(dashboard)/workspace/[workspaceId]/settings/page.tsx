import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isWorkspaceOwner, isWorkspaceMember } from "@/lib/auth/permissions";
import { db } from "@/lib/db/prisma";
import DashboardLayout from "@/components/layout/dashboard-layout";
import SettingsClient from "@/components/workspace/settings-client";

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect("/login");

  const [isMember, isOwner, workspace] = await Promise.all([
    isWorkspaceMember(session.user.id, workspaceId),
    isWorkspaceOwner(session.user.id, workspaceId),
    db.workspace.findUnique({ where: { id: workspaceId } }),
  ]);

  if (!isMember || !workspace) redirect("/dashboard");

  return (
    <DashboardLayout workspaceId={workspaceId} navTitle="Settings">
      <SettingsClient
        workspace={workspace}
        isOwner={isOwner}
      />
    </DashboardLayout>
  );
}