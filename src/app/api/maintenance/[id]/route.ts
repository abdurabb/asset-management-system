import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import { updateMaintenanceController } from "@/lib/backend/controller/maintenanceController";
import { updateMaintenanceSchema } from "@/lib/backend/validations/domainSchemas";

export const PATCH = withAuth(
  validate(updateMaintenanceSchema, "body", updateMaintenanceController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
