import { create } from "zustand";
import { generatePositionBetween } from "@/lib/utils/fractional-index";

// ─── Types ────────────────────────────────────────────────────────────────────

export type TaskStatus =
  | "BACKLOG"
  | "TODO"
  | "IN_PROGRESS"
  | "REVIEW"
  | "COMPLETED";

export interface TaskUser {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  position: string;
  workspaceId: string;
  projectId: string;
  assigneeId: string | null;
  createdById: string;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignee?: TaskUser | null;
  createdBy?: TaskUser;
  project?: { id: string; name: string };
}

export type KanbanBoard = Record<TaskStatus, Task[]>;

interface BoardStore {
  // State
  board: KanbanBoard;
  isLoading: boolean;
  error: string | null;

  // Actions
  setBoard: (board: KanbanBoard) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Optimistic task operations
  moveTask: (
    taskId: string,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    newIndex: number
  ) => { position: string; revert: () => void };

  addTask: (task: Task) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  removeTask: (taskId: string, status: TaskStatus) => void;
}

// ─── Initial board state ──────────────────────────────────────────────────────

const emptyBoard: KanbanBoard = {
  BACKLOG: [],
  TODO: [],
  IN_PROGRESS: [],
  REVIEW: [],
  COMPLETED: [],
};

// ─── Store ────────────────────────────────────────────────────────────────────

export const useBoardStore = create<BoardStore>((set, get) => ({
  board: emptyBoard,
  isLoading: false,
  error: null,

  setBoard: (board) => set({ board }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  /**
   * Optimistic move — updates the UI instantly and returns:
   * - position: the new fractional index to send to the server
   * - revert: call this if the server request fails
   *
   * Interview talking point:
   *   "We calculate the fractional index on the client before the server
   *    request so the UI updates immediately. If the server fails, we
   *    revert the store to the previous state."
   */
  moveTask: (taskId, fromStatus, toStatus, newIndex) => {
    const previousBoard = get().board;

    // Find the task
    const task = previousBoard[fromStatus].find((t) => t.id === taskId);
    if (!task) {
      return { position: "", revert: () => {} };
    }

    // Calculate new position using fractional indexing
    const targetColumn = previousBoard[toStatus].filter((t) => t.id !== taskId);
    const before = targetColumn[newIndex - 1]?.position ?? null;
    const after = targetColumn[newIndex]?.position ?? null;
    const position = generatePositionBetween(before, after);

    // Build new board optimistically
    const newBoard = { ...previousBoard };

    // Remove from source column
    newBoard[fromStatus] = newBoard[fromStatus].filter((t) => t.id !== taskId);

    // Insert into target column at correct index
    const updatedTask = { ...task, status: toStatus, position };
    const targetTasks = [...newBoard[toStatus].filter((t) => t.id !== taskId)];
    targetTasks.splice(newIndex, 0, updatedTask);
    newBoard[toStatus] = targetTasks;

    set({ board: newBoard });

    return {
      position,
      revert: () => set({ board: previousBoard }),
    };
  },

  addTask: (task) => {
    set((state) => ({
      board: {
        ...state.board,
        [task.status]: [...state.board[task.status], task],
      },
    }));
  },

  updateTask: (taskId, updates) => {
    set((state) => {
      const newBoard = { ...state.board };
      for (const status of Object.keys(newBoard) as TaskStatus[]) {
        newBoard[status] = newBoard[status].map((t) =>
          t.id === taskId ? { ...t, ...updates } : t
        );
      }
      return { board: newBoard };
    });
  },

  removeTask: (taskId, status) => {
    set((state) => ({
      board: {
        ...state.board,
        [status]: state.board[status].filter((t) => t.id !== taskId),
      },
    }));
  },
}));