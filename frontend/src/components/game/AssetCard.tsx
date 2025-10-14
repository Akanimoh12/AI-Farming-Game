import { useState } from 'react'
import { ShoppingCart, Info } from 'lucide-react'
import { Card, Button, Modal, ModalFooter, Tooltip } from '@components/common'

export type AssetType = 'land' | 'bot' | 'water'

export interface AssetCardProps {
  assetType: AssetType
  variant: string
  name: string
  price: number
  description: string
  stats?: {
    capacity?: number
    harvestRate?: number
    waterConsumption?: number
    units?: number
  }
  imageUrl?: string
  available: boolean
  onPurchase: (assetType: AssetType, variant: string, price: number) => void | Promise<void>
  userBalance: number
}

const assetEmojis: Record<AssetType, string> = {
  land: '🏞️',
  bot: '🤖',
  water: '💧',
}

export function AssetCard({
  assetType,
  variant,
  name,
  price,
  description,
  stats,
  imageUrl,
  available,
  onPurchase,
  userBalance,
}: Readonly<AssetCardProps>) {
  const [showModal, setShowModal] = useState(false)
  const [isPurchasing, setIsPurchasing] = useState(false)

  const canAfford = userBalance >= price
  const emoji = assetEmojis[assetType]

  const getButtonText = () => {
    if (!available) return 'Coming Soon'
    if (!canAfford) return 'Insufficient Balance'
    return 'Buy Now'
  }

  const handlePurchaseClick = () => {
    setShowModal(true)
  }

  const handleConfirmPurchase = async () => {
    setIsPurchasing(true)
    try {
      await Promise.resolve(onPurchase(assetType, variant, price))
      setShowModal(false)
    } catch (error) {
      console.error('Purchase failed:', error)
    } finally {
      setIsPurchasing(false)
    }
  }

  return (
    <>
      <Card variant="glass" hover padding="none">
        {/* Image/Preview */}
        <div className="relative h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          {imageUrl ? (
            <img src={imageUrl} alt={name} className="object-cover w-full h-full" />
          ) : (
            <span className="text-6xl" aria-hidden="true">
              {emoji}
            </span>
          )}
          {!available && (
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
              <span className="text-white font-bold">Coming Soon</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between mb-2">
              <h3 className="text-xl font-display font-bold text-white">{name}</h3>
              <Tooltip content="View details">
                <button className="text-gray-400 hover:text-white transition-colors">
                  <Info className="h-5 w-5" />
                </button>
              </Tooltip>
            </div>
            <p className="text-sm text-gray-400">{description}</p>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 gap-2 text-sm">
              {stats.capacity !== undefined && (
                <div className="bg-dark-100 rounded-lg p-2">
                  <p className="text-gray-400 text-xs">Capacity</p>
                  <p className="font-bold text-white">{stats.capacity} bots</p>
                </div>
              )}
              {stats.harvestRate !== undefined && (
                <div className="bg-dark-100 rounded-lg p-2">
                  <p className="text-gray-400 text-xs">Harvest Rate</p>
                  <p className="font-bold text-primary">{stats.harvestRate} 🍊/10min</p>
                </div>
              )}
              {stats.waterConsumption !== undefined && (
                <div className="bg-dark-100 rounded-lg p-2">
                  <p className="text-gray-400 text-xs">Water Cost</p>
                  <p className="font-bold text-blue-400">{stats.waterConsumption} 💧/cycle</p>
                </div>
              )}
              {stats.units !== undefined && (
                <div className="bg-dark-100 rounded-lg p-2">
                  <p className="text-gray-400 text-xs">Units</p>
                  <p className="font-bold text-white">{stats.units}</p>
                </div>
              )}
            </div>
          )}

          {/* Price and Purchase */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Price</p>
                <p className="text-2xl font-bold text-primary">{price} 💰</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Your Balance</p>
                <p className="text-sm font-bold text-white">{userBalance} 💰</p>
              </div>
            </div>

            <Button
              variant={canAfford ? 'primary' : 'outline'}
              fullWidth
              disabled={!available || !canAfford}
              onClick={handlePurchaseClick}
              icon={<ShoppingCart />}
            >
              {getButtonText()}
            </Button>
          </div>
        </div>
      </Card>

      {/* Purchase Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Confirm Purchase"
        description={`Review your purchase of ${name}`}
      >
        <div className="space-y-6">
          {/* Asset Preview */}
          <div className="flex items-center gap-4 p-4 bg-dark-100 rounded-lg">
            <span className="text-4xl" aria-hidden="true">
              {emoji}
            </span>
            <div className="flex-1">
              <h4 className="font-bold text-white">{name}</h4>
              <p className="text-sm text-gray-400">{description}</p>
            </div>
          </div>

          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Asset Price</span>
              <span className="text-white font-medium">{price} 💰</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Transaction Fee</span>
              <span className="text-white font-medium">~0.01 STT</span>
            </div>
            <div className="border-t border-white/10 pt-2 flex justify-between">
              <span className="font-bold text-white">Total</span>
              <span className="font-bold text-primary text-lg">{price} 💰</span>
            </div>
          </div>

          {/* Balance Check */}
          <div className="flex items-center justify-between p-3 bg-dark-100 rounded-lg">
            <span className="text-sm text-gray-400">Current Balance</span>
            <span className={`font-bold ${canAfford ? 'text-green-400' : 'text-red-400'}`}>
              {userBalance} 💰
            </span>
          </div>

          {!canAfford && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-sm text-red-400">
                Insufficient balance. You need {price - userBalance} more tokens.
              </p>
            </div>
          )}

          {/* Stats Reminder */}
          {stats && (
            <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <p className="text-sm text-gray-300">
                {stats.harvestRate &&
                  `This bot will harvest ${stats.harvestRate} oranges every 10 minutes. `}
                {stats.capacity && `This land can hold up to ${stats.capacity} bots. `}
                {stats.units && `This pack contains ${stats.units} water units.`}
              </p>
            </div>
          )}
        </div>

        <ModalFooter>
          <Button variant="ghost" onClick={() => setShowModal(false)} disabled={isPurchasing}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirmPurchase}
            loading={isPurchasing}
            disabled={!canAfford || isPurchasing}
          >
            {isPurchasing ? 'Processing...' : 'Confirm Purchase'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
