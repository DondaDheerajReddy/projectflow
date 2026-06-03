import { create } from "zustand";

interface UiStore {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Task detail sheet
  selectedTaskId: string | null;
  openTaskDetail: (taskId: string) => void;
  closeTaskDetail: () => void;

  // Create task modal
  createTaskStatus: string | null; // which column the modal was opened from
  openCreateTask: (status: string) => void;
  closeCreateTask: () => void;
}

export const useUiStore = create<UiStore>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  selectedTaskId: null,
  openTaskDetail: (taskId) => set({ selectedTaskId: taskId }),
  closeTaskDetail: () => set({ selectedTaskId: null }),

  createTaskStatus: null,
  openCreateTask: (status) => set({ createTaskStatus: status }),
  closeCreateTask: () => set({ createTaskStatus: null }),
}));