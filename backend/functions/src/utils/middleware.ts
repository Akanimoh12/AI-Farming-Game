/**
 * Authentication middleware for Cloud Functions
 */

import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { extractTokenFromHeader, verifyToken } from "./jwt";
import { createError, ErrorCode } from "./errors";
import { getConfig } from "./config";

// Extend Request type to include authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: {
        walletAddress: string;
        uid: string;
      };
    }
  }
}

/**
 * Authentication middleware - verifies JWT token
 */
export const authMiddleware = async (
  req: functions.Request,
  res: functions.Response,
  next: () => void
): Promise<void> => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    const decoded = verifyToken(token);

    if (!decoded.sub) {
      throw createError(ErrorCode.UNAUTHORIZED, "Invalid token");
    }

    // Attach user to request
    req.user = {
      walletAddress: decoded.sub,
      uid: decoded.sub,
    };

    next();
  } catch (error) {
    const appError = error as any;
    res.status(appError.statusCode || 401).json({
      error: {
        code: appError.code || ErrorCode.UNAUTHORIZED,
        message: appError.message || "Unauthorized",
      },
    });
  }
};

/**
 * Optional authentication middleware - doesn't fail if no token
 */
export const optionalAuthMiddleware = async (
  req: functions.Request,
  res: functions.Response,
  next: () => void
): Promise<void> => {
  try {
    if (req.headers.authorization) {
      const token = extractTokenFromHeader(req.headers.authorization);
      const decoded = verifyToken(token);

      if (decoded.sub) {
        req.user = {
          walletAddress: decoded.sub,
          uid: decoded.sub,
        };
      }
    }
  } catch (error) {
    // Silently fail - optional auth
    functions.logger.debug("Optional auth failed:", error);
  }

  next();
};

/**
 * Admin middleware - verifies user has admin role
 */
export const adminMiddleware = async (
  req: functions.Request,
  res: functions.Response,
  next: () => void
): Promise<void> => {
  if (!req.user) {
    return res.status(401).json({
      error: {
        code: ErrorCode.UNAUTHORIZED,
        message: "Unauthorized",
      },
    });
  }

  try {
    const db = admin.firestore();
    const adminDoc = await db.collection("admins").doc(req.user.walletAddress).get();

    if (!adminDoc.exists) {
      throw createError(
        ErrorCode.INSUFFICIENT_PERMISSIONS,
        "Admin privileges required"
      );
    }

    next();
  } catch (error) {
    const appError = error as any;
    res.status(appError.statusCode || 403).json({
      error: {
        code: appError.code || ErrorCode.FORBIDDEN,
        message: appError.message || "Forbidden",
      },
    });
  }
};

/**
 * Maintenance mode middleware - blocks requests during maintenance
 */
export const maintenanceMiddleware = async (
  req: functions.Request,
  res: functions.Response,
  next: () => void
): Promise<void> => {
  const config = getConfig();

  if (config.features.maintenanceMode) {
    // Allow admin users during maintenance
    if (req.user) {
      const db = admin.firestore();
      const adminDoc = await db.collection("admins").doc(req.user.walletAddress).get();

      if (adminDoc.exists) {
        return next();
      }
    }

    return res.status(503).json({
      error: {
        code: ErrorCode.MAINTENANCE_MODE,
        message: "System is currently under maintenance. Please try again later.",
      },
    });
  }

  next();
};

/**
 * CORS middleware - handles cross-origin requests
 */
export const corsMiddleware = (
  req: functions.Request,
  res: functions.Response,
  next: () => void
): void => {
  const config = getConfig();
  const origin = req.headers.origin;

  if (origin && config.cors.allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400"); // 24 hours

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(204).send();
    return;
  }

  next();
};

/**
 * Combine multiple middleware functions
 */
export const composeMiddleware = (
  ...middlewares: Array<
    (req: functions.Request, res: functions.Response, next: () => void) => void | Promise<void>
  >
) => {
  return async (req: functions.Request, res: functions.Response): Promise<void> => {
    let index = 0;

    const next = async (): Promise<void> => {
      if (index >= middlewares.length) return;

      const middleware = middlewares[index++];
      await middleware(req, res, next);
    };

    await next();
  };
};
