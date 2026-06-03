"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateWorkspace } from "@/hooks/use-workspace";
import { createWorkspaceSchema, CreateWorkspaceInput } from "@/lib/validations/workspace";
import { generateSlug } from "@/lib/utils/format";

interface CreateWorkspaceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CreateWorkspaceModal({
  open,
  onOpenChange,
}: CreateWorkspaceModalProps) {
  const router = useRouter();
  const { mutateAsync: createWorkspace, isPending } = useCreateWorkspace();
  const [slugEdited, setSlugEdited] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateWorkspaceInput>({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: { name: "", slug: "" },
  });

  const nameValue = watch("name");

  // Auto-generate slug from name unless user has manually edited it
  useEffect(() => {
    if (!slugEdited && nameValue) {
      setValue("slug", generateSlug(nameValue), { shouldValidate: true });
    }
  }, [nameValue, slugEdited, setValue]);

  const onSubmit = async (data: CreateWorkspaceInput) => {
    try {
      const workspace = await createWorkspace(data);
      toast.success("Workspace created!");
      reset();
      setSlugEdited(false);
      onOpenChange(false);
      router.push(`/workspace/${workspace.id}/board`);
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "Failed to create workspace");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create Workspace</DialogTitle>
          <DialogDescription>
            A workspace is a shared space for your team to manage projects and tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="name">Workspace Name</Label>
            <Input
              id="name"
              placeholder="Acme Inc."
              {...register("name")}
              disabled={isPending}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <Label htmlFor="slug">
              Slug
              <span className="ml-1 text-xs text-muted-foreground">(URL identifier)</span>
            </Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">projectflow.app/</span>
              <Input
                id="slug"
                placeholder="acme-inc"
                {...register("slug")}
                disabled={isPending}
                onChange={(e) => {
                  setSlugEdited(true);
                  register("slug").onChange(e);
                }}
              />
            </div>
            {errors.slug && (
              <p className="text-xs text-destructive">{errors.slug.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Workspace
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}