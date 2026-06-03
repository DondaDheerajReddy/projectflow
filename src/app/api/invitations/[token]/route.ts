import { db } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { apiSuccess, apiError, apiHandler } from "@/lib/utils/api";

// GET /api/invitations/[token] — get invitation details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  return apiHandler(async () => {
    const { token } = await params;

    const invitation = await db.invitation.findUnique({
      where: { token },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true },
        },
        invitedBy: {
          select: { name: true, email: true, image: true },
        },
      },
    });

    if (!invitation) return apiError("Invitation not found", 404);
    if (invitation.expiresAt < new Date()) return apiError("Invitation has expired", 410);

    return apiSuccess(invitation);
  });
}

// POST /api/invitations/[token] — accept an invitation
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  return apiHandler(async () => {
    const { token } = await params;
    const session = await auth();

    if (!session?.user?.id) return apiError("Unauthorized", 401);

    const invitation = await db.invitation.findUnique({
      where: { token },
    });

    if (!invitation) return apiError("Invitation not found", 404);
    if (invitation.expiresAt < new Date()) return apiError("Invitation has expired", 410);

    // Check email matches
    if (invitation.email !== session.user.email) {
      return apiError("This invitation was sent to a different email address", 403);
    }

    // Check already a member
    const existingMembership = await db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: invitation.workspaceId,
        },
      },
    });

    if (existingMembership) {
      await db.invitation.delete({ where: { token } });
      return apiError("You are already a member of this workspace", 409);
    }

    // Create membership and delete invitation in a transaction
    const membership = await db.$transaction(async (tx) => {
      const m = await tx.membership.create({
        data: {
          userId: session.user.id,
          workspaceId: invitation.workspaceId,
          role: invitation.role,
        },
      });
      await tx.invitation.delete({ where: { token } });
      return m;
    });

    return apiSuccess({
      membership,
      workspaceId: invitation.workspaceId,
    });
  });
}