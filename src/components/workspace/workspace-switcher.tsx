"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Plus, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useWorkspaces } from "@/hooks/use-workspace";
import CreateWorkspaceModal from "./create-workspace-modal";
import { cn } from "@/lib/utils";

interface WorkspaceSwitcherProps {
  currentWorkspaceId: string;
}

export default function WorkspaceSwitcher({ currentWorkspaceId }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const { data: workspaces, isLoading } = useWorkspaces();
  const [createOpen, setCreateOpen] = useState(false);

  const currentWorkspace = workspaces?.find((w: any) => w.id === currentWorkspaceId);

  if (isLoading) {
    return (
      <div className="h-8 w-full animate-pulse rounded-md bg-muted" />
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between px-2 font-medium"
            size="sm"
          >
            <span className="truncate">
              {currentWorkspace?.name ?? "Select workspace"}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="start">
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Your Workspaces
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {workspaces?.map((workspace: any) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => router.push(`/workspace/${workspace.id}/board`)}
              className="cursor-pointer"
            >
              <span className="flex-1 truncate">{workspace.name}</span>
              {workspace.id === currentWorkspaceId && (
                <Check className="ml-2 h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setCreateOpen(true)}
            className="cursor-pointer text-primary focus:text-primary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CreateWorkspaceModal open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}