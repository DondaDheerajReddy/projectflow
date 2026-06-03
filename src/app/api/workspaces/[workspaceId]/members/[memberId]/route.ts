import { db } from "@/lib/db/prisma";
import { apiSuccess, apiError, apiHandler } from "@/lib/utils/api";
import { withAuth, withOwnerAuth } from "@/middleware/auth-middleware";

// DELETE /api/workspaces/[workspaceId]/members/[memberId] — remove a member
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId, memberId } = await params;
    const { session, error } = await withOwnerAuth(request, workspaceId);
    if (error) return error;

    const membership = await db.membership.findUnique({
      where: { id: memberId },
    });

    if (!membership) return apiError("Member not found", 404);
    if (membership.workspaceId !== workspaceId) return apiError("Member not found", 404);

    // Prevent owner from removing themselves
    if (membership.userId === session!.user!.id) {
      return apiError("You cannot remove yourself from the workspace", 400);
    }

    await db.membership.delete({ where: { id: memberId } });

    return apiSuccess({ message: "Member removed successfully" });
  });
}

// PATCH /api/workspaces/[workspaceId]/members/[memberId] — update member role
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string; memberId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId, memberId } = await params;
    const { session, error } = await withOwnerAuth(request, workspaceId);
    if (error) return error;

    const body = await request.json();
    const { role } = body;

    if (!["OWNER", "MEMBER"].includes(role)) {
      return apiError("Invalid role", 400);
    }

    const membership = await db.membership.findUnique({
      where: { id: memberId },
    });

    if (!membership) return apiError("Member not found", 404);
    if (membership.workspaceId !== workspaceId) return apiError("Member not found", 404);

    // Prevent changing own role
    if (membership.userId === session!.user!.id) {
      return apiError("You cannot change your own role", 400);
    }

    const updated = await db.membership.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return apiSuccess(updated);
  });
}