import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";

import { prisma } from "@/lib/backend/prisma";
import { writeAuditLog } from "@/lib/backend/audit";
import {
  assertOfficeAccess,
  canManageRole,
  getScopedOfficeId,
  isGlobalRole,
  officeWhereFilter,
} from "@/lib/backend/scope";
import { handleError } from "@/lib/backend/handlers/handleError";
import { UserOneRole } from "@/lib/constants/roles";
import { AppError } from "@/types/error.types";
import { CreateUserPayload, UpdateUserPayload, User } from "@/types/user";

type RouteContext = { params: Promise<{ id: string }> };

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  officeId: true,
  description: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  office: {
    select: { id: true, name: true, code: true },
  },
} as const;

export async function getUsersController(
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
    const role = searchParams.get("role") || undefined;
    const officeIdParam = searchParams.get("officeId") || undefined;
    const isActiveParam = searchParams.get("isActive");

    const scoped = getScopedOfficeId(auth);
    let officeId = officeIdParam;

    if (scoped !== null) {
      officeId = scoped;
    }

    const where = {
      ...(officeId ? { officeId } : {}),
      ...(role ? { role } : {}),
      ...(isActiveParam === "true"
        ? { isActive: true }
        : isActiveParam === "false"
          ? { isActive: false }
          : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" as const } },
              { email: { contains: search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: userSelect,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: users,
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

export async function createUserController(
  req: NextRequest,
  _context?: unknown,
  data?: CreateUserPayload,
  auth?: User,
) {
  try {
    if (!auth || !data) {
      return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
    }

    const role = data.role as UserOneRole;

    if (!canManageRole(auth.role, role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: cannot create a user with this role" },
        { status: 403 },
      );
    }

    let officeId = data.officeId || null;

    if (!isGlobalRole(role)) {
      if (auth.role === "ADMIN") {
        officeId = auth.user.officeId;
      }

      if (!officeId) {
        return NextResponse.json(
          { success: false, message: "Office is required for office admin and employee roles" },
          { status: 400 },
        );
      }

      const access = assertOfficeAccess(auth, officeId);
      if (!access.ok) {
        return NextResponse.json({ success: false, message: access.message }, { status: 403 });
      }
    } else {
      officeId = null;
    }

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        password: hashed,
        role,
        officeId,
        description: data.description ?? null,
      },
      select: userSelect,
    });

    await writeAuditLog({
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      userId: auth.userId,
      details: { email: user.email, role: user.role },
    });

    return NextResponse.json(
      { success: true, message: "User created successfully", data: user },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function updateUserController(
  req: NextRequest,
  context: RouteContext,
  data?: UpdateUserPayload,
  auth?: User,
) {
  try {
    if (!auth || !data) {
      return NextResponse.json({ success: false, message: "Bad request" }, { status: 400 });
    }

    const { id } = await context.params;
    const existing = await prisma.user.findUnique({ where: { id } });

    if (!existing) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (!canManageRole(auth.role, existing.role as UserOneRole)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: cannot update this user" },
        { status: 403 },
      );
    }

    if (existing.officeId) {
      const access = assertOfficeAccess(auth, existing.officeId);
      if (!access.ok) {
        return NextResponse.json({ success: false, message: access.message }, { status: 403 });
      }
    } else if (!isGlobalRole(auth.role)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: cannot update global users" },
        { status: 403 },
      );
    }

    const nextRole = (data.role ?? existing.role) as UserOneRole;
    if (data.role && !canManageRole(auth.role, nextRole)) {
      return NextResponse.json(
        { success: false, message: "Forbidden: cannot assign this role" },
        { status: 403 },
      );
    }

    let officeId =
      data.officeId === undefined
        ? existing.officeId
        : data.officeId || null;

    if (!isGlobalRole(nextRole)) {
      if (auth.role === "ADMIN") {
        officeId = auth.user.officeId;
      }
      if (!officeId) {
        return NextResponse.json(
          { success: false, message: "Office is required for this role" },
          { status: 400 },
        );
      }
    } else {
      officeId = null;
    }

    if (data.email && data.email !== existing.email) {
      const emailTaken = await prisma.user.findFirst({
        where: { email: data.email.toLowerCase(), NOT: { id } },
      });
      if (emailTaken) {
        return NextResponse.json(
          { success: false, message: "Email already exists" },
          { status: 409 },
        );
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
        ...(data.password ? { password: await bcrypt.hash(data.password, 10) } : {}),
        ...(data.role !== undefined ? { role: nextRole } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        officeId,
      },
      select: userSelect,
    });

    await writeAuditLog({
      action: "UPDATE",
      entityType: "User",
      entityId: user.id,
      userId: auth.userId,
      details: data,
    });

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: user,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function deleteUserController(
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

    if (id === auth.userId) {
      return NextResponse.json(
        { success: false, message: "You cannot deactivate your own account" },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
    }

    if (!canManageRole(auth.role, existing.role as UserOneRole)) {
      return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
    }

    if (existing.officeId) {
      const access = assertOfficeAccess(auth, existing.officeId);
      if (!access.ok) {
        return NextResponse.json({ success: false, message: access.message }, { status: 403 });
      }
    }

    if (!existing.isActive) {
      return NextResponse.json(
        { success: false, message: "User is already inactive" },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: userSelect,
    });

    await writeAuditLog({
      action: "DEACTIVATE",
      entityType: "User",
      entityId: user.id,
      userId: auth.userId,
    });

    return NextResponse.json({
      success: true,
      message: "User deactivated successfully",
      data: user,
    });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function getMeController(
  req: NextRequest,
  _context?: unknown,
  _data?: unknown,
  auth?: User,
) {
  try {
    if (!auth) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: userSelect,
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleError(error as AppError);
  }
}

export { officeWhereFilter };
