import { db } from "@/lib/db/prisma";
import { apiSuccess, apiError, apiHandler } from "@/lib/utils/api";
import { withAuth } from "@/middleware/auth-middleware";
import { AUDIT_LOG_PAGE_SIZE } from "@/lib/constants";

// GET /api/workspaces/[workspaceId]/audit-log
export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId } = await params;
    const { error } = await withAuth(request, workspaceId);
    if (error) return error;

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const action = searchParams.get("action") ?? undefined;

    const skip = (page - 1) * AUDIT_LOG_PAGE_SIZE;

    const [logs, total] = await Promise.all([
      db.auditLog.findMany({
        where: {
          workspaceId,
          ...(action ? { action: action as any } : {}),
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: AUDIT_LOG_PAGE_SIZE,
      }),
      db.auditLog.count({
        where: {
          workspaceId,
          ...(action ? { action: action as any } : {}),
        },
      }),
    ]);

    return apiSuccess({
      logs,
      total,
      page,
      pageSize: AUDIT_LOG_PAGE_SIZE,
      totalPages: Math.ceil(total / AUDIT_LOG_PAGE_SIZE),
      hasMore: skip + logs.length < total,
    });
  });
}