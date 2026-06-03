"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import CreateProjectModal from "@/components/workspace/create-project-modal";

interface NavbarActionsProps {
  workspaceId: string;
}

export default function NavbarActions({ workspaceId }: NavbarActionsProps) {
  const [projectModalOpen, setProjectModalOpen] = useState(false);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setProjectModalOpen(true)}
      >
        <FolderPlus className="mr-2 h-4 w-4" />
        New Project
      </Button>

      <CreateProjectModal
        workspaceId={workspaceId}
        open={projectModalOpen}
        onOpenChange={setProjectModalOpen}
      />
    </>
  );
}