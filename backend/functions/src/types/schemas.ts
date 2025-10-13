/**
 * Zod validation schemas for API requests and responses
 */

import { z } from "zod";

// Ethereum address validation
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address");

// Authentication schemas
export const challengeRequestSchema = z.object({
  walletAddress: ethereumAddressSchema,
});

export const verifyRequestSchema = z.object({
  walletAddress: ethereumAddressSchema,
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/, "Invalid signature"),
  nonce: z.string().min(16).max(64),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(32),
});

// User profile schemas
export const updateProfileSchema = z.object({
  username: z.string().min(3).max(20).optional(),
  avatarUrl: z.string().url().optional(),
  settings: z
    .object({
      notifications: z.boolean().optional(),
      sounds: z.boolean().optional(),
      animations: z.boolean().optional(),
      language: z.string().length(2).optional(),
      theme: z.enum(["light", "dark"]).optional(),
    })
    .optional(),
});

// Asset management schemas
export const assignBotSchema = z.object({
  botTokenId: z.string(),
  landTokenId: z.string(),
});

export const unassignBotSchema = z.object({
  botTokenId: z.string(),
});

export const upgradeBotSchema = z.object({
  botTokenId: z.string(),
  toType: z.enum(["advanced", "elite"]),
});

// Marketplace schemas
export const purchaseRequestSchema = z.object({
  assetType: z.enum(["land", "bot", "water"]),
  assetSubtype: z.string(),
  quantity: z.number().int().positive().max(100),
});

export const confirmPurchaseSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
  assetType: z.enum(["land", "bot", "water"]),
  tokenIds: z.array(z.string()).min(1).max(100),
});

// Harvest schemas
export const settleHarvestSchema = z.object({
  cycleId: z.string(),
  timestamp: z.number().int().positive(),
});

// Leaderboard schemas
export const leaderboardQuerySchema = z.object({
  limit: z.number().int().positive().max(100).default(50),
  offset: z.number().int().nonnegative().default(0),
  season: z.number().int().positive().optional(),
});

export const friendsLeaderboardSchema = z.object({
  walletAddress: ethereumAddressSchema,
  limit: z.number().int().positive().max(100).default(50),
});

// Sync schemas
export const syncRequestSchema = z.object({
  walletAddress: ethereumAddressSchema,
  forceRefresh: z.boolean().default(false),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Query parameter helpers
export const parseQueryParams = <T extends z.ZodTypeAny>(
  schema: T,
  params: Record<string, any>
): z.infer<T> => {
  return schema.parse(params);
};

// Validate and sanitize user input
export const sanitizeInput = (input: string): string => {
  return input.trim().replace(/[<>]/g, "");
};

// Type exports
export type ChallengeRequest = z.infer<typeof challengeRequestSchema>;
export type VerifyRequest = z.infer<typeof verifyRequestSchema>;
export type RefreshTokenRequest = z.infer<typeof refreshTokenSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type AssignBot = z.infer<typeof assignBotSchema>;
export type UnassignBot = z.infer<typeof unassignBotSchema>;
export type UpgradeBot = z.infer<typeof upgradeBotSchema>;
export type PurchaseRequest = z.infer<typeof purchaseRequestSchema>;
export type ConfirmPurchase = z.infer<typeof confirmPurchaseSchema>;
export type SettleHarvest = z.infer<typeof settleHarvestSchema>;
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
export type FriendsLeaderboard = z.infer<typeof friendsLeaderboardSchema>;
export type SyncRequest = z.infer<typeof syncRequestSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
