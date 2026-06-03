"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { CreateTaskInput, MoveTaskInput, UpdateTaskInput } from "@/lib/validations/task";

function tasksKey(workspaceId: string) {
  return ["tasks", workspaceId];
}

async function fetchTasks(workspaceId: string) {
  const { data } = await axios.get(`/api/workspaces/${workspaceId}/tasks`);
  return data.data;
}

export function useTasks(workspaceId: string) {
  return useQuery({
    queryKey: tasksKey(workspaceId),
    queryFn: () => fetchTasks(workspaceId),
    enabled: !!workspaceId,
  });
}

export function useCreateTask(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const { data } = await axios.post(
        `/api/workspaces/${workspaceId}/tasks`,
        input
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKey(workspaceId) });
    },
  });
}

export function useUpdateTask(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, input }: { taskId: string; input: UpdateTaskInput }) => {
      const { data } = await axios.patch(
        `/api/workspaces/${workspaceId}/tasks/${taskId}`,
        input
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKey(workspaceId) });
    },
  });
}

export function useMoveTask(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, input }: { taskId: string; input: MoveTaskInput }) => {
      const { data } = await axios.patch(
        `/api/workspaces/${workspaceId}/tasks/${taskId}/move`,
        input
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKey(workspaceId) });
    },
  });
}

export function useDeleteTask(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      await axios.delete(`/api/workspaces/${workspaceId}/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: tasksKey(workspaceId) });
    },
  });
}