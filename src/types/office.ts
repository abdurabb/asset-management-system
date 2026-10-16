export type Office = {
  id: string;
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateOfficePayload = {
  name: string;
  code: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
};

export type UpdateOfficePayload = CreateOfficePayload & {
  isActive: boolean;
};


export type CreateOfficeData = {
  name: string;
  code: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
};

export type UpdateOfficeData = {
  name?: string;
  code?: string;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  phone?: string | null;
  isActive?: boolean;
};