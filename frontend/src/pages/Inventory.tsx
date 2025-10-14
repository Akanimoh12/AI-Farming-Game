import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  Package,
  Home,
  Bot,
  Droplets,
  Trophy,
  Search,
  Loader2,
  ExternalLink,
  MapPin,
  Zap,
  Activity,
  Calendar,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  useUserLands,
  useUserBots,
  useLandInfo,
  useBotInfo,
  useTokenBalances,
  formatTokenAmount,
} from '@hooks/useContracts'

type TabType = 'all' | 'lands' | 'bots' | 'tokens'

// Land type mapping
const LAND_TYPES = {
  0: { name: 'Small Plot', emoji: '🏞️', color: 'blue' },
  1: { name: 'Medium Plot', emoji: '🌄', color: 'green' },
  2: { name: 'Large Plot', emoji: '🏔️', color: 'purple' },
}

// Bot type mapping
const BOT_TYPES = {
  0: { name: 'Basic Bot', emoji: '🤖', color: 'gray' },
  1: { name: 'Advanced Bot', emoji: '🦾', color: 'blue' },
  2: { name: 'Elite Bot', emoji: '🚀', color: 'purple' },
}

// Component for displaying a land NFT card
function LandCard({ landId }: Readonly<{ landId: bigint }>) {
  const navigate = useNavigate()
  const { landType, capacity, expansions, creationTimestamp, isLoading } = useLandInfo(landId)

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 border-2 border-white/10">
        <Loader2 className="h-12 w-12 mx-auto animate-spin text-gray-400" />
      </div>
    )
  }

  const landTypeInfo = LAND_TYPES[landType as 0 | 1 | 2] || LAND_TYPES[0]
  const createdDate = creationTimestamp 
    ? new Date(Number(creationTimestamp) * 1000).toLocaleDateString()
    : 'Unknown'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass rounded-2xl p-6 border-2 border-white/10 hover:border-primary/50 transition-all cursor-pointer"
      onClick={() => navigate('/farm')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-${landTypeInfo.color}-500/20 rounded-xl flex items-center justify-center text-2xl`}>
            {landTypeInfo.emoji}
          </div>
          <div>
            <h3 className="font-bold text-lg">{landTypeInfo.name}</h3>
            <p className="text-sm text-gray-400">#{Number(landId)}</p>
          </div>
        </div>
        <ExternalLink className="h-5 w-5 text-gray-400" />
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Bot className="h-4 w-4" />
            Capacity
          </div>
          <p className="font-bold">{capacity || 0} bots</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Zap className="h-4 w-4" />
            Expansions
          </div>
          <p className="font-bold">{expansions || 0}</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Calendar className="h-4 w-4" />
            Created
          </div>
          <p className="font-bold text-sm">{createdDate}</p>
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full mt-4 btn btn-outline text-sm">
        View on Farm
      </button>
    </motion.div>
  )
}

// Component for displaying a bot NFT card
function BotCard({ botId }: Readonly<{ botId: bigint }>) {
  const navigate = useNavigate()
  const { 
    botType, 
    harvestRate, 
    waterConsumption, 
    assignedLandId, 
    isActive, 
    totalHarvests, 
    isLoading 
  } = useBotInfo(botId)

  if (isLoading) {
    return (
      <div className="glass rounded-2xl p-6 border-2 border-white/10">
        <Loader2 className="h-12 w-12 mx-auto animate-spin text-gray-400" />
      </div>
    )
  }

  const botTypeInfo = BOT_TYPES[botType as 0 | 1 | 2] || BOT_TYPES[0]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`glass rounded-2xl p-6 border-2 transition-all cursor-pointer ${
        isActive ? 'border-green-500/50' : 'border-white/10 hover:border-primary/50'
      }`}
      onClick={() => navigate('/farm')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 bg-${botTypeInfo.color}-500/20 rounded-xl flex items-center justify-center text-2xl`}>
            {botTypeInfo.emoji}
          </div>
          <div>
            <h3 className="font-bold text-lg">{botTypeInfo.name}</h3>
            <p className="text-sm text-gray-400">#{Number(botId)}</p>
          </div>
        </div>
        {isActive && (
          <div className="flex items-center gap-1 text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full">
            <Activity className="h-3 w-3" />
            Active
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Trophy className="h-4 w-4" />
            Harvest Rate
          </div>
          <p className="font-bold">{harvestRate || 0}/hr</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Droplets className="h-4 w-4" />
            Water Usage
          </div>
          <p className="font-bold">{waterConsumption || 0}/hr</p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <MapPin className="h-4 w-4" />
            Assigned Land
          </div>
          <p className="font-bold">
            {assignedLandId && assignedLandId > 0n ? `#${Number(assignedLandId)}` : 'None'}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Package className="h-4 w-4" />
            Total Harvests
          </div>
          <p className="font-bold">{totalHarvests ? Number(totalHarvests) : 0}</p>
        </div>
      </div>

      {/* Action Button */}
      <button className="w-full mt-4 btn btn-outline text-sm">
        {isActive ? 'View on Farm' : 'Assign to Land'}
      </button>
    </motion.div>
  )
}

