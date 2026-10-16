import { NextRequest, NextResponse } from "next/server";
import { JwtPayload } from "jsonwebtoken";

import { ACCESS_COOKIE } from "@/lib/backend/cookies";
import { verifyToken } from "@/lib/backend/handlers/jwt";
import { prisma } from "@/lib/backend/prisma";
import { UserOneRole } from "@/lib/constants/roles";
import { User } from "@/types/user";

export type UserRole = UserOneRole;

type AccessPayload = JwtPayload & {
  role?: string;
  officeId?: string | null;
  name?: string;
  email?: string;
};

export type AuthResult =
  | { ok: true; auth: User }
  | { ok: false; status: number; message: string };

function userFromClaims(payload: AccessPayload): User | null {
  if (!payload.id || !payload.role || !payload.email) return null;

  return {
    userId: String(payload.id),
    role: payload.role as UserRole,
    user: {
      id: String(payload.id),
      name: String(payload.name || ""),
      email: String(payload.email),
      role: String(payload.role),
      officeId: payload.officeId ? String(payload.officeId) : null,
      isActive: true,
      description: null,
      createdAt: new Date(0),
      updatedAt: new Date(0),
    },
  };
}

export function readAccessToken(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  return req.cookies.get(ACCESS_COOKIE)?.value || null;
}

export async function authenticateToken(token: string): Promise<AuthResult> {
  try {
    const payload = verifyToken(token) as AccessPayload;

    if (!payload.id) {
      return { ok: false, status: 401, message: "Unauthorized: invalid token" };
    }

    const fromClaims = userFromClaims(payload);
    if (fromClaims) {
      return { ok: true, auth: fromClaims };
    }

    const user = await prisma.user.findUnique({
      where: { id: String(payload.id) },
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
      return { ok: false, status: 401, message: "Unauthorized: user not found" };
    }

    if (!user.isActive) {
      return {
        ok: false,
        status: 403,
        message: "Your account has been deactivated",
      };
    }

    return {
      ok: true,
      auth: {
        userId: user.id,
        role: user.role as UserRole,
        user,
      },
    };
  } catch (error) {
    console.error("Auth error:", error);
    return {
      ok: false,
      status: 401,
      message: "Unauthorized: invalid or expired token",
    };
  }
}

export async function requireAuth(
  req: NextRequest,
): Promise<User | NextResponse> {
  const token = readAccessToken(req);

  if (!token) {
    return NextResponse.json(
      {
        success: false,
        message: "Unauthorized: no token provided",
      },
      { status: 401 },
    );
  }

  const result = await authenticateToken(token);
  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status },
    );
  }

  return result.auth;
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
