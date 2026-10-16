import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/backend/prisma";
import { writeAuditLog } from "@/lib/backend/audit";
import {
  assertOfficeAccess,
  getScopedOfficeId,
} from "@/lib/backend/scope";
import { handleError } from "@/lib/backend/handlers/handleError";
import { AppError } from "@/types/error.types";
import {
  CreateMaintenancePayload,
  UpdateMaintenancePayload,
} from "@/types/asset";
import { User } from "@/types/user";

type RouteContext = { params: Promise<{ id: string }> };

const maintenanceInclude = {
  asset: { select: { id: true, name: true, assetTag: true } },
  office: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} as const;

export async function getMaintenanceController(
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
    const assetId = searchParams.get("assetId") || undefined;
    const status = searchParams.get("status") || undefined;
    const search = searchParams.get("search")?.trim() || "";
    let officeId = searchParams.get("officeId") || undefined;

    const scoped = getScopedOfficeId(auth);
    if (scoped !== null) {
      officeId = scoped || undefined;
    }

    const where = {
      ...(officeId ? { officeId } : {}),
      ...(assetId ? { assetId } : {}),
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { title: { contains: search, mode: "insensitive" as const } },
              { description: { contains: search, mode: "insensitive" as const } },
              { performedBy: { contains: search, mode: "insensitive" as const } },
              { asset: { name: { contains: search, mode: "insensitive" as const } } },
              { asset: { assetTag: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [records, total] = await Promise.all([
      prisma.maintenanceRecord.findMany({
        where,
        include: maintenanceInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.maintenanceRecord.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: records,
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

export async function createMaintenanceController(
  req: NextRequest,
  _context?: unknown,
  data?: CreateMaintenancePayload,
  auth?: User,
) {
  try {
    if (!auth || !data) {
      return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
    }

    const asset = await prisma.asset.findUnique({ where: { id: data.assetId } });
    if (!asset || !asset.isActive) {
      return NextResponse.json({ success: false, message: "Asset not found" }, { status: 404 });
    }

    const access = assertOfficeAccess(auth, asset.officeId);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: 403 });
    }

    const record = await prisma.$transaction(async (tx) => {
      await tx.assignment.updateMany({
        where: { assetId: asset.id, isActive: true },
        data: { isActive: false, returnedAt: new Date() },
      });

      const created = await tx.maintenanceRecord.create({
        data: {
          assetId: asset.id,
          officeId: asset.officeId,
          title: data.title,
          description: data.description || null,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
          cost: data.cost ?? null,
          performedBy: data.performedBy || null,
          createdById: auth.userId,
        },
        include: maintenanceInclude,
      });

      await tx.asset.update({
        where: { id: asset.id },
        data: { status: "MAINTENANCE" },
      });

      return created;
    });

    await writeAuditLog({
      action: "MAINTENANCE_CREATE",
      entityType: "Asset",
      entityId: asset.id,
      userId: auth.userId,
      details: { maintenanceId: record.id, title: record.title },
    });

    return NextResponse.json(
      { success: true, message: "Maintenance record created", data: record },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function updateMaintenanceController(
  req: NextRequest,
  context: RouteContext,
  data?: UpdateMaintenancePayload,
  auth?: User,
) {
  try {
    if (!auth || !data) {
      return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
    }

    const { id } = await context.params;
    const existing = await prisma.maintenanceRecord.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Maintenance record not found" },
        { status: 404 },
      );
    }

    const access = assertOfficeAccess(auth, existing.officeId);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: 403 });
    }

    const record = await prisma.$transaction(async (tx) => {
      const updated = await tx.maintenanceRecord.update({
        where: { id },
        data: {
          ...(data.title !== undefined ? { title: data.title } : {}),
          ...(data.description !== undefined ? { description: data.description } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.cost !== undefined ? { cost: data.cost } : {}),
          ...(data.scheduledAt !== undefined
            ? { scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null }
            : {}),
          ...(data.completedAt !== undefined
            ? { completedAt: data.completedAt ? new Date(data.completedAt) : null }
            : {}),
          ...(data.performedBy !== undefined ? { performedBy: data.performedBy } : {}),
          ...(data.status === "COMPLETED" && !data.completedAt
            ? { completedAt: new Date() }
            : {}),
          ...(data.status &&
          data.status !== "COMPLETED" &&
          data.completedAt === undefined
            ? { completedAt: null }
            : {}),
        },
        include: maintenanceInclude,
      });

      if (data.status === "SCHEDULED" || data.status === "IN_PROGRESS") {
        await tx.asset.update({
          where: { id: existing.assetId },
          data: { status: "MAINTENANCE" },
        });
      } else if (data.status === "COMPLETED" || data.status === "CANCELLED") {
        const stillOpen = await tx.maintenanceRecord.count({
          where: {
            assetId: existing.assetId,
            id: { not: existing.id },
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          },
        });

        if (stillOpen === 0) {
          const activeAssignment = await tx.assignment.findFirst({
            where: { assetId: existing.assetId, isActive: true },
          });

          await tx.asset.update({
            where: { id: existing.assetId },
            data: { status: activeAssignment ? "ASSIGNED" : "AVAILABLE" },
          });
        }
      }

      return updated;
    });

    await writeAuditLog({
      action: "MAINTENANCE_UPDATE",
      entityType: "MaintenanceRecord",
      entityId: record.id,
      userId: auth.userId,
      details: data,
    });

    return NextResponse.json({
      success: true,
      message: "Maintenance record updated",
      data: record,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}
