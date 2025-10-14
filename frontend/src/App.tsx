import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import { Toaster } from 'sonner'

import { wagmiConfig } from '@lib/wagmi/config'

// Page imports
import LandingPage from '@pages/Landing'
import RegisterPage from '@pages/Register'
import DashboardPage from '@pages/Dashboard'
import FarmPage from '@pages/Farm'
import MarketplacePage from '@pages/Marketplace'
import InventoryPage from '@pages/Inventory'
import LeaderboardPage from '@pages/Leaderboard'
import ProfilePage from '@pages/Profile'

// Component imports
import Layout from '@components/Layout'

import '@rainbow-me/rainbowkit/styles.css'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      gcTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Semi-protected routes - Can view but need registration to interact */}
      <Route
        path="/dashboard"
        element={
          <Layout>
            <DashboardPage />
          </Layout>
        }
      />
      <Route
        path="/farm"
        element={
          <Layout>
            <FarmPage />
          </Layout>
        }
      />
      <Route
        path="/marketplace"
        element={
          <Layout>
            <MarketplacePage />
          </Layout>
        }
      />
      <Route
        path="/inventory"
        element={
          <Layout>
            <InventoryPage />
          </Layout>
        }
      />
      <Route
        path="/leaderboard"
        element={
          <Layout>
            <LeaderboardPage />
          </Layout>
        }
      />
      <Route
        path="/profile"
        element={
          <Layout>
            <ProfilePage />
          </Layout>
        }
      />

      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#FF6B35',
            accentColorForeground: 'white',
            borderRadius: 'medium',
          })}
        >
          <BrowserRouter>
            <AppRoutes />
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: '#1E293B',
                  border: '1px solid #334155',
                  color: '#fff',
                },
              }}
            />
          </BrowserRouter>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
