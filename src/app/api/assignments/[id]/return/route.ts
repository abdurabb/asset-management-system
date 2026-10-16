import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import { returnAssignmentController } from "@/lib/backend/controller/assignmentController";
import { assignmentIdSchema } from "@/lib/backend/validations/domainSchemas";

export const POST = withAuth(
  validate(assignmentIdSchema, "params", returnAssignmentController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
