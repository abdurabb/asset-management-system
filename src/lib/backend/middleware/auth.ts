import { NextRequest, NextResponse } from "next/server";
import { JwtPayload } from "jsonwebtoken";

import { verifyToken } from "@/lib/backend/handlers/jwt";
import { prisma } from "@/lib/backend/prisma";
import { UserOneRole } from "@/lib/constants/roles";
import { User } from "@/types/user";

export type UserRole = UserOneRole;

export async function requireAuth(
  req: NextRequest,
): Promise<User | NextResponse> {
  const authHeader = req.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized: no token provided",
      },
      { status: 401 },
    );
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyToken(token) as JwtPayload;

    if (!payload.id) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: invalid token",
        },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        id: String(payload.id),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        officeId: true,
        isActive: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized: user not found",
        },
        { status: 401 },
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        {
          success: false,
          message: "Your account has been deactivated",
        },
        { status: 403 },
      );
    }

    return {
      userId: user.id,
      role: user.role as UserRole,
      user,
    };
  } catch (error) {
    console.error("Auth error:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized: invalid or expired token",
      },
      { status: 401 },
    );
  }
}

// =====================================================
// WITH AUTH + ROLE AUTHORIZATION
// =====================================================

export function withAuth(
  handler: (
    req: NextRequest,
    context?: any,
    data?: any,
    auth?: User,
  ) => Promise<Response> | Response,
  allowedRoles?: UserRole[],
) {
  return async (req: NextRequest, context?: any) => {
    const auth = await requireAuth(req);

    if (auth instanceof NextResponse) {
      return auth;
    }
    // Role authorization
    if (allowedRoles && !allowedRoles.includes(auth.role)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Forbidden: you do not have permission to perform this action",
        },
        { status: 403 },
      );
    }

    return handler(req, context, undefined, auth);
  };
}
