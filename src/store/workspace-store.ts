import { create } from "zustand";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface WorkspaceStore {
  workspaces: Workspace[];
  currentWorkspaceId: string | null;
  setWorkspaces: (workspaces: Workspace[]) => void;
  setCurrentWorkspace: (id: string) => void;
}

export const useWorkspaceStore = create<WorkspaceStore>((set) => ({
  workspaces: [],
  currentWorkspaceId: null,
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (id) => set({ currentWorkspaceId: id }),
}));