import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import {
  getCompanyController,
  updateCompanyController,
} from "@/lib/backend/controller/miscController";
import { updateCompanySchema } from "@/lib/backend/validations/domainSchemas";

export const GET = withAuth(getCompanyController);

export const PATCH = withAuth(
  validate(updateCompanySchema, "body", updateCompanyController),
  ["SUPER_ADMIN", "MANAGER"],
);
