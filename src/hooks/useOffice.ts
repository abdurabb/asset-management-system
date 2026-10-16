"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { useAppSelector } from "@/redux/hooks";

import type {
  Office,
  CreateOfficePayload,
  UpdateOfficePayload,
} from "@/types/office";

const OFFICE_QUERY_KEY = ["offices"];

function useCanFetch() {
  return useAppSelector((state) => state.auth.isAuthenticated);
}

export function useOffices() {
  return useQuery({
    queryKey: OFFICE_QUERY_KEY,
    enabled: useCanFetch(),
    queryFn: async (): Promise<Office[]> => {
      const response = await api.get("/offices", {
        params: { limit: 100, isActive: true },
      });

      return response.data.data;
    },
  });
}

export function useOfficeDirectory(params: {
  search?: string;
  page: number;
  limit: number;
  isActive?: boolean;
}) {
  return useQuery({
    queryKey: [...OFFICE_QUERY_KEY, "directory", params],
    enabled: useCanFetch(),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const response = await api.get("/offices", {
        params: Object.fromEntries(
          Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
        ),
      });

      return {
        items: (response.data.data ?? []) as Office[],
        pagination: response.data.pagination as {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        },
      };
    },
  });
}

export function useCreateOffice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: CreateOfficePayload,
    ) => {
      const response = await api.post(
        "/offices",
        payload,
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: OFFICE_QUERY_KEY,
      });
      showToast.success("Office created");
    },
  });
}

export function useUpdateOffice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateOfficePayload;
    }) => {
      const response = await api.patch(
        `/offices/${id}`,
        data,
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: OFFICE_QUERY_KEY,
      });
      showToast.success("Office updated");
    },
  });
}

export function useDeleteOffice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(
        `/offices/${id}`,
      );

      return response.data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: OFFICE_QUERY_KEY,
      });
      showToast.success("Office removed");
    },
  });
}