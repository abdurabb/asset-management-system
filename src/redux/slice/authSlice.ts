import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  userId: string | null;
  name: string | null;
  email: string | null;
  role: string | null;
  officeId: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  userId: null,
  name: null,
  email: null,
  role: null,
  officeId: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
        userId?: string | null;
        name?: string | null;
        email?: string | null;
        role?: string | null;
        officeId?: string | null;
      }>,
    ) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.userId = action.payload.userId ?? null;
      state.name = action.payload.name ?? null;
      state.email = action.payload.email ?? null;
      state.role = action.payload.role ?? null;
      state.officeId = action.payload.officeId ?? null;
    },

    updateTokens: (
      state,
      action: PayloadAction<{
        accessToken: string;
        refreshToken: string;
      }>,
    ) => {
      state.isAuthenticated = true;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
    },

    logout: (state) => {
      state.isAuthenticated = false;
      state.accessToken = null;
      state.refreshToken = null;
      state.userId = null;
      state.name = null;
      state.email = null;
      state.role = null;
      state.officeId = null;
    },
  },
});

export const { login, updateTokens, logout } = authSlice.actions;
export default authSlice.reducer;