export default function InventoryPage() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Fetch data from blockchain
  const { landIds, isLoading: landsLoading } = useUserLands()
  const { botIds, isLoading: botsLoading } = useUserBots()
  const { orangeBalance, waterBalance, isLoading: balancesLoading } = useTokenBalances()

  const isLoading = landsLoading || botsLoading || balancesLoading

  // Filter assets based on search and tab
  const filteredLandIds = useMemo(() => {
    if (activeTab !== 'all' && activeTab !== 'lands') return []
    if (!landIds) return []
    if (!searchQuery) return landIds
    return landIds.filter((id) => id.toString().includes(searchQuery))
  }, [landIds, activeTab, searchQuery])

  const filteredBotIds = useMemo(() => {
    if (activeTab !== 'all' && activeTab !== 'bots') return []
    if (!botIds) return []
    if (!searchQuery) return botIds
    return botIds.filter((id) => id.toString().includes(searchQuery))
  }, [botIds, activeTab, searchQuery])

  const showTokens = activeTab === 'all' || activeTab === 'tokens'

  // Not connected state
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-12 border-2 border-white/10 text-center max-w-md">
          <Package className="h-20 w-20 mx-auto mb-6 text-gray-400" />
          <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to view your inventory and assets
          </p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 flex items-center gap-3">
            <Package className="h-10 w-10 text-primary" />
            Inventory
          </h1>
          <p className="text-base md:text-lg text-gray-400">
            View and manage all your farming assets
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass rounded-xl p-4 border-2 border-white/10 text-center">
          <Home className="h-8 w-8 mx-auto mb-2 text-blue-400" />
          <p className="text-2xl font-bold">{landIds?.length || 0}</p>
          <p className="text-sm text-gray-400">Land Plots</p>
        </div>

        <div className="glass rounded-xl p-4 border-2 border-white/10 text-center">
          <Bot className="h-8 w-8 mx-auto mb-2 text-purple-400" />
          <p className="text-2xl font-bold">{botIds?.length || 0}</p>
          <p className="text-sm text-gray-400">AI Bots</p>
        </div>

        <div className="glass rounded-xl p-4 border-2 border-primary/30 text-center">
          <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
          <p className="text-2xl font-bold text-primary">
            {balancesLoading ? '...' : formatTokenAmount(orangeBalance || 0n)}
          </p>
          <p className="text-sm text-gray-400">$ORANGE</p>
        </div>

        <div className="glass rounded-xl p-4 border-2 border-blue-500/30 text-center">
          <Droplets className="h-8 w-8 mx-auto mb-2 text-blue-400" />
          <p className="text-2xl font-bold text-blue-400">
            {balancesLoading ? '...' : formatTokenAmount(waterBalance || 0n)}
          </p>
          <p className="text-sm text-gray-400">Water</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium transition-all ${
            activeTab === 'all'
              ? 'bg-primary text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          All Assets
        </button>
        <button
          onClick={() => setActiveTab('lands')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === 'lands'
              ? 'bg-primary text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Home className="h-4 w-4" />
          Lands ({landIds?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('bots')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === 'bots'
              ? 'bg-primary text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Bot className="h-4 w-4" />
          Bots ({botIds?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('tokens')}
          className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
            activeTab === 'tokens'
              ? 'bg-primary text-white'
              : 'bg-white/5 text-gray-400 hover:bg-white/10'
          }`}
        >
          <Trophy className="h-4 w-4" />
          Tokens
        </button>
      </div>

      {/* Search */}
      <div className="glass rounded-2xl p-6 border-2 border-white/10">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by NFT ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-dark-100 border border-dark-100 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="glass rounded-2xl p-16 border-2 border-white/10 text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-xl text-gray-400">Loading your assets from blockchain...</p>
        </div>
      ) : (
        <>
          {/* Token Balances Section */}
          {showTokens && (
            <div>
              <h2 className="text-2xl font-bold mb-4">💰 Token Balances</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-8 border-2 border-primary/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold">$ORANGE Token</h3>
                    <Trophy className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-5xl font-bold text-primary mb-4">
                    {formatTokenAmount(orangeBalance || 0n)}
                  </p>
                  <p className="text-gray-400 mb-4">
                    Your main farming currency. Earn by harvesting oranges!
                  </p>
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="btn btn-primary w-full"
                  >
                    Buy More Assets
                  </button>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-2xl p-8 border-2 border-blue-500/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold">Water Token</h3>
                    <Droplets className="h-8 w-8 text-blue-400" />
                  </div>
                  <p className="text-5xl font-bold text-blue-400 mb-4">
                    {formatTokenAmount(waterBalance || 0n)}
                  </p>
                  <p className="text-gray-400 mb-4">
                    Essential for bot operations. Purchase in the marketplace.
                  </p>
                  <button
                    onClick={() => navigate('/marketplace')}
                    className="btn btn-outline w-full"
                  >
                    Buy Water
                  </button>
                </motion.div>
              </div>
            </div>
          )}

          {/* Land NFTs Section */}
          {filteredLandIds.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">🏞️ Land NFTs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredLandIds.map((landId) => (
                  <LandCard key={landId.toString()} landId={landId} />
                ))}
              </div>
            </div>
          )}

          {/* Bot NFTs Section */}
          {filteredBotIds.length > 0 && (
            <div>
              <h2 className="text-2xl font-bold mb-4">🤖 Bot NFTs</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBotIds.map((botId) => (
                  <BotCard key={botId.toString()} botId={botId} />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredLandIds.length === 0 && filteredBotIds.length === 0 && !showTokens && (
            <div className="glass rounded-2xl p-16 border-2 border-white/10 text-center">
              <Package className="h-20 w-20 mx-auto mb-4 text-gray-400" />
              <h2 className="text-2xl font-bold mb-2">No Assets Found</h2>
              <p className="text-gray-400 mb-6">
                {searchQuery
                  ? 'No assets match your search. Try a different NFT ID.'
                  : 'You don\'t have any assets yet. Visit the marketplace to get started!'}
              </p>
              <button
                onClick={() => navigate('/marketplace')}
                className="btn btn-primary"
              >
                Visit Marketplace
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
