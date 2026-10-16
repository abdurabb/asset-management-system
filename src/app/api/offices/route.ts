import {
  createOfficeController,
  getOfficesController,
} from "@/lib/backend/controller/officeController";

import { withAuth } from "@/lib/backend/middleware/auth";

import { validate } from "@/lib/backend/middleware/validate";

import {
  createOfficeSchema,
  getOfficesSchema,
} from "@/lib/backend/validations/officeSchema";

// =====================================================
// GET /api/offices
// =====================================================

export const GET = withAuth(
  validate(getOfficesSchema, "query", getOfficesController),
  ["SUPER_ADMIN", "MANAGER", "ADMIN", "USER"],
);

// =====================================================
// POST /api/offices
// =====================================================

export const POST = withAuth(
  validate(createOfficeSchema, "body", createOfficeController),
  ["SUPER_ADMIN", "MANAGER"],
);
