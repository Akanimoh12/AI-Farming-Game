import { useEffect, useState } from 'react'
import { useAccount, useSwitchChain, useChainId } from 'wagmi'
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react'
import { Button } from '@components/common'
import { somniaDream } from '@lib/wagmi/chains'

/**
 * NetworkSwitcher Component
 * Automatically prompts users to switch to Somnia Dream testnet
 * Provides one-click network switching for MetaMask and other wallets
 */
export function NetworkSwitcher() {
  const { isConnected } = useAccount()
  const chainId = useChainId()
  const { chains, switchChain, isPending, error } = useSwitchChain()
  const [showPrompt, setShowPrompt] = useState(false)
  const [isAddingNetwork, setIsAddingNetwork] = useState(false)

  const isCorrectNetwork = chainId === somniaDream.id
  const targetChain = chains.find((chain) => chain.id === somniaDream.id)

  // Helper function for button text
  const getButtonText = (adding: boolean, pending: boolean): string => {
    if (adding) return 'Adding Network...'
    if (pending) return 'Switching...'
    return 'Switch Network'
  }

  // Show prompt when connected to wrong network
  useEffect(() => {
    if (isConnected && !isCorrectNetwork) {
      setShowPrompt(true)
    } else {
      setShowPrompt(false)
    }
  }, [isConnected, isCorrectNetwork])

  // Handle switch chain
  const handleSwitchNetwork = async () => {
    if (!targetChain) return

    try {
      switchChain({ chainId: targetChain.id })
    } catch (err) {
      console.error('Failed to switch network:', err)
      // If switch fails, try adding the network
      await handleAddNetwork()
    }
  }

  // Add Somnia network to MetaMask
  const handleAddNetwork = async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask or another Web3 wallet')
      return
    }

    setIsAddingNetwork(true)

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: `0x${somniaDream.id.toString(16)}`, // Convert to hex
            chainName: somniaDream.name,
            nativeCurrency: {
              name: somniaDream.nativeCurrency.name,
              symbol: somniaDream.nativeCurrency.symbol,
              decimals: somniaDream.nativeCurrency.decimals,
            },
            rpcUrls: [somniaDream.rpcUrls.default.http[0]],
            blockExplorerUrls: [somniaDream.blockExplorers.default.url],
          },
        ],
      })

      // After adding, switch to it
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${somniaDream.id.toString(16)}` }],
      })
    } catch (err: any) {
      console.error('Failed to add network:', err)
      
      // User rejected the request
      if (err.code === 4001) {
        alert('Please approve the network addition in your wallet')
      } else {
        alert(`Failed to add network: ${err.message}`)
      }
    } finally {
      setIsAddingNetwork(false)
    }
  }

  // Don't show anything if not connected
  if (!isConnected) return null

  // Show success indicator when on correct network
  if (isCorrectNetwork) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-lg">
        <CheckCircle className="h-4 w-4 text-green-500" />
        <span className="text-xs font-medium text-green-500">
          {somniaDream.name}
        </span>
      </div>
    )
  }

  // Show warning and switch button when on wrong network
  return (
    <>
      {/* Compact indicator in header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
        <span className="text-xs font-medium text-yellow-500">Wrong Network</span>
      </div>

      {/* Full-width prompt banner */}
      {showPrompt && (
        <div className="fixed top-16 left-0 right-0 z-50 bg-yellow-500/10 backdrop-blur-sm border-b border-yellow-500/20">
          <div className="max-w-7xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-white">
                    Wrong Network Detected
                  </p>
                  <p className="text-xs text-gray-400">
                    Please switch to {somniaDream.name} to use Orange Farm
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleSwitchNetwork}
                  loading={isPending || isAddingNetwork}
                  icon={<RefreshCw className="h-4 w-4" />}
                >
                  {getButtonText(isAddingNetwork, isPending)}
                </Button>

                <button
                  onClick={() => setShowPrompt(false)}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>

            {error && (
              <div className="mt-2 text-xs text-red-400">
                Error: {error.message}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Network Badge - Simple indicator for current network
 * Use this in places where you just want to show network status
 */
export function NetworkBadge() {
  const chainId = useChainId()
  const { isConnected } = useAccount()

  if (!isConnected) return null

  const isCorrectNetwork = chainId === somniaDream.id

  return (
    <div
      className={`
        flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium
        ${
          isCorrectNetwork
            ? 'bg-green-500/10 text-green-500'
            : 'bg-yellow-500/10 text-yellow-500'
        }
      `}
    >
      <span
        className={`
          h-1.5 w-1.5 rounded-full
          ${isCorrectNetwork ? 'bg-green-500' : 'bg-yellow-500'}
        `}
      />
      {isCorrectNetwork ? somniaDream.name : 'Wrong Network'}
    </div>
  )
}
