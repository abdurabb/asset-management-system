import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import {
  createAssignmentController,
  getAssignmentsController,
} from "@/lib/backend/controller/assignmentController";
import {
  createAssignmentSchema,
  getAssignmentsSchema,
} from "@/lib/backend/validations/domainSchemas";

export const GET = withAuth(
  validate(getAssignmentsSchema, "query", getAssignmentsController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"],
);

export const POST = withAuth(
  validate(createAssignmentSchema, "body", createAssignmentController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
