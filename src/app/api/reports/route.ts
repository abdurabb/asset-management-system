import { withAuth } from "@/lib/backend/middleware/auth";
import { getReportsController } from "@/lib/backend/controller/miscController";

export const GET = withAuth(getReportsController, [
  "SUPER_ADMIN",
  "MANAGER",
  "ADMIN",
]);
