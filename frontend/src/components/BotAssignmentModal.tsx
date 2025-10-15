import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bot, CheckCircle, Loader2, Zap, TrendingUp } from 'lucide-react'
import { useAddBotToLand, useRemoveBotFromLand, useBotData, useUserBots } from '@/hooks/useContracts'
import { useWaitForTransactionReceipt } from 'wagmi'
import toast from 'react-hot-toast'

interface BotAssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  landId: bigint
  assignedBotIds: bigint[]
  onSuccess?: () => void
}

export default function BotAssignmentModal({
  isOpen,
  onClose,
  landId,
  assignedBotIds,
  onSuccess,
}: BotAssignmentModalProps) {
  const [selectedBotId, setSelectedBotId] = useState<bigint | null>(null)
  const [mode, setMode] = useState<'assign' | 'unassign'>('assign')

  // Get user's bots
  const { botIds, isLoading: isLoadingBots } = useUserBots()

  // Bot assignment hooks
  const {
    addBotToLand,
    hash: assignHash,
    isPending: isAssigning,
    error: assignError,
  } = useAddBotToLand()

  const {
    removeBotFromLand,
    hash: unassignHash,
    isPending: isUnassigning,
    error: unassignError,
  } = useRemoveBotFromLand()

  // Wait for transactions
  const { isLoading: isWaitingAssign, isSuccess: assignTxSuccess } = useWaitForTransactionReceipt({
    hash: assignHash,
  })

  const { isLoading: isWaitingUnassign, isSuccess: unassignTxSuccess } =
    useWaitForTransactionReceipt({
      hash: unassignHash,
    })

  // Handle successful assignment
  useEffect(() => {
    if (assignTxSuccess) {
      toast.success('Bot assigned successfully!')
      onSuccess?.()
      setTimeout(onClose, 1500)
    }
  }, [assignTxSuccess, onSuccess, onClose])

  // Handle successful unassignment
  useEffect(() => {
    if (unassignTxSuccess) {
      toast.success('Bot unassigned successfully!')
      onSuccess?.()
      setTimeout(onClose, 1500)
    }
  }, [unassignTxSuccess, onSuccess, onClose])

  // Handle errors
  useEffect(() => {
    if (assignError) {
      toast.error('Failed to assign bot')
      console.error('Assignment error:', assignError)
    }
    if (unassignError) {
      toast.error('Failed to unassign bot')
      console.error('Unassignment error:', unassignError)
    }
  }, [assignError, unassignError])

  const handleAssign = () => {
    if (!selectedBotId) {
      toast.error('Please select a bot')
      return
    }
    addBotToLand(landId, selectedBotId)
  }

  const handleUnassign = () => {
    if (!selectedBotId) {
      toast.error('Please select a bot to remove')
      return
    }
    removeBotFromLand(landId, selectedBotId)
  }

  // Filter available bots (not assigned to this land)
  const availableBots = botIds?.filter((id) => !assignedBotIds.includes(id)) || []

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="glass rounded-2xl border-2 border-white/10 p-6 m-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <Bot className="h-6 w-6 text-blue-400" />
                    Manage Bots
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    Land #{landId.toString()}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mode Toggle */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => {
                    setMode('assign')
                    setSelectedBotId(null)
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    mode === 'assign'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'glass text-gray-400 hover:text-white'
                  }`}
                >
                  Assign Bot
                </button>
                <button
                  onClick={() => {
                    setMode('unassign')
                    setSelectedBotId(null)
                  }}
                  className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                    mode === 'unassign'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                      : 'glass text-gray-400 hover:text-white'
                  }`}
                >
                  Unassign Bot
                </button>
              </div>

              {/* Bot List */}
              <div className="space-y-3 mb-6">
                {isLoadingBots ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
                  </div>
                ) : mode === 'assign' ? (
                  availableBots.length === 0 ? (
                    <div className="text-center py-12 glass rounded-xl">
                      <Bot className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p className="text-gray-400">No available bots</p>
                      <p className="text-sm text-gray-500 mt-1">
                        All your bots are already assigned
                      </p>
                    </div>
                  ) : (
                    availableBots.map((botId) => (
                      <BotCard
                        key={botId.toString()}
                        botId={botId}
                        isSelected={selectedBotId === botId}
                        onClick={() => setSelectedBotId(botId)}
                      />
                    ))
                  )
                ) : assignedBotIds.length === 0 ? (
                  <div className="text-center py-12 glass rounded-xl">
                    <Bot className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-400">No bots assigned</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Assign a bot to this land first
                    </p>
                  </div>
                ) : (
                  assignedBotIds.map((botId) => (
                    <BotCard
                      key={botId.toString()}
                      botId={botId}
                      isSelected={selectedBotId === botId}
                      onClick={() => setSelectedBotId(botId)}
                    />
                  ))
                )}
              </div>

              {/* Action Button */}
              {((mode === 'assign' && availableBots.length > 0) ||
                (mode === 'unassign' && assignedBotIds.length > 0)) && (
                <button
                  onClick={mode === 'assign' ? handleAssign : handleUnassign}
                  disabled={
                    !selectedBotId ||
                    isAssigning ||
                    isUnassigning ||
                    isWaitingAssign ||
                    isWaitingUnassign
                  }
                  className="w-full btn btn-primary text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAssigning || isUnassigning || isWaitingAssign || isWaitingUnassign ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      {mode === 'assign' ? 'Assigning...' : 'Unassigning...'}
                    </>
                  ) : (
                    <>{mode === 'assign' ? 'Assign Bot' : 'Unassign Bot'}</>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Bot Card Component
function BotCard({
  botId,
  isSelected,
  onClick,
}: {
  botId: bigint
  isSelected: boolean
  onClick: () => void
}) {
  const { botType, efficiency, totalHarvests, isLoading } = useBotData(botId)

  if (isLoading) {
    return (
      <div className="glass rounded-xl p-4 animate-pulse">
        <div className="h-20 bg-white/5 rounded"></div>
      </div>
    )
  }

  const botTypeNames = ['Basic', 'Advanced', 'Elite']
  const botTypeName = botType !== undefined ? botTypeNames[botType] : 'Unknown'
  const efficiencyPercent = efficiency ? Number(efficiency) : 0

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full glass rounded-xl p-4 transition-all ${
        isSelected
          ? 'ring-2 ring-blue-400 bg-blue-500/10'
          : 'hover:bg-white/5'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              botType === 0
                ? 'bg-green-500/20'
                : botType === 1
                ? 'bg-blue-500/20'
                : 'bg-purple-500/20'
            }`}
          >
            <Bot
              className={`h-7 w-7 ${
                botType === 0
                  ? 'text-green-400'
                  : botType === 1
                  ? 'text-blue-400'
                  : 'text-purple-400'
              }`}
            />
          </div>

          <div className="text-left">
            <div className="flex items-center gap-2">
              <p className="font-bold text-white">Bot #{botId.toString()}</p>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  botType === 0
                    ? 'bg-green-500/20 text-green-400'
                    : botType === 1
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}
              >
                {botTypeName}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-400">
              <span className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                {efficiencyPercent}% Efficiency
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {totalHarvests ? Number(totalHarvests) : 0} Harvests
              </span>
            </div>
          </div>
        </div>

        {isSelected && (
          <CheckCircle className="h-6 w-6 text-blue-400" />
        )}
      </div>
    </motion.button>
  )
}
