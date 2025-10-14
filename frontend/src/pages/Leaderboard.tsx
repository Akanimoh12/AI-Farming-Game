import { useState, useEffect } from 'react'
import { Trophy, Medal, Users, Calendar, RefreshCw, ExternalLink } from 'lucide-react'
import { Card, Button, Modal, ModalFooter } from '@components/common'
import { motion } from 'framer-motion'
import { useAccount } from 'wagmi'
import { showSuccessToast } from '@stores/uiStore'

type FilterType = 'global' | 'friends' | 'season'

interface LeaderboardEntry {
  rank: number
  walletAddress: string
  displayName?: string
  avatarUrl?: string
  totalOranges: number
  level: number
  joinedAt: string
  isCurrentUser?: boolean
}

// Mock data - replace with actual Firestore queries
const mockLeaderboard: LeaderboardEntry[] = [
  {
    rank: 1,
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    displayName: 'OrangeFarmer',
    totalOranges: 15420,
    level: 18,
    joinedAt: '2024-01-15',
  },
  {
    rank: 2,
    walletAddress: '0x8626f6940E2eb28930eFb4CeF49B2d1F2C9C119',
    displayName: 'BotMaster3000',
    totalOranges: 14280,
    level: 17,
    joinedAt: '2024-01-20',
  },
  {
    rank: 3,
    walletAddress: '0xdD2FD4581271e230360230F9337D5c0430Bf44C',
    displayName: 'CitrusKing',
    totalOranges: 13150,
    level: 16,
    joinedAt: '2024-02-01',
  },
  {
    rank: 4,
    walletAddress: '0xcd3B766CCDd6AE721141F452C550Ca635964ce7',
    totalOranges: 11890,
    level: 15,
    joinedAt: '2024-02-05',
  },
  {
    rank: 5,
    walletAddress: '0x2546BcD3c84621e976D8185a91A922aE77ECEc3',
    displayName: 'FarmQueen',
    totalOranges: 10750,
    level: 14,
    joinedAt: '2024-02-10',
  },
  // Add more mock entries...
]

