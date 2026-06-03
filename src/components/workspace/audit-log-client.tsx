"use client";

import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getInitials, formatRelativeTime } from "@/lib/utils/format";
import { AUDIT_LOG_PAGE_SIZE } from "@/lib/constants";

interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  workspaceId: string;
  userId: string;
  metadata: any;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}

interface AuditLogClientProps {
  workspaceId: string;
  initialLogs: AuditLog[];
  total: number;
}

const ACTION_STYLES: Record<string, { label: string; className: string }> = {
  TASK_CREATED: {
    label: "Task Created",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  TASK_MOVED: {
    label: "Task Moved",
    className: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  },
  TASK_UPDATED: {
    label: "Task Updated",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  TASK_DELETED: {
    label: "Task Deleted",
    className: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
  MEMBER_INVITED: {
    label: "Member Invited",
    className: "bg-purple-500/15 text-purple-600 dark:text-purple-400",
  },
  MEMBER_REMOVED: {
    label: "Member Removed",
    className: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
  WORKSPACE_UPDATED: {
    label: "Workspace Updated",
    className: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
  },
  PROJECT_CREATED: {
    label: "Project Created",
    className: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  },
  PROJECT_UPDATED: {
    label: "Project Updated",
    className: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  },
  PROJECT_DELETED: {
    label: "Project Deleted",
    className: "bg-red-500/15 text-red-600 dark:text-red-400",
  },
};

function getMetadataDescription(action: string, metadata: any): string {
  if (!metadata) return "";

  switch (action) {
    case "TASK_MOVED":
      return `from ${formatStatus(metadata.from)} → ${formatStatus(metadata.to)}`;
    case "TASK_CREATED":
    case "TASK_UPDATED":
    case "TASK_DELETED":
      return metadata.title ? `"${metadata.title}"` : "";
    default:
      return "";
  }
}

function formatStatus(status: string): string {
  return status
    .split("_")
    .map((w: string) => w[0] + w.slice(1).toLowerCase())
    .join(" ");
}

function AuditLogSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 py-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-5 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function AuditLogClient({
  workspaceId,
  initialLogs,
  total,
}: AuditLogClientProps) {
  const [page, setPage] = useState(1);
  const [allLogs, setAllLogs] = useState<AuditLog[]>(initialLogs);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const totalPages = Math.ceil(total / AUDIT_LOG_PAGE_SIZE);
  const hasMore = page < totalPages;

  const loadMore = async () => {
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const { data } = await axios.get(
        `/api/workspaces/${workspaceId}/audit-log?page=${nextPage}`
      );
      setAllLogs((prev) => [...prev, ...data.data.logs]);
      setPage(nextPage);
    } catch (error) {
      console.error("Failed to load more logs", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Audit Log</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {total} event{total !== 1 ? "s" : ""} recorded
        </p>
      </div>

      {/* Log list */}
      {allLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-border py-16 text-center">
          <p className="text-sm font-medium text-foreground">No activity yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Actions like moving tasks and inviting members will appear here.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card">
          <div className="divide-y divide-border">
            {allLogs.map((log) => {
              const actionStyle =
                ACTION_STYLES[log.action] ?? {
                  label: log.action,
                  className:
                    "bg-slate-500/15 text-slate-600 dark:text-slate-400",
                };
              const description = getMetadataDescription(
                log.action,
                log.metadata
              );

              return (
                <div
                  key={log.id}
                  className="flex items-start gap-4 px-4 py-3"
                >
                  {/* User avatar */}
                  <Avatar className="mt-0.5 h-8 w-8 shrink-0">
                    <AvatarImage src={log.user.image ?? ""} />
                    <AvatarFallback className="text-xs">
                      {getInitials(log.user.name ?? log.user.email)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground">
                      <span className="font-medium">
                        {log.user.name ?? log.user.email}
                      </span>
                      {description && (
                        <span className="ml-1 text-muted-foreground">
                          {description}
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatRelativeTime(log.createdAt)}
                    </p>
                  </div>

                  {/* Action badge */}
                  <span
                    className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${actionStyle.className}`}
                  >
                    {actionStyle.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="border-t border-border px-4 py-3 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMore}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}