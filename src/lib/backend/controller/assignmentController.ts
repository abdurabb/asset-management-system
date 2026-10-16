import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/backend/prisma";
import { writeAuditLog } from "@/lib/backend/audit";
import {
  assertOfficeAccess,
  getScopedOfficeId,
} from "@/lib/backend/scope";
import { handleError } from "@/lib/backend/handlers/handleError";
import { AppError } from "@/types/error.types";
import { CreateAssignmentPayload } from "@/types/asset";
import { User } from "@/types/user";

type RouteContext = { params: Promise<{ id: string }> };

const assignmentInclude = {
  asset: { select: { id: true, name: true, assetTag: true, status: true } },
  user: { select: { id: true, name: true, email: true } },
  assignedBy: { select: { id: true, name: true } },
  office: { select: { id: true, name: true } },
} as const;

export async function getAssignmentsController(
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
    const userId = searchParams.get("userId") || undefined;
    const assetId = searchParams.get("assetId") || undefined;
    const isActiveParam = searchParams.get("isActive");
    const search = searchParams.get("search")?.trim() || "";
    let officeId = searchParams.get("officeId") || undefined;

    const scoped = getScopedOfficeId(auth);
    if (scoped !== null) {
      officeId = scoped || undefined;
    }

    // Employees only see their own assignments
    const effectiveUserId = auth.role === "USER" ? auth.userId : userId;

    const where = {
      ...(officeId ? { officeId } : {}),
      ...(effectiveUserId ? { userId: effectiveUserId } : {}),
      ...(assetId ? { assetId } : {}),
      ...(isActiveParam === "true"
        ? { isActive: true }
        : isActiveParam === "false"
          ? { isActive: false }
          : {}),
      ...(search
        ? {
            OR: [
              { notes: { contains: search, mode: "insensitive" as const } },
              { asset: { name: { contains: search, mode: "insensitive" as const } } },
              { asset: { assetTag: { contains: search, mode: "insensitive" as const } } },
              { user: { name: { contains: search, mode: "insensitive" as const } } },
            ],
          }
        : {}),
    };

    const [assignments, total] = await Promise.all([
      prisma.assignment.findMany({
        where,
        include: assignmentInclude,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { assignedAt: "desc" },
      }),
      prisma.assignment.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: assignments,
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

export async function createAssignmentController(
  req: NextRequest,
  _context?: unknown,
  data?: CreateAssignmentPayload,
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

    if (asset.status === "RETIRED" || asset.status === "MAINTENANCE") {
      return NextResponse.json(
        { success: false, message: `Cannot assign asset with status ${asset.status}` },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({ where: { id: data.userId } });
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (user.officeId && user.officeId !== asset.officeId && auth.role === "ADMIN") {
      return NextResponse.json(
        { success: false, message: "User must belong to the same office as the asset" },
        { status: 400 },
      );
    }

    const active = await prisma.assignment.findFirst({
      where: { assetId: asset.id, isActive: true },
    });

    if (active) {
      return NextResponse.json(
        { success: false, message: "Asset is already assigned. Return it first." },
        { status: 409 },
      );
    }

    const assignment = await prisma.$transaction(async (tx) => {
      const created = await tx.assignment.create({
        data: {
          assetId: asset.id,
          userId: data.userId,
          assignedById: auth.userId,
          officeId: asset.officeId,
          notes: data.notes || null,
        },
        include: assignmentInclude,
      });

      await tx.asset.update({
        where: { id: asset.id },
        data: { status: "ASSIGNED" },
      });

      return created;
    });

    await writeAuditLog({
      action: "ASSIGN",
      entityType: "Asset",
      entityId: asset.id,
      userId: auth.userId,
      details: { assignmentId: assignment.id, toUserId: data.userId },
    });

    return NextResponse.json(
      { success: true, message: "Asset assigned successfully", data: assignment },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function returnAssignmentController(
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
    const existing = await prisma.assignment.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Assignment not found" },
        { status: 404 },
      );
    }

    const access = assertOfficeAccess(auth, existing.officeId);
    if (!access.ok) {
      return NextResponse.json({ success: false, message: access.message }, { status: 403 });
    }

    if (!existing.isActive) {
      return NextResponse.json(
        { success: false, message: "Assignment already returned" },
        { status: 400 },
      );
    }

    const assignment = await prisma.$transaction(async (tx) => {
      const updated = await tx.assignment.update({
        where: { id },
        data: { isActive: false, returnedAt: new Date() },
        include: assignmentInclude,
      });

      await tx.asset.update({
        where: { id: existing.assetId },
        data: { status: "AVAILABLE" },
      });

      return updated;
    });

    await writeAuditLog({
      action: "RETURN",
      entityType: "Asset",
      entityId: existing.assetId,
      userId: auth.userId,
      details: { assignmentId: id },
    });

    return NextResponse.json({
      success: true,
      message: "Asset returned successfully",
      data: assignment,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}
