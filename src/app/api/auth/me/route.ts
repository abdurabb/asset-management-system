import { withAuth } from "@/lib/backend/middleware/auth";
import { getMeController } from "@/lib/backend/controller/userController";

export const GET = withAuth(getMeController);
