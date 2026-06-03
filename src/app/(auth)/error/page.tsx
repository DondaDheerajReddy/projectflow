"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  const errorMessages: Record<string, string> = {
    Configuration: "There is a problem with the server configuration.",
    AccessDenied: "You do not have permission to sign in.",
    Verification: "The verification link has expired or has already been used.",
    Default: "An error occurred while signing in.",
  };

  const message = errorMessages[error ?? "Default"] ?? errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-8 shadow-sm text-center">
        <h1 className="text-xl font-semibold text-foreground">
          Authentication Error
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{message}</p>
        {error && (
          <p className="mt-1 text-xs text-muted-foreground">
            Error code: <span className="font-mono">{error}</span>
          </p>
        )}
        <Button asChild className="mt-6 w-full">
          <Link href="/login">Back to Login</Link>
        </Button>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense>
      <ErrorContent />
    </Suspense>
  );
}