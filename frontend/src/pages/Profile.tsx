import { useState } from 'react'
import { useAccount } from 'wagmi'
import {
  User,
  Trophy,
  TrendingUp,
  MapPin,
  Bot,
  Droplets,
  Share2,
  Download,
  Edit,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Gift,
  Award,
  Lock,
  CheckCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, Button, Modal } from '@components/common'
import { useUserStore } from '@stores/userStore'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt?: string
  progress?: number
  maxProgress?: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

interface Transaction {
  id: string
  type: 'purchase' | 'sale' | 'harvest' | 'reward'
  description: string
  amount: string
  asset?: string
  timestamp: string
  status: 'completed' | 'pending' | 'failed'
  txHash?: string
}

interface ReferralData {
  totalReferred: number
  activeReferrals: number
  totalRewards: string
  referralCode: string
  referrals: {
    address: string
    joinedAt: string
    isActive: boolean
    rewardsEarned: string
  }[]
}

// Mock data - replace with actual data from Firestore
const mockAchievements: Achievement[] = [
  {
    id: '1',
    name: 'First Harvest',
    description: 'Complete your first orange harvest',
    icon: '🍊',
    unlocked: true,
    unlockedAt: '2025-10-01T10:00:00Z',
    rarity: 'common',
  },
  {
    id: '2',
    name: 'Land Baron',
    description: 'Own 10 plots of land',
    icon: '🏞️',
    unlocked: true,
    unlockedAt: '2025-10-05T14:30:00Z',
    progress: 10,
    maxProgress: 10,
    rarity: 'rare',
  },
  {
    id: '3',
    name: 'Bot Master',
    description: 'Own 5 harvesting bots',
    icon: '🤖',
    unlocked: false,
    progress: 3,
    maxProgress: 5,
    rarity: 'rare',
  },
  {
    id: '4',
    name: 'Orange Millionaire',
    description: 'Harvest 1,000,000 oranges',
    icon: '💰',
    unlocked: false,
    progress: 450000,
    maxProgress: 1000000,
    rarity: 'epic',
  },
  {
    id: '5',
    name: 'Top 10 Farmer',
    description: 'Reach top 10 on the leaderboard',
    icon: '🏆',
    unlocked: true,
    unlockedAt: '2025-10-10T09:15:00Z',
    rarity: 'epic',
  },
  {
    id: '6',
    name: 'Legendary Farmer',
    description: 'Reach #1 on the leaderboard',
    icon: '👑',
    unlocked: false,
    rarity: 'legendary',
  },
]

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'purchase',
    description: 'Purchased Land Plot #42',
    amount: '-500',
    asset: 'STT',
    timestamp: '2025-10-13T15:30:00Z',
    status: 'completed',
    txHash: '0xabc123...',
  },
  {
    id: '2',
    type: 'harvest',
    description: 'Harvested 1,250 oranges',
    amount: '+1,250',
    asset: 'ORANGE',
    timestamp: '2025-10-13T12:00:00Z',
    status: 'completed',
    txHash: '0xdef456...',
  },
  {
    id: '3',
    type: 'sale',
    description: 'Sold 500 oranges',
    amount: '+250',
    asset: 'STT',
    timestamp: '2025-10-12T18:45:00Z',
    status: 'completed',
    txHash: '0xghi789...',
  },
  {
    id: '4',
    type: 'reward',
    description: 'Referral bonus',
    amount: '+100',
    asset: 'STT',
    timestamp: '2025-10-12T10:20:00Z',
    status: 'completed',
    txHash: '0xjkl012...',
  },
]

const mockReferralData: ReferralData = {
  totalReferred: 5,
  activeReferrals: 3,
  totalRewards: '450',
  referralCode: 'ORANGE-ABC123',
  referrals: [
    {
      address: '0x1234...5678',
      joinedAt: '2025-10-01T10:00:00Z',
      isActive: true,
      rewardsEarned: '150',
    },
    {
      address: '0x2345...6789',
      joinedAt: '2025-10-05T14:30:00Z',
      isActive: true,
      rewardsEarned: '200',
    },
    {
      address: '0x3456...7890',
      joinedAt: '2025-10-08T09:15:00Z',
      isActive: true,
      rewardsEarned: '100',
    },
  ],
}

