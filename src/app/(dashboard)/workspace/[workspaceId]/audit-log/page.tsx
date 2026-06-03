import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { isWorkspaceMember } from "@/lib/auth/permissions";
import { db } from "@/lib/db/prisma";
import DashboardLayout from "@/components/layout/dashboard-layout";
import AuditLogClient from "@/components/workspace/audit-log-client";
import { AUDIT_LOG_PAGE_SIZE } from "@/lib/constants";

export default async function AuditLogPage({
  params,
}: {
  params: Promise<{ workspaceId: string }>;
}) {
  const { workspaceId } = await params;
  const session = await auth();

  if (!session?.user?.id) redirect("/login");

  const [isMember, workspace] = await Promise.all([
    isWorkspaceMember(session.user.id, workspaceId),
    db.workspace.findUnique({ where: { id: workspaceId } }),
  ]);

  if (!isMember || !workspace) redirect("/dashboard");

  // Fetch first page server-side
  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: AUDIT_LOG_PAGE_SIZE,
    }),
    db.auditLog.count({ where: { workspaceId } }),
  ]);

  return (
    <DashboardLayout workspaceId={workspaceId} navTitle="Audit Log">
      <AuditLogClient
        workspaceId={workspaceId}
        initialLogs={logs as any}
        total={total}
      />
    </DashboardLayout>
  );
}