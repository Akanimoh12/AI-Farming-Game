import { useAccount } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Menu, Bell, Settings } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, Tooltip, NetworkSwitcher } from '@components/common'
import { useUserStore } from '@stores/userStore'
import { useUIStore } from '@stores/uiStore'

export function Header() {
  const { address } = useAccount()
  const { profile } = useUserStore()
  const { toggleSidebar, isSidebarOpen } = useUIStore()
  const [showNotifications, setShowNotifications] = useState(false)

  // Mock balances - replace with actual contract reads
  const orangeBalance = profile?.totalEarnings || '0'
  const waterBalance = '100' // TODO: Get from contract

  return (
    <header className="sticky top-0 z-40 bg-dark-200/80 backdrop-blur-md border-b border-dark-100">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        {/* Left section: Logo and mobile menu */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 text-gray-400 hover:text-white transition-colors"
            aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isSidebarOpen}
          >
            <Menu className="h-6 w-6" />
          </button>

          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl" aria-hidden="true">
              🍊
            </span>
            <h1 className="text-xl font-display font-bold text-gradient hidden sm:block">
              Orange Farm
            </h1>
          </Link>
        </div>

        {/* Center section: Balances (desktop only) */}
        {address && (
          <div className="hidden md:flex items-center gap-4">
            <Tooltip content="Total Oranges Harvested">
              <div className="flex items-center gap-2 px-4 py-2 bg-dark-100 rounded-lg">
                <span className="text-xl" aria-hidden="true">
                  🍊
                </span>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">Oranges</span>
                  <span className="text-sm font-bold text-primary">{orangeBalance}</span>
                </div>
              </div>
            </Tooltip>

            <Tooltip content="MockOrangeDAO Token Balance">
              <div className="flex items-center gap-2 px-4 py-2 bg-dark-100 rounded-lg">
                <span className="text-xl" aria-hidden="true">
                  💰
                </span>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">Tokens</span>
                  <span className="text-sm font-bold text-secondary">
                    {profile?.totalHarvests || 0}
                  </span>
                </div>
              </div>
            </Tooltip>

            <Tooltip content="Water Units Available">
              <div className="flex items-center gap-2 px-4 py-2 bg-dark-100 rounded-lg">
                <span className="text-xl" aria-hidden="true">
                  💧
                </span>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-400">Water</span>
                  <span className="text-sm font-bold text-blue-400">{waterBalance}</span>
                </div>
              </div>
            </Tooltip>
          </div>
        )}

        {/* Right section: Actions and wallet */}
        <div className="flex items-center gap-2">
          {/* Network Switcher */}
          <NetworkSwitcher />
          
          {address && (
            <>
              {/* Notifications */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<Bell />}
                  onClick={() => setShowNotifications(!showNotifications)}
                  aria-label="Notifications"
                >
                  <span className="sr-only">Notifications</span>
                </Button>
                {/* Notification badge */}
                <span className="absolute top-1 right-1 h-2 w-2 bg-primary rounded-full animate-pulse" />

                {/* Notifications dropdown */}
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 glass rounded-lg shadow-xl border border-white/10 p-4">
                    <h3 className="font-semibold mb-2">Notifications</h3>
                    <div className="space-y-2 text-sm text-gray-400">
                      <p>Harvest ready in 5 minutes!</p>
                      <p>Daily mint available</p>
                      <p>You moved up 3 ranks on the leaderboard</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings */}
              <Link to="/settings">
                <Button variant="ghost" size="sm" icon={<Settings />} aria-label="Settings">
                  <span className="sr-only">Settings</span>
                </Button>
              </Link>
            </>
          )}

          {/* Wallet Connect Button */}
          <div className="flex items-center">
            <ConnectButton
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
              showBalance={{
                smallScreen: false,
                largeScreen: true,
              }}
            />
          </div>
        </div>
      </div>
    </header>
  )
}
