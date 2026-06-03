"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Calendar, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUiStore } from "@/store/ui-store";
import { Task } from "@/store/board-store";
import { formatDate, getInitials } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

const PRIORITY_STYLES = {
  LOW: "border-l-slate-400",
  MEDIUM: "border-l-blue-400",
  HIGH: "border-l-amber-400",
  URGENT: "border-l-red-500",
};

const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

interface TaskCardProps {
  task: Task;
  isOverlay?: boolean;
}

export default function TaskCard({ task, isOverlay }: TaskCardProps) {
  const openTaskDetail = useUiStore((s) => s.openTaskDetail);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
    data: { type: "Task", task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => openTaskDetail(task.id)}
      className={cn(
        "group cursor-pointer rounded-lg border border-border bg-card p-3 shadow-sm transition-shadow hover:shadow-md",
        "border-l-4",
        PRIORITY_STYLES[task.priority],
        isDragging && "opacity-50 ring-2 ring-primary",
        isOverlay && "rotate-2 shadow-xl"
      )}
    >
      {/* Title */}
      <p className="text-sm font-medium text-foreground line-clamp-2">
        {task.title}
      </p>

      {/* Project */}
      {task.project && (
        <p className="mt-1 text-xs text-muted-foreground">
          {task.project.name}
        </p>
      )}

      {/* Footer */}
      <div className="mt-3 flex items-center justify-between">
        {/* Due date */}
        {task.dueDate ? (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(task.dueDate)}
          </span>
        ) : (
          <span />
        )}

        {/* Assignee */}
        {task.assignee ? (
          <Avatar className="h-5 w-5">
            <AvatarImage src={task.assignee.image ?? ""} />
            <AvatarFallback className="text-[9px]">
              {getInitials(task.assignee.name ?? task.assignee.email)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <User className="h-4 w-4 text-muted-foreground/40" />
        )}
      </div>

      {/* Priority label */}
      <div className="mt-2">
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {PRIORITY_LABELS[task.priority]}
        </span>
      </div>
    </div>
  );
}