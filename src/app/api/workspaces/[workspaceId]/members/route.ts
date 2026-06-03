import { db } from "@/lib/db/prisma";
import { inviteMemberSchema } from "@/lib/validations/member";
import { apiSuccess, apiError, apiHandler } from "@/lib/utils/api";
import { withAuth, withOwnerAuth } from "@/middleware/auth-middleware";
import { INVITATION_EXPIRY_DAYS } from "@/lib/constants";
import { sendEmail } from "@/lib/email/mailer";
import { invitationEmailTemplate } from "@/lib/email/templates";

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
    const { session, error } = await withOwnerAuth(request, workspaceId);
    if (error) return error;

    const body = await request.json();
    const validated = inviteMemberSchema.parse(body);

    const workspace = await db.workspace.findUnique({
      where: { id: workspaceId },
      select: { name: true },
    });

    const inviter = await db.user.findUnique({
      where: { id: session!.user!.id! },
      select: { name: true, email: true },
    });

    // Check if user already exists
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

      // User exists — add them directly
      const membership = await db.membership.create({
        data: {
          userId: existingUser.id,
          workspaceId,
          role: validated.role,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
      });

      // Send notification email
      const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/workspace/${workspaceId}/board`;
      sendEmail({
        to: validated.email,
        subject: `You've been added to ${workspace?.name} on ProjectFlow`,
        html: invitationEmailTemplate({
          invitedByName: inviter?.name ?? inviter?.email ?? "Someone",
          workspaceName: workspace?.name ?? "a workspace",
          inviteLink,
          role: validated.role,
        }),
      }).catch((err) => console.error("[EMAIL_ERROR]", err));

      return apiSuccess(membership, 201);
    }

    // User doesn't exist — create invitation token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITATION_EXPIRY_DAYS);

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

    const invitation = await db.invitation.create({
      data: {
        email: validated.email,
        workspaceId,
        role: validated.role,
        invitedById: session!.user!.id!,
        expiresAt,
      },
    });

    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/invitations/${invitation.token}`;

    // Send invitation email — non-blocking
    sendEmail({
      to: validated.email,
      subject: `You've been invited to ${workspace?.name} on ProjectFlow`,
      html: invitationEmailTemplate({
        invitedByName: inviter?.name ?? inviter?.email ?? "Someone",
        workspaceName: workspace?.name ?? "a workspace",
        inviteLink,
        role: validated.role,
      }),
    }).catch((err) => console.error("[EMAIL_ERROR]", err));

    return apiSuccess(
      {
        message: `Invitation sent to ${validated.email}`,
        inviteLink,
      },
      201
    );
  });
}