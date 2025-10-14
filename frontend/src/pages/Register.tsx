import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAccount, useWaitForTransactionReceipt } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Sprout, UserPlus, Gift, Loader2, CheckCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import { useRegisterPlayer, useClaimStarterPack, useIsRegistered } from '@hooks/useContracts'
import { toast } from 'sonner'

export default function RegisterPage() {
  const navigate = useNavigate()
  const { isConnected } = useAccount()
  const { isRegistered } = useIsRegistered()

  const [username, setUsername] = useState('')
  const [referralCode, setReferralCode] = useState('')
  const [step, setStep] = useState<'register' | 'claim' | 'complete'>('register')

  const { register, hash: registerHash, isPending: isRegistering } = useRegisterPlayer()
  const { claim, hash: claimHash, isPending: isClaiming } = useClaimStarterPack()

  // Wait for registration transaction
  const { isLoading: isWaitingRegister, isSuccess: isRegisterConfirmed } = useWaitForTransactionReceipt({
    hash: registerHash,
  })

  // Wait for claim transaction
  const { isLoading: isWaitingClaim, isSuccess: isClaimConfirmed } = useWaitForTransactionReceipt({
    hash: claimHash,
  })

  // Redirect if already registered
  if (isRegistered) {
    navigate('/dashboard')
    return null
  }

  // Handle registration
  const handleRegister = async () => {
    if (!username.trim()) {
      toast.error('Please enter a username')
      return
    }

    if (username.length < 3 || username.length > 20) {
      toast.error('Username must be 3-20 characters')
      return
    }

    try {
      register(username.trim(), referralCode.trim())
      toast.success('Registration transaction submitted!')
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('Failed to register. Please try again.')
    }
  }

  // Handle claim starter pack
  const handleClaim = async () => {
    try {
      claim()
      toast.success('Claiming starter pack...')
    } catch (error) {
      console.error('Claim error:', error)
      toast.error('Failed to claim starter pack')
    }
  }

  // Auto-advance to claim step when registration confirms
  if (isRegisterConfirmed && step === 'register') {
    setStep('claim')
    toast.success('Registration confirmed! 🎉')
  }

  // Auto-advance to complete when claim confirms
  if (isClaimConfirmed && step === 'claim') {
    setStep('complete')
    toast.success('Starter pack claimed! 🎁')
    // Redirect after 3 seconds
    setTimeout(() => navigate('/dashboard'), 3000)
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

              {/* Register Button */}
              <button
                onClick={handleRegister}
                disabled={isRegistering || isWaitingRegister || !username.trim()}
                className="w-full btn btn-primary py-5 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRegistering || isWaitingRegister ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {isRegistering ? 'Submitting...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    Create Account
                  </>
                )}
              </button>

              {/* Transaction Hash */}
              {registerHash && (
                <div className="text-center">
                  <a
                    href={`https://explorer.somnia.network/tx/${registerHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary/80 underline"
                  >
                    View Transaction
                  </a>
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

              <button
                onClick={handleClaim}
                disabled={isClaiming || isWaitingClaim}
                className="w-full btn btn-primary py-5 text-xl disabled:opacity-50"
              >
                {isClaiming || isWaitingClaim ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    {isClaiming ? 'Claiming...' : 'Confirming...'}
                  </>
                ) : (
                  <>
                    <Gift className="w-5 h-5 mr-2" />
                    Claim Free Starter Pack
                  </>
                )}
              </button>

              {claimHash && (
                <div className="text-center">
                  <a
                    href={`https://explorer.somnia.network/tx/${claimHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:text-primary/80 underline"
                  >
                    View Transaction
                  </a>
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
              onClick={() => navigate('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        )}
      </motion.div>
    </div>
  )
}
