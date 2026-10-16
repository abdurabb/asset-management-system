import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import {
  createMaintenanceController,
  getMaintenanceController,
} from "@/lib/backend/controller/maintenanceController";
import {
  createMaintenanceSchema,
  getMaintenanceSchema,
} from "@/lib/backend/validations/domainSchemas";

export const GET = withAuth(
  validate(getMaintenanceSchema, "query", getMaintenanceController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);

export const POST = withAuth(
  validate(createMaintenanceSchema, "body", createMaintenanceController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
