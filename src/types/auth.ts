export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  officeId?: string | null;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type AuthResponse = {
  access_token: string;
  refresh_token: string;
  user?: AuthUser | undefined;
};
