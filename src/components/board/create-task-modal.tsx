"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Loader2 } from "lucide-react";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUiStore } from "@/store/ui-store";
import { useBoardStore } from "@/store/board-store";
import type { TaskStatus } from "@/store/board-store";
import { createTaskSchema, CreateTaskInput } from "@/lib/validations/task";
import { useQuery } from "@tanstack/react-query";
import { emitTaskCreated } from "@/hooks/use-socket";

interface CreateTaskModalProps {
  workspaceId: string;
}

export default function CreateTaskModal({ workspaceId }: CreateTaskModalProps) {
  const { createTaskStatus, closeCreateTask } = useUiStore();
  const addTask = useBoardStore((s) => s.addTask);
  const isOpen = !!createTaskStatus;

  // Fetch projects for selector
  const { data: projectsData } = useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      const { data } = await axios.get(
        `/api/workspaces/${workspaceId}/projects`
      );
      return data.data;
    },
    enabled: isOpen,
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      status: (createTaskStatus as TaskStatus) ?? "BACKLOG",
      priority: "MEDIUM",
    },
  });

  useEffect(() => {
    if (createTaskStatus) {
      setValue("status", createTaskStatus as TaskStatus);
    }
  }, [createTaskStatus, setValue]);

  const onSubmit = async (data: CreateTaskInput) => {
    try {
      const response = await axios.post(
        `/api/workspaces/${workspaceId}/tasks`,
        data
      );
      addTask(response.data.data);
      emitTaskCreated(response.data.data);
      toast.success("Task created");
      reset();
      closeCreateTask();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "Failed to create task");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeCreateTask()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit, (errors) => console.log("Form errors:", errors))} className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Task title"
              {...register("title")}
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Optional description"
              {...register("description")}
              disabled={isSubmitting}
            />
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <Label>Project</Label>
            <Select
              onValueChange={(val) => setValue("projectId", val)}
              disabled={isSubmitting}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projectsData?.length === 0 && (
                  <SelectItem value="no-projects" disabled>
                    No projects — create one first
                  </SelectItem>
                )}
                {projectsData?.filter((project: any) => !!project.id).map((project: any) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.projectId && (
              <p className="text-xs text-destructive">{errors.projectId.message}</p>
            )}
          </div>

          {/* Priority + Status row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={watch("priority") ?? "MEDIUM"}
                onValueChange={(val) => setValue("priority", val as any)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={watch("status") ?? "BACKLOG"}
                onValueChange={(val) => setValue("status", val as any)}
                disabled={isSubmitting}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BACKLOG">Backlog</SelectItem>
                  <SelectItem value="TODO">To Do</SelectItem>
                  <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                  <SelectItem value="REVIEW">Review</SelectItem>
                  <SelectItem value="COMPLETED">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due date */}
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              {...register("dueDate")}
              disabled={isSubmitting}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeCreateTask}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}