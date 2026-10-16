import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import {
  createCategoryController,
  getCategoriesController,
} from "@/lib/backend/controller/categoryController";
import {
  createCategorySchema,
  getCategoriesSchema,
} from "@/lib/backend/validations/domainSchemas";

export const GET = withAuth(
  validate(getCategoriesSchema, "query", getCategoriesController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"],
);

export const POST = withAuth(
  validate(createCategorySchema, "body", createCategoryController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
