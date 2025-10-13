/**
 * Core type definitions for Orange Farm backend
 */

export interface WalletAddress {
  address: string;
  normalized: string;
}

export interface UserProfile {
  walletAddress: string;
  username: string;
  avatarUrl?: string;
  referralCode: string;
  referredBy?: string;
  registeredAt: number;
  stats: UserStats;
  settings: UserSettings;
  security: SecurityInfo;
}

export interface UserStats {
  totalOranges: number;
  lifetimeOranges: number;
  totalHarvests: number;
  activeBots: number;
  totalLands: number;
  waterBalance: number;
  currentStreak: number;
  longestStreak: number;
  lastActive: number;
  lastHarvest: number;
  lastDailyMint: number;
  level: number;
  experience: number;
}

export interface UserSettings {
  notifications: boolean;
  sounds: boolean;
  animations: boolean;
  language: string;
  theme: "light" | "dark";
}

export interface SecurityInfo {
  lastLogin: number;
  loginCount: number;
  signatureProof?: string;
  ipAddresses: string[];
  suspicious: boolean;
}

export interface LandAsset {
  tokenId: string;
  type: "small" | "medium" | "large";
  capacity: number;
  currentBots: number;
  assignedBotIds: string[];
  purchaseDate: number;
  position?: { x: number; y: number };
  skin?: string;
}

export interface BotAsset {
  tokenId: string;
  type: "basic" | "advanced" | "elite";
  harvestRate: number;
  waterConsumption: number;
  assignedLandId?: string;
  isActive: boolean;
  totalHarvests: number;
  purchaseDate: number;
  upgradeHistory: BotUpgrade[];
}

export interface BotUpgrade {
  fromType: string;
  toType: string;
  timestamp: number;
  cost: string;
}

export interface WaterInventory {
  balance: number;
  lastPurchase: number;
  totalPurchased: number;
  totalConsumed: number;
}

export interface Transaction {
  txId: string;
  walletAddress: string;
  type: "purchase" | "harvest" | "upgrade" | "transfer" | "mint";
  status: "pending" | "confirmed" | "failed";
  blockHeight?: number;
  timestamp: number;
  details: TransactionDetails;
}

export interface TransactionDetails {
  assetType?: "land" | "bot" | "water";
  assetId?: string;
  amount?: string;
  price?: string;
  from?: string;
  to?: string;
}

export interface LeaderboardEntry {
  rank: number;
  walletAddress: string;
  username: string;
  avatarUrl?: string;
  totalOranges: number;
  activeBots: number;
  lastUpdate: number;
  season: number;
  rewardClaimed: boolean;
}

export interface ActivityEvent {
  id: string;
  walletAddress: string;
  type: "purchase" | "harvest" | "achievement" | "referral" | "upgrade";
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface GameConfig {
  harvestCycleMinutes: number;
  prices: PricingConfig;
  features: FeatureFlags;
  maintenance: MaintenanceInfo;
  season: SeasonInfo;
}

export interface PricingConfig {
  land: {
    small: string;
    medium: string;
    large: string;
  };
  bot: {
    basic: string;
    advanced: string;
    elite: string;
  };
  water: {
    pack: string;
    barrel: string;
  };
  upgrades: {
    basicToAdvanced: string;
    advancedToElite: string;
  };
}

export interface FeatureFlags {
  marketplaceEnabled: boolean;
  harvestEnabled: boolean;
  upgradesEnabled: boolean;
  leaderboardEnabled: boolean;
  referralsEnabled: boolean;
}

export interface MaintenanceInfo {
  enabled: boolean;
  message?: string;
  startTime?: number;
  endTime?: number;
}

export interface SeasonInfo {
  current: number;
  startTime: number;
  endTime: number;
  rewardsPool: string;
}

export interface AuthNonce {
  nonce: string;
  walletAddress: string;
  createdAt: number;
  expiresAt: number;
  used: boolean;
}

export interface AuthToken {
  token: string;
  refreshToken: string;
  expiresAt: number;
  walletAddress: string;
}

export interface RateLimitRecord {
  identifier: string;
  attempts: number;
  firstAttempt: number;
  lastAttempt: number;
  blocked: boolean;
}

export interface HarvestResult {
  walletAddress: string;
  orangesHarvested: number;
  waterConsumed: number;
  activeBots: number;
  timestamp: number;
  cycleId: string;
}

export interface MarketplaceListing {
  assetType: "land" | "bot" | "water";
  assetSubtype: string;
  price: string;
  available: boolean;
  description: string;
  stats: Record<string, any>;
}

export interface PurchaseRequest {
  walletAddress: string;
  assetType: "land" | "bot" | "water";
  assetSubtype: string;
  quantity: number;
  price: string;
}

export interface PurchaseConfirmation {
  txId: string;
  walletAddress: string;
  assetType: string;
  assetSubtype: string;
  quantity: number;
  tokenIds: string[];
  timestamp: number;
}
