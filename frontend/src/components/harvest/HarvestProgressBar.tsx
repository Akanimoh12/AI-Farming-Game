import { useEffect, useState } from 'react'
import { Zap, CheckCircle } from 'lucide-react'

interface HarvestProgressBarProps {
  startTime: bigint | undefined
  duration: number // Duration in seconds
  isActive: boolean
  className?: string
}

export function HarvestProgressBar({ startTime, duration, isActive, className = '' }: HarvestProgressBarProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!isActive || !startTime) {
      setProgress(0)
      return
    }

    const calculateProgress = () => {
      const now = Date.now() / 1000 // Current time in seconds
      const start = Number(startTime)
      const elapsed = now - start
      const percentage = Math.min((elapsed / duration) * 100, 100)
      setProgress(percentage)
    }

    calculateProgress()
    const interval = setInterval(calculateProgress, 1000)

    return () => clearInterval(interval)
  }, [startTime, duration, isActive])

  if (!isActive) {
    return null
  }

  const isComplete = progress >= 100

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-400 font-medium">Harvest Progress</span>
        <span className={`font-bold ${isComplete ? 'text-green-400' : 'text-blue-400'}`}>
          {progress.toFixed(1)}%
        </span>
      </div>
      
      <div className="relative w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-white/10">
        {/* Background glow */}
        <div 
          className={`absolute inset-0 transition-all duration-1000 ${
            isComplete ? 'bg-green-500/20' : 'bg-blue-500/10'
          }`}
        />
        
        {/* Progress fill */}
        <div
          className={`absolute top-0 left-0 h-full transition-all duration-1000 ease-linear ${
            isComplete 
              ? 'bg-gradient-to-r from-green-500 to-green-400' 
              : 'bg-gradient-to-r from-blue-500 to-primary'
          }`}
          style={{ width: `${progress}%` }}
        >
          {/* Animated shine effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
        
        {/* Progress indicator */}
        {!isComplete && (
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-white rounded-full shadow-lg transition-all duration-1000"
            style={{ left: `calc(${progress}% - 4px)` }}
          >
            <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary -mt-6" />
          </div>
        )}
        
        {/* Complete indicator */}
        {isComplete && (
          <div className="absolute top-1/2 right-1 -translate-y-1/2">
            <CheckCircle className="h-5 w-5 text-green-400 animate-bounce" />
          </div>
        )}
      </div>
      
      {/* Status text */}
      <p className="text-xs text-center">
        {isComplete ? (
          <span className="text-green-400 font-semibold">✨ Harvest Complete! Ready to collect</span>
        ) : (
          <span className="text-gray-400">Growing your oranges... 🌱</span>
        )}
      </p>
    </div>
  )
}
