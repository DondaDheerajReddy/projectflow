import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/prisma";
import { isWorkspaceMember } from "@/lib/auth/permissions";
import DashboardLayout from "@/components/layout/dashboard-layout";
import KanbanBoard from "@/components/board/kanban-board";
import CreateTaskModal from "@/components/board/create-task-modal";
import TaskDetailsSheet from "@/components/board/task-details-sheet";

export default async function BoardPage({
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

  const tasks = await db.task.findMany({
    where: { workspaceId },
    include: {
      assignee: {
        select: { id: true, name: true, email: true, image: true },
      },
      createdBy: {
        select: { id: true, name: true, email: true, image: true },
      },
      project: {
        select: { id: true, name: true },
      },
    },
    orderBy: { position: "asc" },
  });

  const initialBoard = {
    BACKLOG: tasks.filter((t) => t.status === "BACKLOG"),
    TODO: tasks.filter((t) => t.status === "TODO"),
    IN_PROGRESS: tasks.filter((t) => t.status === "IN_PROGRESS"),
    REVIEW: tasks.filter((t) => t.status === "REVIEW"),
    COMPLETED: tasks.filter((t) => t.status === "COMPLETED"),
  };

  return (
    <DashboardLayout workspaceId={workspaceId} navTitle="Board">
      <KanbanBoard
        workspaceId={workspaceId}
        currentUserId={session.user.id}
        initialBoard={initialBoard as any}
      />
      <CreateTaskModal workspaceId={workspaceId} />
      <TaskDetailsSheet workspaceId={workspaceId} />
    </DashboardLayout>
  );
}