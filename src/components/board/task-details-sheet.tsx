"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Loader2, Trash2 } from "lucide-react";
import axios from "axios";
import { Sheet, SheetContent } from "@/components/ui/sheet";
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
import type { Task } from "@/store/board-store";
import { updateTaskSchema, UpdateTaskInput } from "@/lib/validations/task";
import { formatDate } from "@/lib/utils/format";
import { emitTaskDeleted } from "@/hooks/use-socket";

interface TaskDetailsSheetProps {
  workspaceId: string;
}

export default function TaskDetailsSheet({ workspaceId }: TaskDetailsSheetProps) {
  const { selectedTaskId, closeTaskDetail } = useUiStore();
  const { board, updateTask, removeTask } = useBoardStore();
  const [isDeleting, setIsDeleting] = useState(false);

  // Find task across all columns
  const task: Task | null =
    selectedTaskId
      ? Object.values(board)
          .flat()
          .find((t) => t.id === selectedTaskId) ?? null
      : null;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UpdateTaskInput>({
    resolver: zodResolver(updateTaskSchema),
  });

  useEffect(() => {
    if (task) {
      reset({
        title: task.title,
        description: task.description ?? "",
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate
          ? new Date(task.dueDate).toISOString().split("T")[0]
          : undefined,
      });
    }
  }, [task, reset]);

  const onSave = async (data: UpdateTaskInput) => {
    if (!task) return;
    try {
      const response = await axios.patch(
        `/api/workspaces/${workspaceId}/tasks/${task.id}`,
        data
      );
      updateTask(task.id, response.data.data);
      toast.success("Task updated");
      closeTaskDetail();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "Failed to update task");
    }
  };

  const onDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    try {
      await axios.delete(
        `/api/workspaces/${workspaceId}/tasks/${task.id}`
      );
      removeTask(task.id, task.status);
      emitTaskDeleted(task.id, task.status);
      toast.success("Task deleted");
      closeTaskDetail();
    } catch (error: any) {
      toast.error(error?.response?.data?.error ?? "Failed to delete task");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Sheet open={!!selectedTaskId} onOpenChange={(open) => !open && closeTaskDetail()}>
      <SheetContent>
        {task ? (
          <form onSubmit={handleSubmit(onSave)} className="space-y-5 p-6">
            {/* Meta */}
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Created {formatDate(task.createdAt)} by{" "}
                {task.createdBy?.name ?? "Unknown"}
              </p>
              {task.project && (
                <p className="text-xs text-muted-foreground">
                  Project: {task.project.name}
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" {...register("title")} disabled={isSubmitting} />
              {errors.title && (
                <p className="text-xs text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                rows={4}
                placeholder="Add a description..."
                {...register("description")}
                disabled={isSubmitting}
              />
            </div>

            {/* Priority + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Priority</Label>
                <Select
                  defaultValue={task.priority}
                  onValueChange={(val) => setValue("priority", val as any, { shouldDirty: true })}
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
                  defaultValue={task.status}
                  onValueChange={(val) => setValue("status", val as any, { shouldDirty: true })}
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
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
                disabled={isDeleting || isSubmitting}
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Delete
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closeTaskDetail}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !isDirty}
                >
                  {isSubmitting && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Task not found</p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}