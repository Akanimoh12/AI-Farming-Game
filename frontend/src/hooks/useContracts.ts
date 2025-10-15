/**
 * Custom Wagmi Hooks for Orange Farm Smart Contracts
 * Direct blockchain integration without backend authentication
 * 
 * ✅ All contracts deployed to Somnia Dream Testnet (Chain ID: 50312)
 * ✅ ABIs imported from compiled contracts
 * ✅ Ready for real blockchain interactions
 */

import { useAccount, useReadContract, useReadContracts, useWriteContract, useWatchContractEvent } from 'wagmi'
import { parseUnits, formatUnits } from 'viem'

// Import compiled ABIs
import GameRegistryABI from '../lib/contracts/abis/GameRegistry.json'
import LandNFTABI from '../lib/contracts/abis/LandNFT.json'
import BotNFTABI from '../lib/contracts/abis/BotNFT.json'
import WaterTokenABI from '../lib/contracts/abis/WaterToken.json'
import MockOrangeTokenABI from '../lib/contracts/abis/MockOrangeToken.json'
import MarketplaceABI from '../lib/contracts/abis/Marketplace.json'
import HarvestSettlementABI from '../lib/contracts/abis/HarvestSettlement.json'
import RealTimeHarvestABI from '../lib/contracts/abis/RealTimeHarvest.json'

// Contract addresses (from .env - deployed to Somnia testnet)
export const CONTRACTS = {
  gameRegistry: (import.meta.env.VITE_GAME_REGISTRY_ADDRESS || '0x') as `0x${string}`,
  landNFT: (import.meta.env.VITE_LAND_NFT_ADDRESS || '0x') as `0x${string}`,
  botNFT: (import.meta.env.VITE_BOT_NFT_ADDRESS || '0x') as `0x${string}`,
  waterToken: (import.meta.env.VITE_WATER_TOKEN_ADDRESS || '0x') as `0x${string}`,
  mockOrangeToken: (import.meta.env.VITE_MOCK_ORANGE_TOKEN_ADDRESS || '0x') as `0x${string}`,
  marketplace: (import.meta.env.VITE_MARKETPLACE_ADDRESS || '0x') as `0x${string}`,
  harvestSettlement: (import.meta.env.VITE_HARVEST_SETTLEMENT_ADDRESS || '0x') as `0x${string}`,
  realTimeHarvest: (import.meta.env.VITE_REAL_TIME_HARVEST_ADDRESS || '0x') as `0x${string}`,
} as const

// Contract ABIs - extracted from compiled JSON
export const ABIS = {
  gameRegistry: GameRegistryABI.abi,
  landNFT: LandNFTABI.abi,
  botNFT: BotNFTABI.abi,
  waterToken: WaterTokenABI.abi,
  mockOrangeToken: MockOrangeTokenABI.abi,
  marketplace: MarketplaceABI.abi,
  harvestSettlement: HarvestSettlementABI.abi,
  realTimeHarvest: RealTimeHarvestABI.abi,
} as const

// Type definitions
export interface PlayerProfile {
  username: string
  referralCode: string
  referredBy: string
  registrationTimestamp: bigint
  hasClaimedStarter: boolean
}

export interface PlayerStats {
  totalOrangesCommitted: bigint
  level: number
  lastHarvestCommit: bigint
  totalHarvests: bigint
}

export interface LandInfo {
  owner: string
  landType: number
  assignedBotId: bigint
  lastHarvestTime: bigint
  isActive: boolean
}

export interface BotInfo {
  owner: string
  botType: number
  efficiency: number
  assignedLandId: bigint
  isActive: boolean
}

/**
 * Hook to check if contracts are properly configured
 */
