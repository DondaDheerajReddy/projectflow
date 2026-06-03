export const APP_NAME = "ProjectFlow";

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  ERROR: "/error",
  WORKSPACE: (id: string) => `/workspace/${id}`,
  WORKSPACE_BOARD: (id: string) => `/workspace/${id}/board`,
  WORKSPACE_MEMBERS: (id: string) => `/workspace/${id}/members`,
  WORKSPACE_SETTINGS: (id: string) => `/workspace/${id}/settings`,
  WORKSPACE_AUDIT: (id: string) => `/workspace/${id}/audit-log`,
} as const;

export const API_ROUTES = {
  WORKSPACES: "/api/workspaces",
  WORKSPACE: (id: string) => `/api/workspaces/${id}`,
  WORKSPACE_MEMBERS: (id: string) => `/api/workspaces/${id}/members`,
  WORKSPACE_PROJECTS: (id: string) => `/api/workspaces/${id}/projects`,
  WORKSPACE_TASKS: (id: string) => `/api/workspaces/${id}/tasks`,
} as const;

export const ROLE_LABELS = { OWNER: "Owner", MEMBER: "Member" } as const;

export const PRIORITY_LABELS = {
  LOW: "Low", MEDIUM: "Medium", HIGH: "High", URGENT: "Urgent",
} as const;

export const KANBAN_COLUMNS = [
  { status: "BACKLOG",     label: "Backlog",      color: "bg-slate-500"   },
  { status: "TODO",        label: "To Do",         color: "bg-blue-500"    },
  { status: "IN_PROGRESS", label: "In Progress",   color: "bg-amber-500"   },
  { status: "REVIEW",      label: "Review",        color: "bg-purple-500"  },
  { status: "COMPLETED",   label: "Completed",     color: "bg-emerald-500" },
] as const;

export const INVITATION_EXPIRY_DAYS = 7;
export const DEFAULT_PAGE_SIZE = 20;
export const AUDIT_LOG_PAGE_SIZE = 50;