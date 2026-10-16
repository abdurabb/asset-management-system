import { refreshController } from "@/lib/backend/controller/authController";
import { validate } from "@/lib/backend/middleware/validate";
import { refreshSchema } from "@/lib/backend/validations/authSchema";

export const POST = validate(refreshSchema, "body", refreshController);
