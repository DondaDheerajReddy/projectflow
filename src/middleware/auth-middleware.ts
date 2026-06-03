import { auth } from "@/lib/auth/auth";
import { isWorkspaceMember, isWorkspaceOwner } from "@/lib/auth/permissions";
import { NextResponse } from "next/server";

/**
 * Use this at the top of every API route handler.
 * Returns the session if valid, or a 401/403 response.
 *
 * Usage in a route handler:
 *   const { session, error } = await withAuth(request, workspaceId);
 *   if (error) return error;
 */
export async function withAuth(
  request: Request,
  workspaceId?: string
) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      session: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (workspaceId) {
    const isMember = await isWorkspaceMember(session.user.id, workspaceId);
    if (!isMember) {
      return {
        session: null,
        error: NextResponse.json(
          { error: "You are not a member of this workspace" },
          { status: 403 }
        ),
      };
    }
  }

  return { session, error: null };
}

/**
 * Same as withAuth but also checks for OWNER role.
 */
export async function withOwnerAuth(
  request: Request,
  workspaceId: string
) {
  const { session, error } = await withAuth(request, workspaceId);
  if (error) return { session: null, error };

  const isOwner = await isWorkspaceOwner(session!.user.id, workspaceId);
  if (!isOwner) {
    return {
      session: null,
      error: NextResponse.json(
        { error: "Only workspace owners can perform this action" },
        { status: 403 }
      ),
    };
  }

  return { session, error: null };
}