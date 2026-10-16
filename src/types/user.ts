import { UserOneRole } from "@/lib/constants/roles";

export interface User {
  userId: string;
  role: UserOneRole;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    officeId: string | null;
    isActive: boolean;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
  };
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserOneRole;
  officeId: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  office?: {
    id: string;
    name: string;
    code: string;
  } | null;
}

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: UserOneRole;
  officeId?: string | null;
  description?: string | null;
};

export type UpdateUserPayload = {
  name?: string;
  email?: string;
  password?: string;
  role?: UserOneRole;
  officeId?: string | null;
  description?: string | null;
  isActive?: boolean;
};
