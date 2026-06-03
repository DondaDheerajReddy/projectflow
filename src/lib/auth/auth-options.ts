import { auth } from "./auth";
import { db } from "@/lib/db/prisma";
import { redirect } from "next/navigation";

/**
 * Get the current session — use this in server components and route handlers.
 * Redirects to /login if not authenticated.
 */
export async function getRequiredSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

/**
 * Get the current session without redirecting.
 * Returns null if not authenticated.
 */
export async function getSession() {
  return await auth();
}

/**
 * Get the full user from DB using the session.
 * Use when you need fields beyond what's in the session (e.g. createdAt).
 */
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  return db.user.findUnique({
    where: { id: session.user.id },
  });
}