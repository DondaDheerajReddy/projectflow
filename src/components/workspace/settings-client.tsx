"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateWorkspace, useDeleteWorkspace } from "@/hooks/use-workspace";
import { updateWorkspaceSchema, UpdateWorkspaceInput } from "@/lib/validations/workspace";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

interface SettingsClientProps {
  workspace: Workspace;
  isOwner: boolean;
}

export default function SettingsClient({ workspace, isOwner }: SettingsClientProps) {
  const router = useRouter();
  const { mutateAsync: updateWorkspace, isPending: isUpdating } = useUpdateWorkspace(workspace.id);
  const { mutateAsync: deleteWorkspace, isPending: isDeleting } = useDeleteWorkspace();
  const [deleteConfirm, setDeleteConfirm] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateWorkspaceInput>({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      name: workspace.name,
      slug: workspace.slug,
    },
  });

  const onUpdate = async (data: UpdateWorkspaceInput) => {
    try {
      await updateWorkspace(data);
      toast.success("Workspace updated");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "Failed to update workspace");
    }
  };

  const onDelete = async () => {
    if (deleteConfirm !== workspace.name) {
      toast.error("Workspace name does not match");
      return;
    }
    try {
      await deleteWorkspace(workspace.id);
      toast.success("Workspace deleted");
      router.push("/dashboard");
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "Failed to delete workspace");
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* General settings */}
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>Update your workspace name and slug.</CardDescription>
        </CardHeader>
        <CardContent>
          {isOwner ? (
            <form onSubmit={handleSubmit(onUpdate)} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Workspace Name</Label>
                <Input
                  id="name"
                  {...register("name")}
                  disabled={isUpdating}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  {...register("slug")}
                  disabled={isUpdating}
                />
                {errors.slug && (
                  <p className="text-xs text-destructive">{errors.slug.message}</p>
                )}
              </div>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-foreground">{workspace.name}</p>
              <p className="text-xs text-muted-foreground">/{workspace.slug}</p>
              <p className="text-xs text-muted-foreground">
                Only workspace owners can edit settings.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Danger zone */}
      {isOwner && (
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Permanently delete this workspace and all its data. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="confirm">
                Type <span className="font-semibold">{workspace.name}</span> to confirm
              </Label>
              <Input
                id="confirm"
                placeholder={workspace.name}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                disabled={isDeleting}
              />
            </div>
            <Button
              variant="destructive"
              onClick={onDelete}
              disabled={isDeleting || deleteConfirm !== workspace.name}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Workspace
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}