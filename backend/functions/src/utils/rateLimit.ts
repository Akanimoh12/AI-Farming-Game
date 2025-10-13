/**
 * Rate limiting utilities using Firestore
 */

import * as admin from "firebase-admin";
import { createError, ErrorCode } from "./errors";
import { RateLimitRecord } from "../types";
import * as functions from "firebase-functions";

/**
 * Rate limiter configuration
 */
interface RateLimiterConfig {
  maxAttempts: number;
  windowMs: number;
  blockDurationMs?: number;
}

/**
 * Check rate limit for identifier
 */
export const checkRateLimit = async (
  identifier: string,
  config: RateLimiterConfig
): Promise<boolean> => {
  const db = admin.firestore();
  const rateLimitRef = db.collection("rate_limits").doc(identifier);

  try {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    const doc = await rateLimitRef.get();

    if (!doc.exists) {
      // First attempt
      await rateLimitRef.set({
        identifier,
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false,
      } as RateLimitRecord);
      return true;
    }

    const data = doc.data() as RateLimitRecord;

    // Check if blocked
    if (data.blocked) {
      const blockExpiry = data.lastAttempt + (config.blockDurationMs || config.windowMs * 2);
      if (now < blockExpiry) {
        functions.logger.warn("Rate limit blocked:", { identifier, expiresIn: blockExpiry - now });
        return false;
      }
      // Reset after block expires
      await rateLimitRef.set({
        identifier,
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false,
      } as RateLimitRecord);
      return true;
    }

    // Check if outside window (reset counter)
    if (data.firstAttempt < windowStart) {
      await rateLimitRef.set({
        identifier,
        attempts: 1,
        firstAttempt: now,
        lastAttempt: now,
        blocked: false,
      } as RateLimitRecord);
      return true;
    }

    // Increment attempts
    const newAttempts = data.attempts + 1;

    if (newAttempts > config.maxAttempts) {
      // Block user
      await rateLimitRef.update({
        attempts: newAttempts,
        lastAttempt: now,
        blocked: true,
      });
      functions.logger.warn("Rate limit exceeded, blocking:", { identifier, attempts: newAttempts });
      return false;
    }

    // Update attempts
    await rateLimitRef.update({
      attempts: newAttempts,
      lastAttempt: now,
    });

    return true;
  } catch (error) {
    functions.logger.error("Rate limit check failed:", { identifier, error });
    // Fail open - allow request if rate limit check fails
    return true;
  }
};

/**
 * Rate limit middleware for HTTP functions
 */
export const rateLimitMiddleware = (config: RateLimiterConfig) => {
  return async (req: functions.Request, res: functions.Response, next: () => void) => {
    const identifier = req.ip || req.headers["x-forwarded-for"] || "unknown";

    const allowed = await checkRateLimit(identifier as string, config);

    if (!allowed) {
      const error = createError(
        ErrorCode.RATE_LIMIT_EXCEEDED,
        "Too many requests. Please try again later."
      );
      return res.status(error.statusCode).json({
        error: {
          code: error.code,
          message: error.message,
        },
      });
    }

    next();
  };
};

/**
 * Auth-specific rate limiter (stricter limits)
 */
export const authRateLimiter = async (walletAddress: string): Promise<void> => {
  const config: RateLimiterConfig = {
    maxAttempts: 5,
    windowMs: 60000, // 1 minute
    blockDurationMs: 300000, // 5 minutes
  };

  const allowed = await checkRateLimit(`auth:${walletAddress}`, config);

  if (!allowed) {
    throw createError(
      ErrorCode.TOO_MANY_ATTEMPTS,
      "Too many authentication attempts. Please try again in 5 minutes."
    );
  }
};

/**
 * Clear rate limit record (for testing or admin reset)
 */
export const clearRateLimit = async (identifier: string): Promise<void> => {
  const db = admin.firestore();
  await db.collection("rate_limits").doc(identifier).delete();
};

/**
 * Get rate limit status
 */
export const getRateLimitStatus = async (
  identifier: string
): Promise<RateLimitRecord | null> => {
  const db = admin.firestore();
  const doc = await db.collection("rate_limits").doc(identifier).get();

  if (!doc.exists) {
    return null;
  }

  return doc.data() as RateLimitRecord;
};
