/**
 * JWT token utilities for authentication
 */

import jwt from "jsonwebtoken";
import { customAlphabet } from "nanoid";
import { getConfig } from "./config";
import { createError, ErrorCode } from "./errors";
import { AuthToken } from "../types";
import * as functions from "firebase-functions";

const nanoid = customAlphabet("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz", 32);

/**
 * Generate authentication nonce
 */
export const generateNonce = (): string => {
  return nanoid();
};

/**
 * Generate authentication message for signing
 */
export const generateAuthMessage = (walletAddress: string, nonce: string): string => {
  return `Welcome to Orange Farm!\n\nSign this message to authenticate your wallet.\n\nWallet: ${walletAddress}\nNonce: ${nonce}\n\nThis request will not trigger a blockchain transaction or cost any gas fees.`;
};

/**
 * Generate JWT access token
 */
export const generateAccessToken = (walletAddress: string): string => {
  const config = getConfig();

  const payload = {
    sub: walletAddress,
    type: "access",
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiry,
    issuer: "orange-farm",
    audience: "orange-farm-client",
  });
};

/**
 * Generate JWT refresh token
 */
export const generateRefreshToken = (walletAddress: string): string => {
  const config = getConfig();

  const payload = {
    sub: walletAddress,
    type: "refresh",
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.refreshTokenExpiry,
    issuer: "orange-farm",
    audience: "orange-farm-client",
  });
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): jwt.JwtPayload => {
  const config = getConfig();

  try {
    const decoded = jwt.verify(token, config.auth.jwtSecret, {
      issuer: "orange-farm",
      audience: "orange-farm-client",
    });

    if (typeof decoded === "string") {
      throw new Error("Invalid token payload");
    }

    return decoded;
  } catch (error) {
    functions.logger.warn("Token verification failed:", { error });

    if (error instanceof jwt.TokenExpiredError) {
      throw createError(ErrorCode.INVALID_TOKEN, "Token has expired");
    }

    if (error instanceof jwt.JsonWebTokenError) {
      throw createError(ErrorCode.INVALID_TOKEN, "Invalid token");
    }

    throw createError(ErrorCode.INVALID_TOKEN, "Token verification failed");
  }
};

/**
 * Extract wallet address from token
 */
export const getWalletFromToken = (token: string): string => {
  const decoded = verifyToken(token);

  if (!decoded.sub) {
    throw createError(ErrorCode.INVALID_TOKEN, "Token missing subject");
  }

  return decoded.sub;
};

/**
 * Generate authentication token pair
 */
export const generateAuthTokens = (walletAddress: string): AuthToken => {
  const config = getConfig();
  const accessToken = generateAccessToken(walletAddress);
  const refreshToken = generateRefreshToken(walletAddress);

  // Calculate expiration timestamp (in seconds)
  const expiresIn = config.auth.jwtExpiry;
  const expirySeconds =
    expiresIn.endsWith("d")
      ? parseInt(expiresIn) * 24 * 60 * 60
      : parseInt(expiresIn);

  return {
    token: accessToken,
    refreshToken,
    expiresAt: Math.floor(Date.now() / 1000) + expirySeconds,
    walletAddress,
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = (refreshToken: string): AuthToken => {
  const decoded = verifyToken(refreshToken);

  if (decoded.type !== "refresh") {
    throw createError(ErrorCode.INVALID_TOKEN, "Invalid refresh token");
  }

  if (!decoded.sub) {
    throw createError(ErrorCode.INVALID_TOKEN, "Refresh token missing subject");
  }

  return generateAuthTokens(decoded.sub);
};

/**
 * Extract token from authorization header
 */
export const extractTokenFromHeader = (authHeader: string | undefined): string => {
  if (!authHeader) {
    throw createError(ErrorCode.UNAUTHORIZED, "Missing authorization header");
  }

  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw createError(ErrorCode.UNAUTHORIZED, "Invalid authorization header format");
  }

  return parts[1];
};
