import { useEffect, useState } from 'react'
import { Timer, Clock } from 'lucide-react'

interface CountdownTimerProps {
  timeRemaining: bigint | undefined
  onComplete?: () => void
  className?: string
}

export function CountdownTimer({ timeRemaining, onComplete, className = '' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0)

  useEffect(() => {
    if (timeRemaining !== undefined) {
      setTimeLeft(Number(timeRemaining))
    }
  }, [timeRemaining])

  useEffect(() => {
    if (timeLeft <= 0) {
      if (timeLeft === 0 && onComplete) {
        onComplete()
      }
      return
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (onComplete) onComplete()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [timeLeft, onComplete])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const getColorClass = () => {
    if (timeLeft === 0) return 'text-green-400'
    if (timeLeft < 60) return 'text-yellow-400'
    if (timeLeft < 300) return 'text-orange-400'
    return 'text-blue-400'
  }

  if (timeLeft === 0) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Clock className="h-5 w-5 text-green-400" />
        <span className="text-lg font-bold text-green-400">Ready to Harvest!</span>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Timer className={`h-5 w-5 ${getColorClass()} animate-pulse`} />
      <span className={`text-lg font-mono font-bold ${getColorClass()}`}>
        {formatTime(timeLeft)}
      </span>
    </div>
  )
}
