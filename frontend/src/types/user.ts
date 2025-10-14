export interface AuthUser {
  address: `0x${string}`
  firebaseUid?: string
  isAuthenticated: boolean
  isLoading: boolean
}

export interface WalletConnection {
  address: `0x${string}` | undefined
  isConnected: boolean
  isConnecting: boolean
  chain: {
    id: number
    name: string
  } | undefined
}

export interface AuthError {
  code: string
  message: string
  details?: unknown
}

export interface LoginResult {
  success: boolean
  user?: AuthUser
  error?: AuthError
}
