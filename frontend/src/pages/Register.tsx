import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Sprout, UserPlus, Gift, Loader2, CheckCircle, AlertCircle, X, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRegisterPlayer, useClaimStarterPack, useIsRegistered, CONTRACTS } from '@hooks/useContracts'
import { showSuccessToast, showErrorToast } from '@stores/uiStore'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { isConnected, address } = useAccount()
  const { isRegistered, isLoading: isCheckingRegistration } = useIsRegistered()

  // Debug: Log contract configuration on mount
  useEffect(() => {
    console.log('🔧 Registration Page Debug Info:')
    console.log('Wallet connected:', isConnected)
    console.log('Wallet address:', address)
    console.log('GameRegistry contract:', CONTRACTS.gameRegistry)
    console.log('Is registered:', isRegistered)
  }, [isConnected, address, isRegistered])

  const [username, setUsername] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [step, setStep] = useState<'register' | 'claim' | 'complete'>('register')
  const [showCongrats, setShowCongrats] = useState(false)

  const { register, hash: registerHash, isPending: isRegistering, error: registerError } = useRegisterPlayer()
  const { claim, hash: claimHash, isPending: isClaiming, error: claimError } = useClaimStarterPack()

  // Wait for registration transaction
  const { 
    isLoading: isWaitingRegister, 
    isSuccess: isRegisterConfirmed,
    error: registerReceiptError 
  } = useWaitForTransactionReceipt({
    hash: registerHash,
  })

  // Wait for claim transaction
  const { 
    isLoading: isWaitingClaim, 
    isSuccess: isClaimConfirmed,
    error: claimReceiptError 
  } = useWaitForTransactionReceipt({
    hash: claimHash,
  })

  // Redirect if already registered
  useEffect(() => {
    if (isRegistered && !isCheckingRegistration) {
      navigate('/dashboard', { replace: true })
    }
  }, [isRegistered, isCheckingRegistration, navigate])

  // Handle registration errors
  useEffect(() => {
    if (registerError) {
      console.error('Registration error details:', registerError)
      const errorMessage = registerError.message || 'Registration failed'
      
      if (errorMessage.includes('User rejected') || errorMessage.includes('user rejected')) {
        showErrorToast('Transaction Rejected', 'You rejected the transaction')
      } else if (errorMessage.includes('already registered')) {
        showErrorToast('Already Registered', 'This address is already registered')
        navigate('/dashboard', { replace: true })
      } else if (errorMessage.includes('Connector not connected') || errorMessage.includes('connector')) {
        showErrorToast('Wallet Not Connected', 'Please connect your wallet and try again')
      } else if (errorMessage.includes('insufficient funds')) {
        showErrorToast('Insufficient Funds', 'You need more tokens to pay for gas')
      } else {
        showErrorToast('Registration Failed', errorMessage.slice(0, 100))
      }
    }
  }, [registerError, navigate])

  // Handle claim errors
  useEffect(() => {
    if (claimError) {
      const errorMessage = claimError.message || 'Claim failed'
      if (errorMessage.includes('User rejected')) {
        showErrorToast('Transaction Rejected', 'You rejected the transaction')
      } else if (errorMessage.includes('already claimed')) {
        showErrorToast('Already Claimed', 'You have already claimed your starter pack')
        setStep('complete')
      } else {
        showErrorToast('Claim Failed', 'Please try again or check your wallet')
      }
    }
  }, [claimError])

  // Handle transaction receipt errors
  useEffect(() => {
    if (registerReceiptError) {
      showErrorToast('Transaction Failed', 'Registration transaction failed on-chain')
    }
  }, [registerReceiptError])

  useEffect(() => {
    if (claimReceiptError) {
      showErrorToast('Transaction Failed', 'Claim transaction failed on-chain')
    }
  }, [claimReceiptError])

  // Auto-advance to claim step when registration confirms
  useEffect(() => {
    if (isRegisterConfirmed && step === 'register') {
      setStep('claim')
      setShowCongrats(true)
      showSuccessToast('Registration Successful!', '🎉 Welcome to Orange Farm!')
    }
  }, [isRegisterConfirmed, step])

  // Auto-advance to complete when claim confirms
  useEffect(() => {
    if (isClaimConfirmed && step === 'claim') {
      setStep('complete')
      showSuccessToast('Starter Pack Claimed!', '🎁 You received 1 Land, 1 Bot, and 100 Water!')
      // Redirect after 3 seconds
      setTimeout(() => navigate('/dashboard', { replace: true }), 3000)
    }
  }, [isClaimConfirmed, step, navigate])

  // Handle registration
  const handleRegister = () => {
    // Check wallet connection
    if (!isConnected) {
      showErrorToast('Wallet Not Connected', 'Please connect your wallet first')
      return
    }

    if (!username.trim()) {
      showErrorToast('Username Required', 'Please enter a username')
      return
    }

    if (username.length < 3 || username.length > 20) {
      showErrorToast('Invalid Username', 'Username must be 3-20 characters')
      return
    }

    // Validate username (alphanumeric and underscores only)
    if (!/^\w+$/.test(username)) {
      showErrorToast('Invalid Characters', 'Username can only contain letters, numbers, and underscores')
      return
    }

    // Prevent double submission
    if (isRegistering || isWaitingRegister) {
      console.log('Registration already in progress')
      return
    }

    console.log('Attempting to register with username:', username.trim())
    console.log('Referral code:', referralCode.trim() || '(empty)')
    
    // Call register function - this will trigger MetaMask
    register(username.trim(), referralCode.trim())
  }

  // Handle claim starter pack
  const handleClaim = () => {
    try {
      claim()
    } catch (error) {
      console.error('Claim error:', error)
      showErrorToast('Transaction Failed', 'Failed to submit claim transaction')
    }
  }

  // Handle back navigation
  const handleBackToHome = () => {
    if (isRegistered) {
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-dark-300 via-dark-200 to-dark-300 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6">
              <Sprout className="w-10 h-10 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">Welcome to Orange Farm!</h1>
            <p className="text-lg md:text-xl text-gray-400">
              {step === 'register' && 'Create your farmer profile to start'}
              {step === 'claim' && 'Claim your free starter pack'}
              {step === 'complete' && 'All set! Redirecting to your farm...'}
            </p>
          </div>

          {!isConnected ? (
            /* Not Connected */
            <div className="text-center space-y-6">
              <p className="text-lg md:text-xl text-gray-300">Connect your wallet to get started</p>
              <ConnectButton />
            </div>
          ) : step === 'register' ? (
            /* Registration Step */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              {/* Username Input */}
              <div>
                <label className="block text-base md:text-lg font-medium text-gray-300 mb-3">
                  Username <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <UserPlus className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    maxLength={20}
                    disabled={isRegistering || isWaitingRegister}
                    className="w-full pl-14 pr-6 py-4 text-lg bg-dark-100 border-2 border-gray-700 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-50"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">3-20 characters</p>
              </div>

              {/* Referral Code Input */}
              <div>
                <label className="block text-base md:text-lg font-medium text-gray-300 mb-3">
                  Referral Code <span className="text-gray-500">(optional)</span>
                </label>
                <div className="relative">
                  <Gift className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value)}
                    placeholder="Enter referral code"
                    disabled={isRegistering || isWaitingRegister}
                    className="w-full pl-14 pr-6 py-4 text-lg bg-dark-100 border-2 border-gray-700 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors disabled:opacity-50"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">Get bonus rewards with a referral code</p>
              </div>

              {/* Error Display */}
              {registerError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-400">Registration Error</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {registerError.message?.includes('User rejected') 
                        ? 'You rejected the transaction' 
                        : 'Please check your wallet and try again'}
                    </p>
                  </div>
                </div>
              )}

              {/* Register Button */}
              <button
                onClick={handleRegister}
                disabled={isRegistering || isWaitingRegister || !username.trim()}
                className="w-full btn btn-primary py-5 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegistering || isWaitingRegister ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {isRegistering ? 'Awaiting Approval...' : 'Confirming on Blockchain...'}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Account
                  </>
                )}
              </button>

              {/* Transaction Status */}
              {registerHash && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    {isWaitingRegister ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>Transaction pending...</span>
                      </>
                    ) : isRegisterConfirmed ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Transaction confirmed!</span>
                      </>
                    ) : null}
                  </div>
                  <div className="text-center">
                    <a
                      href={`https://explorer.somnia.network/tx/${registerHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/80 underline inline-flex items-center gap-1"
                    >
                      View on Explorer
                    </a>
                  </div>
                </div>
              )}
            </motion.div>
          ) : step === 'claim' ? (
            /* Claim Starter Pack Step */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="bg-dark-100 rounded-xl p-8 border-2 border-primary/30">
                <div className="flex items-center gap-4 mb-6">
                  <Gift className="w-8 h-8 text-primary" />
                  <h3 className="text-2xl md:text-3xl font-bold">Starter Pack Includes:</h3>
                </div>
                <ul className="space-y-4 text-lg text-gray-300">
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-7 h-7 text-green-400 flex-shrink-0" />
                    <span>1x Small Land Plot NFT</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-7 h-7 text-green-400 flex-shrink-0" />
                    <span>1x Basic Bot NFT</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <CheckCircle className="w-7 h-7 text-green-400 flex-shrink-0" />
                    <span>100 Water Tokens</span>
                  </li>
                </ul>
              </div>

              {/* Error Display */}
              {claimError && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-red-400">Claim Error</p>
                    <p className="text-sm text-gray-400 mt-1">
                      {claimError.message?.includes('User rejected') 
                        ? 'You rejected the transaction' 
                        : claimError.message?.includes('already claimed')
                        ? 'Starter pack already claimed'
                        : 'Please check your wallet and try again'}
                    </p>
                  </div>
                </div>
              )}

              <button
                onClick={handleClaim}
                disabled={isClaiming || isWaitingClaim}
                className="w-full btn btn-primary py-5 text-xl disabled:opacity-50"
              >
                {isClaiming || isWaitingClaim ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {isClaiming ? 'Awaiting Approval...' : 'Confirming on Blockchain...'}
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Claim Free Starter Pack
                  </>
                )}
              </button>

              {/* Transaction Status */}
              {claimHash && (
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-400">
                    {isWaitingClaim ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>Transaction pending...</span>
                      </>
                    ) : isClaimConfirmed ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <span className="text-green-400">Claim confirmed!</span>
                      </>
                    ) : null}
                  </div>
                  <div className="text-center">
                    <a
                      href={`https://explorer.somnia.network/tx/${claimHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:text-primary/80 underline inline-flex items-center gap-1"
                    >
                      View on Explorer
                    </a>
                  </div>
                </div>
              )}

              <button
                onClick={() => navigate('/dashboard')}
                className="w-full btn btn-outline py-3"
              >
                Skip for Now
              </button>
            </motion.div>
          ) : (
            /* Complete Step */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-6 py-8"
            >
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">Welcome Aboard, Farmer! 🎉</h2>
                <p className="text-gray-400">
                  Your account is ready. Redirecting to your farm...
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="text-sm text-gray-400">Loading dashboard...</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Back to Home Link */}
        {step === 'register' && (
          <div className="text-center mt-6">
            <button
              onClick={handleBackToHome}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        )}
      </motion.div>

      {/* Congratulations Modal */}
      <AnimatePresence>
        {showCongrats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowCongrats(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="glass rounded-2xl p-8 max-w-md mx-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowCongrats(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Content */}
              <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 mb-2">
                  <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                </div>
                
                <div>
                  <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-400 text-transparent bg-clip-text">
                    🎉 Congratulations! 🎉
                  </h2>
                  <p className="text-xl font-semibold text-white mb-2">
                    Welcome to Orange Farm!
                  </p>
                  <p className="text-gray-400">
                    You've successfully registered and are now part of our farming community.
                  </p>
                </div>

                <div className="bg-dark-100 rounded-xl p-4 border border-primary/20">
                  <p className="text-sm text-gray-300 mb-2">
                    🎁 <span className="font-semibold">Next Step:</span> Claim your free starter pack to begin your farming journey!
                  </p>
                  <ul className="text-sm text-gray-400 space-y-1 text-left">
                    <li>• 1x Small Land Plot NFT</li>
                    <li>• 1x Basic Bot NFT</li>
                    <li>• 100 Water Tokens</li>
                  </ul>
                </div>

                <button
                  onClick={() => setShowCongrats(false)}
                  className="w-full btn btn-primary py-3 text-lg"
                >
                  Continue to Claim
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
