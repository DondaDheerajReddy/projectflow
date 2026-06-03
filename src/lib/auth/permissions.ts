import { db } from "@/lib/db/prisma";

export async function isWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const membership = await db.membership.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
  });
  return !!membership;
}

export async function isWorkspaceOwner(
  userId: string,
  workspaceId: string
): Promise<boolean> {
  const membership = await db.membership.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
  });
  return membership?.role === "OWNER";
}

export async function getWorkspaceMembership(
  userId: string,
  workspaceId: string
) {
  return db.membership.findUnique({
    where: {
      userId_workspaceId: { userId, workspaceId },
    },
  });
}

export async function requireWorkspaceMember(
  userId: string,
  workspaceId: string
) {
  const isMember = await isWorkspaceMember(userId, workspaceId);
  if (!isMember) {
    throw new Error("UNAUTHORIZED");
  }
}

export async function requireWorkspaceOwner(
  userId: string,
  workspaceId: string
) {
  const isOwner = await isWorkspaceOwner(userId, workspaceId);
  if (!isOwner) {
    throw new Error("FORBIDDEN");
  }
}