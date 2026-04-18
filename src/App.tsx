import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import ProjectView from './pages/ProjectView'
import SceneOutline from './pages/SceneOutline'

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <SignIn />

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/project/:projectId" element={<ProjectView />} />
      <Route path="/project/:projectId/scene/:sceneId" element={<SceneOutline />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
