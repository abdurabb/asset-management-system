import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/backend/prisma";
import { getDefaultCompanyId, writeAuditLog } from "@/lib/backend/audit";
import {
  assertOfficeAccess,
  getScopedOfficeId,
  isGlobalRole,
} from "@/lib/backend/scope";
import { handleError } from "@/lib/backend/handlers/handleError";
import { AppError } from "@/types/error.types";
import { CreateDocumentPayload } from "@/types/asset";
import { User } from "@/types/user";

type RouteContext = { params: Promise<{ id: string }> };

const documentInclude = {
  uploadedBy: { select: { id: true, name: true } },
  office: { select: { id: true, name: true } },
  asset: { select: { id: true, name: true, assetTag: true } },
} as const;

export async function getDocumentsController(
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
    const assetId = searchParams.get("assetId") || undefined;
    let officeId = searchParams.get("officeId") || undefined;

    const scoped = getScopedOfficeId(auth);
    if (scoped !== null) {
      officeId = scoped || undefined;
    }

    const where = {
      isActive: true,
      ...(officeId ? { officeId } : {}),
      ...(assetId ? { assetId } : {}),
      ...(search
        ? { title: { contains: search, mode: "insensitive" as const } }
        : {}),
    };

    const [documents, total] = await Promise.all([
      prisma.document.findMany({
        where,
        include: documentInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.document.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: documents,
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

export async function createDocumentController(
  req: NextRequest,
  _context?: unknown,
  data?: CreateDocumentPayload,
  auth?: User,
) {
  try {
    if (!auth || !data) {
      return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
    }

    let officeId = data.officeId || auth.user.officeId || null;

    if (officeId) {
      const access = assertOfficeAccess(auth, officeId);
      if (!access.ok) {
        return NextResponse.json({ success: false, message: access.message }, { status: 403 });
      }
    }

    if (data.assetId) {
      const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
      if (!asset) {
        return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
      }
      const access = assertOfficeAccess(auth, asset.officeId);
      if (!access.ok) {
        return NextResponse.json({ success: false, message: access.message }, { status: 403 });
      }
      officeId = asset.officeId;
    }

    const companyId = await getDefaultCompanyId();

    const document = await prisma.document.create({
      data: {
        title: data.title,
        description: data.description || null,
        fileUrl: data.fileUrl || null,
        fileType: data.fileType || null,
        companyId,
        officeId,
        assetId: data.assetId || null,
        uploadedById: auth.userId,
      },
      include: documentInclude,
    });

    await writeAuditLog({
      action: "CREATE",
      entityType: "Document",
      entityId: document.id,
      userId: auth.userId,
      details: { title: document.title },
    });

    return NextResponse.json(
      { success: true, message: "Document created", data: document },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function deleteDocumentController(
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
    const existing = await prisma.document.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, message: "Document not found" }, { status: 404 });
    }

    if (existing.officeId) {
      const access = assertOfficeAccess(auth, existing.officeId);
      if (!access.ok) {
        return NextResponse.json({ success: false, message: access.message }, { status: 403 });
      }
    } else if (!isGlobalRole(auth.role)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    const document = await prisma.document.update({
      where: { id },
      data: { isActive: false },
      include: documentInclude,
    });

    await writeAuditLog({
      action: "DELETE",
      entityType: "Document",
      entityId: document.id,
      userId: auth.userId,
    });

    return NextResponse.json({
      success: true,
      message: "Document removed",
      data: document,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function getAuditLogsController(
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
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 30)));
    const entityType = searchParams.get("entityType") || undefined;
    const action = searchParams.get("action") || undefined;
    const search = searchParams.get("search")?.trim() || "";

    const where = {
      ...(entityType ? { entityType } : {}),
      ...(action ? { action } : {}),
      ...(search
        ? {
            OR: [
              { entityId: { contains: search, mode: "insensitive" as const } },
              { details: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: logs,
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

export async function getDashboardController(
  req: NextRequest,
  _context?: unknown,
  _data?: unknown,
  auth?: User,
) {
  try {
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const scoped = getScopedOfficeId(auth);
    const officeFilter = scoped !== null ? { officeId: scoped || "__none__" } : {};

    const [
      totalAssets,
      availableAssets,
      assignedAssets,
      maintenanceAssets,
      totalUsers,
      totalOffices,
      openMaintenance,
      activeAssignments,
    ] = await Promise.all([
      prisma.asset.count({ where: { isActive: true, ...officeFilter } }),
      prisma.asset.count({
        where: { isActive: true, status: "AVAILABLE", ...officeFilter },
      }),
      prisma.asset.count({
        where: { isActive: true, status: "ASSIGNED", ...officeFilter },
      }),
      prisma.asset.count({
        where: { isActive: true, status: "MAINTENANCE", ...officeFilter },
      }),
      prisma.user.count({
        where: {
          isActive: true,
          ...(scoped !== null ? { officeId: scoped || "__none__" } : {}),
        },
      }),
      scoped !== null
        ? Promise.resolve(scoped ? 1 : 0)
        : prisma.office.count({ where: { isActive: true } }),
      prisma.maintenanceRecord.count({
        where: {
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          ...officeFilter,
        },
      }),
      prisma.assignment.count({
        where: { isActive: true, ...officeFilter },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        totalAssets,
        availableAssets,
        assignedAssets,
        maintenanceAssets,
        totalUsers,
        totalOffices,
        openMaintenance,
        activeAssignments,
      },
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function getCompanyController(
  req: NextRequest,
  _context?: unknown,
  _data?: unknown,
  auth?: User,
) {
  try {
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const companyId = await getDefaultCompanyId();
    const company = await prisma.company.findUnique({ where: { id: companyId } });

    return NextResponse.json({ success: true, data: company });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function updateCompanyController(
  req: NextRequest,
  _context?: unknown,
  data?: {
    name?: string;
    description?: string | null;
    address?: string | null;
    phone?: string | null;
  },
  auth?: User,
) {
  try {
    if (!auth || !data) {
      return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
    }

    const companyId = await getDefaultCompanyId();
    const company = await prisma.company.update({
      where: { id: companyId },
      data,
    });

    await writeAuditLog({
      action: "UPDATE",
      entityType: "Company",
      entityId: company.id,
      userId: auth.userId,
      details: data,
    });

    return NextResponse.json({
      success: true,
      message: "Company updated",
      data: company,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function getReportsController(
  req: NextRequest,
  _context?: unknown,
  _data?: unknown,
  auth?: User,
) {
  try {
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const scoped = getScopedOfficeId(auth);
    const officeFilter = scoped !== null ? { officeId: scoped || "__none__" } : {};

    const [byStatus, byOffice, byCategory, recentAssignments] = await Promise.all([
      prisma.asset.groupBy({
        by: ["status"],
        where: { isActive: true, ...officeFilter },
        _count: { _all: true },
      }),
      prisma.asset.groupBy({
        by: ["officeId"],
        where: { isActive: true, ...officeFilter },
        _count: { _all: true },
      }),
      prisma.asset.groupBy({
        by: ["categoryId"],
        where: { isActive: true, ...officeFilter },
        _count: { _all: true },
      }),
      prisma.assignment.findMany({
        where: { ...officeFilter },
        include: {
          asset: { select: { name: true, assetTag: true } },
          user: { select: { name: true } },
          office: { select: { name: true } },
        },
        orderBy: { assignedAt: "desc" },
        take: 10,
      }),
    ]);

    const officeIds = byOffice.map((row) => row.officeId);
    const categoryIds = byCategory
      .map((row) => row.categoryId)
      .filter((id): id is string => Boolean(id));

    const [offices, categories] = await Promise.all([
      officeIds.length
        ? prisma.office.findMany({
            where: { id: { in: officeIds } },
            select: { id: true, name: true, code: true },
          })
        : Promise.resolve([]),
      categoryIds.length
        ? prisma.category.findMany({
            where: { id: { in: categoryIds } },
            select: { id: true, name: true },
          })
        : Promise.resolve([]),
    ]);

    const officeMap = Object.fromEntries(offices.map((o) => [o.id, o]));
    const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

    return NextResponse.json({
      success: true,
      data: {
        byStatus: byStatus.map((row) => ({
          status: row.status,
          count: row._count._all,
        })),
        byOffice: byOffice.map((row) => ({
          officeId: row.officeId,
          office: officeMap[row.officeId] || null,
          count: row._count._all,
        })),
        byCategory: byCategory.map((row) => ({
          categoryId: row.categoryId,
          category: row.categoryId ? categoryMap[row.categoryId] || null : null,
          count: row._count._all,
        })),
        recentAssignments,
      },
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}
