import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/backend/prisma";
import { getDefaultCompanyId, writeAuditLog } from "@/lib/backend/audit";
import { handleError } from "@/lib/backend/handlers/handleError";
import { AppError } from "@/types/error.types";
import { CreateCategoryPayload, UpdateCategoryPayload } from "@/types/asset";
import { User } from "@/types/user";

type RouteContext = { params: Promise<{ id: string }> };

export async function getCategoriesController(
  req: NextRequest,
  _context?: unknown,
  _data?: unknown,
  auth?: User,
) {
  try {
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") || 1));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)));
    const search = searchParams.get("search")?.trim() || "";
    const isActiveParam = searchParams.get("isActive");

    const companyId = await getDefaultCompanyId();

    const where = {
      companyId,
      ...(isActiveParam === "true"
        ? { isActive: true }
        : isActiveParam === "false"
          ? { isActive: false }
          : {}),
      ...(search
        ? { name: { contains: search, mode: "insensitive" as const } }
        : {}),
    };

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        include: { _count: { select: { assets: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.category.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function createCategoryController(
  req: NextRequest,
  _context?: unknown,
  data?: CreateCategoryPayload,
  auth?: User,
) {
  try {
    if (!auth || !data) {
      return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
    }

    const companyId = await getDefaultCompanyId();

    const existing = await prisma.category.findFirst({
      where: { companyId, name: data.name },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, message: "Category already exists" },
        { status: 409 },
      );
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        description: data.description || null,
        companyId,
      },
      include: { _count: { select: { assets: true } } },
    });

    await writeAuditLog({
      action: "CREATE",
      entityType: "Category",
      entityId: category.id,
      userId: auth.userId,
      details: { name: category.name },
    });

    return NextResponse.json(
      { success: true, message: "Category created", data: category },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function updateCategoryController(
  req: NextRequest,
  context: RouteContext,
  data?: UpdateCategoryPayload,
  auth?: User,
) {
  try {
    if (!auth || !data) {
      return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
    }

    const { id } = await context.params;
    const existing = await prisma.category.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: { _count: { select: { assets: true } } },
    });

    await writeAuditLog({
      action: "UPDATE",
      entityType: "Category",
      entityId: category.id,
      userId: auth.userId,
      details: data,
    });

    return NextResponse.json({
      success: true,
      message: "Category updated",
      data: category,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function deleteCategoryController(
  req: NextRequest,
  context: RouteContext,
  _data?: unknown,
  auth?: User,
) {
  try {
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const existing = await prisma.category.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Category not found" }, { status: 404 });
    }

    const category = await prisma.category.update({
      where: { id },
      data: { isActive: false },
      include: { _count: { select: { assets: true } } },
    });

    await writeAuditLog({
      action: "DEACTIVATE",
      entityType: "Category",
      entityId: category.id,
      userId: auth.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Category deactivated",
      data: category,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}
