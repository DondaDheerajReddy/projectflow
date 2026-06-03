import { db } from "@/lib/db/prisma";
import { updateWorkspaceSchema } from "@/lib/validations/workspace";
import { apiSuccess, apiError, apiHandler } from "@/lib/utils/api";
import { withAuth, withOwnerAuth } from "@/middleware/auth-middleware";

// GET /api/workspaces/[workspaceId] — get a single workspace
export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId } = await params;
    const { session, error } = await withAuth(request, workspaceId);
    if (error) return error;

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        _count: {
          select: {
            memberships: true,
            projects: true,
          },
        },
      },
    });

    if (!workspace) return apiError("Workspace not found", 404);

    return apiSuccess(workspace);
  });
}

// PATCH /api/workspaces/[workspaceId] — update workspace (owner only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId } = await params;
    const { session, error } = await withOwnerAuth(request, workspaceId);
    if (error) return error;

    const body = await request.json();
    const validated = updateWorkspaceSchema.parse(body);

    // Check slug uniqueness if slug is being updated
    if (validated.slug) {
      const existing = await db.workspace.findFirst({
        where: {
          slug: validated.slug,
          NOT: { id: workspaceId },
        },
      });
      if (existing) return apiError("Slug is already taken", 409);
    }

    const workspace = await db.workspace.update({
      where: { id: workspaceId },
      data: validated,
    });

    return apiSuccess(workspace);
  });
}

// DELETE /api/workspaces/[workspaceId] — delete workspace (owner only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId } = await params;
    const { error } = await withOwnerAuth(request, workspaceId);
    if (error) return error;

    await db.workspace.delete({ where: { id: workspaceId } });

    return apiSuccess({ message: "Workspace deleted successfully" });
  });
}