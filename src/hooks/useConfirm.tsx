"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import ConfirmDialog, { type ConfirmTone } from "@/components/ui/ConfirmDialog";

export type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  action?: () => Promise<unknown> | unknown;
};

type PendingConfirm = ConfirmOptions & {
  resolve: (accepted: boolean) => void;
};

export function useConfirm() {
  const [pending, setPending] = useState<PendingConfirm | null>(null);
  const [loading, setLoading] = useState(false);
  const pendingRef = useRef<PendingConfirm | null>(null);
  const loadingRef = useRef(false);

  const settle = useCallback((accepted: boolean) => {
    pendingRef.current?.resolve(accepted);
    pendingRef.current = null;
    loadingRef.current = false;
    setPending(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    return () => {
      pendingRef.current?.resolve(false);
      pendingRef.current = null;
    };
  }, []);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      if (pendingRef.current) {
        pendingRef.current.resolve(false);
      }

      const next: PendingConfirm = { ...options, resolve };
      pendingRef.current = next;
      setLoading(false);
      setPending(next);
    });
  }, []);

  const handleConfirm = useCallback(async () => {
    const current = pendingRef.current;
    if (!current || loadingRef.current) return;

    if (!current.action) {
      settle(true);
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    try {
      await current.action();
      settle(true);
    } catch {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [settle]);

  const dialog = (
    <ConfirmDialog
      open={pending !== null}
      title={pending?.title ?? ""}
      description={pending?.description}
      confirmLabel={pending?.confirmLabel}
      cancelLabel={pending?.cancelLabel}
      tone={pending?.tone}
      loading={loading}
      onCancel={() => {
        if (!loading) settle(false);
      }}
      onConfirm={() => {
        void handleConfirm();
      }}
    />
  );

  return { confirm, dialog };
}
