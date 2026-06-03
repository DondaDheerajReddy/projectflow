import { db } from "@/lib/db/prisma";
import { createTaskSchema } from "@/lib/validations/task";
import { apiSuccess, apiError, apiHandler } from "@/lib/utils/api";
import { withAuth } from "@/middleware/auth-middleware";
import { generatePositionBetween } from "@/lib/utils/fractional-index";

// GET /api/workspaces/[workspaceId]/tasks — fetch all tasks grouped by status
export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId } = await params;
    const { error } = await withAuth(request, workspaceId);
    if (error) return error;

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

    // Group by status
    const grouped = {
      BACKLOG: [] as typeof tasks,
      TODO: [] as typeof tasks,
      IN_PROGRESS: [] as typeof tasks,
      REVIEW: [] as typeof tasks,
      COMPLETED: [] as typeof tasks,
    };

    for (const task of tasks) {
      grouped[task.status].push(task);
    }

    return apiSuccess(grouped);
  });
}

// POST /api/workspaces/[workspaceId]/tasks — create a task
export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId } = await params;
    const { session, error } = await withAuth(request, workspaceId);
    if (error) return error;

    const body = await request.json();
    const validated = createTaskSchema.parse(body);

    // Verify project belongs to workspace
    const project = await db.project.findUnique({
      where: { id: validated.projectId },
    });
    if (!project || project.workspaceId !== workspaceId) {
      return apiError("Project not found", 404);
    }

    // Get the last task in the target column to generate position after it
    const lastTask = await db.task.findFirst({
      where: { workspaceId, status: validated.status },
      orderBy: { position: "desc" },
      select: { position: true },
    });

    // Generate position after the last task in the column
    const position = generatePositionBetween(lastTask?.position ?? null, null);

    const task = await db.task.create({
      data: {
        title: validated.title,
        description: validated.description,
        status: validated.status,
        priority: validated.priority,
        position,
        workspaceId,
        projectId: validated.projectId,
        assigneeId: validated.assigneeId,
        createdById: session!.user!.id!,
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
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

    // Emit real-time event
    const io = (global as any).io;
    if (io) {
      io.to(`workspace:${workspaceId}`).emit("task-created", {
        task,
      });
    }

    return apiSuccess(task, 201);
  });
}