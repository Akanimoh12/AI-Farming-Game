import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { somniaDream } from './chains'

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

if (!projectId) {
  throw new Error('VITE_WALLETCONNECT_PROJECT_ID is not defined')
}

export const wagmiConfig = getDefaultConfig({
  appName: 'Orange Farm',
  projectId,
  chains: [somniaDream],
  ssr: false,
})