export function useContractsConfigured() {
  const hasGameRegistry = CONTRACTS.gameRegistry !== '0x'
  const hasLandNFT = CONTRACTS.landNFT !== '0x'
  const hasBotNFT = CONTRACTS.botNFT !== '0x'
  const hasWaterToken = CONTRACTS.waterToken !== '0x'
  const hasMockOrangeToken = CONTRACTS.mockOrangeToken !== '0x'
  const hasMarketplace = CONTRACTS.marketplace !== '0x'
  const hasHarvestSettlement = CONTRACTS.harvestSettlement !== '0x'
  const hasRealTimeHarvest = CONTRACTS.realTimeHarvest !== '0x'

  const allConfigured =
    hasGameRegistry &&
    hasLandNFT &&
    hasBotNFT &&
    hasWaterToken &&
    hasMockOrangeToken &&
    hasMarketplace &&
    hasHarvestSettlement &&
    hasRealTimeHarvest

  return {
    configured: allConfigured,
    missing: {
      gameRegistry: !hasGameRegistry,
      landNFT: !hasLandNFT,
      botNFT: !hasBotNFT,
      waterToken: !hasWaterToken,
      mockOrangeToken: !hasMockOrangeToken,
      marketplace: !hasMarketplace,
      harvestSettlement: !hasHarvestSettlement,
      realTimeHarvest: !hasRealTimeHarvest,
    },
  }
}

/**
 * Hook to check if user is registered in the game
 */
