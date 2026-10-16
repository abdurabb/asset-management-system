import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import {
  createAssetController,
  getAssetsController,
} from "@/lib/backend/controller/assetController";
import {
  createAssetSchema,
  getAssetsSchema,
} from "@/lib/backend/validations/domainSchemas";

export const GET = withAuth(
  validate(getAssetsSchema, "query", getAssetsController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"],
);

export const POST = withAuth(
  validate(createAssetSchema, "body", createAssetController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
