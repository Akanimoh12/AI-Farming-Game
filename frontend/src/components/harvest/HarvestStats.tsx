import { Bot, Sprout, TrendingUp, Zap } from 'lucide-react'

interface BotEfficiencyProps {
  botType: 'Basic' | 'Advanced' | 'Elite' | number
  className?: string
}

export function BotEfficiencyBadge({ botType, className = '' }: BotEfficiencyProps) {
  const getBotInfo = () => {
    const type = typeof botType === 'string' ? botType : ['Basic', 'Advanced', 'Elite'][botType] || 'Basic'
    
    switch (type) {
      case 'Basic':
        return { efficiency: 100, color: 'text-gray-400', bgColor: 'bg-gray-400/10', borderColor: 'border-gray-400/30', icon: '🤖' }
      case 'Advanced':
        return { efficiency: 150, color: 'text-blue-400', bgColor: 'bg-blue-400/10', borderColor: 'border-blue-400/30', icon: '🤖✨' }
      case 'Elite':
        return { efficiency: 200, color: 'text-purple-400', bgColor: 'bg-purple-400/10', borderColor: 'border-purple-400/30', icon: '🤖⚡' }
      default:
        return { efficiency: 100, color: 'text-gray-400', bgColor: 'bg-gray-400/10', borderColor: 'border-gray-400/30', icon: '🤖' }
    }
  }

  const { efficiency, color, bgColor, borderColor, icon } = getBotInfo()

  return (
    <div className={`glass rounded-lg p-3 border ${borderColor} ${bgColor} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-xs text-gray-400">Bot Efficiency</p>
            <p className={`text-lg font-bold ${color}`}>{efficiency}%</p>
          </div>
        </div>
        <Bot className={`h-6 w-6 ${color}`} />
      </div>
    </div>
  )
}

interface LandMultiplierProps {
  landType: 'Small' | 'Medium' | 'Large' | number
  className?: string
}

export function LandMultiplierBadge({ landType, className = '' }: LandMultiplierProps) {
  const getLandInfo = () => {
    const type = typeof landType === 'string' ? landType : ['Small', 'Medium', 'Large'][landType] || 'Small'
    
    switch (type) {
      case 'Small':
        return { multiplier: 100, color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/30', icon: '🌱', capacity: 3 }
      case 'Medium':
        return { multiplier: 150, color: 'text-yellow-400', bgColor: 'bg-yellow-400/10', borderColor: 'border-yellow-400/30', icon: '🌾', capacity: 5 }
      case 'Large':
        return { multiplier: 200, color: 'text-orange-400', bgColor: 'bg-orange-400/10', borderColor: 'border-orange-400/30', icon: '🌳', capacity: 8 }
      default:
        return { multiplier: 100, color: 'text-green-400', bgColor: 'bg-green-400/10', borderColor: 'border-green-400/30', icon: '🌱', capacity: 3 }
    }
  }

  const { multiplier, color, bgColor, borderColor, icon, capacity } = getLandInfo()

  return (
    <div className={`glass rounded-lg p-3 border ${borderColor} ${bgColor} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-xs text-gray-400">Land Multiplier</p>
            <p className={`text-lg font-bold ${color}`}>{multiplier}%</p>
          </div>
        </div>
        <div className="text-right">
          <Sprout className={`h-6 w-6 ${color} mx-auto mb-1`} />
          <p className="text-xs text-gray-400">Cap: {capacity}</p>
        </div>
      </div>
    </div>
  )
}

interface HarvestCalculatorProps {
  landType: 'Small' | 'Medium' | 'Large' | number
  botType: 'Basic' | 'Advanced' | 'Elite' | number
  baseHarvest?: number
  className?: string
}

export function HarvestCalculator({ landType, botType, baseHarvest = 10, className = '' }: HarvestCalculatorProps) {
  const getLandMultiplier = () => {
    const type = typeof landType === 'string' ? landType : ['Small', 'Medium', 'Large'][landType] || 'Small'
    switch (type) {
      case 'Medium': return 150
      case 'Large': return 200
      default: return 100
    }
  }

  const getBotEfficiency = () => {
    const type = typeof botType === 'string' ? botType : ['Basic', 'Advanced', 'Elite'][botType] || 'Basic'
    switch (type) {
      case 'Advanced': return 150
      case 'Elite': return 200
      default: return 100
    }
  }

  const landMultiplier = getLandMultiplier()
  const botEfficiency = getBotEfficiency()
  const estimatedHarvest = (baseHarvest * landMultiplier * botEfficiency) / 10000

  return (
    <div className={`glass rounded-xl p-4 border border-primary/30 bg-gradient-to-br from-primary/10 to-secondary/10 ${className}`}>
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <h4 className="font-bold text-white">Harvest Calculator</h4>
      </div>
      
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Base Harvest:</span>
          <span className="text-white font-mono">{baseHarvest} 🍊</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Land Bonus:</span>
          <span className="text-green-400 font-mono">×{(landMultiplier / 100).toFixed(2)}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Bot Efficiency:</span>
          <span className="text-blue-400 font-mono">×{(botEfficiency / 100).toFixed(2)}</span>
        </div>
        
        <div className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        
        <div className="flex items-center justify-between">
          <span className="text-gray-400 font-semibold">Estimated Yield:</span>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-2xl font-bold text-primary">{estimatedHarvest.toFixed(2)}</span>
            <span className="text-gray-400">$ORANGE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
