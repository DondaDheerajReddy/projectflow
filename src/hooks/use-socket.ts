"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { useBoardStore } from "@/store/board-store";
import type { TaskStatus } from "@/store/board-store";

let socket: Socket | null = null;

// ── Emit helpers — call these from components after API success ───────────────
export function emitTaskMoved(payload: {
  taskId: string;
  status: TaskStatus;
  position: string;
  movedBy: string;
}) {
  socket?.emit("task-moved", payload);
}

export function emitTaskCreated(task: any) {
  socket?.emit("task-created", { task });
}

export function emitTaskDeleted(taskId: string, status: TaskStatus) {
  socket?.emit("task-deleted", { taskId, status });
}

export function useSocket(workspaceId: string, currentUserId: string) {
  const { board, setBoard, addTask, removeTask } = useBoardStore();
  const boardRef = useRef(board);

  useEffect(() => {
    boardRef.current = board;
  }, [board]);

  useEffect(() => {
    if (!workspaceId || !currentUserId) return;

    socket = io(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000", {
      path: "/socket.io",
      autoConnect: false,
    });

    const joinWorkspace = () => {
      socket?.emit("join-workspace", workspaceId);
    };

    socket.on("connect", () => {
      console.log("[socket] connected:", socket?.id);
      joinWorkspace();
    });

    socket.on("reconnect", () => {
      joinWorkspace();
    });

    socket.on("task-moved", ({ taskId, status, position, movedBy }: {
      taskId: string;
      status: TaskStatus;
      position: string;
      movedBy: string;
    }) => {
      if (movedBy === currentUserId) return;

      const currentBoard = boardRef.current;
      let task = null;
      let fromStatus: TaskStatus | null = null;

      for (const s of Object.keys(currentBoard) as TaskStatus[]) {
        const found = currentBoard[s].find((t) => t.id === taskId);
        if (found) { task = found; fromStatus = s; break; }
      }

      if (!task || !fromStatus) return;

      const newBoard = { ...currentBoard };
      newBoard[fromStatus] = newBoard[fromStatus].filter((t) => t.id !== taskId);
      const updatedTask = { ...task, status, position };
      const targetColumn = [...newBoard[status]];
      const insertIndex = targetColumn.findIndex((t) => t.position > position);
      if (insertIndex === -1) targetColumn.push(updatedTask);
      else targetColumn.splice(insertIndex, 0, updatedTask);
      newBoard[status] = targetColumn;
      setBoard(newBoard);
    });

    socket.on("task-created", ({ task }: { task: any }) => {
      if (task.createdById === currentUserId) return;
      addTask(task);
    });

    socket.on("task-deleted", ({ taskId, status }: { taskId: string; status: TaskStatus }) => {
      removeTask(taskId, status);
    });

    socket.on("connect_error", (err) => {
      console.error("[socket] connection error:", err.message);
    });

    socket.connect();

    return () => {
      socket?.emit("leave-workspace", workspaceId);
      socket?.disconnect();
      socket = null;
    };
  }, [workspaceId, currentUserId]);
}