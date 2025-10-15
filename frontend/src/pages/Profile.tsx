import { useState, useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useParams, useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import {
  User,
  Trophy,
  TrendingUp,
  Bot,
  Droplets,
  Copy,
  CheckCircle,
  Users,
  Gift,
  Award,
  Loader2,
  ExternalLink,
  Home,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  usePlayerProfile,
  usePlayerStats,
  usePlayerRank,
  useReferralData,
  useUserLands,
  useUserBots,
  useTokenBalances,
  formatTokenAmount,
} from '@hooks/useContracts'
import { showSuccessToast } from '@stores/uiStore'

export default function Profile() {
  const { address: connectedAddress } = useAccount()
  const { address: routeAddress } = useParams<{ address: string }>()
  const navigate = useNavigate()
  const [copiedReferralCode, setCopiedReferralCode] = useState(false)

  // Use route address if viewing someone else's profile, otherwise use connected address
  const profileAddress = routeAddress || connectedAddress

  // Fetch profile data from blockchain
  const { profile, isLoading: profileLoading } = usePlayerProfile(profileAddress)
  const { stats, isLoading: statsLoading } = usePlayerStats(profileAddress)
  const { rank, isLoading: rankLoading } = usePlayerRank(profileAddress)
  const { referredPlayers = [], totalRewards = 0n } = useReferralData(profileAddress)
  
  // Fetch assets
  const { landIds } = useUserLands()
  const { botIds } = useUserBots()
  const { orangeBalance, waterBalance, isLoading: balancesLoading } = useTokenBalances()

  const isOwnProfile = connectedAddress && profileAddress?.toLowerCase() === connectedAddress.toLowerCase()
  const isLoading = profileLoading || statsLoading || rankLoading

  // Copy referral code to clipboard
  const handleCopyReferralCode = () => {
    if (profile?.referralCode) {
      navigator.clipboard.writeText(profile.referralCode)
      setCopiedReferralCode(true)
      showSuccessToast('Copied!', 'Referral code copied to clipboard')
      setTimeout(() => setCopiedReferralCode(false), 2000)
    }
  }

  // Format registration date
  const registrationDate = useMemo(() => {
    if (!profile?.registrationTimestamp) return 'Unknown'
    const date = new Date(Number(profile.registrationTimestamp) * 1000)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
  }, [profile?.registrationTimestamp])

  // Not connected state
  if (!connectedAddress && !routeAddress) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-12 border-2 border-white/10 text-center max-w-md">
          <User className="h-20 w-20 mx-auto mb-6 text-gray-400" />
          <h2 className="text-3xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-400 mb-6">
            Connect your wallet to view your profile and farming stats
          </p>
          <ConnectButton />
        </div>
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-xl text-gray-400">Loading profile from blockchain...</p>
        </div>
      </div>
    )
  }

  // Profile not found
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="glass rounded-2xl p-12 border-2 border-white/10 text-center max-w-md">
          <User className="h-20 w-20 mx-auto mb-6 text-gray-400" />
          <h2 className="text-3xl font-bold mb-4">Profile Not Found</h2>
          <p className="text-gray-400 mb-6">
            This address hasn't registered yet or doesn't exist
          </p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            <Home className="h-5 w-5 mr-2" />
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Profile Header */}
      <div className="glass rounded-2xl p-8 border-2 border-white/10">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
          {/* Left: Avatar & Info */}
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center text-5xl shrink-0">
              🧑‍🌾
            </div>

            {/* Info */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">
                {profile.username || 'Anonymous Farmer'}
              </h1>
              <p className="text-gray-400 font-mono text-sm mb-4">
                {profileAddress?.slice(0, 10)}...{profileAddress?.slice(-8)}
              </p>
              <a
                href={`https://explorer.somnia.network/address/${profileAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                View on Explorer <ExternalLink className="h-4 w-4" />
              </a>
              <p className="text-sm text-gray-500 mt-2">
                🗓️ Joined {registrationDate}
              </p>
            </div>
          </div>

          {/* Right: Quick Stats */}
          <div className="flex flex-col gap-2">
            <div className="glass rounded-xl p-4 border border-white/10 text-center">
              <p className="text-xs text-gray-400 mb-1">Global Rank</p>
              <p className="text-3xl font-bold text-primary">
                {rankLoading ? '...' : rank ? `#${Number(rank)}` : 'Unranked'}
              </p>
            </div>
            <div className="glass rounded-xl p-4 border border-white/10 text-center">
              <p className="text-xs text-gray-400 mb-1">Level</p>
              <p className="text-3xl font-bold text-white">{stats?.level || 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Oranges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl p-6 border-2 border-white/10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <p className="text-sm text-gray-400">Total Harvest</p>
          </div>
          <p className="text-3xl font-bold text-primary">
            {stats ? formatTokenAmount(stats.totalOrangesCommitted) : '0'} 🍊
          </p>
        </motion.div>

        {/* Total Harvests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-6 border-2 border-white/10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-green-400" />
            </div>
            <p className="text-sm text-gray-400">Total Harvests</p>
          </div>
          <p className="text-3xl font-bold">{stats ? Number(stats.totalHarvests) : 0}</p>
        </motion.div>

        {/* Lands Owned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 border-2 border-white/10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Home className="h-6 w-6 text-blue-400" />
            </div>
            <p className="text-sm text-gray-400">Land Plots</p>
          </div>
          <p className="text-3xl font-bold">{landIds?.length || 0}</p>
        </motion.div>

        {/* Bots Owned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-6 border-2 border-white/10"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <Bot className="h-6 w-6 text-purple-400" />
            </div>
            <p className="text-sm text-gray-400">AI Bots</p>
          </div>
          <p className="text-3xl font-bold">{botIds?.length || 0}</p>
        </motion.div>
      </div>

      {/* Token Balances (Only show for own profile) */}
      {isOwnProfile && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border-2 border-primary/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">$ORANGE Balance</h3>
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <p className="text-4xl font-bold text-primary">
              {balancesLoading ? '...' : formatTokenAmount(orangeBalance || 0n)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-6 border-2 border-blue-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Water Tokens</h3>
              <Droplets className="h-6 w-6 text-blue-400" />
            </div>
            <p className="text-4xl font-bold text-blue-400">
              {balancesLoading ? '...' : formatTokenAmount(waterBalance || 0n)}
            </p>
          </motion.div>
        </div>
      )}

      {/* Referral Section (Only show for own profile) */}
      {isOwnProfile && profile.referralCode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8 border-2 border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <Gift className="h-8 w-8 text-primary" />
            <h2 className="text-3xl font-bold">Referral Program</h2>
          </div>

          {/* Referral Code */}
          <div className="glass rounded-xl p-6 border border-primary/30 mb-6">
            <p className="text-sm text-gray-400 mb-2">Your Referral Code</p>
            <div className="flex items-center gap-3">
              <p className="text-3xl font-bold text-primary font-mono flex-1">
                {profile.referralCode}
              </p>
              <button
                onClick={handleCopyReferralCode}
                className="btn btn-primary flex items-center gap-2"
              >
                {copiedReferralCode ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-3">
              Share this code with friends to earn rewards when they join!
            </p>
          </div>

          {/* Referral Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="glass rounded-xl p-4 border border-white/10 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{referredPlayers.length}</p>
              <p className="text-sm text-gray-400">Referred Friends</p>
            </div>
            <div className="glass rounded-xl p-4 border border-white/10 text-center">
              <Trophy className="h-8 w-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold text-primary">
                {formatTokenAmount(totalRewards)}
              </p>
              <p className="text-sm text-gray-400">Total Rewards</p>
            </div>
            <div className="glass rounded-xl p-4 border border-white/10 text-center">
              <Award className="h-8 w-8 mx-auto mb-2 text-green-400" />
              <p className="text-2xl font-bold text-green-400">
                {referredPlayers.filter((addr) => addr !== '0x0000000000000000000000000000000000000000').length}
              </p>
              <p className="text-sm text-gray-400">Active Referrals</p>
            </div>
          </div>

          {/* Referred Players List */}
          {referredPlayers.length > 0 && referredPlayers[0] !== '0x0000000000000000000000000000000000000000' && (
            <div>
              <h3 className="text-xl font-bold mb-4">Your Referrals</h3>
              <div className="space-y-2">
                {referredPlayers
                  .filter((addr) => addr !== '0x0000000000000000000000000000000000000000')
                  .map((playerAddress, index) => (
                    <div
                      key={playerAddress}
                      className="glass rounded-xl p-4 border border-white/10 flex items-center justify-between hover:border-primary/50 transition-all cursor-pointer"
                      onClick={() => navigate(`/profile/${playerAddress}`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center font-bold">
                          #{index + 1}
                        </div>
                        <p className="font-mono">
                          {playerAddress.slice(0, 10)}...{playerAddress.slice(-8)}
                        </p>
                      </div>
                      <ExternalLink className="h-5 w-5 text-gray-400" />
                    </div>
                  ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Viewing someone else's profile */}
      {!isOwnProfile && (
        <div className="glass rounded-2xl p-6 border-2 border-white/10 text-center">
          <p className="text-gray-400">
            You are viewing {profile.username || 'Anonymous Farmer'}'s profile
          </p>
          <button
            onClick={() => navigate(`/profile/${connectedAddress}`)}
            className="btn btn-primary mt-4"
          >
            View My Profile
          </button>
        </div>
      )}
    </div>
  )
}
