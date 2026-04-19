import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import ThemeToggle from './components/ThemeToggle'
import SignIn from './pages/SignIn'
import Dashboard from './pages/Dashboard'
import ProjectView from './pages/ProjectView'
import SceneOutline from './pages/SceneOutline'
import CommunityTheater from './pages/CommunityTheater'
import LiarsPass from './pages/LiarsPass'

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
      <Route path="/project/:projectId/scene/:sceneId/community-theater" element={<CommunityTheater />} />
      <Route path="/project/:projectId/scene/:sceneId/liars-pass" element={<LiarsPass />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <ThemeToggle />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
