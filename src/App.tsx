import { AuthProvider, useAuth } from './context/AuthContext'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
      </div>
    )
  }

  return user ? <Dashboard /> : <SignIn />
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}
