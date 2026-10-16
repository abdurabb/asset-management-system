"use client";

import { useQuery } from "@tanstack/react-query";

import { api } from "@/lib/api";

export const LIST_PAGE_SIZE = 10;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PageResult<T> = {
  items: T[];
  pagination: PaginationMeta;
};

export function usePagedList<T>(
  key: string,
  url: string,
  params: Record<string, string | number | boolean | undefined>,
) {
  return useQuery({
    queryKey: [key, "list", params],
    queryFn: async (): Promise<PageResult<T>> => {
      const res = await api.get(url, {
        params: Object.fromEntries(
          Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
        ),
      });

      const items = (res.data.data ?? []) as T[];
      const pagination = (res.data.pagination ?? {
        page: 1,
        limit: Number(params.limit) || LIST_PAGE_SIZE,
        total: items.length,
        totalPages: items.length ? 1 : 0,
      }) as PaginationMeta;

      return { items, pagination };
    },
  });
}
