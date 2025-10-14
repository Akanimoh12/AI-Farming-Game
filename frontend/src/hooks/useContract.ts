import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { useState, useEffect } from 'react'
import type { Abi, Address } from 'viem'

interface UseContractReadOptions {
  contractAddress: Address
  abi: Abi
  functionName: string
  args?: unknown[]
  enabled?: boolean
  watch?: boolean
}

interface UseContractWriteOptions {
  contractAddress: Address
  abi: Abi
  functionName: string
}

/**
 * Type-safe contract read hook
 */
export function useContractRead<T = unknown>({
  contractAddress,
  abi,
  functionName,
  args = [],
  enabled = true,
  watch = false,
}: UseContractReadOptions) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: contractAddress,
    abi,
    functionName,
    args,
    query: {
      enabled,
      refetchInterval: watch ? 5000 : false,
    },
  })

  return {
    data: data as T | undefined,
    isLoading,
    error,
    refetch,
  }
}

/**
 * Type-safe contract write hook with transaction tracking
 */
export function useContractWrite({ contractAddress, abi, functionName }: UseContractWriteOptions) {
  const { data: hash, writeContract, isPending, error } = useWriteContract()
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isPending || isConfirming) {
      setTxStatus('pending')
    } else if (isConfirmed) {
      setTxStatus('success')
    } else if (error) {
      setTxStatus('error')
    } else {
      setTxStatus('idle')
    }
  }, [isPending, isConfirming, isConfirmed, error])

  const write = async (args: unknown[] = []) => {
    try {
      await writeContract({
        address: contractAddress,
        abi,
        functionName,
        args,
      })
    } catch (err) {
      console.error('Contract write error:', err)
      throw err
    }
  }

  return {
    write,
    hash,
    status: txStatus,
    isPending: isPending || isConfirming,
    isSuccess: isConfirmed,
    error,
  }
}

/**
 * Hook to read user's NFT balance
 */
export function useNFTBalance(
  contractAddress: Address,
  abi: Abi,
  userAddress: Address | undefined
) {
  return useContractRead<bigint>({
    contractAddress,
    abi,
    functionName: 'balanceOf',
    args: [userAddress],
    enabled: !!userAddress,
    watch: true,
  })
}

/**
 * Hook to read user's token IDs
 */
export function useUserTokens(
  contractAddress: Address,
  abi: Abi,
  userAddress: Address | undefined,
  balance: bigint | undefined
) {
  const [tokenIds, setTokenIds] = useState<bigint[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!userAddress || !balance || balance === 0n) {
      setTokenIds([])
      return
    }

    const fetchTokens = async () => {
      setIsLoading(true)
      try {
        const tokens: bigint[] = []
        // Note: This assumes the contract has tokenOfOwnerByIndex function
        // Adjust based on your actual contract implementation
        for (let i = 0; i < Number(balance); i++) {
          // You'd call tokenOfOwnerByIndex here
          // This is a placeholder
        }
        setTokenIds(tokens)
      } catch (error) {
        console.error('Failed to fetch tokens:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTokens()
  }, [contractAddress, abi, userAddress, balance])

  return { tokenIds, isLoading }
}
