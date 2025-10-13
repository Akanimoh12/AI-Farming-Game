/**
 * Configuration management for Cloud Functions
 */

import * as functions from "firebase-functions";

export interface AppConfig {
  firebase: {
    projectId: string;
    region: string;
  };
  somnia: {
    rpcUrl: string;
    chainId: number;
    explorerUrl: string;
  };
  contracts: {
    mockOrangeToken: string;
    landNFT: string;
    botNFT: string;
    waterToken: string;
    gameRegistry: string;
    marketplace: string;
    harvestSettlement: string;
  };
  auth: {
    jwtSecret: string;
    jwtExpiry: string;
    refreshTokenExpiry: string;
    nonceExpiryMinutes: number;
  };
  rateLimit: {
    max: number;
    windowMs: number;
    authMax: number;
    authWindowMs: number;
  };
  admin: {
    privateKey: string;
    walletAddress: string;
  };
  game: {
    harvestCycleMinutes: number;
    leaderboardRefreshMinutes: number;
    dailyRewardResetHour: number;
  };
  cors: {
    allowedOrigins: string[];
  };
  features: {
    maintenanceMode: boolean;
    harvestAutoSettlement: boolean;
    leaderboardCache: boolean;
  };
  cache: {
    ttlLeaderboard: number;
    ttlMarketplace: number;
    ttlUserProfile: number;
  };
  logging: {
    level: string;
  };
}

/**
 * Load configuration from environment variables
 */
export const loadConfig = (): AppConfig => {
  const getEnv = (key: string, defaultValue?: string): string => {
    const value = process.env[key] || defaultValue;
    if (!value) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
  };

  const getEnvNumber = (key: string, defaultValue: number): number => {
    const value = process.env[key];
    return value ? parseInt(value, 10) : defaultValue;
  };

  const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
    const value = process.env[key];
    return value ? value === "true" : defaultValue;
  };

  return {
    firebase: {
      projectId: getEnv("FIREBASE_PROJECT_ID", functions.config().project?.id || "orange-farm-dev"),
      region: getEnv("FIREBASE_REGION", "us-central1"),
    },
    somnia: {
      rpcUrl: getEnv("SOMNIA_RPC_URL"),
      chainId: getEnvNumber("SOMNIA_CHAIN_ID", 50311),
      explorerUrl: getEnv("SOMNIA_EXPLORER_URL", "https://explorer.somnia.network"),
    },
    contracts: {
      mockOrangeToken: getEnv("CONTRACT_MOCK_ORANGE_TOKEN"),
      landNFT: getEnv("CONTRACT_LAND_NFT"),
      botNFT: getEnv("CONTRACT_BOT_NFT"),
      waterToken: getEnv("CONTRACT_WATER_TOKEN"),
      gameRegistry: getEnv("CONTRACT_GAME_REGISTRY"),
      marketplace: getEnv("CONTRACT_MARKETPLACE"),
      harvestSettlement: getEnv("CONTRACT_HARVEST_SETTLEMENT"),
    },
    auth: {
      jwtSecret: getEnv("JWT_SECRET"),
      jwtExpiry: getEnv("JWT_EXPIRY", "7d"),
      refreshTokenExpiry: getEnv("REFRESH_TOKEN_EXPIRY", "30d"),
      nonceExpiryMinutes: getEnvNumber("NONCE_EXPIRY_MINUTES", 5),
    },
    rateLimit: {
      max: getEnvNumber("RATE_LIMIT_MAX", 60),
      windowMs: getEnvNumber("RATE_LIMIT_WINDOW_MS", 60000),
      authMax: getEnvNumber("AUTH_RATE_LIMIT_MAX", 5),
      authWindowMs: getEnvNumber("AUTH_RATE_LIMIT_WINDOW_MS", 60000),
    },
    admin: {
      privateKey: getEnv("ADMIN_PRIVATE_KEY"),
      walletAddress: getEnv("ADMIN_WALLET_ADDRESS"),
    },
    game: {
      harvestCycleMinutes: getEnvNumber("HARVEST_CYCLE_MINUTES", 10),
      leaderboardRefreshMinutes: getEnvNumber("LEADERBOARD_REFRESH_MINUTES", 15),
      dailyRewardResetHour: getEnvNumber("DAILY_REWARD_RESET_HOUR", 0),
    },
    cors: {
      allowedOrigins: getEnv("ALLOWED_ORIGINS", "http://localhost:5173").split(","),
    },
    features: {
      maintenanceMode: getEnvBoolean("ENABLE_MAINTENANCE_MODE", false),
      harvestAutoSettlement: getEnvBoolean("ENABLE_HARVEST_AUTO_SETTLEMENT", true),
      leaderboardCache: getEnvBoolean("ENABLE_LEADERBOARD_CACHE", true),
    },
    cache: {
      ttlLeaderboard: getEnvNumber("CACHE_TTL_LEADERBOARD", 900),
      ttlMarketplace: getEnvNumber("CACHE_TTL_MARKETPLACE", 300),
      ttlUserProfile: getEnvNumber("CACHE_TTL_USER_PROFILE", 60),
    },
    logging: {
      level: getEnv("LOG_LEVEL", "info"),
    },
  };
};

// Singleton instance
let configInstance: AppConfig | null = null;

/**
 * Get application configuration
 */
export const getConfig = (): AppConfig => {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
};

/**
 * Validate configuration on startup
 */
export const validateConfig = (config: AppConfig): void => {
  const requiredFields: (keyof AppConfig)[] = ["somnia", "contracts", "auth"];

  for (const field of requiredFields) {
    if (!config[field]) {
      throw new Error(`Invalid configuration: missing ${field}`);
    }
  }

  // Validate contract addresses
  const addressRegex = /^0x[a-fA-F0-9]{40}$/;
  Object.entries(config.contracts).forEach(([name, address]) => {
    if (!addressRegex.test(address)) {
      throw new Error(`Invalid contract address for ${name}: ${address}`);
    }
  });

  // Validate JWT secret
  if (config.auth.jwtSecret.length < 32) {
    throw new Error("JWT secret must be at least 32 characters");
  }
};
