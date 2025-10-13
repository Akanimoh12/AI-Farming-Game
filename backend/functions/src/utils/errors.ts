/**
 * Standardized error handling for Cloud Functions
 */

import * as functions from "firebase-functions";

export enum ErrorCode {
  // Authentication errors (401)
  UNAUTHORIZED = "UNAUTHORIZED",
  INVALID_SIGNATURE = "INVALID_SIGNATURE",
  EXPIRED_NONCE = "EXPIRED_NONCE",
  INVALID_TOKEN = "INVALID_TOKEN",

  // Authorization errors (403)
  FORBIDDEN = "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS = "INSUFFICIENT_PERMISSIONS",

  // Validation errors (400)
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_WALLET_ADDRESS = "INVALID_WALLET_ADDRESS",
  INVALID_ASSET_TYPE = "INVALID_ASSET_TYPE",

  // Resource errors (404)
  NOT_FOUND = "NOT_FOUND",
  USER_NOT_FOUND = "USER_NOT_FOUND",
  ASSET_NOT_FOUND = "ASSET_NOT_FOUND",

  // Rate limiting (429)
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  TOO_MANY_ATTEMPTS = "TOO_MANY_ATTEMPTS",

  // Blockchain errors (500)
  BLOCKCHAIN_ERROR = "BLOCKCHAIN_ERROR",
  TRANSACTION_FAILED = "TRANSACTION_FAILED",
  CONTRACT_CALL_FAILED = "CONTRACT_CALL_FAILED",

  // Server errors (500)
  INTERNAL_ERROR = "INTERNAL_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_SERVICE_ERROR = "EXTERNAL_SERVICE_ERROR",

  // Maintenance (503)
  MAINTENANCE_MODE = "MAINTENANCE_MODE",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
}

export class AppError extends Error {
  constructor(
    public code: ErrorCode,
    public message: string,
    public statusCode: number,
    public details?: any
  ) {
    super(message);
    this.name = "AppError";
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/**
 * Map error codes to HTTP status codes
 */
const getStatusCode = (code: ErrorCode): number => {
  switch (code) {
    case ErrorCode.UNAUTHORIZED:
    case ErrorCode.INVALID_SIGNATURE:
    case ErrorCode.EXPIRED_NONCE:
    case ErrorCode.INVALID_TOKEN:
      return 401;

    case ErrorCode.FORBIDDEN:
    case ErrorCode.INSUFFICIENT_PERMISSIONS:
      return 403;

    case ErrorCode.INVALID_INPUT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
    case ErrorCode.INVALID_WALLET_ADDRESS:
    case ErrorCode.INVALID_ASSET_TYPE:
      return 400;

    case ErrorCode.NOT_FOUND:
    case ErrorCode.USER_NOT_FOUND:
    case ErrorCode.ASSET_NOT_FOUND:
      return 404;

    case ErrorCode.RATE_LIMIT_EXCEEDED:
    case ErrorCode.TOO_MANY_ATTEMPTS:
      return 429;

    case ErrorCode.MAINTENANCE_MODE:
    case ErrorCode.SERVICE_UNAVAILABLE:
      return 503;

    default:
      return 500;
  }
};

/**
 * Create an AppError instance
 */
export const createError = (
  code: ErrorCode,
  message: string,
  details?: any
): AppError => {
  return new AppError(code, message, getStatusCode(code), details);
};

/**
 * Format error response
 */
export const formatErrorResponse = (error: AppError | Error): ErrorResponse => {
  if (error instanceof AppError) {
    return {
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    };
  }

  // Handle unknown errors
  return {
    error: {
      code: ErrorCode.INTERNAL_ERROR,
      message: "An unexpected error occurred",
      details: process.env.NODE_ENV === "development" ? error.message : undefined,
    },
  };
};

/**
 * Send error response
 */
export const sendError = (
  res: functions.Response,
  error: AppError | Error
): void => {
  const statusCode = error instanceof AppError ? error.statusCode : 500;
  const errorResponse = formatErrorResponse(error);

  // Log error for monitoring
  if (statusCode >= 500) {
    functions.logger.error("Server error:", {
      error: errorResponse,
      stack: error.stack,
    });
  } else {
    functions.logger.warn("Client error:", errorResponse);
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error handler wrapper
 */
export const asyncHandler = (
  fn: (req: functions.Request, res: functions.Response) => Promise<any>
) => {
  return async (req: functions.Request, res: functions.Response): Promise<void> => {
    try {
      await fn(req, res);
    } catch (error) {
      sendError(res, error as Error);
    }
  };
};

/**
 * Validation error helper
 */
export const throwValidationError = (message: string, details?: any): never => {
  throw createError(ErrorCode.INVALID_INPUT, message, details);
};

/**
 * Authorization error helper
 */
export const throwUnauthorizedError = (message: string = "Unauthorized"): never => {
  throw createError(ErrorCode.UNAUTHORIZED, message);
};

/**
 * Not found error helper
 */
export const throwNotFoundError = (resource: string): never => {
  throw createError(ErrorCode.NOT_FOUND, `${resource} not found`);
};

/**
 * Rate limit error helper
 */
export const throwRateLimitError = (): never => {
  throw createError(
    ErrorCode.RATE_LIMIT_EXCEEDED,
    "Too many requests. Please try again later."
  );
};

/**
 * Maintenance mode error helper
 */
export const throwMaintenanceError = (message?: string): never => {
  throw createError(
    ErrorCode.MAINTENANCE_MODE,
    message || "System is currently under maintenance. Please try again later."
  );
};
