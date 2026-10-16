import { NextResponse } from "next/server";

import { AppError } from "@/types/error.types";

export const handleError = (error: AppError) => {
  if (error.name === "ValidationError") {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 400 },
    );
  }

  if (error.name === "ImageValidationError") {
    return NextResponse.json(
      {
        success: false,
        message: error.message,
      },
      { status: 400 },
    );
  }

  if (error.name === "CastError") {
    return NextResponse.json(
      {
        success: false,
        message: "Invalid ID",
      },
      { status: 400 },
    );
  }

  if (error.code === 11000) {
    return NextResponse.json(
      {
        success: false,
        message: "Duplicate key error",
      },
      { status: 400 },
    );
  }

  if (error.code === "ERR_BAD_REQUEST") {
    return NextResponse.json(
      {
        success: false,
        message: error.response?.data?.message || "Bad Request",
      },
      { status: 400 },
    );
  }

  if (error.code === "ER_ROW_IS_REFERENCED_2" || error.errno === 1451) {
    return NextResponse.json(
      {
        success: false,
        message:
          "Cannot delete this item because it is referenced by other records.",
      },
      { status: 400 },
    );
  }

  return NextResponse.json(
    {
      success: false,
      message: "Internal server error",
      error: error.message,
    },
    { status: 500 },
  );
};
