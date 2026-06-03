import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db/prisma";

export default async function InvitationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await auth();

  // Not logged in — redirect to login then come back
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/invitations/${token}`);
  }

  const invitation = await db.invitation.findUnique({
    where: { token },
    include: {
      workspace: { select: { id: true, name: true } },
      invitedBy: { select: { name: true, email: true } },
    },
  });

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Invalid Invitation</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invitation link is invalid or has already been used.
          </p>
        </div>
      </div>
    );
  }

  if (invitation.expiresAt < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <h1 className="text-xl font-semibold text-foreground">Invitation Expired</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This invitation has expired. Ask the workspace owner to send a new one.
          </p>
        </div>
      </div>
    );
  }

  // Accept the invitation server-side
  try {
    // Check already a member
    const existingMembership = await db.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId: session.user.id,
          workspaceId: invitation.workspaceId,
        },
      },
    });

    if (!existingMembership) {
      await db.$transaction(async (tx) => {
        await tx.membership.create({
          data: {
            userId: session.user.id,
            workspaceId: invitation.workspaceId,
            role: invitation.role,
          },
        });
        await tx.invitation.delete({ where: { token } });
      });
    }
  } catch (err) {
    console.error("[INVITATION_ACCEPT_ERROR]", err);
  }

  redirect(`/workspace/${invitation.workspaceId}/board`);
}