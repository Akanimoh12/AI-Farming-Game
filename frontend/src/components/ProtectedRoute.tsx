import { Navigate } from 'react-router-dom'
import { useAuth } from '@hooks/useAuth'

interface ProtectedRouteProps {
  children: React.ReactNode
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="spinner h-12 w-12"></div>
      </div>
    )
  }

  if (!user?.isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
