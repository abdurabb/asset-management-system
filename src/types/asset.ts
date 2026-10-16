export type AssetStatus =
  | "AVAILABLE"
  | "ASSIGNED"
  | "MAINTENANCE"
  | "RETIRED";

export type Asset = {
  id: string;
  name: string;
  assetTag: string;
  qrToken: string;
  serialNumber: string | null;
  description: string | null;
  status: AssetStatus | string;
  purchaseDate: string | null;
  purchaseCost: number | null;
  location: string | null;
  isActive: boolean;
  officeId: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
  office?: {
    id: string;
    name: string;
    code: string;
  };
  category?: {
    id: string;
    name: string;
  } | null;
  assignments?: Array<{
    id: string;
    isActive: boolean;
    user?: {
      id: string;
      name: string;
      email: string;
    };
  }>;
};

export type CreateAssetPayload = {
  name: string;
  assetTag?: string;
  serialNumber?: string;
  description?: string;
  purchaseDate?: string;
  purchaseCost?: number;
  location?: string;
  officeId: string;
  categoryId?: string;
};

export type UpdateAssetPayload = {
  name?: string;
  serialNumber?: string | null;
  description?: string | null;
  status?: AssetStatus;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  location?: string | null;
  officeId?: string;
  categoryId?: string | null;
  isActive?: boolean;
};

export type Category = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  _count?: { assets: number };
};

export type CreateCategoryPayload = {
  name: string;
  description?: string;
};

export type UpdateCategoryPayload = {
  name?: string;
  description?: string | null;
  isActive?: boolean;
};

export type Assignment = {
  id: string;
  assetId: string;
  userId: string;
  assignedById: string;
  officeId: string;
  notes: string | null;
  assignedAt: string;
  returnedAt: string | null;
  isActive: boolean;
  asset?: {
    id: string;
    name: string;
    assetTag: string;
    status: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
  assignedBy?: {
    id: string;
    name: string;
  };
  office?: {
    id: string;
    name: string;
  };
};

export type CreateAssignmentPayload = {
  assetId: string;
  userId: string;
  notes?: string;
};

export type MaintenanceRecord = {
  id: string;
  assetId: string;
  officeId: string;
  title: string;
  description: string | null;
  status: string;
  cost: number | null;
  scheduledAt: string | null;
  completedAt: string | null;
  performedBy: string | null;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  asset?: {
    id: string;
    name: string;
    assetTag: string;
  };
  office?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
  };
};

export type CreateMaintenancePayload = {
  assetId: string;
  title: string;
  description?: string;
  scheduledAt?: string;
  cost?: number;
  performedBy?: string;
};

export type UpdateMaintenancePayload = {
  title?: string;
  description?: string | null;
  status?: string;
  cost?: number | null;
  scheduledAt?: string | null;
  completedAt?: string | null;
  performedBy?: string | null;
};

export type DocumentItem = {
  id: string;
  title: string;
  description: string | null;
  fileUrl: string | null;
  fileType: string | null;
  companyId: string | null;
  officeId: string | null;
  assetId: string | null;
  uploadedById: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  uploadedBy?: { id: string; name: string };
  office?: { id: string; name: string } | null;
  asset?: { id: string; name: string; assetTag: string } | null;
};

export type CreateDocumentPayload = {
  title: string;
  description?: string;
  fileUrl?: string;
  fileType?: string;
  officeId?: string;
  assetId?: string;
};

export type AuditLogItem = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string | null;
  userId: string | null;
  createdAt: string;
  user?: { id: string; name: string; email: string } | null;
};

export type DashboardStats = {
  totalAssets: number;
  availableAssets: number;
  assignedAssets: number;
  maintenanceAssets: number;
  totalUsers: number;
  totalOffices: number;
  openMaintenance: number;
  activeAssignments: number;
};

export type Company = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  isActive: boolean;
};
