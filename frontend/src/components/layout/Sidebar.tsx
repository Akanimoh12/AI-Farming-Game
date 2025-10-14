import { Link, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, Trophy, TrendingUp, User, Settings, LogOut } from 'lucide-react'
import { useAuth } from '@hooks/useAuth'
import { useUIStore } from '@stores/uiStore'
import { useUserStore } from '@stores/userStore'
import { motion } from 'framer-motion'

const navigation = [
  { name: 'Farm', href: '/farm', icon: Home },
  { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  { name: 'Forecast', href: '/forecast', icon: TrendingUp },
  { name: 'Profile', href: '/profile', icon: User },
]

export function Sidebar() {
  const location = useLocation()
  const { logout } = useAuth()
  const { isSidebarOpen } = useUIStore()
  const { profile } = useUserStore()

  if (!isSidebarOpen) {
    return null
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-64 flex-col bg-dark-200 border-r border-dark-100">
        {/* Logo */}
        <div className="flex h-16 items-center justify-center border-b border-dark-100">
          <Link to="/dashboard" className="flex items-center gap-2">
            <span className="text-3xl" aria-hidden="true">
              🍊
            </span>
            <h1 className="text-xl font-display font-bold text-gradient">Orange Farm</h1>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-gray-400 hover:bg-dark-100 hover:text-white'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon
                  className={`h-5 w-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-white' : 'text-gray-400'
                  }`}
                />
                <span className="font-medium">{item.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className="ml-auto h-2 w-2 bg-white rounded-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* User Profile Section */}
        {profile && (
          <div className="border-t border-dark-100 p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold">
                {profile.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {profile.username || 'Farmer'}
                </p>
                <p className="text-xs text-gray-400">Level {profile.level || 1}</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
              <div className="bg-dark-100 rounded-lg p-2">
                <p className="text-gray-400">Harvests</p>
                <p className="font-bold text-white">{profile.totalHarvests || 0}</p>
              </div>
              <div className="bg-dark-100 rounded-lg p-2">
                <p className="text-gray-400">Earnings</p>
                <p className="font-bold text-primary">{profile.totalEarnings || '0'}</p>
              </div>
            </div>

            {/* Settings and Logout */}
            <div className="space-y-1">
              <Link
                to="/settings"
                className="flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-dark-100 hover:text-white rounded-lg transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span className="text-sm">Settings</span>
              </Link>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-4 py-2 text-gray-400 hover:bg-dark-100 hover:text-white rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Mobile Overlay */}
      <div className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm" />
    </>
  )
}
