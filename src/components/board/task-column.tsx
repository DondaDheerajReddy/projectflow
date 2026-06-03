"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import TaskCard from "./task-card";
import { Task, TaskStatus } from "@/store/board-store";
import { useUiStore } from "@/store/ui-store";
import { cn } from "@/lib/utils";

const COLUMN_STYLES: Record<TaskStatus, { dot: string; header: string }> = {
  BACKLOG: { dot: "bg-slate-400", header: "text-slate-600 dark:text-slate-400" },
  TODO: { dot: "bg-blue-400", header: "text-blue-600 dark:text-blue-400" },
  IN_PROGRESS: { dot: "bg-amber-400", header: "text-amber-600 dark:text-amber-400" },
  REVIEW: { dot: "bg-purple-400", header: "text-purple-600 dark:text-purple-400" },
  COMPLETED: { dot: "bg-emerald-400", header: "text-emerald-600 dark:text-emerald-400" },
};

const COLUMN_LABELS: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  REVIEW: "Review",
  COMPLETED: "Completed",
};

interface TaskColumnProps {
  status: TaskStatus;
  tasks: Task[];
}

export default function TaskColumn({ status, tasks }: TaskColumnProps) {
  const openCreateTask = useUiStore((s) => s.openCreateTask);
  const styles = COLUMN_STYLES[status];

  const { setNodeRef, isOver } = useDroppable({
    id: status,
    data: { type: "Column", status },
  });

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-muted/40 border border-border">
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", styles.dot)} />
          <h3 className={cn("text-sm font-semibold", styles.header)}>
            {COLUMN_LABELS[status]}
          </h3>
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={() => openCreateTask(status)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Tasks */}
      <SortableContext
        items={tasks.map((t) => t.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          ref={setNodeRef}
          className={cn(
            "flex flex-1 flex-col gap-2 overflow-y-auto p-2 transition-colors min-h-20",
            isOver && "bg-primary/5"
          )}
        >
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>
      </SortableContext>
    </div>
  );
}