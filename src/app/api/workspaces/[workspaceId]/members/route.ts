import { db } from "@/lib/db/prisma";
import { inviteMemberSchema } from "@/lib/validations/member";
import { apiSuccess, apiError, apiHandler } from "@/lib/utils/api";
import { withAuth, withOwnerAuth } from "@/middleware/auth-middleware";
import { INVITATION_EXPIRY_DAYS } from "@/lib/constants";

// GET /api/workspaces/[workspaceId]/members — list all members
export async function GET(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId } = await params;
    const { error } = await withAuth(request, workspaceId);
    if (error) return error;

    const members = await db.membership.findMany({
      where: { workspaceId },
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
      orderBy: { createdAt: "asc" },
    });

    return apiSuccess(members);
  });
}

// POST /api/workspaces/[workspaceId]/members — invite a member
export async function POST(
  request: Request,
  { params }: { params: Promise<{ workspaceId: string }> }
) {
  return apiHandler(async () => {
    const { workspaceId } = await params;
    const { error } = await withOwnerAuth(request, workspaceId);
    if (error) return error;

    const body = await request.json();
    const validated = inviteMemberSchema.parse(body);

    // Check if user already exists and is already a member
    const existingUser = await db.user.findUnique({
      where: { email: validated.email },
    });

    if (existingUser) {
      const existingMembership = await db.membership.findUnique({
        where: {
          userId_workspaceId: {
            userId: existingUser.id,
            workspaceId,
          },
        },
      });
      if (existingMembership) {
        return apiError("User is already a member of this workspace", 409);
      }

      // User exists — add them directly as a member
      const membership = await db.membership.create({
        data: {
          userId: existingUser.id,
          workspaceId,
          role: validated.role,
        },
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

      return apiSuccess(membership, 201);
    }

    // User doesn't exist — create an invitation token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

    // Check for existing pending invitation
    const existingInvitation = await db.invitation.findUnique({
      where: {
        email_workspaceId: {
          email: validated.email,
          workspaceId,
        },
      },
    });

    if (existingInvitation) {
      return apiError("An invitation has already been sent to this email", 409);
    }

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    const session = await import("@/lib/auth/auth").then((m) => m.auth());

    const invitation = await db.invitation.create({
      data: {
        email: validated.email,
        workspaceId,
        role: validated.role,
        invitedById: session!.user!.id!,
        expiresAt,
      },
    });

    // In production you'd send an email here with the invite link:
    // `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${invitation.token}`
    // For now we return the token directly so you can test it
    return apiSuccess(
      {
        message: `Invitation created for ${validated.email}`,
        inviteLink: `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${invitation.token}`,
      },
      201
    );
  });
}