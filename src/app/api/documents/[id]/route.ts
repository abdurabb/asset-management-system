import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import { deleteDocumentController } from "@/lib/backend/controller/miscController";
import { documentIdSchema } from "@/lib/backend/validations/domainSchemas";

export const DELETE = withAuth(
  validate(documentIdSchema, "params", deleteDocumentController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
