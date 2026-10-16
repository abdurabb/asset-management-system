import { withAuth } from "@/lib/backend/middleware/auth";
import { validate } from "@/lib/backend/middleware/validate";
import { getAuditLogsController } from "@/lib/backend/controller/miscController";
import { getAuditLogsSchema } from "@/lib/backend/validations/domainSchemas";

export const GET = withAuth(
  validate(getAuditLogsSchema, "query", getAuditLogsController),
  ["SUPER_ADMIN", "MANAGER"],
);
