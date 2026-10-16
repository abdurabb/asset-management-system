import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import { JwtPayload } from "jsonwebtoken";

import { applyAuthCookies } from "@/lib/backend/cookies";
import { prisma } from "@/lib/backend/prisma";
import { generateToken, verifyToken, type AccessClaims } from "@/lib/backend/handlers/jwt";
import { handleError } from "../handlers/handleError";
import { AppError } from "@/types/error.types";
import { LoginPayload } from "@/types/auth";

export async function loginController(
  req: NextRequest,
  _context?: unknown,
  data?: LoginPayload,
): Promise<NextResponse> {
  try {
    if (!data?.email || !data?.password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 },
      );
    }

    const { email, password } = data;

    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
        },
        { status: 401 },
      );
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid credentials",
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

    const claims: AccessClaims = {
      role: user.role,
      officeId: user.officeId,
      name: user.name,
      email: user.email,
    };
    const access_token = generateToken(user.id, "1h", claims);
    const refresh_token = generateToken(user.id, "7d", claims);

    return applyAuthCookies(
      NextResponse.json(
        {
          success: true,
          message: "Login successful",
          access_token,
          refresh_token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            officeId: user.officeId,
          },
        },
        { status: 200 },
      ),
      access_token,
      refresh_token,
    );
  } catch (error) {
    return handleError(error as AppError);
  }
}

export async function refreshController(
  req: NextRequest,
  _context?: unknown,
  data?: { refresh_token: string },
): Promise<NextResponse> {
  try {
    if (!data?.refresh_token) {
      return NextResponse.json(
        { success: false, message: "Refresh token is required" },
        { status: 400 },
      );
    }

    const payload = verifyToken(data.refresh_token) as JwtPayload;

    if (!payload.id) {
      return NextResponse.json(
        { success: false, message: "Invalid refresh token" },
        { status: 401 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: String(payload.id) },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 },
      );
    }

    const claims: AccessClaims = {
      role: user.role,
      officeId: user.officeId,
      name: user.name,
      email: user.email,
    };
    const access_token = generateToken(user.id, "1h", claims);
    const refresh_token = generateToken(user.id, "7d", claims);

    return applyAuthCookies(
      NextResponse.json({
        success: true,
        access_token,
        refresh_token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          officeId: user.officeId,
        },
      }),
      access_token,
      refresh_token,
    );
  } catch (error) {
    const err = error as Error;
    if (err.name === "TokenExpiredError" || err.name === "JsonWebTokenError") {
      return NextResponse.json(
        { success: false, message: "Invalid or expired refresh token" },
        { status: 401 },
      );
    }
    return handleError(error as AppError);
  }
}
