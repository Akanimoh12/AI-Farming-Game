import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { 
  Menu, 
  Home, 
  Sprout,
  ShoppingBag, 
  Package, 
  Trophy,
  User,
  Settings, 
  LogOut 
} from 'lucide-react'
import { useUIStore } from '@stores/uiStore'
import { useAuth } from '@hooks/useAuth'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const { isSidebarOpen, toggleSidebar } = useUIStore()
  const { logout } = useAuth()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Farm', href: '/farm', icon: Sprout },
    { name: 'Marketplace', href: '/marketplace', icon: ShoppingBag },
    { name: 'Inventory', href: '/inventory', icon: Package },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
    { name: 'Profile', href: '/profile', icon: User },
  ]

  return (
    <div className="min-h-screen bg-dark-300">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 xl:w-80 bg-dark-200 border-r-2 border-dark-100 transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-6 border-b-2 border-dark-100">
            <h1 className="text-2xl xl:text-3xl font-display font-bold text-gradient">🍊 Orange Farm</h1>
            <button onClick={toggleSidebar} className="lg:hidden">
              <Menu className="h-7 w-7" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-5 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center space-x-4 px-5 py-4 rounded-xl text-base xl:text-lg font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-primary text-white shadow-lg scale-105'
                      : 'text-gray-300 hover:bg-dark-100 hover:text-white hover:scale-102'
                  }`}
                >
                  <Icon className="h-6 w-6 xl:h-7 xl:w-7 flex-shrink-0" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-5 space-y-2 border-t-2 border-dark-100">
            <Link
              to="/settings"
              className="flex items-center space-x-4 px-5 py-4 rounded-xl text-base xl:text-lg font-medium text-gray-300 hover:bg-dark-100 hover:text-white transition-all duration-200"
            >
              <Settings className="h-6 w-6 xl:h-7 xl:w-7 flex-shrink-0" />
              <span>Settings</span>
            </Link>
            <button
              onClick={logout}
              className="w-full flex items-center space-x-4 px-5 py-4 rounded-xl text-base xl:text-lg font-medium text-gray-300 hover:bg-dark-100 hover:text-white transition-all duration-200"
            >
              <LogOut className="h-6 w-6 xl:h-7 xl:w-7 flex-shrink-0" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 lg:ml-72 xl:ml-80`}
      >
        {/* Header */}
        <header className="bg-dark-200 border-b-2 border-dark-100 sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button onClick={toggleSidebar} className="lg:hidden">
              <Menu className="h-7 w-7" />
            </button>
            <div className="flex-1" />
            <ConnectButton />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 md:p-8 xl:p-10">{children}</main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  )
}
