import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import {
  createDocumentController,
  getDocumentsController,
} from "@/lib/backend/controller/miscController";
import {
  createDocumentSchema,
  getDocumentsSchema,
} from "@/lib/backend/validations/domainSchemas";

export const GET = withAuth(
  validate(getDocumentsSchema, "query", getDocumentsController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"],
);

export const POST = withAuth(
  validate(createDocumentSchema, "body", createDocumentController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN"],
);
