import { db } from "@/lib/db/prisma";
import { updateProjectSchema } from "@/lib/validations/project";
import { apiSuccess, apiError, apiHandler } from "@/lib/utils/api";
import { withAuth, withOwnerAuth } from "@/middleware/auth-middleware";

// GET /api/workspaces/[workspaceId]/projects/[projectId]
export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId, projectId } = await params;
    const { error } = await withAuth(request, workspaceId);
    if (error) return error;

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
    });

    if (!project) return apiError("Project not found", 404);
    if (project.workspaceId !== workspaceId) return apiError("Project not found", 404);

    return apiSuccess(project);
  });
}

// PATCH /api/workspaces/[workspaceId]/projects/[projectId]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId, projectId } = await params;
    const { error } = await withOwnerAuth(request, workspaceId);
    if (error) return error;

    const body = await request.json();
    const validated = updateProjectSchema.parse(body);

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) return apiError("Project not found", 404);
    if (project.workspaceId !== workspaceId) return apiError("Project not found", 404);

    const updated = await db.project.update({
      where: { id: projectId },
      data: validated,
    });

    return apiSuccess(updated);
  });
}

// DELETE /api/workspaces/[workspaceId]/projects/[projectId]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; projectId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId, projectId } = await params;
    const { error } = await withOwnerAuth(request, workspaceId);
    if (error) return error;

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) return apiError("Project not found", 404);
    if (project.workspaceId !== workspaceId) return apiError("Project not found", 404);

    await db.project.delete({ where: { id: projectId } });

    return apiSuccess({ message: "Project deleted successfully" });
  });
}