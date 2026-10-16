import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import QRCode from "qrcode";

import { prisma } from "@/lib/backend/prisma";
import { writeAuditLog } from "@/lib/backend/audit";
import {
  assertOfficeAccess,
  getScopedOfficeId,
  officeWhereFilter,
} from "@/lib/backend/scope";
import { handleError } from "@/lib/backend/handlers/handleError";
import { AppError } from "@/types/error.types";
import { CreateAssetPayload, UpdateAssetPayload } from "@/types/asset";
import { User } from "@/types/user";

type RouteContext = { params: Promise<{ id: string }> };

const assetInclude = {
  office: { select: { id: true, name: true, code: true } },
  category: { select: { id: true, name: true } },
  assignments: {
    where: { isActive: true },
    take: 1,
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  },
} as const;

function makeAssetTag(officeCode: string) {
  const suffix = randomBytes(3).toString("hex").toUpperCase();
  return `${officeCode}-${suffix}`;
}

export async function getAssetsController(
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
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 20)));
    const search = searchParams.get("search")?.trim() || "";
    const categoryId = searchParams.get("categoryId") || undefined;
    const status = searchParams.get("status") || undefined;
    const isActiveParam = searchParams.get("isActive");
    let officeId = searchParams.get("officeId") || undefined;

    const scoped = getScopedOfficeId(auth);
    if (scoped !== null) {
      officeId = scoped || undefined;
      if (!officeId) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
    }

    const where = {
      ...(officeId ? { officeId } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(status ? { status } : {}),
      ...(isActiveParam === "true"
        ? { isActive: true }
        : isActiveParam === "false"
          ? { isActive: false }
          : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { assetTag: { contains: search, mode: "insensitive" as const } },
              { serialNumber: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        include: assetInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: assets,
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

export async function createAssetController(
  req: NextRequest,
  _context?: unknown,
  data?: CreateAssetPayload,
  auth?: User,
) {
  try {
    if (!auth || !data) {
      return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
    }

    const access = assertOfficeAccess(auth, data.officeId);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: 403 });
    }

    const office = await prisma.office.findUnique({ where: { id: data.officeId } });
    if (!office || !office.isActive) {
      return NextResponse.json({ success: false, message: "Office not found" }, { status: 404 });
    }

    if (data.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category || !category.isActive) {
        return NextResponse.json(
          { success: false, message: "Category not found" },
          { status: 404 },
        );
      }
    }

    const assetTag = (data.assetTag || makeAssetTag(office.code)).toUpperCase();
    const existingTag = await prisma.asset.findUnique({ where: { assetTag } });
    if (existingTag) {
      return NextResponse.json(
        { success: false, message: "Asset tag already exists" },
        { status: 409 },
      );
    }

    const asset = await prisma.asset.create({
      data: {
        name: data.name,
        assetTag,
        serialNumber: data.serialNumber || null,
        description: data.description || null,
        purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null,
        purchaseCost: data.purchaseCost ?? null,
        location: data.location || null,
        officeId: data.officeId,
        categoryId: data.categoryId || null,
      },
      include: assetInclude,
    });

    await writeAuditLog({
      action: "CREATE",
      entityType: "Asset",
      entityId: asset.id,
      userId: auth.userId,
      details: { assetTag: asset.assetTag, name: asset.name },
    });

    return NextResponse.json(
      { success: true, message: "Asset created successfully", data: asset },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function getAssetController(
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
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: assetInclude,
    });

    if (!asset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    const access = assertOfficeAccess(auth, asset.officeId);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: asset });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function updateAssetController(
  req: NextRequest,
  context: RouteContext,
  data?: UpdateAssetPayload,
  auth?: User,
) {
  try {
    if (!auth || !data) {
      return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
    }

    const { id } = await context.params;
    const existing = await prisma.asset.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    const access = assertOfficeAccess(auth, existing.officeId);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: 403 });
    }

    if (data.officeId && data.officeId !== existing.officeId) {
      const moveAccess = assertOfficeAccess(auth, data.officeId);
      if (!moveAccess.ok) {
        return NextResponse.json(
          { success: false, message: moveAccess.message },
          { status: 403 },
        );
      }
    }

    if (data.categoryId && data.categoryId !== existing.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: data.categoryId } });
      if (!category || !category.isActive) {
        return NextResponse.json(
          { success: false, message: "Category not found" },
          { status: 404 },
        );
      }
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.serialNumber !== undefined ? { serialNumber: data.serialNumber } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(data.purchaseDate !== undefined
          ? { purchaseDate: data.purchaseDate ? new Date(data.purchaseDate) : null }
          : {}),
        ...(data.purchaseCost !== undefined ? { purchaseCost: data.purchaseCost } : {}),
        ...(data.location !== undefined ? { location: data.location } : {}),
        ...(data.officeId !== undefined ? { officeId: data.officeId } : {}),
        ...(data.categoryId !== undefined ? { categoryId: data.categoryId || null } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
      include: assetInclude,
    });

    await writeAuditLog({
      action: "UPDATE",
      entityType: "Asset",
      entityId: asset.id,
      userId: auth.userId,
      details: data,
    });

    return NextResponse.json({
      success: true,
      message: "Asset updated successfully",
      data: asset,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function deleteAssetController(
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
    const existing = await prisma.asset.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    const access = assertOfficeAccess(auth, existing.officeId);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: 403 });
    }

    const asset = await prisma.asset.update({
      where: { id },
      data: { isActive: false, status: "RETIRED" },
      include: assetInclude,
    });

    await writeAuditLog({
      action: "DEACTIVATE",
      entityType: "Asset",
      entityId: asset.id,
      userId: auth.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Asset retired successfully",
      data: asset,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function getAssetQrController(
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
    const asset = await prisma.asset.findUnique({ where: { id } });

    if (!asset) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    const access = assertOfficeAccess(auth, asset.officeId);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: 403 });
    }

    const origin =
      req.headers.get("origin") ||
      process.env.BASE_URL?.trim() ||
      `${req.nextUrl.protocol}//${req.headers.get("host")}`;

    const scanUrl = `${origin.replace(/\/$/, "")}/scan/${asset.qrToken}`;
    const qrDataUrl = await QRCode.toDataURL(scanUrl, {
      width: 512,
      margin: 2,
      errorCorrectionLevel: "M",
    });

    return NextResponse.json({
      success: true,
      data: {
        assetId: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        qrToken: asset.qrToken,
        scanUrl,
        qrDataUrl,
      },
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function getAssetByQrTokenController(
  req: NextRequest,
  context: RouteContext,
) {
  try {
    const { id: qrToken } = await context.params;

    const asset = await prisma.asset.findUnique({
      where: { qrToken },
      include: {
        office: { select: { id: true, name: true, code: true } },
        category: { select: { id: true, name: true } },
        assignments: {
          where: { isActive: true },
          take: 1,
          include: {
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    if (!asset || !asset.isActive) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: asset });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export { officeWhereFilter };
