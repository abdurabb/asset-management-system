"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";
import type {
  AppUser,
  CreateUserPayload,
  UpdateUserPayload,
} from "@/types/user";
import type {
  Asset,
  Assignment,
  Category,
  CreateAssetPayload,
  CreateAssignmentPayload,
  CreateCategoryPayload,
  CreateDocumentPayload,
  CreateMaintenancePayload,
  DashboardStats,
  DocumentItem,
  AuditLogItem,
  MaintenanceRecord,
  UpdateAssetPayload,
  UpdateCategoryPayload,
  UpdateMaintenancePayload,
  Company,
} from "@/types/asset";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async (): Promise<DashboardStats> => {
      const res = await api.get("/dashboard");
      return res.data.data;
    },
  });
}

export function useUsers(params?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ["users", params],
    enabled: params !== undefined,
    queryFn: async (): Promise<AppUser[]> => {
      const res = await api.get("/users", { params });
      return res.data.data;
    },
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateUserPayload) => {
      const res = await api.post("/users", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      showToast.success("User created");
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateUserPayload;
    }) => {
      const res = await api.patch(`/users/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      showToast.success("User updated");
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/users/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["users"] });
      showToast.success("User deactivated");
    },
  });
}

export function useAssets(params?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ["assets", params],
    queryFn: async (): Promise<Asset[]> => {
      const res = await api.get("/assets", { params });
      return res.data.data;
    },
  });
}

export function useCreateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAssetPayload) => {
      const res = await api.post("/assets", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      showToast.success("Asset created");
    },
  });
}

export function useUpdateAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAssetPayload;
    }) => {
      const res = await api.patch(`/assets/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      showToast.success("Asset updated");
    },
  });
}

export function useDeleteAsset() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/assets/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      showToast.success("Asset retired");
    },
  });
}

export function useAssetQr(assetId: string | null) {
  return useQuery({
    queryKey: ["asset-qr", assetId],
    enabled: Boolean(assetId),
    queryFn: async () => {
      const res = await api.get(`/assets/${assetId}/qr`);
      return res.data.data as {
        assetId: string;
        assetTag: string;
        name: string;
        qrToken: string;
        scanUrl: string;
        qrDataUrl: string;
      };
    },
  });
}

export function useCategories(params?: { isActive?: boolean; search?: string }) {
  return useQuery({
    queryKey: ["categories", params],
    queryFn: async (): Promise<Category[]> => {
      const res = await api.get("/categories", {
        params: { limit: 100, ...params },
      });
      return res.data.data;
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateCategoryPayload) => {
      const res = await api.post("/categories", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      showToast.success("Category created");
    },
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCategoryPayload;
    }) => {
      const res = await api.patch(`/categories/${id}`, data);
      return res.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["categories"] }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/categories/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      showToast.success("Category deactivated");
    },
  });
}

export function useAssignments(
  params?: Record<string, string | number | boolean | undefined>,
) {
  return useQuery({
    queryKey: ["assignments", params],
    queryFn: async (): Promise<Assignment[]> => {
      const res = await api.get("/assignments", { params });
      return res.data.data;
    },
  });
}

export function useCreateAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateAssignmentPayload) => {
      const res = await api.post("/assignments", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      showToast.success("Asset assigned");
    },
  });
}

export function useReturnAssignment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.post(`/assignments/${id}/return`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["assignments"] });
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      showToast.success("Asset returned");
    },
  });
}

export function useMaintenance(
  params?: Record<string, string | number | undefined>,
) {
  return useQuery({
    queryKey: ["maintenance", params],
    queryFn: async (): Promise<MaintenanceRecord[]> => {
      const res = await api.get("/maintenance", { params });
      return res.data.data;
    },
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMaintenancePayload) => {
      const res = await api.post("/maintenance", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      showToast.success("Maintenance record created");
    },
  });
}

export function useUpdateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMaintenancePayload;
    }) => {
      const res = await api.patch(`/maintenance/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance"] });
      qc.invalidateQueries({ queryKey: ["assets"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      showToast.success("Maintenance updated");
    },
  });
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: async (): Promise<DocumentItem[]> => {
      const res = await api.get("/documents");
      return res.data.data;
    },
  });
}

export function useCreateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateDocumentPayload) => {
      const res = await api.post("/documents", payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      showToast.success("Document saved");
    },
  });
}

export function useDeleteDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/documents/${id}`);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["documents"] });
      showToast.success("Document removed");
    },
  });
}

export function useAuditLogs() {
  return useQuery({
    queryKey: ["audit-logs"],
    queryFn: async (): Promise<AuditLogItem[]> => {
      const res = await api.get("/audit-logs");
      return res.data.data;
    },
  });
}

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const res = await api.get("/reports");
      return res.data.data;
    },
  });
}

export function useCompany() {
  return useQuery({
    queryKey: ["company"],
    queryFn: async (): Promise<Company> => {
      const res = await api.get("/company");
      return res.data.data;
    },
  });
}

export function useUpdateCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<Company>) => {
      const res = await api.patch("/company", data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company"] });
      showToast.success("Company updated");
    },
  });
}
