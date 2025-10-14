import { useState, useMemo, useEffect } from 'react'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { 
  Search, 
  RefreshCw, 
  Loader2,
  ShoppingCart,
  AlertCircle,
} from 'lucide-react'
import { motion } from 'framer-motion'
import {
  useIsRegistered,
  useTokenBalances,
  useLandPrices,
  useBotPrices,
  useWaterPrices,
  useBuyLand,
  useBuyBot,
  useBuyWater,
  formatTokenAmount,
} from '@hooks/useContracts'
import { showSuccessToast, showErrorToast } from '@stores/uiStore'

type TabType = 'bots' | 'lands' | 'water'
type SortType = 'price-low' | 'price-high' | 'popular'

interface Asset {
  id: string
  assetType: 'bot' | 'land' | 'water'
  variant: string
  name: string
  price: bigint
  contractType: number // 0, 1, or 2 for contract enum
  description: string
  stats?: any
  imageUrl?: string
  available: boolean
  popularity: number
}

export default function MarketplacePage() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabType>('lands')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortType>('popular')
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Check registration
  const { isRegistered, isLoading: isCheckingRegistration } = useIsRegistered()
  
  // Get user's token balance
  const { orangeBalance, isLoading: isLoadingBalance } = useTokenBalances()
  
  // Get prices from contracts
  const landPrices = useLandPrices()
  const botPrices = useBotPrices()
  const waterPrices = useWaterPrices()
  
  // Purchase hooks
  const { buyLand, hash: landHash, isPending: isBuyingLand, error: landError } = useBuyLand()
  const { buyBot, hash: botHash, isPending: isBuyingBot, error: botError } = useBuyBot()
  const { buyWater, hash: waterHash, isPending: isBuyingWater, error: waterError } = useBuyWater()
  
  // Wait for transactions
  const { isLoading: isWaitingLand, isSuccess: landSuccess } = 
    useWaitForTransactionReceipt({ hash: landHash })
  const { isLoading: isWaitingBot, isSuccess: botSuccess } = 
    useWaitForTransactionReceipt({ hash: botHash })
  const { isLoading: isWaitingWater, isSuccess: waterSuccess } = 
    useWaitForTransactionReceipt({ hash: waterHash })
  
  // Create asset list from contract prices
  const contractAssets: Asset[] = useMemo(() => {
    const assets: Asset[] = []
    
    // Land assets
    if (landPrices.small) {
      assets.push({
        id: 'land-small',
        assetType: 'land',
        variant: 'small',
        name: 'Small Land Plot',
        price: landPrices.small,
        contractType: 0,
        description: 'Perfect starter plot for new farmers',
        stats: { capacity: '2 bots', size: 'Small' },
        available: true,
        popularity: 90,
      })
    }
    if (landPrices.medium) {
      assets.push({
        id: 'land-medium',
        assetType: 'land',
        variant: 'medium',
        name: 'Medium Land Plot',
        price: landPrices.medium,
        contractType: 1,
        description: 'Spacious farming area for expansion',
        stats: { capacity: '5 bots', size: 'Medium' },
        available: true,
        popularity: 88,
      })
    }
    if (landPrices.large) {
      assets.push({
        id: 'land-large',
        assetType: 'land',
        variant: 'large',
        name: 'Large Land Plot',
        price: landPrices.large,
        contractType: 2,
        description: 'Massive operation for serious farmers',
        stats: { capacity: '10 bots', size: 'Large' },
        available: true,
        popularity: 75,
      })
    }
    
    // Bot assets
    if (botPrices.basic) {
      assets.push({
        id: 'bot-basic',
        assetType: 'bot',
        variant: 'basic',
        name: 'Basic AI Bot',
        price: botPrices.basic,
        contractType: 0,
        description: 'Entry-level farming automation',
        stats: { efficiency: 'Basic', type: 'Farming Bot' },
        available: true,
        popularity: 85,
      })
    }
    if (botPrices.advanced) {
      assets.push({
        id: 'bot-advanced',
        assetType: 'bot',
        variant: 'advanced',
        name: 'Advanced AI Bot',
        price: botPrices.advanced,
        contractType: 1,
        description: 'Enhanced farming capabilities',
        stats: { efficiency: 'Advanced', type: 'Farming Bot' },
        available: true,
        popularity: 92,
      })
    }
    if (botPrices.elite) {
      assets.push({
        id: 'bot-elite',
        assetType: 'bot',
        variant: 'elite',
        name: 'Elite AI Bot',
        price: botPrices.elite,
        contractType: 2,
        description: 'Maximum efficiency automation',
        stats: { efficiency: 'Elite', type: 'Farming Bot' },
        available: true,
        popularity: 78,
      })
    }
    
    // Water assets
    if (waterPrices.pack10) {
      assets.push({
        id: 'water-pack',
        assetType: 'water',
        variant: 'pack',
        name: 'Water Pack (10 units)',
        price: waterPrices.pack10,
        contractType: 0,
        description: 'Small water supply for daily use',
        stats: { units: '10', type: 'Water' },
        available: true,
        popularity: 95,
      })
    }
    if (waterPrices.barrel50) {
      assets.push({
        id: 'water-barrel',
        assetType: 'water',
        variant: 'barrel',
        name: 'Water Barrel (50 units)',
        price: waterPrices.barrel50,
        contractType: 1,
        description: 'Bulk water supply - best value!',
        stats: { units: '50', type: 'Water' },
        available: true,
        popularity: 87,
      })
    }
    
    return assets
  }, [landPrices, botPrices, waterPrices])

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'lands', label: 'Land Plots', count: contractAssets.filter((a) => a.assetType === 'land').length },
    { id: 'bots', label: 'AI Bots', count: contractAssets.filter((a) => a.assetType === 'bot').length },
    { id: 'water', label: 'Water Supply', count: contractAssets.filter((a) => a.assetType === 'water').length },
  ]

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let filtered = contractAssets.filter((asset) => {
      // Filter by tab
      if (activeTab === 'bots' && asset.assetType !== 'bot') return false
      if (activeTab === 'lands' && asset.assetType !== 'land') return false
      if (activeTab === 'water' && asset.assetType !== 'water') return false

      // Filter by search
      if (
        searchQuery &&
        !asset.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !asset.description.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'price-low') return Number(a.price - b.price)
      if (sortBy === 'price-high') return Number(b.price - a.price)
      if (sortBy === 'popular') return b.popularity - a.popularity
      return 0
    })

    return filtered
  }, [activeTab, searchQuery, sortBy, contractAssets])
  
  // Show success toast after successful purchase
  useEffect(() => {
    if (landSuccess) {
      showSuccessToast('Land Purchased!', 'Your new land has been added to your farm')
      navigate('/farm')
    }
  }, [landSuccess, navigate])
  
  useEffect(() => {
    if (botSuccess) {
      showSuccessToast('Bot Purchased!', 'Your new bot is ready to work')
      navigate('/farm')
    }
  }, [botSuccess, navigate])
  
  useEffect(() => {
    if (waterSuccess) {
      showSuccessToast('Water Purchased!', 'Water tokens added to your balance')
    }
  }, [waterSuccess])
  
  // Show error toast on purchase failure
  useEffect(() => {
    if (landError) {
      showErrorToast('Purchase Failed', landError.message)
    }
  }, [landError])
  
  useEffect(() => {
    if (botError) {
      showErrorToast('Purchase Failed', botError.message)
    }
  }, [botError])
  
  useEffect(() => {
    if (waterError) {
      showErrorToast('Purchase Failed', waterError.message)
    }
  }, [waterError])

  const handlePurchase = (asset: Asset) => {
    // Check if user is registered
    if (!isRegistered) {
      showErrorToast('Registration Required', 'Please register before purchasing assets')
      navigate('/register')
      return
    }
    
    // Check balance
    if (!orangeBalance || orangeBalance < asset.price) {
      showErrorToast('Insufficient Balance', 'You don\'t have enough $ORANGE tokens')
      return
    }
    
    // Execute purchase based on asset type
    if (asset.assetType === 'land') {
      buyLand(asset.contractType as 0 | 1 | 2)
    } else if (asset.assetType === 'bot') {
      buyBot(asset.contractType as 0 | 1 | 2)
    } else if (asset.assetType === 'water') {
      buyWater(asset.contractType as 0 | 1)
    }
  }

  const handleRefresh = () => {
    setIsRefreshing(true)
    // Refetch prices (wagmi automatically handles this)
    setTimeout(() => {
      setIsRefreshing(false)
      showSuccessToast('Refreshed', 'Latest prices loaded')
    }, 1000)
  }
  
  const isPurchasing = isBuyingLand || isBuyingBot || isBuyingWater
  const isWaiting = isWaitingLand || isWaitingBot || isWaitingWater

  return (
    <div className="space-y-8">
      {/* Not Connected Banner */}
      {!isConnected && (
        <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">👋 Connect to Browse Marketplace</h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                Connect your wallet to view prices and purchase assets for your farm.
              </p>
            </div>
            <ConnectButton />
          </div>
        </div>
      )}

      {/* Not Registered Banner */}
      {isConnected && !isCheckingRegistration && !isRegistered && (
        <div className="card bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">🎉 Register to Purchase</h3>
              <p className="text-lg text-gray-300 mb-5 leading-relaxed">
                Register now to unlock the marketplace and claim your free starter pack!
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
      
      {/* Header */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">Marketplace 🛒</h1>
            <p className="text-base md:text-lg text-gray-400">Purchase NFTs and resources to grow your farming empire</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="glass rounded-2xl px-6 py-4 border-2 border-primary/30">
              <span className="text-sm text-gray-400 block mb-1">Your Balance</span>
              <p className="text-2xl md:text-3xl font-bold text-primary flex items-center gap-2">
                {isLoadingBalance ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <>
                    {formatTokenAmount(orangeBalance || 0n)}
                    <span className="text-xl">$ORANGE</span>
                  </>
                )}
              </p>
            </div>
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-outline p-4"
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Transaction Status */}
      {(isPurchasing || isWaiting) && (
        <div className="card bg-primary/10 border-primary/30">
          <div className="flex items-center gap-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <div>
              <p className="font-bold text-lg">Processing Purchase...</p>
              <p className="text-sm text-gray-400">
                {isPurchasing && 'Waiting for wallet confirmation...'}
                {isWaiting && 'Transaction submitted, waiting for confirmation...'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-dark-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab.label}
            <span
              className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-dark-100 text-gray-400'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="glass rounded-2xl p-6 border-2 border-white/10">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-100 border border-dark-100 rounded-lg text-white placeholder-gray-400 focus:border-primary focus:outline-none"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortType)}
            className="px-4 py-2 bg-dark-100 border border-dark-100 rounded-lg text-white focus:border-primary focus:outline-none"
          >
            <option value="popular">Most Popular</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="btn btn-outline flex items-center gap-2"
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Asset Grid */}
      {contractAssets.length === 0 ? (
        <div className="card">
          <div className="text-center py-16">
            <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-xl text-gray-400 mb-2">Loading marketplace...</p>
            <p className="text-sm text-gray-500">Fetching prices from smart contracts</p>
          </div>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="card">
          <div className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-xl text-gray-400 mb-2">No assets found</p>
            <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
          </div>
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {filteredAssets.map((asset) => (
            <motion.div
              key={asset.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <div className="glass rounded-2xl p-6 border-2 border-white/10 hover:border-primary/50 transition-all duration-300 h-full flex flex-col">
                {/* Asset Icon */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-5xl">
                    {asset.assetType === 'land' && '🏞️'}
                    {asset.assetType === 'bot' && '🤖'}
                    {asset.assetType === 'water' && '💧'}
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{asset.name}</h3>
                  <p className="text-gray-400 text-sm">{asset.description}</p>
                </div>

                {/* Stats */}
                {asset.stats && (
                  <div className="glass rounded-xl p-4 mb-6">
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(asset.stats).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-xs text-gray-400 capitalize">{key}</p>
                          <p className="text-sm font-bold">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price & Purchase */}
                <div className="mt-auto space-y-4">
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl font-bold text-primary">
                      {formatTokenAmount(asset.price)}
                    </span>
                    <span className="text-lg text-gray-400">$ORANGE</span>
                  </div>

                  <button
                    onClick={() => handlePurchase(asset)}
                    disabled={!isConnected || !isRegistered || !orangeBalance || orangeBalance < asset.price || isPurchasing || isWaiting}
                    className={`w-full btn py-3 text-lg font-bold ${
                      orangeBalance && orangeBalance >= asset.price
                        ? 'btn-primary'
                        : 'btn-outline opacity-50 cursor-not-allowed'
                    }`}
                  >
                    {!isConnected ? (
                      'Connect Wallet'
                    ) : !isRegistered ? (
                      'Register First'
                    ) : !orangeBalance || orangeBalance < asset.price ? (
                      <>
                        <AlertCircle className="h-5 w-5 mr-2" />
                        Insufficient Balance
                      </>
                    ) : isPurchasing || isWaiting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <ShoppingCart className="h-5 w-5 mr-2" />
                        Purchase Now
                      </>
                    )}
                  </button>

                  {orangeBalance && orangeBalance < asset.price && orangeBalance > 0n && (
                    <p className="text-xs text-center text-red-400">
                      Need {formatTokenAmount(asset.price - orangeBalance)} more $ORANGE
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
