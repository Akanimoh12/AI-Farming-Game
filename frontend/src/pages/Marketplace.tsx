import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, RefreshCw } from 'lucide-react'
import { Button, Card } from '@components/common'
import { AssetCard, type AssetType } from '@components/game/AssetCard'
import { showSuccessToast, showErrorToast } from '@stores/uiStore'
import { motion } from 'framer-motion'

type TabType = 'bots' | 'lands' | 'water'
type SortType = 'price-low' | 'price-high' | 'popular'

interface Asset {
  id: string
  assetType: AssetType
  variant: string
  name: string
  price: number
  description: string
  stats?: any
  imageUrl?: string
  available: boolean
  popularity: number
}

// Mock asset data - replace with actual contract/API data
const mockAssets: Asset[] = [
  {
    id: 'bot-basic',
    assetType: 'bot',
    variant: 'basic',
    name: 'Basic Bot',
    price: 10,
    description: 'Entry-level farming automation',
    stats: { harvestRate: 1, waterConsumption: 1 },
    available: true,
    popularity: 85,
  },
  {
    id: 'bot-advanced',
    assetType: 'bot',
    variant: 'advanced',
    name: 'Advanced Bot',
    price: 25,
    description: 'Enhanced farming capabilities',
    stats: { harvestRate: 3, waterConsumption: 2 },
    available: true,
    popularity: 92,
  },
  {
    id: 'bot-elite',
    assetType: 'bot',
    variant: 'elite',
    name: 'Elite Bot',
    price: 50,
    description: 'Maximum efficiency automation',
    stats: { harvestRate: 7, waterConsumption: 4 },
    available: true,
    popularity: 78,
  },
  {
    id: 'land-small',
    assetType: 'land',
    variant: 'small',
    name: 'Small Plot',
    price: 5,
    description: 'Cozy starter farm',
    stats: { capacity: 2 },
    available: true,
    popularity: 90,
  },
  {
    id: 'land-medium',
    assetType: 'land',
    variant: 'medium',
    name: 'Medium Plot',
    price: 15,
    description: 'Spacious farming area',
    stats: { capacity: 5 },
    available: true,
    popularity: 88,
  },
  {
    id: 'land-large',
    assetType: 'land',
    variant: 'large',
    name: 'Large Plot',
    price: 30,
    description: 'Massive farming operation',
    stats: { capacity: 10 },
    available: true,
    popularity: 75,
  },
  {
    id: 'water-pack',
    assetType: 'water',
    variant: 'pack',
    name: 'Water Pack',
    price: 2,
    description: 'Small water supply',
    stats: { units: 10 },
    available: true,
    popularity: 95,
  },
  {
    id: 'water-barrel',
    assetType: 'water',
    variant: 'barrel',
    name: 'Water Barrel',
    price: 8,
    description: 'Bulk water supply (20% discount)',
    stats: { units: 50 },
    available: true,
    popularity: 87,
  },
]

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<TabType>('bots')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortType>('popular')
  const [priceRange] = useState<[number, number]>([0, 100])
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Mock user balance - replace with actual contract read
  const userBalance = 50

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: 'bots', label: 'Bots', count: mockAssets.filter((a) => a.assetType === 'bot').length },
    { id: 'lands', label: 'Lands', count: mockAssets.filter((a) => a.assetType === 'land').length },
    { id: 'water', label: 'Water', count: mockAssets.filter((a) => a.assetType === 'water').length },
  ]

  // Filter and sort assets
  const filteredAssets = useMemo(() => {
    let filtered = mockAssets.filter((asset) => {
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

      // Filter by price range
      if (asset.price < priceRange[0] || asset.price > priceRange[1]) return false

      return true
    })

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price
      if (sortBy === 'price-high') return b.price - a.price
      if (sortBy === 'popular') return b.popularity - a.popularity
      return 0
    })

    return filtered
  }, [activeTab, searchQuery, sortBy, priceRange])

  const handlePurchase = async (assetType: AssetType, variant: string, price: number) => {
    try {
      // Contract interaction placeholder - will be implemented with useContractWrite
      console.log('Purchasing:', { assetType, variant, price })

      // Simulate transaction (replace with actual contract call)
      await new Promise((resolve) => setTimeout(resolve, 2000))

      showSuccessToast('Purchase Successful!', `${variant} has been added to your farm`)

      // Firestore update will be triggered by Cloud Function after on-chain confirmation
      // Navigation to farm page will happen after success
    } catch (error) {
      showErrorToast('Purchase Failed', 'Please try again or contact support')
      throw error
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Fetch latest data from contract (replace with actual contract read)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsRefreshing(false)
    showSuccessToast('Refreshed', 'Marketplace data updated')
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-3">Marketplace 🛒</h1>
          <p className="text-base md:text-lg text-gray-400">Purchase assets to grow your farming empire</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-6 py-3 bg-dark-100 rounded-xl border-2 border-dark-100">
            <span className="text-sm text-gray-400">Your Balance</span>
            <p className="text-xl md:text-2xl font-bold text-primary">{userBalance} 💰</p>
          </div>
          <Button variant="ghost" size="md" icon={<RefreshCw />} onClick={handleRefresh} loading={isRefreshing}>
            <span className="sr-only">Refresh</span>
          </Button>
        </div>
      </div>

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
      <Card padding="md">
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

          {/* Filters Button */}
          <Button variant="outline" icon={<SlidersHorizontal />}>
            Filters
          </Button>
        </div>
      </Card>

      {/* Asset Grid */}
      {filteredAssets.length === 0 ? (
        <Card padding="lg">
          <div className="text-center py-12">
            <p className="text-xl text-gray-400 mb-2">No assets found</p>
            <p className="text-sm text-gray-500">Try adjusting your filters</p>
          </div>
        </Card>
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
            >
              <AssetCard
                {...asset}
                onPurchase={handlePurchase}
                userBalance={userBalance}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