export function useIsRegistered() {
  const { address } = useAccount()

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.gameRegistry,
    abi: ABIS.gameRegistry,
    functionName: 'isRegistered',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS.gameRegistry !== '0x',
    },
  })

  return {
    isRegistered: data as boolean | undefined,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get player profile from GameRegistry
 */
export function usePlayerProfile(playerAddress?: string) {
  const { address: connectedAddress } = useAccount()
  const address = (playerAddress || connectedAddress) as `0x${string}` | undefined

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.gameRegistry,
    abi: ABIS.gameRegistry,
    functionName: 'getPlayerProfile',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS.gameRegistry !== '0x',
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  })

  return {
    profile: data as PlayerProfile | undefined,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get player stats from GameRegistry
 */
export function usePlayerStats(playerAddress?: string) {
  const { address: connectedAddress } = useAccount()
  const address = (playerAddress || connectedAddress) as `0x${string}` | undefined

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.gameRegistry,
    abi: ABIS.gameRegistry,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS.gameRegistry !== '0x',
      refetchInterval: 15000, // Refetch every 15 seconds
    },
  })

  return {
    stats: data as PlayerStats | undefined,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get all user's token balances at once (optimized)
 */
export function useTokenBalances() {
  const { address } = useAccount()

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.mockOrangeToken,
        abi: ABIS.mockOrangeToken,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
      {
        address: CONTRACTS.waterToken,
        abi: ABIS.waterToken,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
    ],
    query: {
      enabled: !!address && CONTRACTS.mockOrangeToken !== '0x',
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  })

  return {
    orangeBalance: data?.[0]?.result as bigint | undefined,
    waterBalance: data?.[1]?.result as bigint | undefined,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get user's NFT counts (Land and Bot)
 */
export function useNFTCounts() {
  const { address } = useAccount()

  const { data, isLoading, error, refetch } = useReadContracts({
    contracts: [
      {
        address: CONTRACTS.landNFT,
        abi: ABIS.landNFT,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
      {
        address: CONTRACTS.botNFT,
        abi: ABIS.botNFT,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
    ],
    query: {
      enabled: !!address && CONTRACTS.landNFT !== '0x',
      refetchInterval: 15000,
    },
  })

  return {
    landCount: data?.[0]?.result as bigint | undefined,
    botCount: data?.[1]?.result as bigint | undefined,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get comprehensive dashboard stats
 * Combines multiple contract reads for efficiency
 */
export function useDashboardStats() {
  const { address } = useAccount()
  const { profile, isLoading: profileLoading } = usePlayerProfile()
  const { stats, isLoading: statsLoading } = usePlayerStats()
  const { orangeBalance, waterBalance, isLoading: balancesLoading } = useTokenBalances()
  const { landCount, botCount, isLoading: nftLoading } = useNFTCounts()

  const isLoading = profileLoading || statsLoading || balancesLoading || nftLoading

  return {
    // Profile data
    username: profile?.username || 'Anonymous Farmer',
    referralCode: profile?.referralCode || '',
    registeredAt: profile?.registrationTimestamp,
    
    // Stats
    totalOranges: stats?.totalOrangesCommitted || 0n,
    level: stats?.level || 1,
    totalHarvests: stats?.totalHarvests || 0n,
    lastHarvest: stats?.lastHarvestCommit,
    
    // Balances
    orangeTokenBalance: orangeBalance || 0n,
    waterBalance: waterBalance || 0n,
    
    // NFT counts
    landCount: Number(landCount || 0n),
    botCount: Number(botCount || 0n),
    
    isLoading,
    address,
  }
}

/**
 * Hook to register a new player
 */
export function useRegisterPlayer() {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract()

  const register = (username: string, referralCode?: string, referredByCode?: string) => {
    console.log('🔵 useRegisterPlayer - Initiating registration')
    console.log('Contract address:', CONTRACTS.gameRegistry)
    console.log('Username:', username)
    console.log('Referral code:', referralCode || '(empty)')
    console.log('Referred by code:', referredByCode || '(empty)')
    
    try {
      writeContract({
        address: CONTRACTS.gameRegistry,
        abi: ABIS.gameRegistry,
        functionName: 'register', // Fixed: was 'registerPlayer', should be 'register'
        args: [username, referralCode || '', referredByCode || ''], // 3 parameters required
      })
      console.log('✅ writeContract called successfully')
    } catch (err) {
      console.error('❌ Error calling writeContract:', err)
      throw err
    }
  }

  return {
    register,
    hash,
    isPending,
    isSuccess,
    error,
  }
}

/**
 * Hook to claim starter pack
 */
export function useClaimStarterPack() {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract()

  const claim = () => {
    writeContract({
      address: CONTRACTS.gameRegistry,
      abi: ABIS.gameRegistry,
      functionName: 'claimStarterPack',
    })
  }

  return {
    claim,
    hash,
    isPending,
    isSuccess,
    error,
  }
}

/**
 * Hook to claim daily mint (100 ORANGE tokens)
 */
export function useDailyMint() {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract()

  const claimDaily = () => {
    writeContract({
      address: CONTRACTS.mockOrangeToken,
      abi: ABIS.mockOrangeToken,
      functionName: 'dailyMint',
    })
  }

  return {
    claimDaily,
    hash,
    isPending,
    isSuccess,
    error,
  }
}

/**
 * Hook to check if user can claim daily mint
 */
export function useCanMintDaily() {
  const { address } = useAccount()

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.mockOrangeToken,
    abi: ABIS.mockOrangeToken,
    functionName: 'canMintDaily',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS.mockOrangeToken !== '0x',
      refetchInterval: 60000, // Check every minute
    },
  })

  return {
    canMint: data as boolean | undefined,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get time until next daily mint
 */
export function useTimeUntilNextMint() {
  const { address } = useAccount()

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.mockOrangeToken,
    abi: ABIS.mockOrangeToken,
    functionName: 'getTimeUntilNextMint',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS.mockOrangeToken !== '0x',
      refetchInterval: 10000, // Update every 10 seconds
    },
  })

  return {
    timeRemaining: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to watch for player registration events
 */
export function useWatchPlayerRegistrations(onRegistration?: (player: string) => void) {
  useWatchContractEvent({
    address: CONTRACTS.gameRegistry,
    abi: ABIS.gameRegistry,
    eventName: 'PlayerRegistered',
    onLogs(logs) {
      logs.forEach((log) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const args = (log as any).args
        if (onRegistration && args?.player) {
          onRegistration(args.player as string)
        }
      })
    },
  })
}

/**
 * Hook to watch for harvest events
 */
export function useWatchHarvestEvents(onHarvest?: () => void) {
  useWatchContractEvent({
    address: CONTRACTS.harvestSettlement,
    abi: ABIS.harvestSettlement,
    eventName: 'HarvestCompleted',
    onLogs() {
      if (onHarvest) {
        onHarvest()
      }
    },
  })
}

/**
 * Utility: Format bigint to readable number with decimals
 */
export function formatTokenAmount(amount: bigint | undefined, decimals: number = 18): string {
  if (!amount) return '0'
  const formatted = formatUnits(amount, decimals)
  // Show up to 2 decimal places
  const num = parseFloat(formatted)
  return num.toFixed(2)
}

/**
 * Utility: Parse number string to bigint with decimals
 */
export function parseTokenAmount(amount: string, decimals: number = 18): bigint {
  return parseUnits(amount, decimals)
}

/**
 * Hook to get leaderboard data
 */
export function useLeaderboard(limit: number = 10) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.gameRegistry,
    abi: ABIS.gameRegistry,
    functionName: 'getLeaderboard',
    args: [BigInt(limit)],
    query: {
      enabled: CONTRACTS.gameRegistry !== '0x',
      refetchInterval: 30000, // Refetch every 30 seconds
    },
  })

  const leaderboardData = data as { players: readonly string[]; oranges: readonly bigint[]; levels: readonly number[] } | undefined

  return {
    players: leaderboardData?.players || [],
    oranges: leaderboardData?.oranges || [],
    levels: leaderboardData?.levels || [],
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get player's rank
 */
export function usePlayerRank(playerAddress?: string) {
  const { address: connectedAddress } = useAccount()
  const address = (playerAddress || connectedAddress) as `0x${string}` | undefined

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.gameRegistry,
    abi: ABIS.gameRegistry,
    functionName: 'getPlayerRank',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS.gameRegistry !== '0x',
    },
  })

  return {
    rank: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get referral data
 */
export function useReferralData(playerAddress?: string) {
  const { address: connectedAddress } = useAccount()
  const address = (playerAddress || connectedAddress) as `0x${string}` | undefined

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.gameRegistry,
    abi: ABIS.gameRegistry,
    functionName: 'getReferralData',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS.gameRegistry !== '0x',
    },
  })

  // Solidity returns tuple (address, address[], uint256)
  // wagmi returns it as an array [referrer, referredPlayers, totalRewards]
  const referralData = data as readonly [string, readonly string[], bigint] | undefined

  return {
    referrer: referralData?.[0],
    referredPlayers: referralData?.[1] || [],
    totalRewards: referralData?.[2] || 0n,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get user's land NFTs
 */
export function useUserLands() {
  const { address } = useAccount()

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.landNFT,
    abi: ABIS.landNFT,
    functionName: 'getOwnerLands',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS.landNFT !== '0x',
    },
  })

  return {
    landIds: (data as readonly bigint[]) || [],
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get detailed info for a specific land
 */
export function useLandInfo(landId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.landNFT,
    abi: ABIS.landNFT,
    functionName: 'getLandInfo',
    args: landId ? [landId] : undefined,
    query: {
      enabled: !!landId && CONTRACTS.landNFT !== '0x',
      // No refetchInterval - land info is static and doesn't change frequently
    },
  })

  const landInfo = data as { owner: string; landType: number; capacity: number; expansions: number; creationTimestamp: bigint } | undefined

  return {
    owner: landInfo?.owner,
    landType: landInfo?.landType,
    capacity: landInfo?.capacity,
    expansions: landInfo?.expansions,
    creationTimestamp: landInfo?.creationTimestamp,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get user's bot NFTs
 */
export function useUserBots() {
  const { address } = useAccount()

  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.botNFT,
    abi: ABIS.botNFT,
    functionName: 'getOwnerBots',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && CONTRACTS.botNFT !== '0x',
    },
  })

  return {
    botIds: (data as readonly bigint[]) || [],
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get detailed info for a specific bot
 */
export function useBotInfo(botId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.botNFT,
    abi: ABIS.botNFT,
    functionName: 'getBotInfo',
    args: botId ? [botId] : undefined,
    query: {
      enabled: !!botId && CONTRACTS.botNFT !== '0x',
    },
  })

  const botInfo = data as { 
    owner: string; 
    botType: number; 
    harvestRate: number; 
    waterConsumption: number; 
    assignedLandId: bigint; 
    isActive: boolean; 
    totalHarvests: bigint 
  } | undefined

  return {
    owner: botInfo?.owner,
    botType: botInfo?.botType,
    harvestRate: botInfo?.harvestRate,
    waterConsumption: botInfo?.waterConsumption,
    assignedLandId: botInfo?.assignedLandId,
    isActive: botInfo?.isActive,
    totalHarvests: botInfo?.totalHarvests,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get bot data (simplified version using botData mapping)
 */
export function useBotData(botId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.botNFT,
    abi: ABIS.botNFT,
    functionName: 'botData',
    args: botId ? [botId] : undefined,
    query: {
      enabled: !!botId && CONTRACTS.botNFT !== '0x',
    },
  })

  const botData = data as readonly [
    number,  // botType
    number,  // efficiency
    number,  // totalHarvests
    bigint,  // creationTimestamp
    bigint   // assignedLandId
  ] | undefined

  return {
    botType: botData?.[0],
    efficiency: botData?.[1],
    totalHarvests: botData?.[2],
    creationTimestamp: botData?.[3],
    assignedLandId: botData?.[4],
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get pending harvest for a land (RealTimeHarvest)
 */
export function usePendingHarvest(landId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.realTimeHarvest,
    abi: ABIS.realTimeHarvest,
    functionName: 'getPendingHarvest',
    args: landId ? [landId] : undefined,
    query: {
      enabled: !!landId && CONTRACTS.realTimeHarvest !== '0x',
      refetchInterval: 5000, // Refetch every 5 seconds for real-time updates
    },
  })

  // Solidity returns tuple (uint256, uint64, bool, bool)
  // wagmi returns it as array [amount, readyAt, isReady, isActive]
  const harvestData = data as readonly [bigint, bigint, boolean, boolean] | undefined

  return {
    amount: harvestData?.[0] || 0n,
    readyAt: harvestData?.[1],
    isReady: harvestData?.[2] || false,
    isActive: harvestData?.[3] || false,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get full pending harvest struct from public mapping (RealTimeHarvest)
 */
export function usePendingHarvestRaw(landId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.realTimeHarvest,
    abi: ABIS.realTimeHarvest,
    functionName: 'pendingHarvests',
    args: landId ? [landId] : undefined,
    query: {
      enabled: !!landId && CONTRACTS.realTimeHarvest !== '0x',
      refetchInterval: 5000,
    },
  })

  // Public mapping returns full struct
  // (uint256 landId, uint256 botId, uint256 estimatedAmount, uint64 startTime, uint64 duration, bool active)
  const harvestStruct = data as readonly [bigint, bigint, bigint, bigint, bigint, boolean] | undefined

  return {
    landId: harvestStruct?.[0],
    botId: harvestStruct?.[1],
    estimatedAmount: harvestStruct?.[2] || 0n,
    startTime: harvestStruct?.[3],
    duration: harvestStruct?.[4],
    active: harvestStruct?.[5] || false,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to start a harvest (RealTimeHarvest)
 */
export function useStartHarvest() {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract()

  const startHarvest = (landId: bigint, botId: bigint) => {
    writeContract({
      address: CONTRACTS.realTimeHarvest,
      abi: ABIS.realTimeHarvest,
      functionName: 'startHarvest',
      args: [landId, botId],
    })
  }

  return {
    startHarvest,
    hash,
    isPending,
    isSuccess,
    error,
  }
}

/**
 * Hook to complete a harvest (RealTimeHarvest)
 */
export function useCompleteHarvest() {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract()

  const completeHarvest = (landId: bigint) => {
    writeContract({
      address: CONTRACTS.realTimeHarvest,
      abi: ABIS.realTimeHarvest,
      functionName: 'completeHarvest',
      args: [landId],
    })
  }

  return {
    completeHarvest,
    hash,
    isPending,
    isSuccess,
    error,
  }
}

/**
 * Hook to check if a harvest is ready
 */
export function useIsHarvestReady(landId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.realTimeHarvest,
    abi: ABIS.realTimeHarvest,
    functionName: 'isHarvestReady',
    args: landId ? [landId] : undefined,
    query: {
      enabled: !!landId && CONTRACTS.realTimeHarvest !== '0x',
      refetchInterval: 1000, // Check every second
    },
  })

  return {
    isReady: data as boolean | undefined,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get time remaining until harvest is ready
 */
export function useTimeRemaining(landId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.realTimeHarvest,
    abi: ABIS.realTimeHarvest,
    functionName: 'getTimeRemaining',
    args: landId ? [landId] : undefined,
    query: {
      enabled: !!landId && CONTRACTS.realTimeHarvest !== '0x',
      refetchInterval: 1000, // Update every second for countdown
    },
  })

  return {
    timeRemaining: data as bigint | undefined,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to get batch pending harvests for multiple lands
 */
export function useBatchPendingHarvests(landIds: readonly bigint[] | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.realTimeHarvest,
    abi: ABIS.realTimeHarvest,
    functionName: 'getBatchPendingHarvests',
    args: landIds ? [landIds] : undefined,
    query: {
      enabled: !!landIds && landIds.length > 0 && CONTRACTS.realTimeHarvest !== '0x',
      refetchInterval: 5000,
    },
  })

  const batchData = data as {
    amounts: readonly bigint[]
    readyTimes: readonly bigint[]
    statuses: readonly boolean[]
    actives: readonly boolean[]
  } | undefined

  return {
    amounts: batchData?.amounts || [],
    readyTimes: batchData?.readyTimes || [],
    statuses: batchData?.statuses || [],
    actives: batchData?.actives || [],
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to calculate estimated harvest amount
 */
export function useCalculateHarvestAmount(landId: bigint | undefined, botId: bigint | undefined) {
  const { data, isLoading, error } = useReadContract({
    address: CONTRACTS.realTimeHarvest,
    abi: ABIS.realTimeHarvest,
    functionName: 'calculateHarvestAmount',
    args: landId && botId ? [landId, botId] : undefined,
    query: {
      enabled: !!landId && !!botId && CONTRACTS.realTimeHarvest !== '0x',
    },
  })

  return {
    estimatedAmount: data as bigint | undefined,
    isLoading,
    error,
  }
}

/**
 * Hook to cancel an active harvest
 */
export function useCancelHarvest() {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract()

  const cancelHarvest = (landId: bigint) => {
    writeContract({
      address: CONTRACTS.realTimeHarvest,
      abi: ABIS.realTimeHarvest,
      functionName: 'cancelHarvest',
      args: [landId],
    })
  }

  return {
    cancelHarvest,
    hash,
    isPending,
    isSuccess,
    error,
  }
}

/**
 * Hook to watch for harvest started events
 */
export function useWatchHarvestStarted(onHarvestStarted?: (landId: bigint, botId: bigint, amount: bigint) => void) {
  useWatchContractEvent({
    address: CONTRACTS.realTimeHarvest,
    abi: ABIS.realTimeHarvest,
    eventName: 'HarvestStarted',
    onLogs(logs) {
      logs.forEach((log) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const args = (log as any).args
        if (onHarvestStarted && args?.landId && args?.botId && args?.estimatedAmount) {
          onHarvestStarted(args.landId as bigint, args.botId as bigint, args.estimatedAmount as bigint)
        }
      })
    },
  })
}

