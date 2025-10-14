// Contract Types
export interface ContractAddresses {
  landNFT: `0x${string}`
  seedNFT: `0x${string}`
  botNFT: `0x${string}`
  orangeToken: `0x${string}`
  marketplace: `0x${string}`
  harvestSettlement: `0x${string}`
}

export interface Land {
  tokenId: bigint
  size: 'Small' | 'Medium' | 'Large'
  plots: number
  boostMultiplier: number
  owner: `0x${string}`
}

export interface Seed {
  tokenId: bigint
  tier: 'Common' | 'Rare' | 'Epic' | 'Legendary'
  growthTime: number
  baseYield: bigint
  owner: `0x${string}`
}

export interface Bot {
  tokenId: bigint
  tier: 'Basic' | 'Advanced' | 'Elite'
  efficiency: number
  speedBoost: number
  yieldBoost: number
  owner: `0x${string}`
}

export interface MarketplaceListing {
  listingId: bigint
  seller: `0x${string}`
  nftContract: `0x${string}`
  tokenId: bigint
  price: bigint
  active: boolean
  listingType: 'Land' | 'Seed' | 'Bot'
}

export interface HarvestData {
  amount: bigint
  timestamp: number
  landId: bigint
  seedId: bigint
  botId?: bigint
}

// Transaction Types
export interface TransactionStatus {
  hash: `0x${string}`
  status: 'pending' | 'success' | 'error'
  error?: string
}

export interface ContractWriteResult {
  hash: `0x${string}`
  wait: () => Promise<void>
}
