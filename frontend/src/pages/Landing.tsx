import { useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount } from 'wagmi'
import {
  Sprout,
  TrendingUp,
  Users,
  Zap,
  Coins,
  Shield,
  Rocket,
  Trophy,
  MessageCircle,
  ExternalLink,
  ChevronDown,
  Leaf,
  Bot,
  Sparkles,
} from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@components/common'
import logo from '@assets/logo.png'

// Helper function for rank badge colors
const getRankBadgeClass = (rank: number) => {
  if (rank === 1) return 'bg-yellow-500/20 text-yellow-400'
  if (rank === 2) return 'bg-gray-400/20 text-gray-300'
  if (rank === 3) return 'bg-orange-500/20 text-orange-400'
  return 'bg-dark-100 text-gray-400'
}

// Mock leaderboard data for preview
const topPlayers = [
  { rank: 1, name: 'OrangeFarmer', oranges: 15420, avatar: '👑' },
  { rank: 2, name: 'BotMaster3000', oranges: 14280, avatar: '🤖' },
  { rank: 3, name: 'CitrusKing', oranges: 13150, avatar: '🍊' },
  { rank: 4, name: 'FarmQueen', oranges: 10750, avatar: '👸' },
  { rank: 5, name: 'HarvestPro', oranges: 9850, avatar: '🌾' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { isConnected } = useAccount()
  const { scrollY } = useScroll()

  const heroOpacity = useTransform(scrollY, [0, 300], [1, 0])
  const heroScale = useTransform(scrollY, [0, 300], [1, 0.8])

  // Simple navigation - let Dashboard handle registration checks
  const handleGetStarted = () => {
    navigate('/dashboard')
  }

  const features = [
    {
      icon: Sprout,
      title: 'Plant & Harvest',
      description: 'Grow orange trees and harvest your crops for $ORANGE tokens',
    },
    {
      icon: Zap,
      title: 'Bot Automation',
      description: 'Deploy bots to automate your farming and boost your yields',
    },
    {
      icon: TrendingUp,
      title: 'NFT Marketplace',
      description: 'Trade lands, seeds, and bots on the decentralized marketplace',
    },
    {
      icon: Users,
      title: 'Compete & Earn',
      description: 'Climb the leaderboard and unlock exclusive achievements',
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-300 via-dark-200 to-dark-300 overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header - Sticky with Background */}
      <header className="sticky top-0 z-50 bg-dark-300/95 backdrop-blur-lg border-b border-white/10 shadow-lg">
        <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <img src={logo} alt="Orange Farm Logo" className="h-14 w-14 md:h-16 md:w-16 object-contain" />
            <h1 className="text-2xl md:text-3xl font-display font-bold text-gradient">Orange Farm</h1>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }}
            className="scale-110"
          >
            <ConnectButton />
          </motion.div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero Section with Farming Visual */}
        <section className="container mx-auto px-6 py-16 lg:py-24 relative">
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="max-w-7xl mx-auto"
          >
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left: Text Content */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
                className="space-y-8 text-center lg:text-left"
              >
                <div className="inline-block">
                  <span className="px-5 py-2.5 rounded-full bg-primary/20 text-primary text-base md:text-lg font-semibold border-2 border-primary/30 inline-flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    Play-to-Earn on Somnia Network
                  </span>
                </div>
                
                <h2 className="text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-display font-bold text-white leading-tight">
                  Grow. Harvest.{' '}
                  <span className="text-gradient animate-gradient">Earn.</span>
                </h2>
                
                <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
                  The first <span className="text-primary font-bold">100% on-chain</span> farming game where you own{' '}
                  <span className="text-secondary font-bold">NFT lands</span>, deploy{' '}
                  <span className="text-secondary font-bold">AI bots</span>, and harvest{' '}
                  <span className="text-primary font-bold">real $ORANGE rewards</span>
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                  <Button
                    onClick={handleGetStarted}
                    size="lg"
                    variant="primary"
                    icon={<Rocket />}
                  >
                    {isConnected ? 'Enter Farm' : 'Start Farming Now'}
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    icon={<ChevronDown />}
                    onClick={() =>
                      document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                    }
                  >
                    Learn More
                  </Button>
                </div>
              </motion.div>

              {/* Right: Logo/Visual Hero */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="relative"
              >
                {/* Large Logo Display */}
                <div className="relative aspect-square max-w-md lg:max-w-lg xl:max-w-xl mx-auto">
                  {/* Animated Background Glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/30 to-secondary/30 rounded-full blur-3xl animate-pulse" />
                  
                  {/* Floating Decorative Elements - Above Container */}
                  <motion.div
                    animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute -top-8 -right-8 z-20 bg-primary/20 backdrop-blur-sm rounded-2xl p-4 border border-primary/30 shadow-lg"
                  >
                    <span className="text-4xl md:text-5xl">🍊</span>
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
                    className="absolute -bottom-8 -left-8 z-20 bg-secondary/20 backdrop-blur-sm rounded-2xl p-4 border border-secondary/30 shadow-lg"
                  >
                    <Sprout className="h-8 w-8 md:h-10 md:w-10 text-secondary" />
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, -15, 0], rotate: [0, 10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}
                    className="absolute top-1/4 -left-12 z-20 bg-green-500/20 backdrop-blur-sm rounded-2xl p-3 border border-green-500/30 shadow-lg"
                  >
                    <Leaf className="h-7 w-7 text-green-400" />
                  </motion.div>

                  <motion.div
                    animate={{ y: [0, 15, 0], rotate: [0, -10, 0] }}
                    transition={{ duration: 2.5, repeat: Infinity, delay: 1.5 }}
                    className="absolute bottom-1/4 -right-12 z-20 bg-blue-500/20 backdrop-blur-sm rounded-2xl p-3 border border-blue-500/30 shadow-lg"
                  >
                    <Bot className="h-7 w-7 text-blue-400" />
                  </motion.div>
                  
                  {/* Logo Container */}
                  <div className="relative z-10 glass rounded-3xl p-8 md:p-12 border-2 border-primary/30 shadow-2xl">
                    <img 
                      src={logo} 
                      alt="Orange Farm Game" 
                      className="w-full h-full object-contain animate-float"
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 hidden lg:block"
          >
            <ChevronDown className="h-8 w-8 text-gray-400 animate-bounce" />
          </motion.div>
        </section>

        {/* Features Section */}
        {/* Features Section - Farming Focused */}
        <section id="features" className="container mx-auto px-6 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-secondary/20 text-secondary text-base font-semibold border-2 border-secondary/30 mb-6">
              <Sprout className="h-5 w-5" />
              Core Features
            </div>
            <h3 className="text-5xl md:text-6xl font-display font-bold mb-6 text-gradient">
              Why Orange Farm? 🍊
            </h3>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Experience the future of blockchain gaming with <span className="text-primary font-bold">real ownership</span> and <span className="text-secondary font-bold">automated earning</span>
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {features.map((feature, idx) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.5 }}
                  whileHover={{ y: -10 }}
                  className="relative group"
                >
                  <div className="glass rounded-2xl p-8 text-center h-full border-2 border-white/10 hover:border-primary/50 transition-all duration-300 shadow-lg hover:shadow-primary/20">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 mb-6 group-hover:scale-110 transition-transform">
                      <Icon className="h-10 w-10 text-primary" />
                    </div>
                    <h4 className="text-2xl font-bold mb-4 text-white">
                      {feature.title}
                    </h4>
                    <p className="text-base md:text-lg text-gray-400 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* How It Works - Farming Journey */}
        <section className="container mx-auto px-6 py-20 lg:py-32 bg-gradient-to-b from-transparent via-dark-100/30 to-transparent">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-green-500/20 text-green-400 text-base font-semibold border-2 border-green-500/30 mb-6">
              <Leaf className="h-5 w-5" />
              Getting Started
            </div>
            <h3 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Your Farming Journey 🌾
            </h3>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Start earning <span className="text-primary font-bold">$ORANGE tokens</span> in 5 simple steps
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto space-y-6">
            {[
              {
                step: 1,
                title: 'Connect Wallet',
                description: 'Link your Web3 wallet to get started on Somnia Network - zero gas fees!',
                icon: Shield,
                emoji: '👛',
              },
              {
                step: 2,
                title: 'Register & Get FREE Pack',
                description: 'Create your profile and claim your free starter pack: 1 Land + 1 Bot + 100 Water',
                icon: Sprout,
                emoji: '🎁',
              },
              {
                step: 3,
                title: 'Assign Bot to Land',
                description: 'Deploy your automation bot to your land plot to start farming oranges',
                icon: Zap,
                emoji: '🤖',
              },
              {
                step: 4,
                title: 'Harvest $ORANGE',
                description: 'Collect real $ORANGE tokens automatically - real-time rewards every harvest!',
                icon: Coins,
                emoji: '🍊',
              },
              {
                step: 5,
                title: 'Compete & Grow',
                description: 'Climb the global leaderboard, expand your farm, and earn even more',
                icon: Trophy,
                emoji: '🏆',
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="relative group"
              >
                <div className="glass rounded-2xl p-6 md:p-8 border-2 border-white/10 hover:border-primary/50 transition-all duration-300 shadow-lg">
                  <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                    {/* Step Number & Icon */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-3xl md:text-4xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                        {item.step}
                      </div>
                      <span className="text-5xl md:text-6xl">{item.emoji}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <item.icon className="h-8 w-8 text-primary" />
                        <h4 className="text-2xl md:text-3xl font-bold text-white">{item.title}</h4>
                      </div>
                      <p className="text-base md:text-lg text-gray-400 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                  
                  {/* Progress Connector */}
                  {item.step < 5 && (
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0.5 h-6 bg-gradient-to-b from-primary to-transparent" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tokenomics & Stats Section */}
        <section className="container mx-auto px-6 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/20 text-primary text-base font-semibold border-2 border-primary/30 mb-6">
              <Coins className="h-5 w-5" />
              $ORANGE Token
            </div>
            <h3 className="text-5xl md:text-6xl font-display font-bold mb-6 text-gradient">
              Powered by $ORANGE 🍊
            </h3>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              The heartbeat of our <span className="text-primary font-bold">decentralized farming ecosystem</span>
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
            {/* Token Utility */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8 md:p-10 border-2 border-white/10 hover:border-primary/50 transition-all duration-300 shadow-lg"
            >
              <h4 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Coins className="h-8 w-8 text-primary" />
                </div>
                Token Utility
              </h4>
              <ul className="space-y-5">
                {[
                  { text: 'Purchase lands and bots on marketplace', emoji: '🛒' },
                  { text: 'Upgrade existing NFT assets', emoji: '⬆️' },
                  { text: 'Participate in governance voting', emoji: '🗳️' },
                  { text: 'Unlock exclusive features and perks', emoji: '🎁' },
                  { text: 'Trade on decentralized exchanges', emoji: '💱' },
                ].map((item) => (
                  <li key={item.text} className="flex items-start gap-4 group">
                    <span className="text-2xl group-hover:scale-125 transition-transform">{item.emoji}</span>
                    <span className="text-base md:text-lg text-gray-300 leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-8 md:p-10 border-2 border-white/10 hover:border-secondary/50 transition-all duration-300 shadow-lg"
            >
              <h4 className="text-3xl font-bold mb-8 flex items-center gap-3">
                <div className="w-14 h-14 rounded-xl bg-secondary/20 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-secondary" />
                </div>
                Distribution
              </h4>
              <div className="space-y-5">
                {[
                  { label: 'Player Rewards', value: '40%', color: 'bg-primary', emoji: '👨‍🌾' },
                  { label: 'Liquidity Pool', value: '25%', color: 'bg-secondary', emoji: '💧' },
                  { label: 'Development', value: '20%', color: 'bg-blue-500', emoji: '⚙️' },
                  { label: 'Marketing', value: '10%', color: 'bg-purple-500', emoji: '📢' },
                  { label: 'Team', value: '5%', color: 'bg-pink-500', emoji: '👥' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.emoji}</span>
                        <span className="text-base md:text-lg text-gray-300 font-medium">{item.label}</span>
                      </div>
                      <span className="text-xl md:text-2xl font-bold text-white">{item.value}</span>
                    </div>
                    <div className="h-3 bg-dark-100 rounded-full overflow-hidden shadow-inner">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{ width: item.value }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Game Stats - Orange Farm Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12"
          >
            <div className="grid md:grid-cols-4 gap-6">
              {[
                { icon: Users, label: 'Active Farmers', value: '10K+', color: 'text-primary' },
                { icon: Sprout, label: 'Total Harvests', value: '2.5M+', color: 'text-green-500' },
                { icon: Coins, label: '$ORANGE Earned', value: '50M+', color: 'text-secondary' },
                { icon: Trophy, label: 'NFTs Minted', value: '25K+', color: 'text-purple-500' },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass rounded-2xl p-6 md:p-8 border-2 border-white/10 hover:border-primary/30 transition-all duration-300 text-center group"
                >
                  <div className={`inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-dark-200 to-dark-300 mb-4 ${stat.color} group-hover:scale-110 transition-transform`}>
                    <stat.icon className="h-8 w-8 md:h-10 md:w-10" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2 text-gradient">{stat.value}</div>
                  <div className="text-base md:text-lg text-gray-400">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Live Leaderboard Preview */}
        <section className="container mx-auto px-6 py-20 lg:py-32 bg-gradient-to-b from-dark-100/30 via-transparent to-dark-100/30">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-yellow-500/20 text-yellow-400 text-base font-semibold border-2 border-yellow-500/30 mb-6">
              <Trophy className="h-5 w-5" />
              Top Performers
            </div>
            <h3 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Top Farmers 🏆
            </h3>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Compete with <span className="text-secondary font-bold">players worldwide</span> and climb to the top!
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto">
            <div className="glass rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl">
              <div className="bg-gradient-to-r from-primary/30 via-secondary/20 to-purple-500/20 p-6 md:p-8 border-b-2 border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/30 flex items-center justify-center">
                      <Trophy className="h-7 w-7 text-primary" />
                    </div>
                    Global Leaderboard
                  </h4>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-base md:text-lg text-green-400 font-semibold">Live</span>
                  </div>
                </div>
              </div>

              <div className="divide-y-2 divide-white/5 p-4">
                {topPlayers.map((player, idx) => (
                  <motion.div
                    key={player.rank}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className={`p-4 md:p-6 rounded-xl hover:bg-white/5 transition-all duration-300 ${
                      player.rank <= 3 ? 'bg-gradient-to-r from-primary/5 to-secondary/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 md:gap-6">
                        {/* Rank Badge with Trophy Podium */}
                        <div className="relative">
                          <div
                            className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center font-bold text-xl md:text-2xl shadow-lg ${getRankBadgeClass(player.rank)} transition-transform hover:scale-110`}
                          >
                            {player.rank <= 3 ? (
                              <span className="text-3xl md:text-4xl">
                                {player.rank === 1 && '🥇'}
                                {player.rank === 2 && '🥈'}
                                {player.rank === 3 && '🥉'}
                              </span>
                            ) : (
                              `#${player.rank}`
                            )}
                          </div>
                          {player.rank === 1 && (
                            <div className="absolute -top-2 -right-2 text-2xl animate-bounce">👑</div>
                          )}
                        </div>

                        {/* Avatar & Name */}
                        <div className="flex items-center gap-3 md:gap-4">
                          <span className="text-3xl md:text-4xl">{player.avatar}</span>
                          <div>
                            <span className="font-bold text-lg md:text-xl text-white block">{player.name}</span>
                            {player.rank <= 3 && (
                              <span className="text-sm text-primary font-semibold">Elite Farmer</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Oranges */}
                      <div className="text-right">
                        <div className="text-xl md:text-3xl font-bold text-gradient flex items-center gap-2">
                          {player.oranges.toLocaleString()}
                          <span className="text-2xl md:text-4xl">🍊</span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">oranges harvested</div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-6 bg-dark-100/50 border-t-2 border-white/10 text-center">
                <Button
                  variant="outline"
                  size="lg"
                  icon={<ExternalLink />}
                  onClick={() => navigate('/leaderboard')}
                  className="text-base md:text-lg"
                >
                  View Full Leaderboard
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section className="container mx-auto px-6 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-purple-500/20 text-purple-400 text-base font-semibold border-2 border-purple-500/30 mb-6">
              <Users className="h-5 w-5" />
              Community
            </div>
            <h3 className="text-5xl md:text-6xl font-display font-bold mb-6">
              Join Our Farming Family 👨‍🌾
            </h3>
            <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Connect with <span className="text-primary font-bold">thousands of farmers</span> worldwide
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                icon: MessageCircle,
                title: 'Twitter',
                description: 'Follow for daily updates and farming tips',
                link: 'https://twitter.com/orangefarm',
                color: 'from-blue-500/20 to-blue-600/20',
                borderColor: 'border-blue-500/30',
                emoji: '🐦',
              },
              {
                icon: Users,
                title: 'Discord',
                description: 'Join the conversation and meet farmers',
                link: 'https://discord.gg/orangefarm',
                color: 'from-purple-500/20 to-purple-600/20',
                borderColor: 'border-purple-500/30',
                emoji: '💬',
              },
              {
                icon: ExternalLink,
                title: 'GitHub',
                description: 'View source code and contribute',
                link: 'https://github.com/orangefarm',
                color: 'from-gray-500/20 to-gray-600/20',
                borderColor: 'border-gray-500/30',
                emoji: '💻',
              },
            ].map((social, idx) => (
              <motion.a
                key={social.title}
                href={social.link}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -10, scale: 1.05 }}
                className={`glass rounded-2xl p-8 md:p-10 text-center border-2 ${social.borderColor} hover:border-primary/50 transition-all duration-300 group shadow-lg`}
              >
                <div className="relative inline-block mb-6">
                  <div
                    className={`flex items-center justify-center w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${social.color} group-hover:scale-110 transition-transform shadow-lg`}
                  >
                    <social.icon className="h-10 w-10 md:h-12 md:w-12 text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 text-3xl md:text-4xl">{social.emoji}</span>
                </div>
                <h4 className="text-2xl md:text-3xl font-bold mb-3 text-white">{social.title}</h4>
                <p className="text-base md:text-lg text-gray-400 leading-relaxed">{social.description}</p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* Final CTA - Call to Action */}
        <section className="container mx-auto px-6 py-20 lg:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative max-w-5xl mx-auto"
          >
            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-secondary/20 to-purple-500/20 rounded-3xl blur-3xl" />
            
            {/* CTA Card */}
            <div className="relative glass rounded-3xl p-10 md:p-16 border-2 border-primary/30 shadow-2xl">
              {/* Orange Decorations */}
              <div className="absolute -top-6 -left-6 text-6xl md:text-7xl animate-bounce">🍊</div>
              <div className="absolute -top-6 -right-6 text-6xl md:text-7xl animate-bounce" style={{ animationDelay: '0.5s' }}>🍊</div>
              
              <h3 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold mb-6 text-gradient">
                Ready to Start Farming?
              </h3>
              <p className="text-xl md:text-2xl lg:text-3xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
                Join thousands of players earning <span className="text-primary font-bold">real $ORANGE tokens</span> through blockchain gaming
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
                <Button
                  onClick={handleGetStarted}
                  size="lg"
                  variant="primary"
                  icon={<Rocket />}
                  className="text-xl px-10 py-6 shadow-lg shadow-primary/50"
                >
                  {isConnected ? '🚀 Launch App' : '🌱 Start Farming Now'}
                </Button>
                {!isConnected && (
                  <ConnectButton.Custom>
                    {({ openConnectModal }) => (
                      <Button
                        onClick={openConnectModal}
                        size="lg"
                        variant="outline"
                        icon={<Shield />}
                        className="text-xl px-10 py-6"
                      >
                        Connect Wallet First
                      </Button>
                    )}
                  </ConnectButton.Custom>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 text-base md:text-lg">
                <span className="flex items-center gap-2 text-gray-300">
                  <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <span>Audited Contracts</span>
                </span>
                <span className="flex items-center gap-2 text-gray-300">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                  <span>10K+ Active Farmers</span>
                </span>
                <span className="flex items-center gap-2 text-gray-300">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <span>Zero Gas Fees</span>
                </span>
              </div>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Complete Footer */}
      <footer className="border-t border-dark-100 bg-dark-300/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* About */}
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-6">
                <img src={logo} alt="Orange Farm" className="h-14 w-14 md:h-16 md:w-16 object-contain" />
                <h4 className="text-2xl md:text-3xl font-display font-bold text-white">Orange Farm</h4>
              </div>
              <p className="text-base md:text-lg text-gray-400 mb-6 max-w-md leading-relaxed">
                The first fully on-chain farming game on <span className="text-primary font-semibold">Somnia Network</span> with AI-powered
                automation and <span className="text-secondary font-semibold">real yield farming</span>.
              </p>
              <div className="flex gap-4">
                {[
                  { icon: MessageCircle, link: 'https://twitter.com', label: 'Twitter', color: 'hover:bg-blue-500' },
                  { icon: Users, link: 'https://discord.gg', label: 'Discord', color: 'hover:bg-purple-500' },
                  { icon: ExternalLink, link: 'https://github.com', label: 'GitHub', color: 'hover:bg-gray-500' },
                ].map((social) => (
                  <a
                    key={social.link}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.label}
                    className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-dark-100 flex items-center justify-center ${social.color} hover:text-white transition-all duration-300 hover:scale-110 shadow-lg`}
                  >
                    <social.icon className="h-6 w-6 md:h-7 md:w-7" />
                  </a>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h5 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Sprout className="h-5 w-5 text-primary" />
                Resources
              </h5>
              <ul className="space-y-3 text-base">
                {[
                  { label: 'Documentation', href: '/docs', emoji: '📚' },
                  { label: 'Whitepaper', href: '/whitepaper.pdf', emoji: '📄' },
                  { label: 'Smart Contracts', href: 'https://github.com', emoji: '📜' },
                  { label: 'Audit Report', href: '/audit.pdf', emoji: '🔒' },
                  { label: 'Brand Kit', href: '/brand-kit', emoji: '🎨' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-2 group"
                    >
                      <span>{link.emoji}</span>
                      <span className="group-hover:translate-x-1 transition-transform">{link.label}</span>
                      <ExternalLink className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div>
              <h5 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Users className="h-5 w-5 text-secondary" />
                Community
              </h5>
              <ul className="space-y-3 text-base">
                {[
                  { label: 'Twitter', href: 'https://twitter.com', emoji: '🐦' },
                  { label: 'Discord', href: 'https://discord.gg', emoji: '💬' },
                  { label: 'Telegram', href: 'https://t.me', emoji: '✈️' },
                  { label: 'Medium', href: 'https://medium.com', emoji: '✍️' },
                  { label: 'YouTube', href: 'https://youtube.com', emoji: '📺' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-2 group"
                    >
                      <span>{link.emoji}</span>
                      <span className="group-hover:translate-x-1 transition-transform">{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h5 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Legal
              </h5>
              <ul className="space-y-3 text-base">
                {[
                  { label: 'Privacy Policy', href: '/privacy', emoji: '🔒' },
                  { label: 'Terms of Service', href: '/terms', emoji: '📋' },
                  { label: 'Cookie Policy', href: '/cookies', emoji: '🍪' },
                  { label: 'Disclaimer', href: '/disclaimer', emoji: '⚠️' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-2 group"
                    >
                      <span>{link.emoji}</span>
                      <span className="group-hover:translate-x-1 transition-transform">{link.label}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t-2 border-white/10 pt-10 mt-12">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <p className="text-base md:text-lg text-gray-400 mb-2">
                  © 2025 <span className="text-primary font-bold">Orange Farm</span>. All rights reserved.
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-2 justify-center md:justify-start">
                  Built with <span className="text-red-500 animate-pulse">❤️</span> on{' '}
                  <a 
                    href="https://somnia.network" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-secondary hover:text-primary transition-colors font-semibold inline-flex items-center gap-1"
                  >
                    Somnia Network
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-green-400 font-semibold">Network Active</span>
                </div>
                <a
                  href="https://somnia.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-lg bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-all duration-300 text-sm font-semibold text-primary flex items-center gap-2"
                >
                  <Zap className="h-4 w-4" />
                  Powered by Somnia
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
