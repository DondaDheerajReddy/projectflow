import { db } from "@/lib/db/prisma";
import { createProjectSchema } from "@/lib/validations/project";
import { apiSuccess, apiError, apiHandler } from "@/lib/utils/api";
import { withAuth, withOwnerAuth } from "@/middleware/auth-middleware";

// GET /api/workspaces/[workspaceId]/projects — list all projects
export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId } = await params;
    const { error } = await withAuth(request, workspaceId);
    if (error) return error;

    const projects = await db.project.findMany({
      where: { workspaceId },
      include: {
        _count: {
          select: { tasks: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess(projects);
  });
}

// POST /api/workspaces/[workspaceId]/projects — create a project
export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId } = await params;
    const { error } = await withOwnerAuth(request, workspaceId);
    if (error) return error;

    const body = await request.json();
    const validated = createProjectSchema.parse(body);

    const project = await db.project.create({
      data: {
        ...validated,
        workspaceId,
      },
    });

    return apiSuccess(project, 201);
  });
}