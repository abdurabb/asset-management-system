import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import {
  deleteAssetController,
  getAssetController,
  updateAssetController,
} from "@/lib/backend/controller/assetController";
import {
  assetIdSchema,
  updateAssetSchema,
} from "@/lib/backend/validations/domainSchemas";

export const GET = withAuth(
  validate(assetIdSchema, "params", getAssetController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"],
);

export const PATCH = withAuth(
  validate(updateAssetSchema, "body", updateAssetController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);

export const DELETE = withAuth(
  validate(assetIdSchema, "params", deleteAssetController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