export default function LeaderboardPage() {
  const { address } = useAccount()
  const [filter, setFilter] = useState<FilterType>('global')
  const [leaderboard] = useState<LeaderboardEntry[]>(mockLeaderboard)
  const [selectedPlayer, setSelectedPlayer] = useState<LeaderboardEntry | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Auto-refresh every 15 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh()
    }, 15 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Fetch latest leaderboard from Firestore (replace with actual query)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setLastUpdate(new Date())
    setIsRefreshing(false)
    showSuccessToast('Refreshed', 'Leaderboard updated')
  }

  const topThree = leaderboard.slice(0, 3)
  const restOfLeaderboard = leaderboard.slice(3)

  const currentUserRank = leaderboard.find(
    (entry) => entry.walletAddress.toLowerCase() === address?.toLowerCase()
  )

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">Leaderboard 🏆</h1>
          <p className="text-base md:text-lg text-gray-400">Compete with farmers around the world</p>
          <p className="text-sm md:text-base text-gray-500 mt-2">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        </div>
        <Button
          variant="outline"
          size="lg"
          icon={<RefreshCw />}
          onClick={handleRefresh}
          loading={isRefreshing}
        >
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card padding="md">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filter === 'global' ? 'primary' : 'ghost'}
            icon={<Trophy />}
            size="sm"
            onClick={() => setFilter('global')}
          >
            Global
          </Button>
          <Button
            variant={filter === 'friends' ? 'primary' : 'ghost'}
            icon={<Users />}
            size="sm"
            onClick={() => setFilter('friends')}
          >
            Friends
          </Button>
          <Button
            variant={filter === 'season' ? 'primary' : 'ghost'}
            icon={<Calendar />}
            size="sm"
            onClick={() => setFilter('season')}
          >
            This Season
          </Button>
        </div>
      </Card>

      {/* Current User Rank */}
      {currentUserRank && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 bg-primary rounded-full font-bold text-xl">
                #{currentUserRank.rank}
              </div>
              <div>
                <p className="font-bold text-white">Your Rank</p>
                <p className="text-sm text-gray-400">{currentUserRank.totalOranges} 🍊 earned</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Level</p>
              <p className="text-2xl font-bold text-primary">{currentUserRank.level}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Podium (Top 3) */}
      <div className="relative">
        <div className="grid grid-cols-3 gap-4 items-end max-w-4xl mx-auto">
          {/* 2nd Place */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col items-center"
          >
            <Medal className="h-8 w-8 text-gray-400 mb-2" />
            <div className="w-full aspect-square mb-3 bg-gradient-to-br from-gray-300 to-gray-500 rounded-full p-1">
              <div className="w-full h-full bg-dark-200 rounded-full flex items-center justify-center text-3xl">
                {topThree[1]?.avatarUrl ? (
                  <img
                    src={topThree[1].avatarUrl}
                    alt={topThree[1].displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  '👤'
                )}
              </div>
            </div>
            <Card
              variant="glass"
              padding="md"
              clickable
              onClick={() => setSelectedPlayer(topThree[1])}
            >
              <p className="font-bold text-white truncate">
                {topThree[1]?.displayName || 'Anonymous'}
              </p>
              <p className="text-2xl font-bold text-primary my-1">{topThree[1]?.totalOranges} 🍊</p>
              <p className="text-xs text-gray-400">Level {topThree[1]?.level}</p>
            </Card>
            <div className="w-full h-32 bg-gradient-to-b from-gray-300/20 to-gray-500/20 rounded-t-lg mt-2" />
          </motion.div>

          {/* 1st Place */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0 }}
            className="flex flex-col items-center relative"
          >
            <Trophy className="h-10 w-10 text-yellow-400 mb-2" />
            <div className="w-full aspect-square mb-3 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full p-1">
              <div className="w-full h-full bg-dark-200 rounded-full flex items-center justify-center text-4xl">
                {topThree[0]?.avatarUrl ? (
                  <img
                    src={topThree[0].avatarUrl}
                    alt={topThree[0].displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  '👑'
                )}
              </div>
            </div>
            <Card
              variant="glass"
              padding="md"
              clickable
              onClick={() => setSelectedPlayer(topThree[0])}
            >
              <p className="font-bold text-yellow-400 truncate">
                {topThree[0]?.displayName || 'Anonymous'}
              </p>
              <p className="text-3xl font-bold text-primary my-1">{topThree[0]?.totalOranges} 🍊</p>
              <p className="text-xs text-gray-400">Level {topThree[0]?.level}</p>
            </Card>
            <div className="w-full h-48 bg-gradient-to-b from-yellow-400/20 to-yellow-600/20 rounded-t-lg mt-2" />
          </motion.div>

          {/* 3rd Place */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <Medal className="h-8 w-8 text-orange-400 mb-2" />
            <div className="w-full aspect-square mb-3 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full p-1">
              <div className="w-full h-full bg-dark-200 rounded-full flex items-center justify-center text-3xl">
                {topThree[2]?.avatarUrl ? (
                  <img
                    src={topThree[2].avatarUrl}
                    alt={topThree[2].displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  '👤'
                )}
              </div>
            </div>
            <Card
              variant="glass"
              padding="md"
              clickable
              onClick={() => setSelectedPlayer(topThree[2])}
            >
              <p className="font-bold text-white truncate">
                {topThree[2]?.displayName || 'Anonymous'}
              </p>
              <p className="text-2xl font-bold text-primary my-1">{topThree[2]?.totalOranges} 🍊</p>
              <p className="text-xs text-gray-400">Level {topThree[2]?.level}</p>
            </Card>
            <div className="w-full h-24 bg-gradient-to-b from-orange-400/20 to-orange-600/20 rounded-t-lg mt-2" />
          </motion.div>
        </div>
      </div>

      {/* Rest of Leaderboard */}
      <Card>
        <div className="divide-y divide-dark-100">
          {restOfLeaderboard.map((entry, index) => (
            <motion.div
              key={entry.walletAddress}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`p-4 hover:bg-dark-100/50 transition-colors cursor-pointer ${
                entry.isCurrentUser ? 'bg-primary/10' : ''
              }`}
              onClick={() => setSelectedPlayer(entry)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  {/* Rank */}
                  <div className="flex items-center justify-center w-10 h-10 bg-dark-100 rounded-full font-bold text-gray-400">
                    #{entry.rank}
                  </div>

                  {/* Avatar */}
                  <div className="w-12 h-12 bg-dark-100 rounded-full flex items-center justify-center text-2xl">
                    {entry.avatarUrl ? (
                      <img
                        src={entry.avatarUrl}
                        alt={entry.displayName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      '👤'
                    )}
                  </div>

                  {/* Name & Stats */}
                  <div className="flex-1">
                    <p className="font-bold text-white">
                      {entry.displayName || `${entry.walletAddress.slice(0, 6)}...${entry.walletAddress.slice(-4)}`}
                    </p>
                    <p className="text-sm text-gray-400">
                      Level {entry.level} • Joined {new Date(entry.joinedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Oranges */}
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">{entry.totalOranges} 🍊</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Card>

      {/* Player Profile Modal */}
      <Modal
        isOpen={selectedPlayer !== null}
        onClose={() => setSelectedPlayer(null)}
        title="Player Profile"
        description={selectedPlayer?.displayName || 'Anonymous Farmer'}
      >
        {selectedPlayer && (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-dark-100 rounded-full flex items-center justify-center text-4xl">
                {selectedPlayer.avatarUrl ? (
                  <img
                    src={selectedPlayer.avatarUrl}
                    alt={selectedPlayer.displayName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  '👤'
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white">
                  {selectedPlayer.displayName || 'Anonymous'}
                </h3>
                <p className="text-sm text-gray-400 font-mono">
                  {selectedPlayer.walletAddress.slice(0, 10)}...{selectedPlayer.walletAddress.slice(-8)}
                </p>
                <a
                  href={`https://explorer.somnia.network/address/${selectedPlayer.walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                >
                  View on Explorer <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-dark-100 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Rank</p>
                <p className="text-3xl font-bold text-primary">#{selectedPlayer.rank}</p>
              </div>
              <div className="bg-dark-100 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Total Harvest</p>
                <p className="text-3xl font-bold text-primary">{selectedPlayer.totalOranges} 🍊</p>
              </div>
              <div className="bg-dark-100 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Level</p>
                <p className="text-3xl font-bold text-white">{selectedPlayer.level}</p>
              </div>
              <div className="bg-dark-100 rounded-lg p-4">
                <p className="text-xs text-gray-400 mb-1">Member Since</p>
                <p className="text-lg font-bold text-white">
                  {new Date(selectedPlayer.joinedAt).toLocaleDateString('en-US', {
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="primary" fullWidth>
                Add Friend
              </Button>
              <Button variant="outline" fullWidth>
                Send Message
              </Button>
            </div>
          </div>
        )}

        <ModalFooter>
          <Button variant="ghost" onClick={() => setSelectedPlayer(null)}>
            Close
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}
