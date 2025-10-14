import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { PlotState } from '@/types/game'

interface GameStore {
  // Game state
  plots: PlotState[]
  selectedPlot: string | null
  isGameLoaded: boolean

  // Game settings
  soundEnabled: boolean
  musicVolume: number
  autoSave: boolean

  // Actions
  setPlots: (plots: PlotState[]) => void
  updatePlot: (plotId: string, updates: Partial<PlotState>) => void
  selectPlot: (plotId: string | null) => void
  setGameLoaded: (loaded: boolean) => void

  // Settings actions
  toggleSound: () => void
  setMusicVolume: (volume: number) => void
  toggleAutoSave: () => void
  resetSettings: () => void
}

const DEFAULT_SETTINGS = {
  soundEnabled: true,
  musicVolume: 0.5,
  autoSave: true,
}

export const useGameStore = create<GameStore>()(
  persist(
    (set) => ({
      // Initial state
      plots: [],
      selectedPlot: null,
      isGameLoaded: false,
      ...DEFAULT_SETTINGS,

      // Plot actions
      setPlots: (plots) => set({ plots }),

      updatePlot: (plotId, updates) =>
        set((state) => ({
          plots: state.plots.map((plot) =>
            plot.id === plotId ? { ...plot, ...updates } : plot
          ),
        })),

      selectPlot: (plotId) => set({ selectedPlot: plotId }),

      setGameLoaded: (loaded) => set({ isGameLoaded: loaded }),

      // Settings actions
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

      setMusicVolume: (volume) => set({ musicVolume: Math.max(0, Math.min(1, volume)) }),

      toggleAutoSave: () => set((state) => ({ autoSave: !state.autoSave })),

      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'orange-farm-game',
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
        musicVolume: state.musicVolume,
        autoSave: state.autoSave,
      }),
    }
  )
)
