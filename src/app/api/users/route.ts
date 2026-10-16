import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import {
  createUserController,
  getUsersController,
} from "@/lib/backend/controller/userController";
import {
  createUserSchema,
  getUsersSchema,
} from "@/lib/backend/validations/domainSchemas";

export const GET = withAuth(
  validate(getUsersSchema, "query", getUsersController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);

export const POST = withAuth(
  validate(createUserSchema, "body", createUserController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
