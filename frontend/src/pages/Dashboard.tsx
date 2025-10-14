import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { TrendingUp, Sprout, Award, DollarSign, Loader2 } from 'lucide-react'
import { 
  useIsRegistered, 
  useDashboardStats, 
  usePlayerRank,
  useReferralData,
  formatTokenAmount 
} from '@hooks/useContracts'

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  
  // Check if player is registered
  const { isRegistered, isLoading: isCheckingRegistration } = useIsRegistered()
  
  // Get dashboard stats
  const dashboardData = useDashboardStats()
  
  // Get player rank
  const { rank, isLoading: isLoadingRank } = usePlayerRank()
  
  // Get referral data
  const { referredPlayers } = useReferralData()

  // Loading state
  const isLoading = isCheckingRegistration || dashboardData.isLoading || isLoadingRank

  // Prepare stats cards
  const stats = [
    {
      label: 'Total Oranges',
      value: formatTokenAmount(dashboardData.totalOranges),
      icon: Sprout,
      color: 'text-green-400',
    },
    {
      label: 'Balance',
      value: `${formatTokenAmount(dashboardData.orangeTokenBalance)} $ORANGE`,
      icon: DollarSign,
      color: 'text-primary',
    },
    {
      label: 'Level',
      value: dashboardData.level,
      icon: TrendingUp,
      color: 'text-secondary',
    },
    {
      label: 'Global Rank',
      value: rank ? `#${rank.toString()}` : 'N/A',
      icon: Award,
      color: 'text-yellow-400',
    },
  ]
  
  // Format last harvest date
  const getLastHarvestDate = () => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />
    if (!dashboardData.lastHarvest) return 'Never'
    return new Date(Number(dashboardData.lastHarvest) * 1000).toLocaleDateString()
  }
  
  // Format registration date
  const getRegistrationDate = () => {
    if (isLoading) return <Loader2 className="h-5 w-5 animate-spin" />
    if (!dashboardData.registeredAt) return 'Unknown'
    return new Date(Number(dashboardData.registeredAt) * 1000).toLocaleDateString()
  }

  return (
    <div className="space-y-8">
      {/* Registration Banner - Only show if not connected or not registered */}
      {!isConnected && (
        <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">👋 Welcome to Orange Farm!</h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                Connect your wallet to start earning $ORANGE tokens and compete with other farmers.
              </p>
            </div>
            <ConnectButton />
          </div>
        </div>
      )}

      {isConnected && !isCheckingRegistration && !isRegistered && (
        <div className="card bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">🎉 Ready to Start Farming?</h3>
              <p className="text-lg text-gray-300 mb-5 leading-relaxed">
                Register now to claim your free starter pack: 1 Land NFT, 1 Bot NFT, and 100 Water Tokens!
              </p>
              <button 
                onClick={() => navigate('/register')} 
                className="btn btn-primary text-lg px-8"
              >
                Register Now - It's Free!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Welcome Section */}
      <div className="card">
        <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">
          {isConnected && isRegistered 
            ? `Welcome back, ${dashboardData.username}! 👋`
            : 'Welcome to Orange Farm! 🍊'
          }
        </h1>
        <div className="flex flex-wrap items-center gap-4 text-base md:text-lg text-gray-400">
          {isConnected ? (
            <>
              <span>Address: {address?.slice(0, 6)}...{address?.slice(-4)}</span>
              {isRegistered && (
                <>
                  <span>•</span>
                  <span>Level {dashboardData.level}</span>
                  <span>•</span>
                  <span>{formatTokenAmount(dashboardData.totalOranges)} Oranges</span>
                </>
              )}
            </>
          ) : (
            <span>Connect your wallet to view your stats</span>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card">
              <div className="flex items-center justify-between mb-4">
                <span className="text-base md:text-lg text-gray-400">{stat.label}</span>
                <Icon className={`h-7 w-7 md:h-8 md:w-8 ${stat.color}`} />
              </div>
              <div className="text-3xl md:text-4xl font-bold">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                ) : (
                  stat.value
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Inventory Overview */}
      <div className="card">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-8">Your Inventory</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass rounded-xl p-6">
            <p className="text-base md:text-lg text-gray-400 mb-3">Land Plots</p>
            <p className="text-4xl md:text-5xl font-bold text-green-400">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                dashboardData.landCount
              )}
            </p>
          </div>
          <div className="glass rounded-xl p-6">
            <p className="text-base md:text-lg text-gray-400 mb-3">AI Bots</p>
            <p className="text-4xl md:text-5xl font-bold text-blue-400">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                dashboardData.botCount
              )}
            </p>
          </div>
          <div className="glass rounded-xl p-6">
            <p className="text-base md:text-lg text-gray-400 mb-3">Water Tokens</p>
            <p className="text-4xl md:text-5xl font-bold text-cyan-400">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                formatTokenAmount(dashboardData.waterBalance)
              )}
            </p>
          </div>
          <div className="glass rounded-xl p-6">
            <p className="text-base md:text-lg text-gray-400 mb-3">Referrals</p>
            <p className="text-4xl md:text-5xl font-bold text-purple-400">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                referredPlayers?.length || 0
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-8">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <button 
            className="btn btn-primary py-6 text-lg"
            onClick={() => navigate('/farm')}
          >
            <Sprout className="h-6 w-6 mr-2" />
            Go to Farm
          </button>
          <button 
            className="btn btn-outline py-6 text-lg"
            onClick={() => navigate('/marketplace')}
          >
            <DollarSign className="h-6 w-6 mr-2" />
            Visit Marketplace
          </button>
          <button 
            className="btn btn-outline py-6 text-lg"
            onClick={() => navigate('/leaderboard')}
          >
            <Award className="h-6 w-6 mr-2" />
            View Leaderboard
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="card">
        <h2 className="text-3xl md:text-4xl font-display font-bold mb-8">Farming Stats</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <p className="text-base md:text-lg text-gray-400 mb-3">Total Harvests</p>
            <p className="text-3xl md:text-4xl font-bold">
              {isLoading ? (
                <Loader2 className="h-8 w-8 animate-spin" />
              ) : (
                dashboardData.totalHarvests?.toString() || '0'
              )}
            </p>
          </div>
          <div>
            <p className="text-base md:text-lg text-gray-400 mb-3">Registered</p>
            <p className="text-3xl md:text-4xl font-bold">
              {getRegistrationDate()}
            </p>
          </div>
          <div>
            <p className="text-base md:text-lg text-gray-400 mb-3">Last Harvest</p>
            <p className="text-3xl md:text-4xl font-bold">
              {getLastHarvestDate()}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
