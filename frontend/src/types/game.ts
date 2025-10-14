import { Timestamp } from 'firebase/firestore'

// User Types (matching Firestore schema)
export interface UserProfile {
  walletAddress: string
  username?: string
  email?: string
  avatar?: string
  level: number
  experience: number
  totalHarvests: number
  totalEarnings: string
  joinedAt: Timestamp
  lastActive: Timestamp
  preferences: {
    notifications: boolean
    soundEffects: boolean
    musicVolume: number
  }
}

export interface UserAssets {
  lands: string[]
  seeds: string[]
  bots: string[]
  orangeBalance: string
}

export interface UserStats {
  totalPlots: number
  activePlots: number
  totalYield: string
  averageYieldPerHarvest: string
  fastestHarvest: number
  achievements: string[]
}

// Game Types
export interface PlotState {
  id: string
  landId: string
  seedId?: string
  botId?: string
  plantedAt?: Timestamp
  harvestReadyAt?: Timestamp
  status: 'empty' | 'planted' | 'growing' | 'ready'
  expectedYield?: string
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
  reward: {
    type: 'token' | 'nft' | 'badge'
    amount?: string
  }
  unlockedAt?: Timestamp
}

export interface Leaderboard {
  userId: string
  username: string
  avatar?: string
  totalHarvests: number
  totalEarnings: string
  rank: number
}

// Activity Types
export interface Activity {
  id: string
  type: 'harvest' | 'plant' | 'purchase' | 'sell' | 'achievement'
  userId: string
  timestamp: Timestamp
  data: Record<string, unknown>
}
