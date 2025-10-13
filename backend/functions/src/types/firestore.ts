/**
 * Firestore Data Model Type Definitions
 * Complete type safety for all Firestore collections in Orange Farm
 */

import { Timestamp, FieldValue } from "firebase-admin/firestore";

export interface UserDocument {
  walletAddress: string;
  username: string;
  avatarURL?: string;
  referralCode: string;
  referredBy?: string;
  stats: UserStats;
  progression: UserProgression;
  preferences: UserPreferences;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface UserStats {
  currentOranges: number;
  lifetimeOranges: number;
  mockOrangeDAOBalance: number;
  waterBalance: number;
  landCount: number;
  botCount: number;
  activeBotCapacity: number;
  level: number;
  experiencePoints: number;
}

export interface UserProgression {
  onboardingStep: number;
  tutorialCompleted: boolean;
  achievements: string[];
  loginStreak: number;
  lastLogin: Timestamp;
  lastDailyMint: Timestamp;
  lastHarvest: Timestamp;
}

export interface UserPreferences {
  audioEnabled: boolean;
  hapticsEnabled: boolean;
  locale: string;
  theme: "light" | "dark";
}

export type LandType = "small" | "medium" | "large";

export interface LandDocument {
  tokenId: number;
  landType: LandType;
  capacity: number;
  assignedBotIds: string[];
  gridPosition: {
    x: number;
    y: number;
    layer: number;
  };
  visualSkin?: string;
  purchaseDate: Timestamp;
  lastModified: Timestamp;
}

export type BotType = "basic" | "advanced" | "elite";

export interface BotDocument {
  tokenId: number;
  botType: BotType;
  harvestRate: number;
  waterConsumption: number;
  assignedLandId?: string;
  isActive: boolean;
  totalHarvests: number;
  upgradeHistory: BotUpgrade[];
  purchaseDate: Timestamp;
  lastModified: Timestamp;
}

export interface BotUpgrade {
  from: BotType;
  to: BotType;
  timestamp: Timestamp;
}

export interface LeaderboardDocument {
  rank: number;
  walletAddress: string;
  username: string;
  avatarURL?: string;
  lifetimeOranges: number;
  activeBots: number;
  lastHarvest: Timestamp;
  seasonId?: string;
  updatedAt: Timestamp;
}

export type ActivityType = "harvest" | "purchase" | "achievement" | "level_up" | "referral";

export interface ActivityDocument {
  type: ActivityType;
  description: string;
  metadata: Record<string, any>;
  timestamp: Timestamp;
}

export interface GameConfigDocument {
  harvestCycleMinutes: number;
  pricing: Record<string, number>;
  upgradeCosts: Record<string, number>;
  maintenanceMode: boolean;
  featureFlags: Record<string, boolean>;
  seasonConfig?: SeasonConfig;
}

export interface SeasonConfig {
  seasonId: string;
  startDate: Timestamp;
  endDate: Timestamp;
  multipliers: Record<string, number>;
}

export interface TransactionDocument {
  txHash: string;
  walletAddress: string;
  type: "purchase" | "harvest" | "upgrade" | "transfer" | "registration";
  status: "pending" | "confirmed" | "failed";
  assetType?: string;
  assetIds?: string[];
  amount?: number;
  blockNumber?: number;
  timestamp: Timestamp;
  metadata?: Record<string, any>;
}

export interface AuthNonceDocument {
  nonce: string;
  walletAddress: string;
  createdAt: Timestamp;
  expiresAt: Timestamp;
  used: boolean;
}

export interface RateLimitDocument {
  identifier: string;
  attempts: number;
  firstAttempt: Timestamp;
  lastAttempt: Timestamp;
  blocked: boolean;
  windowMs: number;
}

export interface AdminDocument {
  walletAddress: string;
  role: "super_admin" | "moderator" | "support";
  permissions: string[];
  addedBy: string;
  createdAt: Timestamp;
}

export interface SupportTicketDocument {
  ticketId: string;
  walletAddress: string;
  category: "technical" | "billing" | "gameplay" | "other";
  status: "open" | "in_progress" | "resolved" | "closed";
  subject: string;
  description: string;
  assignedTo?: string;
  priority: "low" | "medium" | "high" | "urgent";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  resolvedAt?: Timestamp;
  notes?: string[];
}

export interface CMSPageDocument {
  pageId: string;
  slug: string;
  title: string;
  content: Record<string, any>;
  published: boolean;
  locale: string;
  version: number;
  createdBy: string;
  lastModifiedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  publishedAt?: Timestamp;
}

export interface FirestoreCollections {
  users: UserDocument;
  "assets/{walletAddress}/lands": LandDocument;
  "assets/{walletAddress}/bots": BotDocument;
  leaderboard: LeaderboardDocument;
  "activities/{walletAddress}/events": ActivityDocument;
  "gameConfig/settings": GameConfigDocument;
  transactions: TransactionDocument;
  auth_nonces: AuthNonceDocument;
  rate_limits: RateLimitDocument;
  admins: AdminDocument;
  support: SupportTicketDocument;
  cms: CMSPageDocument;
}

export type CollectionName = keyof FirestoreCollections;

export interface BatchWriteOperation {
  type: "set" | "update" | "delete";
  collection: string;
  docId: string;
  data?: any;
  merge?: boolean;
}

export interface FirestoreQuery<T> {
  collection: string;
  where?: Array<{
    field: string;
    operator: FirebaseFirestore.WhereFilterOp;
    value: any;
  }>;
  orderBy?: Array<{
    field: string;
    direction: "asc" | "desc";
  }>;
  limit?: number;
  startAfter?: any;
}

export type FirestoreTimestamp = Timestamp | FieldValue;
