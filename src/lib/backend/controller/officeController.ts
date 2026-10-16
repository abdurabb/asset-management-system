import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/backend/prisma";
import { getDefaultCompanyId, writeAuditLog } from "@/lib/backend/audit";
import { officeWhereFilter } from "@/lib/backend/scope";
import { handleError } from "../handlers/handleError";
import { AppError } from "@/types/error.types";
import { UpdateOfficeData, CreateOfficeData } from "@/types/office";
import { User } from "@/types/user";

// =====================================================
// TYPES
// =====================================================

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};



// =====================================================
// CREATE OFFICE
// =====================================================

export async function createOfficeController(
  req: NextRequest,
  context?: unknown,
  data?: CreateOfficeData,
  auth?: User,
) {
  try {
    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "Request body is missing",
        },
        { status: 400 },
      );
    }

    const { name, code, address, city, country, phone } = data;

    const existingOffice = await prisma.office.findUnique({
      where: { code },
    });

    if (existingOffice) {
      return NextResponse.json(
        {
          success: false,
          message: "Office code already exists",
        },
        { status: 409 },
      );
    }

    const companyId = await getDefaultCompanyId();

    const office = await prisma.office.create({
      data: {
        name,
        code,
        address: address ?? null,
        city: city ?? null,
        country: country ?? null,
        phone: phone ?? null,
        companyId,
      },
    });

    await writeAuditLog({
      action: "CREATE",
      entityType: "Office",
      entityId: office.id,
      userId: auth?.userId,
      details: { name: office.name, code: office.code },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Office created successfully",
        data: office,
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error as AppError);
  }
}

// =====================================================
// GET OFFICES
// =====================================================

export async function getOfficesController(
  req: NextRequest,
  _context?: unknown,
  _data?: unknown,
  auth?: User,
) {
  try {
    const { searchParams } = new URL(req.url);

    // -----------------------------
    // Pagination
    // -----------------------------

    const pageParam = Number(
      searchParams.get("page") || 1,
    );

    const limitParam = Number(
      searchParams.get("limit") || 10,
    );

    const page =
      Number.isInteger(pageParam) && pageParam > 0
        ? pageParam
        : 1;

    const limit =
      Number.isInteger(limitParam) &&
      limitParam > 0 &&
      limitParam <= 100
        ? limitParam
        : 10;

    const skip = (page - 1) * limit;

    // -----------------------------
    // Search
    // -----------------------------

    const search =
      searchParams.get("search")?.trim() || "";

    // -----------------------------
    // Active filter
    // -----------------------------

    const isActiveParam =
      searchParams.get("isActive");

    let isActive: boolean | undefined;

    if (isActiveParam === "true") {
      isActive = true;
    }

    if (isActiveParam === "false") {
      isActive = false;
    }

    // -----------------------------
    // Where
    // -----------------------------

    const scopedOfficeId = auth ? officeWhereFilter(auth).officeId : undefined;

    const where = {
      ...(scopedOfficeId ? { id: scopedOfficeId } : {}),
      ...(search
        ? {
            OR: [
              {
                name: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                code: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
              {
                city: {
                  contains: search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),

      ...(isActive !== undefined
        ? {
            isActive,
          }
        : {}),
    };

    // -----------------------------
    // Query
    // -----------------------------

    const [offices, total] = await Promise.all([
      prisma.office.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
      }),

      prisma.office.count({
        where,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: offices,
      pagination: {
        page,
        limit,
        total,
        totalPages:
          total === 0
            ? 0
            : Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

// =====================================================
// GET SINGLE OFFICE
// =====================================================

export async function getOfficeController(
  req: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    const office = await prisma.office.findUnique({
      where: {
        id,
      },
    });

    if (!office) {
      return NextResponse.json(
        {
          success: false,
          message: "Office not found",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      data: office,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

// =====================================================
// UPDATE OFFICE
// =====================================================

export async function updateOfficeController(
  req: NextRequest,
  context: RouteContext,
  body?: UpdateOfficeData,
) {
  try {
    const { id } = await context.params;

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          message: "Request body is missing",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // Find office
    // -----------------------------

    const existingOffice =
      await prisma.office.findUnique({
        where: {
          id,
        },
      });

    if (!existingOffice) {
      return NextResponse.json(
        {
          success: false,
          message: "Office not found",
        },
        { status: 404 },
      );
    }

    // -----------------------------
    // Check duplicate code
    // -----------------------------

    if (body.code) {
      const codeExists =
        await prisma.office.findFirst({
          where: {
            code: body.code,
            NOT: {
              id,
            },
          },
        });

      if (codeExists) {
        return NextResponse.json(
          {
            success: false,
            message: "Office code already exists",
          },
          { status: 409 },
        );
      }
    }

    // -----------------------------
    // Update
    // -----------------------------

    const office = await prisma.office.update({
      where: {
        id,
      },
      data: body,
    });

    return NextResponse.json({
      success: true,
      message: "Office updated successfully",
      data: office,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

// =====================================================
// DELETE OFFICE
// =====================================================

export async function deleteOfficeController(
  req: NextRequest,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    // -----------------------------
    // Find office
    // -----------------------------

    const existingOffice =
      await prisma.office.findUnique({
        where: {
          id,
        },
      });

    if (!existingOffice) {
      return NextResponse.json(
        {
          success: false,
          message: "Office not found",
        },
        { status: 404 },
      );
    }

    // -----------------------------
    // Already inactive
    // -----------------------------

    if (!existingOffice.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Office is already inactive",
        },
        { status: 400 },
      );
    }

    // -----------------------------
    // Soft delete
    // -----------------------------

    const office = await prisma.office.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Office deactivated successfully",
      data: office,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}