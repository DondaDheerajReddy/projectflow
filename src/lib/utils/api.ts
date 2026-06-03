import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard success response
 */
export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/**
 * Standard error response
 */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/**
 * Handle Zod validation errors — returns field-level messages
 */
export function apiValidationError(error: ZodError) {
  const messages = error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
  return NextResponse.json({ error: messages }, { status: 422 });
}

/**
 * Wrap an API route handler with standard error handling.
 * Usage: return apiHandler(async () => { ... })
 */
export async function apiHandler(
  fn: () => Promise<NextResponse>
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof ZodError) {
      return apiValidationError(error);
    }
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return apiError("Unauthorized", 401);
      }
      if (error.message === "FORBIDDEN") {
        return apiError("Forbidden", 403);
      }
      if (error.message === "NOT_FOUND") {
        return apiError("Not found", 404);
      }
    }
    console.error("[API_ERROR]", error);
    return apiError("Internal server error", 500);
  }
}