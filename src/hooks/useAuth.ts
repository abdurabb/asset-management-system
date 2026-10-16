"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";

import { login } from "@/redux/slice/authSlice";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";

import type { LoginPayload, AuthResponse } from "@/types/auth";

export const useLogin = () => {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();

  return useMutation({
    mutationFn: async (payload: LoginPayload): Promise<AuthResponse> => {
      const res = await api.post("/auth/login", payload);
      return res.data;
    },

    onSuccess: (data) => {
      dispatch(
        login({
          accessToken: data.access_token,
          refreshToken: data.refresh_token,
          userId: data?.user?.id,
          name: data?.user?.name,
          email: data?.user?.email,
          role: data?.user?.role,
          officeId: data?.user?.officeId,
        }),
      );

      queryClient.invalidateQueries({
        queryKey: ["auth", "me"],
      });
      showToast.success("Welcome back");
    },
  });
};
