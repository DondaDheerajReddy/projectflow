import { db } from "@/lib/db/prisma";
import { moveTaskSchema } from "@/lib/validations/task";
import { apiSuccess, apiError, apiHandler } from "@/lib/utils/api";
import { withAuth } from "@/middleware/auth-middleware";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; taskId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId, taskId } = await params;
    const { session, error } = await withAuth(request, workspaceId);
    if (error) return error;

    const body = await request.json();
    const validated = moveTaskSchema.parse(body);

    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task) return apiError("Task not found", 404);
    if (task.workspaceId !== workspaceId) return apiError("Task not found", 404);

    const updated = await db.task.update({
      where: { id: taskId },
      data: {
        status: validated.status,
        position: validated.position,
      },
    });

    // Emit real-time event to all workspace members
    // Interview talking point:
    //   "The Socket.IO server is attached to global so any API route can
    //    emit events. The Redis adapter ensures all server instances
    //    broadcast to the correct clients."
    const io = (global as any).io;
    if (io) {
      io.to(`workspace:${workspaceId}`).emit("task-moved", {
        taskId,
        status: validated.status,
        position: validated.position,
        movedBy: session!.user!.id,
      });
    }

    // Async audit log — non-blocking
    db.auditLog
      .create({
        data: {
          action: "TASK_MOVED",
          entityType: "task",
          entityId: taskId,
          workspaceId,
          userId: session!.user!.id!,
          metadata: {
            from: task.status,
            to: validated.status,
            title: task.title,
          },
        },
      })
      .catch((err) => console.error("[AUDIT_LOG_ERROR]", err));

    return apiSuccess(updated);
  });
}