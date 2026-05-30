import "server-only";

export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} not found: ${id}` : `${resource} not found`,
      "NOT_FOUND",
      404,
    );
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    details?: { field: string; message: string }[],
  ) {
    super(message, "VALIDATION_ERROR", 422, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(reason = "Authentication required") {
    super(reason, "UNAUTHORIZED", 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(reason = "You do not have permission to perform this action") {
    super(reason, "FORBIDDEN", 403);
  }
}

export class ConflictError extends AppError {
  constructor(resource: string, detail?: string) {
    super(
      detail ?? `${resource} already exists`,
      "CONFLICT",
      409,
    );
  }
}

export class RateLimitError extends AppError {
  constructor(public readonly retryAfterMs: number = 60_000) {
    super("Too many requests — please slow down", "RATE_LIMITED", 429);
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, cause?: unknown) {
    super(`Database error during ${operation}`, "DATABASE_ERROR", 500, cause);
  }
}

// Result type for no-throw style at service boundaries
export type AppResult<T, E extends AppError = AppError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): AppResult<T> {
  return { ok: true, value };
}

export function err<E extends AppError>(error: E): AppResult<never, E> {
  return { ok: false, error };
}

export function isAppError(e: unknown): e is AppError {
  return e instanceof AppError;
}

export function toStatusCode(e: unknown): number {
  return e instanceof AppError ? e.statusCode : 500;
}
