import axios from "axios";

import { store } from "@/redux/store";
import { logout, updateTokens } from "@/redux/slice/authSlice";
import { showToast } from "@/lib/toast";
import { navigateTo } from "@/lib/navigation";

export const api = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const state = store.getState();
    const accessToken = state.auth.accessToken;

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

type RetryConfig = {
  _retry?: boolean;
  url?: string;
};

let refreshPromise: Promise<boolean> | null = null;

async function refreshSession(): Promise<boolean> {
  const refreshToken = store.getState().auth.refreshToken;
  if (!refreshToken) return false;

  try {
    const response = await axios.post("/api/auth/refresh", {
      refresh_token: refreshToken,
    });

    store.dispatch(
      updateTokens({
        accessToken: response.data.access_token,
        refreshToken: response.data.refresh_token,
      }),
    );

    return true;
  } catch {
    return false;
  }
}

function isAuthRoute(url?: string) {
  return Boolean(url && (url.includes("/auth/login") || url.includes("/auth/refresh")));
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const message =
      error.response?.data?.message ||
      "Something went wrong. Please try again.";
    const original = error.config as RetryConfig | undefined;

    if (status === 401 && original && !original._retry && !isAuthRoute(original.url)) {
      original._retry = true;

      if (!refreshPromise) {
        refreshPromise = refreshSession().finally(() => {
          refreshPromise = null;
        });
      }

      const refreshed = await refreshPromise;
      if (refreshed) {
        return api(original);
      }

      store.dispatch(logout());
      void fetch("/api/auth/logout", { method: "POST" });
      navigateTo("/");
      showToast.error("Your session has expired. Please login again.");
      return Promise.reject(error);
    }

    if (status === 401 && isAuthRoute(original?.url)) {
      showToast.error(message || "Invalid credentials");
      return Promise.reject(error);
    }

    if (status === 403) {
      showToast.error(message || "You do not have permission for this action.");
      return Promise.reject(error);
    }

    if (status !== 401) {
      showToast.error(message || "Something went wrong");
    }

    return Promise.reject(error);
  },
);
