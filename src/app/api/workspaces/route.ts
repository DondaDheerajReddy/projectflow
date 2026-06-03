import { db } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { createWorkspaceSchema } from "@/lib/validations/workspace";
import { apiSuccess, apiError, apiHandler } from "@/lib/utils/api";
import { generateSlug } from "@/lib/utils/format";

// GET /api/workspaces — list all workspaces the current user is a member of
export async function GET() {
  return apiHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const memberships = await db.membership.findMany({
      where: { userId: session.user.id },
      include: {
        workspace: true,
      },
      orderBy: { createdAt: "asc" },
    });

    const workspaces = memberships.map((m) => ({
      ...m.workspace,
      role: m.role,
    }));

    return apiSuccess(workspaces);
  });
}

// POST /api/workspaces — create a new workspace
export async function POST(request: Request) {
  return apiHandler(async () => {
    const session = await auth();
    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const body = await request.json();
    const validated = createWorkspaceSchema.parse(body);

    // Auto-generate slug if not provided or ensure uniqueness
    let slug = validated.slug ?? generateSlug(validated.name);

    // Check slug uniqueness
    const existing = await db.workspace.findUnique({ where: { slug } });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const workspace = await db.workspace.create({
      data: {
        name: validated.name,
        slug,
        ownerId: session.user.id,
        memberships: {
          create: {
            userId: session.user.id,
            role: "OWNER",
          },
        },
      },
    });

    return apiSuccess(workspace, 201);
  });
}