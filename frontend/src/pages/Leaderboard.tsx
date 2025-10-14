import { useState, useEffect, useMemo } from 'react'
import { Trophy, Medal, RefreshCw, Loader2, Crown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAccount } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { showSuccessToast } from '@stores/uiStore'
import { useLeaderboard, usePlayerRank, formatTokenAmount } from '@hooks/useContracts'

interface LeaderboardEntry {
  rank: number
  walletAddress: string
  totalOranges: bigint
  level: number
  isCurrentUser?: boolean
}

export default function LeaderboardPage() {
  const { address, isConnected } = useAccount()
  const navigate = useNavigate()
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [showUpdateIndicator, setShowUpdateIndicator] = useState(false)

  // Fetch leaderboard data from blockchain (auto-refetch every 30s)
  const { players, oranges, levels, isLoading, refetch } = useLeaderboard(10)
  const { rank: currentUserRank, isLoading: isLoadingRank } = usePlayerRank(address)

  // Transform blockchain data to UI format
  const leaderboard: LeaderboardEntry[] = useMemo(() => {
    if (!players || players.length === 0) return []
    
    return players.map((walletAddress, index) => ({
      rank: index + 1,
      walletAddress,
      totalOranges: oranges[index] || 0n,
      level: levels[index] || 0,
      isCurrentUser: address && walletAddress.toLowerCase() === address.toLowerCase(),
    }))
  }, [players, oranges, levels, address])

  // Auto-refresh effect - show indicator when data updates
  useEffect(() => {
    if (!isLoading && leaderboard.length > 0) {
      setShowUpdateIndicator(true)
      setLastUpdate(new Date())
      setTimeout(() => setShowUpdateIndicator(false), 2000)
    }
  }, [players, isLoading, leaderboard.length])

  const handleRefresh = async () => {
    await refetch()
    showSuccessToast('Refreshed', 'Latest rankings loaded from blockchain')
  }

  const topThree = leaderboard.slice(0, 3)
  const restOfLeaderboard = leaderboard.slice(3)

  const currentUserEntry = leaderboard.find((entry) => entry.isCurrentUser)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3 flex items-center gap-3">
            Leaderboard <Trophy className="h-10 w-10 text-yellow-400" />
          </h1>
          <p className="text-base md:text-lg text-gray-400">
            Compete with farmers around the world on Somnia blockchain
          </p>
          <div className="flex items-center gap-3 mt-2">
            <p className="text-sm md:text-base text-gray-500">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
            <AnimatePresence>
              {showUpdateIndicator && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full"
                >
                  ● Live
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isLoading}
          className="btn btn-outline flex items-center gap-2"
        >
          <RefreshCw className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Loading State */}
      {isLoading && leaderboard.length === 0 ? (
        <div className="glass rounded-2xl p-16 border-2 border-white/10 text-center">
          <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-xl text-gray-400">Loading rankings from blockchain...</p>
          <p className="text-sm text-gray-500 mt-2">Fetching top 10 farmers</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="glass rounded-2xl p-16 border-2 border-white/10 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-gray-400" />
          <p className="text-xl text-gray-400">No rankings yet</p>
          <p className="text-sm text-gray-500 mt-2">Be the first to earn $ORANGE and climb the leaderboard!</p>
        </div>
      ) : (
        <>
          {/* Current User Rank Banner */}
          {isConnected && currentUserRank && !isLoadingRank && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-2xl p-6 border-2 border-primary/50 bg-gradient-to-r from-primary/10 to-secondary/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-16 h-16 bg-primary rounded-2xl font-bold text-2xl shadow-lg">
                    #{Number(currentUserRank)}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-white mb-1">Your Global Rank</p>
                    <p className="text-sm text-gray-400">
                      {currentUserEntry && formatTokenAmount(currentUserEntry.totalOranges)} 🍊 total earned
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400 mb-1">Level</p>
                  <p className="text-4xl font-bold text-primary">
                    {currentUserEntry?.level || 0}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Podium (Top 3) */}
          <div className="relative">
            <div className="grid grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
              {/* 2nd Place */}
              {topThree[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex flex-col items-center"
                >
                  <Medal className="h-8 w-8 text-gray-400 mb-2" />
                  <div className="w-full aspect-square mb-3 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full p-1">
                    <div className="w-full h-full bg-dark-200 rounded-full flex items-center justify-center text-3xl">
                      🥈
                    </div>
                  </div>
                  <div
                    className="glass rounded-2xl p-4 border-2 border-white/10 hover:border-gray-400/50 transition-all cursor-pointer w-full"
                    onClick={() => navigate(`/profile/${topThree[1].walletAddress}`)}
                  >
                    <p className="font-bold text-white truncate text-center">
                      {topThree[1].walletAddress.slice(0, 6)}...{topThree[1].walletAddress.slice(-4)}
                    </p>
                    <p className="text-2xl font-bold text-primary my-1 text-center">
                      {formatTokenAmount(topThree[1].totalOranges)} 🍊
                    </p>
                    <p className="text-xs text-gray-400 text-center">Level {topThree[1].level}</p>
                  </div>
                  <div className="w-full h-32 bg-gradient-to-b from-gray-300/20 to-gray-500/20 rounded-t-lg mt-2" />
                </motion.div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0 }}
                  className="flex flex-col items-center relative"
                >
                  <Crown className="h-10 w-10 text-yellow-400 mb-2" />
                  <div className="w-full aspect-square mb-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full p-1">
                    <div className="w-full h-full bg-dark-200 rounded-full flex items-center justify-center text-4xl">
                      🥇
                    </div>
                  </div>
                  <div
                    className="glass rounded-2xl p-4 border-2 border-yellow-400/50 hover:border-yellow-400 transition-all cursor-pointer w-full"
                    onClick={() => navigate(`/profile/${topThree[0].walletAddress}`)}
                  >
                    <p className="font-bold text-yellow-400 truncate text-center">
                      {topThree[0].walletAddress.slice(0, 6)}...{topThree[0].walletAddress.slice(-4)}
                    </p>
                    <p className="text-3xl font-bold text-primary my-1 text-center">
                      {formatTokenAmount(topThree[0].totalOranges)} 🍊
                    </p>
                    <p className="text-xs text-gray-400 text-center">Level {topThree[0].level}</p>
                  </div>
                  <div className="w-full h-48 bg-gradient-to-b from-yellow-400/20 to-yellow-600/20 rounded-t-lg mt-2" />
                </motion.div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col items-center"
                >
                  <Medal className="h-8 w-8 text-orange-400 mb-2" />
                  <div className="w-full aspect-square mb-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full p-1">
                    <div className="w-full h-full bg-dark-200 rounded-full flex items-center justify-center text-3xl">
                      🥉
                    </div>
                  </div>
                  <div
                    className="glass rounded-2xl p-4 border-2 border-white/10 hover:border-orange-400/50 transition-all cursor-pointer w-full"
                    onClick={() => navigate(`/profile/${topThree[2].walletAddress}`)}
                  >
                    <p className="font-bold text-white truncate text-center">
                      {topThree[2].walletAddress.slice(0, 6)}...{topThree[2].walletAddress.slice(-4)}
                    </p>
                    <p className="text-2xl font-bold text-primary my-1 text-center">
                      {formatTokenAmount(topThree[2].totalOranges)} 🍊
                    </p>
                    <p className="text-xs text-gray-400 text-center">Level {topThree[2].level}</p>
                  </div>
                  <div className="w-full h-24 bg-gradient-to-b from-orange-400/20 to-orange-600/20 rounded-t-lg mt-2" />
                </motion.div>
              )}
            </div>
          </div>

          {/* Rest of Leaderboard */}
          {restOfLeaderboard.length > 0 && (
            <div className="glass rounded-2xl p-2 border-2 border-white/10">
              <div className="divide-y divide-white/5">
                {restOfLeaderboard.map((entry, index) => (
                  <motion.div
                    key={entry.walletAddress}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`p-4 hover:bg-white/5 transition-colors cursor-pointer rounded-lg ${
                      entry.isCurrentUser ? 'bg-primary/10 border border-primary/30' : ''
                    }`}
                    onClick={() => navigate(`/profile/${entry.walletAddress}`)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {/* Rank */}
                        <div className="flex items-center justify-center w-12 h-12 bg-dark-100 rounded-xl font-bold text-lg text-gray-400">
                          #{entry.rank}
                        </div>

                        {/* Avatar */}
                        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center text-2xl">
                          👤
                        </div>

                        {/* Name & Stats */}
                        <div className="flex-1">
                          <p className="font-bold text-white">
                            {entry.walletAddress.slice(0, 6)}...{entry.walletAddress.slice(-4)}
                          </p>
                          <p className="text-sm text-gray-400">Level {entry.level}</p>
                        </div>
                      </div>

                      {/* Oranges */}
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">
                          {formatTokenAmount(entry.totalOranges)}
                        </p>
                        <p className="text-xs text-gray-400">🍊 Earned</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
