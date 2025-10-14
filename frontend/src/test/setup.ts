import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Web3 providers
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ address: undefined, isConnected: false })),
  useConnect: vi.fn(() => ({ connect: vi.fn(), connectors: [] })),
  useDisconnect: vi.fn(() => ({ disconnect: vi.fn() })),
  useBalance: vi.fn(() => ({ data: undefined })),
  useContractRead: vi.fn(() => ({ data: undefined })),
  useContractWrite: vi.fn(() => ({ write: vi.fn(), data: undefined })),
  usePrepareContractWrite: vi.fn(() => ({ config: {} })),
  useWaitForTransaction: vi.fn(() => ({ isLoading: false })),
}))

vi.mock('@rainbow-me/rainbowkit', () => ({
  ConnectButton: () => null,
  RainbowKitProvider: ({ children }: { children: React.ReactNode }) => children,
}))

// Mock Firebase
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(),
  getApps: vi.fn(() => []),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(),
  signInWithCustomToken: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}))

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(),
}))

// Mock environment variables
vi.stubEnv('VITE_SOMNIA_RPC_URL', 'http://localhost:8545')
vi.stubEnv('VITE_SOMNIA_CHAIN_ID', '50311')
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key')
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test.firebaseapp.com')
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project')