export default function Profile() {
  const { address } = useAccount()
  const { profile } = useUserStore()
  const [showEditModal, setShowEditModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const transactionsPerPage = 5

  // Profile data
  const username = profile?.username || 'Anonymous Farmer'
  const totalOranges = profile?.totalEarnings || '0'
  const level = profile?.level || 1
  const rank = 999 // TODO: Add rank to UserProfile type and get from Firestore
  const plotsOwned = 8 // TODO: Get from LandNFT contract
  const botsOwned = 3 // TODO: Get from BotNFT contract
  const waterBalance = 100 // TODO: Get from WaterToken contract

  // Calculate pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage
  const currentTransactions = mockTransactions.slice(
    indexOfFirstTransaction,
    indexOfLastTransaction
  )
  const totalPages = Math.ceil(mockTransactions.length / transactionsPerPage)

  // Get achievement stats
  const unlockedAchievements = mockAchievements.filter((a) => a.unlocked).length
  const totalAchievements = mockAchievements.length

  const handleEditProfile = () => {
    setShowEditModal(true)
  }

  const handleShareProfile = () => {
    setShowShareModal(true)
  }

  const handleExportData = () => {
    const data = {
      address,
      profile,
      achievements: mockAchievements,
      transactions: mockTransactions,
      referrals: mockReferralData,
      exportedAt: new Date().toISOString(),
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orange-farm-profile-${address?.slice(0, 8)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const copyReferralCode = () => {
    navigator.clipboard.writeText(mockReferralData.referralCode)
    alert('Referral code copied!') // TODO: Replace with toast notification using sonner
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
      case 'rare':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'epic':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      case 'legendary':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
    }
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'purchase':
        return <ArrowDownRight className="h-4 w-4 text-red-400" />
      case 'sale':
        return <ArrowUpRight className="h-4 w-4 text-green-400" />
      case 'harvest':
        return <Trophy className="h-4 w-4 text-primary" />
      case 'reward':
        return <Gift className="h-4 w-4 text-secondary" />
    }
  }

  return (
    <div className="min-h-screen bg-dark-300 p-4 md:p-6 lg:p-8 space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient mb-3">My Profile</h1>
          <p className="text-base md:text-lg text-gray-400">Track your progress and achievements</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" size="md" icon={<Edit />} onClick={handleEditProfile}>
            Edit Profile
          </Button>
          <Button variant="ghost" size="md" icon={<Share2 />} onClick={handleShareProfile}>
            Share
          </Button>
          <Button variant="ghost" size="md" icon={<Download />} onClick={handleExportData}>
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
        <Card variant="glass" padding="none">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-primary/20 flex items-center justify-center mb-3">
              <Trophy className="h-7 w-7 text-primary" />
            </div>
            <div className="text-3xl md:text-4xl font-bold text-primary">{totalOranges}</div>
            <div className="text-sm md:text-base text-gray-400 mt-1">Total Oranges</div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-secondary/20 flex items-center justify-center mb-3">
              <TrendingUp className="h-7 w-7 text-secondary" />
            </div>
            <div className="text-3xl md:text-4xl font-bold text-secondary">{level}</div>
            <div className="text-sm md:text-base text-gray-400 mt-1">Level</div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-yellow-500/20 flex items-center justify-center mb-3">
              <Award className="h-7 w-7 text-yellow-500" />
            </div>
            <div className="text-3xl md:text-4xl font-bold text-yellow-500">#{rank}</div>
            <div className="text-sm md:text-base text-gray-400 mt-1">Rank</div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-green-500/20 flex items-center justify-center mb-3">
              <MapPin className="h-7 w-7 text-green-500" />
            </div>
            <div className="text-3xl md:text-4xl font-bold text-green-500">{plotsOwned}</div>
            <div className="text-sm md:text-base text-gray-400 mt-1">Plots Owned</div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-blue-500/20 flex items-center justify-center mb-3">
              <Bot className="h-7 w-7 text-blue-500" />
            </div>
            <div className="text-3xl md:text-4xl font-bold text-blue-500">{botsOwned}</div>
            <div className="text-sm md:text-base text-gray-400 mt-1">Bots Owned</div>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="h-14 w-14 rounded-full bg-cyan-500/20 flex items-center justify-center mb-3">
              <Droplets className="h-7 w-7 text-cyan-500" />
            </div>
            <div className="text-3xl md:text-4xl font-bold text-cyan-500">{waterBalance}</div>
            <div className="text-sm md:text-base text-gray-400 mt-1">Water Units</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Achievements & Referrals */}
        <div className="lg:col-span-2 space-y-6">
          {/* Achievements Section */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  Achievements
                </span>
                <span className="text-sm font-normal text-gray-400">
                  {unlockedAchievements}/{totalAchievements} Unlocked
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {mockAchievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`
                      relative p-4 rounded-lg border-2 transition-all
                      ${
                        achievement.unlocked
                          ? getRarityColor(achievement.rarity)
                          : 'bg-dark-100/50 border-dark-100 opacity-50'
                      }
                    `}
                  >
                    {/* Achievement Icon */}
                    <div className="text-4xl mb-2 text-center">{achievement.icon}</div>

                    {/* Achievement Name */}
                    <div className="text-sm font-semibold text-center mb-1">
                      {achievement.name}
                    </div>

                    {/* Achievement Description */}
                    <div className="text-xs text-gray-400 text-center mb-2">
                      {achievement.description}
                    </div>

                    {/* Progress Bar (if applicable) */}
                    {achievement.maxProgress && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-dark-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary to-secondary transition-all"
                            style={{
                              width: `${
                                ((achievement.progress || 0) / achievement.maxProgress) * 100
                              }%`,
                            }}
                          />
                        </div>
                        <div className="text-xs text-gray-400 text-center mt-1">
                          {achievement.progress?.toLocaleString()}/{achievement.maxProgress.toLocaleString()}
                        </div>
                      </div>
                    )}

                    {/* Unlock Status */}
                    {achievement.unlocked ? (
                      <div className="absolute top-2 right-2">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      </div>
                    ) : (
                      <div className="absolute top-2 right-2">
                        <Lock className="h-5 w-5 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-secondary" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 bg-dark-100/50 rounded-lg hover:bg-dark-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="h-10 w-10 rounded-full bg-dark-200 flex items-center justify-center">
                        {getTransactionIcon(tx.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{tx.description}</div>
                        <div className="text-xs text-gray-400">
                          {formatDate(tx.timestamp)} at {formatTime(tx.timestamp)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`font-bold text-sm ${
                          tx.amount.startsWith('+') ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {tx.amount} {tx.asset}
                      </div>
                      {tx.txHash && (
                        <a
                          href={`https://explorer.somnia.network/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-400 hover:underline"
                        >
                          View TX
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - User Info & Referrals */}
        <div className="space-y-6">
          {/* User Info Card */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Profile Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-lg">{username}</div>
                  <div className="text-xs text-gray-400 font-mono">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-dark-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Member Since</span>
                  <span className="font-medium">Oct 2025</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Total Harvests</span>
                  <span className="font-medium">{profile?.totalHarvests || 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Best Rank</span>
                  <span className="font-medium">#{rank}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Referral Section */}
          <Card className="glass">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Referrals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Referral Stats */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-dark-100/50 rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {mockReferralData.totalReferred}
                  </div>
                  <div className="text-xs text-gray-400">Total</div>
                </div>
                <div className="p-3 bg-dark-100/50 rounded-lg">
                  <div className="text-2xl font-bold text-green-500">
                    {mockReferralData.activeReferrals}
                  </div>
                  <div className="text-xs text-gray-400">Active</div>
                </div>
                <div className="p-3 bg-dark-100/50 rounded-lg">
                  <div className="text-2xl font-bold text-secondary">
                    {mockReferralData.totalRewards}
                  </div>
                  <div className="text-xs text-gray-400">Rewards</div>
                </div>
              </div>

              {/* Referral Code */}
              <div>
                <div className="text-sm text-gray-400 mb-2">Your Referral Code</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={mockReferralData.referralCode}
                    readOnly
                    className="flex-1 px-3 py-2 bg-dark-100 border border-dark-100 rounded-lg text-sm font-mono"
                  />
                  <Button variant="secondary" size="sm" onClick={copyReferralCode}>
                    Copy
                  </Button>
                </div>
              </div>

              {/* Recent Referrals */}
              <div>
                <div className="text-sm text-gray-400 mb-2">Recent Referrals</div>
                <div className="space-y-2">
                  {mockReferralData.referrals.slice(0, 3).map((referral, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 bg-dark-100/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            referral.isActive ? 'bg-green-500' : 'bg-gray-500'
                          }`}
                        />
                        <span className="text-xs font-mono">{referral.address}</span>
                      </div>
                      <span className="text-xs text-secondary">+{referral.rewardsEarned}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {showEditModal && (
        <EditProfileModal onClose={() => setShowEditModal(false)} currentUsername={username} />
      )}

      {/* Share Profile Modal */}
      {showShareModal && (
        <ShareProfileModal onClose={() => setShowShareModal(false)} address={address || ''} />
      )}
    </div>
  )
}

// Edit Profile Modal Component
interface EditProfileModalProps {
  onClose: () => void
  currentUsername: string
}

function EditProfileModal({ onClose, currentUsername }: EditProfileModalProps) {
  const [username, setUsername] = useState(currentUsername)
  const [bio, setBio] = useState('')
  const [avatar, setAvatar] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async () => {
    setIsLoading(true)
    // TODO: Implement profile update
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsLoading(false)
    onClose()
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-display font-bold text-gradient">Edit Profile</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-dark-100 border border-dark-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2 bg-dark-100 border border-dark-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={4}
              placeholder="Tell us about yourself..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Avatar URL</label>
            <input
              type="text"
              value={avatar}
              onChange={(e) => setAvatar(e.target.value)}
              className="w-full px-4 py-2 bg-dark-100 border border-dark-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="primary" onClick={handleSave} loading={isLoading} className="flex-1">
            Save Changes
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Share Profile Modal Component
interface ShareProfileModalProps {
  onClose: () => void
  address: string
}

function ShareProfileModal({ onClose, address }: ShareProfileModalProps) {
  const profileUrl = `https://orangefarm.io/profile/${address}`

  const copyUrl = () => {
    navigator.clipboard.writeText(profileUrl)
    alert('Profile URL copied!')
  }

  const shareOnTwitter = () => {
    const text = `Check out my Orange Farm profile! 🍊🌾`
    window.open(
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`,
      '_blank'
    )
  }

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <h2 className="text-2xl font-display font-bold text-gradient">Share Profile</h2>

        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">Profile URL</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={profileUrl}
              readOnly
              className="flex-1 px-4 py-2 bg-dark-100 border border-dark-100 rounded-lg text-sm"
            />
            <Button variant="secondary" size="sm" onClick={copyUrl}>
              Copy
            </Button>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button variant="primary" onClick={shareOnTwitter} className="flex-1">
            Share on Twitter
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  )
}