/**
 * Hook to watch for harvest completed events
 */
export function useWatchHarvestCompleted(onHarvestCompleted?: (landId: bigint, player: string, amount: bigint) => void) {
  useWatchContractEvent({
    address: CONTRACTS.realTimeHarvest,
    abi: ABIS.realTimeHarvest,
    eventName: 'HarvestCompleted',
    onLogs(logs) {
      logs.forEach((log) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const args = (log as any).args
        if (onHarvestCompleted && args?.landId && args?.player && args?.amount) {
          onHarvestCompleted(args.landId as bigint, args.player as string, args.amount as bigint)
        }
      })
    },
  })
}

/**
 * Hook to get bots assigned to a land
 */
export function useAssignedBots(landId: bigint | undefined) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: CONTRACTS.landNFT,
    abi: ABIS.landNFT,
    functionName: 'getAssignedBots',
    args: landId ? [landId] : undefined,
    query: {
      enabled: !!landId && CONTRACTS.landNFT !== '0x',
      refetchInterval: 10000, // Refetch every 10 seconds (reduced from 3s to prevent flickering)
    },
  })

  const botIds = (data as readonly bigint[]) || []

  return {
    botIds,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Hook to assign a bot to a land
 */
export function useAddBotToLand() {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract()

  const addBotToLand = (landId: bigint, botId: bigint) => {
    writeContract({
      address: CONTRACTS.landNFT,
      abi: ABIS.landNFT,
      functionName: 'addBotToLand',
      args: [landId, botId],
    })
  }

  return {
    addBotToLand,
    hash,
    isPending,
    isSuccess,
    error,
  }
}

/**
 * Hook to remove a bot from a land
 */
export function useRemoveBotFromLand() {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract()

  const removeBotFromLand = (landId: bigint, botId: bigint) => {
    writeContract({
      address: CONTRACTS.landNFT,
      abi: ABIS.landNFT,
      functionName: 'removeBotFromLand',
      args: [landId, botId],
    })
  }

  return {
    removeBotFromLand,
    hash,
    isPending,
    isSuccess,
    error,
  }
}

// ============================================================================
// Marketplace Hooks
// ============================================================================

/**
 * Hook to get land prices from marketplace
 */
export function useLandPrices() {
  const { data: smallPrice } = useReadContract({
    address: CONTRACTS.marketplace,
    abi: ABIS.marketplace,
    functionName: 'landPrices',
    args: [0], // Small
  })

  const { data: mediumPrice } = useReadContract({
    address: CONTRACTS.marketplace,
    abi: ABIS.marketplace,
    functionName: 'landPrices',
    args: [1], // Medium
  })

  const { data: largePrice } = useReadContract({
    address: CONTRACTS.marketplace,
    abi: ABIS.marketplace,
    functionName: 'landPrices',
    args: [2], // Large
  })

  return {
    small: smallPrice as bigint,
    medium: mediumPrice as bigint,
    large: largePrice as bigint,
  }
}

/**
 * Hook to get bot prices from marketplace
 */
export function useBotPrices() {
  const { data: basicPrice } = useReadContract({
    address: CONTRACTS.marketplace,
    abi: ABIS.marketplace,
    functionName: 'botPrices',
    args: [0], // Basic
  })

  const { data: advancedPrice } = useReadContract({
    address: CONTRACTS.marketplace,
    abi: ABIS.marketplace,
    functionName: 'botPrices',
    args: [1], // Advanced
  })

  const { data: elitePrice } = useReadContract({
    address: CONTRACTS.marketplace,
    abi: ABIS.marketplace,
    functionName: 'botPrices',
    args: [2], // Elite
  })

  return {
    basic: basicPrice as bigint,
    advanced: advancedPrice as bigint,
    elite: elitePrice as bigint,
  }
}

/**
 * Hook to get water prices from marketplace
 */
export function useWaterPrices() {
  const { data: pack10Price } = useReadContract({
    address: CONTRACTS.marketplace,
    abi: ABIS.marketplace,
    functionName: 'waterPrices',
    args: [0], // Pack10
  })

  const { data: barrel50Price } = useReadContract({
    address: CONTRACTS.marketplace,
    abi: ABIS.marketplace,
    functionName: 'waterPrices',
    args: [1], // Barrel50
  })

  return {
    pack10: pack10Price as bigint,
    barrel50: barrel50Price as bigint,
  }
}

/**
 * Hook to buy land from marketplace
 */
export function useBuyLand() {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract()

  const buyLand = (landType: 0 | 1 | 2) => {
    writeContract({
      address: CONTRACTS.marketplace,
      abi: ABIS.marketplace,
      functionName: 'buyLand',
      args: [landType],
    })
  }

  return {
    buyLand,
    hash,
    isPending,
    isSuccess,
    error,
  }
}

/**
 * Hook to buy bot from marketplace
 */
export function useBuyBot() {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract()

  const buyBot = (botType: 0 | 1 | 2) => {
    writeContract({
      address: CONTRACTS.marketplace,
      abi: ABIS.marketplace,
      functionName: 'buyBot',
      args: [botType],
    })
  }

  return {
    buyBot,
    hash,
    isPending,
    isSuccess,
    error,
  }
}

/**
 * Hook to buy water from marketplace
 */
export function useBuyWater() {
  const { writeContract, data: hash, isPending, isSuccess, error } = useWriteContract()

  const buyWater = (waterPackage: 0 | 1) => {
    writeContract({
      address: CONTRACTS.marketplace,
      abi: ABIS.marketplace,
      functionName: 'buyWater',
      args: [waterPackage],
    })
  }

  return {
    buyWater,
    hash,
    isPending,
    isSuccess,
    error,
  }
}