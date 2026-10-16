import { withAuth } from "@/lib/backend/middleware/auth";
import { getDashboardController } from "@/lib/backend/controller/miscController";

export const GET = withAuth(getDashboardController);
