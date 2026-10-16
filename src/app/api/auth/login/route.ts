import { loginController } from "@/lib/backend/controller/authController";
import { validate } from "@/lib/backend/middleware/validate";
import { loginSchema } from "@/lib/backend/validations/authSchema";
// import { withAuth } from "@/lib/backend/middleware/auth";
// export const POST = withAuth(createAssetController, ["ADMIN", "SUPER_ADMIN"]);

export const POST =  validate(loginSchema, "body", loginController);
