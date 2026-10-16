import {
  deleteOfficeController,
  getOfficeController,
  updateOfficeController,
} from "@/lib/backend/controller/officeController";

import { withAuth } from "@/lib/backend/middleware/auth";

import { validate } from "@/lib/backend/middleware/validate";

import {
  officeIdSchema,
  updateOfficeSchema,
} from "@/lib/backend/validations/officeSchema";


// =====================================================
// GET /api/offices/:id
// =====================================================

export const GET = withAuth(
  validate(
    officeIdSchema,
    "params",
    getOfficeController,
  ),
  [
    "SUPER_ADMIN",
    "MANAGER",
  ],
);


// =====================================================
// PATCH /api/offices/:id
// =====================================================

export const PATCH = withAuth(
  validate(
    updateOfficeSchema,
    "body",
    updateOfficeController,
  ),
  [
    "SUPER_ADMIN",
    "MANAGER",
  ],
);


// =====================================================
// DELETE /api/offices/:id
// =====================================================

export const DELETE = withAuth(
  validate(
    officeIdSchema,
    "params",
    deleteOfficeController,
  ),
  [
    "SUPER_ADMIN",
    "MANAGER",
  ],
);