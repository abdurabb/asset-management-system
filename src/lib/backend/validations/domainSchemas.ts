import Joi from "joi";
import { USER_ROLES, ASSET_STATUSES, MAINTENANCE_STATUSES } from "@/lib/constants/roles";

export const createUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string()
    .valid(...USER_ROLES)
    .required(),
  officeId: Joi.string().trim().allow(null, ""),
  description: Joi.string().trim().max(500).allow("", null),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  email: Joi.string().trim().email(),
  password: Joi.string().min(6).max(100),
  role: Joi.string().valid(...USER_ROLES),
  officeId: Joi.string().trim().allow(null, ""),
  description: Joi.string().trim().max(500).allow("", null),
  isActive: Joi.boolean(),
}).min(1);

export const userIdSchema = Joi.object({
  id: Joi.string().trim().required(),
});

export const getUsersSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow(""),
  role: Joi.string().valid(...USER_ROLES),
  officeId: Joi.string().trim(),
  isActive: Joi.boolean(),
});

export const createCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  description: Joi.string().trim().max(500).allow("", null),
});

export const updateCategorySchema = Joi.object({
  name: Joi.string().trim().min(2).max(100),
  description: Joi.string().trim().max(500).allow("", null),
  isActive: Joi.boolean(),
}).min(1);

export const categoryIdSchema = Joi.object({
  id: Joi.string().trim().required(),
});

export const getCategoriesSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  search: Joi.string().trim().max(100).allow(""),
  isActive: Joi.boolean(),
});

export const createAssetSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150).required(),
  assetTag: Joi.string().trim().uppercase().min(2).max(50),
  serialNumber: Joi.string().trim().max(100).allow("", null),
  description: Joi.string().trim().max(1000).allow("", null),
  purchaseDate: Joi.date().iso().allow(null),
  purchaseCost: Joi.number().min(0).allow(null),
  location: Joi.string().trim().max(200).allow("", null),
  officeId: Joi.string().trim().required(),
  categoryId: Joi.string().trim().allow("", null),
});

export const updateAssetSchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  serialNumber: Joi.string().trim().max(100).allow("", null),
  description: Joi.string().trim().max(1000).allow("", null),
  status: Joi.string().valid(...ASSET_STATUSES),
  purchaseDate: Joi.date().iso().allow(null),
  purchaseCost: Joi.number().min(0).allow(null),
  location: Joi.string().trim().max(200).allow("", null),
  officeId: Joi.string().trim(),
  categoryId: Joi.string().trim().allow("", null),
  isActive: Joi.boolean(),
}).min(1);

export const assetIdSchema = Joi.object({
  id: Joi.string().trim().required(),
});

export const getAssetsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow(""),
  officeId: Joi.string().trim(),
  categoryId: Joi.string().trim(),
  status: Joi.string().valid(...ASSET_STATUSES),
  isActive: Joi.boolean(),
});

export const createAssignmentSchema = Joi.object({
  assetId: Joi.string().trim().required(),
  userId: Joi.string().trim().uuid().required(),
  notes: Joi.string().trim().max(500).allow("", null),
});

export const assignmentIdSchema = Joi.object({
  id: Joi.string().trim().required(),
});

export const getAssignmentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow(""),
  officeId: Joi.string().trim(),
  userId: Joi.string().trim().uuid(),
  assetId: Joi.string().trim(),
  isActive: Joi.boolean(),
});

export const createMaintenanceSchema = Joi.object({
  assetId: Joi.string().trim().required(),
  title: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().max(1000).allow("", null),
  scheduledAt: Joi.date().iso().allow(null),
  cost: Joi.number().min(0).allow(null),
  performedBy: Joi.string().trim().max(100).allow("", null),
});

export const updateMaintenanceSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150),
  description: Joi.string().trim().max(1000).allow("", null),
  status: Joi.string().valid(...MAINTENANCE_STATUSES),
  cost: Joi.number().min(0).allow(null),
  scheduledAt: Joi.date().iso().allow(null),
  completedAt: Joi.date().iso().allow(null),
  performedBy: Joi.string().trim().max(100).allow("", null),
}).min(1);

export const maintenanceIdSchema = Joi.object({
  id: Joi.string().trim().required(),
});

export const getMaintenanceSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().trim().max(100).allow(""),
  officeId: Joi.string().trim(),
  assetId: Joi.string().trim(),
  status: Joi.string().valid(...MAINTENANCE_STATUSES),
});

export const createDocumentSchema = Joi.object({
  title: Joi.string().trim().min(2).max(150).required(),
  description: Joi.string().trim().max(1000).allow("", null),
  fileUrl: Joi.string().trim().uri().allow("", null),
  fileType: Joi.string().trim().max(50).allow("", null),
  officeId: Joi.string().trim().allow("", null),
  assetId: Joi.string().trim().allow("", null),
});

export const documentIdSchema = Joi.object({
  id: Joi.string().trim().required(),
});

export const getDocumentsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  officeId: Joi.string().trim(),
  assetId: Joi.string().trim(),
  search: Joi.string().trim().max(100).allow(""),
});

export const getAuditLogsSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(30),
  entityType: Joi.string().trim().max(50),
  action: Joi.string().trim().max(50),
  search: Joi.string().trim().max(100).allow(""),
});

export const updateCompanySchema = Joi.object({
  name: Joi.string().trim().min(2).max(150),
  description: Joi.string().trim().max(500).allow("", null),
  address: Joi.string().trim().max(500).allow("", null),
  phone: Joi.string().trim().max(30).allow("", null),
}).min(1);
