import { db } from "@/lib/db/prisma";
import { updateTaskSchema } from "@/lib/validations/task";
import { apiSuccess, apiError, apiHandler } from "@/lib/utils/api";
import { withAuth } from "@/middleware/auth-middleware";

// GET /api/workspaces/[workspaceId]/tasks/[taskId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; taskId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId, taskId } = await params;
    const { error } = await withAuth(request, workspaceId);
    if (error) return error;

    const task = await db.task.findUnique({
      where: { id: taskId },
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
    });

    if (!task) return apiError("Task not found", 404);
    if (task.workspaceId !== workspaceId) return apiError("Task not found", 404);

    return apiSuccess(task);
  });
}

// PATCH /api/workspaces/[workspaceId]/tasks/[taskId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; taskId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId, taskId } = await params;
    const { session, error } = await withAuth(request, workspaceId);
    if (error) return error;

    const body = await request.json();
    const validated = updateTaskSchema.parse(body);

    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task) return apiError("Task not found", 404);
    if (task.workspaceId !== workspaceId) return apiError("Task not found", 404);

    const updated = await db.task.update({
      where: { id: taskId },
      data: {
        ...validated,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : undefined,
      },
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
    });

    // Emit real-time event to all workspace members
    const io = (global as any).io;
    if (io) {
      io.to(`workspace:${workspaceId}`).emit("task-updated", {
        task: updated,
        updatedBy: session!.user!.id,
      });
    }

    // Async audit log — non-blocking
    db.auditLog
      .create({
        data: {
          action: "TASK_UPDATED",
          entityType: "task",
          entityId: taskId,
          workspaceId,
          userId: session!.user!.id!,
          metadata: {
            title: task.title,
            changes: validated,
          },
        },
      })
      .catch((err) => console.error("[AUDIT_LOG_ERROR]", err));

    return apiSuccess(updated);
  });
}

// DELETE /api/workspaces/[workspaceId]/tasks/[taskId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; taskId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId, taskId } = await params;
    const { error } = await withAuth(request, workspaceId);
    if (error) return error;

    const task = await db.task.findUnique({ where: { id: taskId } });
    if (!task) return apiError("Task not found", 404);
    if (task.workspaceId !== workspaceId) return apiError("Task not found", 404);

    await db.task.delete({ where: { id: taskId } });

    // Emit real-time event
    const io = (global as any).io;
    if (io) {
      io.to(`workspace:${workspaceId}`).emit("task-deleted", {
        taskId,
        status: task.status,
      });
    }

    return apiSuccess({ message: "Task deleted successfully" });
  });
}