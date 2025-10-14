import { useState, useEffect } from 'react'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { useNavigate } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { 
  Sprout, 
  Bot, 
  Timer, 
  Play, 
  CheckCircle, 
  Loader2,
  AlertCircle,
  TrendingUp,
  Zap,
} from 'lucide-react'
import {
  useIsRegistered,
  useUserLands,
  useUserBots,
  useLandInfo,
  usePendingHarvest,
  useStartHarvest,
  useCompleteHarvest,
  useAssignedBots,
  formatTokenAmount,
} from '@hooks/useContracts'

export default function FarmPage() {
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const [selectedLand, setSelectedLand] = useState<bigint | undefined>()
  
  // Check registration
  const { isRegistered, isLoading: isCheckingRegistration } = useIsRegistered()
  
  // Get user's lands and bots
  const { landIds, isLoading: isLoadingLands, refetch: refetchLands } = useUserLands()
  const { botIds, isLoading: isLoadingBots } = useUserBots()
  
  // Selected land info
  const { 
    owner,
    landType,
    capacity,
    isLoading: isLoadingLandInfo 
  } = useLandInfo(selectedLand)
  
  // Pending harvest for selected land
  const { 
    amount, 
    isReady,
    isLoading: isLoadingPendingHarvest,
    refetch: refetchPendingHarvest 
  } = usePendingHarvest(selectedLand)
  
  // Assigned bots for selected land
  const { 
    botIds: assignedBotIds, 
    isLoading: isLoadingAssignedBots 
  } = useAssignedBots(selectedLand)
  
  // Harvest actions
  const { 
    startHarvest, 
    hash: startHarvestHash,
    isPending: isStartingHarvest,
    error: startHarvestError 
  } = useStartHarvest()
  
  const { 
    completeHarvest, 
    hash: completeHarvestHash,
    isPending: isCompletingHarvest,
    error: completeHarvestError 
  } = useCompleteHarvest()
  
  // Wait for transaction receipts
  const { isLoading: isWaitingStartHarvest, isSuccess: startHarvestSuccess } = 
    useWaitForTransactionReceipt({ hash: startHarvestHash })
  
  const { isLoading: isWaitingCompleteHarvest, isSuccess: completeHarvestSuccess } = 
    useWaitForTransactionReceipt({ hash: completeHarvestHash })
  
  const landInfo = owner ? { owner, landType, capacity, isHarvesting: !isReady, lastHarvestTime: 0n } : null
  
  // Auto-select first land
  useEffect(() => {
    if (landIds && landIds.length > 0 && !selectedLand) {
      setSelectedLand(landIds[0])
    }
  }, [landIds, selectedLand])
  
  // Refetch data after successful transactions
  useEffect(() => {
    if (startHarvestSuccess || completeHarvestSuccess) {
      refetchLands()
      refetchPendingHarvest()
    }
  }, [startHarvestSuccess, completeHarvestSuccess, refetchLands, refetchPendingHarvest])
  
  // Auto-refresh pending harvest every 5 seconds
  useEffect(() => {
    if (!selectedLand) return
    
    const interval = setInterval(() => {
      refetchPendingHarvest()
    }, 5000)
    
    return () => clearInterval(interval)
  }, [selectedLand, refetchPendingHarvest])
  
  // Handle start harvest
  const handleStartHarvest = () => {
    if (!selectedLand || !botIds || botIds.length === 0) return
    // Use first available bot
    startHarvest(selectedLand, botIds[0])
  }
  
  // Handle complete harvest
  const handleCompleteHarvest = () => {
    if (!selectedLand) return
    completeHarvest(selectedLand)
  }
  
  // Get land type name
  const getLandTypeName = (type: number | undefined) => {
    if (type === 0) return 'Basic'
    if (type === 1) return 'Premium'
    if (type === 2) return 'Legendary'
    return 'Unknown'
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl md:text-5xl font-display font-bold">Your Farm 🌾</h1>
          {isConnected && isRegistered && (
            <button 
              onClick={() => navigate('/marketplace')}
              className="btn btn-outline"
            >
              <TrendingUp className="h-5 w-5 mr-2" />
              Buy More Assets
            </button>
          )}
        </div>
        <p className="text-base md:text-lg text-gray-400">
          {isConnected && isRegistered 
            ? 'Manage your lands, deploy bots, and harvest $ORANGE tokens in real-time'
            : 'Connect your wallet and register to start farming'
          }
        </p>
      </div>

      {/* Not Connected */}
      {!isConnected && (
        <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">👋 Connect to Start Farming</h3>
              <p className="text-lg text-gray-300 leading-relaxed">
                Connect your wallet to view and manage your farming operations.
              </p>
            </div>
            <ConnectButton />
          </div>
        </div>
      )}

      {/* Not Registered */}
      {isConnected && !isCheckingRegistration && !isRegistered && (
        <div className="card bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex-1">
              <h3 className="text-2xl md:text-3xl font-bold mb-3">🎉 Register to Get Started</h3>
              <p className="text-lg text-gray-300 mb-5 leading-relaxed">
                Register now to claim your free starter pack: 1 Land NFT, 1 Bot NFT, and 100 Water Tokens!
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

      {/* Farm Content - Only show if registered */}
      {isConnected && isRegistered && (
        <>
          {/* Lands Grid */}
          <div className="card">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-8">Your Land Plots</h2>
            
            {isLoadingLands ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {!landIds || landIds.length === 0 ? (
                  <div className="text-center py-12">
                    <Sprout className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-xl text-gray-400 mb-6">You don't have any land plots yet</p>
                    <button 
                      onClick={() => navigate('/marketplace')}
                      className="btn btn-primary"
                    >
                      Buy Land from Marketplace
                    </button>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {landIds.map((landId: bigint) => {
                      const isSelected = landId === selectedLand
                      return (
                        <button
                          key={landId.toString()}
                          onClick={() => setSelectedLand(landId)}
                          className={`glass rounded-2xl p-6 border-2 transition-all duration-300 text-left ${
                            isSelected 
                              ? 'border-primary bg-primary/10 scale-105 shadow-lg shadow-primary/20' 
                              : 'border-white/10 hover:border-primary/50 hover:scale-102'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-6xl">🌾</span>
                            {isSelected && (
                              <CheckCircle className="h-6 w-6 text-primary" />
                            )}
                          </div>
                          <h3 className="text-xl font-bold mb-2">Land #{landId.toString()}</h3>
                          <p className="text-gray-400 text-sm">Click to manage</p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Selected Land Management */}
          {selectedLand && (
            <>
              {/* Land Details & Harvest Section */}
              <div className="grid lg:grid-cols-2 gap-6">
                {/* Land Info */}
                <div className="card">
                  <h3 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
                    <Sprout className="h-7 w-7 text-green-400" />
                    Land #{selectedLand.toString()}
                  </h3>
                  
                  {isLoadingLandInfo ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="glass rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-2">Land Type</p>
                        <p className="text-xl font-bold text-green-400">
                          {getLandTypeName(landType)}
                        </p>
                      </div>
                      
                      <div className="glass rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-2">Status</p>
                        <p className="text-xl font-bold">
                          {landInfo?.isHarvesting ? (
                            <span className="text-primary flex items-center gap-2">
                              <Timer className="h-5 w-5 animate-pulse" />
                              Harvesting...
                            </span>
                          ) : (
                            <span className="text-gray-400">Idle</span>
                          )}
                        </p>
                      </div>
                      
                      <div className="glass rounded-xl p-4">
                        <p className="text-sm text-gray-400 mb-2">Assigned Bots</p>
                        <p className="text-xl font-bold text-blue-400">
                          {isLoadingAssignedBots ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : (
                            <>
                              {assignedBotIds?.length || 0} Bot
                              {assignedBotIds?.length !== 1 && 's'}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Harvest Panel */}
                <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/30">
                  <h3 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
                    <Zap className="h-7 w-7 text-primary" />
                    Harvest Control
                  </h3>
                  
                  {/* Pending Harvest */}
                  <div className="glass rounded-2xl p-6 mb-6">
                    <p className="text-sm text-gray-400 mb-3">Pending Harvest</p>
                    <div className="flex items-baseline gap-3 mb-4">
                      <span className="text-5xl font-bold text-primary">
                        {isLoadingPendingHarvest ? (
                          <Loader2 className="h-10 w-10 animate-spin" />
                        ) : (
                          formatTokenAmount(amount || 0n)
                        )}
                      </span>
                      <span className="text-2xl text-gray-400">$ORANGE</span>
                    </div>
                    
                    {/* Harvest Status */}
                    {landInfo?.isHarvesting && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-400">Harvest Status</span>
                          <span className={`font-semibold ${isReady ? 'text-green-400' : 'text-yellow-400'}`}>
                            {isReady ? 'Ready' : 'In Progress'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="space-y-4">
                    {!landInfo?.isHarvesting ? (
                      <button
                        onClick={handleStartHarvest}
                        disabled={isStartingHarvest || isWaitingStartHarvest || !landInfo}
                        className="w-full btn btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isStartingHarvest || isWaitingStartHarvest ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Starting Harvest...
                          </>
                        ) : (
                          <>
                            <Play className="h-5 w-5 mr-2" />
                            Start Harvesting
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        onClick={handleCompleteHarvest}
                        disabled={isCompletingHarvest || isWaitingCompleteHarvest || !isReady}
                        className="w-full btn btn-primary py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isCompletingHarvest || isWaitingCompleteHarvest ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            Completing Harvest...
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-5 w-5 mr-2" />
                            Complete Harvest
                          </>
                        )}
                      </button>
                    )}
                    
                    {/* Error Messages */}
                    {(startHarvestError || completeHarvestError) && (
                      <div className="flex items-start gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-400">
                          {(startHarvestError ?? completeHarvestError)?.message ?? 'Transaction failed'}
                        </p>
                      </div>
                    )}
                    
                    {/* Success Messages */}
                    {(startHarvestSuccess || completeHarvestSuccess) && (
                      <div className="flex items-start gap-2 p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                        <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-green-400">
                          {startHarvestSuccess && 'Harvest started successfully!'}
                          {completeHarvestSuccess && 'Harvest completed! Tokens credited to your balance.'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Available Bots */}
              <div className="card">
                <h3 className="text-2xl md:text-3xl font-bold mb-6 flex items-center gap-2">
                  <Bot className="h-7 w-7 text-blue-400" />
                  Your AI Bots
                </h3>
                
                {isLoadingBots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                ) : (
                  <>
                    {!botIds || botIds.length === 0 ? (
                      <div className="text-center py-8">
                        <Bot className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg text-gray-400 mb-4">You don't have any bots yet</p>
                        <button 
                          onClick={() => navigate('/marketplace')}
                          className="btn btn-primary"
                        >
                          Buy Bot from Marketplace
                        </button>
                      </div>
                    ) : (
                      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {botIds.map((botId: bigint) => {
                          const isAssigned = assignedBotIds?.includes(botId)
                          return (
                            <div
                              key={botId.toString()}
                              className={`glass rounded-xl p-4 border-2 ${
                                isAssigned 
                                  ? 'border-blue-400 bg-blue-400/10' 
                                  : 'border-white/10'
                              }`}
                            >
                              <div className="text-center">
                                <Bot className={`h-10 w-10 mx-auto mb-3 ${
                                  isAssigned ? 'text-blue-400' : 'text-gray-400'
                                }`} />
                                <p className="font-bold mb-1">Bot #{botId.toString()}</p>
                                {isAssigned && (
                                  <span className="text-xs text-blue-400 font-semibold">
                                    ● Assigned
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
