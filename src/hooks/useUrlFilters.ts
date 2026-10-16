"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function useUrlFilters() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const get = useCallback(
    (key: string) => searchParams.get(key) ?? "",
    [searchParams],
  );

  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);

  const setFilters = useCallback(
    (updates: Record<string, string | number | null | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      let touchesFilter = false;

      for (const [key, value] of Object.entries(updates)) {
        if (key !== "page") touchesFilter = true;
        if (value === undefined || value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, String(value));
        }
      }

      if (touchesFilter && !Object.prototype.hasOwnProperty.call(updates, "page")) {
        params.delete("page");
      }

      const next = params.toString();
      const current = searchParams.toString();
      if (next === current) return;

      router.replace(next ? `${pathname}?${next}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  return { get, page, setFilters };
}

export function useDebouncedSearch(delay = 400) {
  const { get, setFilters } = useUrlFilters();
  const urlValue = get("search");
  const [value, setValueState] = useState(urlValue);
  const dirty = useRef(false);

  useEffect(() => {
    dirty.current = false;
    setValueState(urlValue);
  }, [urlValue]);

  useEffect(() => {
    if (!dirty.current || value === urlValue) return;

    const timer = window.setTimeout(() => {
      dirty.current = false;
      setFilters({ search: value });
    }, delay);

    return () => window.clearTimeout(timer);
  }, [value, urlValue, delay, setFilters]);

  const setValue = (next: string) => {
    dirty.current = true;
    setValueState(next);
  };

  return { value, setValue };
}
