import { defineChain } from 'viem'

/**
 * Somnia Dream Network Configuration (Testnet)
 * Optimized for sub-second finality and high throughput gaming applications
 * 
 * Network Details:
 * - Chain ID: 50312 (0xC488 in hex) - VERIFIED FROM RPC
 * - Currency: STT (Somnia Test Token)
 * - Block Time: ~0.5 seconds
 * - Finality: Sub-second
 * - RPC: https://dream-rpc.somnia.network
 */
export const somniaDream = defineChain({
  id: Number(import.meta.env.VITE_SOMNIA_CHAIN_ID) || 50312,
  name: 'Somnia Dream Testnet',
  network: 'somnia-dream',
  nativeCurrency: {
    name: 'Somnia Test Token',
    symbol: 'STT',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network'],
      webSocket: ['wss://dream-rpc.somnia.network/ws'],
    },
    public: {
      http: [import.meta.env.VITE_SOMNIA_RPC_URL || 'https://dream-rpc.somnia.network'],
      webSocket: ['wss://dream-rpc.somnia.network/ws'],
    },
  },
  blockExplorers: {
    default: {
      name: 'Somnia Explorer',
      url: import.meta.env.VITE_SOMNIA_EXPLORER || 'https://explorer.somnia.network',
      apiUrl: 'https://explorer.somnia.network/api',
    },
  },
  contracts: {
    // Contract addresses from environment
    landNFT: {
      address: (import.meta.env.VITE_LAND_NFT_ADDRESS || '0x') as `0x${string}`,
    },
    seedNFT: {
      address: (import.meta.env.VITE_SEED_NFT_ADDRESS || '0x') as `0x${string}`,
    },
    botNFT: {
      address: (import.meta.env.VITE_BOT_NFT_ADDRESS || '0x') as `0x${string}`,
    },
    orangeToken: {
      address: (import.meta.env.VITE_ORANGE_TOKEN_ADDRESS || '0x') as `0x${string}`,
    },
    marketplace: {
      address: (import.meta.env.VITE_MARKETPLACE_ADDRESS || '0x') as `0x${string}`,
    },
    harvestSettlement: {
      address: (import.meta.env.VITE_HARVEST_SETTLEMENT_ADDRESS || '0x') as `0x${string}`,
    },
  },
  testnet: true,
})

export const supportedChains = [somniaDream] as const
