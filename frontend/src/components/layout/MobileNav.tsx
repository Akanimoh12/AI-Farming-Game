import { Link, useLocation } from 'react-router-dom'
import { Home, ShoppingBag, Trophy, TrendingUp, User } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { name: 'Farm', href: '/farm', icon: Home },
  { name: 'Market', href: '/marketplace', icon: ShoppingBag },
  { name: 'Ranks', href: '/leaderboard', icon: Trophy },
  { name: 'Forecast', href: '/forecast', icon: TrendingUp },
  { name: 'Profile', href: '/profile', icon: User },
]

export function MobileNav() {
  const location = useLocation()

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-200/95 backdrop-blur-md border-t border-dark-100 safe-area-bottom"
      aria-label="Mobile navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = location.pathname === tab.href

          return (
            <Link
              key={tab.name}
              to={tab.href}
              className={`flex flex-col items-center justify-center flex-1 gap-1 py-2 rounded-lg transition-colors relative ${
                isActive ? 'text-primary' : 'text-gray-400'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="relative">
                <Icon className={`h-5 w-5 ${isActive ? 'text-primary' : 'text-gray-400'}`} />
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveTab"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-1 w-6 bg-primary rounded-full"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span
                className={`text-xs font-medium ${isActive ? 'text-primary' : 'text-gray-400'}`}
              >
                {tab.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
