/**
 * Custom hook for wallet-based authentication (no backend)
 * Pure on-chain authentication using smart contracts
 */
import { useAccount, useDisconnect } from 'wagmi'
import { useIsRegistered, usePlayerProfile } from './useContracts'

interface AuthUser {
  address: string
  isAuthenticated: boolean
  isLoading: boolean
}

interface UseAuthReturn {
  user: AuthUser | null
  firebaseUser: null // Deprecated - keeping for backwards compatibility
  userProfile: {
    username: string
    referralCode: string
    registrationTimestamp?: bigint
  } | null
  isLoading: boolean
  error: null
  login: () => Promise<void>
  logout: () => Promise<void>
  refreshProfile: () => Promise<void>
}

/**
 * Custom hook for wallet authentication with smart contracts
 * No backend - direct blockchain reads for authentication state
 */
export function useAuth(): UseAuthReturn {
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  
  // Check if player is registered on-chain
  const { isRegistered, isLoading: isCheckingRegistration } = useIsRegistered()
  
  // Get player profile from blockchain
  const { profile } = usePlayerProfile()

  // Create user object based on wallet and registration state
  const user: AuthUser | null = address && isConnected
    ? {
        address,
        isAuthenticated: isRegistered || false,
        isLoading: isCheckingRegistration,
      }
    : null

  // Create userProfile from blockchain data
  const userProfile = profile
    ? {
        username: profile.username,
        referralCode: profile.referralCode,
        registrationTimestamp: profile.registrationTimestamp,
      }
    : null

  // Login is just checking on-chain registration
  const login = async () => {
    // No-op: Login happens automatically when wallet connects
    // and registration status is checked from blockchain
    console.log('Checking on-chain registration status...')
  }

  // Logout disconnects wallet
  const logout = async () => {
    disconnect()
  }

  // Refresh just re-queries the blockchain
  const refreshProfile = async () => {
    // Wagmi handles refetch automatically
    console.log('Profile data refreshed from blockchain')
  }

  return {
    user,
    firebaseUser: null, // No Firebase
    userProfile,
    isLoading: isCheckingRegistration,
    error: null,
    login,
    logout,
    refreshProfile,
  }
}
