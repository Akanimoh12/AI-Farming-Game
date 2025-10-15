/**
 * Network Utilities for Somnia Dream Testnet
 * Helper functions for network detection, switching, and configuration
 */

import { somniaDream } from '@lib/wagmi/chains'

/**
 * Check if user is on the correct network
 */
export const isCorrectNetwork = (chainId: number | undefined): boolean => {
  return chainId === somniaDream.id
}

/**
 * Get network configuration for MetaMask
 */
export const getSomniaNetworkConfig = () => ({
  chainId: `0x${somniaDream.id.toString(16)}`,
  chainName: somniaDream.name,
  nativeCurrency: {
    name: somniaDream.nativeCurrency.name,
    symbol: somniaDream.nativeCurrency.symbol,
    decimals: somniaDream.nativeCurrency.decimals,
  },
  rpcUrls: [somniaDream.rpcUrls.default.http[0]],
  blockExplorerUrls: [somniaDream.blockExplorers.default.url],
})

/**
 * Add Somnia network to MetaMask
 */
export const addSomniaNetwork = async (): Promise<boolean> => {
  if (!window.ethereum) {
    console.error('MetaMask is not installed')
    return false
  }

  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [getSomniaNetworkConfig()],
    })
    return true
  } catch (error: any) {
    console.error('Failed to add Somnia network:', error)
    
    // User rejected the request
    if (error.code === 4001) {
      console.log('User rejected network addition')
    }
    
    return false
  }
}

/**
 * Switch to Somnia network
 */
export const switchToSomniaNetwork = async (): Promise<boolean> => {
  if (!window.ethereum) {
    console.error('MetaMask is not installed')
    return false
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${somniaDream.id.toString(16)}` }],
    })
    return true
  } catch (error: any) {
    console.error('Failed to switch to Somnia network:', error)

    // This error code indicates that the chain has not been added to MetaMask
    if (error.code === 4902) {
      console.log('Somnia network not found, attempting to add...')
      return await addSomniaNetwork()
    }

    // User rejected the request
    if (error.code === 4001) {
      console.log('User rejected network switch')
    }

    return false
  }
}

/**
 * Get chain name by ID
 */
export const getChainName = (chainId: number | undefined): string => {
  if (!chainId) return 'Unknown Network'
  
  if (chainId === somniaDream.id) {
    return somniaDream.name
  }

  // Common networks for reference
  const networks: Record<number, string> = {
    1: 'Ethereum Mainnet',
    5: 'Goerli Testnet',
    11155111: 'Sepolia Testnet',
    137: 'Polygon Mainnet',
    80001: 'Mumbai Testnet',
    56: 'BSC Mainnet',
    97: 'BSC Testnet',
  }

  return networks[chainId] || `Unknown Network (${chainId})`
}

/**
 * Get network icon/emoji by chain ID
 */
export const getNetworkIcon = (chainId: number | undefined): string => {
  if (!chainId) return '❓'
  
  if (chainId === somniaDream.id) {
    return '🌙' // Dream network moon icon
  }

  const icons: Record<number, string> = {
    1: '⟠',
    5: '⟠',
    11155111: '⟠',
    137: '🟣',
    80001: '🟣',
    56: '🔶',
    97: '🔶',
  }

  return icons[chainId] || '⛓️'
}

/**
 * Check if wallet is installed
 */
export const isWalletInstalled = (): boolean => {
  return typeof window !== 'undefined' && !!window.ethereum
}

/**
 * Get wallet install URL
 */
export const getWalletInstallUrl = (): string => {
  return 'https://metamask.io/download/'
}

/**
 * Format chain ID for display
 */
export const formatChainId = (chainId: number | undefined): string => {
  if (!chainId) return 'N/A'
  return `${chainId} (0x${chainId.toString(16)})`
}

/**
 * Network configuration for display
 */
export interface NetworkInfo {
  name: string
  chainId: number
  chainIdHex: string
  icon: string
  isTestnet: boolean
  rpcUrl: string
  explorerUrl: string
}

/**
 * Get complete network information
 */
export const getNetworkInfo = (chainId: number | undefined): NetworkInfo | null => {
  if (!chainId) return null

  if (chainId === somniaDream.id) {
    return {
      name: somniaDream.name,
      chainId: somniaDream.id,
      chainIdHex: `0x${somniaDream.id.toString(16)}`,
      icon: '🌙',
      isTestnet: true,
      rpcUrl: somniaDream.rpcUrls.default.http[0],
      explorerUrl: somniaDream.blockExplorers.default.url,
    }
  }

  return null
}
