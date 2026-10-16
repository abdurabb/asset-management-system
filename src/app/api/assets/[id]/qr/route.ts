import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import { getAssetQrController } from "@/lib/backend/controller/assetController";
import { assetIdSchema } from "@/lib/backend/validations/domainSchemas";

export const GET = withAuth(
  validate(assetIdSchema, "params", getAssetQrController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
