import { useEffect, useState } from 'react'
import { Clock, Gift, Loader2 } from 'lucide-react'
import { useDailyMint, useCanMintDaily, useTimeUntilNextMint, useTokenBalances } from '../hooks/useContracts'
import toast from 'react-hot-toast'

export default function DailyRewards() {
  const { claimDaily, isPending, isSuccess } = useDailyMint()
  const { canMint, refetch: refetchCanMint } = useCanMintDaily()
  const { timeRemaining, refetch: refetchTime } = useTimeUntilNextMint()
  const { refetch: refetchBalances } = useTokenBalances()
  const [timeDisplay, setTimeDisplay] = useState('')

  // Format time remaining
  useEffect(() => {
    if (!timeRemaining || timeRemaining === 0n) {
      setTimeDisplay('Ready to claim!')
      return
    }

    const updateDisplay = () => {
      const seconds = Number(timeRemaining)
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      const secs = seconds % 60

      if (hours > 0) {
        setTimeDisplay(`${hours}h ${minutes}m ${secs}s`)
      } else if (minutes > 0) {
        setTimeDisplay(`${minutes}m ${secs}s`)
      } else {
        setTimeDisplay(`${secs}s`)
      }
    }

    updateDisplay()
    const interval = setInterval(updateDisplay, 1000)
    return () => clearInterval(interval)
  }, [timeRemaining])

  // Handle successful claim
  useEffect(() => {
    if (isSuccess) {
      toast.success('🎉 Daily rewards claimed! +100 ORANGE')
      refetchCanMint()
      refetchTime()
      refetchBalances()
    }
  }, [isSuccess, refetchCanMint, refetchTime, refetchBalances])

  const handleClaim = () => {
    if (!canMint) {
      toast.error('Daily claim not ready yet!')
      return
    }

    claimDaily()
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-6 border-2 border-orange-200 shadow-lg">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 bg-orange-500 rounded-xl">
          <Gift className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Daily Rewards</h3>
          <p className="text-sm text-gray-600">Claim 100 ORANGE tokens every 24 hours</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Reward Amount */}
        <div className="bg-white rounded-xl p-4 border border-orange-200">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Daily Amount:</span>
            <span className="text-2xl font-bold text-orange-600">100 ORANGE</span>
          </div>
        </div>

        {/* Countdown/Status */}
        <div className="bg-white rounded-xl p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="font-semibold text-gray-900">
              {canMint ? 'Ready to Claim!' : 'Next Claim In:'}
            </span>
          </div>
          <div className={`text-2xl font-mono font-bold ${canMint ? 'text-green-600' : 'text-gray-700'}`}>
            {timeDisplay}
          </div>
        </div>

        {/* Claim Button */}
        <button
          onClick={handleClaim}
          disabled={!canMint || isPending}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform ${
            canMint && !isPending
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-600 hover:to-amber-600 hover:scale-105 shadow-lg hover:shadow-xl'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Claiming...
            </span>
          ) : canMint ? (
            '🎁 Claim Daily Rewards'
          ) : (
            '⏳ Come Back Later'
          )}
        </button>

        {/* Info */}
        <div className="text-xs text-gray-500 text-center">
          💡 Tip: Check back every day to maximize your earnings!
        </div>
      </div>
    </div>
  )
}
