import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import {
  deleteCategoryController,
  updateCategoryController,
} from "@/lib/backend/controller/categoryController";
import {
  categoryIdSchema,
  updateCategorySchema,
} from "@/lib/backend/validations/domainSchemas";

export const PATCH = withAuth(
  validate(updateCategorySchema, "body", updateCategoryController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);

export const DELETE = withAuth(
  validate(categoryIdSchema, "params", deleteCategoryController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
