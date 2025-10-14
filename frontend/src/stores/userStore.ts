import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserProfile } from '@/types/game'

interface UserStore {
  profile: UserProfile | null
  isAuthenticated: boolean
  isLoading: boolean

  // Actions
  setProfile: (profile: UserProfile | null) => void
  updateProfile: (updates: Partial<UserProfile>) => void
  setAuthenticated: (isAuthenticated: boolean) => void
  setLoading: (isLoading: boolean) => void
  clearUser: () => void
}

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      profile: null,
      isAuthenticated: false,
      isLoading: true,

      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),

      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),

      setLoading: (isLoading) => set({ isLoading }),

      clearUser: () =>
        set({
          profile: null,
          isAuthenticated: false,
          isLoading: false,
        }),
    }),
    {
      name: 'orange-farm-user',
      partialize: (state) => ({
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
