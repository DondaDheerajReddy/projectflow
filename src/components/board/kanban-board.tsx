"use client";

import { useEffect, useRef, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import axios from "axios";
import toast from "react-hot-toast";
import TaskColumn from "./task-column";
import TaskCard from "./task-card";
import { useBoardStore } from "@/store/board-store";
import type { Task, TaskStatus, KanbanBoard } from "@/store/board-store";
import { useSocket } from "@/hooks/use-socket";
import { emitTaskMoved } from "@/hooks/use-socket";

const STATUSES: TaskStatus[] = [
  "BACKLOG",
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
];

interface KanbanBoardProps {
  workspaceId: string;
  currentUserId: string;
  initialBoard: KanbanBoard;
}

export default function KanbanBoard({ workspaceId, currentUserId, initialBoard }: KanbanBoardProps) {
  const { board, setBoard, moveTask } = useBoardStore();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  useSocket(workspaceId, currentUserId);

  // Initialize board with server data
  useEffect(() => {
    setBoard(initialBoard);
  }, [initialBoard, setBoard]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Require 8px movement before drag starts — prevents accidental drags
        distance: 8,
      },
    })
  );

  const onDragStart = (event: DragStartEvent) => {
    const task = event.active.data.current?.task as Task;
    if (task) setActiveTask(task);
  };

  const onDragEnd = async (event: DragEndEvent) => {
  setActiveTask(null);

  const { active, over } = event;
  if (!over) return;

  const activeTask = active.data.current?.task as Task;
  if (!activeTask) return;

  const overType = over.data.current?.type;
  const toStatus: TaskStatus =
    overType === "Column"
      ? (over.data.current?.status as TaskStatus)
      : (over.data.current?.task?.status as TaskStatus);

  if (!toStatus) return;

  const targetColumn = board[toStatus];
  let newIndex = targetColumn.length;

  if (overType === "Task") {
    const overIndex = targetColumn.findIndex((t) => t.id === over.id);
    if (overIndex !== -1) newIndex = overIndex;
  }

  if (
    activeTask.status === toStatus &&
    targetColumn.findIndex((t) => t.id === activeTask.id) === newIndex
  ) {
    return;
  }

  const { position, revert } = moveTask(
    activeTask.id,
    activeTask.status,
    toStatus,
    newIndex
  );

  try {
    await axios.patch(
      `/api/workspaces/${workspaceId}/tasks/${activeTask.id}/move`,
      { status: toStatus, position }
    );

    // Emit socket event from client after successful server update
    emitTaskMoved({
      taskId: activeTask.id,
      status: toStatus,
      position,
      movedBy: currentUserId,
    });
  } catch {
    revert();
    toast.error("Failed to move task");
  }
};

  const onDragOver = (event: DragOverEvent) => {
    // Visual feedback handled by dnd-kit — no extra logic needed
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
    >
      <div className="flex h-full gap-4 overflow-x-auto pb-4">
        {STATUSES.map((status) => (
          <TaskColumn
            key={status}
            status={status}
            tasks={board[status] ?? []}
          />
        ))}
      </div>

      {/* Drag overlay — shows a rotated card while dragging */}
      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} isOverlay />}
      </DragOverlay>
    </DndContext>
  );
}