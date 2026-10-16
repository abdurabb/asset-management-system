import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import {
  deleteUserController,
  updateUserController,
} from "@/lib/backend/controller/userController";
import {
  updateUserSchema,
  userIdSchema,
} from "@/lib/backend/validations/domainSchemas";

export const PATCH = withAuth(
  validate(updateUserSchema, "body", updateUserController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);

export const DELETE = withAuth(
  validate(userIdSchema, "params", deleteUserController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
