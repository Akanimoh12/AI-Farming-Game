import { useState, useEffect, useCallback } from 'react'
import { useAccount } from 'wagmi'
import { subscribeToCollection, where, orderBy } from '@lib/firebase/firestore'
import type { PlotState, UserAssets } from '@/types/game'

interface UseGameStateReturn {
  plots: PlotState[]
  assets: UserAssets | null
  isLoading: boolean
  error: Error | null
  refreshPlots: () => void
  refreshAssets: () => void
}

/**
 * Hook for managing real-time game state from Firestore
 */
export function useGameState(): UseGameStateReturn {
  const { address } = useAccount()
  const [plots, setPlots] = useState<PlotState[]>([])
  const [assets, setAssets] = useState<UserAssets | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Subscribe to user's plots
  useEffect(() => {
    if (!address) {
      setPlots([])
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    const unsubscribe = subscribeToCollection<PlotState>(
      'plots',
      (data) => {
        setPlots(data)
        setIsLoading(false)
      },
      [where('owner', '==', address), orderBy('landId')]
    )

    return () => unsubscribe()
  }, [address])

  // Load user assets (simplified version - you might want to expand this)
  useEffect(() => {
    if (!address) {
      setAssets(null)
      return
    }

    // This is a simplified version
    // In production, you'd fetch this from Firestore or aggregate from contract data
    const mockAssets: UserAssets = {
      lands: [],
      seeds: [],
      bots: [],
      orangeBalance: '0',
    }

    setAssets(mockAssets)
  }, [address])

  const refreshPlots = useCallback(() => {
    // The subscription handles real-time updates
    // This is a no-op but provided for API consistency
  }, [])

  const refreshAssets = useCallback(() => {
    // Implement asset refresh logic
  }, [])

  return {
    plots,
    assets,
    isLoading,
    error: null,
    refreshPlots,
    refreshAssets,
  }
}

/**
 * Hook for checking if a plot is ready to harvest
 */
export function usePlotStatus(plotId: string) {
  const { plots } = useGameState()
  const plot = plots.find((p) => p.id === plotId)

  const isReady = plot?.status === 'ready'
  const timeRemaining = plot?.harvestReadyAt
    ? Math.max(0, plot.harvestReadyAt.toMillis() - Date.now())
    : 0

  return {
    plot,
    isReady,
    timeRemaining,
    progress: plot?.harvestReadyAt
      ? Math.min(
          100,
          ((Date.now() - (plot.plantedAt?.toMillis() || 0)) /
            (plot.harvestReadyAt.toMillis() - (plot.plantedAt?.toMillis() || 0))) *
            100
        )
      : 0,
  }
}
