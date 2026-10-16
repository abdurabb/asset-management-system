import { NextRequest, NextResponse } from "next/server";
import Joi, { ObjectSchema } from "joi";

type RequestProperty = "body" | "params" | "query";

export function validate(
  schema: ObjectSchema,
  property: RequestProperty,
  handler: (
    req: NextRequest,
    context?: any,
    data?: any,
    auth?: any,
  ) => Promise<Response> | Response,
) {
  return async (
    req: NextRequest,
    context?: any,
    _incomingData?: any,
    auth?: any,
  ) => {
    let data: any;

    if (property === "body") {
      try {
        data = await req.json();
      } catch {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid or missing JSON body",
          },
          { status: 400 },
        );
      }
    }

    if (property === "query") {
      data = Object.fromEntries(
        new URL(req.url).searchParams.entries(),
      );
    }

    if (property === "params") {
      const rawParams = context?.params ?? {};
      data =
        typeof rawParams?.then === "function"
          ? await rawParams
          : rawParams;
    }

    if (property !== "query") {
      if (
        !data ||
        typeof data !== "object" ||
        Object.keys(data).length === 0
      ) {
        return NextResponse.json(
          {
            success: false,
            message: `${property} is missing`,
          },
          { status: 400 },
        );
      }
    }

    if (property === "query" && (!data || typeof data !== "object")) {
      data = {};
    }

    const { error, value } = schema.validate(data, {
      abortEarly: false,
      allowUnknown: false,
      stripUnknown: true,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: error.details.map((err) => err.message),
        },
        { status: 400 },
      );
    }

    return handler(req, context, value, auth);
  };
}
