import "server-only";
import { NextResponse } from "next/server";
import { AppError, toStatusCode } from "@/lib/errors";

export type ApiSuccess<T> = { ok: true; data: T };
export type ApiError = { ok: false; code: string; message: string; details?: unknown };
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function apiOk<T>(data: T, status = 200): NextResponse<ApiSuccess<T>> {
  return NextResponse.json({ ok: true, data }, { status });
}

export function apiErr(
  error: unknown,
  fallbackMessage = "An unexpected error occurred",
): NextResponse<ApiError> {
  if (error instanceof AppError) {
    return NextResponse.json(
      { ok: false, code: error.code, message: error.message, details: error.details },
      { status: error.statusCode },
    );
  }
  console.error("[api] unhandled error:", error);
  return NextResponse.json(
    { ok: false, code: "INTERNAL_ERROR", message: fallbackMessage },
    { status: 500 },
  );
}

export function apiNotFound(resource: string): NextResponse<ApiError> {
  return NextResponse.json(
    { ok: false, code: "NOT_FOUND", message: `${resource} not found` },
    { status: 404 },
  );
}

export function apiForbidden(reason?: string): NextResponse<ApiError> {
  return NextResponse.json(
    { ok: false, code: "FORBIDDEN", message: reason ?? "Access denied" },
    { status: 403 },
  );
}
