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
  ArrowRight,
  Trophy,
  MessageCircle,
  ExternalLink,
  ChevronDown,
} from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@components/common'

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

      {/* Header */}
      <header className="relative z-50 container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <span className="text-4xl">🍊</span>
            <h1 className="text-3xl font-display font-bold text-gradient">Orange Farm</h1>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <ConnectButton />
          </motion.div>
        </nav>
      </header>

      <main className="relative z-10">
        {/* Hero Section with Parallax */}
        <section className="container mx-auto px-4 py-20 lg:py-32 text-center relative">
          <motion.div
            style={{ opacity: heroOpacity, scale: heroScale }}
            className="max-w-5xl mx-auto space-y-8"
          >
            {/* Hero Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-4"
            >
              <div className="inline-block">
                <span className="px-4 py-2 rounded-full bg-primary/20 text-primary text-sm font-semibold border border-primary/30">
                  🎮 Play-to-Earn on Somnia Network
                </span>
              </div>
              <h2 className="text-5xl md:text-7xl font-display font-bold text-white leading-tight">
                Grow. Harvest.{' '}
                <span className="text-gradient animate-gradient">Earn.</span>
              </h2>
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto">
                The first fully on-chain farming game with{' '}
                <span className="text-secondary font-semibold">AI-powered bots</span>,{' '}
                <span className="text-primary font-semibold">NFT lands</span>, and real
                yield farming
              </p>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
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
            </motion.div>

            {/* Hero Stats */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="grid grid-cols-3 gap-6 max-w-2xl mx-auto pt-12"
            >
              {[
                { label: 'Transaction Time', value: '<1s', icon: Zap },
                { label: 'Network TPS', value: '400K+', icon: TrendingUp },
                { label: 'Gas Fees', value: '~$0.001', icon: Coins },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="h-6 w-6 mx-auto mb-2 text-primary" />
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <ChevronDown className="h-8 w-8 text-gray-400 animate-bounce" />
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient">
              Why Orange Farm?
            </h3>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Experience the future of blockchain gaming with cutting-edge features
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
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
                  <div className="glass rounded-xl p-6 text-center h-full border border-white/10 hover:border-primary/50 transition-all duration-300">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 mb-4 group-hover:scale-110 transition-transform">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h4 className="text-xl font-semibold mb-3 text-white">
                      {feature.title}
                    </h4>
                    <p className="text-gray-400">{feature.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* Gameplay Flow Timeline */}
        <section className="container mx-auto px-4 py-20 lg:py-32 bg-gradient-to-b from-transparent via-dark-100/30 to-transparent">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl md:text-5xl font-display font-bold mb-4">
              How It Works
            </h3>
            <p className="text-xl text-gray-400">
              Start earning in 5 simple steps
            </p>
          </motion.div>

          <div className="max-w-4xl mx-auto space-y-8">
            {[
              {
                step: 1,
                title: 'Connect Wallet',
                description: 'Link your Web3 wallet to get started on Somnia Network',
                icon: Shield,
              },
              {
                step: 2,
                title: 'Purchase Land NFT',
                description: 'Buy your first plot to begin your farming journey',
                icon: Sprout,
              },
              {
                step: 3,
                title: 'Deploy Bots',
                description: 'Acquire automation bots to harvest oranges efficiently',
                icon: Zap,
              },
              {
                step: 4,
                title: 'Harvest & Earn',
                description: 'Collect $ORANGE tokens every 10 minutes automatically',
                icon: Coins,
              },
              {
                step: 5,
                title: 'Climb Leaderboard',
                description: 'Compete globally and unlock exclusive rewards',
                icon: Trophy,
              },
            ].map((item, idx) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="flex flex-col md:flex-row items-center gap-6 group"
              >
                <div className="flex items-center gap-6 flex-1">
                  {/* Step Number */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform">
                    {item.step}
                  </div>

                  {/* Content */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-3 mb-2">
                      <item.icon className="h-6 w-6 text-primary" />
                      <h4 className="text-xl font-semibold text-white">{item.title}</h4>
                    </div>
                    <p className="text-gray-400">{item.description}</p>
                  </div>
                </div>

                {/* Arrow */}
                {item.step < 5 && (
                  <ArrowRight className="hidden md:block h-6 w-6 text-gray-600 -ml-4" />
                )}
              </motion.div>
            ))}
          </div>
        </section>

        {/* Tokenomics Section */}
        <section className="container mx-auto px-4 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient">
              Tokenomics
            </h3>
            <p className="text-xl text-gray-400">
              Powered by $ORANGE - The heartbeat of our ecosystem
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Token Utility */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-8 border border-white/10"
            >
              <h4 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Coins className="h-6 w-6 text-primary" />
                Token Utility
              </h4>
              <ul className="space-y-4">
                {[
                  'Purchase lands and bots on marketplace',
                  'Upgrade existing NFT assets',
                  'Participate in governance voting',
                  'Unlock exclusive features and perks',
                  'Trade on decentralized exchanges',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                    <span className="text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Distribution */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="glass rounded-xl p-8 border border-white/10"
            >
              <h4 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-secondary" />
                Distribution
              </h4>
              <div className="space-y-4">
                {[
                  { label: 'Player Rewards', value: '40%', color: 'bg-primary' },
                  { label: 'Liquidity Pool', value: '25%', color: 'bg-secondary' },
                  { label: 'Development', value: '20%', color: 'bg-blue-500' },
                  { label: 'Marketing', value: '10%', color: 'bg-purple-500' },
                  { label: 'Team', value: '5%', color: 'bg-pink-500' },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">{item.label}</span>
                      <span className="font-bold text-white">{item.value}</span>
                    </div>
                    <div className="h-2 bg-dark-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full`}
                        style={{ width: item.value }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Network Stats */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass rounded-2xl p-8 md:p-12 mt-16"
          >
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">
                  Sub-Second
                </div>
                <div className="text-gray-400">Transaction Finality on Somnia</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-secondary mb-2">
                  400K+
                </div>
                <div className="text-gray-400">Transactions Per Second</div>
              </div>
              <div>
                <div className="text-4xl md:text-5xl font-bold text-primary mb-2">100%</div>
                <div className="text-gray-400">On-Chain Game Logic</div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Live Leaderboard Preview */}
        <section className="container mx-auto px-4 py-20 lg:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Top Farmers 🏆
            </h3>
            <p className="text-xl text-gray-400">
              Compete with players worldwide
            </p>
          </motion.div>

          <div className="max-w-3xl mx-auto">
            <div className="glass rounded-xl overflow-hidden border border-white/10">
              <div className="bg-gradient-to-r from-primary/20 to-secondary/20 p-6 border-b border-white/10">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-primary" />
                    Global Leaderboard
                  </h4>
                  <span className="text-sm text-gray-400">Live</span>
                </div>
              </div>

              <div className="divide-y divide-white/5">
                {topPlayers.map((player, idx) => (
                  <motion.div
                    key={player.rank}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="p-4 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Rank Badge */}
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${getRankBadgeClass(player.rank)}`}
                        >
                          #{player.rank}
                        </div>

                        {/* Avatar & Name */}
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{player.avatar}</span>
                          <span className="font-semibold text-white">{player.name}</span>
                        </div>
                      </div>

                      {/* Oranges */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-primary">
                          {player.oranges.toLocaleString()} 🍊
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-4 bg-dark-100/50 text-center">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ExternalLink />}
                  onClick={() => navigate('/leaderboard')}
                >
                  View Full Leaderboard
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Community Section */}
        <section className="container mx-auto px-4 py-20 lg:py-32 bg-gradient-to-b from-transparent via-dark-100/30 to-transparent">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h3 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Join Our Community
            </h3>
            <p className="text-xl text-gray-400">
              Connect with thousands of farmers worldwide
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                icon: MessageCircle,
                title: 'Twitter',
                description: 'Follow for updates',
                link: 'https://twitter.com/orangefarm',
                color: 'from-blue-500/20 to-blue-600/20',
                borderColor: 'border-blue-500/30',
              },
              {
                icon: MessageCircle,
                title: 'Discord',
                description: 'Join the conversation',
                link: 'https://discord.gg/orangefarm',
                color: 'from-purple-500/20 to-purple-600/20',
                borderColor: 'border-purple-500/30',
              },
              {
                icon: ExternalLink,
                title: 'GitHub',
                description: 'View source code',
                link: 'https://github.com/orangefarm',
                color: 'from-gray-500/20 to-gray-600/20',
                borderColor: 'border-gray-500/30',
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
                className={`glass rounded-xl p-8 text-center border ${social.borderColor} hover:border-primary/50 transition-all duration-300 group`}
              >
                <div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${social.color} mb-4 group-hover:scale-110 transition-transform`}
                >
                  <social.icon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-semibold mb-2 text-white">{social.title}</h4>
                <p className="text-gray-400">{social.description}</p>
              </motion.a>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-20 lg:py-32 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto glass rounded-2xl p-12 border border-primary/30"
          >
            <h3 className="text-4xl md:text-5xl font-display font-bold mb-4 text-gradient">
              Ready to Start Farming?
            </h3>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of players earning real yield through blockchain gaming
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button
                onClick={handleGetStarted}
                size="lg"
                variant="primary"
                icon={<Rocket />}
              >
                {isConnected ? 'Launch App' : 'Start Farming Now'}
              </Button>
              {!isConnected && (
                <ConnectButton.Custom>
                  {({ openConnectModal }) => (
                    <Button
                      onClick={openConnectModal}
                      size="lg"
                      variant="outline"
                      icon={<Rocket />}
                    >
                      Or Connect Wallet First
                    </Button>
                  )}
                </ConnectButton.Custom>
              )}
            </div>

            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-400" />
                Audited Smart Contracts
              </span>
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-400" />
                1000+ Active Players
              </span>
            </div>
          </motion.div>
        </section>
      </main>

      {/* Complete Footer */}
      <footer className="border-t border-dark-100 bg-dark-300/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">🍊</span>
                <h4 className="text-xl font-display font-bold text-white">Orange Farm</h4>
              </div>
              <p className="text-gray-400 text-sm mb-4">
                The first fully on-chain farming game on Somnia Network with AI-powered
                automation and real yield farming.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: MessageCircle, link: 'https://twitter.com' },
                  { icon: MessageCircle, link: 'https://discord.gg' },
                  { icon: ExternalLink, link: 'https://github.com' },
                ].map((social) => (
                  <a
                    key={social.link}
                    href={social.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-full bg-dark-100 flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
                  >
                    <social.icon className="h-5 w-5" />
                  </a>
                ))}
              </div>
            </div>

            {/* Resources */}
            <div>
              <h5 className="font-semibold text-white mb-4">Resources</h5>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'Documentation', href: '/docs' },
                  { label: 'Whitepaper', href: '/whitepaper.pdf' },
                  { label: 'Smart Contracts', href: 'https://github.com' },
                  { label: 'Audit Report', href: '/audit.pdf' },
                  { label: 'Brand Kit', href: '/brand-kit' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-primary transition-colors inline-flex items-center gap-1"
                    >
                      {link.label}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Community */}
            <div>
              <h5 className="font-semibold text-white mb-4">Community</h5>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'Twitter', href: 'https://twitter.com' },
                  { label: 'Discord', href: 'https://discord.gg' },
                  { label: 'Telegram', href: 'https://t.me' },
                  { label: 'Medium', href: 'https://medium.com' },
                  { label: 'YouTube', href: 'https://youtube.com' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-400 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h5 className="font-semibold text-white mb-4">Legal</h5>
              <ul className="space-y-2 text-sm">
                {[
                  { label: 'Terms of Service', href: '/terms' },
                  { label: 'Privacy Policy', href: '/privacy' },
                  { label: 'Cookie Policy', href: '/cookies' },
                  { label: 'Disclaimer', href: '/disclaimer' },
                  { label: 'Contact Us', href: '/contact' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-gray-400 hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-dark-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-400">
            <p>© 2025 Orange Farm. All rights reserved. Built on Somnia Network.</p>
            <div className="flex items-center gap-6">
              <a
                href="https://somnia.network"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                Powered by Somnia
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
